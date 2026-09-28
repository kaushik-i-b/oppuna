import type { TranscriptLine } from '@/voice/types';

/**
 * AssemblyAI `transcript.user.delta` may be cumulative or incremental.
 * Final text always replaces the partial for that turn.
 */
export function mergeTranscriptDelta(current: string, delta: string): string {
  if (!delta.trim()) return current;
  if (!current) return delta.trim();
  if (delta.startsWith(current)) return delta;
  if (current === delta || current.endsWith(delta)) return current;
  if (current.startsWith(delta) && delta.length <= current.length) return current;
  return `${current}${delta}`;
}

export function upsertTranscriptLine(
  lines: TranscriptLine[],
  line: TranscriptLine,
): TranscriptLine[] {
  const index = lines.findIndex((item) => item.id === line.id);
  if (index === -1) return [...lines, line];
  const copy = lines.slice();
  copy[index] = line;
  return copy;
}

export function removeTranscriptLine(lines: TranscriptLine[], id: string): TranscriptLine[] {
  return lines.filter((line) => line.id !== id);
}
