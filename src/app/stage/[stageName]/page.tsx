"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StageName = "beginner" | "intermediate" | "advanced";

const stageConfig: Record<StageName, { bengali: string; totalLevels: number }> = {
  beginner: { bengali: "শুরুর স্তর", totalLevels: 10 },
  intermediate: { bengali: "মধ্যম স্তর", totalLevels: 15 },
  advanced: { bengali: "উন্নত স্তর", totalLevels: 15 },
};

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-400"
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

export default function StagePage() {
  const params = useParams<{ stageName: string }>();
  const stageName = (params?.stageName?.toLowerCase() ?? "beginner") as StageName;

  const config = stageConfig[stageName] || stageConfig.beginner;

  const [completedLevelIds, setCompletedLevelIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const completed = new Set<string>();
    for (let i = 1; i <= config.totalLevels; i++) {
      const levelId = `${stageName}-${i}`;
      if (window.localStorage.getItem(`completed_${levelId}`) === "true") {
        completed.add(levelId);
      }
    }
    setCompletedLevelIds(completed);
  }, [stageName, config.totalLevels]);

  const unlockedLevelIds = useMemo(() => {
    const unlocked = new Set<string>();

    unlocked.add(`${stageName}-1`);

    for (let i = 2; i <= config.totalLevels; i++) {
      const previousLevelId = `${stageName}-${i - 1}`;
      if (completedLevelIds.has(previousLevelId)) {
        unlocked.add(`${stageName}-${i}`);
      }
    }

    return unlocked;
  }, [stageName, config.totalLevels, completedLevelIds]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                VocabVault
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{config.bengali}</h1>
            </div>

            <Link
              href="/dashboard"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              Dashboard এ ফিরে যান
            </Link>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: config.totalLevels }).map((_, index) => {
                const levelNumber = index + 1;
                const levelId = `${stageName}-${levelNumber}`;
                const isUnlocked = unlockedLevelIds.has(levelId);
                const isCompleted = completedLevelIds.has(levelId);

                const cardClassName = isUnlocked
                  ? "group rounded-xl border border-cyan-200/30 bg-cyan-200/10 p-4 transition hover:border-cyan-100 hover:bg-cyan-200/20"
                  : "rounded-xl border border-white/10 bg-white/5 p-4 opacity-60";

                const cardContent = (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-200">Level {levelNumber}</p>
                      {!isUnlocked ? <LockIcon /> : null}
                    </div>
                    <p className="mt-3 text-xs text-slate-300">20 words</p>
                    {isCompleted ? (
                      <p className="mt-1 text-[11px] font-semibold text-emerald-300">✓ Completed</p>
                    ) : null}
                  </>
                );

                if (isUnlocked) {
                  return (
                    <Link key={levelId} href={`/learn/${levelId}`} className={cardClassName}>
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <div key={levelId} className={cardClassName} aria-disabled="true">
                    {cardContent}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
