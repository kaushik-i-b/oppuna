/**
 * "Talk to Oppuna" — the voice-first reflection companion screen.
 *
 * Minimal full-screen voice experience built on the deterministic
 * VoiceSessionController: one state at a time (IDLE/CONNECTING/LISTENING/
 * THINKING/SPEAKING/INTERRUPTED/SAVING/ERROR), live transcript, barge-in,
 * reflection preview, user-controlled memory approval, patterns, forget.
 *
 * Oppuna is a reflection companion — never a therapist, doctor, or crisis
 * service. Crisis replies route to the existing Crisis flow.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AudioModule } from 'expo-audio';

import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Screen,
  Text,
  TextField,
} from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import type { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { FadeInView, LivingLeaf, PressableScale, SectionLabel } from '@/ui';
import { Icon } from '@/ui/Icon';
import { useVoiceSession } from '@/voice/useVoiceSession';
import { VOICE_STATE_LABEL, type ReflectionDraft, type VoiceState } from '@/voice/types';
import type { ReflectionPatterns } from '@/voice/reflectionRepository';
import { clearDemoReflections, seedDemoReflections } from '@/voice/demoSeed';
import { createId } from '@/utils/id';

type Props = NativeStackScreenProps<RootStackParamList, 'TalkToOppuna'>;

function orbVariant(state: VoiceState): 'idle' | 'breathe' | 'thinking' | 'greet' | 'celebrate' | 'outline' {
  switch (state) {
    case 'LISTENING':
    case 'INTERRUPTED':
      return 'breathe';
    case 'THINKING':
      return 'thinking';
    case 'SPEAKING':
      return 'greet';
    case 'SAVING':
      return 'celebrate';
    case 'ERROR':
      return 'outline';
    default:
      return 'idle';
  }
}

const DEMO_MODE_ENABLED = __DEV__ || process.env.EXPO_PUBLIC_VOICE_DEMO_MODE === '1';

export function TalkToOppunaScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const { snapshot, controller, transport } = useVoiceSession(
    useCallback((category: string) => navigation.navigate('Crisis', { category: category as never }), [navigation]),
  );
  const [consented, setConsented] = useState(false);
  const [typed, setTyped] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);
  const [excludeInput, setExcludeInput] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryText, setEditingMemoryText] = useState('');
  const [patterns, setPatterns] = useState<ReflectionPatterns | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);

  const { state, segments, livePartial, draft, savedReflectionId, errorMessage } = snapshot;
  const started = state !== 'IDLE' && state !== 'ERROR';
  const busy = state === 'CONNECTING' || state === 'THINKING' || state === 'SAVING';

  const begin = useCallback(async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.show('Microphone permission is needed for live voice. You can still type below.', 'error');
      }
    } catch {
      // Typed fallback keeps the session usable without mic access.
    }
    setConsented(true);
    await controller.start();
  }, [controller, toast]);

  const endConversation = useCallback(async () => {
    await controller.end();
    navigation.goBack();
  }, [controller, navigation]);

  const sendTyped = useCallback(() => {
    const text = typed.trim();
    if (!text || busy) return;
    setTyped('');
    void controller.applyFinal(text);
  }, [typed, busy, controller]);

  const openReflection = useCallback(() => {
    const built = controller.buildDraft();
    if (!built) {
      toast.show('Talk a little first — then I can shape a reflection with you.', 'info');
      return;
    }
    setShowReflection(true);
  }, [controller, toast]);

  const saveReflection = useCallback(async () => {
    const id = await controller.saveDraft();
    if (id) {
      toast.show('Reflection saved — only what you approved will be remembered.', 'success');
      setShowReflection(false);
    } else {
      toast.show('Could not save just now. Nothing was stored.', 'error');
    }
  }, [controller, toast]);

  const forgetConversation = useCallback(async () => {
    setConfirmForget(false);
    setShowReflection(false);
    setPatterns(null);
    await controller.forget();
    toast.show('Conversation forgotten. Approved memories were kept.', 'info');
  }, [controller, toast]);

  const askPatterns = useCallback(async () => {
    setPatternsLoading(true);
    try {
      const result = (await controller
        .getToolExecutor()
        .execute(`patterns:${createId()}`, 'get_reflection_patterns', { period: '7d' })) as ReflectionPatterns;
      setPatterns(result);
    } catch {
      toast.show('Could not load patterns just now.', 'error');
    } finally {
      setPatternsLoading(false);
    }
  }, [controller, toast]);

  const seedDemo = useCallback(async () => {
    setDemoBusy(true);
    try {
      await seedDemoReflections();
      toast.show('Demo memory seeded — start a new conversation and say “I’ve been stressed again”.', 'success');
    } catch {
      toast.show('Could not seed demo data.', 'error');
    } finally {
      setDemoBusy(false);
    }
  }, [toast]);

  const clearDemo = useCallback(async () => {
    setDemoBusy(true);
    try {
      await clearDemoReflections();
      toast.show('Demo data cleared.', 'info');
    } catch {
      toast.show('Could not clear demo data.', 'error');
    } finally {
      setDemoBusy(false);
    }
  }, [toast]);

  const finals = segments.filter((s) => s.final);
  const lastUser = [...finals].reverse().find((s) => s.speaker === 'USER');
  const lastOppuna = [...finals].reverse().find((s) => s.speaker === 'OPPUNA');
  const exchangeCount = finals.filter((s) => s.speaker === 'USER').length;

  return (
    <>
      <Screen scroll padded contentStyle={styles.root}>
        <FadeInView preset="fade" style={styles.header}>
          <Text variant="title" center>
            Oppuna
          </Text>
          <Text variant="caption" color="textFaint" center style={styles.transport}>
            {transport === 'assemblyai' ? 'Live transcription · AssemblyAI' : 'On-device preview · offline'}
          </Text>
        </FadeInView>

        {/* Central orb reacts to state */}
        <View style={styles.orbWrap}>
          <View
            style={[
              styles.orb,
              {
                backgroundColor:
                  state === 'SPEAKING' || state === 'LISTENING' || state === 'INTERRUPTED'
                    ? theme.colors.primaryMuted
                    : theme.colors.surfaceInteractive,
              },
            ]}
          >
            <LivingLeaf size={84} variant={orbVariant(state)} showAura={state !== 'IDLE'} />
          </View>
          <Text variant="subtitle" center style={{ marginTop: theme.spacing.md }}>
            {VOICE_STATE_LABEL[state]}
          </Text>
          {state === 'ERROR' && errorMessage ? (
            <Text variant="body" color="danger" center style={{ marginTop: theme.spacing.xs }}>
              {errorMessage}
            </Text>
          ) : null}
        </View>

        {!consented ? (
          <Card style={{ marginTop: theme.spacing.lg }}>
            <Text variant="bodyStrong">A quiet space to talk</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              Speak naturally — pause, correct yourself, or interrupt me anytime. Live voice uses
              AssemblyAI cloud transcription; everything you approve as memory stays on this
              device. Oppuna is a reflection companion, not a therapist or medical service.
            </Text>
            <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.sm }}>
              <Button label="Start talking" onPress={() => void begin()} />
              <Button label="Not now" variant="ghost" onPress={() => navigation.goBack()} />
            </View>
          </Card>
        ) : null}

        {consented && !started ? (
          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            {state === 'ERROR' ? (
              <>
                <Button label="Try again" onPress={() => void controller.start()} />
                <Button label="Leave" variant="ghost" onPress={() => navigation.goBack()} />
              </>
            ) : null}
          </View>
        ) : null}

        {/* Live transcript — subtle, not a console */}
        {consented && (lastUser || lastOppuna || livePartial) ? (
          <View style={styles.transcript}>
            {livePartial ? (
              <Text variant="body" color="textFaint" center style={styles.partial}>
                “{livePartial}”
              </Text>
            ) : null}
            {lastUser && !livePartial ? (
              <Text variant="body" color="textMuted" center>
                “{lastUser.text}”
              </Text>
            ) : null}
            {lastOppuna ? (
              <Text variant="bodyStrong" center style={{ marginTop: theme.spacing.sm }}>
                {lastOppuna.text}
              </Text>
            ) : null}
          </View>
        ) : null}

        {state === 'SPEAKING' ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label="Interrupt" variant="secondary" onPress={() => controller.interrupt()} />
          </View>
        ) : null}

        {/* Streaming text input — works fully offline; live mic streams when AssemblyAI is connected */}
        {consented && started ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <TextField
              label="Speak or type — I listen as you go"
              placeholder="Today was exhausting…"
              value={typed}
              onChangeText={(value) => {
                setTyped(value);
                if (value.trim()) controller.applyPartial(value);
              }}
              onSubmitEditing={sendTyped}
              returnKeyType="send"
              multiline
              helperText={
                transport === 'assemblyai'
                  ? 'Live mic streaming is on — or type here.'
                  : 'On-device preview: type and send, no recording clips needed.'
              }
            />
            <View style={{ marginTop: theme.spacing.sm }}>
              <Button label="Send" variant="secondary" onPress={sendTyped} disabled={!typed.trim() || busy} />
            </View>
          </View>
        ) : null}

        {/* Conversation actions */}
        {consented && started && exchangeCount > 0 ? (
          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            <Button
              label="Turn this into a reflection"
              variant="secondary"
              onPress={openReflection}
              disabled={busy}
            />
            <Button
              label={patternsLoading ? 'Looking back…' : 'How have I been doing lately?'}
              variant="ghost"
              onPress={() => void askPatterns()}
              disabled={patternsLoading || busy}
            />
          </View>
        ) : null}

        {patterns ? (
          <Card style={{ marginTop: theme.spacing.lg }}>
            <Text variant="label">LAST 7 DAYS</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              {patterns.summary}
            </Text>
            {patterns.topThemes.map((t) => (
              <PatternRow key={t.theme} label={t.theme} value={`mentioned ${t.count}×`} />
            ))}
            {patterns.topConcerns.map((t) => (
              <PatternRow key={t.concern} label={t.concern} value="coming up" />
            ))}
            <PatternRow
              label="Overall mood"
              value={
                patterns.moodTrend === 'insufficient'
                  ? 'not enough data yet'
                  : `trending ${patterns.moodTrend}`
              }
            />
          </Card>
        ) : null}

        {savedReflectionId && !showReflection ? (
          <Card style={{ marginTop: theme.spacing.lg }}>
            <Text variant="bodyStrong">Reflection saved</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              Only the memories you approved will shape future conversations.
            </Text>
          </Card>
        ) : null}

        <View style={{ marginTop: theme.spacing.xl }}>
          <PressableScale
            onPress={() => setShowHowItWorks((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="How Oppuna Voice works"
            style={styles.howRow}
          >
            <Text variant="bodyStrong">How Oppuna Voice works</Text>
            <Icon name="chevron" size={18} color={theme.colors.textMuted} />
          </PressableScale>
          {showHowItWorks ? (
            <Card style={{ marginTop: theme.spacing.sm }}>
              <HowLine step="VOICE" detail="You speak naturally — pause, correct, interrupt." />
              <HowLine step="ASSEMBLYAI" detail="Realtime transcription turns speech into turns." />
              <HowLine step="REALTIME CONVERSATION" detail="Oppuna listens, thinks, and speaks back." />
              <HowLine step="OPPUNA TOOLS" detail="Reflections, moods, and patterns via structured tools." />
              <HowLine step="REFLECTION MEMORY" detail="Only memories you approve shape next time." />
            </Card>
          ) : null}
        </View>

        {DEMO_MODE_ENABLED ? (
          <Card style={{ marginTop: theme.spacing.lg }}>
            <Text variant="label">DEMO MODE (JUDGES)</Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              Seeds one clearly-labelled [DEMO] reflection so “Session 2” can retrieve approved
              memory. Live conversation is never faked.
            </Text>
            <View style={{ marginTop: theme.spacing.sm, flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Seed demo" variant="secondary" onPress={() => void seedDemo()} disabled={demoBusy} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Clear demo" variant="ghost" onPress={() => void clearDemo()} disabled={demoBusy} />
              </View>
            </View>
          </Card>
        ) : null}

        {consented && started ? (
          <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
            <Button label="End conversation" variant="secondary" onPress={() => void endConversation()} />
          </View>
        ) : null}
      </Screen>

      {/* Reflection result sheet */}
      {showReflection && draft ? (
        <ReflectionSheet
          draft={draft}
          onApprove={(id, approved) => controller.setMemoryApproval(id, approved)}
          onEditStart={(id, text) => {
            setEditingMemoryId(id);
            setEditingMemoryText(text);
          }}
          onPatch={(patch) => controller.updateDraft(patch)}
          onAddExcluded={() => {
            if (excludeInput.trim()) {
              controller.addExcludedTopic(excludeInput.trim());
              setExcludeInput('');
            }
          }}
          excludeInput={excludeInput}
          onExcludeInput={setExcludeInput}
          onSave={() => void saveReflection()}
          onForget={() => setConfirmForget(true)}
          onClose={() => setShowReflection(false)}
          saving={state === 'SAVING'}
        />
      ) : null}

      {editingMemoryId ? (
        <ConfirmDialog
          visible
          title="Edit memory"
          message="Change how Oppuna remembers this. Only the edited text is stored."
          confirmLabel="Save edit"
          onConfirm={() => {
            if (editingMemoryText.trim()) controller.editMemoryCandidate(editingMemoryId, editingMemoryText);
            setEditingMemoryId(null);
            setEditingMemoryText('');
          }}
          onCancel={() => {
            setEditingMemoryId(null);
            setEditingMemoryText('');
          }}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmForget}
        title="Forget this conversation?"
        message="This removes the transcript and any unsaved reflection. Memories you already approved stay untouched."
        confirmLabel="Forget"
        destructive
        onConfirm={() => void forgetConversation()}
        onCancel={() => setConfirmForget(false)}
      />
    </>
  );
}

function PatternRow({ label, value }: { label: string; value: string }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.patternRow, { borderColor: theme.colors.border }]}>
      <Text variant="body" style={{ textTransform: 'capitalize' }}>
        {label}
      </Text>
      <Text variant="caption" color="textMuted">
        {value}
      </Text>
    </View>
  );
}

function HowLine({ step, detail }: { step: string; detail: string }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <Text variant="label">{step}</Text>
      <Text variant="body" color="textMuted">
        {detail}
      </Text>
      <Text variant="caption" color="textFaint">
        ↓
      </Text>
    </View>
  );
}

function ReflectionSheet({
  draft,
  onApprove,
  onEditStart,
  onPatch,
  onAddExcluded,
  excludeInput,
  onExcludeInput,
  onSave,
  onForget,
  onClose,
  saving,
}: {
  draft: ReflectionDraft;
  onApprove: (id: string, approved: boolean) => void;
  onEditStart: (id: string, text: string) => void;
  onPatch: (patch: Partial<ReflectionDraft>) => void;
  onAddExcluded: () => void;
  excludeInput: string;
  onExcludeInput: (value: string) => void;
  onSave: () => void;
  onForget: () => void;
  onClose: () => void;
  saving: boolean;
}): React.ReactElement {
  const theme = useTheme();
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState(draft.summary);
  return (
    <View style={styles.sheetBackdrop}>
      <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
        <Screen scroll padded={false} contentStyle={{ padding: theme.spacing.lg }}>
          <Text variant="title" center>
            Today&apos;s Reflection
          </Text>
          {draft.mood ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <SectionLabel>MOOD</SectionLabel>
              <Chip label={draft.mood} selected onPress={() => undefined} />
            </View>
          ) : null}

          <View style={{ marginTop: theme.spacing.md }}>
            <SectionLabel>SUMMARY</SectionLabel>
            {editingSummary ? (
              <>
                <TextField value={summaryText} onChangeText={setSummaryText} multiline label="Edit summary" />
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button
                    label="Done editing"
                    variant="secondary"
                    onPress={() => {
                      onPatch({ summary: summaryText });
                      setEditingSummary(false);
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                <Text variant="body">{draft.summary}</Text>
                <View style={{ marginTop: theme.spacing.sm }}>
                  <Button label="Edit" variant="ghost" onPress={() => setEditingSummary(true)} />
                </View>
              </>
            )}
          </View>

          {draft.themes.length > 0 ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <SectionLabel>THEMES</SectionLabel>
              <View style={styles.chipRow}>
                {draft.themes.map((t) => (
                  <Chip key={t} label={t} selected={false} onPress={() => undefined} />
                ))}
              </View>
            </View>
          ) : null}

          {draft.commitments.length > 0 ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <SectionLabel>COMMITMENT</SectionLabel>
              {draft.commitments.map((c) => (
                <Text key={c} variant="body" color="textMuted">
                  · {c}
                </Text>
              ))}
            </View>
          ) : null}

          {draft.excludedTopics.length > 0 ? (
            <View style={{ marginTop: theme.spacing.md }}>
              <SectionLabel>EXCLUDED FROM MEMORY</SectionLabel>
              {draft.excludedTopics.map((t) => (
                <Text key={t} variant="caption" color="textMuted">
                  · {t} — will not be saved
                </Text>
              ))}
            </View>
          ) : null}
          <View style={{ marginTop: theme.spacing.sm }}>
            <TextField
              label="Leave something out"
              placeholder="e.g. the part about my manager"
              value={excludeInput}
              onChangeText={onExcludeInput}
              onSubmitEditing={onAddExcluded}
            />
            <View style={{ marginTop: theme.spacing.sm }}>
              <Button label="Exclude" variant="ghost" onPress={onAddExcluded} disabled={!excludeInput.trim()} />
            </View>
          </View>

          <View style={{ marginTop: theme.spacing.lg }}>
            <SectionLabel>WHAT SHOULD OPPUNA REMEMBER?</SectionLabel>
            {draft.memoryCandidates.length === 0 ? (
              <Text variant="body" color="textMuted">
                Nothing suggested — the reflection can be saved without memory.
              </Text>
            ) : (
              draft.memoryCandidates.map((candidate) => (
                <View key={candidate.id} style={[styles.memoryRow, { borderColor: theme.colors.border }]}>
                  <PressableScale
                    onPress={() => onApprove(candidate.id, !candidate.approved)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${candidate.approved ? 'Approved' : 'Skipped'}: ${candidate.text}`}
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: candidate.approved ? theme.colors.primary : 'transparent',
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  >
                    {candidate.approved ? (
                      <Icon name="check" size={14} color={theme.colors.onPrimary} />
                    ) : null}
                  </PressableScale>
                  <Text variant="body" style={{ flex: 1 }}>
                    {candidate.text}
                  </Text>
                  <PressableScale
                    onPress={() => onEditStart(candidate.id, candidate.text)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit memory: ${candidate.text}`}
                    style={styles.editBtn}
                  >
                    <Text variant="caption" color="primary">
                      Edit
                    </Text>
                  </PressableScale>
                </View>
              ))
            )}
          </View>

          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm, marginBottom: theme.spacing.xl }}>
            <Button label={saving ? 'Saving…' : 'Save reflection'} onPress={onSave} disabled={saving} />
            <Button label="Keep talking" variant="secondary" onPress={onClose} disabled={saving} />
            <Button label="Forget conversation" variant="ghost" onPress={onForget} disabled={saving} />
          </View>
        </Screen>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'stretch' },
  header: { marginTop: 8 },
  transport: { marginTop: 2 },
  orbWrap: { alignItems: 'center', marginTop: 24 },
  orb: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcript: { marginTop: 20, paddingHorizontal: 12 },
  partial: { fontStyle: 'italic' },
  howRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: { padding: 6 },
});
