import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Text } from '@/components/ui/Typography';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { MoodScreen } from '@/screens/mood/MoodScreen';
import { JournalListScreen } from '@/screens/journal/JournalListScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import type { MainTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Chat: '💬',
  Mood: '🌤️',
  Journal: '📓',
  Settings: '⚙️',
};

export function MainTabs(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
            {ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: t('tabs.chat') }} />
      <Tab.Screen name="Mood" component={MoodScreen} options={{ tabBarLabel: t('tabs.mood') }} />
      <Tab.Screen
        name="Journal"
        component={JournalListScreen}
        options={{ tabBarLabel: t('tabs.journal') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
}
