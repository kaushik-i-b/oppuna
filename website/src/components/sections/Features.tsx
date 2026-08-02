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
  description: string;
  benefit: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "Daily wellness plan",
    description:
      "A gentle plan shaped around your mood, goals, and available time.",
    benefit: "One clear next step instead of figuring it out alone.",
  },
  {
    icon: HeartPulse,
    title: "Mood check-ins & insights",
    description: "Log how you feel, note intensity, and review weekly patterns.",
    benefit: "Notice trends so stressful days feel more understandable.",
  },
  {
    icon: BookOpen,
    title: "Private journaling",
    description:
      "Daily notes, gratitude, thought records, and free-form writing—searchable and deletable.",
    benefit: "CBT-inspired prompts without needing a blank page.",
  },
  {
    icon: Brain,
    title: "Supportive on-device companion",
    description:
      "Chat with a companion that can run on your device, with guided support if the model is unavailable.",
    benefit: "Talk through everyday stress without sending chats to the cloud.",
  },
  {
    icon: Wind,
    title: "Breathing & grounding",
    description:
      "Guided breathing sessions and a 5-4-3-2-1 senses exercise from your plan.",
    benefit: "Short body-based practices when thoughts feel loud.",
  },
  {
    icon: Moon,
    title: "Sleep wind-down",
    description:
      "An evening checklist with gentle spoken guidance on your device.",
    benefit: "Close the day with a short, repeatable routine.",
  },
  {
    icon: Lock,
    title: "Privacy controls",
    description:
      "No account. Optional app lock, export, and delete-all in Settings.",
    benefit: "Keep a local backup—or erase everything—on your terms.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sage">
          Features
        </p>
        <h2
          id="features-heading"
          className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-sage-deep md:text-4xl"
        >
          Tools that are actually in the app
        </h2>
        <p className="mt-3 max-w-2xl text-lg text-muted">
          Every item below maps to a screen you can open in Oppuna today.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="rounded-3xl border border-line bg-surface p-5 md:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage-soft text-sage-deep">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-sage-deep">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-muted">
                      {feature.description}
                    </p>
                    <p className="mt-2 text-sm font-medium text-sage-deep">
                      {feature.benefit}
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
