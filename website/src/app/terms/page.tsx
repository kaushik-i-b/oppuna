import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument } from "@/components/LegalDocument";
import { absoluteUrl, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for Oppuna, a private offline wellness companion for Android.",
  alternates: { canonical: absoluteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Use"
      updated={siteConfig.legal.lastUpdated}
      reviewNote="Adapted from docs/TERMS.md. Requires legal review before launch."
    >
      <p>
        Please read these terms carefully before using Oppuna. By downloading,
        installing, or using the app, you agree to them. If you do not agree, do
        not use the app.
      </p>

      <h2>1. What Oppuna is</h2>
      <p>
        Oppuna is a private, offline wellness and journaling companion with an
        on-device supportive companion plus safety-checked guided offline
        fallbacks.
      </p>

      <h2>2. On-device AI</h2>
      <p>
        Oppuna may use an on-device language model for conversational support.
        AI inference is intended to happen locally. Model outputs may be
        inaccurate and must not be treated as medical diagnosis, treatment,
        professional therapy, or emergency care. Safety systems may replace or
        override model responses.
      </p>

      <h2>3. Not a medical or emergency service</h2>
      <p>
        Oppuna is not a doctor, therapist, counselor, crisis service, or medical
        device. If you are in danger or thinking about harming yourself or
        others, contact local emergency services immediately.
      </p>

      <h2>4. Your responsibilities</h2>
      <ul>
        <li>Use Oppuna for personal wellbeing and self-reflection only.</li>
        <li>Seek qualified professional help when you need it.</li>
        <li>
          Do not rely on the app for medical, legal, or emergency decisions.
        </li>
      </ul>

      <h2>5. Your data is on your device</h2>
      <p>
        Oppuna stores reflective content on your device and does not transmit it
        through Oppuna servers. You are responsible for backups via Settings →
        Export. Deleting data or uninstalling is permanent. See the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>6. No warranty</h2>
      <p>
        Oppuna is provided “as is” and “as available,” without warranties of any
        kind.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the developer of Oppuna is not
        liable for loss arising from use of the app, including loss of data
        stored on your device.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions:{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>
        . You may also use the{" "}
        <a
          href={siteConfig.googlePlayUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Play listing
        </a>{" "}
        contact channel.
      </p>
    </LegalDocument>
  );
}
