import Link from "next/link";

export default function Home() {
  const examBadges = ["IELTS", "GRE", "SAT", "IBA"];
  const steps = ["শব্দ দেখো", "টাইপ করো", "মনে রাখো"];
  const examCategories = [
    { name: "IELTS", count: "1200+ words" },
    { name: "GRE", count: "1800+ words" },
    { name: "SAT", count: "1500+ words" },
    { name: "IBA", count: "1000+ words" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-10">
        <section className="w-full rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 lg:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6">
              <p className="inline-flex rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                Easy Vocab
              </p>

              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                ইংরেজি শব্দ শিখুন, পরীক্ষায় জিতুন
              </h1>

              <p className="max-w-xl text-sm leading-7 text-slate-200/90 sm:text-base">
                প্রতিদিন স্মার্ট কুইজ, রিভিশন রিমাইন্ডার আর পরীক্ষাভিত্তিক শব্দভান্ডার
                দিয়ে IELTS, GRE, SAT, IBA প্রস্তুতি হবে আরও দ্রুত ও আত্মবিশ্বাসী।
              </p>

              <div className="flex flex-wrap gap-2">
                {examBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl sm:p-8">
              <p className="text-sm font-medium text-slate-200">আজকের অফার</p>

              <div className="mt-3 flex items-end gap-3">
                <span className="text-xl text-slate-300 line-through">৳৪৯৯</span>
                <span className="text-3xl font-extrabold text-emerald-300 sm:text-4xl">৳০</span>
                <span className="mb-1 rounded-md bg-emerald-300/20 px-2 py-1 text-xs font-bold text-emerald-200">
                  (ফ্রি!)
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-200/90">
                সীমিত সময়ের জন্য পুরো কোর্স এবং প্র্যাকটিস সেট ফ্রি আনলক করুন।
              </p>

              <Link href="/dashboard" className="block">
                <button
                  type="button"
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:text-base"
                >
                  এখনই শুরু করুন - ফ্রি-তে!
                </button>
              </Link>

              <p className="mt-3 text-center text-xs text-slate-300/80">
                কোন কার্ড লাগবে না, সাথে সাথে শুরু করতে পারবেন।
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-center text-xs text-slate-300 sm:grid-cols-3 sm:text-sm">
            <p>৫০,০০০+ শিক্ষার্থী শব্দভান্ডার বাড়িয়েছে</p>
            <p>৭ দিনের রিভিশন সাইকেল</p>
            <p>মক টেস্টে গড় স্কোর ২x উন্নতি</p>
          </div>

          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">কীভাবে কাজ করে</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-xl"
                >
                  <p className="text-xs font-semibold tracking-[0.2em] text-cyan-200">
                    STEP {index + 1}
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-100">{step}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">Exam Categories</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {examCategories.map((exam) => (
                <div
                  key={exam.name}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-xl"
                >
                  <p className="text-lg font-extrabold text-cyan-100">{exam.name}</p>
                  <p className="mt-2 text-sm text-slate-300">{exam.count}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-300/90">
            <p className="font-semibold text-slate-100">Easy Vocab</p>
            <p className="mt-1">© 2026 Easy Vocab. All rights reserved.</p>
          </footer>
        </section>
      </main>
    </div>
  );
}
