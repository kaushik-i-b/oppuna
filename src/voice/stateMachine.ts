import type { VoicePhase } from '@/voice/types';

export type VoiceEvent =
  | { type: 'START' }
  | { type: 'SESSION_READY' }
  | { type: 'CONNECT_FAILED' }
  | { type: 'SPEECH_STARTED' }
  | { type: 'SPEECH_STOPPED' }
  | { type: 'REPLY_STARTED' }
  | { type: 'REPLY_COMPLETED' }
  | { type: 'REPLY_INTERRUPTED' }
  | { type: 'PLAYBACK_CLEARED' }
  | { type: 'BEGIN_SAVE' }
  | { type: 'SAVE_FINISHED' }
  | { type: 'FAIL' }
  | { type: 'TIMEOUT' }
  | { type: 'EMPTY_TRANSCRIPT' }
  | { type: 'RETRY' }
  | { type: 'END' };

/**
 * Deterministic phase transitions. Unknown events leave the phase unchanged.
 * END and failure always leave the current phase. Timeouts leave
 * CONNECTING, THINKING, INTERRUPTED, and SAVING.
 */
export function reduceVoicePhase(phase: VoicePhase, event: VoiceEvent): VoicePhase {
  if (event.type === 'END') return 'IDLE';
  if (event.type === 'FAIL' || event.type === 'CONNECT_FAILED') {
    return phase === 'IDLE' ? 'IDLE' : 'ERROR';
  }

  switch (phase) {
    case 'IDLE':
      if (event.type === 'START' || event.type === 'RETRY') return 'CONNECTING';
      if (event.type === 'BEGIN_SAVE') return 'SAVING';
      return 'IDLE';
    case 'CONNECTING':
      if (event.type === 'SESSION_READY') return 'LISTENING';
      if (event.type === 'TIMEOUT') return 'ERROR';
      return 'CONNECTING';
    case 'LISTENING':
      if (event.type === 'SPEECH_STOPPED') return 'THINKING';
      if (event.type === 'REPLY_STARTED') return 'SPEAKING';
      if (event.type === 'BEGIN_SAVE') return 'SAVING';
      if (event.type === 'TIMEOUT') return 'LISTENING';
      return 'LISTENING';
    case 'THINKING':
      if (event.type === 'REPLY_STARTED') return 'SPEAKING';
      if (event.type === 'SPEECH_STARTED') return 'LISTENING';
      if (event.type === 'BEGIN_SAVE') return 'SAVING';
      if (event.type === 'TIMEOUT' || event.type === 'EMPTY_TRANSCRIPT') return 'LISTENING';
      return 'THINKING';
    case 'SPEAKING':
      if (event.type === 'SPEECH_STARTED' || event.type === 'REPLY_INTERRUPTED') return 'INTERRUPTED';
      if (event.type === 'REPLY_COMPLETED') return 'LISTENING';
      if (event.type === 'BEGIN_SAVE') return 'SAVING';
      return 'SPEAKING';
    case 'INTERRUPTED':
      if (event.type === 'PLAYBACK_CLEARED' || event.type === 'TIMEOUT' || event.type === 'SPEECH_STARTED') {
        return 'LISTENING';
      }
      if (event.type === 'SPEECH_STOPPED') return 'THINKING';
      if (event.type === 'REPLY_STARTED') return 'SPEAKING';
      return 'INTERRUPTED';
    case 'SAVING':
      if (event.type === 'SAVE_FINISHED') return 'LISTENING';
      if (event.type === 'TIMEOUT') return 'ERROR';
      return 'SAVING';
    case 'ERROR':
      if (event.type === 'RETRY' || event.type === 'START') return 'CONNECTING';
      return 'ERROR';
    default:
      return phase;
  }
}
