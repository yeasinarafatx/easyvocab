"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type StageKey = "beginner" | "intermediate" | "advanced" | "exam" | "spoken";

type StageProgressConfig = {
  key: StageKey;
  label: string;
  totalLevels: number;
};

type BadgeConfig = {
  id: number;
  name: string;
  unlockWords: number;
};

const stageConfig: StageProgressConfig[] = [
  { key: "beginner", label: "Beginner", totalLevels: 10 },
  { key: "intermediate", label: "Intermediate", totalLevels: 15 },
  { key: "advanced", label: "Advanced", totalLevels: 15 },
  { key: "exam", label: "Exam", totalLevels: 30 },
  { key: "spoken", label: "Spoken", totalLevels: 30 },
];

const badgeNames = [
  "Starter",
  "Explorer",
  "Learner",
  "Builder",
  "Climber",
  "Achiever",
  "Performer",
  "Expert",
  "Master",
  "Legend",
] as const;

const WORDS_PER_LEVEL = 20;
const TOTAL_WORD_TARGET = stageConfig.reduce((sum, stage) => sum + stage.totalLevels * WORDS_PER_LEVEL, 0);
const WORDS_PER_BADGE = Math.ceil(TOTAL_WORD_TARGET / 10);

export default function BadgesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [completedByStage, setCompletedByStage] = useState<Record<StageKey, number>>({
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    exam: 0,
    spoken: 0,
  });

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      if (typeof window !== "undefined") {
        const counts: Record<StageKey, number> = {
          beginner: 0,
          intermediate: 0,
          advanced: 0,
          exam: 0,
          spoken: 0,
        };

        stageConfig.forEach((stage) => {
          for (let i = 1; i <= stage.totalLevels; i++) {
            const levelId = `${stage.key}-${i}`;
            if (window.localStorage.getItem(`completed_${levelId}`) === "true") {
              counts[stage.key] += 1;
            }
          }
        });

        setCompletedByStage(counts);
      }

      setReady(true);
    };

    init();

    return () => {
      mounted = false;
    };
  }, [router]);

  const completedLevels = useMemo(() => {
    return Object.values(completedByStage).reduce((sum, count) => sum + count, 0);
  }, [completedByStage]);

  const learnedWords = completedLevels * WORDS_PER_LEVEL;

  const unlockedBadgeCount = useMemo(() => {
    return Math.min(10, Math.floor(learnedWords / WORDS_PER_BADGE));
  }, [learnedWords]);

  const currentBadgeNumber = useMemo(() => {
    if (unlockedBadgeCount >= 10) return 10;
    return unlockedBadgeCount + 1;
  }, [unlockedBadgeCount]);

  const nextBadgeTargetWords = useMemo(() => {
    if (unlockedBadgeCount >= 10) return TOTAL_WORD_TARGET;
    return (unlockedBadgeCount + 1) * WORDS_PER_BADGE;
  }, [unlockedBadgeCount]);

  const wordsNeededForNextBadge = useMemo(() => {
    if (unlockedBadgeCount >= 10) return 0;
    return Math.max(0, nextBadgeTargetWords - learnedWords);
  }, [unlockedBadgeCount, nextBadgeTargetWords, learnedWords]);

  const badges: BadgeConfig[] = useMemo(() => {
    return badgeNames.map((name, index) => ({
      id: index + 1,
      name,
      unlockWords: (index + 1) * WORDS_PER_BADGE,
    }));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
        <p className="text-sm">Badges লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-[#122531]/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Achievement Track</p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Your Badges</h1>
              <p className="mt-2 text-sm text-slate-300">10টা badge sequentially unlock হবে completed level অনুযায়ী।</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Dashboard এ ফিরে যান
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-cyan-200/30 bg-cyan-300/10 p-4">
              <p className="text-xs text-slate-300">Unlocked</p>
              <p className="mt-1 text-2xl font-extrabold text-cyan-100">{unlockedBadgeCount}/10</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/30 bg-emerald-300/10 p-4">
              <p className="text-xs text-slate-300">Current Badge</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-100">#{currentBadgeNumber}</p>
            </div>
            <div className="rounded-2xl border border-violet-200/30 bg-violet-300/10 p-4">
              <p className="text-xs text-slate-300">Learned Words</p>
              <p className="mt-1 text-2xl font-extrabold text-violet-100">{learnedWords}/{TOTAL_WORD_TARGET}</p>
            </div>
            <div className="rounded-2xl border border-amber-200/30 bg-amber-300/10 p-4">
              <p className="text-xs text-slate-300">Next Badge In</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-100">{wordsNeededForNextBadge}</p>
              <p className="mt-1 text-[11px] text-amber-200">words</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {badges.map((badge) => {
              const isUnlocked = learnedWords >= badge.unlockWords;
              const isCurrent = !isUnlocked && badge.id === currentBadgeNumber;

              const cardClass = isUnlocked
                ? "border-emerald-200/40 bg-gradient-to-br from-emerald-300/18 to-[#223a30]/95"
                : isCurrent
                  ? "border-cyan-200/45 bg-gradient-to-br from-cyan-300/18 to-[#233848]/95"
                  : "border-white/15 bg-gradient-to-br from-slate-600/12 to-slate-900/80";

              return (
                <div key={badge.id} className={`rounded-xl border p-4 text-center ${cardClass}`}>
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    {isUnlocked ? (
                      <img src="/icons/premium/trophy-front-premium.svg" alt="Unlocked" className="h-5 w-5" />
                    ) : isCurrent ? (
                      <img src="/icons/premium/medal-front-color.svg" alt="Current" className="h-5 w-5" />
                    ) : (
                      <img src="/icons/premium/lock-front-color.svg" alt="Locked" className="h-5 w-5" />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-bold text-slate-100">Badge {badge.id}</p>
                  <p className="mt-1 text-xs text-slate-300">{badge.name}</p>
                  <p className="mt-2 text-[11px] text-slate-400">Unlock at {badge.unlockWords} words</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-200">
                    {isUnlocked ? "Unlocked" : isCurrent ? "Current" : "Locked"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
