import React, { useCallback, useRef, useState } from 'react';

import {
  SaveCelebration,
  type SaveCelebrationKind,
} from '@/components/feedback/SaveCelebration';
import { useHaptics } from '@/hooks/useHaptics';

interface CelebrateOptions {
  kind: SaveCelebrationKind;
  message: string;
  detail?: string;
  durationMs?: number;
}

interface ActiveCelebration extends CelebrateOptions {
  key: number;
}

/**
 * Imperative care-save celebration. `celebrate()` resolves when the overlay finishes.
 */
export function useSaveCelebration(): {
  celebrate: (options: CelebrateOptions) => Promise<void>;
  celebration: React.ReactElement | null;
} {
  const { notify } = useHaptics();
  const [active, setActive] = useState<ActiveCelebration | null>(null);
  const resolver = useRef<(() => void) | null>(null);
  const seq = useRef(0);

  const finish = useCallback(() => {
    setActive(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.();
  }, []);

  const celebrate = useCallback(
    (options: CelebrateOptions) =>
      new Promise<void>((resolve) => {
        // If a celebration is already up, end it first.
        resolver.current?.();
        resolver.current = resolve;
        seq.current += 1;
        notify();
        setActive({ ...options, key: seq.current });
      }),
    [notify],
  );

  const celebration = active
    ? React.createElement(SaveCelebration, {
        key: active.key,
        visible: true,
        kind: active.kind,
        message: active.message,
        detail: active.detail,
        durationMs: active.durationMs,
        onDone: finish,
      })
    : null;

  return { celebrate, celebration };
}
