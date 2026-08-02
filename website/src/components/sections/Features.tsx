import {
  BookOpen,
  Brain,
  HeartPulse,
  Lock,
  Moon,
  Sparkles,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  what: string;
  why: string;
  experience: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Daily wellness plan",
    what: "A gentle plan shaped around your mood, goals, and available time.",
    why: "Makes it easier to take one small step instead of figuring everything out alone.",
    experience: "See today’s activities, track progress, and open tools when you are ready.",
  },
  {
    icon: HeartPulse,
    title: "Mood check-ins & insights",
    what: "Log how you feel, note intensity, and review weekly patterns.",
    why: "Naming emotions and noticing trends can make stressful days feel more understandable.",
    experience: "Quick check-ins on Home, history when you want detail, and a calm insights view.",
  },
  {
    icon: BookOpen,
    title: "Private journaling",
    what: "Daily notes, gratitude, thought records, trigger reflections, and free-form writing.",
    why: "CBT-inspired prompts help you examine thoughts without needing a blank page.",
    experience: "Search, edit, and delete entries whenever you like—everything stays local.",
  },
  {
    icon: Brain,
    title: "Supportive AI companion",
    what: "Chat with a companion that can run on your device, with guided support if the model is unavailable.",
    why: "A low-pressure place to talk through everyday stress in your own words.",
    experience: "Open Chat for a conversation at your pace—never routed through a cloud AI service by the app.",
  },
  {
    icon: Wind,
    title: "Breathing & grounding",
    what: "Guided breathing sessions and a 5-4-3-2-1 senses exercise.",
    why: "Short body-based practices can help when thoughts feel loud.",
    experience: "Reach these tools from your plan (and breathing from crisis support when needed).",
  },
  {
    icon: Moon,
    title: "Sleep wind-down",
    what: "A simple evening checklist with gentle spoken guidance on your device.",
    why: "Helps you close the day with a short, repeatable routine.",
    experience: "Follow the checklist and listen at a pace that suits you.",
  },
  {
    icon: Lock,
    title: "Privacy-conscious by design",
    what: "No account to create. App lock, export, and delete-all controls in Settings.",
    why: "Vulnerable thoughts deserve a space that does not ask you to trust a cloud first.",
    experience: "Use Oppuna offline; keep a local export if you want a backup you control.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          Features
        </p>
        <h2
          id="features-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Tools that are actually in the app
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Every item below maps to a screen you can open today in Oppuna—not a
          roadmap slide.
        </p>

        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgba(28,36,32,0.03)] md:p-7"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-sage-deep">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-sage-deep">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                      <span className="font-medium text-sage-deep">What: </span>
                      {feature.what}
                    </p>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                      <span className="font-medium text-sage-deep">Why: </span>
                      {feature.why}
                    </p>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
                      <span className="font-medium text-sage-deep">
                        You experience:{" "}
                      </span>
                      {feature.experience}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
