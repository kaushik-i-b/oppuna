export { WELLNESS_ACTIVITY_LIBRARY, getActivityById } from '@/wellness/activityLibrary';
export { buildDraftPlan, careKindForPlanActivity } from '@/wellness/ruleEngine';
export {
  generateTodayPlan,
  getTodayPlan,
  getWellnessPrefs,
  saveWellnessPrefs,
  togglePlanActivity,
  completePlan,
  planProgress,
  computeWellnessScore,
} from '@/wellness/planService';
export { personalizeDraftPlan } from '@/wellness/planPersonalizer';
export { buildPlanPersonalizationContext, PLAN_PERSONALIZER_SYSTEM } from '@/wellness/planContextBuilder';
export { parsePersonalizedPlanJson } from '@/wellness/planJsonValidator';
export { isPremiumFeatureEnabled } from '@/wellness/types';
export type {
  WellnessActivity,
  WellnessPlan,
  WellnessPrefs,
  WellnessMoodChip,
  WellnessGoalChip,
  WellnessDeepLink,
} from '@/wellness/types';
