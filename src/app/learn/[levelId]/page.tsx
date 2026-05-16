"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import PremiumLockedNotice from "@/components/PremiumLockedNotice";
import { fetchPremiumSnapshot, requiresPremium } from "@/lib/premium";
import { useWordData } from "@/lib/useWordData";
import CustomKeyboard from "@/components/CustomKeyboard";

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedValue, setTypedValue] = useState("");
  const [showCustomKeyboard, setShowCustomKeyboard] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [restartNotice, setRestartNotice] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [speechRate, setSpeechRate] = useState<0.7 | 1>(1);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [accessReady, setAccessReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const needsPremium = requiresPremium(levelNumber, isDemoLevel);
  const { words, isLoading, error, retry } = useWordData(stage, file);

  useEffect(() => {
    let mounted = true;

    const loadPremiumState = async () => {
      if (!needsPremium) {
        setAccessReady(true);
        return;
      }

      const snapshot = await fetchPremiumSnapshot();
      if (!mounted) return;
      setHasSession(snapshot.hasSession);
      setIsPremium(snapshot.isPremium);
      setAccessReady(true);
    };

    loadPremiumState();
    return () => {
      mounted = false;
    };
  }, [needsPremium]);

  const totalWords = words.length;
  const isCompleted = currentIndex >= totalWords && totalWords > 0;
  const activeWord = words[currentIndex % Math.max(words.length, 1)];
  const expectedWord = activeWord?.word?.toLowerCase() ?? "";
  const normalizedTyped = typedValue.toLowerCase();
  const isCorrect = normalizedTyped === expectedWord;

  const handleCustomKeyPress = (key: string) => {
    setTypedValue((prev) => (prev + key).slice(0, expectedWord.length));
  };

  const handleCustomBackspace = () => {
    setTypedValue((prev) => prev.slice(0, -1));
  };

  const handleCustomEnter = () => {
    if (isCorrect && !isCompleted) {
      handleNext();
    }
  };

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
    // Refocus input after speech ends to keep keyboard open
    utterance.onend = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };
    window.speechSynthesis.speak(utterance);
    // Immediately refocus to prevent keyboard dismissal
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
    try {
      window.localStorage.removeItem(`completed_${levelId}`);
      window.localStorage.removeItem(`speak_completed_${levelId}`);
    } catch (e) {
      console.warn("localStorage cleanup error", e);
    }
  }, [isDemoLevel, levelId]);

  useEffect(() => {
    if (!isDemoLevel || !isCompleted) return;
    let mounted = true;
    const t = window.setTimeout(() => {
      if (mounted) router.replace(backHref);
    }, 1200);
    return () => {
      mounted = false;
      window.clearTimeout(t);
    };
  }, [isDemoLevel, isCompleted, router, backHref]);

  const handleNext = () => {
    if (!activeWord) return;
    if (!isCorrect) {
      if (examMode) { setCurrentIndex(0); setTypedValue(""); setRestartNotice(true); }
      return;
    }
    // Record a study timestamp whenever the user answers correctly (counts as practice).
    // Do not record for demo levels. This ensures "Last Studied" reflects actual practice,
    // not just opening/unlocking a level.
    if (!isDemoLevel && typeof window !== "undefined") {
      try {
        const now = new Date().getTime();
        window.localStorage.setItem(`study_timestamp_${levelId}`, now.toString());
      } catch (e) {
        console.warn("Could not write study timestamp", e);
      }
    }

    const nextIndex = currentIndex + 1;
    const isLevelComplete = nextIndex >= totalWords;

    if (isLevelComplete && examMode) {
      if (!isDemoLevel && typeof window !== "undefined") {
        // Set completion timestamp
        const now = new Date().getTime();
        window.localStorage.setItem(`study_timestamp_${levelId}`, now.toString());
        window.localStorage.setItem(`completed_${levelId}`, "true");
        
        // Track exam attempt as correct
        const attemptKey = `exam_attempt_${Date.now()}`;
        window.localStorage.setItem(attemptKey, JSON.stringify({ correct: true, timestamp: now }));
      }
      // Show success modal and update index
      setShowSuccessModal(true);
      setCurrentIndex(nextIndex);
      setTypedValue("");
    } else if (isLevelComplete && !examMode && !isDemoLevel && typeof window !== "undefined") {
      // Track for regular practice mode
      const now = new Date().getTime();
      window.localStorage.setItem(`study_timestamp_${levelId}`, now.toString());
      setTypedValue("");
      setCurrentIndex(nextIndex);
    } else {
      // Normal progression
      setTypedValue("");
      setCurrentIndex(nextIndex);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isCorrect && !isCompleted) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleRetry = () => { if (!examMode) setTypedValue(""); };

  const handleGoToNextLevel = () => {
    const nextLevelNumber = levelNumber + 1;
    const nextLevelId = `${stage}-${nextLevelNumber}`;
    router.push(`/learn/${nextLevelId}`);
  };

  const toggleExamMode = () => {
    setExamMode((prev) => !prev);
    setCurrentIndex(0);
    setTypedValue("");
    setRestartNotice(false);
    setShowSuccessModal(false);
  };

  // Refs and handlers to make the input keyboard-safe on mobile.
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const iv = inputRef.current;
    if (!iv) return;

    const onFocus = () => {
      // If visualViewport exists, adjust bottom padding so keyboard doesn't cover input
      const vv: any = (typeof window !== "undefined" && (window as any).visualViewport) || null;
      let resizeHandler: (() => void) | null = null;

      if (vv && mainRef.current) {
        resizeHandler = () => {
          const bottomPad = Math.max(0, window.innerHeight - vv.height);
          // apply padding to the main container so content is pushed above keyboard
          mainRef.current!.style.paddingBottom = `${bottomPad + 20}px`;
        };
        vv.addEventListener("resize", resizeHandler);
        // initial adjust
        resizeHandler();
      }

      // scroll input into view
      setTimeout(() => {
        try { iv.scrollIntoView({ behavior: "smooth", block: "center" }); } catch { /* ignore */ }
      }, 50);

      const onBlur = () => {
        if (vv && resizeHandler && mainRef.current) {
          vv.removeEventListener("resize", resizeHandler!);
          mainRef.current.style.paddingBottom = "";
        }
      };

      iv.addEventListener("blur", onBlur, { once: true });
    };

    iv.addEventListener("focus", onFocus);
    return () => iv.removeEventListener("focus", onFocus);
  }, [inputRef, mainRef]);

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

  if (error && words.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
          <div className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-6 text-center">
            <p className="text-rose-100">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (needsPremium && !accessReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f1a] text-slate-100">
        <p className="text-sm">Checking access...</p>
      </div>
    );
  }

  if (needsPremium && !hasSession) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
        <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 sm:px-6">
          <section className="w-full rounded-3xl border border-cyan-200/25 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-6 text-center shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
            <h1 className="text-2xl font-extrabold">Level 2+ এর জন্য Login করুন</h1>
            <p className="mt-3 text-sm text-slate-300">এই level unlock করতে আগে account এ login করতে হবে।</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login" className="inline-flex rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-extrabold text-[#0f0f1a]">
                Login
              </Link>
              <Link href="/dashboard" className="inline-flex rounded-xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-slate-100">
                Dashboard
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (needsPremium && !isPremium) {
    return (
      <PremiumLockedNotice
        message="এই Learn level unlock করতে payment submit করুন। Approval হলেই access পাবেন।"
      />
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
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0f0f1a] text-slate-100">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

      <main ref={mainRef} className="relative z-10 mx-auto w-full max-w-4xl px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/80 via-slate-900/72 to-[#122531]/70 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[220px] flex-1">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300 sm:text-sm">
                <p>Progress</p>
                <p>{Math.min(currentIndex + 1, totalWords)} / {totalWords}</p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200/15">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <Link href={backHref} className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-white/20 active:scale-95 active:bg-white/25 cursor-pointer">
              {stage === "demo" ? "Back to Demo" : "Back to Stage"}
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => setSpeechRate((prev) => (prev === 1 ? 0.7 : 1))} className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20" title="আওয়াজের গতি পরিবর্তন করুন (Slow/Normal)">
              <span className="inline-flex items-center gap-2">
                <img src="/icons/premium/clock-front-premium.svg" alt="Speed" className="h-4 w-4" />
                {speechRate === 0.7 ? "Slow" : "Normal"}
              </span>
            </button>
            <button type="button" onClick={toggleExamMode} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${examMode ? "border border-rose-300/45 bg-rose-300/25 text-rose-100 hover:bg-rose-300/30 active:bg-rose-300/35" : "border border-cyan-200/35 bg-cyan-200/18 text-cyan-100 hover:bg-cyan-200/24 active:bg-cyan-200/28"}`}>
              {examMode ? "Exam Mode: ON" : "Exam Mode"}
            </button>
          </div>

          {examMode && <p className="mt-3 text-sm text-amber-200">Exam mode চালু: একটি ভুল হলেই আবার ১ নম্বর শব্দ থেকে শুরু হবে।</p>}
          {restartNotice && <p className="mt-2 text-sm font-semibold text-rose-300">ভুল হয়েছে। Exam restart: আবার ১ নম্বর শব্দ থেকে শুরু করুন।</p>}

          {!isCompleted ? (
            <>
              <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/14 to-[#3a3d49]/92 p-4 shadow-lg shadow-black/20 sm:mt-7 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {!examMode ? (
                      <h1 className="max-w-full break-words text-3xl font-extrabold tracking-wide sm:text-5xl">{activeWord.word}</h1>
                    ) : (
                      <div className="h-10 sm:h-14" />
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-200/35 bg-cyan-200/18 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-100">{activeWord.pos}</span>
                      {!examMode && <span className="text-sm text-slate-300">{activeWord.phonetic}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={speakWord} className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/25 bg-white/15 transition-all duration-200 hover:bg-white/20 active:scale-95 active:bg-white/25 cursor-pointer sm:hover:scale-105 sm:active:scale-95 touch-feedback" aria-label="Play pronunciation">
                      <img src="/icons/premium/megaphone-front-premium.svg" alt="Pronunciation" className="h-6 w-6" />
                    </button>
                    <p className="text-xs font-semibold text-white">শুনুন</p>
                  </div>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-emerald-300">{activeWord.bangla}</p>
                <p className="mt-2 text-sm font-bold italic text-white sm:text-base">
                  {
                    (() => {
                      const example = activeWord.example || "";
                      if (!examMode) return example;
                      // If example already contains underscores (blanks), use it as-is.
                      if (/_{2,}/.test(example)) return example;
                      return example.replace(new RegExp(`\\b${activeWord.word}\\b`, "gi"), "_".repeat(activeWord.word.length));
                    })()
                  }
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-cyan-300/10 to-[#323744]/92 p-4 shadow-lg shadow-black/20 sm:mt-6 sm:p-6">
                <p className="mb-2 text-sm font-semibold text-slate-100 sm:mb-3">শব্দটি লিখুন:</p>
                <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                  {activeWord.word.split("").map((char: string, index: number) => {
                    const typedChar = normalizedTyped[index];
                    let boxClass = "border-white/20 bg-white/10 text-slate-300";
                    if (typedChar !== undefined) {
                      boxClass = typedChar === char.toLowerCase()
                        ? "border-emerald-300/40 bg-emerald-300/20 text-emerald-100"
                        : "border-rose-300/40 bg-rose-300/20 text-rose-100";
                    }
                    return (
                      <div key={`${char}-${index}`} className={`flex h-10 w-10 items-center justify-center rounded-lg border text-base font-bold uppercase sm:h-12 sm:w-12 sm:rounded-xl sm:text-xl ${boxClass}`}>
                        {typedChar ?? ""}
                      </div>
                    );
                  })}
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={typedValue}
                  readOnly // Prevent native keyboard
                  onFocus={() => setShowCustomKeyboard(true)}
                  inputMode="none" // Try to prevent keyboard
                  className="mt-4 w-full rounded-xl border border-white/25 bg-[#0f1730] px-3 py-3 text-center text-base tracking-[0.12em] text-slate-100 outline-none caret-transparent placeholder:text-slate-500 focus:border-cyan-200/60 sm:px-4 sm:text-xl sm:tracking-[0.2em]"
                  placeholder="Type here"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 sm:mt-6">
                {!examMode && (
                  <button type="button" onClick={handleRetry} className="rounded-xl border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:bg-white/20 active:scale-95 active:bg-white/25 cursor-pointer">Retry</button>
                )}
                <button type="button" onClick={handleNext} disabled={!isCorrect} className="rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-5 py-2.5 text-sm font-bold text-[#0f0f1a] transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-95 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Completed</p>
              <h2 className="mt-2 text-3xl font-extrabold text-emerald-100">দারুণ! ২০টি শব্দ শেষ।</h2>
              <p className="mt-3 text-slate-100">
                {isDemoLevel ? `Demo সম্পন্ন হয়েছে, ${returnToDashboard ? "dashboard" : "landing page"} এ নেওয়া হচ্ছে...` : "সবগুলো ধাপ সফলভাবে সম্পন্ন হয়েছে।"}
              </p>
            </div>
          )}
        </section>
      </main>

      {showCustomKeyboard && (
        <CustomKeyboard
          onKeyPress={handleCustomKeyPress}
          onBackspace={handleCustomBackspace}
          onEnter={handleCustomEnter}
        />
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-500/15 to-[#16162a]/95 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-3xl font-extrabold text-emerald-200">অভিনন্দন!</h3>
            <p className="mt-3 text-lg font-semibold text-emerald-100">পরের লেভেল আনলক হয়েছে</p>
            <p className="mt-2 text-sm text-slate-300">আপনি Exam Mode সফলভাবে পাস করেছেন।</p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleGoToNextLevel}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-bold text-[#0f0f1a] transition hover:brightness-110"
              >
                পরের লেভেল শুরু করুন →
              </button>
              <Link
                href="/dashboard"
                className="w-full rounded-xl border border-white/25 bg-white/15 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/20 inline-block"
              >
                Dashboard এ ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
