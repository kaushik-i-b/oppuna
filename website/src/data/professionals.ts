/**
 * Professional directory data model.
 *
 * All records in this file are FICTIONAL DEMONSTRATION profiles used to
 * preview the upcoming directory experience. They do not represent real,
 * licensed, verified, or currently available practitioners.
 *
 * UI strings in this module are written as plain exported constants so they
 * can be moved into a localization layer later without touching components.
 * Do not add clinically reviewed translations here without professional
 * validation.
 */

export type ProfessionalCategory =
  | "Psychiatrist"
  | "Clinical Psychologist"
  | "Counselling Psychologist";

export type VerificationStatus = "demo" | "unverified" | "verified";

export interface Professional {
  id: string;
  slug: string;
  name: string;
  category: ProfessionalCategory;
  /** Languages the professional is presented as supporting. */
  languages: string[];
  /** Canonical focus areas; must use values from SPECIALIZATIONS. */
  specializations: string[];
  /** Short card description (fictional for demo records). */
  description: string;
  /** Longer detail-page biography (fictional for demo records). */
  biography: string;
  /** Presented professional approach (fictional for demo records). */
  approach: string;
  /** Neutral initials rendered in place of a photo. Never use real photos. */
  initials: string;
  isDemo: boolean;
  verificationStatus: VerificationStatus;
}

export const CATEGORIES: ProfessionalCategory[] = [
  "Psychiatrist",
  "Clinical Psychologist",
  "Counselling Psychologist",
];

export const CATEGORY_DESCRIPTIONS: Record<ProfessionalCategory, string> = {
  Psychiatrist:
    "Medical doctors specializing in mental health assessment, diagnosis, and treatment, including medication management where clinically appropriate.",
  "Clinical Psychologist":
    "Qualified mental health professionals specializing in psychological assessment and evidence-based psychological interventions.",
  "Counselling Psychologist":
    "Professionals supporting emotional wellbeing, stress management, relationships, and life challenges within their qualifications and professional scope.",
};

export const CATEGORY_CARD_COPY: {
  category: ProfessionalCategory;
  title: string;
  body: string;
}[] = [
  {
    category: "Psychiatrist",
    title: "Psychiatrists",
    body: "Explore medical professionals specializing in mental healthcare.",
  },
  {
    category: "Clinical Psychologist",
    title: "Clinical Psychologists",
    body: "Learn about professionals specializing in psychological assessment and therapy.",
  },
  {
    category: "Counselling Psychologist",
    title: "Counselling Psychologists",
    body: "Discover professionals focused on emotional wellbeing and life challenges.",
  },
];

/** Canonical language filter values for the directory. */
export const LANGUAGES = [
  "Kannada",
  "English",
  "Hindi",
  "Malayalam",
  "Tamil",
] as const;

/** Canonical specialization filter values for the directory. */
export const SPECIALIZATIONS = [
  "Anxiety",
  "Depression",
  "Stress Management",
  "Trauma",
  "Relationships",
  "Sleep Difficulties",
  "Workplace Burnout",
  "Emotional Wellbeing",
  "Life Transitions",
] as const;

export const DEMO_NOTICE =
  "Demonstration Directory: The profiles below are fictional examples created to preview Oppuna's upcoming professional directory. They do not represent actual practitioners or available services.";

export const WELLNESS_DISCLAIMER =
  "Oppuna provides AI-assisted mental wellness tools and informational resources. It does not replace professional medical advice, diagnosis, or treatment. If you are experiencing an emergency, contact local emergency services.";

export const PROFESSIONALS: Professional[] = [
  {
    id: "demo-ananya-rao",
    slug: "ananya-rao",
    name: "Dr. Ananya Rao",
    category: "Psychiatrist",
    languages: ["Kannada", "English"],
    specializations: [
      "Anxiety",
      "Depression",
      "Emotional Wellbeing",
      "Psychiatric Assessment",
    ],
    description:
      "An illustrative psychiatrist profile demonstrating how Oppuna may present professional information, areas of expertise, and language preferences.",
    biography:
      "This is a fictional demonstration profile. It illustrates how a psychiatrist's background, areas of focus, and language preferences could be presented in Oppuna's upcoming professional directory.",
    approach:
      "This fictional profile illustrates how a professional's approach to assessment and collaborative care planning could be described.",
    initials: "AR",
    isDemo: true,
    verificationStatus: "demo",
  },
  {
    id: "demo-meera-sharma",
    slug: "meera-sharma",
    name: "Meera Sharma",
    category: "Counselling Psychologist",
    languages: ["Hindi", "English"],
    specializations: [
      "Stress Management",
      "Relationships",
      "Emotional Wellbeing",
      "Life Transitions",
    ],
    description:
      "An illustrative counselling psychology profile highlighting emotional support, relationship concerns, and everyday life challenges.",
    biography:
      "This is a fictional demonstration profile. It illustrates how a counselling psychologist's background in emotional support and relationship concerns could be presented in Oppuna's upcoming professional directory.",
    approach:
      "This fictional profile illustrates how a supportive, conversation-based approach to everyday life challenges could be described.",
    initials: "MS",
    isDemo: true,
    verificationStatus: "demo",
  },
  {
    id: "demo-kavya-nair",
    slug: "kavya-nair",
    name: "Dr. Kavya Nair",
    category: "Clinical Psychologist",
    languages: ["Malayalam", "English"],
    specializations: [
      "Anxiety",
      "Trauma",
      "Emotional Wellbeing",
      "Cognitive Behavioural Therapy",
    ],
    description:
      "An illustrative clinical psychology profile showing how psychological specializations and therapeutic approaches may be presented.",
    biography:
      "This is a fictional demonstration profile. It illustrates how a clinical psychologist's specializations and therapeutic approaches could be presented in Oppuna's upcoming professional directory.",
    approach:
      "This fictional profile illustrates how an evidence-based approach, such as cognitive behavioural methods, could be described.",
    initials: "KN",
    isDemo: true,
    verificationStatus: "demo",
  },
  {
    id: "demo-arjun-desai",
    slug: "arjun-desai",
    name: "Arjun Desai",
    category: "Counselling Psychologist",
    languages: ["Kannada", "Hindi"],
    specializations: [
      "Workplace Burnout",
      "Stress Management",
      "Emotional Wellbeing",
      "Life Transitions",
    ],
    description:
      "An illustrative counselling psychology profile demonstrating professional discovery through language and specialization filters.",
    biography:
      "This is a fictional demonstration profile. It illustrates how a counselling psychologist focused on workplace stress and life transitions could be presented in Oppuna's upcoming professional directory.",
    approach:
      "This fictional profile illustrates how a practical, goal-oriented approach to work stress and burnout could be described.",
    initials: "AD",
    isDemo: true,
    verificationStatus: "demo",
  },
];

export function getProfessionalBySlug(slug: string): Professional | undefined {
  return PROFESSIONALS.find((profile) => profile.slug === slug);
}

export function professionalDetailPath(profile: Pick<Professional, "slug">) {
  return `/professionals/${profile.slug}`;
}
