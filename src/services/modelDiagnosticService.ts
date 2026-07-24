/**
 * Safe, read-only AI / model diagnostics for Settings UI.
 * Never exposes stack traces or secrets.
 */

import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import { getModelState } from '@/ai/modelManager';
import type { AIEngineMode, LocalModelState, LocalModelStatus } from '@/ai/types';
import { getDeviceCapability } from '@/services/deviceCapabilityService';
import { getModelMetadata } from '@/services/modelAssetService';

export interface ModelDiagnosticStatus {
  /** Raw lifecycle status from modelManager. */
  status: LocalModelStatus;
  /** Simplified mode for user-facing copy. */
  engineMode: AIEngineMode;
  /** Short label for Settings → AI Engine. */
  title: string;
  /** Secondary line (privacy / offline reassurance). */
  subtitle: string;
  modelConfigured: string;
  modelDisplayName: string;
  deviceTier: string;
  integrityOk: boolean | null;
  initDurationMs: number | null;
  errorSummary: string | null;
}

const FALLBACK_STATUSES = new Set<LocalModelStatus>([
  'unavailable',
  'unsupported-device',
  'corrupted',
  'failed',
  'fallback-mode',
]);

function isFallbackStatus(status: LocalModelStatus): boolean {
  return FALLBACK_STATUSES.has(status);
}

function sanitizeError(error: string | null): string | null {
  if (!error) return null;
  const firstLine = error.split('\n')[0]?.trim() ?? error;
  if (firstLine.length > 160) return `${firstLine.slice(0, 157)}…`;
  return firstLine;
}

export function deriveEngineMode(state: LocalModelState): AIEngineMode {
  if (state.status === 'ready' || state.status === 'generating') return 'on-device';
  if (
    state.status === 'locating' ||
    state.status === 'verifying' ||
    state.status === 'loading' ||
    state.status === 'uninitialized'
  ) {
    return 'initializing';
  }
  return 'guided-offline';
}

export function getModelDiagnosticStatus(): ModelDiagnosticStatus {
  const state = getModelState();
  const meta = getModelMetadata();
  const capability = getDeviceCapability();
  const engineMode = deriveEngineMode(state);
  const fallback = state.fallbackActive || isFallbackStatus(state.status);

  let title: string;
  let subtitle: string;

  if (engineMode === 'on-device') {
    title = `${LOCAL_MODEL_CONFIG.displayName} — Running on device`;
    subtitle = 'Private • Offline';
  } else if (engineMode === 'initializing') {
    title = 'Preparing on-device AI…';
    subtitle = 'Private • Offline';
  } else {
    title = 'Guided Offline Mode';
    subtitle =
      'The on-device AI model is unavailable on this device. Oppuna will continue using guided offline responses.';
  }

  return {
    status: fallback && state.status !== 'ready' ? 'fallback-mode' : state.status,
    engineMode,
    title,
    subtitle,
    modelConfigured: meta.modelName,
    modelDisplayName: LOCAL_MODEL_CONFIG.displayName,
    deviceTier: state.deviceTier ?? capability.tier,
    integrityOk:
      state.status === 'corrupted' || state.status === 'failed'
        ? false
        : state.status === 'ready'
          ? true
          : null,
    initDurationMs: state.initDurationMs,
    errorSummary: sanitizeError(state.error),
  };
}
