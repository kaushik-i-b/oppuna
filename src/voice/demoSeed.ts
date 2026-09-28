import type { VoiceMemoryStore } from '@/voice/memoryStore';
import type { ReflectionMemory } from '@/voice/types';

/**
 * Optional development seed. Clearly marked and never treated as a live
 * AssemblyAI reply. Callers must invoke this explicitly.
 */
export const DEMO_SEED_ID = 'demo-seed-reflection-1';
export const DEMO_SEED_TAG = '[Demo seed]';

export const DEMO_SEED_MEMORIES = [
  'Work has been stressful recently',
  'Difficulty switching off after work',
  'Evening walks help me unwind',
] as const;

export async function seedDemoReflections(store: VoiceMemoryStore, now = Date.now()): Promise<ReflectionMemory> {
  const existing = (await store.listReflections()).find((row) => row.id === DEMO_SEED_ID);
  if (existing) return existing;

  await store.ensureSession('demo-seed-session');
  return store.putReflectionDraft({
    id: DEMO_SEED_ID,
    sessionId: 'demo-seed-session',
    toolCallId: 'demo-seed-tool-call',
    createdAt: now - 2 * 24 * 60 * 60 * 1000,
    demoSeed: true,
    userApproved: true,
    summary: `${DEMO_SEED_TAG} Work felt heavy and it was hard to switch off in the evening. A walk helped.`,
    mood: 'low',
    themes: ['work', 'rest'],
    concerns: ['difficulty switching off after work'],
    positiveMoments: ['Evening walks'],
    commitments: [],
    excludedTopics: [],
    memoryCandidates: [...DEMO_SEED_MEMORIES],
    approvedMemories: [...DEMO_SEED_MEMORIES],
    realization: `${DEMO_SEED_TAG} The hard part was switching off after work, and a walk helped.`,
  });
}
