/**
 * React binding for the voice session controller.
 *
 * Owns one `AssemblyAIVoiceService` + one `VoiceSessionController` per mount,
 * bridges TTS via `expo-speech` (interruptible with `Speech.stop()`), and
 * re-renders on controller snapshots. Crisis replies surface through the
 * existing crisis flow via navigation callback.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Speech from 'expo-speech';

import { AssemblyAIVoiceService } from '@/voice/AssemblyAIVoiceService';
import { VoiceSessionController, type VoiceSessionSnapshot } from '@/voice/VoiceSessionController';
import { logVoiceEvent } from '@/voice/voiceLogger';

const INITIAL: VoiceSessionSnapshot = {
  state: 'IDLE',
  segments: [],
  livePartial: '',
  draft: null,
  savedReflectionId: null,
  errorMessage: null,
  crisis: false,
};

export function useVoiceSession(onCrisis?: (category: string) => void): {
  snapshot: VoiceSessionSnapshot;
  controller: VoiceSessionController;
  transport: string;
} {
  const serviceRef = useRef<AssemblyAIVoiceService | null>(null);
  const controllerRef = useRef<VoiceSessionController | null>(null);
  const [snapshot, setSnapshot] = useState<VoiceSessionSnapshot>(INITIAL);
  const [transport, setTransport] = useState('local');

  const crisisRef = useRef(onCrisis);
  crisisRef.current = onCrisis;

  const controller = useMemo(() => {
    const service = new AssemblyAIVoiceService();
    const controllerInstance = new VoiceSessionController(
      service,
      {
        speak: (text: string) =>
          new Promise<void>((resolve) => {
            const safe = text.slice(0, 900);
            Speech.speak(safe, {
              rate: 0.95,
              pitch: 1,
              onDone: () => resolve(),
              onStopped: () => resolve(),
              onError: () => resolve(),
            });
          }),
        stop: () => {
          Speech.stop();
        },
      },
      (category) => crisisRef.current?.(category),
    );
    serviceRef.current = service;
    controllerRef.current = controllerInstance;
    return controllerInstance;
  }, []);

  useEffect(() => {
    const unsubscribe = controller.subscribe(setSnapshot);
    // Poll transport label cheaply on each snapshot (no extra renders).
    const poll = setInterval(() => {
      const label = serviceRef.current?.getTransport() ?? 'local';
      setTransport((prev) => (prev === label ? prev : label));
    }, 1000);
    logVoiceEvent('voice:listening');
    return () => {
      clearInterval(poll);
      unsubscribe();
      void controllerRef.current?.end().catch(() => undefined);
      Speech.stop();
    };
  }, [controller]);

  return { snapshot, controller, transport };
}
