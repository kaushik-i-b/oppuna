import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Screen, SectionHeader, Text, TextField } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { MOOD_BY_KEY, MOOD_TAGS } from '@/constants/moods';
import { moodRepository } from '@/database';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useHaptics } from '@/hooks/useHaptics';
import { useTranslation } from '@/hooks/useTranslation';
import { MoodPicker } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { MoodKey, MoodTag } from '@/types';

const INTENSITY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function MoodScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const navigation = useAppNavigation();
  const { notify } = useHaptics();

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
      notify();
      toast.show(t('mood.saved'), 'success');
      reset();
    } catch (error) {
      logger.error('Save mood failed', { error: String(error) });
      toast.show('Could not save your mood.', 'error');
    } finally {
      setSaving(false);
    }
  }, [mood, intensity, note, tags, toast, notify, reset, t]);

  return (
    <Screen
      title={t('mood.title')}
      scroll
      keyboardAvoiding
      headerRight={
        <Pressable
          onPress={() => navigation.navigate('MoodHistory')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('mood.history')}
        >
          <Text variant="subtitle">📜</Text>
        </Pressable>
      }
    >
      <Card>
        <MoodPicker value={mood} onChange={setMood} />
      </Card>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={`${t('mood.intensity')} · ${intensity}`} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.intensityRow}
        >
          {INTENSITY_VALUES.map((value) => {
            const selected = value === intensity;
            return (
              <Pressable
                key={value}
                onPress={() => setIntensity(value)}
                accessibilityRole="button"
                accessibilityLabel={`Intensity ${value}`}
                accessibilityState={{ selected }}
                style={[
                  styles.intensityDot,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  variant="bodyStrong"
                  style={{ color: selected ? theme.colors.onPrimary : theme.colors.textMuted }}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <SectionHeader title={t('mood.tags')} />
        <View style={styles.tagRow}>
          {MOOD_TAGS.map((tag) => (
            <Chip
              key={tag.key}
              label={tag.label}
              selected={tags.includes(tag.key)}
              onPress={() => toggleTag(tag.key)}
            />
          ))}
        </View>
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <TextField
          label={t('mood.addNote')}
          value={note}
          onChangeText={setNote}
          placeholder="What’s going on? (optional)"
          multiline
        />
      </View>

      <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
        <Button label={t('common.save')} onPress={() => void handleSave()} loading={saving} />
        <Button
          label={t('home.insights')}
          variant="ghost"
          onPress={() => navigation.navigate('Insights')}
        />
      </View>

      {mood ? (
        <Text variant="caption" color="textFaint" center style={{ marginTop: theme.spacing.md }}>
          {MOOD_BY_KEY[mood].emoji} {MOOD_BY_KEY[mood].label} · intensity {intensity}/10
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
