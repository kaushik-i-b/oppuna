import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, Screen, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation/types';
import { CareHero, FadeInView, Icon, SectionLabel, type OppunaIconName } from '@/ui';

type Props = NativeStackScreenProps<RootStackParamList, 'HowOppunaHelps'>;

interface HelpCard {
  icon: OppunaIconName;
  title: string;
  body: string;
}

const TOOLS: HelpCard[] = [
  {
    icon: 'mood',
    title: 'Notice',
    body: 'Mood check-ins help you see what repeats — energy, stress, kindness toward yourself — without judgment.',
  },
  {
    icon: 'journal',
    title: 'Name the thought',
    body: 'A thought record separates the situation from the conclusion your mind jumped to. Naming it softens its grip.',
  },
  {
    icon: 'chat',
    title: 'Soften it',
    body: 'Private chat can help you explore a kinder, more realistic view. Guided offline replies are there when the model isn’t.',
  },
  {
    icon: 'breathe',
    title: 'Calm the body',
    body: 'Breathing, grounding, and sleep wind-downs settle your nervous system so thinking gets a little easier.',
  },
];

export function HowOppunaHelpsScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <Screen title="How Oppuna helps" onBack={() => navigation.goBack()} scroll>
      <FadeInView delay={0} preset="fade">
        <CareHero
          leafVariant="greet"
          leafSize={64}
          title="CBT, made gentle"
          body="Oppuna uses ideas from cognitive behavioral therapy (CBT) to support everyday reflection — privately, on this device."
        />
      </FadeInView>

      <FadeInView delay={80}>
        <Card
          style={{
            marginBottom: theme.spacing.xl,
            backgroundColor: theme.colors.primaryMuted,
            borderWidth: 0,
          }}
          elevated={false}
        >
          <Text variant="bodyStrong" color="primary" style={{ marginBottom: theme.spacing.sm }}>
            The simple idea
          </Text>
          <Text variant="body" color="textSecondary">
            Thoughts, feelings, and actions affect each other. When you catch a harsh thought and
            look at it kindly, feelings often ease — and a smaller next step becomes clearer.
          </Text>
        </Card>
      </FadeInView>

      <FadeInView delay={140}>
        <SectionLabel>YOUR TOOLS</SectionLabel>
        <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
          {TOOLS.map((tool) => (
            <Card
              key={tool.title}
              style={{ backgroundColor: theme.colors.surfaceElevated }}
            >
              <View style={styles.row}>
                <View
                  style={[styles.iconWrap, { backgroundColor: theme.colors.primaryMuted }]}
                >
                  <Icon name={tool.icon} size={20} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                  <Text variant="bodyStrong">{tool.title}</Text>
                  <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                    {tool.body}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={200} preset="lift">
        <SectionLabel>IMPORTANT</SectionLabel>
        <Card style={{ backgroundColor: theme.colors.warningMuted, borderWidth: 0 }} elevated={false}>
          <Text variant="body" color="textSecondary">
            Oppuna is a wellness companion for everyday reflection. It is not therapy, diagnosis,
            treatment, or emergency care. If you are in danger, contact local emergency services
            or someone you trust.
          </Text>
        </Card>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
