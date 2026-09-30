import { pcm16Base64ToFloat, VOICE_SAMPLE_RATE } from '@/voice/pcm';
import { createWebAudioPort } from '@/voice/audio/webAudioPort';

/**
 * Development comparison.
 * Raw playback is the received PCM16 in one buffer.
 * Pipeline playback sends the same chunks through the Talk to Oppuna queue.
 */
export async function playRawAgentPcm(chunks: string[], sampleRate = VOICE_SAMPLE_RATE): Promise<void> {
  if (typeof window === 'undefined' || chunks.length === 0) return;
  let context: AudioContext;
  try {
    context = new window.AudioContext({ sampleRate });
  } catch {
    context = new window.AudioContext();
  }
  const parts = chunks.map((chunk) => pcm16Base64ToFloat(chunk));
  let length = 0;
  for (const part of parts) length += part.length;
  const samples = new Float32Array(length);
  let offset = 0;
  for (const part of parts) {
    samples.set(part, offset);
    offset += part.length;
  }
  if (samples.length === 0) {
    await context.close().catch(() => undefined);
    return;
  }
  // Buffer stays at the agent rate. The context resamples to the device rate.
  const buffer = context.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  const node = context.createBufferSource();
  node.buffer = buffer;
  node.connect(context.destination);
  await context.resume();
  await new Promise<void>((resolve) => {
    node.onended = () => resolve();
    node.start();
  });
  await context.close().catch(() => undefined);
}

export async function playPipelineAgentPcm(chunks: string[], sampleRate = VOICE_SAMPLE_RATE): Promise<void> {
  if (chunks.length === 0) return;
  const port = createWebAudioPort();
  const replyId = `debug-${Date.now()}`;
  port.beginReply(replyId);
  for (const chunk of chunks) {
    port.playPcm16Base64(chunk, sampleRate, replyId);
  }
  const durationMs = chunks.reduce((total, chunk) => {
    const samples = pcm16Base64ToFloat(chunk).length;
    return total + (samples / sampleRate) * 1000;
  }, 1200);
  await new Promise((resolve) => setTimeout(resolve, durationMs));
  port.stopPlayback(replyId);
  await port.stopCapture();
}
