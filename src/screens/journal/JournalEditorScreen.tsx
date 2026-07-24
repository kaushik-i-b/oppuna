import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button, Chip, ConfirmDialog, Screen, Text, TextField } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { journalRepository } from '@/database';
import { isJournalEntryValid } from '@/database/repositories/journalRepository';
import { useSaveCelebration } from '@/hooks/useSaveCelebration';
import { useTranslation } from '@/hooks/useTranslation';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { randomPrompt } from '@/services/offlineAI';
import { recordCareActivity } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeInView, Icon, LivingLeaf, SectionLabel } from '@/ui';
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
  const { celebrate, celebration } = useSaveCelebration();
  useSecureScreen(true);

  const editingId = route.params?.id;
  const [kind, setKind] = useState<JournalKind>(route.params?.kind ?? 'daily');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(!editingId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      if (editingId) {
        await journalRepository.update(editingId, title, body);
      } else {
        await journalRepository.create({ kind, title, body });
        void recordCareActivity('journal');
      }
      await celebrate({
        kind: 'journal',
        message: t('journal.saved'),
        detail: title.trim() || 'Your words are safe on this device.',
      });
      navigation.goBack();
    } catch (error) {
      logger.error('Journal save failed', { error: String(error) });
      toast.show('Could not save your entry.', 'error');
    } finally {
      setSaving(false);
    }
  }, [editingId, kind, title, body, toast, t, navigation, celebrate]);

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
    <>
      <Screen
        title={editingId ? t('common.edit') : t('journal.new')}
        onBack={() => navigation.goBack()}
        padded={false}
        headerRight={
          editingId ? (
            <Pressable
              onPress={() => setConfirmDelete(true)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}
            >
              <Icon name="trash" size={22} color={theme.colors.danger} />
            </Pressable>
          ) : null
        }
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { padding: theme.spacing.lg }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loaded ? (
              <>
                <FadeInView delay={0} preset="fade">
                  <View style={styles.intro}>
                    <LivingLeaf size={40} variant="idle" showAura={false} />
                    <Text
                      variant="caption"
                      color="textMuted"
                      style={{ marginLeft: theme.spacing.md, flex: 1 }}
                    >
                      Write freely. Nothing leaves this device.
                    </Text>
                  </View>
                </FadeInView>

                {!editingId ? (
                  <FadeInView delay={60}>
                    <View style={{ marginBottom: theme.spacing.lg }}>
                      <SectionLabel>TYPE</SectionLabel>
                      <View style={styles.chipGrid}>
                        {KINDS.map((k) => (
                          <Chip
                            key={k.key}
                            label={k.label}
                            selected={kind === k.key}
                            onPress={() => setKind(k.key)}
                          />
                        ))}
                      </View>
                    </View>
                  </FadeInView>
                ) : null}

                <FadeInView delay={120}>
                  <TextField
                    label={t('journal.titlePlaceholder')}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Give it a title"
                    containerStyle={{ marginBottom: theme.spacing.lg }}
                  />

                  <View
                    style={[
                      styles.bodyShell,
                      {
                        backgroundColor: theme.colors.surfaceElevated,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.lg,
                        padding: theme.spacing.md,
                      },
                    ]}
                  >
                    <TextField
                      value={body}
                      onChangeText={setBody}
                      placeholder={t('journal.bodyPlaceholder')}
                      multiline
                    />
                  </View>
                </FadeInView>

                <FadeInView delay={180}>
                  <View style={{ marginTop: theme.spacing.md }}>
                    <Button
                      label={t('journal.prompt')}
                      variant="secondary"
                      onPress={insertPrompt}
                    />
                  </View>
                </FadeInView>
              </>
            ) : (
              <Text variant="body" color="textMuted">
                {t('common.loading')}
              </Text>
            )}
          </ScrollView>

          {loaded ? (
            <View
              style={[
                styles.footer,
                {
                  padding: theme.spacing.lg,
                  borderTopColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <Button label={t('common.save')} onPress={() => void handleSave()} loading={saving} />
            </View>
          ) : null}
        </KeyboardAvoidingView>

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
      {celebration}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bodyShell: { borderWidth: StyleSheet.hairlineWidth, minHeight: 180 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth },
});
