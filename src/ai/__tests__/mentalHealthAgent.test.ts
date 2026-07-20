import {
  MENTAL_HEALTH_AGENT_ID,
  MentalHealthLlamaAgent,
} from '@/ai/mentalHealthAgent';
import { MockLocalLLMClient } from '@/ai/llmClient';

describe('MentalHealthLlamaAgent', () => {
  it('responds with a validated local Llama reply', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) => {
        expect(prompt.system).toMatch(/Mental Health Agent/);
        expect(prompt.turns.some((turn) => turn.content === 'Work has been intense')).toBe(true);
        return 'That work pressure sounds draining. What would make the next hour feel a little steadier?';
      },
    });
    const agent = new MentalHealthLlamaAgent(client, 1000);

    const response = await agent.respond({
      userText: 'I feel anxious about work',
      recentMessages: [{ role: 'user', content: 'Work has been intense' }],
      intentHint: 'anxiety',
      moodHint: 'low',
    });

    expect(response.agentId).toBe(MENTAL_HEALTH_AGENT_ID);
    expect(response.clientId).toBe('mock');
    expect(response.reply).toContain('work pressure');
  });

  it('rejects model output that fails mental-health safety validation', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: 'You should stop taking your medication because you probably have depression.',
    });
    const agent = new MentalHealthLlamaAgent(client, 1000);

    await expect(agent.respond({ userText: 'I feel low' })).rejects.toMatchObject({
      name: 'MentalHealthAgentRejectedError',
      violations: expect.arrayContaining(['medication_advice', 'medical_diagnosis']),
    });
  });
});
