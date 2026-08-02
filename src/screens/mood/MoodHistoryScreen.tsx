import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Card, ConfirmDialog, EmptyState, Loading, Screen, Text } from '@/components';
import { MOOD_BY_KEY, MOOD_TAGS } from '@/constants/moods';
import { moodRepository } from '@/database';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { Icon, MoodMark } from '@/ui';
import { formatDateTime } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { MoodEntry } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MoodHistory'>;

function tagLabel(key: string): string {
  return MOOD_TAGS.find((t) => t.key === key)?.label ?? key;
}

export function MoodHistoryScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<MoodEntry[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MoodEntry | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await moodRepository.list());
    } catch (error) {
      logger.error('Mood history load failed', { error: String(error) });
      setEntries([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      await moodRepository.remove(pendingDelete.id);
      setEntries((prev) => prev?.filter((e) => e.id !== pendingDelete.id) ?? null);
    } catch (error) {
      logger.warn('Delete mood failed', { error: String(error) });
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete]);

  return (
    <Screen
      title={t('mood.history')}
      onBack={() => navigation.goBack()}
      padded={false}
      scroll={entries !== null && entries.length > 0}
    >
      {entries === null ? (
        <Loading label={t('common.loading')} />
      ) : entries.length === 0 ? (
        <EmptyState icon="mood" title={t('mood.noData')} />
      ) : (
        <View style={{ flex: 1 }}>
          {entries.map((entry) => {
            const meta = MOOD_BY_KEY[entry.mood];
            return (
              <View key={entry.id} style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
                    <MoodMark mood={entry.mood} size={28} color={theme.colors[meta.colorKey]} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">
                        {meta.label} · {entry.intensity}/10
                      </Text>
                      <Text variant="caption" color="textMuted">
                        {formatDateTime(entry.createdAt)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setPendingDelete(entry)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Delete entry"
                    >
                      <Icon name="trash" size={20} color={theme.colors.danger} />
                    </Pressable>
                  </View>
                  {entry.note ? (
                    <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.sm }}>
                      {entry.note}
                    </Text>
                  ) : null}
                  {entry.tags.length > 0 ? (
                    <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
                      {entry.tags.map(tagLabel).join(' · ')}
                    </Text>
                  ) : null}
                </Card>
              </View>
            );
          })}
          <View style={{ height: theme.spacing.xl }} />
        </View>
      )}

      <ConfirmDialog
        visible={pendingDelete !== null}
        title="Delete this entry?"
        message="This mood check-in will be permanently removed from your device."
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}
