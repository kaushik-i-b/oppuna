import type { NavigatorScreenParams } from '@react-navigation/native';

import type { JournalKind, SafetyCategory } from '@/types';

export type MainTabParamList = {
  Home: undefined;
  Plan: undefined;
  Journal: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // Onboarding flow
  WellnessOnboarding: undefined;
  Language: { fromSettings?: boolean } | undefined;
  Privacy: { fromSettings?: boolean } | undefined;

  // Main app
  Main: NavigatorScreenParams<MainTabParamList> | undefined;

  // Pushed feature screens
  VoiceMode: undefined;
  MoodCheckIn: undefined;
  MoodHistory: undefined;
  Insights: undefined;
  JournalEditor: { id?: string; kind?: JournalKind } | undefined;
  Breathing: undefined;
  Grounding: undefined;
  Sleep: undefined;
  SelfCare: undefined;
  DataExport: undefined;
  DeleteData: undefined;
  EditProfile: undefined;
  Disclaimer: { fromSettings?: boolean } | undefined;
  Terms: undefined;
  About: undefined;
  HowOppunaHelps: undefined;
  LocalAIDiagnostics: undefined;
  ProductionReadiness: undefined;

  // Safety
  Crisis: { category?: SafetyCategory } | undefined;
};
