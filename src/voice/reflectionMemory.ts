import type {
  ApprovedMemorySnippet,
  ForgetResult,
  PatternPeriod,
  PatternReport,
  PatternTrend,
  ReflectionDraftInput,
  ReflectionMemory,
} from '@/voice/types';

export const LOCAL_USER_ID = 'local';

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'have',
  'been',
  'was',
  'were',
  'are',
  'but',
  'not',
  'you',
  'your',
  'about',
  'from',
  'just',
  'into',
  'again',
  'today',
  'feeling',
  'feel',
]);

export function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function normalizeDraft(input: Partial<ReflectionDraftInput>): ReflectionDraftInput {
  return {
    summary: typeof input.summary === 'string' ? input.summary.trim() : '',
    mood: typeof input.mood === 'string' && input.mood.trim() ? input.mood.trim() : null,
    themes: asStringList(input.themes),
    concerns: asStringList(input.concerns),
    positiveMoments: asStringList(input.positiveMoments),
    commitments: asStringList(input.commitments),
    excludedTopics: asStringList(input.excludedTopics),
    memoryCandidates: asStringList(input.memoryCandidates),
    realization: typeof input.realization === 'string' ? input.realization.trim() : '',
  };
}

function mentionsExcluded(text: string, topics: string[]): boolean {
  const haystack = text.toLowerCase();
  return topics.some((topic) => {
    const needle = topic.trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
}

function scrubProse(text: string, topics: string[]): string {
  if (!text.trim() || topics.length === 0) return text.trim();
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && !mentionsExcluded(sentence, topics));
  return sentences.join(' ').trim();
}

function scrubList(items: string[], topics: string[]): string[] {
  return items.filter((item) => !mentionsExcluded(item, topics));
}

/**
 * Removes excluded topics from every field that can be saved or remembered.
 * The topic labels themselves stay on `excludedTopics` so the exclusion is auditable.
 */
export function applyExclusions(draft: ReflectionDraftInput): ReflectionDraftInput {
  const topics = draft.excludedTopics.map((topic) => topic.trim()).filter(Boolean);
  if (topics.length === 0) return draft;
  const summary = scrubProse(draft.summary, topics);
  const realization = scrubProse(draft.realization, topics);
  return {
    ...draft,
    summary:
      summary ||
      'You asked to leave some details out of this reflection. The rest of the conversation is what remains.',
    mood: draft.mood && mentionsExcluded(draft.mood, topics) ? null : draft.mood,
    themes: scrubList(draft.themes, topics),
    concerns: scrubList(draft.concerns, topics),
    positiveMoments: scrubList(draft.positiveMoments, topics),
    commitments: scrubList(draft.commitments, topics),
    memoryCandidates: scrubList(draft.memoryCandidates, topics),
    realization,
    excludedTopics: topics,
  };
}

export function textContainsExcluded(text: string, topics: string[]): boolean {
  return mentionsExcluded(text, topics);
}

export interface MemoryDecision {
  text: string;
  included: boolean;
}

/** Only included, non-empty lines become long-term memory. */
export function resolveApprovedMemories(
  candidates: string[],
  decisions: MemoryDecision[],
): string[] {
  const approved: string[] = [];
  const seen = new Set<string>();

  for (const decision of decisions) {
    if (!decision.included) continue;
    const text = decision.text.trim();
    if (!text || seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    approved.push(text);
  }

  if (decisions.length === 0) {
    for (const candidate of candidates) {
      const text = candidate.trim();
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      approved.push(text);
    }
  }

  return approved;
}

function stem(token: string): string {
  const next = token.replace(/(ingly|ness|ful|ing|ed|ly)$/, '');
  return next.length >= 4 ? next : token;
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .map((token) => token.replace(/'(s|t|re|ve)$/, ''))
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    .map(stem);
}

function tokenMatches(left: string, right: string): boolean {
  if (left === right) return true;
  const short = left.length <= right.length ? left : right;
  const long = left.length <= right.length ? right : left;
  return short.length >= 4 && long.startsWith(short);
}

function scoreRelevance(record: ReflectionMemory, relevantTo: string): number {
  const query = tokens(relevantTo);
  if (query.length === 0) return 0;
  const corpus = tokens(
    [record.summary, record.mood ?? '', ...record.themes, ...record.approvedMemories].join(' '),
  );
  let score = 0;
  for (const word of query) {
    if (corpus.some((candidate) => tokenMatches(word, candidate))) score += 1;
  }
  return score;
}

export function toSnippet(record: ReflectionMemory): ApprovedMemorySnippet {
  return {
    reflectionId: record.id,
    createdAt: record.createdAt,
    summary: record.summary,
    mood: record.mood,
    themes: record.themes,
    approvedMemories: record.approvedMemories,
    demoSeed: record.demoSeed,
  };
}

/**
 * Returns only user-approved memories. Rejected candidates and excluded-topic
 * text are never included. An explicit topic with no overlap returns nothing.
 */
export function retrieveApprovedMemories(
  records: ReflectionMemory[],
  input: { limit: number; relevantTo?: string },
): ApprovedMemorySnippet[] {
  const limit = Math.max(1, Math.min(20, Math.round(input.limit || 5)));
  const approved = records.filter((record) => record.userApproved && record.approvedMemories.length > 0);
  const relevantTo = input.relevantTo?.trim() ?? '';

  const ranked = relevantTo
    ? approved
        .map((record) => ({ record, score: scoreRelevance(record, relevantTo) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || b.record.createdAt - a.record.createdAt)
    : approved
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((record) => ({ record, score: 1 }));

  return ranked.slice(0, limit).map((item) => toSnippet(item.record));
}

const MOOD_SCORE: Record<string, number> = {
  great: 5,
  good: 4,
  calm: 4,
  okay: 3,
  tired: 3,
  low: 2,
  stressed: 2,
  anxious: 2,
  awful: 1,
};

export function moodScore(mood: string | null): number | null {
  if (!mood) return null;
  const key = mood.trim().toLowerCase();
  return MOOD_SCORE[key] ?? null;
}

const PERIOD_MS: Record<PatternPeriod, number> = {
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

function titleCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Trends are counted from approved reflections only.
 * Fewer than two reflections in the window returns no trends.
 */
export function derivePatterns(
  records: ReflectionMemory[],
  period: PatternPeriod,
  now = Date.now(),
): PatternReport {
  const since = now - PERIOD_MS[period];
  const window = records
    .filter((record) => record.userApproved && record.createdAt >= since)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (window.length < 2) {
    return { period, sufficient: false, reflectionCount: window.length, trends: [] };
  }

  const trends: PatternTrend[] = [];
  const midpoint = since + PERIOD_MS[period] / 2;
  const themeCounts = new Map<string, { total: number; early: number; late: number }>();

  for (const record of window) {
    const late = record.createdAt >= midpoint;
    const unique = new Set(record.themes.map((theme) => theme.trim().toLowerCase()).filter(Boolean));
    for (const theme of unique) {
      const current = themeCounts.get(theme) ?? { total: 0, early: 0, late: 0 };
      current.total += 1;
      if (late) current.late += 1;
      else current.early += 1;
      themeCounts.set(theme, current);
    }
  }

  const rankedThemes = [...themeCounts.entries()].sort((a, b) => b[1].total - a[1].total);
  const top = rankedThemes[0];
  if (top && top[1].total >= 2) {
    const [label, counts] = top;
    let direction = 'steady';
    if (counts.late > counts.early) direction = 'increasing';
    else if (counts.late < counts.early) direction = 'easing';
    trends.push({
      label: titleCase(label),
      detail: `${direction} · mentioned ${counts.total} times`,
    });
  } else if (top && top[1].total === 1 && rankedThemes.length > 0) {
    trends.push({
      label: titleCase(top[0]),
      detail: 'mentioned once',
    });
  }

  const positiveCounts = new Map<string, number>();
  for (const record of window) {
    for (const moment of record.positiveMoments) {
      const key = moment.trim();
      if (!key) continue;
      positiveCounts.set(key, (positiveCounts.get(key) ?? 0) + 1);
    }
  }
  const positive = [...positiveCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (positive) {
    trends.push({
      label: positive[0],
      detail: positive[1] > 1 ? `positive association · ${positive[1]} times` : 'positive association',
    });
  }

  const scores = window
    .map((record) => ({ at: record.createdAt, score: moodScore(record.mood) }))
    .filter((item): item is { at: number; score: number } => item.score !== null);

  if (scores.length >= 2) {
    const early = scores.filter((item) => item.at < midpoint);
    const late = scores.filter((item) => item.at >= midpoint);
    const earlySet = early.length > 0 ? early : scores.slice(0, Math.ceil(scores.length / 2));
    const lateSet = late.length > 0 ? late : scores.slice(Math.ceil(scores.length / 2));
    const avg = (items: { score: number }[]) =>
      items.reduce((sum, item) => sum + item.score, 0) / items.length;
    if (earlySet.length > 0 && lateSet.length > 0) {
      const delta = avg(lateSet) - avg(earlySet);
      let detail = 'steady';
      if (delta <= -0.5) detail = 'trending lower';
      else if (delta >= 0.5) detail = 'trending higher';
      trends.push({ label: 'Overall mood', detail });
    }
  }

  return { period, sufficient: true, reflectionCount: window.length, trends };
}

export interface ConversationSnapshot {
  transcripts: { id: string; sessionId: string }[];
  reflections: ReflectionMemory[];
}

export function applyForget(snapshot: ConversationSnapshot, sessionId: string): {
  snapshot: ConversationSnapshot;
  result: ForgetResult;
} {
  const removedTranscripts = snapshot.transcripts.filter((row) => row.sessionId === sessionId).length;
  const removedUnsavedReflections = snapshot.reflections.filter(
    (row) => row.sessionId === sessionId && !row.userApproved,
  ).length;
  const keptApprovedReflections = snapshot.reflections.filter((row) => row.userApproved).length;

  return {
    snapshot: {
      transcripts: snapshot.transcripts.filter((row) => row.sessionId !== sessionId),
      reflections: snapshot.reflections.filter(
        (row) => row.sessionId !== sessionId || row.userApproved,
      ),
    },
    result: { removedTranscripts, removedUnsavedReflections, keptApprovedReflections },
  };
}
