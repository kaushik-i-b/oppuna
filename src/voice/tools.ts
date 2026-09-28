import { retrieveApprovedMemories, derivePatterns, normalizeDraft } from '@/voice/reflectionMemory';
import type { ApprovalPatch, VoiceMemoryStore } from '@/voice/memoryStore';
import type { PatternPeriod, ReflectionMemory, ToolEffect } from '@/voice/types';

export interface VoiceToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execution_mode: 'interactive';
  timeout_seconds: number;
}

const stringList = {
  type: 'array',
  items: { type: 'string' },
};

export const VOICE_TOOLS: VoiceToolDefinition[] = [
  {
    type: 'function',
    name: 'save_reflection',
    description:
      'Call only after the user agrees to turn this conversation into a reflection. Put anything they asked to leave out in excludedTopics and omit it from every other field. memoryCandidates are suggestions the user will approve on screen. Do not call twice for the same reflection.',
    execution_mode: 'interactive',
    timeout_seconds: 8,
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'Short narrative of the conversation, without excluded topics.',
        },
        mood: {
          type: 'string',
          description: 'Single mood word.',
          enum: ['great', 'good', 'calm', 'okay', 'tired', 'low', 'stressed', 'anxious', 'awful'],
        },
        themes: { ...stringList, description: 'Short theme labels, such as work or rest.' },
        concerns: { ...stringList, description: 'What is still weighing on them, without excluded topics.' },
        positiveMoments: { ...stringList, description: 'Helpful or kinder moments they named.' },
        commitments: { ...stringList, description: 'Optional next step they actually chose. Empty if none.' },
        excludedTopics: {
          ...stringList,
          description: 'Topics the user asked to leave out, such as a person they do not want stored.',
        },
        memoryCandidates: {
          ...stringList,
          description: 'Short memory suggestions. Do not include excluded topics.',
        },
        realization: {
          type: 'string',
          description: 'One sentence for the key realization, without excluded topics. Empty if none.',
        },
      },
      required: [
        'summary',
        'mood',
        'themes',
        'concerns',
        'positiveMoments',
        'commitments',
        'excludedTopics',
        'memoryCandidates',
      ],
    },
  },
  {
    type: 'function',
    name: 'get_recent_reflections',
    description:
      'Retrieve user-approved reflection memories. Call this before mentioning anything from a past conversation. Never invent memories if this returns none.',
    execution_mode: 'interactive',
    timeout_seconds: 5,
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Maximum memories to return, from 1 to 8.' },
        relevantTo: {
          type: 'string',
          description: 'The feeling or topic the user just mentioned, in their words.',
        },
      },
      required: ['limit'],
    },
  },
  {
    type: 'function',
    name: 'record_mood',
    description: 'Record a mood the user explicitly wants noted. Do not diagnose.',
    execution_mode: 'interactive',
    timeout_seconds: 5,
    parameters: {
      type: 'object',
      properties: {
        mood: {
          type: 'string',
          enum: ['great', 'good', 'calm', 'okay', 'tired', 'low', 'stressed', 'anxious', 'awful'],
        },
        intensity: { type: 'integer', description: 'Strength from 1 to 10.' },
        note: { type: 'string', description: 'Optional short note in the user\'s words.' },
      },
      required: ['mood', 'intensity'],
    },
  },
  {
    type: 'function',
    name: 'get_reflection_patterns',
    description:
      'Return trends from saved reflections. Call when the user asks how they have been doing or about a recent pattern. If data is insufficient, say so. Never invent trends.',
    execution_mode: 'interactive',
    timeout_seconds: 5,
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['7d', '30d'], description: '7d or 30d. Use 7d unless they ask for a month.' },
      },
      required: ['period'],
    },
  },
];

export interface ToolExecution {
  result: Record<string, unknown>;
  effect: ToolEffect;
  persistedId?: string;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function malformed(message: string): ToolExecution {
  return { result: { ok: false, error: 'malformed_arguments', message }, effect: { type: 'none' } };
}

export async function executeVoiceTool(
  name: string,
  rawArguments: unknown,
  store: VoiceMemoryStore,
  sessionId: string,
  callId: string,
): Promise<ToolExecution> {
  const args = asObject(rawArguments);
  if (!args) return malformed('Tool arguments must be an object.');

  if (name === 'save_reflection') {
    const draft = normalizeDraft({
      summary: typeof args.summary === 'string' ? args.summary : '',
      mood: typeof args.mood === 'string' ? args.mood : null,
      themes: args.themes as string[],
      concerns: args.concerns as string[],
      positiveMoments: args.positiveMoments as string[],
      commitments: args.commitments as string[],
      excludedTopics: args.excludedTopics as string[],
      memoryCandidates: args.memoryCandidates as string[],
      realization: typeof args.realization === 'string' ? args.realization : '',
    });
    if (!draft.summary) return malformed('summary is required.');
    const saved = await store.putReflectionDraft({
      ...draft,
      sessionId,
      toolCallId: callId,
    });
    return {
      persistedId: saved.id,
      effect: { type: 'reflection_draft', reflection: saved },
      result: {
        ok: true,
        status: 'preview_ready',
        reflectionId: saved.id,
        summary: saved.summary,
        mood: saved.mood,
        themes: saved.themes,
        memoryCandidates: saved.memoryCandidates,
        excludedTopics: saved.excludedTopics,
        userApproved: false,
        note: 'The user must approve saving on screen. Do not repeat excluded topics.',
      },
    };
  }

  if (name === 'get_recent_reflections') {
    const limit = typeof args.limit === 'number' ? args.limit : Number(args.limit);
    if (!Number.isFinite(limit)) return malformed('limit is required.');
    const relevantTo = typeof args.relevantTo === 'string' ? args.relevantTo : undefined;
    const snippets = retrieveApprovedMemories(await store.listReflections(), {
      limit,
      relevantTo,
    });
    return {
      effect: { type: 'memories', snippets },
      result: {
        ok: true,
        memories: snippets.map((snippet) => ({
          mood: snippet.mood,
          themes: snippet.themes,
          approvedMemories: snippet.approvedMemories,
          summary: snippet.summary,
          createdAt: new Date(snippet.createdAt).toISOString(),
        })),
      },
    };
  }

  if (name === 'record_mood') {
    const mood = typeof args.mood === 'string' ? args.mood.trim() : '';
    const intensity = typeof args.intensity === 'number' ? args.intensity : Number(args.intensity);
    if (!mood || !Number.isFinite(intensity)) return malformed('mood and intensity are required.');
    const clamped = Math.max(1, Math.min(10, Math.round(intensity)));
    const note = typeof args.note === 'string' && args.note.trim() ? args.note.trim() : null;
    await store.recordStructuredMood({ sessionId, mood, intensity: clamped, note });
    return {
      effect: { type: 'mood_recorded', mood, intensity: clamped },
      result: { ok: true, mood, intensity: clamped },
    };
  }

  if (name === 'get_reflection_patterns') {
    const period = args.period === '30d' ? '30d' : args.period === '7d' ? '7d' : null;
    if (!period) return malformed('period must be 7d or 30d.');
    const report = derivePatterns(await store.listReflections(), period as PatternPeriod);
    return {
      effect: { type: 'patterns', report },
      result: {
        ok: true,
        sufficient: report.sufficient,
        reflectionCount: report.reflectionCount,
        period: report.period,
        trends: report.trends,
      },
    };
  }

  return { result: { ok: false, error: 'unknown_tool', name }, effect: { type: 'none' } };
}

export async function approveStoredReflection(
  store: VoiceMemoryStore,
  reflection: ReflectionMemory,
  patch: ApprovalPatch,
): Promise<ReflectionMemory | null> {
  return store.approveReflection(reflection.id, patch);
}
