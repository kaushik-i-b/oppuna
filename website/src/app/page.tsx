import { Agents } from "@/components/sections/Agents";
import { Contact } from "@/components/sections/Contact";
import { Engineering } from "@/components/sections/Engineering";
import { Hero } from "@/components/sections/Hero";
import { HowWeWork } from "@/components/sections/HowWeWork";
import { Products } from "@/components/sections/Products";
import { Security } from "@/components/sections/Security";
import { Solutions } from "@/components/sections/Solutions";
import { WhyUs } from "@/components/sections/WhyUs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Solutions />
      <Agents />
      <HowWeWork />
      <Engineering />
      <Security />
      <Products />
      <WhyUs />
      <Contact />
    </>
  );
}
