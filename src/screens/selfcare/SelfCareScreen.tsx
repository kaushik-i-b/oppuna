import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, Text } from '@/components';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { recordCareActivity } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import { CareHero, FadeInView, Icon, PressableScale, SectionLabel, type OppunaIconName } from '@/ui';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SelfCare'>;

interface CareItem {
  icon: OppunaIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function SelfCareScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const appNav = useAppNavigation();

  const hero = useMemo(() => {
    const hour = new Date().getHours();
    const seed = Number(localDateKey().replace(/-/g, '')) % 3;
    if (hour >= 20) {
      return {
        icon: 'sleep' as const,
        leaf: 'sleep' as const,
        title: 'Prepare for rest',
        subtitle: 'A short wind-down can help your mind let go.',
        onPress: () => {
          void recordCareActivity('selfcare');
          appNav.navigate('Sleep');
        },
      };
    }
    if (seed === 0) {
      return {
        icon: 'breathe' as const,
        leaf: 'breathe' as const,
        title: 'Take one calm minute',
        subtitle: 'Gentle breathing to settle your nervous system.',
        onPress: () => {
          void recordCareActivity('selfcare');
          appNav.navigate('Breathing');
        },
      };
    }
    return {
      icon: 'ground' as const,
      leaf: 'ground' as const,
      title: 'Ground yourself',
      subtitle: '5-4-3-2-1 senses to come back to the present.',
      onPress: () => {
        void recordCareActivity('selfcare');
        appNav.navigate('Grounding');
      },
    };
  }, [appNav]);

  const calmNow: CareItem[] = [
    {
      icon: 'breathe',
      title: 'Breathing break',
      subtitle: '2–5 minutes of slow breathing',
      onPress: () => {
        void recordCareActivity('selfcare');
        appNav.navigate('Breathing');
      },
    },
    {
      icon: 'ground',
      title: 'Ground yourself',
      subtitle: '5-4-3-2-1 senses exercise',
      onPress: () => {
        void recordCareActivity('selfcare');
        appNav.navigate('Grounding');
      },
    },
    {
      icon: 'sleep',
      title: 'Prepare for rest',
      subtitle: 'Wind down gently for sleep',
      onPress: () => {
        void recordCareActivity('selfcare');
        appNav.navigate('Sleep');
      },
    },
  ];

  const reflect: CareItem[] = [
    {
      icon: 'journal',
      title: 'Reframe a thought',
      subtitle: 'Write a quick thought record',
      onPress: () => appNav.navigate('JournalEditor', { kind: 'thought_record' }),
    },
    {
      icon: 'journal',
      title: 'Note something good',
      subtitle: 'Add a gratitude entry',
      onPress: () => appNav.navigate('JournalEditor', { kind: 'gratitude' }),
    },
    {
      icon: 'chat',
      title: 'Talk it through',
      subtitle: 'Have a private chat',
      onPress: () => appNav.navigate('Main', { screen: 'Chat' }),
    },
    {
      icon: 'mood',
      title: 'Log your mood',
      subtitle: 'Notice how today feels',
      onPress: () => appNav.navigate('Main', { screen: 'Mood' }),
    },
    {
      icon: 'insights',
      title: 'See your patterns',
      subtitle: 'Review your weekly insights',
      onPress: () => appNav.navigate('Insights'),
    },
  ];

  const renderLink = (item: CareItem, index: number, total: number): React.ReactElement => (
    <PressableScale
      key={item.title}
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      scaleTo={0.99}
      style={[
        styles.row,
        {
          paddingVertical: theme.spacing.md,
          borderBottomWidth: index < total - 1 ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryMuted }]}>
        <Icon name={item.icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
        <Text variant="bodyStrong">{item.title}</Text>
        <Text variant="caption" color="textMuted">
          {item.subtitle}
        </Text>
      </View>
      <Icon name="chevron" size={18} color={theme.colors.textFaint} />
    </PressableScale>
  );

  return (
    <Screen title="Self-care plan" onBack={() => navigation.goBack()} scroll>
      <FadeInView delay={0} preset="fade">
        <CareHero
          leafVariant={hero.leaf}
          leafSize={56}
          title="One kind thing"
          body="You don't have to do all of this. Pick just one small thing that feels kind right now."
        />
      </FadeInView>

      <FadeInView delay={80}>
        <SectionLabel>SUGGESTED FOR YOU</SectionLabel>
        <PressableScale
          onPress={hero.onPress}
          accessibilityRole="button"
          accessibilityLabel={hero.title}
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xl,
              marginBottom: theme.spacing.xl,
              ...theme.shadow,
            },
          ]}
        >
          <View style={[styles.heroIcon, { backgroundColor: theme.colors.primaryMuted }]}>
            <Icon name={hero.icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
            <Text variant="subtitle">{hero.title}</Text>
            <Text variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
              {hero.subtitle}
            </Text>
          </View>
          <Icon name="chevron" size={20} color={theme.colors.primary} />
        </PressableScale>
      </FadeInView>

      <FadeInView delay={140}>
        <SectionLabel>CALM NOW</SectionLabel>
        <View style={{ marginBottom: theme.spacing.xl }}>
          {calmNow.map((item, index) => renderLink(item, index, calmNow.length))}
        </View>
      </FadeInView>

      <FadeInView delay={200} preset="lift">
        <SectionLabel>REFLECT</SectionLabel>
        <View>{reflect.map((item, index) => renderLink(item, index, reflect.length))}</View>
      </FadeInView>

      <FadeInView delay={260} preset="lift">
        <View style={{ marginTop: theme.spacing.xl }}>
          <SectionLabel>WHY THESE TOOLS</SectionLabel>
          <PressableScale
            onPress={() => appNav.navigate('HowOppunaHelps')}
            accessibilityRole="button"
            accessibilityLabel="How Oppuna helps"
            scaleTo={0.99}
            style={[
              styles.whyRow,
              {
                backgroundColor: theme.colors.primaryMuted,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Icon name="insights" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
              <Text variant="bodyStrong" color="primary">
                How Oppuna helps
              </Text>
              <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                A short guide to CBT-inspired support
              </Text>
            </View>
            <Icon name="chevron" size={18} color={theme.colors.primary} />
          </PressableScale>
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyRow: { flexDirection: 'row', alignItems: 'center' },
});
