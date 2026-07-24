import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Chip, ConfirmDialog, Screen, SectionHeader, Text, TextField } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { journalRepository } from '@/database';
import { isJournalEntryValid } from '@/database/repositories/journalRepository';
import { useTranslation } from '@/hooks/useTranslation';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { randomPrompt } from '@/services/offlineAI';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { JournalKind } from '@/types';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JournalEditor'>;

const KINDS: { key: JournalKind; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'gratitude', label: 'Gratitude' },
  { key: 'thought_record', label: 'Thought record' },
  { key: 'trigger', label: 'Trigger' },
  { key: 'note', label: 'Note' },
];

export function JournalEditorScreen({ navigation, route }: Props): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  useSecureScreen(true);

  const editingId = route.params?.id;
  const [kind, setKind] = useState<JournalKind>(route.params?.kind ?? 'daily');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(!editingId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    let active = true;
    journalRepository
      .getById(editingId)
      .then((entry) => {
        if (!active || !entry) return;
        setKind(entry.kind);
        setTitle(entry.title);
        setBody(entry.body);
        setLoaded(true);
      })
      .catch((error) => logger.error('Journal entry load failed', { error: String(error) }));
    return () => {
      active = false;
    };
  }, [editingId]);

  const handleSave = useCallback(async () => {
    if (!isJournalEntryValid(title, body)) {
      toast.show('Write a title or a few words first.', 'info');
      return;
    }
    try {
      if (editingId) {
        await journalRepository.update(editingId, title, body);
      } else {
        await journalRepository.create({ kind, title, body });
      }
      toast.show(t('journal.saved'), 'success');
      navigation.goBack();
    } catch (error) {
      logger.error('Journal save failed', { error: String(error) });
      toast.show('Could not save your entry.', 'error');
    }
  }, [editingId, kind, title, body, toast, t, navigation]);

  const handleDelete = useCallback(async () => {
    setConfirmDelete(false);
    if (!editingId) return;
    try {
      await journalRepository.remove(editingId);
      toast.show(t('journal.deleted'), 'success');
      navigation.goBack();
    } catch (error) {
      logger.error('Journal delete failed', { error: String(error) });
    }
  }, [editingId, toast, t, navigation]);

  const insertPrompt = useCallback(() => {
    const prompt = randomPrompt();
    setBody((prev) => (prev ? `${prev}\n\n${prompt}\n` : `${prompt}\n`));
  }, []);

  return (
    <Screen
      title={editingId ? t('common.edit') : t('journal.new')}
      onBack={() => navigation.goBack()}
      keyboardAvoiding
      scroll
      headerRight={
        editingId ? (
          <Text variant="subtitle" onPress={() => setConfirmDelete(true)} accessibilityRole="button">
            🗑️
          </Text>
        ) : null
      }
    >
      {loaded ? (
        <>
          {!editingId ? (
            <View style={{ marginBottom: theme.spacing.lg }}>
              <SectionHeader title="Type" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {KINDS.map((k) => (
                  <Chip key={k.key} label={k.label} selected={kind === k.key} onPress={() => setKind(k.key)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <TextField
            label={t('journal.titlePlaceholder')}
            value={title}
            onChangeText={setTitle}
            placeholder="Give it a title"
            containerStyle={{ marginBottom: theme.spacing.lg }}
          />

          <TextField
            value={body}
            onChangeText={setBody}
            placeholder={t('journal.bodyPlaceholder')}
            multiline
          />

          <View style={{ marginTop: theme.spacing.md }}>
            <Button label={`💡 ${t('journal.prompt')}`} variant="ghost" onPress={insertPrompt} />
          </View>

          <View style={{ marginTop: theme.spacing.lg }}>
            <Button label={t('common.save')} onPress={() => void handleSave()} />
          </View>
        </>
      ) : (
        <Text variant="body" color="textMuted">
          {t('common.loading')}
        </Text>
      )}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this entry?"
        message="This journal entry will be permanently removed from your device."
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}
