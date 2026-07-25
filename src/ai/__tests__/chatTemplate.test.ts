import {
  assertQwenChatTemplateConfig,
  countPrimarySystemBlocks,
  formatQwenChatML,
  getQwenStopSequences,
} from '@/ai/chatTemplate';
import { buildContext } from '@/ai/contextBuilder';
import {
  LOCAL_MODEL_CONFIG,
  LOCAL_MODEL_STOP_SEQUENCES,
  PROHIBITED_LEGACY_MODEL_TOKENS,
} from '@/config/localModel';

describe('Qwen ChatML template', () => {
  it('uses chatml config and Qwen stop tokens', () => {
    expect(LOCAL_MODEL_CONFIG.chatTemplate).toBe('chatml');
    expect(LOCAL_MODEL_CONFIG.family.toLowerCase()).toContain('qwen');
    assertQwenChatTemplateConfig();
    const stops = getQwenStopSequences();
    expect(stops).toContain('<|im_end|>');
    expect(stops).toContain('<|im_start|>');
    expect(stops).toContain('<|endoftext|>');
    for (const token of PROHIBITED_LEGACY_MODEL_TOKENS) {
      expect(stops).not.toContain(token);
    }
  });

  it('formats a single-turn prompt with system once and assistant open', () => {
    const text = formatQwenChatML([
      { role: 'system', content: 'You are Oppuna.' },
      { role: 'user', content: 'I feel anxious' },
    ]);
    expect(text).toContain('<|im_start|>system\nYou are Oppuna.<|im_end|>');
    expect(text).toContain('<|im_start|>user\nI feel anxious<|im_end|>');
    expect(text.endsWith('<|im_start|>assistant\n')).toBe(true);
    expect(text).not.toMatch(/<start_of_turn>|<end_of_turn>/);
  });

  it('formats multi-turn history without legacy turn tokens', () => {
    const text = formatQwenChatML([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'more' },
    ]);
    expect(text).toContain('<|im_start|>assistant\nhello<|im_end|>');
    expect(text).toContain('<|im_start|>user\nmore<|im_end|>');
    expect(text.toLowerCase()).not.toContain('start_of_turn');
    expect(text).not.toMatch(/<start_of_turn>/);
  });

  it('buildContext attaches ChatML stop sequences and keeps one primary system', () => {
    const built = buildContext({
      userText: 'hello',
      recentMessages: [
        { role: 'user', content: 'earlier' },
        { role: 'assistant', content: 'reply' },
      ],
      contextSize: 2048,
    });
    expect(built.messages[0]?.role).toBe('system');
    expect(countPrimarySystemBlocks(built.messages.filter((m) => m.role === 'system'))).toBeGreaterThanOrEqual(
      1,
    );
    expect(built.prompt.params?.stopSequences).toEqual([...LOCAL_MODEL_STOP_SEQUENCES]);
    expect(built.prompt.params?.stopSequences).toContain('<|im_end|>');
  });
});
