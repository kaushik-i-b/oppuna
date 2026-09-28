import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

import { VOICE_SAMPLE_RATE } from '@/voice/pcm';
import type { VoiceAudioPort } from '@/voice/audio/types';

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
  const native = nativeModule();
  let subscription: { remove: () => void } | null = null;

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
      const emitter = new NativeEventEmitter(NativeModules.OppunaPcmAudio);
      subscription = emitter.addListener('OppunaPcmChunk', (event: { audio?: string }) => {
        if (event?.audio) onChunk(event.audio);
      });
      await native.startCapture(VOICE_SAMPLE_RATE);
    },
    async stopCapture() {
      subscription?.remove();
      subscription = null;
      await native?.stopCapture();
    },
    playPcm16Base64(base64Pcm, sampleRate) {
      native?.playPcm16(base64Pcm, sampleRate);
    },
    stopPlayback() {
      native?.stopPlayback();
    },
  };
}
