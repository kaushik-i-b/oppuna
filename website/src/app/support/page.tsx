import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Smartphone } from "lucide-react";
import { GooglePlayButton } from "@/components/GooglePlayButton";
import { absoluteUrl, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Support",
  description: `Contact Oppuna support at ${siteConfig.supportEmail}.`,
  alternates: { canonical: absoluteUrl("/support") },
};

export default function SupportPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 md:px-8 md:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
        Support
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-sage-deep">
        We’re here for product questions
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        For help with Oppuna—install, features, export/delete, or privacy
        questions—email support. This channel is not a crisis or clinical
        service.
      </p>

      <div className="mt-10 space-y-4">
        <a
          href={`mailto:${siteConfig.supportEmail}`}
          className="flex items-start gap-4 rounded-3xl border border-line bg-surface p-6 transition hover:border-sage/40"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sage-soft text-sage-deep">
            <Mail className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-sage-deep">Email</span>
            <span className="mt-1 block text-muted">
              {siteConfig.supportEmail}
            </span>
          </span>
        </a>

        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-sage-soft text-sage-deep">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-sage-deep">Get the app</p>
              <p className="mt-1 font-mono text-sm text-muted">
                {siteConfig.packageName}
              </p>
              <div className="mt-4">
                <GooglePlayButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-line bg-sage-soft/35 p-6">
        <h2 className="font-display text-xl font-semibold text-sage-deep">
          Need urgent help?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Do not wait on email. In India you can dial{" "}
          <a href="tel:112" className="font-semibold text-sage-deep">
            112
          </a>
          , Tele-MANAS{" "}
          <a href="tel:14416" className="font-semibold text-sage-deep">
            14416
          </a>{" "}
          or{" "}
          <a href="tel:18008914416" className="font-semibold text-sage-deep">
            1800-89-14416
          </a>
          , or KIRAN{" "}
          <a href="tel:18005990019" className="font-semibold text-sage-deep">
            1800-599-0019
          </a>
          . See the{" "}
          <Link
            href="/#responsible-use"
            className="font-semibold text-sage-deep underline"
          >
            responsible-use
          </Link>{" "}
          section on the homepage for official sources.
        </p>
      </div>

      <p className="mt-10 text-sm text-muted">
        Also see{" "}
        <Link href="/privacy" className="font-semibold text-sage-deep underline">
          Privacy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-semibold text-sage-deep underline">
          Terms
        </Link>
        .
      </p>
    </div>
  );
}
