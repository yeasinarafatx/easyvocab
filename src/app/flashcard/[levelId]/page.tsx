"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface Word {
  word: string;
  pos: string;
  phonetic: string;
  bangla: string;
  example: string;
}

type CardMode = "english-to-bangla" | "bangla-to-english";

export default function FlashcardLevelPage() {
  const params = useParams<{ levelId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelId = params?.levelId ?? "beginner-1";

  const parts = levelId.split("-");
  const stage = parts[0] ?? "beginner";
  const levelNumber = Number(parts[1] ?? "1");
  const file = `level_${String(Number.isFinite(levelNumber) ? levelNumber : 1).padStart(2, "0")}`;
  const isDemoLevel = stage === "demo";
  const returnToDashboard = searchParams.get("from") === "dashboard";
  const backHref = returnToDashboard ? "/dashboard" : stage === "demo" ? "/demo" : `/stage/${stage}`;

  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardMode, setCardMode] = useState<CardMode>("english-to-bangla");
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadWords = async () => {
      try {
        setIsLoading(true);
        const data = await import(`@/data/${stage}/${file}.json`);
        if (!cancelled) setWords((data.default ?? []) as Word[]);
      } catch {
        if (!cancelled) setWords([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadWords();

    return () => {
      cancelled = true;
    };
  }, [stage, file]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        return;
      }

      const preferredVoice =
        voices.find(
          (voice) =>
            voice.lang === "en-US" &&
            (voice.voiceURI.toLowerCase().includes("female") ||
              voice.name.toLowerCase().includes("samantha")),
        ) ||
        voices.find((voice) => voice.name.toLowerCase().includes("samantha")) ||
        voices.find((voice) => voice.lang === "en-US") ||
        null;

      setSelectedVoiceURI(preferredVoice?.voiceURI ?? null);
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const totalWords = words.length;
  const isCompleted = totalWords > 0 && currentIndex >= totalWords;
  const activeWord = !isCompleted ? words[currentIndex] : undefined;

  const progressPercent = useMemo(() => {
    if (totalWords === 0) {
      return 0;
    }

    return (Math.min(currentIndex + 1, totalWords) / totalWords) * 100;
  }, [currentIndex, totalWords]);

  useEffect(() => {
    if (!isDemoLevel || typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(`completed_${levelId}`);
  }, [isDemoLevel, levelId]);

  useEffect(() => {
    if (!isDemoLevel || !isCompleted) {
      return;
    }

    const t = window.setTimeout(() => router.replace(backHref), 1200);
    return () => window.clearTimeout(t);
  }, [isDemoLevel, isCompleted, router, backHref]);

  const speakWord = () => {
    if (!activeWord || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeWord.word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    if (selectedVoiceURI) {
      const matchedVoice = window.speechSynthesis
        .getVoices()
        .find((voice) => voice.voiceURI === selectedVoiceURI);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center">
          <p className="text-slate-300">Loading flashcards...</p>
        </main>
      </div>
    );
  }

  if (!activeWord) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center">
          <p className="text-slate-300">কোনো শব্দ পাওয়া যায়নি।</p>
        </main>
      </div>
    );
  }

  const frontLabel = cardMode === "english-to-bangla" ? "English Word" : "বাংলা অর্থ";
  const backLabel = cardMode === "english-to-bangla" ? "বাংলা অর্থ" : "English Word";
  const frontValue = cardMode === "english-to-bangla" ? activeWord.word : activeWord.bangla;
  const backValue = cardMode === "english-to-bangla" ? activeWord.bangla : activeWord.word;
  const frontValueClass =
    cardMode === "bangla-to-english"
      ? "mt-4 text-4xl font-extrabold text-emerald-300 sm:text-5xl"
      : "mt-4 text-3xl font-extrabold text-slate-50 sm:text-4xl";
  const backValueClass =
    cardMode === "english-to-bangla"
      ? "mt-4 text-4xl font-extrabold text-emerald-300 sm:text-5xl"
      : "mt-4 text-4xl font-extrabold text-emerald-200 sm:text-5xl";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[220px] flex-1">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300 sm:text-sm">
                <p>Progress</p>
                <p>
                  {Math.min(currentIndex + 1, totalWords)} / {totalWords}
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <Link
              href={backHref}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
            >
              {stage === "demo" ? "Back to Demo" : "Back to Stage"}
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => {
                  setCardMode("english-to-bangla");
                  setIsFlipped(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  cardMode === "english-to-bangla"
                    ? "bg-cyan-300/25 text-cyan-100"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                EN → BN
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardMode("bangla-to-english");
                  setIsFlipped(false);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  cardMode === "bangla-to-english"
                    ? "bg-emerald-300/25 text-emerald-100"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                BN → EN
              </button>
            </div>
            <button
              type="button"
              onClick={speakWord}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-lg transition hover:bg-white/20"
              aria-label="Play pronunciation"
            >
              🔊
            </button>
          </div>

          <div className="mt-6 cursor-pointer" onClick={() => setIsFlipped((prev) => !prev)}>
            <div className="relative h-72 w-full rounded-3xl border border-emerald-300/30 bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 p-6 shadow-xl transition-transform duration-300">
              <div className="flex h-full flex-col items-center justify-center text-center">
                {!isFlipped ? (
                  <>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">{frontLabel}</p>
                    <h1 className={frontValueClass}>{frontValue}</h1>
                    <p className="mt-4 text-sm text-slate-300">Click করে answer দেখুন</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">{backLabel}</p>
                    <h1 className={backValueClass}>{backValue}</h1>
                    {cardMode === "english-to-bangla" ? null : (
                      <p className="mt-3 text-sm text-slate-300">{activeWord.phonetic}</p>
                    )}
                    <p className="mt-4 text-sm font-bold text-white sm:text-base">{activeWord.example}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex((prev) => Math.max(prev - 1, 0));
                setIsFlipped(false);
              }}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Previous
            </button>

            <button
              type="button"
              disabled={currentIndex >= totalWords - 1}
              onClick={() => {
                setCurrentIndex((prev) => Math.min(prev + 1, totalWords));
                setIsFlipped(false);
              }}
              className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
