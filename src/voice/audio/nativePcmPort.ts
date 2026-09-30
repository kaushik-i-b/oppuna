import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

import {
  installAudioDebugHook,
  recordAudioDiagnostic,
  rememberAgentChunk,
} from '@/voice/audio/audioDiagnostics';
import { createPcmPlaybackQueue } from '@/voice/audio/playbackQueue';
import type { VoiceAudioPort } from '@/voice/audio/types';
import { VOICE_SAMPLE_RATE } from '@/voice/pcm';

interface PcmNative {
  startCapture: (sampleRate: number) => Promise<void>;
  stopCapture: () => Promise<void>;
  playPcm16: (base64: string, sampleRate: number) => void;
  stopPlayback: () => void;
  addListener: (event: string) => void;
  removeListeners: (count: number) => void;
}

function nativeModule(): PcmNative | null {
  return (NativeModules.OppunaPcmAudio as PcmNative | undefined) ?? null;
}

/** Android microphone and speaker for the Voice Agent PCM stream. */
export function createNativePcmPort(): VoiceAudioPort {
  installAudioDebugHook();
  const native = nativeModule();
  const queue = createPcmPlaybackQueue();
  let subscription: { remove: () => void } | null = null;
  let formatSubscription: { remove: () => void } | null = null;
  let outputSubscription: { remove: () => void } | null = null;
  let deviceReplyId = '';
  let loggedOutput = false;

  function stopDevice(replyId?: string): number {
    const target = replyId || deviceReplyId || queue.activeReplyId();
    const dropped = queue.flush(target || undefined).dropped;
    const sameDevice = !replyId || !deviceReplyId || replyId === deviceReplyId;
    if (sameDevice) {
      native?.stopPlayback();
      deviceReplyId = '';
    }
    recordAudioDiagnostic({ kind: 'interrupt', replyId: target });
    recordAudioDiagnostic({ kind: 'queue_flush', replyId: target, dropped });
    return dropped;
  }

  return {
    supportsStreaming: Platform.OS === 'android' && native != null,
    async startCapture(onChunk) {
      if (!native) throw new Error('microphone_unavailable');
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        const error = new Error('microphone_permission_denied');
        error.name = 'NotAllowedError';
        throw error;
      }
      subscription?.remove();
      formatSubscription?.remove();
      outputSubscription?.remove();
      loggedOutput = false;
      const emitter = new NativeEventEmitter(NativeModules.OppunaPcmAudio);
      outputSubscription = emitter.addListener(
        'OppunaPcmOutput',
        (event: { sourceRate?: number; trackRate?: number; channels?: number }) => {
          loggedOutput = true;
          recordAudioDiagnostic({
            kind: 'output_format',
            sampleRate: event.sourceRate ?? VOICE_SAMPLE_RATE,
            channels: event.channels ?? 1,
            contextSampleRate: event.trackRate ?? VOICE_SAMPLE_RATE,
          });
        },
      );
      formatSubscription = emitter.addListener(
        'OppunaPcmFormat',
        (event: { sampleRate?: number; channels?: number; targetRate?: number }) => {
          recordAudioDiagnostic({
            kind: 'input_format',
            sampleRate: event.sampleRate ?? VOICE_SAMPLE_RATE,
            channels: event.channels ?? 1,
            contextSampleRate: event.targetRate ?? VOICE_SAMPLE_RATE,
          });
        },
      );
      subscription = emitter.addListener('OppunaPcmChunk', (event: { audio?: string }) => {
        if (event?.audio) onChunk(event.audio);
      });
      await native.startCapture(VOICE_SAMPLE_RATE);
    },
    async stopCapture() {
      subscription?.remove();
      formatSubscription?.remove();
      outputSubscription?.remove();
      subscription = null;
      formatSubscription = null;
      outputSubscription = null;
      await native?.stopCapture();
    },
    beginReply(replyId) {
      const previous = queue.activeReplyId();
      queue.beginReply(replyId);
      if (previous && previous !== replyId && deviceReplyId === previous) {
        native?.stopPlayback();
        recordAudioDiagnostic({ kind: 'queue_flush', replyId: previous, dropped: 0 });
      }
      deviceReplyId = replyId;
    },
    playPcm16Base64(base64Pcm, sampleRate, replyId) {
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
      if (!loggedOutput) {
        loggedOutput = true;
        recordAudioDiagnostic({
          kind: 'output_format',
          sampleRate: chunk.sampleRate,
          channels: 1,
          contextSampleRate: chunk.sampleRate,
        });
      }
      rememberAgentChunk(chunk.replyId, chunk.sequence, chunk.base64, chunk.sampleRate);
      native?.playPcm16(chunk.base64, chunk.sampleRate);
      deviceReplyId = chunk.replyId;
      recordAudioDiagnostic({
        kind: 'chunk',
        replyId: chunk.replyId,
        sequence: chunk.sequence,
        durationMs: Math.round(chunk.durationMs),
        queueLength: 1,
        sampleRate: chunk.sampleRate,
      });
      recordAudioDiagnostic({ kind: 'playback_start', replyId: chunk.replyId, sequence: chunk.sequence });
    },
    stopPlayback(replyId) {
      return stopDevice(replyId);
    },
  };
}
