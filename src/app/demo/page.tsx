import Link from "next/link";

function DemoIcon({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-5 w-5 shrink-0" />;
}

export default function DemoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <section className="w-full rounded-3xl border border-cyan-200/30 bg-gradient-to-br from-[#0e1627]/95 via-[#15263a]/92 to-[#11323a]/90 p-6 shadow-2xl shadow-black/45 backdrop-blur-xl sm:p-8 lg:p-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <DemoIcon src="/icons/premium/medal-front-color.svg" alt="Premium" />
            Free Demo
          </p>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
            ২০টি Random Exam Word দিয়ে Live Demo
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">
            এখানে IELTS, GRE, BCS, IBA, Bank পরীক্ষায় সাধারণত দেখা যায় এমন ২০টি
            unique শব্দ আছে। Beginner/Intermediate এর একই structure এ data রাখা হয়েছে,
            তাই Typing, Speaking এবং Flashcard তিনটাই directly test করতে পারবেন।
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/learn/demo-1"
              className="rounded-2xl border border-cyan-200/45 bg-gradient-to-br from-[#1d344a]/92 via-[#223b55]/90 to-[#182739]/92 p-5 shadow-[0_14px_30px_rgba(34,211,238,0.14)] transition hover:border-cyan-100 hover:from-[#254a6b] hover:to-[#1e3550]"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
                <DemoIcon src="/icons/premium/pencil-front-premium.svg" alt="Typing" />
                Typing Demo
              </p>
              <h2 className="mt-2 text-xl font-extrabold">
                <span>Start Typing (20 Words)</span>
              </h2>
              <p className="mt-2 text-sm text-slate-200">
                শুনে/দেখে শব্দ টাইপ করুন, progress bar সহ full flow test করুন।
              </p>
            </Link>

            <Link
              href="/speak/demo-1"
              className="rounded-2xl border border-emerald-200/45 bg-gradient-to-br from-[#1e3a41]/92 via-[#26464b]/90 to-[#1f3439]/92 p-5 shadow-[0_14px_30px_rgba(52,211,153,0.12)] transition hover:border-emerald-100 hover:from-[#2a4f56] hover:to-[#28454b]"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                <DemoIcon src="/icons/premium/megaphone-front-premium.svg" alt="Speaking" />
                Speaking Demo
              </p>
              <h2 className="mt-2 text-xl font-extrabold">
                <span>Start Voice (20 Words)</span>
              </h2>
              <p className="mt-2 text-sm text-slate-200">
                মাইক্রোফোন দিয়ে উচ্চারণ দিন এবং recognition result সাথে সাথে দেখুন।
              </p>
            </Link>

            <Link
              href="/flashcard/demo-1"
              className="rounded-2xl border border-amber-200/45 bg-gradient-to-br from-[#3d3f39]/92 via-[#44493d]/90 to-[#2c4a45]/92 p-5 shadow-[0_14px_30px_rgba(245,158,11,0.12)] transition hover:border-amber-100 hover:from-[#505445] hover:to-[#35605a]"
            >
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                <DemoIcon src="/icons/premium/fav-folder-front-premium.svg" alt="Flashcard" />
                Flashcard Demo
              </p>
              <h2 className="mt-2 text-xl font-extrabold">
                <span>Start Flashcard (20 Words)</span>
              </h2>
              <p className="mt-2 text-sm text-slate-200">
                Front/Back flip করে EN→BN এবং BN→EN দুই mode-এ শব্দ অনুশীলন করুন।
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
