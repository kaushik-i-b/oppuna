/**
 * Fallback engine — Oppuna's deterministic, rule-based wellness engine.
 *
 * Fully on-device: intent detection, mood detection, and template-based reply
 * composition. It is the guaranteed-safe engine the app falls back to when no
 * local LLM is available (which is the default today).
 *
 * Improvements over the original `offlineAI` engine:
 * - memory-aware line selection that avoids recently used template lines,
 * - variation openers when the user stays on the same topic several turns,
 * - the legacy pure functions are kept intact for existing callers/tests.
 */

import type { MoodKey } from '@/types';
import type { EngineResponse, Intent, Rng } from '@/ai/types';
import { detectCrisis } from '@/ai/safetyEngine';
import type { ConversationMemory } from '@/ai/conversationMemory';

/* ------------------------------------------------------------------ *
 * Mood detection
 * ------------------------------------------------------------------ */

const MOOD_KEYWORDS: { mood: MoodKey; words: string[] }[] = [
  {
    mood: 'awful',
    words: ['hopeless', 'unbearable', 'despair', 'worthless', 'terrible', 'the worst', 'broken', 'devastated'],
  },
  {
    mood: 'low',
    words: [
      'sad', 'down', 'depressed', 'unhappy', 'crying', 'cry', 'lonely', 'alone',
      'anxious', 'anxiety', 'worried', 'stressed', 'stress', 'overwhelmed',
      'tired', 'exhausted', 'empty', 'numb', 'angry', 'upset', 'scared', 'afraid',
    ],
  },
  { mood: 'okay', words: ['okay', 'ok', 'fine', 'meh', 'alright', 'so-so', 'not bad'] },
  { mood: 'good', words: ['good', 'better', 'calm', 'content', 'relaxed', 'peaceful', 'hopeful'] },
  {
    mood: 'great',
    words: ['great', 'amazing', 'wonderful', 'happy', 'joyful', 'excited', 'fantastic', 'grateful', 'thankful'],
  },
];

const NEGATIONS = ['not', 'no', "isn't", "wasn't", "aren't", "don't", "can't", 'never', 'barely', 'hardly'];

function isNegated(value: string, keyword: string): boolean {
  const idx = value.indexOf(keyword);
  if (idx < 0) return false;
  const before = value.slice(Math.max(0, idx - 18), idx);
  return NEGATIONS.some((n) => new RegExp(`\\b${n}\\b`).test(before));
}

export function detectMood(text: string): MoodKey | null {
  const value = text.toLowerCase();

  // Positive words that are negated should count as a low mood.
  for (const keyword of ['happy', 'good', 'great', 'okay', 'fine', 'calm', 'better']) {
    if (value.includes(keyword) && isNegated(value, keyword)) {
      return 'low';
    }
  }

  for (const group of MOOD_KEYWORDS) {
    for (const word of group.words) {
      if (value.includes(word) && !isNegated(value, word)) {
        return group.mood;
      }
    }
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Intent detection
 * ------------------------------------------------------------------ */

const INTENT_KEYWORDS: { intent: Intent; words: string[]; weight?: number }[] = [
  { intent: 'greeting', words: ['hello', 'hi ', 'hii', 'hey', 'good morning', 'good evening', 'good afternoon'] },
  { intent: 'thanks', words: ['thank you', 'thanks', 'appreciate it', 'thx'] },
  { intent: 'goodbye', words: ['goodbye', 'bye', 'good night', 'goodnight', 'see you', 'talk later'] },
  { intent: 'help', words: ['what can you do', 'how does this work', 'who are you', 'what are you', 'help me understand'] },
  {
    intent: 'self_esteem',
    words: ['hate myself', 'not good enough', 'worthless', "i'm a failure", 'im a failure', 'useless', "i'm stupid", 'im stupid', 'not enough', 'failure'],
    weight: 2,
  },
  {
    intent: 'loneliness',
    words: ['lonely', 'so alone', 'all alone', 'no friends', 'nobody', 'no one', 'left out', 'isolated'],
    weight: 2,
  },
  {
    intent: 'relationship',
    words: ['relationship', 'my partner', 'boyfriend', 'girlfriend', 'husband', 'wife', 'breakup', 'broke up', 'fight with', 'argument', 'we argued'],
    weight: 2,
  },
  {
    intent: 'anxiety',
    words: ['anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panicky', 'overthinking', 'on edge', 'restless', 'racing thoughts'],
    weight: 2,
  },
  {
    intent: 'sadness',
    words: ['sad', 'down', 'depressed', 'unhappy', 'crying', 'cry', 'grief', 'loss', 'empty', 'numb', 'hopeless'],
    weight: 2,
  },
  {
    intent: 'anger',
    words: ['angry', 'anger', 'furious', 'mad', 'frustrated', 'irritated', 'rage', 'annoyed', 'resentful'],
    weight: 2,
  },
  {
    intent: 'stress',
    words: ['stress', 'stressed', 'overwhelmed', 'too much', 'pressure', 'burnt out', 'burnout', 'deadline', 'can\'t cope'],
    weight: 2,
  },
  {
    intent: 'sleep',
    words: ["can't sleep", 'cannot sleep', 'insomnia', 'awake all night', 'no sleep', 'nightmares', 'restless night', 'trouble sleeping'],
    weight: 3,
  },
  { intent: 'motivation', words: ['unmotivated', 'no energy', "can't focus", 'procrastinat', 'stuck', 'give up', 'no point'], weight: 2 },
  { intent: 'gratitude', words: ['grateful', 'thankful', 'blessing', 'appreciate my'] },
  { intent: 'journaling', words: ['journal', 'want to write', 'writing helps', 'note down'] },
  { intent: 'breathing', words: ['breathe', 'breathing', 'breath exercise', 'calm down'] },
  { intent: 'grounding', words: ['grounding', 'ground me', 'dissociat', 'feel detached', 'feels unreal', 'spacing out'] },
  { intent: 'positive', words: ['happy', 'great day', 'feeling good', 'feeling better', 'excited', 'wonderful', 'amazing'] },
];

export function detectIntent(text: string): Intent {
  const value = ` ${text.toLowerCase()} `;
  const scores = new Map<Intent, number>();

  for (const group of INTENT_KEYWORDS) {
    let score = 0;
    for (const word of group.words) {
      if (value.includes(word)) score += group.weight ?? 1;
    }
    if (score > 0) scores.set(group.intent, (scores.get(group.intent) ?? 0) + score);
  }

  if (scores.size === 0) return 'unknown';

  let best: Intent = 'unknown';
  let bestScore = 0;
  for (const [intent, score] of scores) {
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * Reusable template pools (also used by screens and tests)
 * ------------------------------------------------------------------ */

export const JOURNALING_PROMPTS: string[] = [
  'What is one thing that felt heavy today, and one thing that felt a little lighter?',
  'If a kind friend saw your day, what would they want you to remember?',
  'Name three things you can see, hear, or feel around you right now.',
  'What is one small win from today, however tiny?',
  'What would you like to let go of before you sleep tonight?',
  'Who or what are you grateful for in this moment?',
  'What is a thought that kept returning today? Is it fully true?',
  'What do you need more of this week — rest, connection, or space?',
];

export const BREATHING_SUGGESTIONS: string[] = [
  'Try breathing in for 4, holding for 4, and out for 6. Just three rounds.',
  'Let’s slow the breath together — a gentle 4-4-6 cycle can calm the body.',
  'Box breathing can steady you: in 4, hold 4, out 4, hold 4.',
];

export const GROUNDING_SUGGESTIONS: string[] = [
  'Place both feet on the floor and notice five things you can see.',
  'Hold something near you and notice its texture, weight, and temperature.',
  'Name four things you can hear, three you can touch, two you can smell, one you can taste.',
];

export const SLEEP_SUGGESTIONS: string[] = [
  'A slow 4-7-8 breath can ease the body toward rest — in 4, hold 7, out 8.',
  'Try setting the phone aside and letting your shoulders soften into the bed.',
  'A short body scan, from toes to head, can quiet a busy mind before sleep.',
];

export const CBT_TEMPLATES: string[] = [
  'Sometimes a heavy thought feels like a fact. What is one gentler way to see this?',
  'If a friend had this exact thought, what kind thing would you say to them?',
  'What is a small piece of evidence that the harshest version of this thought might not be the whole story?',
];

export const MINDFULNESS_TEMPLATES: string[] = [
  'Let’s slow down for one minute and just notice what is here, without fixing anything.',
  'You don’t have to solve everything right now. This moment is enough to start with.',
  'Feelings move through us like weather. This one is allowed to be here too.',
];

/* ------------------------------------------------------------------ *
 * Response composition — varied length, conversational tone
 * ------------------------------------------------------------------ */

interface Template {
  validate: string[];
  reflect: string[];
  question: string[];
  action: string[];
  suggestions: string[];
}

/** How many template parts to stitch together for each intent. */
type ResponseShape = 'brief' | 'chat' | 'ground';

const RESPONSE_SHAPE: Record<Intent, ResponseShape> = {
  greeting: 'brief',
  thanks: 'brief',
  goodbye: 'brief',
  positive: 'brief',
  gratitude: 'brief',
  help: 'chat',
  unknown: 'chat',
  anxiety: 'ground',
  sadness: 'ground',
  anger: 'ground',
  loneliness: 'ground',
  stress: 'ground',
  sleep: 'ground',
  self_esteem: 'ground',
  relationship: 'ground',
  motivation: 'ground',
  journaling: 'chat',
  breathing: 'chat',
  grounding: 'chat',
};

const TEMPLATES: Record<Intent, Template> = {
  greeting: {
    validate: ['Hey — glad you’re here.', 'Hi. Good to see you.', 'Hello.'],
    reflect: ['This is your space — quiet, private, no rush.', 'Whatever’s on your mind, you can put it here.'],
    question: ['How’re you doing right now?', 'What’s going on?'],
    action: ['We can just talk, log a mood, or try a quick breath — your call.'],
    suggestions: ['I feel anxious', 'I feel low', 'I’m okay', 'Help me relax'],
  },
  anxiety: {
    validate: ['Anxiety can hit hard — glad you said something.', 'Sounds really uncomfortable.', 'Yeah, that anxious feeling is a lot.'],
    reflect: ['When your mind races, everything feels ten times bigger.', 'Your body might be on high alert even when nothing’s actually wrong.'],
    question: ['What’s taking up the most space in your head?', 'Where do you feel it in your body?'],
    action: ['Want to try three slow breaths? Feet on the floor, in for 4, out for 6.'],
    suggestions: ['Start breathing', 'Try grounding', 'I want to write it out'],
  },
  sadness: {
    validate: ['That sounds really heavy.', 'I’m sorry it’s been like this.', 'Sadness is hard — you don’t have to hide it here.'],
    reflect: ['You don’t need the perfect words or a neat explanation.', 'Sometimes sadness just needs to be felt, not fixed.'],
    question: ['What’s underneath it, if you can name it?', 'How has today actually been?'],
    action: ['Maybe one slow breath, or a few lines in your journal — whatever feels gentler.'],
    suggestions: ['Write in journal', 'Breathe with me', 'I feel alone'],
  },
  anger: {
    validate: ['Anger usually means something mattered — that’s valid.', 'Sounds genuinely frustrating.'],
    reflect: ['A lot of anger sits on top of hurt or feeling dismissed.', 'You’re allowed to feel this, even the sharp parts.'],
    question: ['What feels most unfair right now?', 'What did you need that you didn’t get?'],
    action: ['Before anything else — one long breath out, longer than the breath in.'],
    suggestions: ['Breathe it out', 'Write a thought record', 'Talk it through'],
  },
  loneliness: {
    validate: ['Loneliness hurts, even when you’re around people.', 'I’m sorry you’re feeling so alone.'],
    reflect: ['You reaching out here took something — that counts.', 'You’re not as invisible as the loneliness makes it feel.'],
    question: ['Is there someone you felt close to recently?', 'What kind of connection are you missing most?'],
    action: ['A small step might help — a short message to someone, or a few kind words to yourself in the journal.'],
    suggestions: ['Write it down', 'A self-care idea', 'Breathe with me'],
  },
  stress: {
    validate: ['That’s a lot to carry.', 'Feeling overwhelmed usually means you’ve been holding too much for too long.'],
    reflect: ['When everything feels urgent, your mind can’t get a break.', 'You don’t have to solve it all this minute.'],
    question: ['What’s weighing on you most?', 'If only one thing got done today, what would actually help?'],
    action: ['Let’s make a little room first — three slow breaths, then we can untangle one small piece.'],
    suggestions: ['Start breathing', 'Make a self-care plan', 'Brain-dump in journal'],
  },
  sleep: {
    validate: ['Not being able to rest is exhausting on its own.', 'Rough nights are the worst.'],
    reflect: ['A tired mind tends to grip thoughts tighter after dark.', 'Your body’s allowed to wind down slowly — no rush.'],
    question: ['What keeps you up — racing thoughts, or restlessness?', 'How’s your wind-down been lately?'],
    action: ['A 4-7-8 breath can help — in for 4, hold 7, out for 8.'],
    suggestions: ['Open sleep support', 'Breathe for sleep', 'Write before bed'],
  },
  gratitude: {
    validate: ['That’s a lovely thing to notice.', 'Nice that you paused to feel that.'],
    reflect: ['Noticing good stuff, even briefly, is a quiet kind of strength.', 'Gratitude can soften a hard day, just a little.'],
    question: ['What made that moment stand out?', 'Who or what are you most thankful for right now?'],
    action: ['Maybe jot it in your gratitude journal so future-you can find it again.'],
    suggestions: ['Open gratitude journal', 'Track my mood', 'Keep chatting'],
  },
  self_esteem: {
    validate: ['That inner voice sounds really harsh right now.', 'I’m sorry you’re being so hard on yourself.'],
    reflect: ['The meanest thoughts are usually the least true.', 'You are not the worst thing your mind says about you.'],
    question: ['Would you talk to a friend this way?', 'What’s one thing that’s true and a little kinder?'],
    action: ['A short thought record might help gently challenge what your mind is saying.'],
    suggestions: ['Try a thought record', 'Be kinder to myself', 'Breathe with me'],
  },
  relationship: {
    validate: ['Relationship stuff can cut deep.', 'That sounds painful and tiring.'],
    reflect: ['It’s hard when someone close feels far away.', 'Your feelings about this are completely valid.'],
    question: ['What do you wish they understood?', 'What do you need most from this right now?'],
    action: ['Writing it down first can bring some clarity before any conversation.'],
    suggestions: ['Write it out', 'Calm down first', 'Track my mood'],
  },
  motivation: {
    validate: ['Feeling stuck is genuinely draining.', 'Low energy isn’t laziness — it’s a signal.'],
    reflect: ['When the tank’s empty, even small tasks feel huge.', 'Rest is part of moving forward, not the opposite of it.'],
    question: ['What’s the smallest possible next step?', 'What would feel like enough today?'],
    action: ['Pick one tiny action — small enough to feel almost easy — and start there.'],
    suggestions: ['Make a self-care plan', 'Just breathe', 'Write a little'],
  },
  journaling: {
    validate: ['Writing things down can really help.', 'Good instinct — getting it out of your head.'],
    reflect: ['Putting feelings into words gives them a little more room.', 'Your journal is private and just for you.'],
    question: ['Want a prompt to start with?', 'What do you want to get out of your head?'],
    action: ['Try this: what felt heavy today, and what felt a little lighter?'],
    suggestions: ['Open journal', 'Give me a prompt', 'Track my mood'],
  },
  breathing: {
    validate: ['Good call — breathing on purpose actually helps.', 'That’s a caring thing to offer yourself.'],
    reflect: ['Your breath is always with you, and it can steady the rest.', 'A longer exhale tells your body it’s safe to relax.'],
    question: ['Want to try it together now?', 'Calming down, or just focusing?'],
    action: ['Let’s do a simple 4-4-6: in for 4, hold for 4, out for 6.'],
    suggestions: ['Start breathing', 'Box breathing', 'A 5-minute calm'],
  },
  grounding: {
    validate: ['Feeling detached can be unsettling.', 'Glad you reached for something steadying.'],
    reflect: ['Grounding gently brings you back to the present.', 'Your senses can be an anchor right now.'],
    question: ['Can you feel your feet on the floor?', 'What’s one thing you can see clearly right now?'],
    action: ['Try naming five things you see, then four you hear.'],
    suggestions: ['Open grounding', 'Breathe with me', 'Keep talking'],
  },
  thanks: {
    validate: ['You’re welcome.', 'Glad it helped.'],
    reflect: ['You did the real work by showing up for yourself.', 'Small steps add up.'],
    question: ['Want to keep going, or rest here?', 'Anything else on your mind?'],
    action: ['I’ll be here whenever you need a calm moment.'],
    suggestions: ['Track my mood', 'Write in journal', 'I’m done for now'],
  },
  goodbye: {
    validate: ['Take care of yourself.', 'Glad we talked.'],
    reflect: ['Come back any time — everything stays private on your device.', 'Be gentle with yourself today.'],
    question: ['One kind thing you can do for yourself before you go?', 'A small comfort you can reach for?'],
    action: ['Rest well. I’ll be here when you need me.'],
    suggestions: ['One more breath', 'Quick journal', 'See you'],
  },
  positive: {
    validate: ['That’s great to hear.', 'Love that.'],
    reflect: ['Worth pausing to let the good settle in.', 'These brighter moments matter just as much.'],
    question: ['What helped you feel this way?', 'How can you carry a little of this forward?'],
    action: ['Maybe note it in your journal for a harder day.'],
    suggestions: ['Save to journal', 'Track my mood', 'Keep chatting'],
  },
  help: {
    validate: ['Sure — happy to explain.', 'Good question.'],
    reflect: [
      'Think of me as a calm pocket on your phone — private, offline, here when you need to vent or wind down.',
      'Everything stays on your device. I’m not a therapist, but I can listen and point you toward breathing, journaling, or mood tracking.',
    ],
    question: ['Want to talk, log a mood, or try something calming?', 'Where would you like to start?'],
    action: ['Chat, journal, moods, breathing, self-care — all right here.'],
    suggestions: ['I feel anxious', 'Track my mood', 'Try breathing'],
  },
  unknown: {
    validate: ['Thanks for sharing that.', 'I hear you.', 'I’m here.'],
    reflect: ['I might not catch every detail, but what you’re feeling matters.', 'You don’t need the perfect words.'],
    question: ['Can you say a bit more about how that feels?', 'What would feel most supportive right now?'],
    action: ['We could slow down with a breath, or put a few words in your journal.'],
    suggestions: ['I feel anxious', 'I feel low', 'Try breathing', 'Write it out'],
  },
};

/**
 * Gentle openers used instead of the usual "validate" line when the user has
 * stayed on the same topic for several turns — keeps replies from sounding
 * like a broken record.
 */
const REPEAT_OPENERS: string[] = [
  'This is still sitting with you, huh?',
  'Sounds like it hasn’t eased yet — that’s okay.',
  'We’ve been here before, and it still matters.',
  'Still on your mind — I’m here.',
];

/** Pull a short phrase from the user message to echo back lightly. */
function extractEchoPhrase(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 10) return null;

  const patterns = [
    /\babout\s+(.{3,45}?)(?:[.!?,]|$)/i,
    /\bbecause\s+(.{3,50}?)(?:[.!?,]|$)/i,
    /\bwith\s+(.{3,40}?)(?:[.!?,]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const phrase = match[1].trim().replace(/\s+/g, ' ');
      if (phrase.split(' ').length <= 8) return phrase;
    }
  }
  return null;
}

function maybePersonalize(reflect: string, userText: string | undefined, rng: Rng): string {
  if (!userText) return reflect;
  const echo = extractEchoPhrase(userText);
  if (!echo || rng() > 0.5) return reflect;

  const hooks = [
    `Yeah, the ${echo} part sounds like it’s really getting to you.`,
    `I can see how ${echo} would weigh on you.`,
    `Something about ${echo} — I hear that.`,
  ];
  return `${pick(hooks, rng)} ${reflect}`;
}

function selectParts(
  shape: ResponseShape,
  opener: string,
  reflect: string,
  question: string,
  action: string,
  rng: Rng,
): string[] {
  switch (shape) {
    case 'brief': {
      const second = rng() < 0.55 ? reflect : question;
      return [opener, second];
    }
    case 'chat': {
      return rng() < 0.5 ? [opener, reflect, question] : [opener, reflect, action];
    }
    case 'ground': {
      const roll = rng();
      if (roll < 0.3) return [opener, reflect, question];
      if (roll < 0.55) return [opener, reflect, action];
      if (roll < 0.8) return [opener, question, action];
      return [opener, reflect];
    }
  }
}

function pick<T>(items: readonly T[], rng: Rng): T {
  // Non-empty arrays are guaranteed by construction above.
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index] as T;
}

/**
 * Memory-aware pick: prefers lines not used recently. Among the least
 * recently used candidates, `rng` picks one, so replies stay varied but
 * deterministic under a seeded rng.
 */
function pickVaried(items: readonly string[], memory: ConversationMemory | undefined, rng: Rng): string {
  if (!memory || items.length === 1) return pick(items, rng);

  let lowest = Number.POSITIVE_INFINITY;
  for (const item of items) {
    const used = memory.lastUsedTurn(item);
    if (used < lowest) lowest = used;
  }
  const candidates = items.filter((item) => memory.lastUsedTurn(item) === lowest);
  const chosen = pick(candidates.length > 0 ? candidates : items, rng);
  memory.noteLineUsed(chosen);
  return chosen;
}

/** Intents where a repeat-opener would feel wrong even if repeated. */
const NO_REPEAT_OPENER: ReadonlySet<Intent> = new Set([
  'greeting', 'thanks', 'goodbye', 'help', 'positive', 'gratitude', 'unknown',
]);

/**
 * Core composition — picks a natural-length reply instead of always stitching
 * four template lines together.
 */
function composeReplyInternal(
  intent: Intent,
  memory: ConversationMemory | undefined,
  rng: Rng,
  userText?: string,
): string {
  const template = TEMPLATES[intent];
  const shape = RESPONSE_SHAPE[intent];

  const useRepeatOpener =
    memory !== undefined && !NO_REPEAT_OPENER.has(intent) && memory.intentStreak(intent) >= 2;

  const opener = useRepeatOpener
    ? pickVaried(REPEAT_OPENERS, memory, rng)
    : pickVaried(template.validate, memory, rng);

  const reflect = maybePersonalize(
    pickVaried(template.reflect, memory, rng),
    userText,
    rng,
  );
  const question = pickVaried(template.question, memory, rng);
  const action = pickVaried(template.action, memory, rng);

  const parts = selectParts(shape, opener, reflect, question, action, rng);
  return parts.join(' ');
}

/**
 * Legacy pure composition (kept for existing callers and tests).
 */
export function buildReply(intent: Intent, rng: Rng = Math.random): string {
  return composeReplyInternal(intent, undefined, rng);
}

/**
 * Memory-aware composition: avoids recently used lines and, when the user has
 * repeated the same topic 2+ turns in a row, swaps the opener for a gentler
 * acknowledgement of the repetition.
 */
export function composeReply(
  intent: Intent,
  memory: ConversationMemory | undefined,
  rng: Rng = Math.random,
  userText?: string,
): string {
  return composeReplyInternal(intent, memory, rng, userText);
}

export function suggestionsFor(intent: Intent): string[] {
  return [...TEMPLATES[intent].suggestions];
}

/** Safe fallback used if anything unexpected happens during composition. */
export const SAFE_FALLBACK =
  'I’m here. I didn’t quite follow, but what you’re feeling still matters. ' +
  'Want to take a slow breath, or tell me a bit more?';

export interface GenerateOptions {
  rng?: Rng;
  /** Optional session memory enabling repetition prevention and variation. */
  memory?: ConversationMemory;
}

/**
 * Rule-engine response, identical in shape to the original
 * `offlineAI.generateResponse`. Crisis detection is included so this function
 * remains safe when called directly (legacy callers), but the orchestrator in
 * `engine.ts` runs the safety engine first regardless.
 */
export function generateResponse(text: string, options: GenerateOptions = {}): EngineResponse {
  const rng = options.rng ?? Math.random;
  const trimmed = text.trim();

  const crisis = detectCrisis(trimmed);
  if (crisis) {
    return {
      reply:
        'I’m really concerned about your safety, and I’m glad you told me. ' +
        'I’m not able to help with this on my own, and you deserve real support right now. ' +
        'Please reach out to your local emergency services or someone you trust nearby.',
      intent: 'unknown',
      mood: detectMood(trimmed),
      crisis,
      suggestions: [],
    };
  }

  try {
    const intent = detectIntent(trimmed);
    const mood = detectMood(trimmed);
    const reply = options.memory
      ? composeReply(intent, options.memory, rng, trimmed)
      : buildReply(intent, rng);
    return {
      reply,
      intent,
      mood,
      crisis: null,
      suggestions: suggestionsFor(intent),
    };
  } catch {
    return {
      reply: SAFE_FALLBACK,
      intent: 'unknown',
      mood: null,
      crisis: null,
      suggestions: suggestionsFor('unknown'),
    };
  }
}

export function randomPrompt(rng: Rng = Math.random): string {
  return pick(JOURNALING_PROMPTS, rng);
}
