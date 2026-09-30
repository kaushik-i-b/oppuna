import { Platform } from 'react-native';

import { recordAudioDiagnostic } from '@/voice/audio/audioDiagnostics';
import type { VoiceAudioPort } from '@/voice/audio/types';
import type { VoiceMemoryStore } from '@/voice/memoryStore';
import { VOICE_SAMPLE_RATE } from '@/voice/pcm';
import { OPPUNA_VOICE_GREETING } from '@/voice/prompt';
import { parseServerEvent } from '@/voice/protocol';
import { createReplyGate } from '@/voice/replyGate';
import { executeVoiceTool, VOICE_TOOLS } from '@/voice/tools';
import { createToolLedger } from '@/voice/toolLedger';
import { mergeTranscriptDelta } from '@/voice/transcript';
import type { ToolEffect } from '@/voice/types';
import { voiceLog } from '@/voice/voiceLog';

const AGENT_SOCKET_URL = 'wss://agents.assemblyai.com/v1/ws';
const MAX_RECONNECTS = 2;

export interface VoiceSocket {
  send(data: string): void;
  close(): void;
}

export interface VoiceSocketFactory {
  connect(
    url: string,
    handlers: {
      onMessage: (data: string) => void;
      onClose: (info: { code: number; reason: string }) => void;
      onError: () => void;
    },
  ): Promise<VoiceSocket>;
}

export type VoiceRuntimeEvent =
  | { type: 'connecting' }
  | { type: 'session_ready' }
  | { type: 'connect_failed'; message: string }
  | { type: 'speech_started' }
  | { type: 'speech_stopped' }
  | { type: 'user_partial'; turnId: string; text: string }
  | { type: 'user_final'; turnId: string; text: string }
  | { type: 'reply_started'; replyId: string }
  | { type: 'reply_completed' }
  | { type: 'reply_interrupted' }
  | { type: 'playback_cleared' }
  | { type: 'agent_transcript'; replyId: string; text: string; interrupted: boolean }
  | { type: 'tool_effect'; effect: ToolEffect }
  | { type: 'failed'; message: string }
  | { type: 'ended' };

export interface AssemblyAIVoiceServiceOptions {
  fetchToken: () => Promise<{ token: string }>;
  sockets: VoiceSocketFactory;
  audio: VoiceAudioPort;
  store: VoiceMemoryStore;
  localSessionId: string;
  buildPrompt: () => Promise<string>;
  onEvent: (event: VoiceRuntimeEvent) => void;
}

function microphoneMessage(error: unknown): string {
  const name =
    error && typeof error === 'object' && 'name' in error ? String((error as { name: string }).name) : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
    return 'Microphone permission is needed for Talk to Oppuna. Allow the microphone and try again.';
  }
  if (error instanceof Error && error.message === 'microphone_unavailable') {
    if (Platform.OS === 'android') {
      return 'This Android build does not include the live microphone stream.';
    }
    return 'Realtime voice uses the browser microphone. Open Oppuna with npm run web, then tap Talk to Oppuna.';
  }
  return 'Could not start the microphone.';
}

/** Browser/React Native WebSocket. The API key never reaches this factory. */
export function createBrowserSocketFactory(): VoiceSocketFactory {
  return {
    connect(url, handlers) {
      return new Promise((resolve, reject) => {
        let opened = false;
        const ws = new WebSocket(url);
        ws.onopen = () => {
          opened = true;
          resolve({
            send: (data: string) => {
              if (ws.readyState === WebSocket.OPEN) ws.send(data);
            },
            close: () => ws.close(),
          });
        };
        ws.onmessage = (event) => {
          handlers.onMessage(typeof event.data === 'string' ? event.data : '');
        };
        ws.onerror = () => {
          if (!opened) reject(new Error('Could not reach AssemblyAI.'));
          else handlers.onError();
        };
        ws.onclose = (event) => {
          if (!opened) {
            reject(new Error(event.reason || 'AssemblyAI connection closed before it was ready.'));
            return;
          }
          handlers.onClose({ code: event.code, reason: event.reason });
        };
      });
    },
  };
}

export class AssemblyAIVoiceService {
  private socket: VoiceSocket | null = null;
  private ready = false;
  private remoteSessionId: string | null = null;
  private endedByUser = false;
  private reconnects = 0;
  private reconnecting = false;
  private capturing = false;
  private turn = 0;
  private partial = '';
  private readonly gate = createReplyGate();
  private readonly ledger = createToolLedger();
  private pendingResults: { callId: string; resultJson: string }[] = [];
  private replyGeneration = 0;
  private activeReplyId = '';
  private interruptedReplyId = '';
  private replyOpen = false;

  constructor(private readonly options: AssemblyAIVoiceServiceOptions) {}

  async start(): Promise<void> {
    this.endedByUser = false;
    this.ready = false;
    this.options.onEvent({ type: 'connecting' });
    try {
      await this.openSocket(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start the voice session.';
      this.options.onEvent({ type: 'connect_failed', message });
    }
  }

  async end(options?: { notify?: boolean }): Promise<void> {
    this.endedByUser = true;
    this.ready = false;
    this.replyOpen = false;
    this.stopPlaybackNow();
    await this.stopCapture();
    try {
      this.socket?.send(JSON.stringify({ type: 'session.end' }));
    } catch {
      // Closing anyway.
    }
    this.socket?.close();
    this.socket = null;
    voiceLog('session ended');
    if (options?.notify !== false) this.options.onEvent({ type: 'ended' });
  }

  interruptPlayback(): void {
    this.stopPlaybackNow();
    this.options.onEvent({ type: 'playback_cleared' });
  }

  async pauseForBackground(): Promise<void> {
    this.interruptPlayback();
    await this.stopCapture();
  }

  async resumeFromBackground(): Promise<void> {
    if (!this.ready || this.endedByUser) return;
    await this.ensureCapture();
  }

  private stopPlaybackNow(replyId?: string): number {
    const target = replyId || this.activeReplyId;
    if (!replyId || replyId === this.activeReplyId) {
      this.gate.interrupt(this.replyGeneration);
      this.replyOpen = false;
    }
    return this.options.audio.stopPlayback(target || undefined);
  }

  private async openSocket(resume: boolean): Promise<void> {
    const { token } = await this.options.fetchToken();
    if (!token) throw new Error('The voice token server did not return a token.');
    const url = `${AGENT_SOCKET_URL}?token=${encodeURIComponent(token)}`;
    const socket = await this.options.sockets.connect(url, {
      onMessage: (data) => {
        void this.handleMessage(data);
      },
      onClose: (info) => {
        void this.handleClose(info);
      },
      onError: () => {
        voiceLog('AssemblyAI connection failure');
      },
    });
    this.socket = socket;
    if (resume && this.remoteSessionId) {
      socket.send(JSON.stringify({ type: 'session.resume', session_id: this.remoteSessionId }));
      voiceLog('AssemblyAI reconnect');
      return;
    }
    const prompt = await this.options.buildPrompt();
    socket.send(
      JSON.stringify({
        type: 'session.update',
        session: {
          system_prompt: prompt,
          greeting: OPPUNA_VOICE_GREETING,
          input: {
            format: { encoding: 'audio/pcm' },
            keyterms: ['Oppuna'],
            turn_detection: {
              vad_threshold: 0.5,
              min_silence: 700,
              max_silence: 1800,
              interrupt_response: true,
            },
          },
          output: {
            voice: 'alba',
            format: { encoding: 'audio/pcm' },
            volume: 100,
          },
          tools: VOICE_TOOLS,
        },
      }),
    );
  }

  private async ensureCapture(): Promise<void> {
    if (this.capturing) return;
    if (!this.options.audio.supportsStreaming) {
      throw new Error('microphone_unavailable');
    }
    await this.options.audio.startCapture((chunk) => {
      if (!this.ready || !this.socket) return;
      this.socket.send(JSON.stringify({ type: 'input.audio', audio: chunk }));
    });
    this.capturing = true;
    voiceLog('listening');
  }

  private async stopCapture(): Promise<void> {
    if (!this.capturing) return;
    this.capturing = false;
    await this.options.audio.stopCapture();
  }

  private async handleClose(info: { code: number; reason: string }): Promise<void> {
    this.ready = false;
    this.socket = null;
    await this.stopCapture();
    if (this.endedByUser) return;
    if (this.remoteSessionId && this.reconnects < MAX_RECONNECTS && !this.reconnecting) {
      this.reconnecting = true;
      this.reconnects += 1;
      this.options.onEvent({ type: 'connecting' });
      try {
        await this.openSocket(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Reconnection failed.';
        this.options.onEvent({ type: 'failed', message });
      } finally {
        this.reconnecting = false;
      }
      return;
    }
    const message = info.reason || 'The voice connection dropped. You can try again.';
    this.options.onEvent({ type: 'failed', message });
  }

  private flushToolResults(): void {
    const batch = this.pendingResults.splice(0, this.pendingResults.length);
    for (const item of batch) {
      this.socket?.send(
        JSON.stringify({ type: 'tool.result', call_id: item.callId, result: item.resultJson }),
      );
    }
  }

  private queueToolResult(callId: string, resultJson: string): void {
    if (this.pendingResults.some((item) => item.callId === callId)) return;
    this.pendingResults.push({ callId, resultJson });
  }

  private async handleMessage(raw: string): Promise<void> {
    if (!raw) return;
    const event = parseServerEvent(raw);
    if (!event) {
      voiceLog('malformed event ignored');
      return;
    }

    switch (event.type) {
      case 'session.ready':
        if (event.sessionId) this.remoteSessionId = event.sessionId;
        this.ready = true;
        this.reconnects = 0;
        voiceLog('AssemblyAI connected');
        try {
          await this.ensureCapture();
          this.options.onEvent({ type: 'session_ready' });
        } catch (error) {
          this.options.onEvent({ type: 'connect_failed', message: microphoneMessage(error) });
          await this.end({ notify: false });
        }
        return;
      case 'input.speech.started': {
        const wasOpen = this.replyOpen;
        this.interruptedReplyId = this.activeReplyId;
        if (wasOpen) {
          voiceLog('interruption detected');
          this.options.onEvent({ type: 'reply_interrupted' });
        }
        this.stopPlaybackNow(this.activeReplyId);
        if (wasOpen) this.options.onEvent({ type: 'playback_cleared' });
        this.turn += 1;
        this.partial = '';
        voiceLog('turn detected');
        this.options.onEvent({ type: 'speech_started' });
        return;
      }
      case 'transcript.user.delta': {
        this.partial = mergeTranscriptDelta(this.partial, event.delta);
        this.options.onEvent({
          type: 'user_partial',
          turnId: `user-${this.turn}`,
          text: this.partial,
        });
        return;
      }
      case 'input.speech.stopped':
        this.options.onEvent({ type: 'speech_stopped' });
        return;
      case 'transcript.user': {
        const text = event.text.trim();
        voiceLog('transcript finalized', { empty: text.length === 0 });
        this.partial = '';
        this.options.onEvent({ type: 'user_final', turnId: `user-${this.turn}`, text });
        return;
      }
      case 'reply.started':
        this.replyGeneration = this.gate.beginReply();
        this.replyOpen = true;
        this.activeReplyId = event.replyId || `reply-${this.replyGeneration}`;
        this.options.audio.beginReply(this.activeReplyId);
        voiceLog('agent response started');
        this.options.onEvent({ type: 'reply_started', replyId: this.activeReplyId });
        return;
      case 'reply.audio':
        if (!event.data || !this.gate.acceptAudio(this.replyGeneration)) {
          if (event.data) {
            recordAudioDiagnostic({
              kind: 'dropped',
              replyId: this.activeReplyId,
              sequence: 0,
              reason: 'stale',
            });
          }
          return;
        }
        this.options.audio.playPcm16Base64(event.data, VOICE_SAMPLE_RATE, this.activeReplyId);
        return;
      case 'transcript.agent': {
        const replyId = event.replyId || this.activeReplyId;
        this.options.onEvent({
          type: 'agent_transcript',
          replyId,
          text: event.text,
          interrupted: event.interrupted,
        });
        return;
      }
      case 'tool.call':
        await this.handleTool(event.call.callId, event.call.name, event.call.arguments);
        return;
      case 'reply.done': {
        const finishedId = event.replyId || this.interruptedReplyId || this.activeReplyId;
        const stillCurrent = !finishedId || finishedId === this.activeReplyId;
        if (stillCurrent) this.replyOpen = false;
        this.flushToolResults();
        if (event.status === 'interrupted') {
          this.stopPlaybackNow(finishedId);
          if (stillCurrent) {
            voiceLog('interruption detected');
            this.options.onEvent({ type: 'reply_interrupted' });
            this.options.onEvent({ type: 'playback_cleared' });
          }
        } else if (stillCurrent) {
          this.options.onEvent({ type: 'reply_completed' });
        }
        return;
      }
      case 'session.ended':
        voiceLog('session ended');
        this.options.onEvent({ type: 'ended' });
        return;
      case 'session.error':
        voiceLog('AssemblyAI connection failure', { code: event.code });
        this.options.onEvent({ type: 'failed', message: event.message });
        return;
      default:
        return;
    }
  }

  private async handleTool(callId: string, name: string, args: unknown): Promise<void> {
    const claim = this.ledger.claim(callId);
    if (claim.duplicate) {
      voiceLog('duplicate tool call ignored', { tool: name });
      if (claim.priorResult) this.queueToolResult(callId, claim.priorResult);
      return;
    }
    voiceLog('tool requested', { tool: name });
    try {
      const execution = await executeVoiceTool(
        name,
        args,
        this.options.store,
        this.options.localSessionId,
        callId,
      );
      const resultJson = JSON.stringify(execution.result);
      this.ledger.complete(callId, resultJson);
      this.queueToolResult(callId, resultJson);
      if (execution.effect.type === 'reflection_draft') voiceLog('reflection generated');
      voiceLog('tool completed', { tool: name });
      this.options.onEvent({ type: 'tool_effect', effect: execution.effect });
    } catch (error) {
      const resultJson = JSON.stringify({
        ok: false,
        error: 'tool_failed',
        message: error instanceof Error ? error.message : 'Tool failed',
      });
      this.ledger.complete(callId, resultJson);
      this.queueToolResult(callId, resultJson);
      voiceLog('tool completed', { tool: name, ok: false });
    }
  }
}

