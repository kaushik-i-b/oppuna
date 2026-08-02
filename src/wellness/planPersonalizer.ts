import { LOCAL_MODEL_CONFIG } from '@/config/localModel';
import {
  generateWithTimeout,
  getLocalLLMClient,
  isLLMAvailable,
} from '@/ai/llmClient';
import { logger } from '@/utils/logger';
import {
  PLAN_PERSONALIZER_SYSTEM,
  buildPlanPersonalizationContext,
} from '@/wellness/planContextBuilder';
import {
  applyPersonalizedCopy,
  parsePersonalizedPlanJson,
} from '@/wellness/planJsonValidator';
import type { DraftPlan } from '@/wellness/ruleEngine';

const PERSONALIZE_TIMEOUT_MS = Math.min(LOCAL_MODEL_CONFIG.responseTimeoutMs, 20_000);

/**
 * Ask Qwen to rewrite plan copy as JSON. On any failure, return the draft unchanged.
 */
export async function personalizeDraftPlan(
  draft: DraftPlan,
  displayName?: string,
): Promise<DraftPlan> {
  const client = getLocalLLMClient();
  const available = await isLLMAvailable(client);
  if (!available) {
    return draft;
  }

  const contextJson = buildPlanPersonalizationContext({
    context: draft.context,
    activities: draft.activities,
    displayName,
  });

  try {
    const userContent = `Personalize this wellness plan JSON. Keep activity ids identical.\n${contextJson}`;
    const completion = await generateWithTimeout(
      client,
      {
        system: PLAN_PERSONALIZER_SYSTEM,
        turns: [{ role: 'user', content: userContent }],
        messages: [
          { role: 'system', content: PLAN_PERSONALIZER_SYSTEM },
          { role: 'user', content: userContent },
        ],
      },
      PERSONALIZE_TIMEOUT_MS,
    );

    const expectedIds = draft.activities.map((a) => a.id);
    const parsed = parsePersonalizedPlanJson(completion.text, expectedIds);
    if (!parsed) {
      logger.warn('Plan personalizer JSON rejected; using rule copy');
      return draft;
    }

    return {
      ...draft,
      title: parsed.title,
      encouragement: parsed.encouragement,
      explanation: parsed.explanation,
      activities: applyPersonalizedCopy(draft.activities, parsed),
    };
  } catch (error) {
    logger.warn('Plan personalizer failed; using rule copy', { error: String(error) });
    return draft;
  }
}
