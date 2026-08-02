type Props = {
  className?: string;
  caption?: string;
};

/** Phone frame with the Oppuna Living Leaf mark (splash-icon.png is bg-only). */
export function PhoneMockup({
  className = "",
  caption = "Oppuna splash — Living Leaf brand mark from the Android app",
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
          <svg
            className="size-28 drop-shadow-lg"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Oppuna leaf logo"
          >
            <defs>
              <linearGradient
                id="oppunaLeafGrad"
                x1="30"
                y1="6"
                x2="70"
                y2="94"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#e8f2ec" stopOpacity="0.92" />
              </linearGradient>
            </defs>
            <path
              d="M50 5 C 30 26, 20 52, 27 78 C 31 90, 42 95, 50 95 C 58 95, 69 90, 73 78 C 80 52, 70 26, 50 5 Z"
              fill="url(#oppunaLeafGrad)"
            />
            <g
              stroke="#3D6B5A"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.9"
              fill="none"
            >
              <path d="M50 16 L50 88" />
              <path d="M50 34 C 42 36, 37 40, 34 47" />
              <path d="M50 34 C 58 36, 63 40, 66 47" />
              <path d="M50 50 C 43 52, 38 56, 36 63" />
              <path d="M50 50 C 57 52, 62 56, 64 63" />
              <path d="M50 66 C 45 68, 42 71, 41 76" />
              <path d="M50 66 C 55 68, 58 71, 59 76" />
            </g>
            <g fill="#3D6B5A">
              <path d="M50 4 C 46 9, 46 14, 50 18 C 54 14, 54 9, 50 4 Z" />
              <path
                d="M44 8 C 43 13, 45 17, 49 19 C 48 14, 47 10, 44 8 Z"
                opacity="0.75"
              />
              <path
                d="M56 8 C 57 13, 55 17, 51 19 C 52 14, 53 10, 56 8 Z"
                opacity="0.75"
              />
            </g>
          </svg>
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
