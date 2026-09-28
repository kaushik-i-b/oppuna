import React, { useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { assessSafety } from '@/ai';
import { Button, Text } from '@/components';
import { moodRepository, reflectionRepository, safetyRepository } from '@/database';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { navigateRoot } from '@/navigation/rootNavigation';
import { useTheme } from '@/theme/ThemeProvider';
import { createId } from '@/utils/id';
import {
  AssemblyAIVoiceService,
  createBrowserSocketFactory,
  type VoiceRuntimeEvent,
} from '@/voice/AssemblyAIVoiceService';
import { createWebAudioPort } from '@/voice/audio/webAudioPort';
import { seedDemoReflections } from '@/voice/demoSeed';
import { moodKeyForVoice } from '@/voice/moodMap';
import { buildSystemPrompt } from '@/voice/prompt';
import { resolveApprovedMemories, retrieveApprovedMemories } from '@/voice/reflectionMemory';
import { reduceVoicePhase, type VoiceEvent } from '@/voice/stateMachine';
import { removeTranscriptLine, upsertTranscriptLine } from '@/voice/transcript';
import { PHASE_LABEL, type PatternReport, type ReflectionMemory, type TranscriptLine, type VoicePhase } from '@/voice/types';
import { fetchVoiceToken } from '@/voice/voiceTokenClient';
import { voiceLog } from '@/voice/voiceLog';
import { HowVoiceWorks } from '@/screens/voice/HowVoiceWorks';
import { ReflectionSheet, type MemoryChoice } from '@/screens/voice/ReflectionSheet';
import { VoiceOrb } from '@/screens/voice/VoiceOrb';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TalkToOppuna'>;

function choicesFor(reflection: ReflectionMemory): MemoryChoice[] {
  return reflection.memoryCandidates.map((text, index) => ({
    key: `${reflection.id}-${index}`,
    text,
    included: true,
  }));
}

export function TalkToOppunaScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  useSecureScreen(true);

  const [phase, setPhase] = useState<VoicePhase>('IDLE');
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReflectionMemory | null>(null);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState('');
  const [realization, setRealization] = useState('');
  const [commitment, setCommitment] = useState('');
  const [memories, setMemories] = useState<MemoryChoice[]>([]);
  const [saved, setSaved] = useState(false);
  const [patterns, setPatterns] = useState<PatternReport | null>(null);
  const [seedNote, setSeedNote] = useState<string | null>(null);

  const serviceRef = useRef<AssemblyAIVoiceService | null>(null);
  const sessionIdRef = useRef(createId());
  const draftRef = useRef<ReflectionMemory | null>(null);
  const closingRef = useRef(false);
  const bootRef = useRef(0);
  const handlerRef = useRef<(event: VoiceRuntimeEvent) => void>(() => undefined);

  const dispatch = (event: VoiceEvent): void => {
    setPhase((current) => reduceVoicePhase(current, event));
  };

  handlerRef.current = (event) => {
    switch (event.type) {
      case 'connecting':
        setError(null);
        setPhase((current) => reduceVoicePhase(reduceVoicePhase(current, { type: 'END' }), { type: 'START' }));
        return;
      case 'session_ready':
        dispatch({ type: 'SESSION_READY' });
        return;
      case 'connect_failed':
        setError(event.message);
        dispatch({ type: 'CONNECT_FAILED' });
        return;
      case 'failed':
        setError(event.message);
        dispatch({ type: 'FAIL' });
        return;
      case 'speech_started':
        dispatch({ type: 'SPEECH_STARTED' });
        return;
      case 'speech_stopped':
        dispatch({ type: 'SPEECH_STOPPED' });
        return;
      case 'user_partial':
        setLines((current) =>
          upsertTranscriptLine(current, {
            id: event.turnId,
            role: 'user',
            text: event.text,
            partial: true,
          }),
        );
        return;
      case 'user_final': {
        if (!event.text.trim()) {
          setLines((current) => removeTranscriptLine(current, event.turnId));
          dispatch({ type: 'EMPTY_TRANSCRIPT' });
          return;
        }
        const crisis = assessSafety(event.text).crisis;
        if (crisis) {
          void safetyRepository.record(crisis).catch(() => undefined);
          void serviceRef.current?.end({ notify: false });
          navigateRoot('Crisis', { category: crisis });
          return;
        }
        setLines((current) =>
          upsertTranscriptLine(current, {
            id: event.turnId,
            role: 'user',
            text: event.text,
            partial: false,
          }),
        );
        void reflectionRepository
          .appendTranscript(sessionIdRef.current, 'user', event.text)
          .catch(() => undefined);
        return;
      }
      case 'reply_started':
        dispatch({ type: 'REPLY_STARTED' });
        return;
      case 'reply_completed':
        dispatch({ type: 'REPLY_COMPLETED' });
        if (draftRef.current && !closingRef.current) {
          closingRef.current = true;
          void serviceRef.current?.end();
        }
        return;
      case 'reply_interrupted':
        dispatch({ type: 'REPLY_INTERRUPTED' });
        return;
      case 'playback_cleared':
        dispatch({ type: 'PLAYBACK_CLEARED' });
        return;
      case 'agent_transcript':
        if (!event.text.trim()) return;
        setLines((current) =>
          upsertTranscriptLine(current, {
            id: `oppuna-${event.replyId || event.text.slice(0, 12)}`,
            role: 'oppuna',
            text: event.text.trim(),
            partial: false,
          }),
        );
        void reflectionRepository
          .appendTranscript(sessionIdRef.current, 'oppuna', event.text.trim())
          .catch(() => undefined);
        return;
      case 'tool_effect':
        if (event.effect.type === 'reflection_draft') {
          const reflection = event.effect.reflection;
          draftRef.current = reflection;
          setDraft(reflection);
          setSummary(reflection.summary);
          setRealization(reflection.realization);
          setCommitment(reflection.commitments[0] ?? '');
          setMemories(choicesFor(reflection));
          setSaved(false);
          setEditing(false);
          serviceRef.current?.interruptPlayback();
        } else if (event.effect.type === 'patterns') {
          setPatterns(event.effect.report);
        }
        return;
      case 'ended':
        dispatch({ type: 'END' });
        return;
      default:
        return;
    }
  };

  const begin = async (): Promise<void> => {
    const boot = bootRef.current + 1;
    bootRef.current = boot;
    setError(null);
    setLines([]);
    setDraft(null);
    draftRef.current = null;
    setSaved(false);
    setPatterns(null);
    closingRef.current = false;
    const sessionId = createId();
    sessionIdRef.current = sessionId;
    await reflectionRepository.ensureSession(sessionId).catch(() => undefined);
    if (bootRef.current !== boot) return;
    await serviceRef.current?.end({ notify: false }).catch(() => undefined);
    if (bootRef.current !== boot) return;
    const service = new AssemblyAIVoiceService({
      fetchToken: fetchVoiceToken,
      sockets: createBrowserSocketFactory(),
      audio: createWebAudioPort(),
      store: reflectionRepository,
      localSessionId: sessionId,
      buildPrompt: async () => {
        const memories = retrieveApprovedMemories(await reflectionRepository.listReflections(), {
          limit: 6,
        });
        return buildSystemPrompt(memories);
      },
      onEvent: (runtimeEvent) => handlerRef.current(runtimeEvent),
    });
    serviceRef.current = service;
    await service.start();
    if (bootRef.current !== boot) {
      await service.end({ notify: false }).catch(() => undefined);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await begin();
    })();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        void serviceRef.current?.pauseForBackground();
      } else if (next === 'active') {
        void serviceRef.current?.resumeFromBackground();
      }
    });
    return () => {
      active = false;
      bootRef.current += 1;
      subscription.remove();
      void serviceRef.current?.end({ notify: false });
    };
  }, []);

  useEffect(() => {
    if (phase !== 'CONNECTING' && phase !== 'THINKING' && phase !== 'SAVING' && phase !== 'INTERRUPTED') {
      return undefined;
    }
    const delay = phase === 'CONNECTING' ? 15000 : phase === 'SAVING' ? 10000 : phase === 'INTERRUPTED' ? 1500 : 22000;
    const timer = setTimeout(() => {
      setPhase((current) => reduceVoicePhase(current, { type: 'TIMEOUT' }));
      if (phase === 'CONNECTING') {
        setError('The connection took too long. You can try again.');
      } else if (phase === 'SAVING') {
        setError('Saving did not finish. Your reflection is still here.');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [phase]);

  const latestUser = [...lines].reverse().find((line) => line.role === 'user');
  const latestOppuna = [...lines].reverse().find((line) => line.role === 'oppuna');

  const finish = (): void => {
    void serviceRef.current?.end();
    navigation.goBack();
  };

  const forget = async (): Promise<void> => {
    await reflectionRepository.forgetConversation(sessionIdRef.current);
    draftRef.current = null;
    setDraft(null);
    setLines([]);
    setMemories([]);
    await serviceRef.current?.end();
    navigation.goBack();
  };

  const save = async (): Promise<void> => {
    if (!draft || saved) return;
    dispatch({ type: 'BEGIN_SAVE' });
    try {
      const approved = resolveApprovedMemories(
        draft.memoryCandidates,
        memories.map((memory) => ({ text: memory.text, included: memory.included })),
      ).filter((text) => !draft.excludedTopics.some((topic) => text.toLowerCase().includes(topic.toLowerCase())));
      const stored = await reflectionRepository.approveReflection(draft.id, {
        summary: summary.trim(),
        realization: realization.trim(),
        commitments: commitment.trim() ? [commitment.trim()] : [],
        approvedMemories: approved,
        mood: draft.mood,
      });
      if (!stored) throw new Error('That reflection is no longer available.');
      const moodKey = draft.mood ? moodKeyForVoice(draft.mood) : null;
      if (moodKey) {
        await moodRepository.create({
          mood: moodKey,
          intensity: 5,
          note: 'Noted from Talk to Oppuna',
        });
      }
      voiceLog('memory approved', { count: approved.length });
      setSaved(true);
      setDraft(stored);
      dispatch({ type: 'SAVE_FINISHED' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the reflection.');
      dispatch({ type: 'FAIL' });
    }
  };

  const loadSeed = async (): Promise<void> => {
    await seedDemoReflections(reflectionRepository);
    setSeedNote('Demo history is stored on this device and labeled as a demo seed. It is not a live reply.');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xl,
          flexGrow: 1,
        }}
      >
        <Text variant="caption" color="textFaint" center style={{ marginTop: theme.spacing.md }}>
          Oppuna
        </Text>
        <Text variant="caption" color="textFaint" center>
          A reflection companion. Not a therapist.
        </Text>

        {draft ? (
          <View style={{ marginTop: theme.spacing.xl }}>
            <ReflectionSheet
              reflection={draft}
              editing={editing}
              summary={summary}
              realization={realization}
              commitment={commitment}
              memories={memories}
              saving={phase === 'SAVING'}
              saved={saved}
              patterns={patterns}
              onChangeSummary={setSummary}
              onChangeRealization={setRealization}
              onChangeCommitment={setCommitment}
              onToggleMemory={(key) =>
                setMemories((current) =>
                  current.map((memory) =>
                    memory.key === key ? { ...memory, included: !memory.included } : memory,
                  ),
                )
              }
              onEditMemory={(key, text) =>
                setMemories((current) =>
                  current.map((memory) => (memory.key === key ? { ...memory, text } : memory)),
                )
              }
              onRemoveSavedMemory={(text) => {
                if (!draft) return;
                void reflectionRepository.removeApprovedMemory(draft.id, text).then((next) => {
                  if (next) setDraft(next);
                });
              }}
              onSave={() => void save()}
              onEdit={() => setEditing((value) => !value)}
              onForget={() => void forget()}
            />
          </View>
        ) : (
          <View style={styles.stage}>
            <VoiceOrb phase={phase} />
            <Text
              variant="subtitle"
              center
              accessibilityLiveRegion="polite"
              style={{ marginTop: theme.spacing.lg }}
            >
              {error && phase === 'ERROR' ? 'Connection needs a retry' : PHASE_LABEL[phase]}
            </Text>
            {error ? (
              <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.sm }}>
                {error}
              </Text>
            ) : null}
            {latestUser ? (
              <Text variant="title" center style={{ marginTop: theme.spacing.xl }}>
                “{latestUser.text}”
              </Text>
            ) : (
              <Text variant="body" color="textFaint" center style={{ marginTop: theme.spacing.xl }}>
                Speak naturally. You can pause, correct yourself, or interrupt.
              </Text>
            )}
            {latestOppuna ? (
              <Text variant="body" color="textMuted" center style={{ marginTop: theme.spacing.lg }}>
                {latestOppuna.text}
              </Text>
            ) : null}
            {patterns ? (
              <View style={{ marginTop: theme.spacing.lg, alignItems: 'center', gap: 4 }}>
                <Text variant="caption" color="textFaint">
                  {patterns.sufficient
                    ? patterns.period === '30d'
                      ? 'Last 30 days'
                      : 'Last 7 days'
                    : 'Not enough saved reflections yet'}
                </Text>
                {patterns.trends.map((trend) => (
                  <Text key={`${trend.label}-${trend.detail}`} variant="caption" color="textMuted">
                    {trend.label} · {trend.detail}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={{ marginTop: theme.spacing.xl, width: '100%', gap: theme.spacing.sm }}>
              {phase === 'ERROR' ? (
                <Button label="Try again" onPress={() => void begin()} />
              ) : null}
              <Button label="End conversation" variant="secondary" onPress={finish} />
              <Button label="Forget this conversation" variant="ghost" onPress={() => void forget()} />
            </View>
            {__DEV__ ? (
              <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
                <Button label="Load demo history" variant="ghost" onPress={() => void loadSeed()} />
                {seedNote ? (
                  <Text variant="caption" color="textFaint" center>
                    {seedNote}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <HowVoiceWorks />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stage: { flex: 1, alignItems: 'center', paddingTop: 36 },
});
