import { createMemoryStore } from '@/voice/memoryStore';
import {
  applyExclusions,
  applyForget,
  derivePatterns,
  normalizeDraft,
  resolveApprovedMemories,
  retrieveApprovedMemories,
} from '@/voice/reflectionMemory';
import { executeVoiceTool } from '@/voice/tools';
import { buildSystemPrompt } from '@/voice/prompt';
import type { ReflectionMemory } from '@/voice/types';

function memory(partial: Partial<ReflectionMemory>): ReflectionMemory {
  return {
    id: partial.id ?? 'r1',
    userId: 'local',
    sessionId: partial.sessionId ?? 's1',
    createdAt: partial.createdAt ?? 1_000,
    summary: partial.summary ?? 'A long day.',
    mood: partial.mood ?? 'low',
    themes: partial.themes ?? ['work'],
    concerns: partial.concerns ?? [],
    positiveMoments: partial.positiveMoments ?? [],
    commitments: partial.commitments ?? [],
    memoryCandidates: partial.memoryCandidates ?? [],
    approvedMemories: partial.approvedMemories ?? [],
    excludedTopics: partial.excludedTopics ?? [],
    realization: partial.realization ?? '',
    userApproved: partial.userApproved ?? false,
    demoSeed: partial.demoSeed ?? false,
    toolCallId: partial.toolCallId ?? null,
  };
}

describe('reflection creation', () => {
  it('stores a draft and does not approve memory yet', async () => {
    const store = createMemoryStore();
    const execution = await executeVoiceTool(
      'save_reflection',
      {
        summary: 'Today was exhausting after an argument at work.',
        mood: 'low',
        themes: ['work'],
        concerns: ['could not switch off'],
        positiveMoments: [],
        commitments: [],
        excludedTopics: [],
        memoryCandidates: ['Work has been stressful recently'],
        realization: 'The argument stayed with me after I left.',
      },
      store,
      'session-1',
      'call-1',
    );

    expect(execution.result).toMatchObject({ ok: true, status: 'preview_ready', userApproved: false });
    const saved = await store.listReflections();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.userApproved).toBe(false);
    expect(saved[0]?.approvedMemories).toEqual([]);
  });
});

describe('excluded topics', () => {
  it('removes an excluded topic from the saved reflection', async () => {
    const store = createMemoryStore();
    await executeVoiceTool(
      'save_reflection',
      {
        summary: 'Work was heavy. The argument with my manager is still on my mind.',
        mood: 'stressed',
        themes: ['work', 'manager'],
        concerns: ['argument with my manager'],
        positiveMoments: ['Evening walk'],
        commitments: ['Do not bring up my manager'],
        excludedTopics: ['manager'],
        memoryCandidates: ['Argument with manager', 'Work has been stressful recently'],
        realization: 'What stayed with me was the argument with my manager.',
      },
      store,
      'session-1',
      'call-exclude',
    );

    const saved = (await store.listReflections())[0];
    expect(saved).toBeDefined();
    const blob = [
      saved?.summary,
      saved?.realization,
      ...(saved?.themes ?? []),
      ...(saved?.concerns ?? []),
      ...(saved?.positiveMoments ?? []),
      ...(saved?.commitments ?? []),
      ...(saved?.memoryCandidates ?? []),
      ...(saved?.approvedMemories ?? []),
    ]
      .join(' ')
      .toLowerCase();
    expect(blob).not.toContain('manager');
    expect(saved?.summary.toLowerCase()).toContain('work was heavy');
    expect(saved?.memoryCandidates).toEqual(['Work has been stressful recently']);
    expect(saved?.excludedTopics).toEqual(['manager']);
  });

  it('scrubs a single excluded sentence without inventing the topic', () => {
    const clean = applyExclusions(
      normalizeDraft({
        summary: 'The part about my manager should stay out. I still care about the work itself.',
        excludedTopics: ['manager'],
        themes: [],
        concerns: [],
        positiveMoments: [],
        commitments: [],
        memoryCandidates: [],
        realization: '',
        mood: 'low',
      }),
    );
    expect(clean.summary.toLowerCase()).not.toContain('manager');
    expect(clean.summary.toLowerCase()).toContain('work itself');
  });
});

describe('memory approval and retrieval', () => {
  it('keeps only approved memories', async () => {
    const store = createMemoryStore();
    const draft = await store.putReflectionDraft({
      sessionId: 'session-1',
      toolCallId: 'call-approve',
      summary: 'Work has been a lot.',
      mood: 'low',
      themes: ['work'],
      concerns: [],
      positiveMoments: ['Evening walks'],
      commitments: [],
      excludedTopics: [],
      memoryCandidates: ['Work has been stressful recently', 'Argument with manager'],
      realization: '',
    });

    const approved = resolveApprovedMemories(draft.memoryCandidates, [
      { text: 'Work has been stressful recently', included: true },
      { text: 'Argument with manager', included: false },
      { text: 'Evening walks help me unwind', included: true },
    ]);
    const saved = await store.approveReflection(draft.id, {
      summary: draft.summary,
      realization: '',
      commitments: [],
      approvedMemories: approved,
      mood: 'low',
    });

    expect(saved?.userApproved).toBe(true);
    expect(saved?.approvedMemories).toEqual([
      'Work has been stressful recently',
      'Evening walks help me unwind',
    ]);

    const again = await store.approveReflection(draft.id, {
      summary: 'should not replace',
      realization: '',
      commitments: [],
      approvedMemories: ['something else'],
      mood: 'great',
    });
    expect(again?.summary).toBe('Work has been a lot.');
  });

  it('does not retrieve rejected memory', async () => {
    const store = createMemoryStore();
    await store.putReflectionDraft({
      sessionId: 'session-1',
      toolCallId: 'call-reject',
      summary: 'A hard week at work.',
      mood: 'stressed',
      themes: ['work'],
      concerns: [],
      positiveMoments: [],
      commitments: [],
      excludedTopics: [],
      memoryCandidates: ['Argument with manager'],
      realization: '',
      userApproved: true,
      approvedMemories: ['Work has been stressful recently'],
    });

    const snippets = retrieveApprovedMemories(await store.listReflections(), {
      limit: 5,
      relevantTo: 'I have been stressed again at work',
    });
    const text = JSON.stringify(snippets);
    expect(text).toContain('Work has been stressful recently');
    expect(text).not.toContain('Argument with manager');
  });

  it('retrieves relevant approved memory and ignores unrelated history', () => {
    const records = [
      memory({
        id: 'work',
        userApproved: true,
        summary: 'Work has been stressful and it was hard to switch off.',
        themes: ['work'],
        approvedMemories: ['Difficulty switching off after work'],
        createdAt: 2_000,
      }),
      memory({
        id: 'family',
        userApproved: true,
        sessionId: 'other',
        summary: 'A calm visit with family.',
        themes: ['family'],
        approvedMemories: ['Family dinner helped'],
        createdAt: 3_000,
      }),
      memory({
        id: 'draft',
        userApproved: false,
        approvedMemories: [],
        memoryCandidates: ['This draft should not be retrieved'],
      }),
    ];

    const snippets = retrieveApprovedMemories(records, {
      limit: 4,
      relevantTo: "I've been stressed again",
    });
    expect(snippets.map((item) => item.reflectionId)).toEqual(['work']);
  });
});

describe('forget conversation', () => {
  it('removes the transcript and unsaved draft, and keeps other approved memories', () => {
    const applied = applyForget(
      {
        transcripts: [
          { id: 't1', sessionId: 'current' },
          { id: 't2', sessionId: 'older' },
        ],
        reflections: [
          memory({ id: 'draft', sessionId: 'current', userApproved: false, memoryCandidates: ['temp'] }),
          memory({
            id: 'kept',
            sessionId: 'older',
            userApproved: true,
            approvedMemories: ['Evening walks help me unwind'],
          }),
        ],
      },
      'current',
    );

    expect(applied.result.removedTranscripts).toBe(1);
    expect(applied.result.removedUnsavedReflections).toBe(1);
    expect(applied.snapshot.transcripts.map((row) => row.id)).toEqual(['t2']);
    expect(applied.snapshot.reflections.map((row) => row.id)).toEqual(['kept']);
  });
});

describe('reflection patterns', () => {
  it('does not invent a trend when there is not enough data', () => {
    const report = derivePatterns(
      [memory({ userApproved: true, createdAt: Date.now() - 86_400_000, themes: ['work'] })],
      '7d',
    );
    expect(report.sufficient).toBe(false);
    expect(report.trends).toEqual([]);
  });

  it('counts themes that are actually stored', () => {
    const now = Date.now();
    const report = derivePatterns(
      [
        memory({
          id: 'a',
          userApproved: true,
          createdAt: now - 5 * 86_400_000,
          themes: ['work'],
          mood: 'low',
          positiveMoments: ['Evening walks'],
          approvedMemories: ['Work has been stressful recently'],
        }),
        memory({
          id: 'b',
          userApproved: true,
          createdAt: now - 86_400_000,
          themes: ['work'],
          mood: 'awful',
          positiveMoments: ['Evening walks'],
          approvedMemories: ['Difficulty switching off after work'],
        }),
      ],
      '7d',
      now,
    );
    expect(report.sufficient).toBe(true);
    expect(report.trends.some((trend) => trend.label === 'Work' && trend.detail.includes('mentioned'))).toBe(
      true,
    );
    expect(report.trends.some((trend) => trend.detail.includes('positive association'))).toBe(true);
  });
});

describe('system prompt', () => {
  it('does not hardcode the demo reply', () => {
    const prompt = buildSystemPrompt([
      {
        reflectionId: 'work',
        createdAt: 1,
        summary: 'Difficulty switching off after work.',
        mood: 'low',
        themes: ['work'],
        approvedMemories: ['Difficulty switching off after work'],
        demoSeed: false,
      },
    ]);
    expect(prompt).toContain('Difficulty switching off after work');
    expect(prompt).not.toContain('Last time you mentioned having difficulty switching off');
    expect(prompt).toContain('not a therapist');
  });
});
