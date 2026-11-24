import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { pageMetadata } from "@/lib/seo";
import { About } from "@/components/labs/About";
import { Contact } from "@/components/labs/Contact";
import { Hero } from "@/components/labs/Hero";
import { Process } from "@/components/labs/Process";
import { ProductShowcase } from "@/components/labs/ProductShowcase";
import { Services } from "@/components/labs/Services";

export const metadata: Metadata = pageMetadata({
  title: siteConfig.homeTitle,
  description: siteConfig.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProductShowcase />
      <Services />
      <Process />
      <About />
      <Contact />
    </>
  );
}
