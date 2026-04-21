"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StageName = "Beginner" | "Intermediate" | "Advanced";

type StageConfig = {
  name: StageName;
  totalWords: number;
  totalLevels: number;
  unlockThreshold: number;
  dependsOn: StageName | null;
};

const stages: StageConfig[] = [
  { name: "Beginner", totalWords: 200, totalLevels: 10, unlockThreshold: 0, dependsOn: null },
  { name: "Intermediate", totalWords: 300, totalLevels: 15, unlockThreshold: 5, dependsOn: "Beginner" },
  { name: "Advanced", totalWords: 300, totalLevels: 15, unlockThreshold: 8, dependsOn: "Intermediate" },
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

export default function DashboardPage() {
  const [completedCount, setCompletedCount] = useState<Record<StageName, number>>({
    Beginner: 0,
    Intermediate: 0,
    Advanced: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const counts: Record<StageName, number> = { Beginner: 0, Intermediate: 0, Advanced: 0 };

    stages.forEach((stage) => {
      for (let i = 1; i <= stage.totalLevels; i++) {
        const levelId = `${stage.name.toLowerCase()}-${i}`;
        if (window.localStorage.getItem(`completed_${levelId}`) === "true") {
          counts[stage.name]++;
        }
      }
    });

    setCompletedCount(counts);
  }, []);

  const stageStatus = useMemo(() => {
    return stages.map((stage) => {
      let isLocked = false;

      if (stage.dependsOn) {
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
      completedCount.Advanced * 20
    );
  }, [completedCount]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 lg:p-10">
          <header className="border-b border-white/10 pb-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  VocabVault
                </p>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
                  আমার ড্যাশবোর্ড
                </h1>
              </div>

              <div className="flex gap-3 text-center text-xs sm:text-sm">
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                  <p className="text-slate-300">Words Learned</p>
                  <p className="mt-1 text-lg font-bold text-emerald-300">{totalWordsLearned}</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
                  <p className="text-slate-300">Current Streak</p>
                  <p className="mt-1 text-lg font-bold text-cyan-200">7 দিন</p>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stageStatus.map((stage) => {
              const buttonColor = stage.isLocked
                ? "border border-slate-500/30 bg-slate-500/20 text-slate-400 cursor-not-allowed"
                : "border border-cyan-200/30 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/20 transition";

              const cardOpacity = stage.isLocked ? "opacity-60" : "opacity-100";

              const cardContent = (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold">{stage.name}</h2>
                      <p className="mt-1 text-sm text-slate-300">
                        {stage.totalWords} words • {stage.completedCount}/{stage.totalLevels} levels
                      </p>
                    </div>
                    {stage.isLocked ? <LockIcon /> : null}
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                      <p>Progress</p>
                      <p>{Math.round(stage.progressPercent)}%</p>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all"
                        style={{ width: `${stage.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={stage.isLocked}
                    className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${buttonColor}`}
                  >
                    {stage.isLocked ? "🔒 Locked" : "শুরু করুন"}
                  </button>
                </>
              );

              if (stage.isLocked) {
                return (
                  <div
                    key={stage.name}
                    className={`rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 ${cardOpacity}`}
                  >
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link
                  key={stage.name}
                  href={`/stage/${stage.name.toLowerCase()}`}
                  className={`rounded-2xl border border-cyan-200/30 bg-cyan-200/10 p-5 transition hover:border-cyan-100 hover:bg-cyan-200/20 sm:p-6`}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
