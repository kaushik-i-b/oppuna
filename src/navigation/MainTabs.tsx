import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type OppunaIconName } from '@/ui/Icon';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { softSpring } from '@/ui/motion';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { PlanScreen } from '@/screens/plan/PlanScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { JournalListScreen } from '@/screens/journal/JournalListScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import {
  TAB_BAR_BASE_HEIGHT,
  resolveTabBarBottomInset,
  tabBarPaddingBottom,
  tabBarTotalHeight,
} from '@/navigation/layoutInsets';
import type { MainTabParamList } from '@/navigation/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, OppunaIconName> = {
  Home: 'home',
  Plan: 'plan',
  Journal: 'journal',
  Chat: 'chat',
  Profile: 'profile',
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
  const allowLift = Platform.OS !== 'android';
  const scale = useSharedValue(focused ? 1.1 : 1);
  const lift = useSharedValue(focused && allowLift ? -1 : 0);

  useEffect(() => {
    if (reduceMotion || !allowLift) {
      scale.value = focused && !reduceMotion ? 1.08 : 1;
      lift.value = 0;
      return;
    }
    scale.value = withSpring(focused ? 1.12 : 1, softSpring);
    lift.value = withSpring(focused ? -1.5 : 0, softSpring);
  }, [focused, reduceMotion, scale, lift, allowLift]);

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
  const insets = useSafeAreaInsets();
  const bottomInset = resolveTabBarBottomInset(insets.bottom, Platform.OS);
  const barHeight = tabBarTotalHeight(bottomInset);
  const barPaddingBottom = tabBarPaddingBottom(bottomInset);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        safeAreaInsets: { top: 0, right: 0, left: 0, bottom: 0 },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
          minHeight: TAB_BAR_BASE_HEIGHT - 8,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: StyleSheetHairline,
          height: barHeight,
          paddingTop: 4,
          paddingBottom: barPaddingBottom,
          ...(Platform.OS === 'android'
            ? { elevation: 16, zIndex: 100 }
            : { zIndex: 100 }),
          minHeight: barHeight,
        },
        tabBarIcon: ({ focused, color }) => (
          <View style={{ alignItems: 'center', justifyContent: 'center' }} pointerEvents="box-none">
            <TabIcon name={ICONS[route.name]} focused={focused} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="Plan" component={PlanScreen} options={{ tabBarLabel: t('tabs.plan') }} />
      <Tab.Screen
        name="Journal"
        component={JournalListScreen}
        options={{ tabBarLabel: t('tabs.journal') }}
      />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarLabel: t('tabs.chat') }} />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
}

const StyleSheetHairline = 0.5;
