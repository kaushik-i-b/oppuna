import { siteConfig } from "@/config/site";
import { ContactForm } from "./ContactForm";

export function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-line"
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <p className="eyebrow">Contact</p>
          <h2 id="contact-heading" className="section-title mt-3">
            Have a business problem that AI could solve?
          </h2>
          <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
            <p>
              Tell us about the workflow, bottleneck or product you want to
              build.
            </p>
            <p>
              We’ll help determine whether AI is actually the right solution —
              and if it is, how to take it into production.
            </p>
          </div>
          <p className="mt-8 text-sm text-muted">Email</p>
          <a
            className="mt-1 inline-block text-lg link"
            href={`mailto:${siteConfig.supportEmail}`}
          >
            {siteConfig.supportEmail}
          </a>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
