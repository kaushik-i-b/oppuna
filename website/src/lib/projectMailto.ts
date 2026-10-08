type ProjectInquiry = {
  to: string;
  name: string;
  email: string;
  company: string;
  scope: string;
  details: string;
};

/** Builds a mailto URL. The static site has no form backend. */
export function buildProjectMailto(input: ProjectInquiry): string {
  const body = [
    `Name: ${input.name}`,
    `Work email: ${input.email}`,
    `Company: ${input.company || "(not provided)"}`,
    `Approximate project scope: ${input.scope}`,
    "",
    "What are you trying to build or automate?",
    input.details,
  ].join("\n");

  const subject = "Oppuna Labs — project discussion";
  return `mailto:${input.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
