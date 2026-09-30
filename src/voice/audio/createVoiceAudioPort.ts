import { Platform } from 'react-native';

import { createNativePcmPort } from '@/voice/audio/nativePcmPort';
import { createWebAudioPort } from '@/voice/audio/webAudioPort';
import type { VoiceAudioPort } from '@/voice/audio/types';

export function createVoiceAudioPort(): VoiceAudioPort {
  if (Platform.OS === 'android') return createNativePcmPort();
  return createWebAudioPort();
}
