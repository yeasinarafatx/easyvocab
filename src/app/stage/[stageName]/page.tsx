"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type StageName = "beginner" | "intermediate" | "advanced" | "exam" | "spoken";
type PracticeMode = "typing" | "speaking" | "flashcard";

const stageConfig: Record<StageName, { bengali: string; totalLevels: number }> = {
  beginner: { bengali: "শুরুর স্তর", totalLevels: 10 },
  intermediate: { bengali: "মধ্যম স্তর", totalLevels: 15 },
  advanced: { bengali: "উন্নত স্তর", totalLevels: 15 },
  exam: { bengali: "পরীক্ষার প্রস্তুতি", totalLevels: 30 },
  spoken: { bengali: "Spoken English", totalLevels: 30 },
};

const examLevelCategories = [
  ...Array(10).fill("GRE"),
  ...Array(10).fill("BCS"),
  ...Array(10).fill("Bank"),
];

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
  const [selectedMode, setSelectedMode] = useState<PracticeMode>("typing");

  const config = stageConfig[stageName] || stageConfig.beginner;

  const completedLevelIds = useMemo(() => {
    if (typeof window === "undefined") {
      return new Set<string>();
    }

    const completed = new Set<string>();
    for (let i = 1; i <= config.totalLevels; i++) {
      const levelId = `${stageName}-${i}`;
      const typingCompleted = window.localStorage.getItem(`completed_${levelId}`) === "true";
      const speakingCompleted = window.localStorage.getItem(`speak_completed_${levelId}`) === "true";

      const isCompletedForMode =
        selectedMode === "speaking"
          ? speakingCompleted || typingCompleted
          : typingCompleted;

      if (isCompletedForMode) {
        completed.add(levelId);
      }
    }
    return completed;
  }, [stageName, config.totalLevels, selectedMode]);

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

  const getModeHref = (levelId: string) => {
    if (selectedMode === "speaking") return `/speak/${levelId}`;
    if (selectedMode === "flashcard") return `/flashcard/${levelId}`;
    return `/learn/${levelId}`;
  };

  const modeLabel =
    selectedMode === "typing"
      ? "Typing"
      : selectedMode === "speaking"
        ? "Speaking"
        : "Flashcard";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
        <section className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Easy Vocab
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">{config.bengali}</h1>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode("typing")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedMode === "typing"
                    ? "border border-cyan-200/40 bg-cyan-200/25 text-cyan-50"
                    : "border border-cyan-200/30 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/20"
                }`}
              >
                📝 Typing Practice
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("speaking")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedMode === "speaking"
                    ? "border border-violet-300/40 bg-violet-300/25 text-violet-50"
                    : "border border-violet-300/30 bg-violet-300/10 text-violet-200 hover:bg-violet-300/20"
                }`}
              >
                🎤 Speaking Practice
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("flashcard")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  selectedMode === "flashcard"
                    ? "border border-emerald-300/40 bg-emerald-300/25 text-emerald-50"
                    : "border border-emerald-300/30 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20"
                }`}
              >
                🎴 Flashcard Practice
              </button>
              <Link
                href="/dashboard"
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
              >
                Dashboard এ ফিরে যান
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm text-slate-300">
              Selected mode: <span className="font-semibold text-emerald-200">{modeLabel}</span> • এখন unlocked level-এ click করুন।
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: config.totalLevels }).map((_, index) => {
                const levelNumber = index + 1;
                const levelId = `${stageName}-${levelNumber}`;
                const isUnlocked = unlockedLevelIds.has(levelId);
                const isCompleted = completedLevelIds.has(levelId);
                const categoryLabel = stageName === "exam"
                  ? (examLevelCategories[levelNumber - 1] ?? "General")
                  : null;

                const cardClassName = isUnlocked
                  ? "group rounded-xl border border-cyan-200/30 bg-cyan-200/10 p-4 transition hover:border-cyan-100 hover:bg-cyan-200/20"
                  : "rounded-xl border border-white/10 bg-white/5 p-4 opacity-60";

                const cardContent = (
                  <>
                    {categoryLabel ? (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/90">{categoryLabel}</p>
                    ) : null}
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
                    <Link key={levelId} href={getModeHref(levelId)} className={cardClassName}>
                      {categoryLabel ? (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/90">{categoryLabel}</p>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-200">Level {levelNumber}</p>
                        {isCompleted ? (
                          <p className="text-[11px] font-semibold text-emerald-300">✓ Completed</p>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs text-slate-300">20 words</p>
                      <p className="mt-4 inline-flex rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-slate-200">
                        Open with {modeLabel}
                      </p>
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
