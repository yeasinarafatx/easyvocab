"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [sessionReady, setSessionReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const countdownStartIso = "2026-04-26T00:00:00+06:00";
  const countdownCycleMs = 7 * 24 * 60 * 60 * 1000;

  const formatUnit = (value: number) => String(value).padStart(2, "0");

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const user = data.session?.user;
      const name =
        (user?.user_metadata?.full_name as string | undefined)?.trim() ||
        (user?.user_metadata?.name as string | undefined)?.trim() ||
        user?.email?.split("@")[0] ||
        "";

      setDisplayName(name);
      setSessionReady(true);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      const name =
        (user?.user_metadata?.full_name as string | undefined)?.trim() ||
        (user?.user_metadata?.name as string | undefined)?.trim() ||
        user?.email?.split("@")[0] ||
        "";

      setDisplayName(name);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const startTs = new Date(countdownStartIso).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const elapsed = Math.max(0, now - startTs);
      const remainder = elapsed % countdownCycleMs;
      const nextRemaining = remainder === 0 ? countdownCycleMs : countdownCycleMs - remainder;
      setRemainingMs(nextRemaining);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [countdownCycleMs, countdownStartIso]);

  const examBadges = ["IELTS", "GRE", "SAT", "IBA"];
  const examCategories = [
    { name: "IELTS", count: "1200+ words" },
    { name: "GRE", count: "1800+ words" },
    { name: "SAT", count: "1500+ words" },
    { name: "IBA", count: "1000+ words" },
  ];
  const faqItems = [
    {
      question: "অ্যাপটি কি ফ্রিতে ব্যবহার করা যাবে?",
      answer: "হ্যাঁ, প্রতিটি মডিউলের 'Level 1' (এক্সাম মোডসহ) সবার জন্য একদম ফ্রি।",
    },
    {
      question: "পেমেন্ট করার পদ্ধতি কী?",
      answer: "বিকাশ বা নগদের 'Merchant Pay' অপশন ব্যবহার করে নিরাপদে পেমেন্ট করতে পারবেন।",
    },
    {
      question: "৩৪৯ টাকা কি প্রতি মাসে দিতে হবে?",
      answer: "না, এটি এককালীন পেমেন্ট। একবার কিনলে লাইফটাইম অ্যাক্সেস পাবেন।",
    },
    {
      question: "কতক্ষণ পর প্রিমিয়াম অ্যাক্সেস পাবো?",
      answer: "TrxID সাবমিট করার ১৫-৩০ মিনিটের মধ্যেই আপনার অ্যাকাউন্ট অ্যাক্টিভেট হয়ে যাবে।",
    },
    {
      question: "রিফান্ড পলিসি আছে কি?",
      answer: "ডিজিটাল প্রোডাক্ট হওয়ায় কোনো রিফান্ড নেই। কেনার আগে ফ্রি লেভেলগুলো ট্রাই করে নিন।",
    },
    {
      question: "৩৪৯ টাকার অফারটি কতদিন থাকবে?",
      answer: "এটি সীমিত সময়ের 'Early Bird' অফার। অফার শেষ হলে মূল্য আবার ৳৯৯৯ হবে।",
    },
  ];
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const countdownDays = remainingMs === null ? "--" : formatUnit(Math.floor(remainingMs / (24 * 60 * 60 * 1000)));
  const countdownHours =
    remainingMs === null ? "--" : formatUnit(Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
  const countdownMinutes =
    remainingMs === null ? "--" : formatUnit(Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)));
  const countdownSeconds = remainingMs === null ? "--" : formatUnit(Math.floor((remainingMs % (60 * 1000)) / 1000));

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-8 sm:px-6 sm:py-10 lg:items-center lg:px-10">
        <section className="w-full rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-[#1a2030]/78 to-[#10262c]/74 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8 lg:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6">
              <div className="mx-auto flex w-fit items-center justify-center rounded-[20px] bg-white p-3 sm:p-4 lg:p-5 shadow-lg">
                <picture>
                  <source media="(min-width: 1024px)" srcSet="/logos/easy-vocab-hero-desktop.png 1x, /logos/easy-vocab-hero-desktop@2x.png 2x" />
                  <source media="(min-width: 640px)" srcSet="/logos/easy-vocab-hero-tablet.png 1x, /logos/easy-vocab-hero-tablet@2x.png 2x" />
                  <img
                    src="/logos/easy-vocab-hero-mobile.png"
                    srcSet="/logos/easy-vocab-hero-mobile@2x.png 2x"
                    alt="Easy Vocab Logo"
                    className="h-auto w-28 sm:w-36 lg:w-48"
                  />
                </picture>
              </div>

              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                দ্রুত ইংরেজি শব্দ শিখুন, কার্যকরী উপায়ে
              </h1>

              <p className="max-w-xl text-sm leading-7 text-slate-200/90 sm:text-base">
                Type করে spelling শিখুন আর ভুলবেন না। সঠিক উচ্চারণের জন্য Voice Mode ব্যবহার করুন, এবং Active Recall গড়ে তুলতে Flashcards ব্যবহার করুন — দ্রুত ও আত্মবিশ্বাসী প্রস্তুতির জন্য।
              </p>

              <div className="flex flex-wrap gap-2">
                {examBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-semibold tracking-wide text-slate-100"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200/30 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-slate-950/85 p-4 shadow-[0_14px_40px_rgba(8,145,178,0.18)] backdrop-blur-xl sm:p-8">
              <p className="text-sm font-bold text-white">Early Bird Offer</p>

              <div className="mt-3 flex flex-wrap items-end gap-2.5 sm:gap-3">
                <span className="text-xl text-slate-300 line-through">৳৯৯৯</span>
                <span className="text-3xl font-extrabold text-emerald-300 sm:text-4xl">৳৩৪৯</span>
                <span className="mb-1 whitespace-nowrap rounded-md bg-emerald-300/20 px-2 py-1 text-xs font-bold text-emerald-200">
                  সীমিত সময়ের ৬৫% ছাড়
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-200/90 [word-break:break-word]">
                এককালীন পেমেন্টে আজই পুরো কোর্স, প্র্যাকটিস সেট এবং স্টেজ-ভিত্তিক লার্নিং আনলক করুন। <span className="font-semibold text-emerald-100">একবার কিনলেই লাইফটাইম অ্যাক্সেস পাবেন।</span>
              </p>

              <div className="mt-5 rounded-2xl border border-cyan-300/45 bg-gradient-to-br from-cyan-400/18 to-emerald-300/12 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-cyan-100/95 sm:text-xs sm:tracking-[0.16em]">Offer Ends In</p>
                  <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-3">
                  <div className="min-w-0 rounded-xl border border-white/20 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-cyan-100 sm:text-xl">{countdownDays}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">D</span><span className="hidden sm:inline">Days</span></p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/20 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-cyan-100 sm:text-xl">{countdownHours}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">H</span><span className="hidden sm:inline">Hours</span></p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/20 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-cyan-100 sm:text-xl">{countdownMinutes}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">M</span><span className="hidden sm:inline">Minutes</span></p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-white/20 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-cyan-100 sm:text-xl">{countdownSeconds}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">S</span><span className="hidden sm:inline">Seconds</span></p>
                  </div>
                </div>

              </div>

              {sessionReady && displayName ? (
                <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3.5 text-sm text-emerald-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Signed in as</p>
                  <p className="mt-1 break-words text-base font-bold leading-tight">{displayName}</p>
                </div>
              ) : null}

              <Link href={sessionReady && displayName ? "/dashboard" : "/login"} className="mt-5 block">
                <button
                  type="button"
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:px-5 sm:text-base"
                >
                  {sessionReady && displayName ? "Continue to Dashboard" : "এখনই শুরু করুন - ৬৫% ছাড়ে!"}
                </button>
              </Link>

              <p className="mt-3 px-1 text-center text-[11px] leading-5 text-slate-300/85 [word-break:break-word] sm:text-xs">
                Secure checkout এবং easy access - পেমেন্টের পরই শুরু করতে পারবেন।
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-center text-xs text-slate-200 sm:grid-cols-3 sm:text-sm">
            <p>৫০,০০০+ শিক্ষার্থী শব্দভান্ডার বাড়িয়েছে</p>
            <p>৭ দিনের রিভিশন সাইকেল</p>
            <p>মক টেস্টে গড় স্কোর ২x উন্নতি</p>
          </div>

          <section className="mt-8 rounded-[1.75rem] border border-cyan-200/25 bg-gradient-to-r from-cyan-300/14 via-[#25303d]/90 to-emerald-300/14 px-5 py-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/80">Try Demo</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-slate-100 sm:text-[1.9rem]">
                  ২০টি Exam Word দিয়ে Live Typing + Speaking + Flashcard Demo
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/85 sm:text-[0.98rem]">
                  IELTS, GRE, BCS, IBA, Bank mix থেকে নেওয়া ২০টি unique শব্দ দিয়ে এক জায়গায় তিন ধরনের practice করুন।
                </p>
              </div>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:text-base"
              >
                Demo Start করুন
              </Link>
            </div>
          </section>

          <section className="mt-10 border-t border-white/10 pt-8">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-cyan-200/28 bg-gradient-to-br from-cyan-300/18 via-[#2a3340]/88 to-emerald-300/16 p-5 text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6 sm:backdrop-blur-xl lg:p-7">
              <div className="flex items-start gap-3 border-b border-cyan-100/15 pb-5 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-200/15 text-sm font-black text-cyan-100">
                  EV
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80 sm:text-xs sm:tracking-[0.22em]">
                    Easy Vocab এ যা আছে
                  </p>
                  <h2 className="mt-2 max-w-xl text-[1.95rem] font-extrabold leading-[1.12] tracking-tight text-slate-100 sm:text-[2rem] sm:leading-tight">
                    <span className="block">সবকিছু এক জায়গায়:</span>
                    <span className="mt-1 block text-[1.55rem] leading-[1.16] sm:text-[2rem]">Smart Spelling, Correct Pronunciation, Flashcard Active Recall</span>
                  </h2>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-100/90 sm:space-y-3 sm:text-base sm:leading-7">
                <li className="flex gap-2 rounded-2xl border border-cyan-100/15 bg-gradient-to-r from-cyan-300/10 to-emerald-300/6 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <span className="mt-0.5 shrink-0 text-emerald-300">✓</span>
                  <span>Beginner, Intermediate, Advanced, Exam এবং Demo section সহ structured vocabulary journey</span>
                </li>
                <li className="flex gap-2 rounded-2xl border border-cyan-100/15 bg-gradient-to-r from-cyan-300/10 to-emerald-300/6 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <span className="mt-0.5 shrink-0 text-emerald-300">✓</span>
                  <span>প্রতি level-এ ২০টি word, fill-in-the-blank example, meaning আর pronunciation guide</span>
                </li>
                <li className="flex gap-2 rounded-2xl border border-cyan-100/15 bg-gradient-to-r from-cyan-300/10 to-emerald-300/6 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <span className="mt-0.5 shrink-0 text-emerald-300">✓</span>
                  <span>Smart Spelling Practice, Correct Pronunciation Practice, এবং Flashcard Active Recall - শব্দ দীর্ঘদিন মনে রাখার জন্য সবচেয়ে কার্যকর practice flow</span>
                </li>
                <li className="flex gap-2 rounded-2xl border border-cyan-100/15 bg-gradient-to-r from-cyan-300/10 to-emerald-300/6 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <span className="mt-0.5 shrink-0 text-emerald-300">✓</span>
                  <span>IELTS, GRE, SAT, IBA, BCS, Bank exam-oriented শব্দ, যাতে real exam context-এর সাথে match করে</span>
                </li>
                <li className="flex gap-2 rounded-2xl border border-cyan-100/15 bg-gradient-to-r from-cyan-300/10 to-emerald-300/6 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <span className="mt-0.5 shrink-0 text-emerald-300">✓</span>
                  <span>Unlock-based progress, dashboard tracking, আর smooth stage navigation</span>
                </li>
                <li className="flex gap-2 rounded-2xl border border-cyan-100/15 bg-gradient-to-r from-cyan-300/10 to-emerald-300/6 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <span className="mt-0.5 shrink-0 text-emerald-300">✓</span>
                  <span>Free demo দিয়ে শুরু করে আগে দেখতে পারবেন কিভাবে appটা কাজ করে</span>
                </li>
              </ul>

              <div className="mt-6 flex justify-center">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:text-base"
                >
                  Demo দিয়ে শুরু করুন
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">Exam Categories</h2>
            <div className="mt-6 flex justify-center">
              <div className="grid w-full max-w-6xl grid-cols-4 gap-3">
                {examCategories.map((exam) => (
                  <div
                    key={exam.name}
                    className="rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/14 to-[#2f3a44]/92 px-3 py-3 text-center text-slate-100 shadow-lg shadow-black/20 backdrop-blur-sm sm:backdrop-blur-xl"
                  >
                    <p className="text-base font-extrabold text-cyan-100">{exam.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 border-t border-white/10 pt-8">
            <div className="mx-auto w-full max-w-4xl">
              <h2 className="text-center text-2xl font-bold text-slate-100 sm:text-3xl">সাধারণ জিজ্ঞাসা (FAQ)</h2>
              <div className="mt-6 space-y-4">
                {faqItems.map((item, index) => {
                  const isOpen = openFaqIndex === index;

                  return (
                    <article
                      key={item.question}
                      className="rounded-2xl border border-[#00FFFF]/40 bg-gradient-to-br from-cyan-300/12 to-[#2a3540]/92 text-slate-100 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors duration-300 hover:border-[#00FFFF]/70 sm:backdrop-blur-lg"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex((prev) => (prev === index ? null : index))}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                      >
                        <span className="text-base font-semibold leading-relaxed text-slate-100 sm:text-lg">{item.question}</span>
                        <span
                          className={`text-xl font-bold leading-none text-[#00FFFF] transition-transform duration-300 ${
                            isOpen ? "rotate-45" : "rotate-0"
                          }`}
                        >
                          +
                        </span>
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-in-out ${
                          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="border-t border-[#00FFFF]/20 px-5 pb-5 pt-4 text-sm leading-7 text-slate-200 sm:px-6 sm:text-base">
                            {item.answer}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
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
