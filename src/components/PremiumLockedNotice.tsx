import Link from "next/link";
import { trackMetaEvent } from "@/lib/metaPixel";

type PremiumLockedNoticeProps = {
  title?: string;
  message?: string;
};

export default function PremiumLockedNotice({
  title = "Level 2 থেকে Premium লাগবে",
  message = "এই level unlock করতে payment complete করুন। Level 1 সবার জন্য free।",
}: PremiumLockedNoticeProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 sm:px-6">
        <section className="w-full rounded-3xl border border-cyan-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 text-center shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Premium Required</p>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-50 sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">{message}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/payment"
              onClick={() => trackMetaEvent("Lead", { content_name: "Premium Locked Notice CTA" })}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110"
            >
              এখনই Premium নিন
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Dashboard এ ফিরে যান
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
