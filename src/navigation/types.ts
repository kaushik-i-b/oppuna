import type { NavigatorScreenParams } from '@react-navigation/native';

import type { JournalKind, SafetyCategory } from '@/types';

export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Mood: undefined;
  Journal: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  // Onboarding flow
  Onboarding: undefined;
  Language: { fromSettings?: boolean } | undefined;
  Privacy: { fromSettings?: boolean } | undefined;

  // Main app
  Main: NavigatorScreenParams<MainTabParamList> | undefined;

  // Pushed feature screens
  VoiceMode: undefined;
  MoodHistory: undefined;
  Insights: undefined;
  JournalEditor: { id?: string; kind?: JournalKind } | undefined;
  Breathing: undefined;
  Grounding: undefined;
  Sleep: undefined;
  SelfCare: undefined;
  DataExport: undefined;
  DeleteData: undefined;
  AIModel: undefined;
  Disclaimer: { fromSettings?: boolean } | undefined;
  Terms: undefined;
  About: undefined;

  // Safety
  Crisis: { category?: SafetyCategory } | undefined;
};
