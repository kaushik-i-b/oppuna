import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
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

import { Button, Card, EmptyState, Screen, SectionHeader, Text } from '@/components';
import { useToast } from '@/components/feedback/ToastProvider';
import { voiceNoteRepository } from '@/database';
import { useHaptics } from '@/hooks/useHaptics';
import { useTheme } from '@/theme/ThemeProvider';
import { formatDuration, formatDateTime } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { RootStackParamList } from '@/navigation/types';
import type { VoiceNote } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceMode'>;

const CALMING_SCRIPT =
  'Let’s take a slow moment together. Breathe in gently through your nose for four counts. ' +
  'Hold softly for four. And let it out slowly for six. You are safe in this moment. ' +
  'There is nothing you need to fix right now.';

const STT_UNAVAILABLE = 'Offline speech recognition is not available on this device yet.';

export function VoiceModeScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const { impact } = useHaptics();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const player = useAudioPlayer(playingUri ? { uri: playingUri } : null);

  const refresh = useCallback(async () => {
    try {
      setNotes(await voiceNoteRepository.list());
    } catch (error) {
      logger.warn('Voice notes load failed', { error: String(error) });
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => {
      Speech.stop();
    };
  }, [refresh]);

  useEffect(() => {
    if (playingUri) {
      player.play();
    }
  }, [playingUri, player]);

  const speakGuide = useCallback(() => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(CALMING_SCRIPT, {
      rate: 0.9,
      pitch: 1.0,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [speaking]);

  const startRecording = useCallback(async () => {
    try {
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
  }, [recorder, toast, impact]);

  const stopRecording = useCallback(async () => {
    try {
      const durationSec = Math.round((recorderState.durationMillis ?? 0) / 1000);
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        await voiceNoteRepository.create({ uri, durationSec, transcript: null });
        await refresh();
        // On-device speech-to-text is intentionally not bundled yet.
        toast.show(STT_UNAVAILABLE, 'info');
      }
    } catch (error) {
      logger.error('Stop recording failed', { error: String(error) });
      toast.show('Could not save the recording.', 'error');
    }
  }, [recorder, recorderState.durationMillis, refresh, toast]);

  const playNote = useCallback(
    (uri: string) => {
      setPlayingUri(null);
      // Defer so the player picks up the new source cleanly.
      requestAnimationFrame(() => setPlayingUri(uri));
    },
    [],
  );

  const removeNote = useCallback(
    async (note: VoiceNote) => {
      try {
        await voiceNoteRepository.remove(note.id);
        await refresh();
      } catch (error) {
        logger.warn('Remove voice note failed', { error: String(error) });
      }
    },
    [refresh],
  );

  return (
    <Screen scroll title="Voice mode" onBack={() => navigation.goBack()}>
      <Card>
        <Text variant="subtitle">Spoken guidance</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.sm }}>
          Oppuna can read a short calming exercise aloud using your device’s built-in voice. This
          works entirely offline.
        </Text>
        <Button
          label={speaking ? 'Stop' : '🔊 Play a calming guide'}
          variant={speaking ? 'secondary' : 'primary'}
          onPress={speakGuide}
        />
      </Card>

      <Card style={{ marginTop: theme.spacing.lg }}>
        <Text variant="subtitle">Private voice note</Text>
        <Text variant="body" color="textMuted" style={{ marginVertical: theme.spacing.sm }}>
          Record a voice note that stays on your device. {STT_UNAVAILABLE}
        </Text>

        <View style={styles.recordRow}>
          <Pressable
            onPress={() => void (recorderState.isRecording ? stopRecording() : startRecording())}
            accessibilityRole="button"
            accessibilityLabel={recorderState.isRecording ? 'Stop recording' : 'Start recording'}
            style={[
              styles.recordButton,
              {
                backgroundColor: recorderState.isRecording ? theme.colors.danger : theme.colors.primary,
              },
            ]}
          >
            <Text style={{ fontSize: 28 }}>{recorderState.isRecording ? '⏹️' : '🎙️'}</Text>
          </Pressable>
          <Text variant="subtitle" color={recorderState.isRecording ? 'danger' : 'textMuted'}>
            {recorderState.isRecording
              ? formatDuration(Math.round((recorderState.durationMillis ?? 0) / 1000))
              : 'Tap to record'}
          </Text>
        </View>

        {Platform.OS === 'web' ? (
          <Text variant="caption" color="textFaint" style={{ marginTop: theme.spacing.sm }}>
            Voice recording works best on a phone.
          </Text>
        ) : null}
      </Card>

      <View style={{ marginTop: theme.spacing.xl }}>
        <SectionHeader title="Saved voice notes" />
        {notes.length === 0 ? (
          <EmptyState emoji="🎧" title="No voice notes yet" description="Your recordings will appear here." />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {notes.map((note) => (
              <Card key={note.id}>
                <View style={styles.noteRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{formatDuration(note.durationSec)}</Text>
                    <Text variant="caption" color="textMuted">
                      {formatDateTime(note.createdAt)}
                    </Text>
                  </View>
                  <Pressable onPress={() => playNote(note.uri)} hitSlop={10} accessibilityLabel="Play note">
                    <Text variant="subtitle">▶️</Text>
                  </Pressable>
                  <Pressable onPress={() => void removeNote(note)} hitSlop={10} accessibilityLabel="Delete note">
                    <Text variant="subtitle">🗑️</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  recordButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
