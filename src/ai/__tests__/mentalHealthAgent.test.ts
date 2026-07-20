import {
  MENTAL_HEALTH_AGENT,
  buildMentalHealthAgentSystemPrompt,
  getMentalHealthAgentGenerationParams,
  getMentalHealthIntentGuidance,
} from '@/ai/mentalHealthAgent';

describe('MENTAL_HEALTH_AGENT', () => {
  it('has a stable identifier for the on-device Llama agent', () => {
    expect(MENTAL_HEALTH_AGENT.id).toBe('mental-health-llama');
    expect(MENTAL_HEALTH_AGENT.name).toMatch(/mental health/i);
  });
});

describe('buildMentalHealthAgentSystemPrompt', () => {
  it('defines the offline mental wellness persona and guardrails', () => {
    const system = buildMentalHealthAgentSystemPrompt();
    expect(system).toContain(MENTAL_HEALTH_AGENT.name);
    expect(system).toMatch(/offline/i);
    expect(system).toMatch(/never diagnose/i);
    expect(system).toMatch(/medication/i);
    expect(system).toMatch(/not a therapist/i);
  });
});

describe('getMentalHealthIntentGuidance', () => {
  it('returns coaching notes for recognised mental health intents', () => {
    expect(getMentalHealthIntentGuidance('anxiety')).toMatch(/anxious/i);
    expect(getMentalHealthIntentGuidance('sadness')).toMatch(/sad/i);
    expect(getMentalHealthIntentGuidance('loneliness')).toMatch(/lonely/i);
  });

  it('returns null for unknown intents', () => {
    expect(getMentalHealthIntentGuidance('unknown')).toBeNull();
  });
});

describe('getMentalHealthAgentGenerationParams', () => {
  it('uses conservative generation settings for empathic replies', () => {
    const params = getMentalHealthAgentGenerationParams();
    expect(params.maxTokens).toBeLessThanOrEqual(220);
    expect(params.temperature).toBeLessThanOrEqual(0.7);
    expect(params.topP).toBeGreaterThan(0);
  });
});
