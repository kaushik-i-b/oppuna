import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Icon, type OppunaIconName } from '@/ui/Icon';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { softSpring } from '@/ui/motion';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { MoodScreen } from '@/screens/mood/MoodScreen';
import { JournalListScreen } from '@/screens/journal/JournalListScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import type { MainTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, OppunaIconName> = {
  Home: 'home',
  Chat: 'chat',
  Mood: 'mood',
  Journal: 'journal',
  Settings: 'settings',
};

function TabIcon({
  name,
  focused,
  color,
}: {
  name: OppunaIconName;
  focused: boolean;
  color: string;
}): React.ReactElement {
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(focused ? 1.1 : 1);
  const lift = useSharedValue(focused ? -1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
      lift.value = 0;
      return;
    }
    scale.value = withSpring(focused ? 1.12 : 1, softSpring);
    lift.value = withSpring(focused ? -1.5 : 0, softSpring);
  }, [focused, reduceMotion, scale, lift]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
      <Icon name={name} size={22} color={color} filled={focused} />
    </Animated.View>
  );
}

export function MainTabs(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheetHairline,
          height: 58,
          paddingTop: 4,
        },
        tabBarIcon: ({ focused, color }) => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <TabIcon name={ICONS[route.name]} focused={focused} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarLabel: t('tabs.chat'), tabBarHideOnKeyboard: true }}
      />
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

const StyleSheetHairline = 0.5;
