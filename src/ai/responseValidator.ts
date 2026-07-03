/**
 * Response validator — the last gate before a reply reaches the user.
 *
 * Every candidate reply (from the rule engine today, from a local LLM later)
 * must pass this validator. It blocks:
 *  - medical diagnosis claims,
 *  - therapy/professional-role claims,
 *  - medication advice,
 *  - unsafe or harmful content,
 *  - repetitive replies (vs. recent assistant messages),
 *  - empty / overlong / question-flooded replies.
 */

import type { ValidationResult, ValidationViolation } from '@/ai/types';

const MAX_REPLY_LENGTH = 700;
const MAX_QUESTIONS = 3;
/** Token-overlap ratio above which a reply counts as a repeat of a recent one. */
const REPETITION_SIMILARITY = 0.9;

/* ------------------------------------------------------------------ *
 * Content rules
 * ------------------------------------------------------------------ */

const MEDICAL_DIAGNOSIS_PATTERNS: RegExp[] = [
  /\byou\s+(probably|likely|definitely|clearly|certainly)?\s*(have|are suffering from|suffer from)\s+(depression|an?\s*(anxiety|panic|eating|bipolar|personality)\s*disorder|adhd|add\b|bipolar|ptsd|ocd|schizophrenia|a mental illness)/i,
  /\b(sounds?|seems?)\s+like\s+you\s+have\s+(depression|adhd|bipolar|ptsd|ocd|an?\s*\w*\s*disorder)/i,
  /\bi\s+(can|will|am able to)?\s*diagnos/i,
  /\byour\s+diagnosis\b/i,
  /\byou\s+(are|’re|'re)\s+(clinically|severely)\s+(depressed|ill)\b/i,
];

const THERAPY_CLAIM_PATTERNS: RegExp[] = [
  /\bi\s*(’|')?m\s+(your|a|an)\s+(licensed\s+|real\s+|qualified\s+)?(therapist|psychologist|psychiatrist|doctor|physician|counsell?or|clinician)\b/i,
  /\bas\s+your\s+(therapist|psychologist|psychiatrist|doctor|counsell?or)\b/i,
  /\bthis\s+is\s+(real\s+)?(therapy|treatment|a therapy session)\b/i,
  /\bi\s+can\s+(treat|cure|heal)\s+(you|your)\b/i,
  /\bmy\s+professional\s+(opinion|advice|assessment)\b/i,
];

const MEDICATION_ADVICE_PATTERNS: RegExp[] = [
  /\byou\s+(should|need to|must|ought to|could)\s+(take|start|stop|quit|increase|decrease|double|skip|switch)\b[^.!?]{0,60}\b(medication|medicine|meds|dose|dosage|pills?|tablets?|antidepressants?|ssris?|benzos?|xanax|prozac|zoloft|valium|melatonin)\b/i,
  /\b(take|start|stop|quit|increase|decrease|double|skip)\b[^.!?]{0,30}\b(your|the|some)\s+(medication|medicine|meds|dose|dosage|pills?|antidepressants?)\b/i,
  /\bi\s+(would\s+)?(recommend|suggest|prescribe)\b[^.!?]{0,60}\b(mg\b|milligrams?|medication|antidepressants?|xanax|prozac|zoloft)\b/i,
];

const UNSAFE_CONTENT_PATTERNS: RegExp[] = [
  /\b(ways?|how|methods?)\s+to\s+(kill|hurt|harm)\s+(yourself|oneself|myself)\b/i,
  /\b(kill|hurt|harm|cut)\s+yourself\b/i,
  /\byou\s+(should|deserve to)\s+(die|be dead|suffer|be hurt)\b/i,
  /\bno\s+one\s+(cares about|loves|would miss)\s+you\b/i,
  /\byou\s*(’|')?re\s+(worthless|a burden|beyond help|hopeless)\b/i,
  /\bgive\s+up\s+on\s+(yourself|life)\b/i,
  /\bstop\s+(eating|sleeping)\s+(entirely|altogether|completely)\b/i,
];

/* ------------------------------------------------------------------ *
 * Repetition detection
 * ------------------------------------------------------------------ */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(Boolean));
}

/** Jaccard similarity of word sets — cheap and good enough for templates. */
export function similarity(a: string, b: string): number {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function isRepetitive(reply: string, recentReplies: readonly string[]): boolean {
  const normalized = normalize(reply);
  if (!normalized) return false;

  for (const previous of recentReplies) {
    if (normalize(previous) === normalized) return true;
  }

  // Near-duplicate of the immediately previous assistant message.
  const last = recentReplies[0];
  if (last && similarity(reply, last) >= REPETITION_SIMILARITY) return true;

  return false;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

export interface ValidationContext {
  /** Recent assistant replies, most recent first. */
  recentReplies?: readonly string[];
}

export function validateResponse(reply: string, context: ValidationContext = {}): ValidationResult {
  const violations: ValidationViolation[] = [];
  const trimmed = reply.trim();

  if (trimmed.length === 0) violations.push('empty');
  if (trimmed.length > MAX_REPLY_LENGTH) violations.push('too_long');

  if (MEDICAL_DIAGNOSIS_PATTERNS.some((re) => re.test(trimmed))) violations.push('medical_diagnosis');
  if (THERAPY_CLAIM_PATTERNS.some((re) => re.test(trimmed))) violations.push('therapy_claim');
  if (MEDICATION_ADVICE_PATTERNS.some((re) => re.test(trimmed))) violations.push('medication_advice');
  if (UNSAFE_CONTENT_PATTERNS.some((re) => re.test(trimmed))) violations.push('unsafe_content');

  const questionCount = (trimmed.match(/\?/g) ?? []).length;
  if (questionCount > MAX_QUESTIONS) violations.push('excessive_questions');

  if (context.recentReplies && isRepetitive(trimmed, context.recentReplies)) {
    violations.push('repetition');
  }

  return { ok: violations.length === 0, violations };
}
