/**
 * Development-only playback comparison for Talk to Oppuna.
 * Hidden from production navigation.
 */

import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components';
import {
  getAudioDebugSnapshot,
  inspectPlayback,
  latestReplyChunks,
  subscribeAudioDiagnostics,
  type AudioDebugSnapshot,
  type ReplyPlaybackCheck,
} from '@/voice/audio/audioDiagnostics';
import { playPipelineAgentPcm, playRawAgentPcm } from '@/voice/audio/debugPlayback';
import { useTheme } from '@/theme/ThemeProvider';

function Row({ label, value }: { label: string; value: string }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="bodyStrong" style={{ marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}

export function VoiceAudioDebugScreen(): React.ReactElement {
  const theme = useTheme();
  const [snapshot, setSnapshot] = useState<AudioDebugSnapshot>(getAudioDebugSnapshot());
  const [checks, setChecks] = useState<ReplyPlaybackCheck[]>(inspectPlayback());
  const [busy, setBusy] = useState<'raw' | 'pipeline' | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const captured = latestReplyChunks();

  useEffect(() => subscribeAudioDiagnostics(() => {
    setSnapshot(getAudioDebugSnapshot());
    setChecks(inspectPlayback());
  }), []);

  const play = (mode: 'raw' | 'pipeline'): void => {
    const latest = latestReplyChunks();
    if (!latest) {
      setNote('No agent audio has been captured in this session yet.');
      return;
    }
    setBusy(mode);
    setNote(null);
    const run = mode === 'raw' ? playRawAgentPcm : playPipelineAgentPcm;
    void run(latest.chunks, latest.sampleRate)
      .catch(() => setNote('Playback failed in this browser.'))
      .finally(() => setBusy(null));
  };

  const recent = snapshot.events.slice(-12).reverse();

  return (
    <Screen title="Voice audio" scroll>
      <Text variant="caption" color="textMuted" style={{ marginBottom: theme.spacing.md }}>
        Development only. Use headphones. Raw playback is the agent PCM in one buffer. Pipeline playback is
        the same bytes through the Talk to Oppuna queue. If raw is clear and pipeline is not, the distortion
        is in Oppuna. If both are unclear on headphones, it is upstream of playback.
      </Text>
      <Card>
        <Row label="Input rate" value={snapshot.inputSampleRate == null ? '—' : `${snapshot.inputSampleRate} Hz`} />
        <Row label="Input channels" value={snapshot.inputChannels == null ? '—' : String(snapshot.inputChannels)} />
        <Row label="Output rate" value={snapshot.outputSampleRate == null ? '—' : `${snapshot.outputSampleRate} Hz`} />
        <Row label="Output channels" value={snapshot.outputChannels == null ? '—' : String(snapshot.outputChannels)} />
        <Row
          label="Context rate"
          value={snapshot.contextSampleRate == null ? '—' : `${snapshot.contextSampleRate} Hz`}
        />
        <Row label="Queue length" value={String(snapshot.queueLength)} />
        <Row label="Playback underruns" value={`${snapshot.playbackUnderrunSamples} samples`} />
        <Row label="Captured reply" value={captured ? captured.replyId : 'none yet'} />
      </Card>
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button
          label="Play raw agent audio"
          onPress={() => play('raw')}
          loading={busy === 'raw'}
          disabled={busy != null || Platform.OS !== 'web' || !captured}
        />
        <Button
          label="Play pipeline audio"
          variant="secondary"
          onPress={() => play('pipeline')}
          loading={busy === 'pipeline'}
          disabled={busy != null || Platform.OS !== 'web' || !captured}
        />
        {note ? (
          <Text variant="caption" color="textMuted">
            {note}
          </Text>
        ) : null}
      </View>
      {checks.length > 0 ? (
        <View style={{ marginTop: theme.spacing.lg }}>
          <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
            Captured replies
          </Text>
          {checks.map((check) => (
            <Text key={check.replyId} variant="caption" color="textMuted" style={{ marginBottom: 6 }}>
              {check.replyId} · {check.chunkCount} chunks · {Math.round(check.durationMs)} ms · order{' '}
              {check.orderOk ? 'ok' : 'broken'} · peak {check.peak.toFixed(2)}
              {check.maxAbsError == null ? '' : ` · error ${check.maxAbsError.toFixed(4)}`}
              {check.duplicateDrops > 0 ? ` · duplicates ${check.duplicateDrops}` : ''}
              {check.staleDrops > 0 ? ` · stale ${check.staleDrops}` : ''}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: theme.spacing.lg }}>
        <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
          Recent events
        </Text>
        {recent.length === 0 ? (
          <Text variant="caption" color="textFaint">
            Start Talk to Oppuna, then open this page. Leaving the conversation keeps the captured audio.
          </Text>
        ) : (
          recent.map((event, index) => (
            <Text key={`${event.kind}-${index}`} variant="caption" color="textMuted" style={{ marginBottom: 4 }}>
              {formatEvent(event)}
            </Text>
          ))
        )}
      </View>
    </Screen>
  );
}

function formatEvent(event: AudioDebugSnapshot['events'][number]): string {
  switch (event.kind) {
    case 'input_format':
      return `input ${event.sampleRate} Hz · ${event.channels} ch · context ${event.contextSampleRate} Hz`;
    case 'output_format':
      return `output ${event.sampleRate} Hz · ${event.channels} ch · context ${event.contextSampleRate} Hz`;
    case 'chunk':
      return `chunk ${event.sequence} · ${event.replyId} · ${event.durationMs} ms · queue ${event.queueLength}`;
    case 'playback_start':
      return `play start ${event.sequence} · ${event.replyId}`;
    case 'playback_end':
      return `play end ${event.sequence} · ${event.replyId}`;
    case 'interrupt':
      return `interrupt · ${event.replyId || '—'}`;
    case 'queue_flush':
      return `flush · ${event.replyId || '—'} · dropped ${event.dropped}`;
    case 'dropped':
      return `dropped ${event.reason} · ${event.replyId}`;
    default:
      return 'audio event';
  }
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
