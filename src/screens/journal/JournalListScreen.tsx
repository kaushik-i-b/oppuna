import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Button, Chip, Loading, Screen, Text, TextField } from '@/components';
import { journalRepository } from '@/database';
import { filterJournalEntries } from '@/database/repositories/journalRepository';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useTheme } from '@/theme/ThemeProvider';
import { CareHero, FadeInView, Icon, PressableScale, SectionLabel } from '@/ui';
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

  const isEmpty = entries !== null && entries.length === 0;

  return (
    <Screen
      title={t('journal.title')}
      scroll={!isEmpty && entries !== null}
      keyboardAvoiding
      headerRight={
        !isEmpty ? (
          <Pressable
            onPress={() => navigation.navigate('JournalEditor', { kind: 'daily' })}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('journal.new')}
          >
            <Icon name="plus" size={22} color={theme.colors.primary} />
          </Pressable>
        ) : null
      }
    >
      {entries === null ? (
        <Loading label={t('common.loading')} />
      ) : isEmpty ? (
        <View style={styles.empty}>
          <CareHero
            leafVariant="outline"
            leafSize={72}
            title="Your journal is empty"
            body="Writing a few honest lines can lighten the mind. Everything stays on this device."
          />
          <View style={{ alignSelf: 'stretch', paddingHorizontal: theme.spacing.lg }}>
            <Button
              label="Start writing"
              onPress={() => navigation.navigate('JournalEditor', { kind: 'daily' })}
            />
          </View>
        </View>
      ) : (
        <>
          <FadeInView delay={0} preset="fade">
            <Text variant="body" color="textSecondary" style={{ marginBottom: theme.spacing.lg }}>
              Your words, private on this device.
            </Text>
          </FadeInView>

          <FadeInView delay={60}>
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder={t('journal.searchPlaceholder')}
              autoCorrect={false}
              containerStyle={{ marginBottom: theme.spacing.md }}
            />
          </FadeInView>

          <FadeInView delay={100}>
            <SectionLabel>FILTER</SectionLabel>
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
          </FadeInView>

          {filtered.length === 0 ? (
            <View style={styles.emptyInline}>
              <Text variant="subtitle" center>
                No matching entries
              </Text>
              <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.sm }}>
                Try a different search or filter.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 4, marginTop: theme.spacing.sm }}>
              <SectionLabel>ENTRIES</SectionLabel>
              {filtered.map((entry, index) => (
                <FadeInView key={entry.id} delay={Math.min(120 + index * 40, 360)} preset="soft">
                  <PressableScale
                    onPress={() => navigation.navigate('JournalEditor', { id: entry.id })}
                    accessibilityRole="button"
                    accessibilityLabel={entry.title || 'Untitled'}
                    scaleTo={0.99}
                    style={[
                      styles.entryRow,
                      {
                        borderBottomColor: theme.colors.border,
                        paddingVertical: theme.spacing.md,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: theme.colors.primaryMuted },
                      ]}
                    >
                      <Icon name="journal" size={18} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {entry.title || 'Untitled'}
                      </Text>
                      <Text
                        variant="caption"
                        color="textMuted"
                        numberOfLines={1}
                        style={{ marginTop: 2 }}
                      >
                        {entry.body || 'No content'}
                      </Text>
                      <Text variant="label" color="textFaint" style={{ marginTop: 4 }}>
                        {relativeDay(entry.updatedAt)}
                      </Text>
                    </View>
                    <Icon name="chevron" size={18} color={theme.colors.textFaint} />
                  </PressableScale>
                </FadeInView>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 8, paddingBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyInline: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
