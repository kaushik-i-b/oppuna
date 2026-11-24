const tabs = ["Home", "Plan", "Journal", "Chat", "Profile"];

/**
 * Illustrative HTML preview of the Oppuna journal screen.
 * The repository has no real device captures (the Play images are
 * generated mockups), so this is always captioned as illustrative.
 */
export function PhonePreview() {
  return (
    <figure className="mx-auto w-full max-w-[19rem]">
      <div
        className="border border-line-strong bg-[#0d0f15] p-2.5"
        aria-hidden="true"
      >
        <div className="bg-[#f6f7f9] text-[#17191f]">
          <div className="flex items-center justify-between px-4 pt-3 font-mono text-[0.625rem] text-[#6b7180]">
            <span>9:41</span>
            <span>Offline</span>
          </div>
          <div className="px-4 pb-4 pt-5">
            <p className="font-display text-xl font-semibold">Journal</p>
            <p className="mt-0.5 text-xs text-[#555b68]">Stored on this device</p>

            <div className="mt-4 border border-[#d5d9e2] bg-white p-3">
              <p className="text-[0.8125rem] text-[#555b68]">
                What is on your mind today?
              </p>
              <div className="mt-3 h-1.5 w-11/12 bg-[#e6e9ef]" />
              <div className="mt-1.5 h-1.5 w-3/4 bg-[#e6e9ef]" />
            </div>

            <ul className="mt-3 space-y-2">
              {[
                ["Gratitude", "Today"],
                ["Thought record", "Yesterday"],
                ["Daily", "Mon"],
              ].map(([kind, when]) => (
                <li
                  key={kind}
                  className="flex items-center justify-between border border-[#e0e3eb] bg-white px-3 py-2.5"
                >
                  <span className="text-[0.8125rem] font-semibold">{kind}</span>
                  <span className="text-[0.6875rem] text-[#6b7180]">{when}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-5 border-t border-[#e0e3eb] bg-white py-2">
            {tabs.map((tab) => (
              <span
                key={tab}
                className={`text-center text-[0.625rem] ${tab === "Journal" ? "font-semibold text-[#17191f]" : "text-[#6b7180]"}`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">
        Illustrative preview, not a screenshot of the app.
      </figcaption>
    </figure>
  );
}

