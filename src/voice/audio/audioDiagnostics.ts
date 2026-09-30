import { bytesToBase64, createStreamingRateConverter, pcm16Base64ToFloat, VOICE_SAMPLE_RATE } from '@/voice/pcm';

export type AudioDiagnosticEvent =
  | { kind: 'input_format'; sampleRate: number; channels: number; contextSampleRate: number }
  | { kind: 'output_format'; sampleRate: number; channels: number; contextSampleRate: number }
  | {
      kind: 'chunk';
      replyId: string;
      sequence: number;
      durationMs: number;
      queueLength: number;
      sampleRate: number;
    }
  | { kind: 'playback_start'; replyId: string; sequence: number }
  | { kind: 'playback_end'; replyId: string; sequence: number }
  | { kind: 'interrupt'; replyId: string }
  | { kind: 'queue_flush'; replyId: string; dropped: number }
  | { kind: 'dropped'; replyId: string; sequence: number; reason: 'duplicate' | 'stale' | 'empty' };

export interface AudioDebugSnapshot {
  inputSampleRate: number | null;
  inputChannels: number | null;
  outputSampleRate: number | null;
  outputChannels: number | null;
  contextSampleRate: number | null;
  queueLength: number;
  playbackUnderrunSamples: number;
  events: AudioDiagnosticEvent[];
}

interface StoredReply {
  replyId: string;
  sampleRate: number;
  chunks: string[];
  sequences: number[];
  played: Float32Array[];
  playedRate: number;
}

export interface ReplyPlaybackCheck {
  replyId: string;
  sequences: number[];
  chunkCount: number;
  duplicateDrops: number;
  staleDrops: number;
  durationMs: number;
  peak: number;
  maxAbsError: number | null;
  clipped: number;
  orderOk: boolean;
}

const MAX_EVENTS = 2000;
const MAX_REPLIES = 8;

const events: AudioDiagnosticEvent[] = [];
const replies: StoredReply[] = [];
const listeners = new Set<() => void>();

let inputSampleRate: number | null = null;
let inputChannels: number | null = null;
let outputSampleRate: number | null = null;
let outputChannels: number | null = null;
let contextSampleRate: number | null = null;
let queueLength = 0;
let playbackUnderrunSamples = 0;

function notify(): void {
  for (const listener of listeners) listener();
}

function replyBucket(replyId: string, sampleRate: number): StoredReply {
  const existing = replies.find((item) => item.replyId === replyId);
  if (existing) return existing;
  const created: StoredReply = {
    replyId,
    sampleRate,
    chunks: [],
    sequences: [],
    played: [],
    playedRate: sampleRate,
  };
  replies.push(created);
  while (replies.length > MAX_REPLIES) replies.shift();
  return created;
}

export function recordAudioDiagnostic(event: AudioDiagnosticEvent): void {
  if (!__DEV__) return;
  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  if (event.kind === 'input_format') {
    inputSampleRate = event.sampleRate;
    inputChannels = event.channels;
    contextSampleRate = event.contextSampleRate;
  } else if (event.kind === 'output_format') {
    outputSampleRate = event.sampleRate;
    outputChannels = event.channels;
    contextSampleRate = event.contextSampleRate;
  } else if (event.kind === 'chunk') {
    queueLength = event.queueLength;
  } else if (event.kind === 'queue_flush') {
    queueLength = 0;
  }
  notify();
}

export function rememberAgentChunk(replyId: string, sequence: number, base64: string, sampleRate: number): void {
  if (!__DEV__ || !replyId || !base64) return;
  const bucket = replyBucket(replyId, sampleRate);
  bucket.sampleRate = sampleRate;
  bucket.chunks.push(base64);
  bucket.sequences.push(sequence);
}

export function rememberPlayedSamples(replyId: string, samples: Float32Array, sampleRate: number): void {
  if (!__DEV__ || !replyId || samples.length === 0) return;
  const bucket = replyBucket(replyId, sampleRate);
  bucket.playedRate = sampleRate;
  let stored = 0;
  for (const part of bucket.played) stored += part.length;
  if (stored >= 24000 * 45) return;
  bucket.played.push(samples.slice(0, 24000 * 45 - stored));
}

export function noteQueueLength(length: number): void {
  if (!__DEV__) return;
  queueLength = length;
}

export function notePlaybackUnderrun(samples: number): void {
  if (!__DEV__ || samples <= 0) return;
  playbackUnderrunSamples += samples;
  notify();
}

export function getAudioDebugSnapshot(): AudioDebugSnapshot {
  return {
    inputSampleRate,
    inputChannels,
    outputSampleRate,
    outputChannels,
    contextSampleRate,
    queueLength,
    playbackUnderrunSamples,
    events: events.slice(),
  };
}

export function subscribeAudioDiagnostics(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetAudioDiagnostics(): void {
  events.length = 0;
  replies.length = 0;
  inputSampleRate = null;
  inputChannels = null;
  outputSampleRate = null;
  outputChannels = null;
  contextSampleRate = null;
  queueLength = 0;
  playbackUnderrunSamples = 0;
}

export function latestReplyChunks(): { replyId: string; sampleRate: number; chunks: string[] } | null {
  const latest = replies[replies.length - 1];
  if (!latest || latest.chunks.length === 0) return null;
  return { replyId: latest.replyId, sampleRate: latest.sampleRate, chunks: latest.chunks.slice() };
}

export function listCapturedReplies(): { replyId: string; sampleRate: number; chunks: string[] }[] {
  return replies
    .filter((item) => item.chunks.length > 0)
    .map((item) => ({ replyId: item.replyId, sampleRate: item.sampleRate, chunks: item.chunks.slice() }));
}

function concatPlayed(parts: Float32Array[]): Float32Array {
  let length = 0;
  for (const part of parts) length += part.length;
  const merged = new Float32Array(length);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

/** Development check: played samples match the decoded agent PCM when rates are equal. */
export function inspectPlayback(): ReplyPlaybackCheck[] {
  return replies.map((bucket) => {
    const source = bucket.chunks.reduce((acc, chunk) => acc + pcm16Base64ToFloat(chunk).length, 0);
    const sourceFloats = new Float32Array(source);
    let offset = 0;
    for (const chunk of bucket.chunks) {
      const floats = pcm16Base64ToFloat(chunk);
      sourceFloats.set(floats, offset);
      offset += floats.length;
    }
    const played = concatPlayed(bucket.played);
    let peak = 0;
    let clipped = 0;
    for (let i = 0; i < played.length; i += 1) {
      const sample = Math.abs(played[i] ?? 0);
      if (sample > peak) peak = sample;
      if (sample >= 0.999) clipped += 1;
    }
    let maxAbsError: number | null = null;
    if (played.length > 0 && sourceFloats.length > 0 && bucket.playedRate > 0) {
      const expected =
        bucket.playedRate === bucket.sampleRate
          ? sourceFloats
          : createStreamingRateConverter(bucket.sampleRate, bucket.playedRate).process(sourceFloats);
      const count = Math.min(played.length, expected.length);
      let error = 0;
      for (let i = 0; i < count; i += 1) {
        const delta = Math.abs((played[i] ?? 0) - (expected[i] ?? 0));
        if (delta > error) error = delta;
      }
      maxAbsError = error;
    }
    const sequences = bucket.sequences.slice();
    const orderOk = sequences.every((value, index) => index === 0 || value > (sequences[index - 1] ?? 0));
    const duplicateDrops = events.filter(
      (event) => event.kind === 'dropped' && event.reason === 'duplicate' && event.replyId === bucket.replyId,
    ).length;
    const staleDrops = events.filter(
      (event) => event.kind === 'dropped' && event.reason === 'stale' && event.replyId === bucket.replyId,
    ).length;
    const durationMs =
      bucket.sampleRate > 0 ? (sourceFloats.length / bucket.sampleRate) * 1000 : 0;
    return {
      replyId: bucket.replyId,
      sequences,
      chunkCount: bucket.chunks.length,
      duplicateDrops,
      staleDrops,
      durationMs,
      peak,
      maxAbsError,
      clipped,
      orderOk,
    };
  });
}

function floatsToWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) bytes[offset + i] = text.charCodeAt(i);
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return bytes;
}

/** Agent audio that actually left the playback queue, with a short gap between replies. */
export function capturePlayedWavBase64(): string {
  const parts: Float32Array[] = [];
  let rate = VOICE_SAMPLE_RATE;
  for (const bucket of replies) {
    if (bucket.playedRate > 0) rate = bucket.playedRate;
    const played = concatPlayed(bucket.played);
    if (played.length === 0) continue;
    parts.push(played);
    parts.push(new Float32Array(Math.round(rate * 0.25)));
  }
  let length = 0;
  for (const part of parts) length += part.length;
  const merged = new Float32Array(length);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  const wav = floatsToWav(merged, rate);
  return bytesToBase64(wav);
}

export function installAudioDebugHook(): void {
  if (!__DEV__ || typeof window === 'undefined') return;
  window.__OPPUNA_VOICE_AUDIO__ = {
    snapshot: getAudioDebugSnapshot,
    inspect: inspectPlayback,
    replies: listCapturedReplies,
    wav: capturePlayedWavBase64,
  };
}

declare global {
  interface Window {
    __OPPUNA_VOICE_AUDIO__?: {
      snapshot: () => AudioDebugSnapshot;
      inspect: () => ReplyPlaybackCheck[];
      replies: () => { replyId: string; sampleRate: number; chunks: string[] }[];
      wav: () => string;
    };
  }
}
