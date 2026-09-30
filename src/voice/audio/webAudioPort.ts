import {
  createStreamingRateConverter,
  floatTo16BitPCM,
  pcm16Base64ToFloat,
  pcm16ToBase64,
  VOICE_SAMPLE_RATE,
} from '@/voice/pcm';
import {
  installAudioDebugHook,
  notePlaybackUnderrun,
  noteQueueLength,
  recordAudioDiagnostic,
  rememberAgentChunk,
  rememberPlayedSamples,
} from '@/voice/audio/audioDiagnostics';
import { createPcmPlaybackQueue } from '@/voice/audio/playbackQueue';
import type { VoiceAudioPort } from '@/voice/audio/types';

interface ScriptProcessor extends AudioNode {
  onaudioprocess: ((event: AudioProcessingEvent) => void) | null;
}

interface ScheduledSource {
  source: AudioBufferSourceNode;
  replyId: string;
  sequence: number;
  endTime: number;
  generation: number;
}

/**
 * Browser microphone and speaker path.
 * AssemblyAI audio/pcm is mono PCM16 little-endian at 24 kHz.
 * Microphone audio is not routed to the speakers. Agent chunks are scheduled
 * back to back on one persistent AudioContext so they cannot overlap or be
 * reordered. Chromium is asked for 24 kHz so the context does not resample
 * each chunk on its own.
 */
export function createWebAudioPort(): VoiceAudioPort {
  installAudioDebugHook();
  const supported = typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
  const queue = createPcmPlaybackQueue();
  let context: AudioContext | null = null;
  let captureContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let captureProcessor: ScriptProcessor | null = null;
  let captureGain: GainNode | null = null;
  let captureSource: MediaStreamAudioSourceNode | null = null;
  let captureConverter = createStreamingRateConverter(VOICE_SAMPLE_RATE, VOICE_SAMPLE_RATE);
  let deviceReplyId = '';
  let loggedOutput = false;
  let playGeneration = 0;
  let sources: ScheduledSource[] = [];
  let nextStart = 0;

  function queueLength(): number {
    return sources.length + queue.length();
  }

  function ensureContext(): AudioContext {
    if (!context || context.state === 'closed') {
      context = createAudioContext();
      loggedOutput = false;
      nextStart = 0;
      sources = [];
    }
    return context;
  }

  function stopSources(replyId?: string): number {
    const audioNow = context?.currentTime ?? 0;
    let dropped = 0;
    const kept: ScheduledSource[] = [];
    for (const item of sources) {
      if (!replyId || item.replyId === replyId) {
        dropped += 1;
        try {
          item.source.onended = null;
          item.source.stop();
        } catch {
          // Already stopped.
        }
        item.source.disconnect();
      } else {
        kept.push(item);
      }
    }
    sources = kept;
    if (!replyId || kept.length === 0) nextStart = audioNow;
    else nextStart = kept.reduce((latest, item) => Math.max(latest, item.endTime), audioNow);
    noteQueueLength(queueLength());
    return dropped;
  }

  function clearDevice(replyId?: string): number {
    playGeneration += 1;
    return stopSources(replyId);
  }

  function schedule(replyId: string, sequence: number, samples: Float32Array, sampleRate: number): void {
    const audio = ensureContext();
    if (samples.length === 0) return;
    const generation = playGeneration;
    const buffer = audio.createBuffer(1, samples.length, sampleRate);
    buffer.getChannelData(0).set(samples);
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.destination);
    const now = audio.currentTime;
    if (nextStart < now) {
      const gap = now - nextStart;
      if (nextStart > 0 && gap < 0.2) notePlaybackUnderrun(Math.round(gap * sampleRate));
      nextStart = now;
    }
    const startAt = nextStart;
    nextStart += buffer.duration;
    source.start(startAt);
    recordAudioDiagnostic({ kind: 'playback_start', replyId, sequence });
    const scheduled: ScheduledSource = {
      source,
      replyId,
      sequence,
      endTime: nextStart,
      generation,
    };
    source.onended = () => {
      sources = sources.filter((item) => item.source !== source);
      if (generation !== playGeneration) return;
      rememberPlayedSamples(replyId, samples, sampleRate);
      recordAudioDiagnostic({ kind: 'playback_end', replyId, sequence });
      noteQueueLength(queueLength());
    };
    sources.push(scheduled);
    noteQueueLength(queueLength());
  }

  function stopDevice(replyId: string | undefined): number {
    const target = replyId || deviceReplyId || queue.activeReplyId();
    const queued = queue.flush(target || undefined).dropped;
    const framed = clearDevice(target || undefined);
    if (!replyId || replyId === deviceReplyId) deviceReplyId = '';
    const dropped = queued + framed;
    recordAudioDiagnostic({ kind: 'interrupt', replyId: target });
    recordAudioDiagnostic({ kind: 'queue_flush', replyId: target, dropped });
    return dropped;
  }

  return {
    supportsStreaming: supported,
    async startCapture(onChunk) {
      if (!supported || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('microphone_unavailable');
      }
      stream = await openMicrophone();
      captureContext = createAudioContext();
      const audio = captureContext;
      const settings = stream.getAudioTracks()[0]?.getSettings?.() ?? {};
      const trackRate = typeof settings.sampleRate === 'number' ? settings.sampleRate : audio.sampleRate;
      const trackChannels = typeof settings.channelCount === 'number' ? settings.channelCount : 1;
      captureConverter = createStreamingRateConverter(audio.sampleRate || trackRate, VOICE_SAMPLE_RATE);
      recordAudioDiagnostic({
        kind: 'input_format',
        sampleRate: trackRate,
        channels: trackChannels,
        contextSampleRate: audio.sampleRate,
      });
      captureSource = audio.createMediaStreamSource(stream);
      const factory = audio as AudioContext & {
        createScriptProcessor: (size: number, inputs: number, outputs: number) => ScriptProcessor;
      };
      captureProcessor = factory.createScriptProcessor(2048, 1, 1);
      captureProcessor.onaudioprocess = (event) => {
        const outputs = event.outputBuffer;
        for (let channel = 0; channel < outputs.numberOfChannels; channel += 1) {
          outputs.getChannelData(channel).fill(0);
        }
        const mixed = mixToMono(event.inputBuffer);
        const down = captureConverter.process(mixed);
        if (down.length === 0) return;
        onChunk(pcm16ToBase64(floatTo16BitPCM(down)));
      };
      captureGain = audio.createGain();
      captureGain.gain.value = 0;
      captureSource.connect(captureProcessor);
      captureProcessor.connect(captureGain);
      captureGain.connect(audio.destination);
      await audio.resume();
    },
    async stopCapture() {
      captureProcessor?.disconnect();
      captureGain?.disconnect();
      captureSource?.disconnect();
      captureProcessor = null;
      captureGain = null;
      captureSource = null;
      captureConverter.reset();
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
      clearDevice();
      if (captureContext) {
        await captureContext.close().catch(() => undefined);
        captureContext = null;
      }
      if (context) {
        await context.close().catch(() => undefined);
        context = null;
      }
    },
    beginReply(replyId) {
      const previous = queue.activeReplyId();
      queue.beginReply(replyId);
      if (previous && previous !== replyId) {
        const dropped = clearDevice(previous);
        if (dropped > 0) {
          recordAudioDiagnostic({ kind: 'queue_flush', replyId: previous, dropped });
        }
      }
      deviceReplyId = replyId;
    },
    playPcm16Base64(base64Pcm, sampleRate, replyId) {
      if (!supported) return;
      const decision = queue.enqueue(replyId, base64Pcm, sampleRate);
      if (!decision.accepted) {
        recordAudioDiagnostic({
          kind: 'dropped',
          replyId,
          sequence: decision.sequence,
          reason: decision.reason === 'accepted' ? 'empty' : decision.reason,
        });
        return;
      }
      const chunk = queue.pull();
      if (!chunk) return;
      rememberAgentChunk(chunk.replyId, chunk.sequence, chunk.base64, chunk.sampleRate);
      const audio = ensureContext();
      if (!loggedOutput) {
        loggedOutput = true;
        recordAudioDiagnostic({
          kind: 'output_format',
          sampleRate: chunk.sampleRate,
          channels: 1,
          contextSampleRate: audio.sampleRate,
        });
      }
      const samples = pcm16Base64ToFloat(chunk.base64);
      schedule(chunk.replyId, chunk.sequence, samples, chunk.sampleRate);
      deviceReplyId = chunk.replyId;
      void audio.resume();
      recordAudioDiagnostic({
        kind: 'chunk',
        replyId: chunk.replyId,
        sequence: chunk.sequence,
        durationMs: Math.round(chunk.durationMs),
        queueLength: queueLength(),
        sampleRate: chunk.sampleRate,
      });
    },
    stopPlayback(replyId) {
      return stopDevice(replyId);
    },
  };
}

function createAudioContext(): AudioContext {
  const AudioCtx = window.AudioContext;
  if (preferVoiceRateContext()) {
    try {
      return new AudioCtx({ sampleRate: VOICE_SAMPLE_RATE });
    } catch {
      return new AudioCtx();
    }
  }
  return new AudioCtx();
}

function preferVoiceRateContext(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent || '';
  const safari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|Edg\//i.test(ua);
  const firefox = /Firefox\//i.test(ua);
  return !safari && !firefox;
}

async function openMicrophone(): Promise<MediaStream> {
  const preferred: MediaTrackConstraints = {
    channelCount: { ideal: 1 },
    sampleRate: { ideal: VOICE_SAMPLE_RATE },
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: preferred });
  } catch {
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  if (channels <= 1) return buffer.getChannelData(0).slice();
  const mixed = new Float32Array(buffer.length);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < mixed.length; index += 1) {
      mixed[index] = (mixed[index] ?? 0) + (data[index] ?? 0) / channels;
    }
  }
  return mixed;
}
