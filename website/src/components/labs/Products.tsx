import Link from "next/link";
import { siteConfig } from "@/config/site";
import { BrandImage } from "../BrandImage";
import { Section } from "./Section";

export function Products() {
  return (
    <Section
      id="products"
      eyebrow="Products"
      headingId="products-heading"
      title="We build our own AI products too."
      intro={
        <p>
          Oppuna is an example of the team designing and shipping an
          end-to-end AI product.
        </p>
      }
    >
      <article className="card grid items-center gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]">
        <div>
          <p className="eyebrow">Oppuna</p>
          <h3 className="mt-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl">
            Private AI-powered mental wellness and journaling.
          </h3>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {siteConfig.productDescription}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn btn-primary" href={siteConfig.productPath}>
              Explore Oppuna
            </Link>
            <a
              className="btn btn-secondary"
              href={siteConfig.googlePlayUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Google Play
            </a>
          </div>
        </div>
        <BrandImage
          path="/brand/feature-image.png"
          alt="Oppuna brand image: a leaf mark with the line Private mental wellness support"
          width={1024}
          height={500}
          className="h-auto w-full rounded-2xl border border-line"
        />
      </article>
    </Section>
  );
}
