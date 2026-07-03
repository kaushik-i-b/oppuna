/**
 * Conversation memory — lightweight per-session state for the AI layer.
 *
 * Held in memory only (never persisted) to honour the privacy promise: it
 * stores intents, moods, and which app-authored template lines were used
 * recently — not raw user text. It powers repetition prevention, response
 * variation, and prompt context for a future on-device LLM.
 */

import type { MoodKey } from '@/types';
import type { Intent } from '@/ai/types';

const MAX_TRACKED_TURNS = 20;
const MAX_TRACKED_REPLIES = 8;

export interface TurnRecord {
  intent: Intent;
  mood: MoodKey | null;
}

export class ConversationMemory {
  readonly sessionId: string;

  private turns: TurnRecord[] = [];
  private replies: string[] = [];
  /** Template line -> turn number when it was last used. */
  private usedLines = new Map<string, number>();
  private turnCounter = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  get turnCount(): number {
    return this.turnCounter;
  }

  /** Most recent first. */
  recentIntents(limit = 5): Intent[] {
    return this.turns
      .slice(-limit)
      .map((t) => t.intent)
      .reverse();
  }

  /** Most recent first, nulls skipped. */
  recentMoods(limit = 5): MoodKey[] {
    return this.turns
      .slice(-limit)
      .map((t) => t.mood)
      .filter((m): m is MoodKey => m !== null)
      .reverse();
  }

  /** Most recent first. */
  recentReplies(limit = MAX_TRACKED_REPLIES): string[] {
    return this.replies.slice(-limit).reverse();
  }

  /** How many consecutive recent turns (including the latest) share `intent`. */
  intentStreak(intent: Intent): number {
    let streak = 0;
    for (let i = this.turns.length - 1; i >= 0; i -= 1) {
      if (this.turns[i]?.intent === intent) streak += 1;
      else break;
    }
    return streak;
  }

  /**
   * Turn number when `line` was last used, or -1 if never/expired.
   * Lower values mean "less recently used".
   */
  lastUsedTurn(line: string): number {
    return this.usedLines.get(line) ?? -1;
  }

  /** Mark a template line as used on the current turn. */
  noteLineUsed(line: string): void {
    this.usedLines.set(line, this.turnCounter);
  }

  /** Record a completed assistant turn. */
  recordTurn(record: TurnRecord & { reply: string }): void {
    this.turnCounter += 1;
    this.turns.push({ intent: record.intent, mood: record.mood });
    if (this.turns.length > MAX_TRACKED_TURNS) this.turns.shift();

    this.replies.push(record.reply);
    if (this.replies.length > MAX_TRACKED_REPLIES) this.replies.shift();
  }

  reset(): void {
    this.turns = [];
    this.replies = [];
    this.usedLines.clear();
    this.turnCounter = 0;
  }
}

/* ------------------------------------------------------------------ *
 * Registry (one memory per chat session)
 * ------------------------------------------------------------------ */

const registry = new Map<string, ConversationMemory>();

export function getConversationMemory(sessionId: string): ConversationMemory {
  let memory = registry.get(sessionId);
  if (!memory) {
    memory = new ConversationMemory(sessionId);
    registry.set(sessionId, memory);
  }
  return memory;
}

/** Clear memory for a session (e.g. when the user clears the chat). */
export function resetConversationMemory(sessionId: string): void {
  registry.get(sessionId)?.reset();
  registry.delete(sessionId);
}
