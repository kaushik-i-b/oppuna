import { createReplyGate } from '@/voice/replyGate';
import { reduceVoicePhase } from '@/voice/stateMachine';
import { createToolLedger } from '@/voice/toolLedger';
import { parseServerEvent } from '@/voice/protocol';
import { mergeTranscriptDelta } from '@/voice/transcript';
import {
  AssemblyAIVoiceService,
  type VoiceRuntimeEvent,
  type VoiceSocket,
  type VoiceSocketFactory,
} from '@/voice/AssemblyAIVoiceService';
import type { VoiceAudioPort } from '@/voice/audio/types';
import { createMemoryStore } from '@/voice/memoryStore';

describe('interruption state transition', () => {
  it('moves from speaking to interrupted, then back to listening once playback stops', () => {
    const interrupted = reduceVoicePhase('SPEAKING', { type: 'SPEECH_STARTED' });
    expect(interrupted).toBe('INTERRUPTED');
    expect(reduceVoicePhase(interrupted, { type: 'PLAYBACK_CLEARED' })).toBe('LISTENING');
    expect(reduceVoicePhase('SPEAKING', { type: 'REPLY_INTERRUPTED' })).toBe('INTERRUPTED');
  });

  it('does not stay on connecting, thinking, or saving after a timeout', () => {
    expect(reduceVoicePhase('CONNECTING', { type: 'TIMEOUT' })).toBe('ERROR');
    expect(reduceVoicePhase('THINKING', { type: 'TIMEOUT' })).toBe('LISTENING');
    expect(reduceVoicePhase('SAVING', { type: 'TIMEOUT' })).toBe('ERROR');
    expect(reduceVoicePhase('INTERRUPTED', { type: 'TIMEOUT' })).toBe('LISTENING');
  });
});

describe('duplicate tool-call protection', () => {
  it('executes a call id once and reuses the first result', () => {
    const ledger = createToolLedger();
    expect(ledger.claim('call-1').duplicate).toBe(false);
    expect(ledger.claim('call-1').duplicate).toBe(true);
    ledger.complete('call-1', '{"ok":true}');
    expect(ledger.claim('call-1')).toEqual({ duplicate: true, priorResult: '{"ok":true}' });
  });
});

describe('live transcript events', () => {
  it('reads the cumulative text field used by the voice agent', () => {
    const parsed = parseServerEvent(
      JSON.stringify({
        type: 'transcript.user.delta',
        item_id: 'item-1',
        text: 'Work today was exhausting',
      }),
    );
    expect(parsed).toEqual({ type: 'transcript.user.delta', delta: 'Work today was exhausting' });
  });
});

describe('transcript merging', () => {
  it('replaces a partial with the cumulative transcript and ignores a duplicate final chunk', () => {
    expect(mergeTranscriptDelta('', 'Today')).toBe('Today');
    expect(mergeTranscriptDelta('Today', 'Today was')).toBe('Today was');
    expect(mergeTranscriptDelta('Today was', ' exhausting')).toBe('Today was exhausting');
    expect(mergeTranscriptDelta('Today was exhausting', 'Today was exhausting')).toBe('Today was exhausting');
    expect(mergeTranscriptDelta('Where?', 'Work today was exhausting')).toBe('Work today was exhausting');
  });
});

describe('reply audio gate', () => {
  it('drops audio from an interrupted reply and accepts the next reply', () => {
    const gate = createReplyGate();
    const first = gate.beginReply();
    expect(gate.acceptAudio(first)).toBe(true);
    gate.interrupt(first);
    expect(gate.acceptAudio(first)).toBe(false);
    const second = gate.beginReply();
    expect(gate.acceptAudio(first)).toBe(false);
    expect(gate.acceptAudio(second)).toBe(true);
  });
});

class FakeSocket implements VoiceSocket {
  sent: string[] = [];
  send(data: string): void {
    this.sent.push(data);
  }
  close(): void {
    this.closed = true;
  }
  closed = false;
}

describe('AssemblyAIVoiceService', () => {
  function harness(): {
    service: AssemblyAIVoiceService;
    socket: FakeSocket;
    emit: (payload: unknown) => void;
    events: VoiceRuntimeEvent[];
    audio: { played: number; stopped: number; stops: string[]; plays: string[] };
    store: ReturnType<typeof createMemoryStore>;
  } {
    const socket = new FakeSocket();
    let emit: (payload: unknown) => void = () => undefined;
    const sockets: VoiceSocketFactory = {
      connect(_url, handlers) {
        emit = (payload) => handlers.onMessage(JSON.stringify(payload));
        return Promise.resolve(socket);
      },
    };
    const audioState = { played: 0, stopped: 0, stops: [] as string[], plays: [] as string[] };
    const audio: VoiceAudioPort = {
      supportsStreaming: true,
      async startCapture() {
        return undefined;
      },
      async stopCapture() {
        return undefined;
      },
      beginReply(replyId) {
        audioState.plays.push(`begin:${replyId}`);
      },
      playPcm16Base64(_base64, _rate, replyId) {
        audioState.played += 1;
        audioState.plays.push(replyId);
      },
      stopPlayback(replyId) {
        audioState.stopped += 1;
        audioState.stops.push(replyId ?? '*');
        return 0;
      },
    };
    const events: VoiceRuntimeEvent[] = [];
    const store = createMemoryStore();
    const service = new AssemblyAIVoiceService({
      fetchToken: async () => ({ token: 'temporary-token' }),
      sockets,
      audio,
      store,
      localSessionId: 'local-session',
      buildPrompt: async () => 'You are Oppuna.',
      onEvent: (event) => events.push(event),
    });
    return { service, socket, emit: (payload) => emit(payload), events, audio: audioState, store };
  }

  it('configures a realtime session without sending an API key', async () => {
    const { service, socket } = harness();
    await service.start();
    const update = socket.sent.map((line) => JSON.parse(line) as { type: string; session?: { tools?: { name: string }[] } });
    expect(update[0]?.type).toBe('session.update');
    expect(update[0]?.session?.tools?.map((tool) => tool.name)).toEqual([
      'save_reflection',
      'get_recent_reflections',
      'record_mood',
      'get_reflection_patterns',
    ]);
    expect(JSON.stringify(socket.sent)).not.toContain('ASSEMBLYAI_API_KEY');
    expect(JSON.stringify(socket.sent)).not.toContain('your_assemblyai_api_key');
  });

  it('stops playback when the user interrupts and ignores late audio', async () => {
    const { service, emit, audio } = harness();
    await service.start();
    emit({ type: 'session.ready', session_id: 'remote-1' });
    await Promise.resolve();
    emit({ type: 'reply.started', reply_id: 'reply-1' });
    emit({ type: 'reply.audio', data: 'AAAA' });
    emit({ type: 'input.speech.started' });
    emit({ type: 'reply.audio', data: 'AAAA' });
    await Promise.resolve();
    expect(audio.played).toBe(1);
    expect(audio.stopped).toBeGreaterThan(0);
    expect(audio.stops).toContain('reply-1');
  });

  it('flushes a finished reply when the user speaks and does not drop the next reply', async () => {
    const { service, emit, audio } = harness();
    await service.start();
    emit({ type: 'session.ready', session_id: 'remote-1' });
    await Promise.resolve();
    emit({ type: 'reply.started', reply_id: 'reply-1' });
    emit({ type: 'reply.audio', data: 'AAAA' });
    emit({ type: 'reply.done', reply_id: 'reply-1', status: 'completed' });
    emit({ type: 'input.speech.started' });
    emit({ type: 'reply.started', reply_id: 'reply-2' });
    emit({ type: 'reply.audio', data: 'BBBB' });
    emit({ type: 'reply.done', reply_id: 'reply-1', status: 'interrupted' });
    await Promise.resolve();
    expect(audio.plays).toEqual(['begin:reply-1', 'reply-1', 'begin:reply-2', 'reply-2']);
    expect(audio.stops).toEqual(['reply-1', 'reply-1']);
    expect(audio.played).toBe(2);
  });

  it('runs a tool call once when the same call id is delivered twice', async () => {
    const { service, emit, socket, store } = harness();
    await service.start();
    emit({ type: 'session.ready', session_id: 'remote-1' });
    const call = {
      type: 'tool.call',
      call_id: 'call-9',
      name: 'save_reflection',
      arguments: {
        summary: 'Today was exhausting.',
        mood: 'low',
        themes: ['work'],
        concerns: [],
        positiveMoments: [],
        commitments: [],
        excludedTopics: [],
        memoryCandidates: ['Work has been stressful recently'],
      },
    };
    emit(call);
    emit(call);
    await new Promise((resolve) => setTimeout(resolve, 0));
    emit({ type: 'reply.done', status: 'completed' });
    await Promise.resolve();
    expect(await store.listReflections()).toHaveLength(1);
    const results = socket.sent.filter((line) => line.includes('"tool.result"'));
    expect(results).toHaveLength(1);
  });

  it('builds a reflection preview when a save request ends with no speech and no tool call', async () => {
    const { service, emit, socket, events, store } = harness();
    await service.start();
    emit({ type: 'session.ready', session_id: 'remote-1' });
    emit({
      type: 'transcript.user',
      text: 'I could not switch off after I came home.',
    });
    emit({
      type: 'transcript.user',
      text: "Please turn this into today's reflection and leave out the argument.",
    });
    emit({ type: 'reply.started', reply_id: 'reply-1' });
    emit({ type: 'reply.done', reply_id: 'reply-1', status: 'completed' });
    await Promise.resolve();
    expect(socket.sent.some((line) => line.includes('"reply.create"'))).toBe(false);
    const draft = events.find((event) => event.type === 'tool_effect');
    expect(draft && draft.type === 'tool_effect' && draft.effect.type).toBe('reflection_draft');
    const stored = await store.listReflections();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.summary).toContain('switch off');
    expect(stored[0]?.summary.toLowerCase()).not.toContain('argument');
    expect(stored[0]?.userApproved).toBe(false);
  });

  it('does not nudge after a spoken reply or an unrelated turn', async () => {
    const { service, emit, socket } = harness();
    await service.start();
    emit({ type: 'session.ready', session_id: 'remote-1' });
    emit({ type: 'transcript.user', text: 'Today was exhausting.' });
    emit({ type: 'reply.started', reply_id: 'reply-1' });
    emit({ type: 'reply.done', reply_id: 'reply-1', status: 'completed' });
    emit({
      type: 'transcript.user',
      text: "Please turn this into today's reflection.",
    });
    emit({ type: 'reply.started', reply_id: 'reply-2' });
    emit({ type: 'reply.audio', data: 'AAAA', reply_id: 'reply-2' });
    emit({ type: 'reply.done', reply_id: 'reply-2', status: 'completed' });
    expect(socket.sent.some((line) => line.includes('"reply.create"'))).toBe(false);
  });
});
