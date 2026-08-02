import type { WellnessDeepLink, WellnessPlanActivity } from '@/wellness/types';

const DEEP_LINKS = new Set<WellnessDeepLink>([
  'breathe',
  'ground',
  'sleep',
  'journal',
  'mood',
  'none',
]);

export interface PersonalizedPlanCopy {
  title: string;
  encouragement: string;
  explanation: string;
  activities: { id: string; title: string; description: string }[];
}

function asNonEmptyString(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

/**
 * Parse and validate Qwen JSON personalization. Returns null if invalid.
 */
export function parsePersonalizedPlanJson(
  raw: string,
  expectedActivityIds: string[],
): PersonalizedPlanCopy | null {
  const jsonText = extractJsonObject(raw);
  if (!jsonText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;

  const title = asNonEmptyString(obj.title, 80);
  const encouragement = asNonEmptyString(obj.encouragement, 220);
  const explanation = asNonEmptyString(obj.explanation, 320);
  if (!title || !encouragement || !explanation) return null;

  if (!Array.isArray(obj.activities)) return null;
  const activities: PersonalizedPlanCopy['activities'] = [];
  const seen = new Set<string>();

  for (const item of obj.activities) {
    if (!item || typeof item !== 'object') return null;
    const row = item as Record<string, unknown>;
    const id = asNonEmptyString(row.id, 80);
    const actTitle = asNonEmptyString(row.title, 80);
    const description = asNonEmptyString(row.description, 220);
    if (!id || !actTitle || !description) return null;
    if (!expectedActivityIds.includes(id)) return null;
    if (seen.has(id)) return null;
    seen.add(id);
    activities.push({ id, title: actTitle, description });
  }

  if (activities.length !== expectedActivityIds.length) return null;
  for (const id of expectedActivityIds) {
    if (!seen.has(id)) return null;
  }

  return { title, encouragement, explanation, activities };
}

export function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    const inner = fence[1].trim();
    if (inner.startsWith('{') && inner.endsWith('}')) return inner;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return null;
}

export function applyPersonalizedCopy(
  activities: WellnessPlanActivity[],
  copy: PersonalizedPlanCopy,
): WellnessPlanActivity[] {
  const byId = new Map(copy.activities.map((a) => [a.id, a]));
  return activities.map((activity) => {
    const personalized = byId.get(activity.id);
    if (!personalized) return activity;
    return {
      ...activity,
      title: personalized.title,
      description: personalized.description,
    };
  });
}

export function isValidDeepLink(value: string): value is WellnessDeepLink {
  return DEEP_LINKS.has(value as WellnessDeepLink);
}
