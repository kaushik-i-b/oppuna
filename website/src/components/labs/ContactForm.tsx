"use client";

import { FormEvent, useState } from "react";
import { siteConfig } from "@/config/site";
import { buildProjectMailto } from "@/lib/projectMailto";

const scopes = [
  "Proof of concept",
  "Production system",
  "Existing AI system improvement",
  "Not sure yet",
] as const;

export function ContactForm() {
  const [status, setStatus] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const details = String(data.get("details") ?? "").trim();
    const scope = String(data.get("scope") ?? "").trim();

    const href = buildProjectMailto({
      to: siteConfig.supportEmail,
      name,
      email,
      company,
      scope,
      details,
    });

    setStatus(
      `Your email app should open with this message addressed to ${siteConfig.supportEmail}. Nothing is sent until you send that email.`,
    );
    window.location.href = href;
  }

  return (
    <form className="card md:p-8" onSubmit={onSubmit} aria-describedby="form-note">
      <div className="form-grid">
        <div className="field">
          <label className="field-label" htmlFor="name">
            Name
          </label>
          <input
            className="control"
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="email">
            Work email
          </label>
          <input
            className="control"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="company">
            Company
          </label>
          <input
            className="control"
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="scope">
            Approximate project scope
          </label>
          <select className="control" id="scope" name="scope" required defaultValue="">
            <option value="" disabled>
              Select a scope
            </option>
            {scopes.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>
        <div className="field form-span">
          <label className="field-label" htmlFor="details">
            What are you trying to build or automate?
          </label>
          <textarea
            className="control"
            id="details"
            name="details"
            required
          />
        </div>
      </div>

      <p id="form-note" className="mt-5 text-sm leading-relaxed text-muted">
        This form does not submit to a server. It opens an email to{" "}
        <a className="link" href={`mailto:${siteConfig.supportEmail}`}>
          {siteConfig.supportEmail}
        </a>{" "}
        with the details you entered.
      </p>

      <button className="btn btn-primary mt-5" type="submit">
        Discuss Your Project
      </button>

      <p className="mt-4 min-h-6 text-sm leading-relaxed text-sage" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
