/**
 * Qwen ChatML helpers for prompt inspection / tests.
 *
 * Runtime inference uses llama.rn's `messages` API, which applies the GGUF
 * embedded ChatML template. These helpers keep formatting expectations explicit.
 */

import type { ChatMessage } from '@/ai/providers/LocalLLMProvider';
import {
  LOCAL_MODEL_CONFIG,
  LOCAL_MODEL_STOP_SEQUENCES,
  PROHIBITED_LEGACY_MODEL_TOKENS,
} from '@/config/localModel';

const IM_START = '<|im_start|>';
const IM_END = '<|im_end|>';

/** Format chat turns into Qwen ChatML text (system once, then user/assistant). */
export function formatQwenChatML(messages: ChatMessage[]): string {
  const parts: string[] = [];
  let systemEmitted = false;

  for (const message of messages) {
    if (message.role === 'system') {
      if (systemEmitted) {
        // Additional system context is folded into a follow-up system block
        // only when the primary system message already exists — still ChatML.
        parts.push(`${IM_START}system\n${message.content}${IM_END}`);
        continue;
      }
      parts.push(`${IM_START}system\n${message.content}${IM_END}`);
      systemEmitted = true;
      continue;
    }
    parts.push(`${IM_START}${message.role}\n${message.content}${IM_END}`);
  }

  // Generation continues as the assistant turn.
  parts.push(`${IM_START}assistant\n`);
  return parts.join('\n');
}

export function getQwenStopSequences(): readonly string[] {
  return LOCAL_MODEL_STOP_SEQUENCES;
}

export function assertQwenChatTemplateConfig(): void {
  if (LOCAL_MODEL_CONFIG.chatTemplate !== 'chatml') {
    throw new Error(`Expected chatml template, got ${LOCAL_MODEL_CONFIG.chatTemplate}`);
  }
  if (!LOCAL_MODEL_STOP_SEQUENCES.includes(IM_END)) {
    throw new Error('Stop sequences must include <|im_end|>');
  }
  for (const token of PROHIBITED_LEGACY_MODEL_TOKENS) {
    if ((LOCAL_MODEL_STOP_SEQUENCES as readonly string[]).includes(token)) {
      throw new Error(`Prohibited legacy token in stop sequences: ${token}`);
    }
  }
}

export function countPrimarySystemBlocks(messages: ChatMessage[]): number {
  return messages.filter((m) => m.role === 'system').length;
}
