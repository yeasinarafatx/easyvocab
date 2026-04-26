"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [sessionReady, setSessionReady] = useState(false);
  const [displayName, setDisplayName] = useState("");

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

  const examBadges = ["IELTS", "GRE", "SAT", "IBA"];
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
                <span className="text-xl text-slate-300 line-through">৳৯৯৯</span>
                <span className="text-3xl font-extrabold text-emerald-300 sm:text-4xl">৳৪৯৯</span>
                <span className="mb-1 rounded-md bg-emerald-300/20 px-2 py-1 text-xs font-bold text-emerald-200">
                  (৫০% ছাড়)
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-200/90">
                সীমিত সময়ের ৫০% ছাড়ে পুরো কোর্স, প্র্যাকটিস সেট এবং স্টেজ-ভিত্তিক
                লার্নিং আনলক করুন।
              </p>

              {sessionReady && displayName ? (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Signed in as</p>
                  <p className="mt-1 text-base font-bold">{displayName}</p>
                </div>
              ) : null}

              <Link href={sessionReady && displayName ? "/dashboard" : "/login"} className="block">
                <button
                  type="button"
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-3 text-sm font-extrabold text-[#0f0f1a] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f1a] sm:text-base"
                >
                  {sessionReady && displayName ? "Continue to Dashboard" : "এখনই শুরু করুন - ৫০% ছাড়ে!"}
                </button>
              </Link>

              <p className="mt-3 text-center text-xs text-slate-300/80">
                Secure checkout এবং instant access - পেমেন্টের পরই শুরু করতে পারবেন।
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-center text-xs text-slate-300 sm:grid-cols-3 sm:text-sm">
            <p>৫০,০০০+ শিক্ষার্থী শব্দভান্ডার বাড়িয়েছে</p>
            <p>৭ দিনের রিভিশন সাইকেল</p>
            <p>মক টেস্টে গড় স্কোর ২x উন্নতি</p>
          </div>

          <section className="mt-8 rounded-[1.75rem] border border-white/15 bg-white/10 px-5 py-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-6 sm:py-6">
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
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 via-white/5 to-emerald-300/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6 lg:p-7">
              <div className="flex items-start gap-4 border-b border-cyan-100/15 pb-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/30 bg-cyan-200/15 text-sm font-black text-cyan-100">
                  EV
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
                    Easy Vocab এ যা আছে
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-slate-100 sm:text-[2rem]">
                    সবকিছু এক জায়গায়, typing আর voice practice সহ
                  </h2>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-200/90 sm:text-base">
                <li className="flex gap-3 rounded-2xl border border-cyan-100/10 bg-cyan-200/5 px-4 py-3">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>Beginner, Intermediate, Advanced, Exam এবং Demo section সহ structured vocabulary journey</span>
                </li>
                <li className="flex gap-3 rounded-2xl border border-cyan-100/10 bg-cyan-200/5 px-4 py-3">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>প্রতি level-এ ২০টি word, fill-in-the-blank example, meaning আর pronunciation guide</span>
                </li>
                <li className="flex gap-3 rounded-2xl border border-cyan-100/10 bg-cyan-200/5 px-4 py-3">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>Typing, Speaking এবং Flashcard mode-এ word recall, pronunciation ও revision practice</span>
                </li>
                <li className="flex gap-3 rounded-2xl border border-cyan-100/10 bg-cyan-200/5 px-4 py-3">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>IELTS, GRE, SAT, IBA, BCS, Bank exam-oriented শব্দ, যাতে real exam context-এর সাথে match করে</span>
                </li>
                <li className="flex gap-3 rounded-2xl border border-cyan-100/10 bg-cyan-200/5 px-4 py-3">
                  <span className="mt-0.5 text-emerald-300">✓</span>
                  <span>Unlock-based progress, dashboard tracking, আর smooth stage navigation</span>
                </li>
                <li className="flex gap-3 rounded-2xl border border-cyan-100/10 bg-cyan-200/5 px-4 py-3">
                  <span className="mt-0.5 text-emerald-300">✓</span>
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
