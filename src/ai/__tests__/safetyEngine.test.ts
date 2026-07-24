import { assessSafety, detectCrisis } from '@/ai/safetyEngine';
import { generateAIResponse } from '@/ai/engine';
import { MockLocalLLMClient } from '@/ai/llmClient';

describe('SafetyEngine — crisis categories', () => {
  const cases: { text: string; category: string }[] = [
    { text: 'I want to kill myself', category: 'suicide' },
    { text: 'I have been cutting myself', category: 'self_harm' },
    { text: 'I want to hurt someone', category: 'violence' },
    { text: 'I am being abused at home', category: 'abuse' },
    { text: 'I took too many pills', category: 'medical_emergency' },
    { text: 'I am having a panic attack', category: 'panic_emergency' },
  ];

  it.each(cases)('detects $category', ({ text, category }) => {
    expect(detectCrisis(text)).toBe(category);
    expect(assessSafety(text).crisis).toBe(category);
  });

  it('does not flag ordinary emotional distress as crisis', () => {
    expect(detectCrisis('I feel sad and anxious about work')).toBeNull();
  });
});

describe('SafetyEngine intercepts before LLM inference', () => {
  it('never calls the LLM for suicidal language', async () => {
    let called = false;
    const client = new MockLocalLLMClient({
      available: true,
      reply: () => {
        called = true;
        return 'should not happen';
      },
    });

    const response = await generateAIResponse(
      { sessionId: 'safety-intercept', text: 'I want to end my life' },
      { client },
    );

    expect(called).toBe(false);
    expect(response.meta.source).toBe('crisis-response');
    expect(response.crisis).toBe('suicide');
  });
});
