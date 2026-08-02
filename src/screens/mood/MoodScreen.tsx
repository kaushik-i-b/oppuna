import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, MoodPicker, Screen, Text, TextField } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { MOOD_BY_KEY, MOOD_TAGS } from '@/constants/moods';
import { moodRepository } from '@/database';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useSaveCelebration } from '@/hooks/useSaveCelebration';
import { useTranslation } from '@/hooks/useTranslation';
import { recordCareActivity } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import { CareHero, FadeInView, Icon, MoodMark, PressableScale, SectionLabel } from '@/ui';
import { logger } from '@/utils/logger';
import type { MoodKey, MoodTag } from '@/types';

const INTENSITY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function MoodScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const navigation = useAppNavigation();
  const { celebrate, celebration } = useSaveCelebration();

  const [mood, setMood] = useState<MoodKey | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<MoodTag[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTag = useCallback((tag: MoodTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }, []);

  const reset = useCallback(() => {
    setMood(null);
    setIntensity(5);
    setNote('');
    setTags([]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!mood) {
      toast.show('Pick how you feel first.', 'info');
      return;
    }
    setSaving(true);
    try {
      await moodRepository.create({ mood, intensity, note: note || null, tags });
      void recordCareActivity('mood');
      const moodMeta = MOOD_BY_KEY[mood];
      await celebrate({
        kind: 'mood',
        message: t('mood.saved'),
        detail: `${moodMeta.label} · intensity ${intensity}/10`,
      });
      reset();
    } catch (error) {
      logger.error('Save mood failed', { error: String(error) });
      toast.show('Could not save your mood.', 'error');
    } finally {
      setSaving(false);
    }
  }, [mood, intensity, note, tags, toast, celebrate, reset, t]);

  return (
    <>
      <Screen
        title={t('mood.title')}
        scroll
        keyboardAvoiding
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
        headerRight={
          <Pressable
            onPress={() => navigation.navigate('MoodHistory')}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('mood.history')}
          >
            <Icon name="journal" size={22} color={theme.colors.textMuted} />
          </Pressable>
        }
      >
        <FadeInView delay={0} preset="fade">
          <CareHero
            leafVariant="greet"
            leafSize={56}
            title="How are you feeling?"
            body="A 20-second check-in. Private, on this device."
          />
        </FadeInView>

        <FadeInView delay={80}>
          <SectionLabel>YOUR MOOD</SectionLabel>
          <Card
            style={{
              marginBottom: theme.spacing.lg,
              backgroundColor: theme.colors.surfaceElevated,
            }}
          >
            <MoodPicker value={mood} onChange={setMood} />
          </Card>
        </FadeInView>

        <FadeInView delay={140}>
          <SectionLabel>{`${t('mood.intensity').toUpperCase()} · ${intensity}`}</SectionLabel>
          <View
            style={[
              styles.intensityTrack,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.lg,
              },
            ]}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.intensityRow}
            >
              {INTENSITY_VALUES.map((value) => {
                const selected = value === intensity;
                return (
                  <PressableScale
                    key={value}
                    onPress={() => setIntensity(value)}
                    accessibilityRole="button"
                    accessibilityLabel={`Intensity ${value}`}
                    accessibilityState={{ selected }}
                    style={[
                      styles.intensityDot,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.surfaceInteractive,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      variant="bodyStrong"
                      style={{
                        color: selected ? theme.colors.onPrimary : theme.colors.textMuted,
                      }}
                    >
                      {value}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <SectionLabel>{t('mood.tags').toUpperCase()}</SectionLabel>
          <View style={[styles.tagRow, { marginBottom: theme.spacing.lg }]}>
            {MOOD_TAGS.map((tag) => (
              <Chip
                key={tag.key}
                label={tag.label}
                selected={tags.includes(tag.key)}
                onPress={() => toggleTag(tag.key)}
              />
            ))}
          </View>
        </FadeInView>

        <FadeInView delay={260}>
          <TextField
            label={t('mood.addNote')}
            value={note}
            onChangeText={setNote}
            placeholder="What's going on? (optional)"
            multiline
          />
        </FadeInView>

        <FadeInView delay={320} preset="lift">
          <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
            <Button label={t('common.save')} onPress={() => void handleSave()} loading={saving} />
            <Button
              label={t('home.insights')}
              variant="ghost"
              onPress={() => navigation.navigate('Insights')}
            />
          </View>
        </FadeInView>

        {mood ? (
          <View
            style={{
              marginTop: theme.spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
            }}
          >
            <MoodMark
              mood={mood}
              size={18}
              color={theme.colors[MOOD_BY_KEY[mood].colorKey]}
            />
            <Text variant="caption" color="textFaint">
              {MOOD_BY_KEY[mood].label} · intensity {intensity}/10
            </Text>
          </View>
        ) : null}
      </Screen>
      {celebration}
    </>
  );
}

const styles = StyleSheet.create({
  intensityTrack: { borderWidth: StyleSheet.hairlineWidth },
  intensityRow: { gap: 8, paddingVertical: 4 },
  intensityDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
