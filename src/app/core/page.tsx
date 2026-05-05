"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CoreLevelKey = "Beginner" | "Intermediate" | "Advanced";

const coreLevels: Array<{
  key: CoreLevelKey;
  title: string;
  description: string;
  href: string;
  totalLevels: number;
  unlockText: string;
  accent: string;
}> = [
  {
    key: "Beginner",
    title: "Beginner",
    description: "Daily words and easy core practice",
    href: "/stage/beginner",
    totalLevels: 10,
    unlockText: "এই module open করতে কিছু unlock লাগবে না",
    accent: "from-cyan-300 to-emerald-300",
  },
  {
    key: "Intermediate",
    title: "Intermediate",
    description: "Build confidence with stronger lessons",
    href: "/stage/intermediate",
    totalLevels: 15,
    unlockText: "Beginner-এর 5টি level complete করলে unlock হবে",
    accent: "from-cyan-300 to-sky-300",
  },
  {
    key: "Advanced",
    title: "Advanced",
    description: "Complete the final core English track",
    href: "/stage/advanced",
    totalLevels: 15,
    unlockText: "Intermediate-এর 8টি level complete করলে unlock হবে",
    accent: "from-cyan-300 to-violet-300",
  },
];

export default function CorePage() {
  const [completedCount, setCompletedCount] = useState<Record<CoreLevelKey, number>>({
    Beginner: 0,
    Intermediate: 0,
    Advanced: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const counts: Record<CoreLevelKey, number> = {
      Beginner: 0,
      Intermediate: 0,
      Advanced: 0,
    };

    for (let i = 1; i <= 10; i++) {
      if (window.localStorage.getItem(`completed_beginner-${i}`) === "true") counts.Beginner++;
    }
    for (let i = 1; i <= 15; i++) {
      if (window.localStorage.getItem(`completed_intermediate-${i}`) === "true") counts.Intermediate++;
    }
    for (let i = 1; i <= 15; i++) {
      if (window.localStorage.getItem(`completed_advanced-${i}`) === "true") counts.Advanced++;
    }

    setCompletedCount(counts);
  }, []);

  const overallProgress = useMemo(() => {
    return ((completedCount.Beginner + completedCount.Intermediate + completedCount.Advanced) / 40) * 100;
  }, [completedCount]);

  const intermediateUnlocked = completedCount.Beginner >= 5;
  const advancedUnlocked = completedCount.Intermediate >= 8;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-[#122531]/70 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Vocab Speak</p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">IELTS, SAT, Admission</h1>
              <p className="mt-2 text-sm text-slate-100">Beginner, Intermediate, Advanced আলাদা clean page</p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Dashboard এ ফিরে যান
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-cyan-200/35 bg-gradient-to-br from-cyan-300/18 to-[#2b3b4a]/90 p-4 shadow-xl shadow-black/20 sm:p-5">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-200 sm:text-xs">
              <p>Overall Progress</p>
              <p>{Math.round(overallProgress)}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/15">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {coreLevels.map((level) => {
              const isLocked =
                level.key === "Beginner"
                  ? false
                  : level.key === "Intermediate"
                    ? !intermediateUnlocked
                    : !advancedUnlocked;

              const completed = completedCount[level.key];
              const progressPercent = (completed / level.totalLevels) * 100;

              if (isLocked) {
                return (
                  <div
                    key={level.key}
                    className="rounded-2xl border border-slate-400/30 bg-gradient-to-br from-slate-500/20 to-slate-900/70 p-4 shadow-lg shadow-black/20 sm:p-5"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Core Track</p>
                    <h2 className="mt-3 text-xl font-extrabold text-slate-100 sm:text-2xl">{level.title}</h2>
                    <p className="mt-2 text-xs text-slate-300 sm:text-sm">{level.description}</p>
                    <p className="mt-3 text-xs text-slate-300">{level.unlockText}</p>
                    <div className="mt-4 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-center text-sm font-semibold text-slate-300">
                      Locked
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={level.key}
                  href={level.href}
                  className="rounded-2xl border border-cyan-200/35 bg-gradient-to-br from-cyan-300/18 via-[#2a3546]/90 to-[#1f2a38]/95 p-4 shadow-xl shadow-black/20 transition hover:border-cyan-100 hover:from-cyan-300/24 hover:to-[#23384a] sm:p-5"
                >
                  <div className={`h-1 w-14 rounded-full bg-gradient-to-r ${level.accent}`} />
                  <h2 className="mt-3 text-xl font-extrabold text-slate-50 sm:text-2xl">{level.title}</h2>
                  <p className="mt-2 text-xs text-slate-200 sm:text-sm">{level.description}</p>

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-[11px] text-slate-200 sm:text-xs">
                      <p>Progress</p>
                      <p>{Math.round(progressPercent)}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-center text-sm font-semibold text-cyan-100">
                    Open {level.title}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
