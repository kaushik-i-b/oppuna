import type { SafetyCategory } from '@/types';

export interface CrisisResource {
  label: string;
  detail: string;
  /** Dial string used with the tel: scheme (device dialer, fully offline action). */
  phone?: string;
}

/**
 * Generic, region-neutral guidance. Oppuna deliberately avoids hardcoding a
 * single country's hotline as authoritative; it always directs the user to
 * local emergency services and a trusted person first.
 */
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    label: 'Call local emergency services',
    detail:
      'If you or someone else is in immediate danger, contact your local emergency number now.',
  },
  {
    label: 'Reach a trusted person nearby',
    detail: 'Tell a family member, friend, or neighbour you trust that you need support right now.',
  },
  {
    label: 'Contact a crisis or suicide helpline in your country',
    detail:
      'Many regions have free, confidential helplines available 24/7. Search "suicide helpline" with your country name when you are able to get online, or ask someone nearby to help you find it.',
  },
];

export const CRISIS_CATEGORY_LABEL: Record<SafetyCategory, string> = {
  suicide: 'Thoughts of suicide',
  self_harm: 'Self-harm',
  abuse: 'Abuse',
  violence: 'Violence',
  medical_emergency: 'Medical emergency',
  panic_emergency: 'Severe panic',
};
