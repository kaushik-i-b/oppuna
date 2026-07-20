import {
  AGENTS,
  COMPANION_AGENT,
  DEFAULT_AGENT_ID,
  MENTAL_HEALTH_AGENT,
  getAgent,
  isAgentId,
} from '@/ai/agents';

describe('agents registry', () => {
  it('includes the companion and mental health agents', () => {
    expect(AGENTS.map((agent) => agent.id)).toEqual(['companion', 'mental_health']);
  });

  it('defaults to the companion', () => {
    expect(DEFAULT_AGENT_ID).toBe('companion');
    expect(getAgent()).toBe(COMPANION_AGENT);
    expect(getAgent(null)).toBe(COMPANION_AGENT);
  });

  it('resolves the mental health agent by id', () => {
    expect(getAgent('mental_health')).toBe(MENTAL_HEALTH_AGENT);
  });

  it('falls back to the companion for unknown ids', () => {
    expect(getAgent('nope' as never)).toBe(COMPANION_AGENT);
  });

  it('type-guards agent ids', () => {
    expect(isAgentId('mental_health')).toBe(true);
    expect(isAgentId('companion')).toBe(true);
    expect(isAgentId('gpt')).toBe(false);
    expect(isAgentId(undefined)).toBe(false);
  });
});

describe('mental health agent persona', () => {
  it('stays offline and supportive without claiming to be therapy', () => {
    const persona = MENTAL_HEALTH_AGENT.persona.toLowerCase();
    expect(persona).toContain('offline');
    expect(persona).toContain('grounding');
    expect(persona).toContain('validate first');
    expect(persona).toContain('mental health professional');
  });
});
