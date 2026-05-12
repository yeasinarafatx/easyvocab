"use client";

import Link from "next/link";
import Script from "next/script";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { trackMetaEvent } from "@/lib/metaPixel";

export default function Home() {
  const [sessionReady, setSessionReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [userTier, setUserTier] = useState<"guest" | "free" | "premium">("guest");
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const countdownStartIso = "2026-04-26T00:00:00+06:00";
  const countdownCycleMs = 7 * 24 * 60 * 60 * 1000;

  const formatUnit = (value: number) => String(value).padStart(2, "0");

  useEffect(() => {
    let mounted = true;

    const resolveUserState = async (user: User | null | undefined) => {
      if (!mounted) return;

      if (!user) {
        setDisplayName("");
        setUserTier("guest");
        return;
      }

      const name =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        (user.user_metadata?.name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "";

      setDisplayName(name);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();

      if (!mounted) return;
      setUserTier(profile?.is_premium ? "premium" : "free");
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      await resolveUserState(data.session?.user);
      setSessionReady(true);
    };

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveUserState(session?.user);
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
    { name: "IELTS" },
    { name: "GRE" },
    { name: "SAT" },
    { name: "IBA" },
    { name: "Admission" },
    { name: "BCS" },
    { name: "Bank" },
  ];
  const faqItems = [
    {
      question: "অ্যাপটি কি ফ্রিতে ব্যবহার করা যাবে?",
      answer: "হ্যাঁ, প্রতিটি মডিউলের 'Level 1' (এক্সাম মোডসহ) সবার জন্য একদম ফ্রি।",
    },
    {
      question: "পেমেন্ট করার পদ্ধতি কী?",
      answer: "বিকাশ বা নগদের 'Send Money' অপশন ব্যবহার করে নিরাপদে পেমেন্ট করতে পারবেন।",
    },
    {
      question: "৪৯৯ টাকা কি প্রতি মাসে দিতে হবে?",
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
      question: "৪৯৯ টাকার অফারটি কতদিন থাকবে?",
      answer: "এটি সীমিত সময়ের 'Early Bird' অফার। অফার শেষ হলে মূল্য আবার ৳৯৯৯ হবে।",
    },
  ];
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const countdownDays = remainingMs === null ? "--" : formatUnit(Math.floor(remainingMs / (24 * 60 * 60 * 1000)));
  const countdownHours =
    remainingMs === null ? "--" : formatUnit(Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
  const countdownMinutes =
    remainingMs === null ? "--" : formatUnit(Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)));
  const countdownSeconds = remainingMs === null ? "--" : formatUnit(Math.floor((remainingMs % (60 * 1000)) / 1000));

  const primaryHref = !sessionReady
    ? "/signup?redirect=%2Fpayment"
    : userTier === "guest"
      ? "/signup?redirect=%2Fpayment"
      : "/dashboard";

  const primaryLabel = userTier === "guest" ? "এখনই শুরু করুন ৫০% ছাড়ে" : "এখনই App এ যান";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-start px-4 py-8 sm:px-6 sm:py-12 lg:items-start lg:px-10">
        <section className="w-full rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-[#1a2030]/78 to-[#10262c]/74 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8 lg:p-12">
          <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-2">              <div className="flex justify-center" style={{ paddingTop: '15px' }}>
                <img
                  src="/og/og-image.png"
                  alt="Vocab Speak"
                  className="h-auto"
                  style={{ maxWidth: '240px', width: 'auto', filter: 'drop-shadow(0 0 20px rgba(99, 179, 237, 0.25))' }}
                />
              </div>
              <div className="mt-2 h-px w-28 mx-auto" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <h1 className="mt-1 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                ইংরেজি Vocabulary-তে Master হও, প্রতিটা Exam Crack করো।
              </h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-8 text-slate-100 sm:text-base sm:leading-8">
                IELTS, GRE, SAT, BCS বা Admission — যেকোনো exam-এর জন্য VocabSpeak তোমাকে করবে Perfectly ready। Type করে spelling শেখো, Voice Mode-এ pronunciation perfect করো, আর Flashcard দিয়ে words মনে রাখো — একটাই app, সব solution।
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {examBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-100"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200/30 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-slate-950/85 p-4 shadow-[0_14px_40px_rgba(8,145,178,0.18)] backdrop-blur-xl sm:p-8">
              <p className="text-sm font-bold text-white">Early Bird Offer</p>

              <div className="mt-3 flex flex-wrap items-end gap-2.5 sm:gap-3">
                <span className="text-xl font-bold text-red-400/80 line-through">৳৯৯৯</span>
                <span className="text-3xl font-extrabold text-amber-300 sm:text-4xl">৳৪৯৯</span>
                <span className="mb-1 whitespace-nowrap rounded-md bg-amber-300/25 px-2 py-1 text-xs font-bold text-amber-200">
                  সীমিত সময়ের ৫০% ছাড়
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-200/90 [word-break:break-word]">
                এককালীন পেমেন্টে আজই পুরো কোর্স, প্র্যাকটিস সেট এবং স্টেজ-ভিত্তিক লার্নিং আনলক করুন — সাথে পাচ্ছেন IELTS, GRE ও TOEFL-এর Premium Strategy Book Bundle এবং Advanced PDF Collection, যার বাজারমূল্য ৫০০০ টাকা। একবার কিনলেই সবকিছুতে লাইফটাইম অ্যাক্সেস পাবেন।
              </p>

              <div className="mt-5 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-400/15 via-slate-900/60 to-slate-900/40 p-3 shadow-2xl shadow-amber-400/20 backdrop-blur-xl sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100/80 sm:text-xs sm:tracking-[0.16em]">Offer Ends In</p>
                  <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-3">
                  <div className="min-w-0 rounded-xl border border-amber-300/30 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-amber-100 sm:text-xl">{countdownDays}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">D</span><span className="hidden sm:inline">Days</span></p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-amber-300/30 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-amber-100 sm:text-xl">{countdownHours}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">H</span><span className="hidden sm:inline">Hours</span></p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-amber-300/30 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-amber-100 sm:text-xl">{countdownMinutes}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">M</span><span className="hidden sm:inline">Minutes</span></p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-amber-300/30 bg-slate-900/45 px-1.5 py-2 text-center sm:px-3 sm:py-2.5">
                    <p className="text-base font-extrabold leading-none text-amber-100 sm:text-xl">{countdownSeconds}</p>
                    <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.06em] text-slate-300 sm:text-[10px] sm:tracking-[0.16em]"><span className="sm:hidden">S</span><span className="hidden sm:inline">Seconds</span></p>
                  </div>
                </div>

              </div>

              {sessionReady && displayName ? (
                <div className="mt-4 rounded-2xl border border-cyan-200/18 bg-gradient-to-br from-slate-900/78 via-[#162430]/88 to-[#102c31]/72 px-4 py-3.5 text-sm text-slate-100 shadow-lg shadow-black/20 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/78">Signed in as</p>
                  <p className="mt-1 break-words text-base font-bold leading-tight text-amber-100">{displayName}</p>
                </div>
              ) : null}

              <Link href={primaryHref} className="mt-5 block">
                <button
                  type="button"
                  onClick={() =>
                    trackMetaEvent("Lead", {
                      content_name: userTier === "premium" ? "Home App Entry CTA" : "Home Primary CTA",
                    })
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-sm font-extrabold text-[#0f0f1a] shadow-lg shadow-amber-500/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:px-5 sm:text-base"
                >
                  {primaryLabel}
                </button>
              </Link>

              <Link
                href={sessionReady && displayName ? "/dashboard" : "/signup?redirect=%2Fdashboard"}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-cyan-200/35 bg-white/5 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:text-sm"
              >
                Try for Free
              </Link>

              <p className="mt-3 px-1 text-center text-[11px] leading-5 text-slate-300/85 [word-break:break-word] sm:text-xs">
                Secure checkout এবং easy access - পেমেন্টের পরই শুরু করতে পারবেন।
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-amber-300/40 bg-gradient-to-br from-amber-400/15 via-slate-900/60 to-slate-900/40 p-6 shadow-2xl shadow-amber-400/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">Exclusive Resource</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight text-amber-50 sm:text-3xl">
                  📚 IELTS, GRE ও TOEFL-এর বাছাই করা Strategy PDF — সম্পূর্ণ ফ্রি
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200/90 sm:text-base">
                  বিশেষজ্ঞদের তৈরি Exam Strategy Guide, Word List এবং Practice Set — account খুললেই সাথে সাথে download করুন।
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-block rounded-full bg-amber-300/20 border border-amber-300/50 px-3 py-1 text-xs font-bold text-amber-100">
                    ✓ একদম বিনামূল্যে
                  </span>
                  <span className="inline-block rounded-full bg-emerald-300/20 border border-emerald-300/50 px-3 py-1 text-xs font-bold text-emerald-100">
                    ✓ কোনো পেমেন্ট নেই
                  </span>
                  <span className="inline-block rounded-full bg-cyan-300/20 border border-cyan-300/50 px-3 py-1 text-xs font-bold text-cyan-100">
                    ✓ এখনই অ্যাক্সেস করুন
                  </span>
                </div>
              </div>
              <Link href="/signup" className="inline-flex flex-shrink-0">
                <button
                  type="button"
                  onClick={() => trackMetaEvent("Lead", { content_name: "Free Resource CTA" })}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-base font-extrabold text-[#0f0f1a] shadow-lg shadow-amber-500/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:px-8 sm:py-5 sm:text-lg whitespace-nowrap"
                >
                  ⬇️ ডাউনলোড করুন
                </button>
              </Link>
            </div>
          </div>

          <section className="mt-12 rounded-[1.75rem] border border-cyan-200/20 bg-gradient-to-r from-slate-900/78 via-[#1f2a36]/92 to-[#102c31]/78 px-5 py-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:px-7 sm:py-8">
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
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-cyan-200/22 bg-gradient-to-br from-slate-900/78 via-[#202b38]/92 to-[#123238]/80 p-5 text-slate-100 shadow-2xl shadow-black/35 backdrop-blur-sm sm:p-6 sm:backdrop-blur-xl lg:p-7">
              <div className="flex items-start gap-3 border-b border-cyan-100/15 pb-5 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-200/15 text-sm font-black text-cyan-100">
                  EV
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80 sm:text-xs sm:tracking-[0.22em]">
                    Vocab Speak এ যা আছে
                  </p>
                  <h2 className="mt-2 max-w-xl text-[1.95rem] font-extrabold leading-[1.12] tracking-tight text-slate-100 sm:text-[2rem] sm:leading-tight">
                    <span className="block">সবকিছু এক জায়গায়:</span>
                    <span className="mt-1 block text-[1.55rem] leading-[1.16] sm:text-[2rem]">বানান শিখুন-উচ্চারণ করুন-মনে রাখুন !</span>
                  </h2>
                </div>
              </div>

              <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-100/90 sm:space-y-3 sm:text-base sm:leading-7">
                <li className="flex items-center gap-2 rounded-2xl border border-cyan-100/12 bg-gradient-to-r from-slate-800/55 to-[#17363d]/38 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <img src="/icons/premium/star-small-premium.svg" alt="Star" width={16} height={16} className="h-4 w-4 shrink-0" />
                  <span>Beginner, Intermediate, Advanced, Exam এবং Demo section সহ structured vocabulary journey</span>
                </li>
                <li className="flex items-center gap-2 rounded-2xl border border-cyan-100/12 bg-gradient-to-r from-slate-800/55 to-[#17363d]/38 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <img src="/icons/premium/star-small-premium.svg" alt="Star" width={16} height={16} className="h-4 w-4 shrink-0" />
                  <span>প্রতি level-এ ২০টি word, fill-in-the-blank example, meaning আর pronunciation guide</span>
                </li>
                <li className="flex items-center gap-2 rounded-2xl border border-cyan-100/12 bg-gradient-to-r from-slate-800/55 to-[#17363d]/38 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <img src="/icons/premium/star-small-premium.svg" alt="Star" width={16} height={16} className="h-4 w-4 shrink-0" />
                  <span>বানান লেখা, উচ্চারণ শোনা এবং ফ্ল্যাশকার্ডে মনে রাখা - শব্দ দীর্ঘদিন মনে রাখার জন্য সবচেয়ে কার্যকর practice flow</span>
                </li>
                <li className="flex items-center gap-2 rounded-2xl border border-cyan-100/12 bg-gradient-to-r from-slate-800/55 to-[#17363d]/38 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <img src="/icons/premium/star-small-premium.svg" alt="Star" width={16} height={16} className="h-4 w-4 shrink-0" />
                  <span>IELTS, GRE, SAT, IBA, BCS, Bank exam-oriented শব্দ, যাতে real exam context-এর সাথে match করে</span>
                </li>
                <li className="flex items-center gap-2 rounded-2xl border border-cyan-100/12 bg-gradient-to-r from-slate-800/55 to-[#17363d]/38 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <img src="/icons/premium/star-small-premium.svg" alt="Star" width={16} height={16} className="h-4 w-4 shrink-0" />
                  <span>Unlock-based progress, dashboard tracking, আর smooth stage navigation</span>
                </li>
                <li className="flex items-center gap-2 rounded-2xl border border-cyan-100/12 bg-gradient-to-r from-slate-800/55 to-[#17363d]/38 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5">
                  <img src="/icons/premium/star-small-premium.svg" alt="Star" width={16} height={16} className="h-4 w-4 shrink-0 self-center" />
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

          <section className="hidden border-t border-white/10 pt-8 sm:block sm:mt-10">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">Exam Categories</h2>
            <div className="mt-6 flex justify-center">
              <div className="grid w-full max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                {examCategories.map((exam) => (
                  <div
                    key={exam.name}
                    className="flex min-h-[90px] flex-col items-center justify-center rounded-xl border border-cyan-200/18 bg-gradient-to-br from-slate-900/74 to-[#223140]/92 px-3 py-3 text-center text-slate-100 shadow-lg shadow-black/30 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-0.5 sm:min-h-[100px] sm:backdrop-blur-xl"
                  >
                    <p className="text-sm font-extrabold tracking-[0.08em] text-cyan-100 sm:text-base">
                      {exam.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 border-t border-white/10 pt-8">
            <div className="mx-auto w-full max-w-4xl">
              <h2 className="text-center text-2xl font-bold text-slate-100 sm:text-3xl">সাধারণ জিজ্ঞাসা (FAQ)</h2>
              <Script id="homepage-faq-schema" type="application/ld+json" strategy="afterInteractive">
                {JSON.stringify(faqStructuredData)}
              </Script>
              <div className="mt-6 space-y-4">
                {faqItems.map((item, index) => {
                  const isOpen = openFaqIndex === index;

                  return (
                    <article
                      key={item.question}
                      className="rounded-2xl border border-[#00FFFF]/28 bg-gradient-to-br from-slate-900/75 to-[#21303d]/94 text-slate-100 shadow-lg shadow-black/30 backdrop-blur-sm transition-colors duration-300 hover:border-[#00FFFF]/50 sm:backdrop-blur-lg"
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
            <p className="text-sm font-semibold leading-normal text-cyan-100/90 sm:text-base">
              কাস্টমার সাপোর্টের জন্য
            </p>

            <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-3 sm:gap-4">
              {[
                { name: "Facebook", src: "/logos/social/facebook.svg", href: "https://www.facebook.com/share/17SRhrV411/" },
                { name: "Instagram", src: "/logos/social/instagram.svg", href: "https://www.instagram.com/vocabspeakapp?igsh=ZnJidG5pem04eG9t" },
                { name: "WhatsApp", src: "/logos/social/whatsapp.svg", href: "https://wa.me/message/GEWPOC6N6XFQC1" },
                { name: "YouTube", src: "/logos/social/youtube.svg" },
              ].map((item) => (
                item.href ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center transition hover:scale-105"
                  >
                    <img
                      src={item.src}
                      alt={`${item.name} icon`}
                      className="h-10 w-10 object-contain sm:h-11 sm:w-11 md:h-12 md:w-12"
                    />
                  </a>
                ) : (
                  <div key={item.name} className="flex items-center justify-center">
                    <img
                      src={item.src}
                      alt={`${item.name} icon`}
                      className="h-10 w-10 object-contain sm:h-11 sm:w-11 md:h-12 md:w-12"
                    />
                  </div>
                )
              ))}
            </div>

            <p className="mt-5 font-semibold text-slate-100">Vocab Speak</p>
            <p className="mt-1">© 2026 Vocab Speak. All rights reserved.</p>

            <div className="mx-auto mt-4 max-w-xl rounded-3xl border border-cyan-100/14 bg-slate-900/55 px-4 py-4 shadow-lg shadow-black/25 sm:px-6 sm:py-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-100/90 sm:text-xs">
                  Verified payment via
                </p>
                <img src="/icons/premium/medal-front-color.svg" alt="Verified" className="h-7 w-7" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="flex min-h-16 items-center justify-center rounded-2xl bg-white px-3 py-2 shadow-md shadow-black/10 sm:min-h-20 sm:px-4 sm:py-3">
                  <img
                    src="/logos/payments/bkash-logo.png"
                    alt="bKash logo"
                    className="h-7 w-auto max-w-full object-contain sm:h-8"
                  />
                </div>

                <div className="flex min-h-16 items-center justify-center rounded-2xl bg-white px-3 py-2 shadow-md shadow-black/10 sm:min-h-20 sm:px-4 sm:py-3">
                  <img
                    src="/logos/payments/nagad-logo.png"
                    alt="Nagad logo"
                    className="h-7 w-auto max-w-full object-contain sm:h-8"
                  />
                </div>
              </div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
