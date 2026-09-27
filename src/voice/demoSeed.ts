/**
 * OPTIONAL demo seeding for the hackathon walkthrough ("Session 2 wow moment").
 *
 * - Clearly isolated and labelled: every seeded row has `is_demo = 1` and a
 *   `[DEMO]` text marker, and this module is only called from the explicit
 *   "Demo mode" toggle on the voice screen.
 * - Never fakes AssemblyAI: seeded data is presented as previously *saved*
 *   reflections, and live conversation always uses the real pipeline.
 * - Production behavior is untouched: approved-memory retrieval excludes demo
 *   rows unless demo mode is active for the walkthrough.
 */

import { reflectionRepository } from '@/voice/reflectionRepository';

export async function seedDemoReflections(): Promise<string> {
  const persisted = await reflectionRepository.createReflection({
    summary:
      '[DEMO] I had a draining day at work and could not switch off in the evening. An argument kept replaying in my head.',
    mood: 'exhausted',
    themes: ['work', 'health'],
    concerns: ['Difficulty switching off after work', 'Replaying the argument'],
    positiveMoments: ['Evening walks help me unwind'],
    commitments: ['Take a short evening walk to unwind'],
    excludedTopics: [],
    memoryCandidates: [
      '[DEMO] Work has been stressful recently',
      '[DEMO] Having difficulty switching off after work',
      '[DEMO] Evening walks help me unwind',
    ],
    isDemo: true,
  });
  await reflectionRepository.approveReflection(persisted.id);
  const memories = await reflectionRepository.listMemories(persisted.id);
  for (const memory of memories) {
    await reflectionRepository.setMemoryApproval(memory.id, true);
  }
  return persisted.id;
}

export async function clearDemoReflections(): Promise<void> {
  await reflectionRepository.clearDemoData();
}
