import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatBubble, Chip, ConfirmDialog, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { chatRepository, safetyRepository } from '@/database';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { useModelStatus } from '@/hooks/useModelStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { useHaptics } from '@/hooks/useHaptics';
import { cancelGeneration, generateAIResponse, resetConversationMemory } from '@/ai';
import { DEFAULT_AGENT_ID } from '@/ai/agents';
import { useTheme } from '@/theme/ThemeProvider';
import { logger } from '@/utils/logger';
import { ChatComposer, FadeInView, Icon, LivingLeaf, PressableScale, StatusPill } from '@/ui';
import type { ChatMessage } from '@/types';
import type { AIMessage, LocalModelStatus } from '@/ai/types';

const STREAM_FLUSH_MS = 40;

const STARTERS = [
  { label: 'I feel anxious', text: 'I feel anxious and could use some support.' },
  { label: 'I need to talk', text: 'I need to talk about something on my mind.' },
  { label: 'Help me slow down', text: 'Help me slow down and feel a bit calmer.' },
] as const;

function privacyPill(
  status: LocalModelStatus,
): { label: string; tone: 'primary' | 'neutral' | 'warning' } {
  if (status === 'ready' || status === 'generating') {
    return { label: 'Private & offline', tone: 'primary' };
  }
  if (status === 'locating' || status === 'verifying' || status === 'loading') {
    return { label: 'Preparing…', tone: 'neutral' };
  }
  return { label: 'Guided offline mode', tone: 'neutral' };
}

function toAgentMessage(message: ChatMessage): AIMessage {
  return {
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

export function ChatScreen(): React.ReactElement {
  const theme = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  useSecureScreen(true);
  const navigation = useAppNavigation();
  const modelState = useModelStatus();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const streamingIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingRef = useRef(false);
  const mountedRef = useRef(true);
  const stickToBottomRef = useRef(true);

  const pill = privacyPill(modelState.status);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      void cancelGeneration().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const onAppState = (next: AppStateStatus): void => {
      if (next === 'background' || next === 'inactive') {
        if (sendingRef.current) {
          void cancelGeneration().catch(() => undefined);
        }
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, []);

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

  const scrollToEnd = useCallback((animated = true) => {
    if (!stickToBottomRef.current) return;
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  }, []);

  const flushStreamBuffer = useCallback(() => {
    const activeId = streamingIdRef.current;
    const chunk = streamBufferRef.current;
    streamBufferRef.current = '';
    flushTimerRef.current = null;
    if (!activeId || !chunk || !mountedRef.current) return;
    setMessages((prev) =>
      prev.map((message) =>
        message.id === activeId ? { ...message, content: message.content + chunk } : message,
      ),
    );
  }, []);

  const enqueueToken = useCallback(
    (token: string) => {
      streamBufferRef.current += token;
      if (flushTimerRef.current) return;
      flushTimerRef.current = setTimeout(flushStreamBuffer, STREAM_FLUSH_MS);
    },
    [flushStreamBuffer],
  );

  const clearStreamingPlaceholder = useCallback((streamId: string | null) => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    streamBufferRef.current = '';
    streamingIdRef.current = null;
    if (!streamId) return;
    setMessages((prev) => prev.filter((message) => message.id !== streamId));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !sessionId || sendingRef.current) return;
      sendingRef.current = true;
      setSending(true);
      setInput('');
      setSuggestions([]);
      stickToBottomRef.current = true;
      setUserScrolledUp(false);
      void haptics.selection();

      let streamId: string | null = null;

      try {
        const userMessage = await chatRepository.addMessage({
          sessionId,
          role: 'user',
          content: trimmed,
        });
        const agentHistory = messages.map(toAgentMessage);
        setMessages((prev) => [...prev, userMessage]);
        scrollToEnd();

        const canStream =
          modelState.status === 'ready' || modelState.status === 'generating';
        streamId = canStream ? `stream-${Date.now()}` : null;
        streamingIdRef.current = streamId;
        streamBufferRef.current = '';

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
          {
            sessionId,
            text: trimmed,
            agentId: DEFAULT_AGENT_ID,
            recentMessages: agentHistory,
          },
          streamId
            ? {
                onToken: (token) => {
                  if (!mountedRef.current || streamingIdRef.current !== streamId) return;
                  enqueueToken(token);
                },
              }
            : undefined,
        );

        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
        flushStreamBuffer();

        if (!mountedRef.current) {
          clearStreamingPlaceholder(streamId);
          return;
        }

        if (response.crisis) {
          clearStreamingPlaceholder(streamId);
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

        clearStreamingPlaceholder(streamId);

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
        clearStreamingPlaceholder(streamId);
        logger.error('Send failed', { error: String(error) });
        toast.show('Something went wrong. Please try again.', 'error');
      } finally {
        sendingRef.current = false;
        if (mountedRef.current) setSending(false);
      }
    },
    [
      sessionId,
      messages,
      navigation,
      scrollToEnd,
      toast,
      modelState.status,
      enqueueToken,
      flushStreamBuffer,
      clearStreamingPlaceholder,
      haptics,
    ],
  );

  const handleCancel = useCallback(async () => {
    await cancelGeneration().catch(() => undefined);
  }, []);

  const handleClear = useCallback(async () => {
    setConfirmClear(false);
    if (!sessionId) return;
    try {
      await cancelGeneration().catch(() => undefined);
      await chatRepository.clearSession(sessionId);
      resetConversationMemory(sessionId);
      setMessages([]);
      setSuggestions([]);
      toast.show(t('chat.cleared'), 'success');
    } catch (error) {
      logger.error('Clear chat failed', { error: String(error) });
    }
  }, [sessionId, toast, t]);

  const thinking =
    sending &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    !messages[messages.length - 1]?.content;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.headerBrand}>
          <LivingLeaf
            size={36}
            variant={thinking ? 'thinking' : 'idle'}
            showAura={false}
          />
          <View style={{ flex: 1, gap: 4, marginLeft: theme.spacing.sm }}>
            <Text variant="title" style={{ fontSize: theme.fontSize.xl, fontWeight: '700' }}>
              Oppuna
            </Text>
            <StatusPill label={pill.label} tone={pill.tone} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' }}>
          <PressableScale
            onPress={() => navigation.navigate('VoiceMode')}
            accessibilityRole="button"
            accessibilityLabel="Voice mode"
            style={[styles.headerBtn, { backgroundColor: theme.colors.surfaceInteractive }]}
          >
            <Icon name="mic" size={20} color={theme.colors.textMuted} />
          </PressableScale>
          <PressableScale
            onPress={() => setConfirmClear(true)}
            accessibilityRole="button"
            accessibilityLabel={t('chat.clear')}
            style={[styles.headerBtn, { backgroundColor: theme.colors.surfaceInteractive }]}
          >
            <Icon name="trash" size={20} color={theme.colors.textMuted} />
          </PressableScale>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ChatBubble message={item} />}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.md,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <FadeInView delay={40} preset="soft" style={styles.empty}>
              <View
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: theme.colors.surfaceElevated,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.xl,
                    padding: theme.spacing.xl,
                    ...theme.shadow,
                  },
                ]}
              >
                <LivingLeaf size={88} variant="greet" />
                <Text
                  variant="title"
                  center
                  style={{ marginTop: theme.spacing.lg, fontSize: theme.fontSize.xl }}
                >
                  What&apos;s on your mind?
                </Text>
                <Text
                  variant="body"
                  color="textMuted"
                  center
                  style={{ marginTop: theme.spacing.sm, maxWidth: 280 }}
                >
                  You don&apos;t need to make sense of it before you start. I&apos;m here to listen.
                </Text>
                <View
                  style={[
                    styles.starters,
                    { marginTop: theme.spacing.xl, gap: theme.spacing.sm },
                  ]}
                >
                  {STARTERS.map((s) => (
                    <PressableScale
                      key={s.label}
                      onPress={() => void handleSend(s.text)}
                      accessibilityRole="button"
                      accessibilityLabel={s.label}
                      style={[
                        styles.starterChip,
                        {
                          backgroundColor: theme.colors.primaryMuted,
                          borderRadius: theme.radius.pill,
                          paddingHorizontal: theme.spacing.lg,
                          paddingVertical: theme.spacing.sm,
                        },
                      ]}
                    >
                      <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                        {s.label}
                      </Text>
                    </PressableScale>
                  ))}
                </View>
              </View>
            </FadeInView>
          }
          ListFooterComponent={
            thinking ? (
              <View
                style={[
                  styles.thinkingRow,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <LivingLeaf size={28} variant="thinking" showAura={false} />
                <Text variant="caption" color="textMuted">
                  Oppuna is thinking
                </Text>
              </View>
            ) : null
          }
          onContentSizeChange={() => scrollToEnd(false)}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const distance =
              contentSize.height - layoutMeasurement.height - contentOffset.y;
            const nearBottom = distance < 80;
            stickToBottomRef.current = nearBottom;
            setUserScrolledUp(!nearBottom);
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          maintainVisibleContentPosition={
            Platform.OS === 'ios' ? { minIndexForVisible: 0 } : undefined
          }
        />

        {userScrolledUp ? (
          <PressableScale
            onPress={() => {
              stickToBottomRef.current = true;
              setUserScrolledUp(false);
              listRef.current?.scrollToEnd({ animated: true });
            }}
            style={[
              styles.jumpLatest,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Jump to latest messages"
          >
            <Text variant="caption" color="primary">
              Latest
            </Text>
          </PressableScale>
        ) : null}

        {suggestions.length > 0 ? (
          <View
            style={[
              styles.suggestions,
              { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm },
            ]}
          >
            {suggestions.map((s) => (
              <Chip key={s} label={s} onPress={() => void handleSend(s)} />
            ))}
          </View>
        ) : null}

        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
            backgroundColor: theme.colors.background,
          }}
        >
          <ChatComposer
            value={input}
            onChangeText={setInput}
            onSend={() => void handleSend(input)}
            onCancel={() => void handleCancel()}
            placeholder={t('chat.placeholder')}
            sending={sending}
          />
        </View>
      </KeyboardAvoidingView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCard: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: 360,
  },
  starters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  starterChip: {},
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  jumpLatest: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
