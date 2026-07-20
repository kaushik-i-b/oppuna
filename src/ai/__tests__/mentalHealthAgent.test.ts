import {
  MENTAL_HEALTH_AGENT,
  agentStatusFromModelStatus,
  buildMentalHealthSystemPrompt,
  describeAgent,
} from '@/ai/mentalHealthAgent';
import type { ModelState } from '@/ai/types';

function fakeModel(overrides: Partial<ModelState> = {}): ModelState {
  return {
    status: 'unavailable',
    modelPath: null,
    modelId: null,
    error: null,
    loadedAt: null,
    ...overrides,
  };
}

describe('MENTAL_HEALTH_AGENT persona', () => {
  it('exposes a stable id and a Llama-based runtime', () => {
    expect(MENTAL_HEALTH_AGENT.id).toBe('oppuna-mental-health-agent');
    expect(MENTAL_HEALTH_AGENT.runtime).toMatch(/llama/i);
    expect(MENTAL_HEALTH_AGENT.recommendedModels.some((name) => /llama/i.test(name))).toBe(true);
  });
});

describe('buildMentalHealthSystemPrompt', () => {
  const prompt = buildMentalHealthSystemPrompt();

  it('names the agent and enforces safety guardrails', () => {
    expect(prompt).toMatch(/mental-health companion/i);
    expect(prompt).toMatch(/never diagnose/i);
    expect(prompt).toMatch(/medication/i);
    expect(prompt).toMatch(/never claim to provide therapy/i);
    expect(prompt).toMatch(/self-harm/i);
  });

  it('mentions evidence-informed practices the app already provides', () => {
    expect(prompt).toMatch(/cbt/i);
    expect(prompt).toMatch(/grounding/i);
    expect(prompt).toMatch(/breath/i);
    expect(prompt).toMatch(/journal/i);
  });

  it('runs entirely on-device (no network language allowed)', () => {
    expect(prompt).toMatch(/on the user’s phone|on-device|offline/i);
    expect(prompt).toMatch(/never suggest going online/i);
  });
});

describe('agentStatusFromModelStatus', () => {
  it('maps model lifecycle to user-facing agent status', () => {
    expect(agentStatusFromModelStatus('ready')).toBe('ready');
    expect(agentStatusFromModelStatus('loading')).toBe('loading');
    expect(agentStatusFromModelStatus('checking')).toBe('checking');
    expect(agentStatusFromModelStatus('error')).toBe('error');
    expect(agentStatusFromModelStatus('idle')).toBe('unavailable');
    expect(agentStatusFromModelStatus('unavailable')).toBe('unavailable');
  });
});

describe('describeAgent', () => {
  it('combines persona + model state into a snapshot for the UI', () => {
    const snapshot = describeAgent(
      fakeModel({
        status: 'ready',
        modelPath: 'file:///mock/models/llama-3.gguf',
        modelId: 'llama-3',
        loadedAt: 42,
      }),
    );
    expect(snapshot.id).toBe(MENTAL_HEALTH_AGENT.id);
    expect(snapshot.displayName).toBe(MENTAL_HEALTH_AGENT.displayName);
    expect(snapshot.status).toBe('ready');
    expect(snapshot.modelId).toBe('llama-3');
    expect(snapshot.modelPath).toBe('file:///mock/models/llama-3.gguf');
    expect(snapshot.loadedAt).toBe(42);
  });

  it('reports unavailable when there is no model on the device', () => {
    const snapshot = describeAgent(fakeModel());
    expect(snapshot.status).toBe('unavailable');
    expect(snapshot.modelId).toBeNull();
    expect(snapshot.modelPath).toBeNull();
  });
});
