"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { trackMetaEvent } from "@/lib/metaPixel";

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

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userName, setUserName] = useState("");
  const [premiumState, setPremiumState] = useState<PremiumState>("loading");
  const [latestPaymentState, setLatestPaymentState] = useState<PaymentState>(null);
  const [latestPaymentNote, setLatestPaymentNote] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastStudiedTime, setLastStudiedTime] = useState<string | null>(null);
  const [accuracyPercent, setAccuracyPercent] = useState<number | null>(null);

  const refreshStatus = async (userId: string) => {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 10000)
      );

      const queryPromise = Promise.all([
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

      const [{ data: profile, error: profileError }, { data: latestPayment, error: paymentError }, { data: adminRow, error: adminError }] = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]) as any;

      // Handle errors gracefully
      if (profileError) {
        console.error("Profile error:", profileError);
        setPremiumState("free");
      } else {
        setPremiumState(profile?.is_premium ? "premium" : "free");
      }

      if (paymentError) {
        console.error("Payment error:", paymentError);
        setLatestPaymentState(null);
      } else {
        setLatestPaymentState((latestPayment?.status as PaymentState) ?? null);
        setLatestPaymentNote(latestPayment?.review_note ?? null);
      }

      if (adminError) {
        console.error("Admin error:", adminError);
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean(adminRow?.user_id));
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
      // Keep existing state on error
    }
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
    }, 30000); // Increased from 15000 to 30000 to reduce server load on free tier

    return () => window.clearInterval(timer);
  }, [authChecked]);

  useEffect(() => {
    if (!authChecked || typeof window === "undefined") return;

    // Calculate Last Studied Time
    let latestTimestamp = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("study_timestamp_")) {
        const ts = parseInt(window.localStorage.getItem(key) || "0", 10);
        if (ts > latestTimestamp) latestTimestamp = ts;
      }
    }

    if (latestTimestamp > 0) {
      const lastDate = new Date(latestTimestamp);
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeStr = "";
      if (diffMins < 1) timeStr = "Just now";
      else if (diffMins < 60) timeStr = `${diffMins}m ago`;
      else if (diffHours < 24) timeStr = `${diffHours}h ago`;
      else if (diffDays === 1) timeStr = "Yesterday";
      else if (diffDays < 7) timeStr = `${diffDays}d ago`;
      else timeStr = lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      setLastStudiedTime(timeStr);
    }

    // Calculate Accuracy Percentage from exam attempts
    let totalAttempts = 0;
    let correctAttempts = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith("exam_attempt_")) {
        const attempt = JSON.parse(window.localStorage.getItem(key) || "{}");
        totalAttempts++;
        if (attempt.correct) correctAttempts++;
      }
    }

    if (totalAttempts > 0) {
      const accuracy = Math.round((correctAttempts / totalAttempts) * 100);
      setAccuracyPercent(accuracy);
    }
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
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
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
                <h1 className="mt-0 text-3xl font-extrabold leading-tight sm:text-4xl">
                  <span className="mt-0 block text-emerald-300">{userName}</span>
                </h1>

                <p className="mt-4 inline-flex rounded-full border border-cyan-200/25 bg-cyan-300/10 px-4 py-1.5 text-sm font-semibold text-cyan-100 sm:text-base">
                  শেখা শুরু করুন
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/"
                    className="inline-flex rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
                  >
                    Product Page
                  </Link>
                  <Link
                    href="/payment"
                    onClick={() => trackMetaEvent("Lead", { content_name: "Dashboard Payment CTA" })}
                    className="inline-flex rounded-lg border border-cyan-200/35 bg-cyan-200/12 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-200/20"
                  >
                    Payment
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin/reviews"
                      className="inline-flex rounded-lg border border-amber-300/35 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/20"
                    >
                      Admin Review
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex rounded-lg border border-red-300/30 bg-red-300/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-300/20"
                  >
                    Logout
                  </button>
                </div>

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

              <div className="space-y-4">
                {/* Premium Badge - Top Right of Stats Section */}
                {premiumState !== "loading" && (
                  <div className="flex justify-end">
                    <div className="rounded-full border px-3 py-1 text-xs font-semibold" style={{
                      borderColor: premiumState === "premium" ? "rgb(16 185 129 / 0.45)" : "rgb(217 119 6 / 0.45)",
                      backgroundColor: premiumState === "premium" ? "rgb(16 185 129 / 0.15)" : "rgb(217 119 6 / 0.15)",
                      color: premiumState === "premium" ? "rgb(167 243 208)" : "rgb(254 215 170)"
                    }}>
                      <span className="inline-flex items-center gap-1">
                        <img src="/icons/premium/medal-front-color.svg" alt="Premium" className="h-4 w-4" />
                        {premiumState === "premium" ? "Premium" : "Free"}
                      </span>
                    </div>
                  </div>
                )}
                
                  <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-300/10 via-white/5 to-emerald-300/10 p-3 shadow-lg shadow-black/20 sm:p-4">
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cyan-300/20 blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-emerald-300/20 blur-2xl" />

                  <div className="relative grid grid-cols-3 gap-3 text-center text-[10px] leading-tight sm:gap-4 sm:text-xs">
                    <div className="rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/12 to-slate-900/65 px-2 py-2 shadow-lg shadow-black/20 sm:px-3 sm:py-3">
                      <div className="mx-auto flex items-center justify-center">
                        <img src="/icons/premium/star-front-premium.svg" alt="Words learned" className="h-5 w-5" />
                      </div>
                      <p className="mt-1 text-slate-100">Words Learned</p>
                      <p className="mt-1 text-sm font-bold text-emerald-200 sm:text-lg">{totalWordsLearned}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/20 bg-gradient-to-br from-emerald-300/10 to-slate-900/65 px-2 py-2 shadow-lg shadow-black/20 sm:px-3 sm:py-3">
                      <div className="mx-auto flex items-center justify-center">
                        <img src="/icons/premium/clock-front-premium.svg" alt="Last studied" className="h-5 w-5" />
                      </div>
                      <p className="mt-1 text-slate-100">Last Studied</p>
                      <p className="mt-1 text-sm font-bold text-violet-100 sm:text-lg">{lastStudiedTime ?? "Never"}</p>
                    </div>
                    <div className="rounded-xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/12 to-slate-900/65 px-2 py-2 shadow-lg shadow-black/20 sm:px-3 sm:py-3">
                      <div className="mx-auto flex items-center justify-center">
                        <img src="/icons/premium/trophy-front-premium.svg" alt="Accuracy" className="h-5 w-5" />
                      </div>
                      <p className="mt-1 text-slate-100">Accuracy</p>
                      <p className="mt-1 text-sm font-bold text-amber-100 sm:text-lg">{accuracyPercent !== null ? `${accuracyPercent}%` : "N/A"}</p>
                    </div>
                  </div>
                </div>
                {premiumState === "free" ? (
                  <div className="rounded-xl border border-cyan-200/30 bg-cyan-300/10 px-4 py-3 text-center">
                    <p className="text-xs text-slate-100">Level 2+ unlock করতে Premium লাগবে</p>
                    <Link
                      href="/payment"
                      onClick={() => trackMetaEvent("Lead", { content_name: "Dashboard Go To Payment" })}
                      className="mt-2 inline-flex rounded-lg border border-cyan-200/35 bg-cyan-200/15 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-200/24"
                    >
                      Go to Payment
                    </Link>
                  </div>
                ) : null}
                {latestPaymentState === "pending" && (
                  <div className="rounded-xl border border-amber-300/45 bg-amber-300/15 px-4 py-3 text-center text-xs text-amber-200">
                    <p className="font-semibold">⏳ Payment Processing</p>
                    {latestPaymentNote && <p className="mt-1 text-[11px]">{latestPaymentNote}</p>}
                  </div>
                )}
                {latestPaymentState === "rejected" && (
                  <div className="rounded-xl border border-rose-300/45 bg-rose-300/15 px-4 py-3 text-center text-xs text-rose-200">
                    <p className="font-semibold">❌ Payment Rejected</p>
                    {latestPaymentNote && <p className="mt-1 text-[11px]">{latestPaymentNote}</p>}
                  </div>
                )}
                {latestPaymentState === "approved" && (
                  <div className="rounded-xl border border-emerald-300/45 bg-emerald-300/15 px-4 py-3 text-center text-xs text-emerald-200">
                    <p className="font-semibold">✓ Payment Approved</p>
                    {latestPaymentNote && <p className="mt-1 text-[11px]">{latestPaymentNote}</p>}
                  </div>
                )}
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
                  <p className="mt-1 text-sm text-slate-100">Beginner, Intermediate, Advanced • 800 words</p>
                </div>
                <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-slate-100">
                  Open
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-100">
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
              <p className="mt-1 text-sm text-slate-100">Competitive exam vocabulary track • 600 words</p>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-100">
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
              <p className="mt-1 text-sm text-slate-100">দৈনন্দিন জীবনে ব্যবহৃত 600 phrase</p>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-100">
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

          <div className="mt-8 border-t border-white/10 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">📚 Resources</h3>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/share/17SRhrV411/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-100 hover:bg-white/10 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <path d="M22 12C22 6.477 17.523 2 12 2S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.877v-6.99H7.898v-2.887h2.54V9.797c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.242 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.887h-2.33V21.88C18.343 21.128 22 16.991 22 12z" fill="currentColor"/>
                  </svg>
                  <span>Share</span>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Link
                href="/resources/free"
                className="rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-cyan-300/18 via-[#2a3546]/90 to-[#1f2a38]/95 p-5 shadow-xl shadow-black/20 transition hover:border-cyan-100 hover:from-cyan-300/24 hover:to-[#24354a]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/35 bg-cyan-300/12 shadow-lg shadow-cyan-300/10">
                  <img src="/icons/premium/fav-folder-front-premium.svg" alt="Free Resources" className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-cyan-200">🎁 Free Resources</h3>
                <p className="mt-2 text-sm text-slate-300">বিনামূল্যে PDF এবং ebook সংগ্রহ</p>
                <div className="mt-4 rounded-lg border border-cyan-300/45 bg-cyan-300/15 px-4 py-2.5 text-center text-sm font-semibold text-cyan-100">
                  Download Now
                </div>
              </Link>

              <Link
                href="/resources/paid"
                className="rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-300/18 via-[#3d382c]/90 to-[#252a2d]/95 p-5 shadow-xl shadow-black/20 transition hover:border-amber-200 hover:from-amber-300/24 hover:to-[#2a3236]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-300/12 shadow-lg shadow-amber-300/10">
                  <img src="/icons/premium/trophy-front-premium.svg" alt="Premium Resources" className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-amber-200">Premium Resources</h3>
                <p className="mt-2 text-sm text-slate-300">প্রিমিয়াম সদস্যদের জন্য বিশেষ সামগ্রী</p>
                <div className="mt-4 rounded-lg border border-amber-300/45 bg-amber-300/15 px-4 py-2.5 text-center text-sm font-semibold text-amber-100">
                  {premiumState === "premium" ? "Access Now" : "Upgrade for Access"}
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
