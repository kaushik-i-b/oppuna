import type { SafetyCategory } from '@/types';

export interface CrisisHelpline {
  label: string;
  detail?: string;
  /** Dial string used with the tel: scheme (device dialer, fully offline action). */
  phone?: string;
  /** Free-form instruction for text/SMS based services (e.g. "Text HOME to 741741"). */
  text?: string;
}

export type CrisisRegionCode = 'IN' | 'US' | 'GB' | 'CA' | 'AU' | 'INTL';

export interface CrisisRegion {
  code: CrisisRegionCode;
  /** Display name of the region. */
  name: string;
  /** Local general emergency number, if applicable. */
  emergency?: string;
  helplines: CrisisHelpline[];
}

/**
 * India is the default region; it is defined separately so it can also serve as
 * the guaranteed non-null fallback in {@link getCrisisRegion}.
 */
const INDIA_REGION: CrisisRegion = {
  code: 'IN',
  name: 'India',
  emergency: '112',
  helplines: [
    {
      label: 'KIRAN Mental Health Helpline',
      detail: 'Government of India, 24/7, free, 13+ languages.',
      phone: '18005990019',
    },
    {
      label: 'Tele-MANAS',
      detail: 'National tele-mental health service, 24/7.',
      phone: '14416',
    },
    {
      label: 'AASRA',
      detail: '24/7 emotional support and suicide prevention.',
      phone: '+919820466726',
    },
    {
      label: 'iCall (TISS)',
      detail: 'Psychosocial counselling, Mon–Sat, 8am–10pm.',
      phone: '9152987821',
    },
    {
      label: 'Vandrevala Foundation',
      detail: '24/7 mental health support helpline.',
      phone: '18602662345',
    },
  ],
};

/**
 * Country-specific crisis helplines. Numbers are bundled so they work fully
 * offline. They are provided for convenience and may change over time; the UI
 * always reminds the user to fall back to local emergency services.
 */
export const CRISIS_REGIONS: CrisisRegion[] = [
  INDIA_REGION,
  {
    code: 'US',
    name: 'United States',
    emergency: '911',
    helplines: [
      {
        label: '988 Suicide & Crisis Lifeline',
        detail: 'Call or text 988, 24/7.',
        phone: '988',
      },
      {
        label: 'Crisis Text Line',
        detail: 'Text-based crisis support, 24/7.',
        text: 'Text HOME to 741741',
      },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    emergency: '999',
    helplines: [
      {
        label: 'Samaritans',
        detail: 'Free, 24/7 emotional support.',
        phone: '116123',
      },
      {
        label: 'Shout',
        detail: 'Free, confidential, 24/7 text support.',
        text: 'Text SHOUT to 85258',
      },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    emergency: '911',
    helplines: [
      {
        label: '9-8-8 Suicide Crisis Helpline',
        detail: 'Call or text 988, 24/7.',
        phone: '988',
      },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    emergency: '000',
    helplines: [
      {
        label: 'Lifeline',
        detail: 'Crisis support and suicide prevention, 24/7.',
        phone: '131114',
      },
      {
        label: 'Beyond Blue',
        detail: 'Mental health support, 24/7.',
        phone: '1300224636',
      },
    ],
  },
  {
    code: 'INTL',
    name: 'Other / International',
    helplines: [
      {
        label: 'Call local emergency services',
        detail:
          'If you or someone else is in immediate danger, contact your local emergency number now.',
      },
      {
        label: 'Find a helpline in your country',
        detail:
          'Search "suicide helpline" with your country name when you can get online, or ask someone nearby to help you find it. Befrienders Worldwide and Find A Helpline list services for most countries.',
      },
      {
        label: 'Reach a trusted person nearby',
        detail: 'Tell a family member, friend, or neighbour you trust that you need support now.',
      },
    ],
  },
];

export const DEFAULT_CRISIS_REGION: CrisisRegionCode = 'IN';

export function getCrisisRegion(code: CrisisRegionCode): CrisisRegion {
  return CRISIS_REGIONS.find((region) => region.code === code) ?? INDIA_REGION;
}

export const CRISIS_CATEGORY_LABEL: Record<SafetyCategory, string> = {
  suicide: 'Thoughts of suicide',
  self_harm: 'Self-harm',
  abuse: 'Abuse',
  violence: 'Violence',
  medical_emergency: 'Medical emergency',
  panic_emergency: 'Severe panic',
};
