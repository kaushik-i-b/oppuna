import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

/** Typed navigation hook for the root stack (usable from tab screens too). */
export function useAppNavigation(): AppNavigation {
  return useNavigation<AppNavigation>();
}
