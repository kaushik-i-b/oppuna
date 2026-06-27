import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, Chip, EmptyState, Loading, Screen, Text, TextField } from '@/components';
import { journalRepository } from '@/database';
import { filterJournalEntries } from '@/database/repositories/journalRepository';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { relativeDay } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { JournalEntry, JournalKind } from '@/types';

const KIND_FILTERS: { key: JournalKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'daily', label: 'Daily' },
  { key: 'gratitude', label: 'Gratitude' },
  { key: 'thought_record', label: 'Thoughts' },
  { key: 'trigger', label: 'Triggers' },
  { key: 'note', label: 'Notes' },
];

const KIND_EMOJI: Record<JournalKind, string> = {
  daily: '📖',
  gratitude: '🙏',
  thought_record: '🧠',
  trigger: '⚡',
  note: '📝',
};

export function JournalListScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useAppNavigation();

  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<JournalKind | 'all'>('all');

  const load = useCallback(async () => {
    try {
      setEntries(await journalRepository.list());
    } catch (error) {
      logger.error('Journal load failed', { error: String(error) });
      setEntries([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const filtered = useMemo(
    () => (entries ? filterJournalEntries(entries, query, kind) : []),
    [entries, query, kind],
  );

  return (
    <Screen
      title={t('journal.title')}
      keyboardAvoiding
      headerRight={
        <Pressable
          onPress={() => navigation.navigate('JournalEditor', { kind: 'daily' })}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('journal.new')}
        >
          <Text variant="subtitle" color="primary">
            + New
          </Text>
        </Pressable>
      }
    >
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder={t('journal.searchPlaceholder')}
        autoCorrect={false}
        containerStyle={{ marginBottom: theme.spacing.md }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {KIND_FILTERS.map((filter) => (
          <Chip
            key={filter.key}
            label={filter.label}
            selected={kind === filter.key}
            onPress={() => setKind(filter.key)}
          />
        ))}
      </ScrollView>

      {entries === null ? (
        <Loading label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          emoji="📓"
          title={query || kind !== 'all' ? 'No matching entries' : 'Your journal is empty'}
          description={query || kind !== 'all' ? undefined : 'Writing a few honest lines can lighten the mind.'}
          actionLabel={query || kind !== 'all' ? undefined : t('journal.new')}
          onAction={query || kind !== 'all' ? undefined : () => navigation.navigate('JournalEditor', { kind: 'daily' })}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}>
          {filtered.map((entry) => (
            <Card key={entry.id} onPress={() => navigation.navigate('JournalEditor', { id: entry.id })}>
              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                <Text variant="subtitle">{KIND_EMOJI[entry.kind]}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {entry.title || 'Untitled'}
                  </Text>
                  <Text variant="caption" color="textMuted" numberOfLines={2} style={{ marginTop: 2 }}>
                    {entry.body || 'No content'}
                  </Text>
                  <Text variant="label" color="textFaint" style={{ marginTop: 6 }}>
                    {relativeDay(entry.updatedAt)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingBottom: 12 },
});
