import type { ResponseSource } from '@/ai/types';

let lastResponseSource: ResponseSource | null = null;

/** Records the source of the most recent AI response (dev diagnostics). */
export function setLastAIResponseSource(source: ResponseSource): void {
  lastResponseSource = source;
}

/** Returns the source of the most recent AI response, if any. */
export function getLastAIResponseSource(): ResponseSource | null {
  return lastResponseSource;
}

/** @internal Reset for unit tests. */
export function __resetResponseSourceForTests(): void {
  lastResponseSource = null;
}
