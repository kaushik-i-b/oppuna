/**
 * Local fallback conversation brain for "Talk to Oppuna".
 *
 * Used when no AssemblyAI token is configured (fully offline demo path) and
 * as the response composer behind live AssemblyAI transcription. Pipeline:
 *
 *   1. Safety FIRST via the existing `assessSafety` — crisis input short-
 *      circuits to the scripted crisis reply + navigation hint. Never skipped.
 *   2. Approved-memory retrieval — ONLY user-approved memories, optionally
 *      relevance-filtered. Generates the contextual "wow moment" follow-up
 *      from real stored context (never hardcoded).
 *   3. `generateAIResponse` (on-device engine) for the base reply.
 *
 * Oppuna is a reflection companion — never a therapist/doctor, no diagnoses.
 */

import { assessSafety, CRISIS_REPLY } from '@/ai/safetyEngine';
import { generateAIResponse } from '@/ai/engine';
import { reflectionRepository } from '@/voice/reflectionRepository';
import { logVoiceEvent } from '@/voice/voiceLogger';

export interface ConversationContext {
  sessionId: string;
  recentUserTexts: string[];
  recentAgentTexts: string[];
}

export interface BrainReply {
  text: string;
  crisis: boolean;
  usedMemory: string | null;
}

const REFLECTION_OFFER =
  'Would you like me to turn this conversation into a reflection? You will review it before anything is saved.';

function looksLikeReflectionRequest(text: string): boolean {
  return /\b(reflection|remember|save this|journal this|write (this|it) down)\b/i.test(text);
}

function looksLikePatternQuestion(text: string): boolean {
  return /\b(how have i been|lately|patterns?|recently|this week|trends?)\b/i.test(text);
}

/** Extract candidate memory phrases ("X helps me…", "X has been … lately"). */
export function extractMemoryCandidates(transcript: string[]): string[] {
  const out: string[] = [];
  for (const line of transcript) {
    const match = line.match(
      /\b((?:evening walks?|walks?|reading|music|tea|exercise|running|meditat\w+|breathing)[^.]*help[^.]*|work[^.]*stress[^.]*|[^.]*hard to switch off[^.]*)\.?/i,
    );
    if (match?.[1]) {
      const candidate = match[1].trim().replace(/\s+/g, ' ');
      if (candidate.length > 12 && !out.includes(candidate)) out.push(candidate);
    }
    if (out.length >= 4) break;
  }
  return out;
}

export async function composeVoiceReply(
  userText: string,
  context: ConversationContext,
): Promise<BrainReply> {
  const text = userText.trim();
  if (!text) return { text: 'I did not catch that — could you say it once more?', crisis: false, usedMemory: null };

  // 1. Safety first — identical gate as the text chat.
  const safety = assessSafety(text);
  if (safety.crisis) {
    logVoiceEvent('voice:agent-response-started');
    return {
      text: `${CRISIS_REPLY} I am staying here with you. If you can, please reach out to someone you trust or your local emergency number right now.`,
      crisis: true,
      usedMemory: null,
    };
  }

  // 2. Approved-memory context ("wow moment" source).
  const approved = await reflectionRepository
    .getApprovedMemories(5, text)
    .catch(() => []);
  const memoryContext = approved.length > 0 ? approved.map((m) => m.text).join(' ') : null;

  // 3. Base reply from the on-device engine (offline, validated, safe).
  const history = [
    ...context.recentUserTexts.slice(-3).map((content) => ({ role: 'user' as const, content })),
    ...context.recentAgentTexts.slice(-3).map((content) => ({ role: 'assistant' as const, content })),
  ];
  let base = '';
  try {
    const response = await generateAIResponse({
      sessionId: context.sessionId,
      text,
      recentMessages: history,
      journalSummary: memoryContext,
    });
    base = response.reply;
  } catch {
    base = 'I am here with you. Tell me a little more about what is on your mind.';
  }

  // Weave retrieved memory into a natural follow-up instead of a generic line.
  if (memoryContext && approved[0]) {
    const memory = approved[0].text;
    const lower = memory.toLowerCase();
    let bridge: string;
    if (/switch off|unwind|evening|walk/.test(lower) && /stress|tired|exhaust|anxiet|worried|again/.test(text.toLowerCase())) {
      bridge = `Last time you mentioned ${memory.charAt(0).toLowerCase()}${memory.slice(1)}. Does today feel connected to that, or is something different going on?`;
    } else {
      bridge = `I remember you shared that ${memory.charAt(0).toLowerCase()}${memory.slice(1)}. How does that land with what is happening today?`;
    }
    logVoiceEvent('voice:agent-response-started');
    return { text: `${base} ${bridge}`, crisis: false, usedMemory: approved[0].text };
  }

  if (context.recentUserTexts.length >= 3 && looksLikeReflectionRequest(text)) {
    return { text: `Of course. ${REFLECTION_OFFER}`, crisis: false, usedMemory: null };
  }
  if (context.recentUserTexts.length >= 2 && !looksLikePatternQuestion(text)) {
    // Gently offer the reflection path after a few exchanges.
    return { text: `${base} ${REFLECTION_OFFER}`, crisis: false, usedMemory: null };
  }
  logVoiceEvent('voice:agent-response-started');
  return { text: base, crisis: false, usedMemory: null };
}

export function reflectionOfferLine(): string {
  return REFLECTION_OFFER;
}
