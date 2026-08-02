import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { absoluteUrl, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Oppuna privacy policy: no account, no cloud sync, local storage, and offline-first design.",
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated={siteConfig.legal.lastUpdated}
    >
      <p>
        Oppuna is built around a single promise:{" "}
        <strong>your private thoughts stay private, on your device.</strong>
      </p>

      <h2>What we collect</h2>
      <p>
        Oppuna has no account system for end users, no Oppuna-operated backend
        that receives your journals or chats, and no advertising or analytics
        SDKs that phone home from the production app. The developers do not
        receive your reflective content through the app.
      </p>

      <h2>What is stored, and where</h2>
      <p>
        Everything you create in Oppuna is stored in the app’s local storage on
        your device, including conversations, mood check-ins, journal entries,
        breathing history, voice notes, preferences, and limited safety-event
        metadata (category and time—not the triggering message).
      </p>
      <p>
        This content is not uploaded, synced, or shared with third parties by
        the app. Your operating system may still offer device-level backups
        outside Oppuna’s control.
      </p>

      <h2>No network access in production</h2>
      <p>
        Oppuna is designed to work in airplane mode. Production builds include a
        network guard and block Android <code>INTERNET</code> permission so the
        app cannot make outbound internet requests.
      </p>

      <h2>On-device AI</h2>
      <p>
        Conversational features may use a language model that runs on your
        device. Inference is intended to happen locally. Guided offline support
        may be used when the model is unavailable. Your chats are not sent to a
        cloud AI service by the Oppuna app for remote processing.
      </p>

      <h2>Microphone</h2>
      <p>
        If you choose to record a voice note, the app uses your microphone.
        Recordings are saved locally and are not transmitted by the app.
      </p>

      <h2>Your control</h2>
      <ul>
        <li>
          <strong>Export:</strong> Create a JSON copy of your data on the
          device.
        </li>
        <li>
          <strong>Delete:</strong> Permanently erase app data from Settings →
          Delete all data.
        </li>
        <li>
          <strong>App lock:</strong> Optionally protect opening the app with
          biometrics or PIN.
        </li>
      </ul>

      <h2>Not a medical service</h2>
      <p>
        Oppuna supports everyday emotional wellness and self-reflection. It is
        not a doctor, therapist, crisis service, or medical device. It does not
        diagnose, treat, or replace professional care. If you are in danger or
        need medical help, contact local emergency services immediately.
      </p>

      <h2>Contact</h2>
      <p>
        Questions:{" "}
        <a href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>
        .
      </p>
    </LegalDocument>
  );
}
