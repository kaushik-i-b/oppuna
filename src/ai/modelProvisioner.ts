/**
 * Model provisioner — makes the on-device Llama model available in local
 * storage so the mental-health agent can actually run and respond to chat.
 *
 * The agent is powered by a Llama GGUF model served on-device through
 * `llama.rn`. For that the weights must live at
 * `{documentDirectory}models/{storageFilename}`. In a fully-offline app the
 * only safe way to get them there is to *bundle* the model with the app and
 * copy it into local storage on first launch.
 *
 * This module is:
 *   - fully offline — it copies a bundled Expo asset, it never downloads,
 *   - idempotent — it skips the copy when the model is already present,
 *   - safe — it no-ops when no model is bundled, so the app still ships and
 *     the deterministic rule engine is used until a model is supplied.
 */

import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import { LLM_CONFIG } from '@/constants/app';
import { logger } from '@/utils/logger';
import { getModelsDirectory } from '@/ai/modelManager';

export type ProvisionOutcome =
  | 'already-present'
  | 'copied'
  | 'no-bundled-model'
  | 'unsupported-platform'
  | 'failed';

export interface ProvisionResult {
  outcome: ProvisionOutcome;
  /** Absolute local path of the ready-to-load model, when available. */
  modelPath: string | null;
  error?: string;
}

/** Minimal filesystem surface the provisioner needs — injectable for tests. */
export interface ProvisionFileSystem {
  getInfoAsync: (uri: string) => Promise<{ exists: boolean }>;
  makeDirectoryAsync: (uri: string, options?: { intermediates?: boolean }) => Promise<void>;
  copyAsync: (options: { from: string; to: string }) => Promise<void>;
}

export interface ProvisionModelDeps {
  /** Resolves the bundled model module id (from `require`), or null when none. */
  resolveBundledAsset?: () => number | null;
  /** Loads a bundled asset and returns its local file URI. */
  loadAsset?: (moduleId: number) => Promise<{ localUri: string | null }>;
  fileSystem?: ProvisionFileSystem;
  platformOS?: typeof Platform.OS;
}

async function defaultLoadAsset(moduleId: number): Promise<{ localUri: string | null }> {
  const asset = Asset.fromModule(moduleId);
  await asset.downloadAsync();
  return { localUri: asset.localUri ?? asset.uri ?? null };
}

/**
 * Ensure the bundled Llama model is present in local storage.
 *
 * Call this once, before `initializeModelManager`, so the manager's scan finds
 * the freshly-copied model. Never throws — failures are reported in the result
 * and the app continues with the rule-based engine.
 */
export async function provisionBundledModel(
  deps: ProvisionModelDeps = {},
): Promise<ProvisionResult> {
  const platformOS = deps.platformOS ?? Platform.OS;
  if (platformOS === 'web') {
    return { outcome: 'unsupported-platform', modelPath: null };
  }

  const fs: ProvisionFileSystem = deps.fileSystem ?? FileSystem;
  const dir = getModelsDirectory();
  const target = `${dir}${LLM_CONFIG.storageFilename}`;

  try {
    const existing = await fs.getInfoAsync(target);
    if (existing.exists) {
      return { outcome: 'already-present', modelPath: target };
    }

    const resolve = deps.resolveBundledAsset ?? (() => LLM_CONFIG.bundledModelAsset);
    const moduleId = resolve();
    if (moduleId == null) {
      logger.info('No Llama model bundled with the app; using rule-based engine', {
        expectedAt: target,
      });
      return { outcome: 'no-bundled-model', modelPath: null };
    }

    const dirInfo = await fs.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await fs.makeDirectoryAsync(dir, { intermediates: true });
    }

    const loadAsset = deps.loadAsset ?? defaultLoadAsset;
    const { localUri } = await loadAsset(moduleId);
    if (!localUri) {
      return {
        outcome: 'failed',
        modelPath: null,
        error: 'Bundled model asset has no resolvable local URI',
      };
    }

    await fs.copyAsync({ from: localUri, to: target });
    logger.info('Provisioned on-device Llama model from bundled asset', {
      label: LLM_CONFIG.modelLabel,
      target,
    });
    return { outcome: 'copied', modelPath: target };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Model provisioning failed; falling back to rule engine', { error: message });
    return { outcome: 'failed', modelPath: null, error: message };
  }
}
