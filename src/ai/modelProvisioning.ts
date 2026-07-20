/**
 * Model provisioning — stages the on-device mental-health model into local
 * storage so the llama agent can load it.
 *
 * The model manager only *scans* local app storage; it never puts a model
 * there. This module bridges that gap: on first launch (native only) it copies
 * a GGUF model that shipped inside the app bundle into the private models
 * directory the model manager reads from
 * (`{documentDirectory}models/oppuna-model.gguf`).
 *
 * Fully offline. `expo-asset` resolves a bundled asset to a local file URI
 * (unpacking it from the app package on device) — no network access of any
 * kind. When no model is bundled (`BUNDLED_MODEL === null`) this is a safe
 * no-op and the app falls back to guided rule-based responses.
 */

import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import { LLM_CONFIG } from '@/constants/app';
import { logger } from '@/utils/logger';
import { BUNDLED_MODEL } from '@/ai/bundledModel';

const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}${LLM_CONFIG.storageDir}/`;
const TARGET_PATH = `${MODELS_DIR}${LLM_CONFIG.storageFilename}`;

export type ProvisionOutcome =
  | 'staged'
  | 'already-present'
  | 'no-bundled-model'
  | 'unsupported-platform'
  | 'error';

export interface ProvisionResult {
  outcome: ProvisionOutcome;
  /** Resolved local path to the staged model, when one exists. */
  modelPath: string | null;
  error: string | null;
}

let provisionPromise: Promise<ProvisionResult> | null = null;

async function ensureModelsDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

function toUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/**
 * Copy the app-bundled GGUF model into local storage if it isn't already there.
 *
 * Idempotent and safe to call on every launch: it resolves the same promise on
 * repeat calls within a session, and skips the copy when the target file
 * already exists. Never throws — provisioning failures degrade gracefully to
 * guided responses.
 */
export async function provisionBundledModel(): Promise<ProvisionResult> {
  if (provisionPromise) return provisionPromise;

  provisionPromise = (async (): Promise<ProvisionResult> => {
    if (Platform.OS === 'web') {
      return { outcome: 'unsupported-platform', modelPath: null, error: null };
    }

    if (BUNDLED_MODEL == null) {
      return { outcome: 'no-bundled-model', modelPath: null, error: null };
    }

    try {
      const existing = await FileSystem.getInfoAsync(TARGET_PATH);
      if (existing.exists) {
        return { outcome: 'already-present', modelPath: TARGET_PATH, error: null };
      }

      await ensureModelsDirectory();

      const asset = Asset.fromModule(BUNDLED_MODEL);
      await asset.downloadAsync();
      const localUri = asset.localUri ?? asset.uri;
      if (!localUri) {
        throw new Error('Bundled model asset could not be resolved to a local file.');
      }

      await FileSystem.copyAsync({ from: toUri(localUri), to: TARGET_PATH });
      logger.info('Staged bundled on-device model into local storage', {
        target: TARGET_PATH,
      });
      return { outcome: 'staged', modelPath: TARGET_PATH, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn('Failed to stage bundled on-device model; using guided responses', {
        error: message,
      });
      return { outcome: 'error', modelPath: null, error: message };
    }
  })();

  return provisionPromise;
}

/** @internal Reset memoized state for unit tests. */
export function __resetModelProvisioningForTests(): void {
  provisionPromise = null;
}
