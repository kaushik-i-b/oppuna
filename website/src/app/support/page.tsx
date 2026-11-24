import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Mail, Smartphone } from "lucide-react";
import { GooglePlayButton } from "@/components/GooglePlayButton";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = pageMetadata({
  title: "Support | Oppuna",
  description: `Get help with the Oppuna app: installation, features, data export and deletion, and privacy questions. Email ${siteConfig.supportEmail}.`,
  path: "/support",
});

export default function SupportPage() {
  return (
    <div className="wrap py-14 md:py-20">
      <div className="grid gap-12 lg:grid-cols-12">
        <header className="lg:col-span-5">
          <p className="eyebrow">Oppuna app · Support</p>
          <h1 className="mt-5 text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.1]">
            Help with the
            <br />
            Oppuna app
          </h1>
          <p className="mt-5 text-muted">
            For help with installing Oppuna, its features, exporting or
            deleting your data, or privacy questions, email support. This
            channel is not a crisis or clinical service.
          </p>
        </header>

        <div className="lg:col-span-6 lg:col-start-7">
          <dl className="border-t border-foreground">
            <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <Mail className="size-4" aria-hidden />
                Email
              </dt>
              <dd>
                <a
                  className="link font-display text-lg font-semibold"
                  href={`mailto:${siteConfig.supportEmail}`}
                >
                  {siteConfig.supportEmail}
                </a>
              </dd>
            </div>
            <div className="grid gap-2 border-b border-line py-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
              <dt className="flex items-center gap-2 text-sm text-muted">
                <Smartphone className="size-4" aria-hidden />
                Get the app
              </dt>
              <dd>
                <p className="font-mono text-sm text-muted">
                  {siteConfig.packageName}
                </p>
                <div className="mt-4">
                  <GooglePlayButton />
                </div>
              </dd>
            </div>
          </dl>

          <section
            aria-labelledby="urgent-heading"
            className="mt-10 border-l-2 border-accent bg-surface p-6"
          >
            <h2 id="urgent-heading" className="text-xl">
              Need urgent help?
            </h2>
            <p className="mt-2 text-muted">
              Do not wait on email. In India you can dial{" "}
              <a href="tel:112" className="link font-semibold">
                112
              </a>
              , Tele-MANAS{" "}
              <a href="tel:14416" className="link font-semibold">
                14416
              </a>{" "}
              or{" "}
              <a href="tel:18008914416" className="link font-semibold">
                1800-89-14416
              </a>
              , or KIRAN{" "}
              <a href="tel:18005990019" className="link font-semibold">
                1800-599-0019
              </a>
              . The{" "}
              <Link href="/oppuna#responsible-use" className="link">
                responsible-use section
              </Link>{" "}
              of the Oppuna page lists official sources.
            </p>
          </section>

          <p className="mt-10 text-muted">
            Also see the{" "}
            <Link href="/privacy" className="link">
              privacy policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="link">
              terms of use
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
