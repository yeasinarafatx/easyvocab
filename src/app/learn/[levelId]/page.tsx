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

export default function LearnLevelPage() {
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
  const [typedValue, setTypedValue] = useState("");
  const [examMode, setExamMode] = useState(false);
  const [restartNotice, setRestartNotice] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [speechRate, setSpeechRate] = useState<0.7 | 1>(1);
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
    return () => { cancelled = true; };
  }, [stage, file]);

  const totalWords = words.length;
  const isCompleted = currentIndex >= totalWords && totalWords > 0;
  const activeWord = words[currentIndex % Math.max(words.length, 1)];
  const expectedWord = activeWord?.word?.toLowerCase() ?? "";
  const normalizedTyped = typedValue.toLowerCase();
  const isCorrect = normalizedTyped === expectedWord;

  const progressPercent = useMemo(() => {
    return (Math.min(currentIndex + 1, totalWords) / totalWords) * 100;
  }, [currentIndex, totalWords]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const preferredVoice =
        voices.find((v) => v.lang === "en-US" && (v.voiceURI.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha"))) ||
        voices.find((v) => v.name.toLowerCase().includes("samantha")) ||
        voices.find((v) => v.lang === "en-US") ||
        null;
      setSelectedVoiceURI(preferredVoice?.voiceURI ?? null);
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speakWord = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || isCompleted || !activeWord) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeWord.word);
    utterance.lang = "en-US";
    utterance.rate = speechRate;
    if (selectedVoiceURI) {
      const matchedVoice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === selectedVoiceURI);
      if (matchedVoice) utterance.voice = matchedVoice;
    }
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || isCompleted || !activeWord) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeWord.word);
    utterance.lang = "en-US";
    utterance.rate = speechRate;
    if (selectedVoiceURI) {
      const matchedVoice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === selectedVoiceURI);
      if (matchedVoice) utterance.voice = matchedVoice;
    }
    window.speechSynthesis.speak(utterance);
  }, [isCompleted, activeWord, speechRate, selectedVoiceURI]);

  useEffect(() => {
    if (!restartNotice) return;
    const t = window.setTimeout(() => setRestartNotice(false), 1800);
    return () => window.clearTimeout(t);
  }, [restartNotice]);

  useEffect(() => {
    if (!isDemoLevel || typeof window === "undefined") return;
    window.localStorage.removeItem(`completed_${levelId}`);
    window.localStorage.removeItem(`speak_completed_${levelId}`);
  }, [isDemoLevel, levelId]);

  useEffect(() => {
    if (!isDemoLevel || !isCompleted) return;
    const t = window.setTimeout(() => router.replace(backHref), 1200);
    return () => window.clearTimeout(t);
  }, [isDemoLevel, isCompleted, router, backHref]);

  const handleNext = () => {
    if (isCompleted || !activeWord) return;
    if (!isCorrect) {
      if (examMode) { setCurrentIndex(0); setTypedValue(""); setRestartNotice(true); }
      return;
    }

    const nextIndex = currentIndex + 1;
    if (examMode && nextIndex >= totalWords) {
      if (!isDemoLevel && typeof window !== "undefined") {
        window.localStorage.setItem(`completed_${levelId}`, "true");
        setShowSuccessModal(true);
      }
    }

    setTypedValue("");
    setCurrentIndex(nextIndex);
  };

  const handleRetry = () => { if (!examMode) setTypedValue(""); };

  const toggleExamMode = () => {
    setExamMode((prev) => !prev);
    setCurrentIndex(0);
    setTypedValue("");
    setRestartNotice(false);
    setShowSuccessModal(false);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center">
          <p className="text-slate-300">Loading words...</p>
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
                <p>{Math.min(currentIndex + 1, totalWords)} / {totalWords}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <Link href={backHref} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20">
              {stage === "demo" ? "Back to Demo" : "Back to Stage"}
            </Link>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setSpeechRate((prev) => (prev === 1 ? 0.7 : 1))} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20">
              {speechRate === 0.7 ? "🐢 Slow" : "⚡ Normal"}
            </button>
            <button type="button" onClick={toggleExamMode} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${examMode ? "border border-rose-300/40 bg-rose-300/20 text-rose-100 hover:bg-rose-300/30" : "border border-cyan-200/30 bg-cyan-200/10 text-cyan-100 hover:bg-cyan-200/20"}`}>
              {examMode ? "Exam Mode: ON" : "Exam Mode"}
            </button>
          </div>

          {examMode && <p className="mt-3 text-sm text-amber-200">Exam mode চালু: একটি ভুল হলেই আবার ১ নম্বর শব্দ থেকে শুরু হবে।</p>}
          {restartNotice && <p className="mt-2 text-sm font-semibold text-rose-300">ভুল হয়েছে। Exam restart: আবার ১ নম্বর শব্দ থেকে শুরু করুন।</p>}

          {!isCompleted ? (
            <>
              <div className="mt-7 rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {!examMode ? (
                      <h1 className="text-4xl font-extrabold tracking-wide sm:text-5xl">{activeWord.word}</h1>
                    ) : (
                      <div className="h-12 sm:h-14" />
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-100">{activeWord.pos}</span>
                      {!examMode && <span className="text-sm text-slate-300">{activeWord.phonetic}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={speakWord} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-lg transition hover:bg-white/20" aria-label="Play pronunciation">🔊</button>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-emerald-300">{activeWord.bangla}</p>
                <p className="mt-2 text-sm font-bold italic text-white sm:text-base">
                  {examMode ? activeWord.example.replace(new RegExp(`\\b${activeWord.word}\\b`, "gi"), "_".repeat(activeWord.word.length)) : activeWord.example}
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {activeWord.word.split("").map((char: string, index: number) => {
                    const typedChar = normalizedTyped[index];
                    let boxClass = "border-white/15 bg-white/5 text-slate-400";
                    if (typedChar !== undefined) {
                      boxClass = typedChar === char.toLowerCase()
                        ? "border-emerald-300/40 bg-emerald-300/20 text-emerald-100"
                        : "border-rose-300/40 bg-rose-300/20 text-rose-100";
                    }
                    return (
                      <div key={`${char}-${index}`} className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-bold uppercase ${boxClass}`}>
                        {typedChar ?? ""}
                      </div>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-5 w-full rounded-xl border border-white/20 bg-[#131326] px-4 py-3 text-center text-xl tracking-[0.2em] text-slate-100 outline-none caret-transparent placeholder:text-slate-500 focus:border-cyan-200/60"
                  placeholder="Type here"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                {!examMode && (
                  <button type="button" onClick={handleRetry} className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/20">Retry</button>
                )}
                <button type="button" onClick={handleNext} disabled={!isCorrect} className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-[#0f0f1a] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Completed</p>
              <h2 className="mt-2 text-3xl font-extrabold text-emerald-100">দারুণ! ২০টি শব্দ শেষ।</h2>
              <p className="mt-3 text-slate-200">
                {isDemoLevel ? `Demo সম্পন্ন হয়েছে, ${returnToDashboard ? "dashboard" : "landing page"} এ নেওয়া হচ্ছে...` : "সবগুলো ধাপ সফলভাবে সম্পন্ন হয়েছে।"}
              </p>
            </div>
          )}
        </section>
      </main>

      {showSuccessModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#16162a]/90 p-6 text-center shadow-2xl backdrop-blur-xl">
            <h3 className="text-2xl font-extrabold text-emerald-200">অভিনন্দন! পরের লেভেল আনলক হয়েছে 🎉</h3>
            <p className="mt-3 text-sm text-slate-300">আপনি Exam Mode সফলভাবে পাস করেছেন।</p>
            <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-[#0f0f1a] transition hover:brightness-110">
              Dashboard এ ফিরে যাও
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
