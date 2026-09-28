import { base64ToBytes, downsampleBuffer, floatTo16BitPCM, pcm16ToBase64, VOICE_SAMPLE_RATE } from '@/voice/pcm';
import type { VoiceAudioPort } from '@/voice/audio/types';

interface ScriptProcessor extends AudioNode {
  onaudioprocess: ((event: AudioProcessingEvent) => void) | null;
}

/**
 * Browser microphone and speaker path. Echo cancellation comes from getUserMedia.
 * Native shells without Web Audio report supportsStreaming = false.
 */
export function createWebAudioPort(): VoiceAudioPort {
  const supported = typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
  let captureContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let processor: ScriptProcessor | null = null;
  let playContext: AudioContext | null = null;
  let nextPlayTime = 0;
  const activeSources = new Set<AudioBufferSourceNode>();

  function stopSources(): void {
    for (const source of activeSources) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    }
    activeSources.clear();
    nextPlayTime = 0;
  }

  return {
    supportsStreaming: supported,
    async startCapture(onChunk) {
      if (!supported || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('microphone_unavailable');
      }
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const AudioCtx = window.AudioContext;
      captureContext = new AudioCtx();
      const source = captureContext.createMediaStreamSource(stream);
      const factory = captureContext as AudioContext & {
        createScriptProcessor: (size: number, inputs: number, outputs: number) => ScriptProcessor;
      };
      processor = factory.createScriptProcessor(2048, 1, 1);
      processor.onaudioprocess = (event) => {
        const channel = event.inputBuffer.getChannelData(0);
        const rate = captureContext?.sampleRate ?? VOICE_SAMPLE_RATE;
        const down = downsampleBuffer(channel, rate, VOICE_SAMPLE_RATE);
        if (down.length === 0) return;
        onChunk(pcm16ToBase64(floatTo16BitPCM(down)));
      };
      source.connect(processor);
      processor.connect(captureContext.destination);
      await captureContext.resume();
    },
    async stopCapture() {
      processor?.disconnect();
      processor = null;
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      if (captureContext) {
        await captureContext.close().catch(() => undefined);
        captureContext = null;
      }
    },
    playPcm16Base64(base64Pcm, sampleRate) {
      if (!supported || !base64Pcm) return;
      if (!playContext) playContext = new window.AudioContext();
      const context = playContext;
      void context.resume();
      const bytes = base64ToBytes(base64Pcm);
      const sampleCount = Math.floor(bytes.byteLength / 2);
      if (sampleCount <= 0) return;
      const view = new DataView(bytes.buffer, bytes.byteOffset, sampleCount * 2);
      const floats = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i += 1) {
        floats[i] = view.getInt16(i * 2, true) / 0x8000;
      }
      const buffer = context.createBuffer(1, floats.length, sampleRate);
      buffer.getChannelData(0).set(floats);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      const startAt = Math.max(context.currentTime + 0.02, nextPlayTime);
      source.start(startAt);
      nextPlayTime = startAt + buffer.duration;
      activeSources.add(source);
      source.onended = () => {
        activeSources.delete(source);
      };
    },
    stopPlayback() {
      stopSources();
    },
  };
}
