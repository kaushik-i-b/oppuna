import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Speech from 'expo-speech';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  EmptyState,
  Screen,
  Text,
} from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { voiceNoteRepository } from '@/database';
import { useHaptics } from '@/hooks/useHaptics';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { recordCareActivity } from '@/services/careRetentionService';
import { useTheme } from '@/theme/ThemeProvider';
import {
  CareHero,
  FadeInView,
  Icon,
  LivingLeaf,
  PressableScale,
  SectionLabel,
} from '@/ui';
import { formatDuration, formatDateTime } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { RootStackParamList } from '@/navigation/types';
import type { VoiceNote } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceMode'>;

interface GuideScript {
  id: string;
  label: string;
  title: string;
  body: string;
  script: string;
}

const GUIDES: GuideScript[] = [
  {
    id: 'calm',
    label: 'Calm breath',
    title: 'A soft breath together',
    body: 'A short offline guide using your device voice — nothing leaves this phone.',
    script:
      'Let’s take a slow moment together. Breathe in gently through your nose for four counts. ' +
      'Hold softly for four. And let it out slowly for six. You are safe in this moment. ' +
      'There is nothing you need to fix right now.',
  },
  {
    id: 'ground',
    label: 'Grounding',
    title: 'Come back to now',
    body: 'Name what you can sense — a quiet way to settle when thoughts feel loud.',
    script:
      'Look around and gently name five things you can see. ' +
      'Notice four things you can feel — your feet, your clothes, the air. ' +
      'Listen for three sounds. Soften your jaw. You are here, and that is enough for this moment.',
  },
  {
    id: 'release',
    label: 'Release',
    title: 'Put it down for a minute',
    body: 'A brief spoken pause when your mind is carrying too much.',
    script:
      'Imagine placing one heavy thought on a shelf beside you — just for now. ' +
      'Breathe in kindness for yourself. Breathe out a little tightness. ' +
      'You can pick things back up later. Right now, rest is allowed.',
  },
];

function RecordingPulse({ active }: { active: boolean }): React.ReactElement {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    if (!active || reduceMotion) {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = active ? 0.4 : 0;
      return;
    }
    scale.value = withRepeat(
      withTiming(1.35, { duration: 1100, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withTiming(0.08, { duration: 1100, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
  }, [active, reduceMotion, scale, opacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!active) return <View style={styles.pulseSlot} />;

  return (
    <View style={styles.pulseSlot} pointerEvents="none">
      <Animated.View
        style={[
          styles.pulseRing,
          { borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerMuted },
          ringStyle,
        ]}
      />
    </View>
  );
}

export function VoiceModeScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const { impact, selection, notify } = useHaptics();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [guideId, setGuideId] = useState(GUIDES[0]!.id);
  const [speaking, setSpeaking] = useState(false);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VoiceNote | null>(null);
  const player = useAudioPlayer(playingUri ? { uri: playingUri } : null);

  const guide = GUIDES.find((g) => g.id === guideId) ?? GUIDES[0]!;
  const recording = recorderState.isRecording;
  const elapsedSec = Math.round((recorderState.durationMillis ?? 0) / 1000);

  const refresh = useCallback(async () => {
    try {
      setNotes(await voiceNoteRepository.list());
    } catch (error) {
      logger.warn('Voice notes load failed', { error: String(error) });
    }
  }, []);

  const stopSpeech = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  const stopPlayback = useCallback(() => {
    try {
      player.pause();
    } catch {
      // Player may not be ready yet.
    }
    setPlayingUri(null);
  }, [player]);

  useEffect(() => {
    void refresh();
    return () => {
      Speech.stop();
    };
  }, [refresh]);

  useEffect(() => {
    if (playingUri) {
      try {
        player.play();
      } catch (error) {
        logger.warn('Playback failed', { error: String(error) });
        setPlayingUri(null);
      }
    }
  }, [playingUri, player]);

  const speakGuide = useCallback(() => {
    if (speaking) {
      stopSpeech();
      return;
    }
    if (recording) return;
    stopPlayback();
    setSpeaking(true);
    selection();
    Speech.speak(guide.script, {
      rate: 0.86,
      pitch: 0.95,
      onDone: () => {
        setSpeaking(false);
        void recordCareActivity('selfcare').catch(() => undefined);
      },
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking, recording, guide.script, selection, stopSpeech, stopPlayback]);

  const startRecording = useCallback(async () => {
    try {
      stopSpeech();
      stopPlayback();
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        toast.show('Microphone permission is needed to record a voice note.', 'error');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      impact();
    } catch (error) {
      logger.error('Start recording failed', { error: String(error) });
      toast.show('Could not start recording on this device.', 'error');
    }
  }, [recorder, toast, impact, stopSpeech, stopPlayback]);

  const stopRecording = useCallback(async () => {
    try {
      const durationSec = Math.round((recorderState.durationMillis ?? 0) / 1000);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const uri = recorder.uri;
      if (uri) {
        await voiceNoteRepository.create({ uri, durationSec, transcript: null });
        await refresh();
        notify();
        void recordCareActivity('selfcare').catch(() => undefined);
        toast.show('Voice note saved — private on this device.', 'success');
      }
    } catch (error) {
      logger.error('Stop recording failed', { error: String(error) });
      toast.show('Could not save the recording.', 'error');
    }
  }, [recorder, recorderState.durationMillis, refresh, toast, notify]);

  const toggleRecord = useCallback(() => {
    if (recording) {
      void stopRecording();
      return;
    }
    void startRecording();
  }, [recording, startRecording, stopRecording]);

  const playNote = useCallback(
    (uri: string) => {
      stopSpeech();
      if (playingUri === uri) {
        stopPlayback();
        return;
      }
      setPlayingUri(null);
      requestAnimationFrame(() => setPlayingUri(uri));
    },
    [playingUri, stopSpeech, stopPlayback],
  );

  const confirmRemove = useCallback(async () => {
    const note = pendingDelete;
    setPendingDelete(null);
    if (!note) return;
    try {
      if (playingUri === note.uri) stopPlayback();
      await voiceNoteRepository.remove(note.id);
      await refresh();
      toast.show('Voice note deleted.', 'info');
    } catch (error) {
      logger.warn('Remove voice note failed', { error: String(error) });
      toast.show('Could not delete that note.', 'error');
    }
  }, [pendingDelete, playingUri, stopPlayback, refresh, toast]);

  return (
    <>
      <Screen scroll title="Voice mode" onBack={() => navigation.goBack()}>
        <FadeInView delay={0} preset="fade">
          <CareHero
            leafVariant={speaking ? 'breathe' : recording ? 'thinking' : 'idle'}
            leafSize={64}
            title="Speak softly, stay private"
            body="Listen to a short guide or leave yourself a voice note. Everything stays on this device."
          />
        </FadeInView>

        <FadeInView delay={60}>
          <SectionLabel>SPOKEN GUIDE</SectionLabel>
          <Card elevated style={{ backgroundColor: theme.colors.surfaceElevated }}>
            <View style={[styles.chipRow, { marginBottom: theme.spacing.md }]}>
              {GUIDES.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={guideId === item.id}
                  onPress={() => {
                    if (speaking) stopSpeech();
                    setGuideId(item.id);
                  }}
                />
              ))}
            </View>

            <Text variant="bodyStrong">{guide.title}</Text>
            <Text variant="body" color="textMuted" style={{ marginTop: theme.spacing.xs }}>
              {guide.body}
            </Text>

            <View style={[styles.guideActions, { marginTop: theme.spacing.lg }]}>
              <View
                style={[
                  styles.guideOrb,
                  {
                    backgroundColor: speaking
                      ? theme.colors.primaryMuted
                      : theme.colors.surfaceInteractive,
                  },
                ]}
              >
                <LivingLeaf
                  size={36}
                  variant={speaking ? 'breathe' : 'idle'}
                  showAura={false}
                />
              </View>
              <View style={{ flex: 1, gap: 10 }}>
                <Button
                  label={speaking ? 'Stop guide' : 'Play guide'}
                  variant={speaking ? 'secondary' : 'primary'}
                  onPress={speakGuide}
                  disabled={recording}
                />
                <Text variant="caption" color="textFaint">
                  Uses your phone’s built-in voice. Fully offline.
                </Text>
              </View>
            </View>
          </Card>
        </FadeInView>

        <FadeInView delay={120} style={{ marginTop: theme.spacing.xl }}>
          <SectionLabel>PRIVATE VOICE NOTE</SectionLabel>
          <Card elevated style={{ backgroundColor: theme.colors.surfaceElevated }}>
            <Text variant="body" color="textMuted">
              Capture a thought out loud. Notes stay in Oppuna’s local storage on this device.
            </Text>

            <View style={styles.recordBlock}>
              <View style={styles.recordCenter}>
                <RecordingPulse active={recording} />
                <PressableScale
                  onPress={toggleRecord}
                  accessibilityRole="button"
                  accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
                  accessibilityHint={
                    recording ? 'Stops and saves the voice note' : 'Starts a private recording'
                  }
                  disabled={speaking}
                  style={[
                    styles.recordButton,
                    {
                      backgroundColor: recording ? theme.colors.danger : theme.colors.primary,
                      opacity: speaking ? 0.45 : 1,
                    },
                  ]}
                >
                  <Icon
                    name={recording ? 'close' : 'mic'}
                    size={28}
                    color={theme.colors.onPrimary}
                  />
                </PressableScale>
              </View>

              <Text
                variant="title"
                center
                color={recording ? 'danger' : 'text'}
                style={{ marginTop: theme.spacing.md }}
              >
                {recording ? formatDuration(elapsedSec) : 'Tap to record'}
              </Text>
              <Text variant="caption" color="textMuted" center style={{ marginTop: 4 }}>
                {recording
                  ? 'Listening… tap again to save'
                  : speaking
                    ? 'Stop the guide first to record'
                    : 'No cloud upload. No transcript yet.'}
              </Text>
            </View>

            {Platform.OS === 'web' ? (
              <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.md }}>
                Recording works best on a phone.
              </Text>
            ) : null}
          </Card>
        </FadeInView>

        <FadeInView delay={180} style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
          <SectionLabel>SAVED NOTES</SectionLabel>
          {notes.length === 0 ? (
            <EmptyState
              icon="mic"
              title="No voice notes yet"
              description="When you record something, it will show up here — only on this device."
            />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {notes.map((note, index) => {
                const isPlaying = playingUri === note.uri;
                return (
                  <FadeInView key={note.id} delay={40 + index * 30} preset="soft">
                    <Card padded={false} elevated={false}>
                      <View
                        style={[
                          styles.noteRow,
                          {
                            padding: theme.spacing.md,
                            backgroundColor: isPlaying
                              ? theme.colors.primaryMuted
                              : theme.colors.surface,
                            borderRadius: theme.radius.lg,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: theme.colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.noteIcon,
                            {
                              backgroundColor: isPlaying
                                ? theme.colors.primary
                                : theme.colors.primaryMuted,
                            },
                          ]}
                        >
                          <Icon
                            name={isPlaying ? 'pause' : 'mic'}
                            size={18}
                            color={isPlaying ? theme.colors.onPrimary : theme.colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyStrong">{formatDuration(note.durationSec)}</Text>
                          <Text variant="caption" color="textMuted">
                            {formatDateTime(note.createdAt)}
                          </Text>
                        </View>
                        <PressableScale
                          onPress={() => playNote(note.uri)}
                          accessibilityRole="button"
                          accessibilityLabel={isPlaying ? 'Stop playback' : 'Play note'}
                          style={[
                            styles.iconBtn,
                            { backgroundColor: theme.colors.surfaceInteractive },
                          ]}
                        >
                          <Icon
                            name={isPlaying ? 'pause' : 'play'}
                            size={18}
                            color={theme.colors.primary}
                          />
                        </PressableScale>
                        <PressableScale
                          onPress={() => setPendingDelete(note)}
                          accessibilityRole="button"
                          accessibilityLabel="Delete note"
                          style={[
                            styles.iconBtn,
                            { backgroundColor: theme.colors.dangerMuted },
                          ]}
                        >
                          <Icon name="trash" size={18} color={theme.colors.danger} />
                        </PressableScale>
                      </View>
                    </Card>
                  </FadeInView>
                );
              })}
            </View>
          )}
        </FadeInView>
      </Screen>

      <ConfirmDialog
        visible={pendingDelete != null}
        title="Delete voice note?"
        message="This permanently removes the recording from this device."
        confirmLabel="Delete"
        cancelLabel="Keep"
        destructive
        onConfirm={() => void confirmRemove()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  guideActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  guideOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBlock: { marginTop: 20, alignItems: 'center' },
  recordCenter: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
