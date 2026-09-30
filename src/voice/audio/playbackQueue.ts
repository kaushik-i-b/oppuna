import { base64ToBytes } from '@/voice/pcm';

export type ChunkDropReason = 'duplicate' | 'stale' | 'empty';

export interface QueuedPcmChunk {
  replyId: string;
  sequence: number;
  base64: string;
  sampleRate: number;
  durationMs: number;
}

export interface EnqueueDecision {
  accepted: boolean;
  reason: 'accepted' | ChunkDropReason;
  replyId: string;
  sequence: number;
  durationMs: number;
  queueLength: number;
}

/**
 * One ordered playback queue. Chunks leave in arrival order.
 * A reply id that has been flushed never plays again.
 */
export function createPcmPlaybackQueue(): {
  beginReply: (replyId: string) => { flushedReplyId: string; dropped: number };
  enqueue: (replyId: string, base64: string, sampleRate: number) => EnqueueDecision;
  flush: (replyId?: string) => { dropped: number; replyId: string };
  pull: () => QueuedPcmChunk | undefined;
  length: () => number;
  activeReplyId: () => string;
} {
  let active = '';
  let sequence = 0;
  const dead = new Set<string>();
  const chunks: QueuedPcmChunk[] = [];

  function durationMs(base64: string, sampleRate: number): number {
    const bytes = base64ToBytes(base64).byteLength;
    const samples = Math.floor(bytes / 2);
    if (sampleRate <= 0) return 0;
    return (samples / sampleRate) * 1000;
  }

  function drop(replyId: string): number {
    if (replyId) dead.add(replyId);
    const kept = chunks.filter((chunk) => chunk.replyId !== replyId);
    const dropped = chunks.length - kept.length;
    chunks.length = 0;
    chunks.push(...kept);
    if (active === replyId) active = '';
    return dropped;
  }

  return {
    beginReply(replyId) {
      if (!replyId) return { flushedReplyId: '', dropped: 0 };
      if (active === replyId) return { flushedReplyId: '', dropped: 0 };
      const flushedReplyId = active;
      const dropped = flushedReplyId ? drop(flushedReplyId) : 0;
      dead.delete(replyId);
      active = replyId;
      sequence = 0;
      return { flushedReplyId, dropped };
    },
    enqueue(replyId, base64, sampleRate) {
      const ms = base64 ? durationMs(base64, sampleRate) : 0;
      if (!replyId || dead.has(replyId) || replyId !== active) {
        return {
          accepted: false,
          reason: 'stale',
          replyId,
          sequence: 0,
          durationMs: ms,
          queueLength: chunks.length,
        };
      }
      if (!base64) {
        return {
          accepted: false,
          reason: 'empty',
          replyId,
          sequence: 0,
          durationMs: 0,
          queueLength: chunks.length,
        };
      }
      sequence += 1;
      chunks.push({ replyId, sequence, base64, sampleRate, durationMs: ms });
      return {
        accepted: true,
        reason: 'accepted',
        replyId,
        sequence,
        durationMs: ms,
        queueLength: chunks.length,
      };
    },
    flush(replyId) {
      if (!replyId) {
        const target = active;
        const dropped = chunks.length;
        chunks.length = 0;
        if (target) dead.add(target);
        active = '';
        return { dropped, replyId: target };
      }
      return { dropped: drop(replyId), replyId };
    },
    pull() {
      return chunks.shift();
    },
    length() {
      return chunks.length;
    },
    activeReplyId() {
      return active;
    },
  };
}
