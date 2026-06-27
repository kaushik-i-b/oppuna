import React from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, ListItem, Screen, SectionHeader, Text } from '@/components';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelfCare'>;

export function SelfCareScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const appNav = useAppNavigation();

  const sections: { title: string; items: { emoji: string; title: string; subtitle: string; onPress: () => void }[] }[] = [
    {
      title: 'Calm your body',
      items: [
        { emoji: '🫁', title: 'Take a breathing break', subtitle: '2–5 minutes of slow breathing', onPress: () => appNav.navigate('Breathing') },
        { emoji: '🌙', title: 'Prepare for rest', subtitle: 'Wind down gently for sleep', onPress: () => appNav.navigate('Sleep') },
      ],
    },
    {
      title: 'Settle your mind',
      items: [
        { emoji: '🌍', title: 'Ground yourself', subtitle: '5-4-3-2-1 senses exercise', onPress: () => appNav.navigate('Grounding') },
        { emoji: '🧠', title: 'Reframe a thought', subtitle: 'Write a quick thought record', onPress: () => appNav.navigate('JournalEditor', { kind: 'thought_record' }) },
      ],
    },
    {
      title: 'Reflect & connect',
      items: [
        { emoji: '🙏', title: 'Note something good', subtitle: 'Add a gratitude entry', onPress: () => appNav.navigate('JournalEditor', { kind: 'gratitude' }) },
        { emoji: '💬', title: 'Talk it through', subtitle: 'Have a private chat', onPress: () => appNav.navigate('Main', { screen: 'Chat' }) },
      ],
    },
    {
      title: 'Check in',
      items: [
        { emoji: '🌤️', title: 'Log your mood', subtitle: 'Notice how today feels', onPress: () => appNav.navigate('Main', { screen: 'Mood' }) },
        { emoji: '📈', title: 'See your patterns', subtitle: 'Review your weekly insights', onPress: () => appNav.navigate('Insights') },
      ],
    },
  ];

  return (
    <Screen title="Self-care plan" onBack={() => navigation.goBack()} scroll>
      <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.colors.primaryMuted }}>
        <Text variant="subtitle" color="text">
          🧺 A gentle plan for today
        </Text>
        <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
          You don’t have to do all of this. Pick just one small thing that feels kind right now.
        </Text>
      </Card>

      {sections.map((section) => (
        <View key={section.title} style={{ marginBottom: theme.spacing.lg }}>
          <SectionHeader title={section.title} />
          <View style={{ gap: theme.spacing.sm }}>
            {section.items.map((item) => (
              <ListItem
                key={item.title}
                leadingEmoji={item.emoji}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
              />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}
