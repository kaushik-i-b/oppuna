/**
 * Professional directory data.
 *
 * Sample records are fictional demonstration profiles. They must stay
 * `isDemo: true` and `verificationStatus: "demo"`, with no credentials.
 * Real professionals can replace this module later without changing
 * the presentation components.
 *
 * UI copy for the directory lives in `@/content/directory` so additional
 * locales can be added after review. This file is English source data
 * for the preview profiles only.
 */

export const professionalCategories = [
  "psychiatrist",
  "clinical-psychologist",
  "counselling-psychologist",
] as const;

export type ProfessionalCategory = (typeof professionalCategories)[number];

export const directoryLanguages = [
  "Kannada",
  "English",
  "Hindi",
  "Malayalam",
  "Tamil",
] as const;

export type DirectoryLanguage = (typeof directoryLanguages)[number];

export const focusAreaIds = [
  "anxiety",
  "depression",
  "emotional-wellbeing",
  "psychiatric-assessment",
  "stress",
  "relationships",
  "life-transitions",
  "trauma",
  "cbt",
  "emotional-regulation",
  "workplace-stress",
  "burnout",
  "sleep",
] as const;

export type FocusAreaId = (typeof focusAreaIds)[number];

export type FocusArea = {
  id: FocusAreaId;
  label: string;
};

export const specializationFilters = [
  { id: "anxiety", label: "Anxiety", matches: ["anxiety"] },
  { id: "depression", label: "Depression", matches: ["depression"] },
  {
    id: "stress-management",
    label: "Stress Management",
    matches: ["stress", "workplace-stress"],
  },
  { id: "trauma", label: "Trauma", matches: ["trauma"] },
  { id: "relationships", label: "Relationships", matches: ["relationships"] },
  { id: "sleep", label: "Sleep Difficulties", matches: ["sleep"] },
  {
    id: "workplace-burnout",
    label: "Workplace Burnout",
    matches: ["burnout", "workplace-stress"],
  },
  {
    id: "emotional-wellbeing",
    label: "Emotional Wellbeing",
    matches: ["emotional-wellbeing"],
  },
  {
    id: "life-transitions",
    label: "Life Transitions",
    matches: ["life-transitions"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  matches: readonly FocusAreaId[];
}[];

export type SpecializationFilterId =
  (typeof specializationFilters)[number]["id"];

export type VerificationStatus = "demo" | "pending" | "verified";

/**
 * Reserved for a future verification workflow.
 * Do not populate this for demonstration profiles.
 */
export type ProfessionalCredentials = {
  qualifications: readonly string[];
  registrations: readonly {
    body: string;
    number: string;
  }[];
};

export type ProfessionalAvatar = "orbit" | "grove" | "tide" | "lattice";

export type Professional = {
  id: string;
  slug: string;
  name: string;
  category: ProfessionalCategory;
  languages: readonly DirectoryLanguage[];
  focusAreas: readonly FocusArea[];
  description: string;
  biography: string;
  approach: string;
  /** Abstract illustration. Never a photograph of a person. */
  avatar: ProfessionalAvatar;
  isDemo: boolean;
  verificationStatus: VerificationStatus;
  credentials?: ProfessionalCredentials;
};

export const categoryLabels: Record<ProfessionalCategory, string> = {
  psychiatrist: "Psychiatrist",
  "clinical-psychologist": "Clinical Psychologist",
  "counselling-psychologist": "Counselling Psychologist",
};

export const categoryFilterLabels: Record<ProfessionalCategory, string> = {
  psychiatrist: "Psychiatrists",
  "clinical-psychologist": "Clinical Psychologists",
  "counselling-psychologist": "Counselling Psychologists",
};

export const professionals: readonly Professional[] = [
  {
    id: "demo-ananya-rao",
    slug: "dr-ananya-rao",
    name: "Dr. Ananya Rao",
    category: "psychiatrist",
    languages: ["Kannada", "English"],
    focusAreas: [
      { id: "anxiety", label: "Anxiety" },
      { id: "depression", label: "Depression" },
      { id: "emotional-wellbeing", label: "Emotional wellbeing" },
      { id: "psychiatric-assessment", label: "Psychiatric assessment" },
    ],
    description:
      "An illustrative psychiatrist profile demonstrating how Oppuna may present professional information, areas of expertise, and language preferences.",
    biography:
      "This page is a fictional preview of how Oppuna may describe a psychiatrist. Dr. Ananya Rao is not a real person, is not licensed through Oppuna, and is not available for consultation.",
    approach:
      "A future verified psychiatrist profile could explain, in general terms, that psychiatric care may include assessment and a discussion of treatment options, including medication where a licensed doctor considers it appropriate. This demonstration does not describe a real clinical method.",
    avatar: "orbit",
    isDemo: true,
    verificationStatus: "demo",
  },
  {
    id: "demo-meera-sharma",
    slug: "meera-sharma",
    name: "Meera Sharma",
    category: "counselling-psychologist",
    languages: ["Hindi", "English"],
    focusAreas: [
      { id: "stress", label: "Stress" },
      { id: "relationships", label: "Relationships" },
      { id: "emotional-wellbeing", label: "Emotional wellbeing" },
      { id: "life-transitions", label: "Life transitions" },
    ],
    description:
      "An illustrative counselling psychology profile highlighting emotional support, relationship concerns, and everyday life challenges.",
    biography:
      "This page is a fictional preview of a counselling psychologist profile. Meera Sharma is not a real practitioner and is not offering sessions through Oppuna.",
    approach:
      "A future verified counselling profile could describe support for stress, relationships, and life changes within that professional’s qualifications. This example does not claim a registration, a workplace, or a result.",
    avatar: "grove",
    isDemo: true,
    verificationStatus: "demo",
  },
  {
    id: "demo-kavya-nair",
    slug: "dr-kavya-nair",
    name: "Dr. Kavya Nair",
    category: "clinical-psychologist",
    languages: ["Malayalam", "English"],
    focusAreas: [
      { id: "anxiety", label: "Anxiety" },
      { id: "trauma", label: "Trauma" },
      { id: "cbt", label: "Cognitive Behavioural Therapy" },
      { id: "emotional-regulation", label: "Emotional regulation" },
    ],
    description:
      "An illustrative clinical psychology profile showing how psychological specializations and therapeutic approaches may be presented.",
    biography:
      "This page is a fictional preview of a clinical psychologist profile. Dr. Kavya Nair is not a real practitioner and is not providing psychological assessment or therapy through Oppuna.",
    approach:
      "A future verified clinical psychology profile could name approaches such as cognitive behavioural therapy only after that practitioner’s training is confirmed. The focus areas on this page are sample labels, not evidence of a credential.",
    avatar: "tide",
    isDemo: true,
    verificationStatus: "demo",
  },
  {
    id: "demo-arjun-desai",
    slug: "arjun-desai",
    name: "Arjun Desai",
    category: "counselling-psychologist",
    languages: ["Kannada", "Hindi"],
    focusAreas: [
      { id: "workplace-stress", label: "Workplace stress" },
      { id: "burnout", label: "Burnout" },
      { id: "emotional-wellbeing", label: "Emotional wellbeing" },
      { id: "life-transitions", label: "Life transitions" },
    ],
    description:
      "An illustrative counselling psychology profile demonstrating professional discovery through language and specialization filters.",
    biography:
      "This page is a fictional preview of how language and workplace-stress focus areas could help someone browse the directory. Arjun Desai is not a real practitioner and is not accepting clients.",
    approach:
      "A future verified counselling profile could discuss workplace stress and burnout as areas of support. This demonstration does not state availability, fees, or outcomes.",
    avatar: "lattice",
    isDemo: true,
    verificationStatus: "demo",
  },
];

/**
 * A public verification badge is allowed only after a real review.
 * Demonstration records never qualify, even if a credentials object is added by mistake.
 */
export function isPubliclyVerified(profile: Professional): boolean {
  return (
    profile.isDemo === false &&
    profile.verificationStatus === "verified" &&
    profile.credentials !== undefined &&
    profile.credentials.registrations.length > 0 &&
    profile.credentials.qualifications.length > 0
  );
}

export function getProfessionalBySlug(slug: string): Professional | undefined {
  return professionals.find((profile) => profile.slug === slug);
}

function assertDemoDirectory(records: readonly Professional[]): void {
  const slugs = new Set<string>();
  for (const profile of records) {
    if (slugs.has(profile.slug)) {
      throw new Error(`Duplicate professional slug: ${profile.slug}`);
    }
    slugs.add(profile.slug);
    if (!profile.isDemo || profile.verificationStatus !== "demo") {
      throw new Error(
        `${profile.id} must stay a demonstration profile until a real verification workflow exists.`,
      );
    }
    if (profile.credentials) {
      throw new Error(
        `${profile.id} must not include qualifications or registration numbers.`,
      );
    }
    if (isPubliclyVerified(profile)) {
      throw new Error(`${profile.id} cannot be presented as verified.`);
    }
  }
}

assertDemoDirectory(professionals);
