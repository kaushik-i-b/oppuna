/**
 * AssemblyAI realtime adapter — the single place the app touches AssemblyAI.
 *
 * Responsibilities: establish the realtime session (short-lived temporary
 * token minted by a server endpoint — API keys never ship in the client),
 * stream microphone audio, emit transcript.partial/final + turn events,
 * maintain connection state, reconnect with backoff, and terminate cleanly.
 *
 * Implementation notes (verified against `assemblyai@4.41.5`):
 * - Uses `RealtimeTranscriber` from the `assemblyai` SDK with
 *   `{ token, sampleRate }`; events `open`, `transcript.partial`,
 *   `transcript.final`, `error`, `close`; methods `connect()`,
 *   `sendAudio()`, `close()`. Final transcripts double as turn events.
 * - The SDK is dynamically imported so unit tests and offline startup never
 *   pay for it, and so a missing/broken SDK falls back to local transport.
 * - When no token endpoint is configured (`EXPO_PUBLIC_VOICE_TOKEN_URL`
 *   empty), the service runs in `local` transport mode: the controller feeds
 *   user text directly (typed or on-device chunk) and the rest of the
 *   pipeline — state machine, tools, memory — is identical. AssemblyAI is
 *   first-class when available, never a hard dependency.
 */

import { setVoiceNetworkingEnabled } from '@/services/networkGuard';
import { logVoiceEvent } from '@/voice/voiceLogger';
import { logger } from '@/utils/logger';

export type VoiceTransport = 'assemblyai' | 'local';
export type VoiceConnection = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface AssemblyAIVoiceEvents {
  onPartial?: (text: string) => void;
  onFinal?: (text: string, turnId: number) => void;
  onConnectionChange?: (connection: VoiceConnection) => void;
  onError?: (message: string, recoverable: boolean) => void;
}

interface RealtimeTranscriberLike {
  on(event: 'open', listener: (info: unknown) => void): void;
  on(event: 'transcript.partial', listener: (t: { text: string }) => void): void;
  on(event: 'transcript.final', listener: (t: { text: string }) => void): void;
  on(event: 'error', listener: (e: Error) => void): void;
  on(event: 'close', listener: (code: number, reason: string) => void): void;
  connect(): Promise<unknown>;
  sendAudio(audio: unknown): void;
  forceEndUtterance(): void;
  close(waitForTermination?: boolean, timeoutMs?: number): Promise<void>;
}

const SAMPLE_RATE = 16000;
const MAX_RECONNECTS = 3;

function tokenUrl(): string {
  return (process.env.EXPO_PUBLIC_VOICE_TOKEN_URL ?? '').trim().replace(/\/$/, '');
}

async function mintTemporaryToken(): Promise<string> {
  const url = tokenUrl();
  if (!url) throw new Error('Voice token endpoint is not configured');
  const response = await fetch(`${url}/api/voice-token`, { method: 'POST' });
  if (!response.ok) throw new Error(`Token endpoint returned ${response.status}`);
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error('Token endpoint returned no token');
  return body.token;
}

export class AssemblyAIVoiceService {
  private transcriber: RealtimeTranscriberLike | null = null;
  private connection: VoiceConnection = 'disconnected';
  private transport: VoiceTransport = 'local';
  private reconnects = 0;
  private closedByUser = false;
  private turnId = 0;
  private events: AssemblyAIVoiceEvents = {};

  getTransport(): VoiceTransport {
    return this.transport;
  }

  getConnection(): VoiceConnection {
    return this.connection;
  }

  setEvents(events: AssemblyAIVoiceEvents): void {
    this.events = events;
  }

  private setConnection(next: VoiceConnection): void {
    this.connection = next;
    this.events.onConnectionChange?.(next);
  }

  /** Establish the realtime session. Falls back to local transport without a token. */
  async connect(): Promise<VoiceTransport> {
    this.closedByUser = false;
    this.reconnects = 0;
    this.setConnection('connecting');
    logVoiceEvent('voice:listening');

    if (!tokenUrl()) {
      this.transport = 'local';
      this.setConnection('connected');
      logVoiceEvent('assemblyai:connected', { transport: 'local-fallback' });
      return 'local';
    }

    this.transport = 'assemblyai';
    // Narrow, session-scoped network exception for AssemblyAI + token host.
    setVoiceNetworkingEnabled(true);
    try {
      const token = await mintTemporaryToken();
      await this.openTranscriber(token);
      this.setConnection('connected');
      logVoiceEvent('assemblyai:connected', { transport: 'assemblyai' });
      return 'assemblyai';
    } catch (error) {
      logger.warn('AssemblyAI connect failed, using local transport', {
        error: String(error),
      });
      this.transport = 'local';
      this.setConnection('connected');
      logVoiceEvent('assemblyai:connected', { transport: 'local-fallback' });
      return 'local';
    }
  }

  private async openTranscriber(token: string): Promise<void> {
    const module = (await import('assemblyai')) as unknown as {
      RealtimeTranscriber: new (params: Record<string, unknown>) => RealtimeTranscriberLike;
    };
    const Transcriber = module.RealtimeTranscriber;
    if (!Transcriber) throw new Error('AssemblyAI SDK missing RealtimeTranscriber');
    const transcriber = new Transcriber({ token, sampleRate: SAMPLE_RATE });
    transcriber.on('open', () => {
      this.reconnects = 0;
      this.setConnection('connected');
      logVoiceEvent('assemblyai:connected', { transport: 'assemblyai' });
    });
    transcriber.on('transcript.partial', (t) => {
      if (t?.text) this.events.onPartial?.(t.text);
    });
    transcriber.on('transcript.final', (t) => {
      const text = t?.text?.trim();
      if (!text) return;
      this.turnId += 1;
      logVoiceEvent('voice:transcript-final');
      logVoiceEvent('voice:turn-detected');
      this.events.onFinal?.(text, this.turnId);
    });
    transcriber.on('error', (error) => {
      logVoiceEvent('voice:error', { error: String(error?.message ?? error) });
      void this.handleDrop(String(error?.message ?? error));
    });
    transcriber.on('close', () => {
      if (!this.closedByUser && this.transport === 'assemblyai') {
        void this.handleDrop('socket closed');
      }
    });
    this.transcriber = transcriber;
    await transcriber.connect();
  }

  private async handleDrop(reason: string): Promise<void> {
    if (this.closedByUser || this.transport !== 'assemblyai') return;
    if (this.reconnects >= MAX_RECONNECTS) {
      this.setConnection('error');
      this.events.onError?.(`Lost connection to the voice service (${reason}). You can keep talking — I will stay with you on-device.`, true);
      // Degrade gracefully to local transport instead of stranding the user.
      this.transport = 'local';
      this.setConnection('connected');
      return;
    }
    this.reconnects += 1;
    this.setConnection('reconnecting');
    logVoiceEvent('assemblyai:reconnecting', { attempt: this.reconnects });
    await new Promise((resolve) => setTimeout(resolve, 500 * this.reconnects));
    if (this.closedByUser) return;
    try {
      const token = await mintTemporaryToken();
      await this.openTranscriber(token);
      this.setConnection('connected');
    } catch (error) {
      await this.handleDrop(String(error));
    }
  }

  /** Stream microphone PCM audio (Int16Array / Float32Array / ArrayBuffer). */
  sendAudio(chunk: unknown): void {
    if (this.transport !== 'assemblyai' || !this.transcriber) return;
    try {
      this.transcriber.sendAudio(chunk);
    } catch (error) {
      logger.warn('sendAudio failed', { error: String(error) });
    }
  }

  forceEndUtterance(): void {
    try {
      this.transcriber?.forceEndUtterance();
    } catch {
      // Local transport has no utterance concept.
    }
  }

  /** Local-transport entry point: inject a partial transcript (typed fallback). */
  injectPartial(text: string): void {
    if (this.transport !== 'local') return;
    this.events.onPartial?.(text);
  }

  /** Local-transport entry point: inject a finalized user turn. */
  injectFinal(text: string): void {
    if (this.transport !== 'local') return;
    const trimmed = text.trim();
    if (!trimmed) return;
    this.turnId += 1;
    logVoiceEvent('voice:transcript-final');
    logVoiceEvent('voice:turn-detected');
    this.events.onFinal?.(trimmed, this.turnId);
  }

  async disconnect(): Promise<void> {
    this.closedByUser = true;
    try {
      await this.transcriber?.close(false);
    } catch {
      // Termination is best-effort.
    }
    this.transcriber = null;
    setVoiceNetworkingEnabled(false);
    this.transport = 'local';
    this.setConnection('disconnected');
    logVoiceEvent('assemblyai:disconnected');
  }
}
