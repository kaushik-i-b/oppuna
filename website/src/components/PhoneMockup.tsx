import Image from "next/image";

type Props = {
  className?: string;
  caption?: string;
};

/** Phone frame with authentic Oppuna splash mark — no fabricated UI. */
export function PhoneMockup({
  className = "",
  caption = "Oppuna splash — authentic brand mark from the Android app",
}: Props) {
  return (
    <figure className={`mx-auto w-full max-w-[280px] ${className}`}>
      <div
        className="relative mx-auto aspect-[9/19] w-full overflow-hidden rounded-[2.25rem] border-[10px] border-[#1c2420] bg-sage shadow-[0_28px_60px_-24px_rgba(28,36,32,0.45)]"
        aria-hidden="true"
      >
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2">
          <div className="h-5 w-24 rounded-full bg-black/35" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#4a8570] via-sage to-sage-deep" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center text-white">
          <Image
            src="/brand/splash-icon.png"
            alt=""
            width={128}
            height={128}
            className="size-24 object-contain drop-shadow-lg"
            priority
          />
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight">
              Oppuna
            </p>
            <p className="mt-2 text-sm text-white/85">
              Private AI for your thoughts
            </p>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
