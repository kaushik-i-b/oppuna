import { reflectionRepository } from '@/voice/reflectionRepository';
import { moodRepository } from '@/database';
import { ToolExecutor } from '@/voice/tools';

jest.mock('@/voice/reflectionRepository', () => ({
  __esModule: true,
  applyExcludedTopics: (summary: string) => summary,
  computeReflectionPatterns: () => ({
    period: '7d',
    reflectionCount: 0,
    topThemes: [],
    topConcerns: [],
    moodTrend: 'insufficient',
    summary: 'none',
  }),
  reflectionRepository: {
    createReflection: jest.fn(async () => ({ id: 'ref-1' })),
    approveReflection: jest.fn(async () => undefined),
    listMemories: jest.fn(async () => []),
    getApprovedMemories: jest.fn(async () => []),
    listRecentReflections: jest.fn(async () => []),
  },
}));

jest.mock('@/database', () => ({
  __esModule: true,
  moodRepository: { create: jest.fn(async (input: unknown) => ({ id: 'm1', ...(input as object) })) },
}));

const mockCreateReflection = jest.mocked(reflectionRepository.createReflection);
const mockGetApprovedMemories = jest.mocked(reflectionRepository.getApprovedMemories);
const mockListRecentReflections = jest.mocked(reflectionRepository.listRecentReflections);
const mockMoodCreate = jest.mocked(moodRepository.create);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetApprovedMemories.mockResolvedValue([]);
  mockListRecentReflections.mockResolvedValue([]);
});

describe('ToolExecutor — save_reflection', () => {
  it('creates the reflection with memory candidates unapproved-by-default at storage', async () => {
    mockCreateReflection.mockResolvedValue({ id: 'ref-1' } as never);
    const executor = new ToolExecutor();
    await executor.execute('call-1', 'save_reflection', {
      summary: 'A hard day.',
      mood: 'exhausted',
      memoryCandidates: ['Work has been stressful'],
    }, 'session-1');
    expect(mockCreateReflection).toHaveBeenCalledTimes(1);
    expect(mockCreateReflection).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'A hard day.',
        sessionId: 'session-1',
        memoryCandidates: ['Work has been stressful'],
      }),
    );
  });

  it('rejects empty summaries instead of saving nothing', async () => {
    const executor = new ToolExecutor();
    await expect(
      executor.execute('call-2', 'save_reflection', { summary: '   ' }, 'session-1'),
    ).rejects.toThrow(/non-empty summary/);
    expect(mockCreateReflection).not.toHaveBeenCalled();
  });

  it('duplicate tool-call deliveries persist only once (idempotent)', async () => {
    mockCreateReflection.mockResolvedValue({ id: 'ref-dedupe' } as never);
    const executor = new ToolExecutor();
    const args = { summary: 'Same turn, delivered twice.' };
    const [first, second] = await Promise.all([
      executor.execute('call-dupe', 'save_reflection', args, 'session-1'),
      executor.execute('call-dupe', 'save_reflection', args, 'session-1'),
    ]);
    expect(first).toEqual(second);
    expect(mockCreateReflection).toHaveBeenCalledTimes(1);
  });

  it('throws for unknown tools', async () => {
    const executor = new ToolExecutor();
    await expect(executor.execute('call-x', 'invent_trend', {}, 's')).rejects.toThrow(/Unknown voice tool/);
  });
});

describe('ToolExecutor — retrieval guards', () => {
  it('returns only approved-memory context, never raw transcripts', async () => {
    mockGetApprovedMemories.mockResolvedValue([
      { id: 'm1', text: 'Evening walks help', createdAt: 1 },
    ]);
    mockListRecentReflections.mockResolvedValue([
      {
        id: 'r1',
        summary: 'Tired after work.',
        mood: 'exhausted',
        themes: ['work'],
        userApproved: true,
      } as never,
    ]);
    const executor = new ToolExecutor();
    const result = (await executor.execute('call-r', 'get_recent_reflections', { limit: 3 })) as {
      approvedMemories: string[];
      recentReflections: unknown[];
    };
    expect(result.approvedMemories).toEqual(['Evening walks help']);
    expect(JSON.stringify(result)).not.toMatch(/transcript/i);
    expect(mockGetApprovedMemories).toHaveBeenCalledWith(3, undefined);
  });

  it('record_mood clamps intensity into 1..10', async () => {
    const executor = new ToolExecutor();
    await executor.execute('call-m', 'record_mood', { mood: 'anxious', intensity: 99 });
    expect(mockMoodCreate).toHaveBeenCalledWith(expect.objectContaining({ intensity: 10 }));
  });
});
