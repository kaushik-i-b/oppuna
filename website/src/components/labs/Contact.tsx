import { assetUrl } from "@/config/paths";
import { siteConfig } from "@/config/site";
import { ContactForm } from "./ContactForm";

export function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-16 bg-surface"
      aria-labelledby="contact-heading"
    >
      <div className="wrap grid gap-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow">Contact</p>
          <h2 id="contact-heading" className="section-title mt-5">
            Tell us what
            <br />
            you want to build.
          </h2>
          <p className="mt-6 text-muted">
            Describe the workflow, the bottleneck or the product idea. We will
            reply with questions, an honest view of whether AI is the right
            tool, and a suggested first step.
          </p>
          <div className="mt-10 border-t border-line pt-5">
            <p className="label-mono">Email</p>
            <a
              className="link mt-1 inline-block font-display text-xl font-semibold"
              href={`mailto:${siteConfig.supportEmail}`}
            >
              {siteConfig.supportEmail}
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">
            Looking for help with the Oppuna app?{" "}
            <a className="link" href={assetUrl("/support/")}>
              Go to app support
            </a>
            .
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
