import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from '@/navigation/types';

/** Root stack ref — use for crisis routing from nested tab screens. */
export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateRoot<Name extends keyof RootStackParamList>(
  name: Name,
  ...args: undefined extends RootStackParamList[Name]
    ? [params?: RootStackParamList[Name]]
    : [params: RootStackParamList[Name]]
): void {
  if (!rootNavigationRef.isReady()) return;
  const params = args[0];
  if (params !== undefined) {
    rootNavigationRef.navigate({ name, params, merge: true } as never);
  } else {
    rootNavigationRef.navigate({ name, merge: true } as never);
  }
}
