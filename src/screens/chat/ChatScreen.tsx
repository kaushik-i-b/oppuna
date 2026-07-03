import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button, ChatBubble, Chip, ConfirmDialog, Screen, Text, TextField } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { chatRepository, safetyRepository } from '@/database';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { generateAIResponse, resetConversationMemory } from '@/ai';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import type { ChatMessage } from '@/types';
import type { ModelStatus } from '@/ai/types';
import type { TranslationKey } from '@/i18n';

function modelStatusLabel(status: ModelStatus, t: (key: TranslationKey) => string): string | null {
  switch (status) {
    case 'checking':
    case 'loading':
      return t('chat.modelLoading');
    case 'unavailable':
      return t('chat.modelUnavailable');
    case 'error':
      return t('chat.modelError');
    default:
      return null;
  }
}

export function ChatScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const navigation = useAppNavigation();
  const modelState = useModelStatus();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const streamingIdRef = useRef<string | null>(null);

  const statusLabel = modelStatusLabel(modelState.status, t);
  const showStatusSpinner =
    modelState.status === 'checking' || modelState.status === 'loading';

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const sessions = await chatRepository.listSessions();
        const session = sessions[0] ?? (await chatRepository.createSession());
        if (!active) return;
        setSessionId(session.id);
        setMessages(await chatRepository.listMessages(session.id));
      } catch (error) {
        logger.error('Chat init failed', { error: String(error) });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId || sending) return;
      setSending(true);
      setInput('');
      setSuggestions([]);

      try {
        const userMessage = await chatRepository.addMessage({
          sessionId,
          role: 'user',
          content: trimmed,
        });
        setMessages((prev) => [...prev, userMessage]);
        scrollToEnd();

        const streamId =
          modelState.status === 'ready' ? `stream-${Date.now()}` : null;
        streamingIdRef.current = streamId;

        if (streamId) {
          const placeholder: ChatMessage = {
            id: streamId,
            sessionId,
            role: 'assistant',
            content: '',
            intent: null,
            mood: null,
            createdAt: Date.now(),
          };
          setMessages((prev) => [...prev, placeholder]);
          scrollToEnd();
        }

        const response = await generateAIResponse(
          { sessionId, text: trimmed },
          streamId
            ? {
                onToken: (token) => {
                  const activeId = streamingIdRef.current;
                  if (!activeId) return;
                  setMessages((prev) =>
                    prev.map((message) =>
                      message.id === activeId
                        ? { ...message, content: message.content + token }
                        : message,
                    ),
                  );
                },
              }
            : undefined,
        );

        streamingIdRef.current = null;

        if (response.crisis) {
          if (streamId) {
            setMessages((prev) => prev.filter((message) => message.id !== streamId));
          }
          await safetyRepository.record(response.crisis);
          await chatRepository.addMessage({
            sessionId,
            role: 'assistant',
            content: response.reply,
            intent: 'crisis',
            mood: response.mood,
          });
          navigation.navigate('Crisis', { category: response.crisis });
          return;
        }

        if (streamId) {
          setMessages((prev) => prev.filter((message) => message.id !== streamId));
        }

        const assistantMessage = await chatRepository.addMessage({
          sessionId,
          role: 'assistant',
          content: response.reply,
          intent: response.intent,
          mood: response.mood,
        });
        setMessages((prev) => [...prev, assistantMessage]);
        setSuggestions(response.suggestions);
        scrollToEnd();
      } catch (error) {
        logger.error('Send failed', { error: String(error) });
        toast.show('Something went wrong. Please try again.', 'error');
      } finally {
        setSending(false);
      }
    },
    [sessionId, sending, navigation, scrollToEnd, toast, modelState.status],
  );

  const handleClear = useCallback(async () => {
    setConfirmClear(false);
    if (!sessionId) return;
    try {
      await chatRepository.clearSession(sessionId);
      resetConversationMemory(sessionId);
      setMessages([]);
      setSuggestions([]);
      toast.show(t('chat.cleared'), 'success');
    } catch (error) {
      logger.error('Clear chat failed', { error: String(error) });
    }
  }, [sessionId, toast, t]);

  return (
    <Screen
      title={t('chat.title')}
      padded={false}
      keyboardAvoiding
      headerRight={
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <Pressable
            onPress={() => navigation.navigate('VoiceMode')}
            accessibilityRole="button"
            accessibilityLabel="Voice mode"
            hitSlop={10}
          >
            <Text variant="subtitle">🎙️</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmClear(true)}
            accessibilityRole="button"
            accessibilityLabel={t('chat.clear')}
            hitSlop={10}
          >
            <Text variant="subtitle">🧹</Text>
          </Pressable>
        </View>
      }
    >
      {statusLabel ? (
        <View
          style={[
            styles.modelStatus,
            {
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
              backgroundColor: theme.colors.surfaceAlt,
              borderBottomColor: theme.colors.border,
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={statusLabel}
        >
          {showStatusSpinner ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
          ) : null}
          <Text
            variant="caption"
            color={modelState.status === 'error' ? 'danger' : 'textMuted'}
            style={{ flex: 1 }}
          >
            {statusLabel}
          </Text>
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={{ padding: theme.spacing.lg, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: theme.spacing.xxxl }}>
            <Text variant="display" center>
              🌿
            </Text>
            <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.md }}>
              {t('chat.intro')}
            </Text>
          </View>
        }
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
      />

      {suggestions.length > 0 ? (
        <View style={[styles.suggestions, { paddingHorizontal: theme.spacing.lg }]}>
          {suggestions.map((s) => (
            <Chip key={s} label={s} onPress={() => void handleSend(s)} />
          ))}
        </View>
      ) : null}

      <View
        style={[
          styles.inputBar,
          { padding: theme.spacing.md, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={{ flex: 1 }}>
          <TextField
            value={input}
            onChangeText={setInput}
            placeholder={t('chat.placeholder')}
            multiline
            onSubmitEditing={() => void handleSend(input)}
            blurOnSubmit={false}
          />
        </View>
        <View style={{ width: 96 }}>
          <Button
            label="Send"
            size="md"
            onPress={() => void handleSend(input)}
            disabled={!input.trim()}
            loading={sending}
          />
        </View>
      </View>

      <ConfirmDialog
        visible={confirmClear}
        title={t('chat.clear')}
        message="This removes the messages in this conversation from your device."
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={() => void handleClear()}
        onCancel={() => setConfirmClear(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  modelStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1 },
});
