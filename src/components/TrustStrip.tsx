type Avatar = {
  letter: string;
  className: string;
};

const avatars: Avatar[] = [
  { letter: "R", className: "bg-emerald-500" },
  { letter: "S", className: "bg-indigo-500" },
  { letter: "A", className: "bg-orange-500" },
  { letter: "+", className: "bg-sky-500" },
];

export default function TrustStrip() {
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors duration-300 hover:border-white/20">
      {/* Row 1: social proof + rating */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 -space-x-2">
            {avatars.map((avatar) => (
              <span
                key={avatar.letter}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-slate-900 ${avatar.className}`}
              >
                {avatar.letter}
              </span>
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-slate-100">২৫০+ active learners</p>
            <p className="truncate text-xs leading-tight text-slate-400">রোজ practice করছে</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex justify-end gap-0.5 text-amber-400">
            {[0, 1, 2, 3, 4].map((star) => (
              <svg key={star} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.005Z" />
              </svg>
            ))}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-300">৪.৮/৫ rating</p>
        </div>
      </div>

      {/* Divider */}
      <div className="my-3 h-px w-full bg-white/10" />

      {/* Row 2: assurance pills */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
            <path d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516 11.209 11.209 0 0 1-7.877-3.08ZM15.61 10.186a.75.75 0 0 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" />
          </svg>
          bKash · Nagad নিরাপদ পেমেন্ট
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
            <path d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" />
          </svg>
          Lifetime access
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
            <path d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" />
          </svg>
          Instant access
        </span>
      </div>
    </div>
  );
}
