import { buildMentalHealthPrompt, MENTAL_HEALTH_AGENT_NAME } from '@/ai/mentalHealthAgent';

describe('buildMentalHealthPrompt', () => {
  it('frames the model as the on-device Oppuna mental wellness agent', () => {
    const prompt = buildMentalHealthPrompt({ userText: 'I feel overwhelmed today' });

    expect(prompt.system).toContain(MENTAL_HEALTH_AGENT_NAME);
    expect(prompt.system).toMatch(/mental wellness agent/i);
    expect(prompt.system).toMatch(/local Llama model/i);
    expect(prompt.system).toMatch(/recent conversation turns/i);
  });
});
