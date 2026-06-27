/**
 * Oppuna offline wellness engine.
 *
 * A deterministic, fully on-device rule-based engine. It never calls a network
 * and never pretends to be a human or a therapist. Its job is to gently
 * validate, reflect, ask one small question, and suggest one safe micro-action.
 *
 * Safety first: crisis detection runs before anything else. When a crisis is
 * detected, the engine refuses to continue normal coaching and signals the UI
 * to show the crisis support flow.
 */

import type { MoodKey, SafetyCategory } from '@/types';

export type Rng = () => number;

export type Intent =
  | 'greeting'
  | 'anxiety'
  | 'sadness'
  | 'anger'
  | 'loneliness'
  | 'stress'
  | 'sleep'
  | 'gratitude'
  | 'self_esteem'
  | 'relationship'
  | 'motivation'
  | 'journaling'
  | 'breathing'
  | 'grounding'
  | 'thanks'
  | 'goodbye'
  | 'positive'
  | 'help'
  | 'unknown';

export interface AIResponse {
  reply: string;
  intent: Intent;
  mood: MoodKey | null;
  crisis: SafetyCategory | null;
  /** Optional quick-reply suggestions for the chat UI. */
  suggestions: string[];
}

/* ------------------------------------------------------------------ *
 * Crisis detection
 * ------------------------------------------------------------------ */

/** Ordered by priority — the first category with a match wins. */
export const CRISIS_PATTERNS: { category: SafetyCategory; patterns: RegExp[] }[] = [
  {
    category: 'suicide',
    patterns: [
      /\bsuicid/i,
      /\bkill(ing)?\s+my\s*self\b/i,
      /\bend(ing)?\s+(my|this)\s+life\b/i,
      /\btake\s+my\s+(own\s+)?life\b/i,
      /\b(don'?t|do not|no longer)\s+want\s+to\s+(live|be alive|be here|exist)\b/i,
      /\bwant\s+to\s+die\b/i,
      /\bbetter\s+off\s+dead\b/i,
      /\bno\s+reason\s+to\s+live\b/i,
      /\bcan'?t\s+go\s+on\b/i,
    ],
  },
  {
    category: 'self_harm',
    patterns: [
      /\bself[-\s]?harm/i,
      /\bcut(ting)?\s+my\s*self\b/i,
      /\bhurt(ing)?\s+my\s*self\b/i,
      /\bharm(ing)?\s+my\s*self\b/i,
      /\bburn(ing)?\s+my\s*self\b/i,
    ],
  },
  {
    category: 'medical_emergency',
    patterns: [
      /\bchest\s+pain\b/i,
      /\bcan'?t\s+breathe\b/i,
      /\boverdose\b/i,
      /\btook\s+too\s+many\s+(pills|tablets|meds)\b/i,
      /\bbleeding\s+(a lot|heavily|badly|out)\b/i,
      /\bunconscious\b/i,
      /\bheart\s+attack\b/i,
      /\bhaving\s+a\s+stroke\b/i,
    ],
  },
  {
    category: 'abuse',
    patterns: [
      /\b(being|getting)\s+abused\b/i,
      /\bsexual(ly)?\s+(assault|abused)/i,
      /\braped?\b/i,
      /\bdomestic\s+violence\b/i,
      /\b(he|she|they|someone)\s+(hits|beats|hurts)\s+me\b/i,
      /\bbeaten\s+(up|by)\b/i,
    ],
  },
  {
    category: 'violence',
    patterns: [
      /\bwant\s+to\s+(hurt|kill|attack)\s+(him|her|them|someone|people)\b/i,
      /\bgoing\s+to\s+(hurt|kill|attack)\s+(him|her|them|someone|people)\b/i,
      /\bkill\s+(him|her|them|everyone|people)\b/i,
    ],
  },
  {
    category: 'panic_emergency',
    patterns: [/\bpanic\s+attack\b/i, /\bhaving\s+a\s+breakdown\b/i],
  },
];

export function detectCrisis(text: string): SafetyCategory | null {
  const value = text.toLowerCase();
  for (const group of CRISIS_PATTERNS) {
    if (group.patterns.some((re) => re.test(value))) {
      return group.category;
    }
  }
  return null;
}

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
 * Response composition: validate → reflect → ask → micro-action
 * ------------------------------------------------------------------ */

interface Template {
  validate: string[];
  reflect: string[];
  question: string[];
  action: string[];
  suggestions: string[];
}

const TEMPLATES: Record<Intent, Template> = {
  greeting: {
    validate: ['Hi, I’m really glad you’re here.', 'Hello — it’s good to have a moment with you.'],
    reflect: ['This is a calm, private space, just for you.', 'Whatever you’re carrying, you can set some of it down here.'],
    question: ['How are you feeling right now?', 'What’s on your mind today?'],
    action: ['We can talk, track a mood, or try a short breathing exercise — whatever feels right.'],
    suggestions: ['I feel anxious', 'I feel low', 'I’m okay', 'Help me relax'],
  },
  anxiety: {
    validate: ['I’m sorry you’re feeling anxious.', 'That sounds really uncomfortable.', 'Anxiety can feel like a lot all at once.'],
    reflect: ['It makes sense that your mind is racing right now.', 'Your body might be bracing, even if there’s no danger here.'],
    question: ['What feels biggest in this moment?', 'Where do you notice the worry in your body?'],
    action: ['Let’s slow down for one minute — can you place your feet on the floor and take three gentle breaths?'],
    suggestions: ['Start breathing', 'Try grounding', 'I want to write it out'],
  },
  sadness: {
    validate: ['I’m sorry you’re feeling this way.', 'That sounds heavy to carry.', 'It’s okay to feel sad — it’s a real, human thing.'],
    reflect: ['You don’t have to push it away or explain it perfectly.', 'Sadness often asks to simply be noticed.'],
    question: ['Would it help to name what’s underneath it?', 'What has today been like for you?'],
    action: ['Let’s be gentle for a minute — maybe a slow breath, or a few words in your journal.'],
    suggestions: ['Write in journal', 'Breathe with me', 'I feel alone'],
  },
  anger: {
    validate: ['It’s okay to feel angry — it’s telling you something matters.', 'That sounds genuinely frustrating.'],
    reflect: ['Anger often sits on top of hurt or feeling unheard.', 'Your feelings are valid, even the sharp ones.'],
    question: ['What feels most unfair right now?', 'What did you need that you didn’t get?'],
    action: ['Before anything else, let’s release a little tension — a slow breath out, longer than the breath in.'],
    suggestions: ['Breathe it out', 'Write a thought record', 'Talk it through'],
  },
  loneliness: {
    validate: ['I’m sorry you’re feeling alone.', 'Loneliness can ache, even in a crowd.'],
    reflect: ['Reaching out here took something — that matters.', 'You’re not as invisible as the loneliness makes it feel.'],
    question: ['Is there one person you felt close to recently?', 'What kind of connection are you missing most?'],
    action: ['Maybe a small step — a short message to someone, or a few kind words to yourself in the journal.'],
    suggestions: ['Write it down', 'A self-care idea', 'Breathe with me'],
  },
  stress: {
    validate: ['That sounds like a lot to hold at once.', 'Feeling overwhelmed is a sign you’ve been carrying so much.'],
    reflect: ['When everything feels urgent, the mind struggles to rest.', 'You don’t have to do it all this minute.'],
    question: ['What is the one thing weighing on you most?', 'If only one thing got done today, what would help most?'],
    action: ['Let’s create a little space first — three slow breaths, then we can untangle one small piece.'],
    suggestions: ['Start breathing', 'Make a self-care plan', 'Brain-dump in journal'],
  },
  sleep: {
    validate: ['Not being able to rest is exhausting in itself.', 'I’m sorry sleep has been hard.'],
    reflect: ['A tired mind tends to grip thoughts tighter at night.', 'Your body is allowed to wind down slowly.'],
    question: ['What tends to keep you awake — thoughts, or restlessness?', 'How has your wind-down routine felt lately?'],
    action: ['Let’s try a calming breath for sleep — in for 4, hold for 7, out for 8.'],
    suggestions: ['Open sleep support', 'Breathe for sleep', 'Write before bed'],
  },
  gratitude: {
    validate: ['That’s a lovely thing to notice.', 'It’s beautiful that you paused to feel grateful.'],
    reflect: ['Noticing the good, even briefly, is a quiet strength.', 'Gratitude can gently widen a hard day.'],
    question: ['What made that moment stand out for you?', 'Who or what are you most thankful for right now?'],
    action: ['Maybe capture it in your gratitude journal so you can return to it later.'],
    suggestions: ['Open gratitude journal', 'Track my mood', 'Keep chatting'],
  },
  self_esteem: {
    validate: ['I’m really sorry you’re being so hard on yourself.', 'That inner voice sounds painful right now.'],
    reflect: ['The harshest thoughts are usually the least fair.', 'You are not the worst thing your mind says about you.'],
    question: ['Would you speak to a friend the way you’re speaking to yourself?', 'What is one thing that’s true and kinder?'],
    action: ['Let’s gently challenge that thought together — a short thought record can help.'],
    suggestions: ['Try a thought record', 'Be kinder to myself', 'Breathe with me'],
  },
  relationship: {
    validate: ['Relationship struggles can hurt deeply.', 'That sounds painful and tiring.'],
    reflect: ['It’s hard when someone close feels far away.', 'Your feelings about this are completely valid.'],
    question: ['What do you wish the other person understood?', 'What do you need most from this relationship right now?'],
    action: ['Maybe write down what you’re feeling first — it can bring some clarity before any conversation.'],
    suggestions: ['Write it out', 'Calm down first', 'Track my mood'],
  },
  motivation: {
    validate: ['Feeling stuck is genuinely draining.', 'It’s okay — low energy isn’t laziness.'],
    reflect: ['When the tank is empty, even small tasks feel huge.', 'Rest is part of moving forward, not the opposite of it.'],
    question: ['What is the smallest possible next step?', 'What would feel like enough today?'],
    action: ['Let’s pick one tiny action — small enough to feel almost easy — and start there.'],
    suggestions: ['Make a self-care plan', 'Just breathe', 'Write a little'],
  },
  journaling: {
    validate: ['Writing things down can really help.', 'That’s a kind thing to do for yourself.'],
    reflect: ['Putting feelings into words gives them a little more room.', 'Your journal is private and just for you.'],
    question: ['Would you like a prompt to start with?', 'What would you like to get out of your head?'],
    action: ['Here’s a gentle prompt to begin: what felt heavy today, and what felt a little lighter?'],
    suggestions: ['Open journal', 'Give me a prompt', 'Track my mood'],
  },
  breathing: {
    validate: ['Choosing to breathe on purpose is a good move.', 'That’s a caring thing to offer yourself.'],
    reflect: ['The breath is always with you, and it can steady the rest.', 'Slowing the exhale tells the body it’s safe to relax.'],
    question: ['Want to try it together now?', 'Which feels better — calming down or focusing?'],
    action: ['Let’s do a simple 4-4-6: in for 4, hold for 4, out for 6.'],
    suggestions: ['Start breathing', 'Box breathing', 'A 5-minute calm'],
  },
  grounding: {
    validate: ['Feeling detached can be unsettling.', 'I’m glad you reached for something steadying.'],
    reflect: ['Grounding gently brings you back to the present.', 'Your senses can be an anchor right now.'],
    question: ['Can you feel your feet on the floor?', 'What is one thing you can see clearly right now?'],
    action: ['Let’s try it: name five things you can see, then four you can hear.'],
    suggestions: ['Open grounding', 'Breathe with me', 'Keep talking'],
  },
  thanks: {
    validate: ['You’re very welcome.', 'I’m really glad it helped.'],
    reflect: ['You did the meaningful part by showing up for yourself.', 'Small steps like this add up.'],
    question: ['Would you like to keep going, or rest here for now?', 'Is there anything else on your mind?'],
    action: ['Whenever you need a calm moment, I’ll be right here, offline and private.'],
    suggestions: ['Track my mood', 'Write in journal', 'I’m done for now'],
  },
  goodbye: {
    validate: ['Take good care of yourself.', 'I’m glad we had this moment.'],
    reflect: ['You can return any time — everything here stays private on your device.', 'Be gentle with yourself today.'],
    question: ['Is there one kind thing you can do for yourself before you go?', 'What’s one small comfort you can reach for?'],
    action: ['Rest well. I’ll be here, offline, whenever you need.'],
    suggestions: ['One more breath', 'Quick journal', 'See you'],
  },
  positive: {
    validate: ['I’m really happy to hear that.', 'That’s wonderful.'],
    reflect: ['It’s worth pausing to let the good settle in.', 'These brighter moments matter just as much.'],
    question: ['What helped you feel this way?', 'How can you carry a little of this forward?'],
    action: ['Maybe note it in your journal so future-you can revisit it on a harder day.'],
    suggestions: ['Save to journal', 'Track my mood', 'Keep chatting'],
  },
  help: {
    validate: ['Happy to explain.', 'Good question.'],
    reflect: [
      'I’m a private, offline wellness companion — not a person, and not a therapist.',
      'I live entirely on your device and never send your words anywhere.',
    ],
    question: ['Would you like to talk, track a mood, or try a calming exercise?', 'Where would you like to start?'],
    action: ['You can chat here, journal, track moods, breathe, or open self-care any time.'],
    suggestions: ['I feel anxious', 'Track my mood', 'Try breathing'],
  },
  unknown: {
    validate: ['Thank you for sharing that.', 'I hear you.', 'I’m here with you.'],
    reflect: ['I may not fully grasp every detail, but your feelings matter here.', 'You don’t have to find the perfect words.'],
    question: ['Can you tell me a little more about how that feels?', 'What would feel most supportive right now?'],
    action: ['If it helps, we could slow down with a breath, or put a few words in your journal.'],
    suggestions: ['I feel anxious', 'I feel low', 'Try breathing', 'Write it out'],
  },
};

function pick<T>(items: readonly T[], rng: Rng): T {
  // Non-empty arrays are guaranteed by construction above.
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index] as T;
}

export function buildReply(intent: Intent, rng: Rng = Math.random): string {
  const template = TEMPLATES[intent];
  const parts = [
    pick(template.validate, rng),
    pick(template.reflect, rng),
    pick(template.question, rng),
    pick(template.action, rng),
  ];
  return parts.join(' ');
}

/** Safe fallback used if anything unexpected happens during composition. */
export const SAFE_FALLBACK =
  'I’m here with you. I didn’t quite follow that, but your feelings matter. ' +
  'Would you like to take a slow breath together, or tell me a little more?';

export interface GenerateOptions {
  rng?: Rng;
}

export function generateResponse(text: string, options: GenerateOptions = {}): AIResponse {
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
    const reply = buildReply(intent, rng);
    return {
      reply,
      intent,
      mood,
      crisis: null,
      suggestions: TEMPLATES[intent].suggestions,
    };
  } catch {
    return {
      reply: SAFE_FALLBACK,
      intent: 'unknown',
      mood: null,
      crisis: null,
      suggestions: TEMPLATES.unknown.suggestions,
    };
  }
}

export function randomPrompt(rng: Rng = Math.random): string {
  return pick(JOURNALING_PROMPTS, rng);
}
