import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { toNavigationTheme } from '@/navigation/navigationTheme';
import { rootNavigationRef } from '@/navigation/rootNavigation';
import type { RootStackParamList } from '@/navigation/types';

import { MainTabs } from '@/navigation/MainTabs';
import { WellnessOnboardingScreen } from '@/screens/onboarding/WellnessOnboardingScreen';
import { LanguageScreen } from '@/screens/onboarding/LanguageScreen';
import { PrivacyScreen } from '@/screens/onboarding/PrivacyScreen';
import { DisclaimerScreen } from '@/screens/onboarding/DisclaimerScreen';
import { VoiceModeScreen } from '@/screens/chat/VoiceModeScreen';
import { MoodScreen } from '@/screens/mood/MoodScreen';
import { MoodHistoryScreen } from '@/screens/mood/MoodHistoryScreen';
import { InsightsScreen } from '@/screens/insights/InsightsScreen';
import { JournalEditorScreen } from '@/screens/journal/JournalEditorScreen';
import { BreathingScreen } from '@/screens/breathing/BreathingScreen';
import { GroundingScreen } from '@/screens/grounding/GroundingScreen';
import { SleepScreen } from '@/screens/sleep/SleepScreen';
import { SelfCareScreen } from '@/screens/selfcare/SelfCareScreen';
import { DataExportScreen } from '@/screens/settings/DataExportScreen';
import { DeleteDataScreen } from '@/screens/settings/DeleteDataScreen';
import { EditProfileScreen } from '@/screens/settings/EditProfileScreen';
import { TermsScreen } from '@/screens/settings/TermsScreen';
import { AboutScreen } from '@/screens/settings/AboutScreen';
import { HowOppunaHelpsScreen } from '@/screens/onboarding/HowOppunaHelpsScreen';
import { LocalAIDiagnosticsScreen } from '@/screens/settings/LocalAIDiagnosticsScreen';
import { ProductionReadinessScreen } from '@/screens/settings/ProductionReadinessScreen';
import { CrisisScreen } from '@/screens/crisis/CrisisScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.ReactElement {
  const theme = useTheme();
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  return (
    <NavigationContainer ref={rootNavigationRef} theme={toNavigationTheme(theme)}>
      <Stack.Navigator
        key={onboardingComplete ? 'app' : 'onboarding'}
        screenOptions={{ headerShown: false }}
      >
        {!onboardingComplete ? (
          <Stack.Group>
            <Stack.Screen name="WellnessOnboarding" component={WellnessOnboardingScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="VoiceMode" component={VoiceModeScreen} />
            <Stack.Screen name="MoodCheckIn" component={MoodScreen} />
            <Stack.Screen name="MoodHistory" component={MoodHistoryScreen} />
            <Stack.Screen name="Insights" component={InsightsScreen} />
            <Stack.Screen name="JournalEditor" component={JournalEditorScreen} />
            <Stack.Screen name="Breathing" component={BreathingScreen} />
            <Stack.Screen name="Grounding" component={GroundingScreen} />
            <Stack.Screen name="Sleep" component={SleepScreen} />
            <Stack.Screen name="SelfCare" component={SelfCareScreen} />
            <Stack.Screen name="DataExport" component={DataExportScreen} />
            <Stack.Screen name="DeleteData" component={DeleteDataScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="HowOppunaHelps" component={HowOppunaHelpsScreen} />
            {__DEV__ ? (
              <>
                <Stack.Screen name="LocalAIDiagnostics" component={LocalAIDiagnosticsScreen} />
                <Stack.Screen name="ProductionReadiness" component={ProductionReadinessScreen} />
              </>
            ) : null}
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Disclaimer" component={DisclaimerScreen} />
            <Stack.Screen
              name="Crisis"
              component={CrisisScreen}
              options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
