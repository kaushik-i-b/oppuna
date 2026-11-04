import { Agents } from "@/components/labs/Agents";
import { Contact } from "@/components/labs/Contact";
import { DirectoryPreview } from "@/components/labs/DirectoryPreview";
import { Engineering } from "@/components/labs/Engineering";
import { Hero } from "@/components/labs/Hero";
import { Problems } from "@/components/labs/Problems";
import { Process } from "@/components/labs/Process";
import { Products } from "@/components/labs/Products";
import { Security } from "@/components/labs/Security";
import { Why } from "@/components/labs/Why";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problems />
      <Agents />
      <Process />
      <Engineering />
      <Security />
      <Products />
      <DirectoryPreview />
      <Why />
      <Contact />
    </>
  );
}
