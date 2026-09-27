/**
 * Development-only observable voice logging.
 *
 * Emits the event stream judges/developers need:
 * connected, listening, turn detected, transcript finalized, agent response
 * started, tool requested/completed, interruption, reflection generated,
 * memory approved, session ended.
 *
 * Never logs journal/reflection content in production: payloads are dropped
 * outside `__DEV__` and only event names + error strings are kept.
 */

import { logger } from '@/utils/logger';

export type VoiceLogEvent =
  | 'assemblyai:connected'
  | 'assemblyai:disconnected'
  | 'assemblyai:reconnecting'
  | 'voice:listening'
  | 'voice:turn-detected'
  | 'voice:transcript-partial'
  | 'voice:transcript-final'
  | 'voice:agent-response-started'
  | 'voice:agent-response-spoken'
  | 'voice:tool-requested'
  | 'voice:tool-completed'
  | 'voice:interruption'
  | 'voice:reflection-generated'
  | 'voice:memory-approved'
  | 'voice:session-ended'
  | 'voice:error';

const listeners = new Set<(event: VoiceLogEvent, at: number) => void>();

export function onVoiceLogEvent(listener: (event: VoiceLogEvent, at: number) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function logVoiceEvent(event: VoiceLogEvent, context?: Record<string, unknown>): void {
  const at = Date.now();
  for (const listener of listeners) {
    try {
      listener(event, at);
    } catch {
      // Diagnostics must never break the session.
    }
  }
  if (__DEV__) {
    logger.debug(`[voice] ${event}`, context);
  } else {
    // Production: event name only, error string at most — never user content.
    const safe = context?.error ? { error: String(context.error).slice(0, 160) } : undefined;
    if (event === 'voice:error') logger.warn(`[voice] ${event}`, safe);
    else logger.info(`[voice] ${event}`, safe);
  }
}
