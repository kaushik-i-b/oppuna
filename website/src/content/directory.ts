/**
 * English copy for the professional directory.
 *
 * The site does not yet have a locale router. Keep new interface strings in
 * this module so Kannada, Hindi, Malayalam, and Tamil can be added later.
 * Do not ship unreviewed clinical translations as professionally validated copy.
 */

export const directoryLocale = "en" as const;

export const directoryCopy = {
  previewLabel: "Professional Directory Preview",
  pageHeading: "Find the Right Mental Health Professional",
  heroTitle: "Professional Mental Health Support",
  subtitle:
    "Explore mental health professionals by specialization, language, and area of support.",
  heroDescription:
    "Discover professionals specializing in emotional wellbeing, psychological support, and psychiatric care.",
  heroSecondary:
    "Oppuna is preparing a directory to help people discover qualified mental health professionals.",
  positioning:
    "Everyday AI-powered mental wellness support, with professional-care discovery planned for the future.",
  categoriesHeading: "Professional categories",
  categoriesIntro:
    "These roles are not interchangeable. A psychiatrist, a clinical psychologist, and a counselling psychologist have different training and different scopes of practice. Qualifications, registration, and scope must be verified before Oppuna lists a real professional.",
  categories: {
    psychiatrist: {
      title: "Psychiatrists",
      summary:
        "Medical doctors specializing in mental health assessment, diagnosis, and treatment, including medication management where clinically appropriate.",
      homeSummary:
        "Explore medical professionals specializing in mental healthcare.",
    },
    "clinical-psychologist": {
      title: "Clinical Psychologists",
      summary:
        "Qualified mental health professionals specializing in psychological assessment and evidence-based psychological interventions.",
      homeSummary:
        "Learn about professionals specializing in psychological assessment and therapy.",
    },
    "counselling-psychologist": {
      title: "Counselling Psychologists",
      summary:
        "Professionals supporting emotional wellbeing, stress management, relationships, and life challenges within their qualifications and professional scope.",
      homeSummary:
        "Discover professionals focused on emotional wellbeing and life challenges.",
    },
  },
  homeHeading: "Explore Professional Mental Health Support",
  homeDescription:
    "Oppuna is expanding its vision of accessible mental wellness through a future directory of qualified mental health professionals.",
  exploreDirectory: "Explore Directory",
  searchLabel: "Search professionals",
  searchHint:
    "Search by professional name, category, specialization, language, or area of support.",
  searchPlaceholder: "Name, language, or area of support",
  categoryLegend: "Professional category",
  allProfessionals: "All Professionals",
  languageLegend: "Language",
  allLanguages: "All Languages",
  specializationLegend: "Area of support",
  specializationHint:
    "Select one or more. A profile is shown only when it matches every selected area.",
  clearFilters: "Clear filters",
  demoNotice:
    "Demonstration Directory: The profiles below are fictional examples created to preview Oppuna’s upcoming professional directory. They do not represent actual practitioners or available services.",
  demoBadge: "Demo Profile",
  viewProfile: "View Profile",
  viewProfileOf: "View demonstration profile for",
  resultsLabel: "demonstration profiles",
  resultLabel: "demonstration profile",
  emptyTitle: "No demonstration profiles match",
  emptyBody:
    "No fictional preview profiles match this search or these filters. Try another category, language, or area of support.",
  backToDirectory: "Back to directory",
  languagesLabel: "Languages",
  focusLabel: "Areas of focus",
  biographyLabel: "Biography",
  approachLabel: "Professional approach",
  statusLabel: "Demonstration status",
  statusBody:
    "This is a fictional demonstration profile. It is not a verified professional, and it does not offer appointments or services through Oppuna.",
  profileFiction:
    "All information on this page is fictional and is shown only to preview the directory layout.",
  privacyNote:
    "Professionals in this directory cannot see Oppuna conversations, journals, or mood entries. The directory does not collect health information and does not book appointments.",
  disclaimer:
    "Oppuna provides AI-assisted mental wellness tools and informational resources. It does not replace professional medical advice, diagnosis, or treatment. If you are experiencing an emergency, contact local emergency services.",
  indiaResourcesLead:
    "In India, emergency and mental-health support resources include:",
  noAvailability:
    "This directory does not show who is online, who is accepting clients, or who can respond immediately.",
} as const;
