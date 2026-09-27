/**
 * Oppuna voice tool layer.
 *
 * Four tools, executed against the real on-device store:
 * - save_reflection — structured reflection; strips excludedTopics; memory
 *   candidates start UNAPPROVED; idempotent per toolCallId.
 * - get_recent_reflections — approved context only, minimal fields.
 * - record_mood — delegates to the existing moodRepository.
 * - get_reflection_patterns — derived from real stored data, 7d/30d.
 */

import { moodRepository } from '@/database';
import type { MoodKey } from '@/types';
import {
  applyExcludedTopics,
  computeReflectionPatterns,
  reflectionRepository,
  type ReflectionPatterns,
} from '@/voice/reflectionRepository';
import type { PersistedReflection } from '@/voice/types';
import { logVoiceEvent } from '@/voice/voiceLogger';

export const VOICE_TOOL_DEFINITIONS = [
  {
    name: 'save_reflection',
    description:
      'Save a structured reflection of the voice conversation. Excluded topics are stripped before saving. Memory candidates are stored unapproved and need explicit user approval.',
    parameters: {
      type: 'object',
      required: ['summary'],
      properties: {
        summary: { type: 'string' },
        mood: { type: 'string' },
        themes: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        positiveMoments: { type: 'array', items: { type: 'string' } },
        commitments: { type: 'array', items: { type: 'string' } },
        excludedTopics: { type: 'array', items: { type: 'string' } },
        memoryCandidates: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  {
    name: 'get_recent_reflections',
    description: 'Retrieve recent approved reflection context for the conversation.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        relevantTo: { type: 'string' },
      },
    },
  },
  {
    name: 'record_mood',
    description: 'Record a mood check-in from the conversation.',
    parameters: {
      type: 'object',
      required: ['mood', 'intensity'],
      properties: {
        mood: { type: 'string' },
        intensity: { type: 'number' },
        note: { type: 'string' },
      },
    },
  },
  {
    name: 'get_reflection_patterns',
    description: 'Return structured trends derived from stored reflections (7d or 30d).',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['7d', '30d'] },
      },
    },
  },
] as const;

export type VoiceToolName = (typeof VOICE_TOOL_DEFINITIONS)[number]['name'];

export interface SaveReflectionArgs {
  summary: string;
  mood?: string;
  themes?: string[];
  concerns?: string[];
  positiveMoments?: string[];
  commitments?: string[];
  excludedTopics?: string[];
  memoryCandidates?: string[];
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').map((s) => s.trim()).filter(Boolean);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Idempotent tool executor. Results are keyed by toolCallId so duplicated
 * deliveries (retries, reconnect replays) never persist twice.
 */
export class ToolExecutor {
  private completed = new Map<string, unknown>();
  private inFlight = new Map<string, Promise<unknown>>();

  hasCompleted(toolCallId: string): boolean {
    return this.completed.has(toolCallId);
  }

  getResult(toolCallId: string): unknown {
    return this.completed.get(toolCallId);
  }

  async execute(
    toolCallId: string,
    name: string,
    rawArgs: Record<string, unknown>,
    sessionId?: string,
  ): Promise<unknown> {
    if (this.completed.has(toolCallId)) return this.completed.get(toolCallId);
    const pending = this.inFlight.get(toolCallId);
    if (pending) return pending;
    logVoiceEvent('voice:tool-requested', { name });
    const run = this.run(name, rawArgs, sessionId)
      .then((result) => {
        this.completed.set(toolCallId, result);
        this.inFlight.delete(toolCallId);
        logVoiceEvent('voice:tool-completed', { name });
        return result;
      })
      .catch((error) => {
        this.inFlight.delete(toolCallId);
        throw error;
      });
    this.inFlight.set(toolCallId, run);
    return run;
  }

  private async run(
    name: string,
    rawArgs: Record<string, unknown>,
    sessionId?: string,
  ): Promise<unknown> {
    switch (name) {
      case 'save_reflection':
        return this.saveReflection(rawArgs, sessionId);
      case 'get_recent_reflections':
        return this.getRecentReflections(rawArgs);
      case 'record_mood':
        return this.recordMood(rawArgs);
      case 'get_reflection_patterns':
        return this.getPatterns(rawArgs);
      default:
        throw new Error(`Unknown voice tool: ${name}`);
    }
  }

  private async saveReflection(
    rawArgs: Record<string, unknown>,
    sessionId?: string,
  ): Promise<PersistedReflection> {
    const summary = asString(rawArgs.summary).trim();
    if (!summary) throw new Error('save_reflection requires a non-empty summary');
    const args: SaveReflectionArgs = {
      summary,
      mood: asString(rawArgs.mood),
      themes: asStringArray(rawArgs.themes),
      concerns: asStringArray(rawArgs.concerns),
      positiveMoments: asStringArray(rawArgs.positiveMoments),
      commitments: asStringArray(rawArgs.commitments),
      excludedTopics: asStringArray(rawArgs.excludedTopics),
      memoryCandidates: asStringArray(rawArgs.memoryCandidates),
    };
    const persisted = await reflectionRepository.createReflection({ ...args, sessionId: sessionId ?? null });
    logVoiceEvent('voice:reflection-generated');
    return persisted;
  }

  private async getRecentReflections(rawArgs: Record<string, unknown>): Promise<unknown> {
    const limitRaw = rawArgs.limit;
    const limit = typeof limitRaw === 'number' && Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(10, Math.floor(limitRaw)))
      : 3;
    const relevantTo = asString(rawArgs.relevantTo);
    const memories = await reflectionRepository.getApprovedMemories(limit, relevantTo || undefined);
    const reflections = await reflectionRepository.listRecentReflections(limit);
    // Minimal context only — never raw transcripts, never unapproved material.
    return {
      approvedMemories: memories.map((m) => m.text),
      recentReflections: reflections
        .filter((r) => r.userApproved)
        .slice(0, limit)
        .map((r) => ({ summary: r.summary, mood: r.mood, themes: r.themes })),
    };
  }

  private async recordMood(rawArgs: Record<string, unknown>): Promise<unknown> {
    const mood = asString(rawArgs.mood).trim().toLowerCase() as MoodKey;
    const intensityRaw = rawArgs.intensity;
    const intensity =
      typeof intensityRaw === 'number' && Number.isFinite(intensityRaw)
        ? Math.max(1, Math.min(10, Math.round(intensityRaw)))
        : 5;
    const note = asString(rawArgs.note);
    const entry = await moodRepository.create({ mood, intensity, note: note || null });
    return { id: entry.id, mood: entry.mood, intensity: entry.intensity };
  }

  private async getPatterns(rawArgs: Record<string, unknown>): Promise<ReflectionPatterns> {
    const period = rawArgs.period === '30d' ? '30d' : '7d';
    const reflections = await reflectionRepository.listRecentReflections(100);
    return computeReflectionPatterns(
      reflections.filter((r) => r.userApproved),
      period,
    );
  }
}

/** Preview helper: what the saved reflection WOULD look like (exclusions applied). */
export function previewReflectionText(summary: string, excludedTopics: string[]): string {
  return applyExcludedTopics(summary, excludedTopics);
}
