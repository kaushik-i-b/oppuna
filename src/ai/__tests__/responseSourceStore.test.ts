import { generateAIResponse } from '@/ai/engine';
import {
  __resetResponseSourceForTests,
  getLastAIResponseSource,
} from '@/ai/responseSourceStore';
import { MockLocalLLMClient } from '@/ai/llmClient';

describe('responseSourceStore', () => {
  beforeEach(() => {
    __resetResponseSourceForTests();
  });

  it('records crisis-response for crisis input', async () => {
    await generateAIResponse({ sessionId: 'src-crisis', text: 'I want to kill myself' });
    expect(getLastAIResponseSource()).toBe('crisis-response');
  });

  it('records local-llm when model succeeds', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'That sounds heavy. What feels biggest right now?',
    });
    await generateAIResponse({ sessionId: 'src-llm', text: 'I feel anxious' }, { client });
    expect(getLastAIResponseSource()).toBe('local-llm');
  });

  it('records rule-engine when no model is available', async () => {
    await generateAIResponse({ sessionId: 'src-rule', text: 'I feel anxious' }, { rng: () => 0 });
    expect(getLastAIResponseSource()).toBe('rule-engine');
  });
});
