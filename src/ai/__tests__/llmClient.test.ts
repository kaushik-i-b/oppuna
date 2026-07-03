import {
  generateWithTimeout,
  getLocalLLMClient,
  isLLMAvailable,
  LLMUnavailableError,
  MockLocalLLMClient,
} from '@/ai/llmClient';
import type { LLMPrompt } from '@/ai/types';

const PROMPT: LLMPrompt = {
  system: 'system',
  turns: [{ role: 'user', content: 'I feel anxious' }],
};

describe('LLM availability', () => {
  it('reports unavailable by default (no model ships with the app)', async () => {
    expect(await isLLMAvailable()).toBe(false);
    expect(getLocalLLMClient().id).toBe('mock');
  });

  it('never throws from the availability check', async () => {
    const broken = new MockLocalLLMClient();
    broken.isAvailable = () => Promise.reject(new Error('native crash'));
    expect(await isLLMAvailable(broken)).toBe(false);
  });
});

describe('MockLocalLLMClient', () => {
  it('throws LLMUnavailableError when generating while unavailable', async () => {
    const client = new MockLocalLLMClient({ available: false });
    await expect(client.generate(PROMPT)).rejects.toBeInstanceOf(LLMUnavailableError);
  });

  it('generates a deterministic reply when available', async () => {
    const client = new MockLocalLLMClient({ available: true, reply: 'A calm reply.' });
    const completion = await client.generate(PROMPT);
    expect(completion.text).toBe('A calm reply.');
    expect(completion.finishReason).toBe('stop');
  });

  it('streams tokens that join back into the full reply', async () => {
    const client = new MockLocalLLMClient({ available: true, reply: 'one two three' });
    const tokens: string[] = [];
    const completion = await client.generateStream(PROMPT, (t) => tokens.push(t));
    expect(tokens.length).toBeGreaterThan(1);
    expect(tokens.join('')).toBe(completion.text);
  });

  it('can derive the reply from the prompt', async () => {
    const client = new MockLocalLLMClient({
      available: true,
      reply: (prompt) => `echo: ${prompt.turns[prompt.turns.length - 1]?.content}`,
    });
    const completion = await client.generate(PROMPT);
    expect(completion.text).toBe('echo: I feel anxious');
  });
});

describe('generateWithTimeout', () => {
  it('resolves when the client finishes in time', async () => {
    const client = new MockLocalLLMClient({ available: true, reply: 'quick', latencyMs: 5 });
    const completion = await generateWithTimeout(client, PROMPT, 1000);
    expect(completion.text).toBe('quick');
  });

  it('rejects when generation exceeds the timeout', async () => {
    const client = new MockLocalLLMClient({ available: true, latencyMs: 200 });
    await expect(generateWithTimeout(client, PROMPT, 20)).rejects.toThrow(/timed out/);
  });
});
