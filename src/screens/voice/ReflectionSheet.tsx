import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { PatternReport, ReflectionMemory } from '@/voice/types';

export interface MemoryChoice {
  key: string;
  text: string;
  included: boolean;
}

interface Props {
  reflection: ReflectionMemory;
  editing: boolean;
  summary: string;
  realization: string;
  commitment: string;
  memories: MemoryChoice[];
  saving: boolean;
  saved: boolean;
  patterns: PatternReport | null;
  onChangeSummary: (value: string) => void;
  onChangeRealization: (value: string) => void;
  onChangeCommitment: (value: string) => void;
  onToggleMemory: (key: string) => void;
  onEditMemory: (key: string, text: string) => void;
  onRemoveSavedMemory: (text: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onForget: () => void;
}

export function ReflectionSheet({
  reflection,
  editing,
  summary,
  realization,
  commitment,
  memories,
  saving,
  saved,
  patterns,
  onChangeSummary,
  onChangeRealization,
  onChangeCommitment,
  onToggleMemory,
  onEditMemory,
  onRemoveSavedMemory,
  onSave,
  onEdit,
  onForget,
}: Props): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}>
      <View>
        <Text variant="caption" color="textFaint">
          Today’s reflection
        </Text>
        <Text variant="title" style={{ marginTop: theme.spacing.xs }}>
          {reflection.mood ? reflection.mood : 'Reflection'}
        </Text>
        {reflection.demoSeed ? (
          <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.xs }}>
            Demo seed
          </Text>
        ) : null}
      </View>

      {editing ? (
        <TextField label="Summary" value={summary} onChangeText={onChangeSummary} multiline />
      ) : (
        <Text variant="body">{summary}</Text>
      )}

      {reflection.themes.length > 0 ? (
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label" color="textMuted">
            Themes
          </Text>
          <View style={styles.wrap}>
            {reflection.themes.map((themeName) => (
              <View key={themeName} style={[styles.chip, { backgroundColor: theme.colors.surfaceAlt }]}>
                <Text variant="caption">{themeName}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {editing ? (
        <TextField label="Key realization" value={realization} onChangeText={onChangeRealization} multiline />
      ) : realization ? (
        <View>
          <Text variant="label" color="textMuted">
            Key realization
          </Text>
          <Text variant="body" style={{ marginTop: theme.spacing.xs }}>
            {realization}
          </Text>
        </View>
      ) : null}

      {editing ? (
        <TextField label="Commitment" value={commitment} onChangeText={onChangeCommitment} />
      ) : commitment ? (
        <View>
          <Text variant="label" color="textMuted">
            Commitment
          </Text>
          <Text variant="body" style={{ marginTop: theme.spacing.xs }}>
            {commitment}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="subtitle">What should Oppuna remember?</Text>
        <Text variant="caption" color="textMuted">
          Only checked lines are kept for later conversations. You can save the reflection with none of them.
        </Text>
        {memories.length === 0 ? (
          <Text variant="body" color="textMuted">
            No memory suggestions.
          </Text>
        ) : (
          memories.map((memory) => (
            <View key={memory.key} style={{ gap: theme.spacing.xs }}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: memory.included }}
                onPress={() => onToggleMemory(memory.key)}
                style={styles.memoryRow}
              >
                <Text variant="body">{memory.included ? '☑' : '☐'}</Text>
                {editing ? null : (
                  <Text variant="body" style={{ flex: 1 }}>
                    {memory.text}
                  </Text>
                )}
              </Pressable>
              {editing ? (
                <TextField value={memory.text} onChangeText={(text) => onEditMemory(memory.key, text)} />
              ) : null}
            </View>
          ))
        )}
        {saved
          ? reflection.approvedMemories.map((memory) => (
              <Pressable key={memory} onPress={() => onRemoveSavedMemory(memory)} accessibilityRole="button">
                <Text variant="caption" color="textMuted">
                  Remove “{memory}”
                </Text>
              </Pressable>
            ))
          : null}
      </View>

      {patterns?.sufficient ? (
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="label" color="textMuted">
            {patterns.period === '30d' ? 'Last 30 days' : 'Last 7 days'}
          </Text>
          {patterns.trends.map((trend) => (
            <Text key={`${trend.label}-${trend.detail}`} variant="body">
              {trend.label} · {trend.detail}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label={saved ? 'Saved' : 'Save reflection'}
          onPress={onSave}
          loading={saving}
          disabled={saved || saving || summary.trim().length === 0}
        />
        <Button label={editing ? 'Done editing' : 'Edit'} variant="secondary" onPress={onEdit} />
        <Button label="Forget conversation" variant="ghost" onPress={onForget} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  memoryRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
