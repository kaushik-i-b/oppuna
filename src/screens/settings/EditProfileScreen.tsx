import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Chip, Screen, Text, TextField } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import type { RootStackParamList } from '@/navigation/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeInView, SectionLabel } from '@/ui';
import { logger } from '@/utils/logger';
import {
  generateTodayPlan,
  getWellnessPrefs,
  saveWellnessPrefs,
} from '@/wellness/planService';
import {
  DEFAULT_WELLNESS_MINUTES,
  WELLNESS_GOAL_OPTIONS,
  WELLNESS_MOOD_OPTIONS,
  WELLNESS_TIME_OPTIONS,
  togglePrefValue,
} from '@/wellness/prefOptions';
import type { WellnessGoalChip, WellnessMoodChip } from '@/wellness/types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export function EditProfileScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const storedName = useSettingsStore((s) => s.displayName);

  const [name, setName] = useState(storedName);
  const [moods, setMoods] = useState<WellnessMoodChip[]>([]);
  const [goals, setGoals] = useState<WellnessGoalChip[]>([]);
  const [minutes, setMinutes] = useState(DEFAULT_WELLNESS_MINUTES);
  const [refreshPlan, setRefreshPlan] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const prefs = await getWellnessPrefs();
      setName(storedName || prefs.displayName || '');
      setMoods(prefs.moods);
      setGoals(prefs.goals);
      setMinutes(prefs.availableMinutes || DEFAULT_WELLNESS_MINUTES);
    } catch (error) {
      logger.warn('Edit profile load failed', { error: String(error) });
    } finally {
      setLoading(false);
    }
  }, [storedName]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      const displayName = name.trim();
      setDisplayName(displayName);
      await saveWellnessPrefs({
        displayName,
        moods,
        goals,
        availableMinutes: minutes,
      });

      if (refreshPlan) {
        await generateTodayPlan({ force: true, personalize: true });
        toast.show('Profile saved. Today’s plan was refreshed.', 'success');
      } else {
        toast.show('Profile saved.', 'success');
      }
      navigation.goBack();
    } catch (error) {
      logger.error('Edit profile save failed', { error: String(error) });
      toast.show('Could not save your profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      title="Edit profile"
      onBack={() => navigation.goBack()}
      scroll
      keyboardAvoiding
    >
      {loading ? (
        <Text variant="body" color="textMuted">
          Loading…
        </Text>
      ) : (
        <FadeInView delay={20} preset="soft">
          <Text variant="body" color="textMuted" style={{ marginBottom: theme.spacing.lg }}>
            Update how Oppuna greets you and shapes your wellness plan. Everything stays on this
            device.
          </Text>

          <SectionLabel>NAME</SectionLabel>
          <View
            style={[
              styles.panel,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            <TextField
              label="First name (optional)"
              value={name}
              onChangeText={setName}
              placeholder="What should we call you?"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <SectionLabel>HOW YOU FEEL</SectionLabel>
          <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.sm }}>
            Optional — pick any that fit.
          </Text>
          <View style={[styles.chips, { marginBottom: theme.spacing.xl }]}>
            {WELLNESS_MOOD_OPTIONS.map((mood) => (
              <Chip
                key={mood.id}
                label={mood.label}
                selected={moods.includes(mood.id)}
                onPress={() => setMoods((prev) => togglePrefValue(prev, mood.id))}
              />
            ))}
          </View>

          <SectionLabel>GOALS</SectionLabel>
          <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.sm }}>
            Optional — choose what you want to work on.
          </Text>
          <View style={[styles.chips, { marginBottom: theme.spacing.xl }]}>
            {WELLNESS_GOAL_OPTIONS.map((goal) => (
              <Chip
                key={goal.id}
                label={goal.label}
                selected={goals.includes(goal.id)}
                onPress={() => setGoals((prev) => togglePrefValue(prev, goal.id))}
              />
            ))}
          </View>

          <SectionLabel>DAILY TIME</SectionLabel>
          <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.sm }}>
            How long should today’s plan take?
          </Text>
          <View style={[styles.chips, { marginBottom: theme.spacing.xl }]}>
            {WELLNESS_TIME_OPTIONS.map((option) => (
              <Chip
                key={option.minutes}
                label={`${option.minutes} min`}
                selected={minutes === option.minutes}
                onPress={() => setMinutes(option.minutes)}
              />
            ))}
          </View>

          <View
            style={[
              styles.refreshRow,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
              <Text variant="bodyStrong">Refresh today’s plan</Text>
              <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
                Rebuild today’s activities from your new preferences.
              </Text>
            </View>
            <Switch
              value={refreshPlan}
              onValueChange={setRefreshPlan}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              thumbColor={theme.colors.surface}
            />
          </View>

          <Button label="Save profile" onPress={() => void handleSave()} loading={saving} disabled={saving} />
          <View style={{ height: theme.spacing.md }} />
          <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} disabled={saving} />
        </FadeInView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
