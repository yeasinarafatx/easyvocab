import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 lg:p-10">
          <p className="inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            Free Demo
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            ২০টি Random Exam Word দিয়ে Live Demo
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">
            এখানে IELTS, GRE, BCS, IBA, Bank পরীক্ষায় সাধারণত দেখা যায় এমন ২০টি
            unique শব্দ আছে। Beginner/Intermediate এর একই structure এ data রাখা হয়েছে,
            তাই Typing এবং Speaking দুটোই directly test করতে পারবেন।
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/learn/demo-1"
              className="rounded-2xl border border-cyan-200/30 bg-cyan-200/10 p-5 transition hover:border-cyan-100 hover:bg-cyan-200/20"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Typing Demo
              </p>
              <h2 className="mt-2 text-xl font-extrabold">📝 Start Typing (20 Words)</h2>
              <p className="mt-2 text-sm text-slate-300">
                শুনে/দেখে শব্দ টাইপ করুন, progress bar সহ full flow test করুন।
              </p>
            </Link>

            <Link
              href="/speak/demo-1"
              className="rounded-2xl border border-emerald-200/30 bg-emerald-200/10 p-5 transition hover:border-emerald-100 hover:bg-emerald-200/20"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                Speaking Demo
              </p>
              <h2 className="mt-2 text-xl font-extrabold">🎤 Start Voice (20 Words)</h2>
              <p className="mt-2 text-sm text-slate-300">
                মাইক্রোফোন দিয়ে উচ্চারণ দিন এবং recognition result সাথে সাথে দেখুন।
              </p>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Home এ ফিরে যান
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
