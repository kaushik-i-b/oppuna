import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  type BaseAnimationBuilder,
  type EntryExitAnimationFunction,
  type LayoutAnimationFunction,
} from 'react-native-reanimated';

import { duration } from '@/theme/tokens';

type Entering = BaseAnimationBuilder | EntryExitAnimationFunction;
type Layout = BaseAnimationBuilder | LayoutAnimationFunction;

/** Soft press target — calm, not bouncy. */
export const PRESS_SCALE = 0.97;
export const PRESS_SCALE_SOFT = 0.985;

/** Shared spring feel for focus / selection micro-interactions. */
export const softSpring = { damping: 16, stiffness: 220, mass: 0.7 } as const;

/**
 * Calm enter presets. Prefer these over ad-hoc timings so motion feels consistent.
 * Callers should skip entering entirely when Reduce Motion is on.
 */
export const enter = {
  fade: (delay = 0): Entering => FadeIn.delay(delay).duration(duration.normal),
  rise: (delay = 0): Entering =>
    FadeInDown.delay(delay).duration(duration.slow).springify().damping(18),
  lift: (delay = 0): Entering =>
    FadeInUp.delay(delay).duration(duration.slow).springify().damping(18),
  soft: (delay = 0): Entering =>
    FadeInDown.delay(delay).duration(duration.normal).springify().damping(20),
} as const;

export const exit = {
  fade: (): Entering => FadeOut.duration(duration.fast),
} as const;

export const layout = {
  soft: (): Layout => LinearTransition.duration(duration.normal),
} as const;

/** Stagger delay helper for list / home sections. */
export function stagger(index: number, stepMs = 55): number {
  return Math.min(index * stepMs, 320);
}
