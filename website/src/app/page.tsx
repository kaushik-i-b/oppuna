import { FAQ } from "@/components/sections/FAQ";
import { Features } from "@/components/sections/Features";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PrivacySection } from "@/components/sections/Privacy";
import { Purpose } from "@/components/sections/Purpose";
import { ResponsibleUse } from "@/components/sections/ResponsibleUse";
import { WhoFor } from "@/components/sections/WhoFor";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Purpose />
      <Features />
      <HowItWorks />
      <PrivacySection />
      <WhoFor />
      <ResponsibleUse />
      <FAQ />
      <FinalCTA />
    </>
  );
}
