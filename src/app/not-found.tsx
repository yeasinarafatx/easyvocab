import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f0f1a] px-6 text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-[#122531]/75 p-8 text-center shadow-2xl shadow-black/35 backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">404</p>
        <h1 className="mt-2 text-3xl font-extrabold text-cyan-100">পেজ পাওয়া যায়নি</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          আপনি যে পেজটি খুলতে চেয়েছেন তা নেই বা সরানো হয়েছে।
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/"
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/15"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}