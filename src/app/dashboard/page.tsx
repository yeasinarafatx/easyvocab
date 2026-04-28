"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type StageName = "Beginner" | "Intermediate" | "Advanced" | "Exam" | "Spoken";

type StageConfig = {
  name: StageName;
  totalWords: number;
  totalLevels: number;
  unlockThreshold: number;
  dependsOn: StageName | null;
};

type PremiumState = "loading" | "free" | "premium";
type PaymentState = "pending" | "approved" | "rejected" | null;

const stages: StageConfig[] = [
  { name: "Beginner", totalWords: 200, totalLevels: 10, unlockThreshold: 0, dependsOn: null },
  { name: "Intermediate", totalWords: 300, totalLevels: 15, unlockThreshold: 5, dependsOn: "Beginner" },
  { name: "Advanced", totalWords: 300, totalLevels: 15, unlockThreshold: 0, dependsOn: "Intermediate" },
  { name: "Exam", totalWords: 600, totalLevels: 30, unlockThreshold: 0, dependsOn: null },
  { name: "Spoken", totalWords: 600, totalLevels: 30, unlockThreshold: 0, dependsOn: null },
];

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 2l1.9 5.6L20 9.5l-4.7 3.1L16.9 18 12 14.9 7.1 18l1.6-5.4L4 9.5l6.1-1.9L12 2z" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M13.5 2.5s1.5 3.5.5 5.5c2.5-1 4.5-3 4.5-3s2 4 2 7a8.5 8.5 0 1 1-17 0c0-3.2 2.4-5.7 4.7-8.2C9 5.7 10 9 10 9s2-1 3.5-6.5z" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const [premiumState, setPremiumState] = useState<PremiumState>("loading");
  const [latestPaymentState, setLatestPaymentState] = useState<PaymentState>(null);
  const [latestPaymentNote, setLatestPaymentNote] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshStatus = async (userId: string) => {
    const [{ data: profile }, { data: latestPayment }, { data: adminRow }] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("payment_requests")
        .select("status, review_note")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    setPremiumState(profile?.is_premium ? "premium" : "free");
    setLatestPaymentState((latestPayment?.status as PaymentState) ?? null);
    setLatestPaymentNote(latestPayment?.review_note ?? null);
    setIsAdmin(Boolean(adminRow?.user_id));
  };

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      if (!data.session.user.email_confirmed_at) {
        const email = encodeURIComponent(data.session.user.email ?? "");
        await supabase.auth.signOut();
        router.replace(`/verify-email?email=${email}`);
        return;
      }

      const profileName =
        (data.session.user.user_metadata?.full_name as string | undefined)?.trim() ||
        (data.session.user.user_metadata?.name as string | undefined)?.trim() ||
        data.session.user.email?.split("@")[0] ||
        "User";

      setUserName(profileName);

      if (!mounted) return;

      const userId = data.session.user.id;
      await refreshStatus(userId);
      setAuthChecked(true);
    };

    verifySession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/");
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    const timer = window.setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) return;
      await refreshStatus(userId);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [authChecked]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const [completedCount] = useState<Record<StageName, number>>(() => {
    if (typeof window === "undefined") {
      return { Beginner: 0, Intermediate: 0, Advanced: 0, Exam: 0, Spoken: 0 };
    }

    const counts: Record<StageName, number> = { Beginner: 0, Intermediate: 0, Advanced: 0, Exam: 0, Spoken: 0 };
    stages.forEach((stage) => {
      for (let i = 1; i <= stage.totalLevels; i++) {
        const levelId = `${stage.name.toLowerCase()}-${i}`;
        if (window.localStorage.getItem(`completed_${levelId}`) === "true") {
          counts[stage.name]++;
        }
      }
    });
    return counts;
  });

  const stageStatus = useMemo(() => {
    return stages.map((stage) => {
      let isLocked = false;

      if (stage.name === "Advanced") {
        isLocked = typeof window !== "undefined" && window.localStorage.getItem("completed_intermediate-8") !== "true";
      } else if (stage.dependsOn) {
        const dependency = stages.find((s) => s.name === stage.dependsOn);
        if (dependency) {
          isLocked = completedCount[stage.dependsOn] < stage.unlockThreshold;
        }
      }

      const progressPercent = (completedCount[stage.name] / stage.totalLevels) * 100;

      return { ...stage, isLocked, progressPercent, completedCount: completedCount[stage.name] };
    });
  }, [completedCount]);

  const totalWordsLearned = useMemo(() => {
    return (
      completedCount.Beginner * 20 +
      completedCount.Intermediate * 20 +
      completedCount.Advanced * 20 +
      completedCount.Exam * 20 +
      completedCount.Spoken * 20
    );
  }, [completedCount]);

  const stageLookup = useMemo(() => {
    const lookup = {} as Record<StageName, (typeof stageStatus)[number]>;
    stageStatus.forEach((stage) => {
      lookup[stage.name] = stage;
    });
    return lookup;
  }, [stageStatus]);

  const coreCompletedLevels =
    completedCount.Beginner + completedCount.Intermediate + completedCount.Advanced;
  const coreTotalLevels = 10 + 15 + 15;
  const coreProgressPercent = (coreCompletedLevels / coreTotalLevels) * 100;

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-200">
        <p className="text-sm">Session যাচাই হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-[#122531]/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8 lg:p-10">
          <header className="border-b border-white/10 pb-6">
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Easy Vocab
                </p>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                  <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                    Welcome back
                  </span>
                  <span className="mt-1 block text-emerald-300">{userName}</span>
                </h1>
                <Link
                  href="/"
                  className="mt-4 inline-flex rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
                >
                  Product Page
                </Link>
                <Link
                  href="/payment"
                  className="mt-4 ml-3 inline-flex rounded-lg border border-cyan-200/35 bg-cyan-200/12 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
                >
                  Payment
                </Link>
                {isAdmin ? (
                  <Link
                    href="/admin/reviews"
                    className="mt-4 ml-3 inline-flex rounded-lg border border-amber-300/35 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
                  >
                    Admin Review
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 ml-3 inline-flex rounded-lg border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                >
                  Logout
                </button>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                    Access: {premiumState === "loading" ? "Checking..." : premiumState === "premium" ? "Premium" : "Free"}
                  </span>
                  {isAdmin ? (
                    <span className="rounded-full border border-amber-300/45 bg-amber-300/15 px-3 py-1 text-xs font-semibold text-amber-100">
                      Role: Admin
                    </span>
                  ) : null}
                  {latestPaymentState ? (
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      latestPaymentState === "approved"
                        ? "border-emerald-300/45 bg-emerald-300/15 text-emerald-100"
                        : latestPaymentState === "rejected"
                          ? "border-rose-300/45 bg-rose-300/15 text-rose-100"
                          : "border-amber-300/45 bg-amber-300/15 text-amber-100"
                    }`}>
                      Payment: {latestPaymentState === "pending" ? "Processing" : latestPaymentState}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-300/10 via-white/5 to-emerald-300/10 p-3 shadow-lg shadow-black/20">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-300/20 blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />

                  <div className="relative grid grid-cols-1 gap-3 text-center text-xs sm:grid-cols-3 sm:text-sm">
                    <div className="rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/12 to-slate-900/65 px-4 py-3 shadow-lg shadow-black/20">
                      <div className="mx-auto flex items-center justify-center">
                        <SparkIcon />
                      </div>
                      <p className="mt-1 text-slate-200">Words Learned</p>
                      <p className="mt-1 text-lg font-bold text-emerald-200">{totalWordsLearned}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/20 bg-gradient-to-br from-emerald-300/10 to-slate-900/65 px-4 py-3 shadow-lg shadow-black/20">
                      <div className="mx-auto flex items-center justify-center">
                        <FlameIcon />
                      </div>
                      <p className="mt-1 text-slate-200">Current Streak</p>
                      <p className="mt-1 text-lg font-bold text-cyan-100">7 দিন</p>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-gradient-to-br from-slate-200/10 to-slate-900/70 px-4 py-3 shadow-lg shadow-black/20">
                      <p className="text-slate-200">Plan Status</p>
                      <p className={`mt-1 text-lg font-bold ${premiumState === "premium" ? "text-emerald-200" : "text-amber-200"}`}>
                        {premiumState === "loading" ? "Checking..." : premiumState === "premium" ? "Premium" : "Free"}
                      </p>
                      {latestPaymentState ? (
                        <p className="mt-1 text-[11px] text-slate-300">
                          Payment: {latestPaymentState === "pending" ? "Processing" : latestPaymentState}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-slate-300">No payment request yet</p>
                      )}
                      {latestPaymentNote ? <p className="mt-1 text-[10px] text-slate-400">{latestPaymentNote}</p> : null}
                    </div>
                  </div>
                </div>
                {premiumState === "free" ? (
                  <div className="rounded-xl border border-cyan-200/30 bg-cyan-300/10 px-4 py-3 text-center">
                    <p className="text-xs text-slate-200">Level 2+ unlock করতে Premium লাগবে</p>
                    <Link
                      href="/payment"
                      className="mt-2 inline-flex rounded-lg border border-cyan-200/35 bg-cyan-200/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-200/24"
                    >
                      Go to Payment
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Link
              href="/core"
              className="rounded-2xl border border-cyan-200/35 bg-gradient-to-br from-cyan-300/18 via-[#2a3546]/90 to-[#1f2a38]/95 p-5 shadow-xl shadow-black/20 transition hover:border-cyan-100 hover:from-cyan-300/24 hover:to-[#24354a] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold">IELTS, SAT, Admission</h2>
                  <p className="mt-1 text-sm text-slate-200">Beginner, Intermediate, Advanced • 800 words</p>
                </div>
                <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-slate-100">
                  Open
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-200">
                  <p>Progress</p>
                  <p>{Math.round(coreProgressPercent)}%</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all"
                    style={{ width: `${coreProgressPercent}%` }}
                  />
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-center text-sm font-semibold text-cyan-100">
                Open IELTS/SAT/Admission
              </div>
            </Link>

            <Link
              href="/stage/exam"
              className="rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-300/18 via-[#3d382c]/90 to-[#252a2d]/95 p-5 shadow-xl shadow-black/20 transition hover:border-amber-200 hover:from-amber-300/24 hover:to-[#2a3236] sm:p-6"
            >
              <h2 className="text-2xl font-extrabold text-amber-200">GRE • BCS • IBA</h2>
              <p className="mt-1 text-sm text-slate-200">Competitive exam vocabulary track • 600 words</p>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-200">
                  <p>Progress</p>
                  <p>{Math.round(stageLookup.Exam?.progressPercent ?? 0)}%</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 transition-all"
                    style={{ width: `${stageLookup.Exam?.progressPercent ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-amber-300/45 bg-amber-300/15 px-4 py-2.5 text-center text-sm font-semibold text-amber-100">
                শুরু করুন
              </div>
            </Link>

            <Link
              href="/stage/spoken"
              className="rounded-2xl border border-emerald-300/35 bg-gradient-to-br from-emerald-300/16 via-[#214044]/90 to-[#1f3837]/95 p-5 shadow-xl shadow-black/20 transition hover:border-emerald-200 hover:from-emerald-300/24 hover:to-[#214245] sm:p-6"
            >
              <h2 className="text-2xl font-extrabold text-emerald-100">Basic Spoken English</h2>
              <p className="mt-1 text-sm text-slate-200">দৈনন্দিন জীবনে ব্যবহৃত 600 phrase</p>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-200">
                  <p>Progress</p>
                  <p>{Math.round(stageLookup.Spoken?.progressPercent ?? 0)}%</p>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all"
                    style={{ width: `${stageLookup.Spoken?.progressPercent ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-emerald-300/45 bg-emerald-300/15 px-4 py-2.5 text-center text-sm font-semibold text-emerald-100">
                শুরু করুন
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
