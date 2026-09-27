import { reflectionRepository } from '@/voice/reflectionRepository';
import {
  VoiceSessionController,
  parseExcludedTopic,
  type VoiceServiceLike,
  type VoiceSpeaker,
} from '@/voice/VoiceSessionController';

jest.mock('@/voice/reflectionRepository', () => ({
  __esModule: true,
  reflectionRepository: {
    createVoiceSession: jest.fn(async () => 'session-1'),
    saveSessionTranscript: jest.fn(async () => undefined),
    endVoiceSession: jest.fn(async () => undefined),
    forgetSession: jest.fn(async () => undefined),
    createReflection: jest.fn(async () => ({ id: 'ref-1' })),
    approveReflection: jest.fn(async () => undefined),
    listMemories: jest.fn(async () => []),
    setMemoryApproval: jest.fn(async () => undefined),
  },
}));

jest.mock('@/voice/conversationEngine', () => ({
  __esModule: true,
  composeVoiceReply: jest.fn(async (text: string) => ({
    text: `I hear you about: ${text}`,
    crisis: false,
    usedMemory: null,
  })),
  extractMemoryCandidates: jest.fn(() => []),
}));

jest.mock('@/voice/voiceLogger', () => ({
  __esModule: true,
  logVoiceEvent: jest.fn(),
}));

const mockCreateVoiceSession = jest.mocked(reflectionRepository.createVoiceSession);
const mockForgetSession = jest.mocked(reflectionRepository.forgetSession);
const mockCreateReflection = jest.mocked(reflectionRepository.createReflection);
const mockApproveReflection = jest.mocked(reflectionRepository.approveReflection);
const mockSetMemoryApproval = jest.mocked(reflectionRepository.setMemoryApproval);

function makeHarness(options: { manualSpeech?: boolean } = {}) {
  const events: {
    onPartial?: (text: string) => void;
    onFinal?: (text: string, turnId: number) => void;
    onError?: (message: string, recoverable: boolean) => void;
  } = {};
  const service: VoiceServiceLike = {
    setEvents: (next) => Object.assign(events, next),
    connect: jest.fn(async () => 'local'),
    disconnect: jest.fn(async () => undefined),
  };
  const spoken: string[] = [];
  let speakResolve: (() => void) | null = null;
  const speaker: VoiceSpeaker = {
    // Auto-resolving by default (like real TTS completing); tests that need
    // mid-speech control pass { manualSpeech: true }.
    speak: jest.fn((text: string) => {
      spoken.push(text);
      if (!options.manualSpeech) return Promise.resolve();
      return new Promise<void>((resolve) => {
        speakResolve = resolve;
      });
    }),
    stop: jest.fn(() => {
      speakResolve?.();
      speakResolve = null;
    }),
  };
  const controller = new VoiceSessionController(service, speaker);
  return { controller, events, service, speaker, spoken };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('parseExcludedTopic', () => {
  it('extracts topics from natural exclusion requests', () => {
    expect(parseExcludedTopic("Yes, but don't include the part about my manager.")).toBe('my manager');
    expect(parseExcludedTopic('Do not include work drama')).toBe('work drama');
    expect(parseExcludedTopic('Just save it all.')).toBeNull();
  });
});

describe('VoiceSessionController state machine', () => {
  it('moves IDLE → CONNECTING → LISTENING on start', async () => {
    const { controller } = makeHarness();
    const states: string[] = [];
    controller.subscribe((s) => states.push(s.state));
    await controller.start();
    expect(states).toEqual(expect.arrayContaining(['IDLE', 'CONNECTING', 'LISTENING']));
    expect(controller.snapshot().state).toBe('LISTENING');
    expect(mockCreateVoiceSession).toHaveBeenCalledTimes(1);
  });

  it('merges partials in place and replaces them with one final (no duplicates)', async () => {
    const { controller } = makeHarness();
    await controller.start();
    controller.applyPartial('Today was');
    controller.applyPartial('Today was exhausting');
    expect(controller.snapshot().segments).toHaveLength(1);
    await controller.applyFinal('Today was exhausting.');
    const finals = controller.snapshot().segments.filter((s) => s.final);
    expect(finals).toHaveLength(2); // user final + agent reply
    expect(finals.filter((s) => s.speaker === 'USER')).toHaveLength(1);
    expect(controller.snapshot().livePartial).toBe('');
  });

  it('drops duplicate final deliveries', async () => {
    const { controller } = makeHarness();
    await controller.start();
    await controller.applyFinal('Same line twice.');
    await controller.applyFinal('Same line twice.');
    const userFinals = controller.snapshot().segments.filter((s) => s.speaker === 'USER' && s.final);
    expect(userFinals).toHaveLength(1);
  });

  it('interruption stops speech, returns to LISTENING, and drops stale replies', async () => {
    const { controller, speaker } = makeHarness({ manualSpeech: true });
    await controller.start();
    const firstTurn = controller.applyFinal('First thing I said.');
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.snapshot().state).toBe('SPEAKING');
    controller.interrupt();
    expect(speaker.stop).toHaveBeenCalled();
    expect(controller.snapshot().state).toBe('LISTENING');
    // The stale TTS completion must never overwrite newer state: no extra
    // segment, no re-speak, and the state stays LISTENING (not clobbered).
    await firstTurn;
    expect(controller.snapshot().segments.filter((s) => s.speaker === 'OPPUNA')).toHaveLength(1);
    expect(speaker.speak).toHaveBeenCalledTimes(1);
    expect(controller.snapshot().state).toBe('LISTENING');
    // New turn after interruption is processed normally.
    (speaker.speak as jest.Mock).mockImplementation(() => Promise.resolve());
    await controller.applyFinal('Wait, that is not what bothered me.');
    expect(controller.snapshot().segments.filter((s) => s.speaker === 'OPPUNA')).toHaveLength(2);
  });

  it('never leaves conflicting states after failure', async () => {
    const { controller } = makeHarness();
    await controller.start();
    (controller as unknown as { fail: (m: string) => void }).fail('boom');
    expect(controller.snapshot().state).toBe('ERROR');
    expect(controller.snapshot().errorMessage).toBe('boom');
    controller.recover();
    expect(controller.snapshot().state).toBe('IDLE');
  });
});

describe('reflection + memory approval', () => {
  it('detects excluded topics from the live conversation into the draft', async () => {
    const { controller } = makeHarness();
    await controller.start();
    await controller.applyFinal('Today was exhausting, argument at work.');
    await controller.applyFinal("Yes, but don't include the part about my manager.");
    const draft = controller.buildDraft();
    expect(draft).not.toBeNull();
    expect(draft?.excludedTopics).toContain('my manager');
  });

  it('saves only approved memories and approves the reflection', async () => {
    const { controller } = makeHarness();
    await controller.start();
    await controller.applyFinal('Evening walks help me unwind after work stress.');
    const draft = controller.buildDraft();
    expect(draft).not.toBeNull();
    const savedId = await controller.saveDraft();
    expect(savedId).toBe('ref-1');
    expect(mockCreateReflection).toHaveBeenCalledTimes(1);
    expect(mockApproveReflection).toHaveBeenCalledWith('ref-1');
    // Second save with identical content reuses the idempotent tool result.
    await controller.saveDraft();
    expect(mockCreateReflection).toHaveBeenCalledTimes(1);
  });
});

describe('forget-conversation', () => {
  it('clears local context and calls forgetSession without touching approved memories directly', async () => {
    const { controller } = makeHarness();
    await controller.start();
    await controller.applyFinal('Something private.');
    await controller.forget();
    expect(mockForgetSession).toHaveBeenCalledWith('session-1');
    const snapshot = controller.snapshot();
    expect(snapshot.segments).toEqual([]);
    expect(snapshot.draft).toBeNull();
    expect(snapshot.state).toBe('IDLE');
    // Forget must never call destructive memory APIs itself.
    expect(mockSetMemoryApproval).not.toHaveBeenCalled();
  });
});
