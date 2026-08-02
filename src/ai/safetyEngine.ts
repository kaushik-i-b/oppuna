/**
 * Safety engine — strict crisis detection.
 *
 * This runs BEFORE any other AI processing (rule engine or LLM). When a
 * crisis is detected the app must stop normal coaching and route the user to
 * the crisis support flow. The patterns below are intentionally conservative
 * and must not be relaxed by an LLM integration.
 */

import type { SafetyCategory } from '@/types';
import type { SafetyAssessment } from '@/ai/types';

/** Ordered by priority — the first category with a match wins. */
export const CRISIS_PATTERNS: { category: SafetyCategory; patterns: RegExp[] }[] = [
  {
    category: 'suicide',
    patterns: [
      /\bsuicid/i,
      /\bkill(ing)?\s+my\s*self\b/i,
      /\bend(ing)?\s+(my|this)\s+life\b/i,
      /\bend\s+it\s+all\b/i,
      /\btake\s+my\s+(own\s+)?life\b/i,
      /\b(don'?t|do not|no longer)\s+want\s+to\s+(live|be alive|be here|exist)\b/i,
      /\bwant\s+to\s+die\b/i,
      /\bwish\s+i\s+(was|were)\s+dead\b/i,
      /\bbetter\s+off\s+dead\b/i,
      /\bno\s+reason\s+to\s+live\b/i,
      /\bcan'?t\s+go\s+on\b/i,
      /\bthinking\s+about\s+(dying|death|killing\s+myself)\b/i,
      /\bplan(ning)?\s+to\s+(die|kill\s+myself|end\s+my\s+life)\b/i,
      /\bunalive\s+(myself|me)\b/i,
      /\bnot\s+want(ing)?\s+to\s+wake\s+up\b/i,
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

/** Assess a raw user message. Never throws. */
export function assessSafety(text: string): SafetyAssessment {
  try {
    return { crisis: detectCrisis(text) };
  } catch {
    // If detection itself fails, fail closed enough to keep coaching gentle,
    // but do not invent a crisis.
    return { crisis: null };
  }
}

/** Fixed, human-authored crisis reply. Never generated, never varied. */
export const CRISIS_REPLY =
  'I’m really concerned about your safety, and I’m glad you told me. ' +
  'I’m not able to help with this on my own, and you deserve real support right now. ' +
  'Please reach out to your local emergency services or someone you trust nearby.';
