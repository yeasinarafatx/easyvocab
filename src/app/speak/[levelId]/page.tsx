"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

interface Word {
	word: string;
	pos: string;
	phonetic: string;
	bangla: string;
	example: string;
}

interface SpeechRecognitionResultItem {
	transcript: string;
	confidence?: number;
}

interface SpeechRecognitionEvent {
	results: ArrayLike<ArrayLike<SpeechRecognitionResultItem>>;
}

interface SpeechRecognition {
	lang: string;
	continuous: boolean;
	interimResults: boolean;
	onresult: ((event: SpeechRecognitionEvent) => void) | null;
	onerror: ((event: { error: string }) => void) | null;
	onend: (() => void) | null;
	start: () => void;
	stop: () => void;
}

interface SpeechRecognitionConstructor {
	new (): SpeechRecognition;
}

declare global {
	interface Window {
		SpeechRecognition: SpeechRecognitionConstructor;
		webkitSpeechRecognition: SpeechRecognitionConstructor;
	}
}

type Mode = "practice" | "exam";
type ListenState = "idle" | "listening";
type ResultState = "none" | "correct" | "wrong";

export default function SpeakLevelPage() {
	const params = useParams<{ levelId: string }>();
	const router = useRouter();
	const searchParams = useSearchParams();
	const levelId = params?.levelId ?? "beginner-1";
	const [mode, setMode] = useState<Mode>("practice");
	const [words, setWords] = useState<Word[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [listenState, setListenState] = useState<ListenState>("idle");
	const [resultState, setResultState] = useState<ResultState>("none");
	const [attempts, setAttempts] = useState(0);
	const [examCorrectCount, setExamCorrectCount] = useState(0);
	const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);

	const parts = levelId.split("-");
	const stage = parts[0] ?? "beginner";
	const levelNumber = Number(parts[1] ?? "1");
	const file = `level_${String(Number.isFinite(levelNumber) ? levelNumber : 1).padStart(2, "0")}`;
	const isDemoLevel = stage === "demo";
	const returnToDashboard = searchParams.get("from") === "dashboard";
	const backHref = returnToDashboard ? "/dashboard" : stage === "demo" ? "/demo" : `/stage/${stage}`;

	useEffect(() => {
		let cancelled = false;

		const loadWords = async () => {
			try {
				setIsLoading(true);
				setLoadError(null);
				const data = await import(`@/data/${stage}/${file}.json`);
				const loadedWords = (data.default ?? []) as Word[];
				if (!cancelled) {
					setWords(loadedWords);
				}
			} catch (error) {
				console.error("Failed to load speak data:", error);
				if (!cancelled) {
					setLoadError("Word data load করা যায়নি।");
					setWords([]);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
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

	useEffect(() => {
		return () => {
			recognitionRef.current?.stop();
		};
	}, []);

	const totalWords = words.length;
	const isCompleted = totalWords > 0 && currentIndex >= totalWords;
	const activeWord = !isCompleted ? words[currentIndex] : undefined;
	const examPassThreshold = Math.min(14, totalWords || 14);
	const examAccuracyPercent = totalWords > 0 ? Math.round((examCorrectCount / totalWords) * 100) : 0;
	const examPassed = examCorrectCount >= examPassThreshold;
	const supportsSpeechRecognition =
		typeof window !== "undefined" &&
		("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

	const progressPercent = useMemo(() => {
		if (totalWords === 0) {
			return 0;
		}

		return (Math.min(currentIndex + 1, totalWords) / totalWords) * 100;
	}, [currentIndex, totalWords]);

	useEffect(() => {
		if (!isCompleted || mode !== "exam" || typeof window === "undefined" || isDemoLevel) {
			return;
		}

		if (examPassed) {
			window.localStorage.setItem(`completed_${levelId}`, "true");
			window.localStorage.setItem(`speak_completed_${levelId}`, "true");
		} else {
			window.localStorage.removeItem(`completed_${levelId}`);
			window.localStorage.removeItem(`speak_completed_${levelId}`);
		}
	}, [isCompleted, levelId, mode, isDemoLevel, examPassed]);

	useEffect(() => {
		if (!isDemoLevel || typeof window === "undefined") {
			return;
		}

		window.localStorage.removeItem(`completed_${levelId}`);
		window.localStorage.removeItem(`speak_completed_${levelId}`);
	}, [isDemoLevel, levelId]);

	useEffect(() => {
		if (!isDemoLevel || !isCompleted) {
			return;
		}

		const t = window.setTimeout(() => router.replace(backHref), 1200);
		return () => window.clearTimeout(t);
	}, [isDemoLevel, isCompleted, router, backHref]);

	const resetWordState = () => {
		setListenState("idle");
		setResultState("none");
		setAttempts(0);
	};

	const handleModeChange = (nextMode: Mode) => {
		setMode(nextMode);
		setCurrentIndex(0);
		setExamCorrectCount(0);
		resetWordState();
	};

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

	const finalizeWrongAttempt = () => {
		setResultState("wrong");
		setAttempts((prev) => prev + 1);
	};

		const normalizeForCompare = (value: string) => {
			return value
				.toLowerCase()
				.trim()
				.replace(/^["'`]+|["'`]+$/g, "")
				.replace(/[^a-z0-9\s'-]/g, "")
				.replace(/\s+/g, " ")
				.replace(/^(a|an|the)\s+/, "");
		};

		const compactForm = (value: string) => value.replace(/[\s'-]/g, "");

		const levenshteinDistance = (a: string, b: string) => {
			if (a === b) return 0;
			if (!a.length) return b.length;
			if (!b.length) return a.length;

			const matrix: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
			for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
			for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

			for (let i = 1; i <= a.length; i++) {
				for (let j = 1; j <= b.length; j++) {
					const cost = a[i - 1] === b[j - 1] ? 0 : 1;
					matrix[i][j] = Math.min(
						matrix[i - 1][j] + 1,
						matrix[i][j - 1] + 1,
						matrix[i - 1][j - 1] + cost,
					);
				}
			}

			return matrix[a.length][b.length];
		};

		const isTranscriptMatch = (transcript: string, targetWord: string) => {
			const normalizedTranscript = normalizeForCompare(transcript);
			const normalizedTarget = normalizeForCompare(targetWord);

			if (!normalizedTranscript || !normalizedTarget) return false;

			if (normalizedTranscript === normalizedTarget) return true;

			const compactTranscript = compactForm(normalizedTranscript);
			const compactTarget = compactForm(normalizedTarget);
			if (compactTranscript === compactTarget) return true;

			if (normalizedTranscript.includes(normalizedTarget)) return true;

			const distance = levenshteinDistance(compactTranscript, compactTarget);
			const maxLen = Math.max(compactTranscript.length, compactTarget.length);
			const dynamicLimit = Math.max(1, Math.min(5, Math.ceil(maxLen * 0.28)));

			if (maxLen <= 5) return distance <= 1;
			if (maxLen <= 9) return distance <= 2;
			return distance <= dynamicLimit;
		};

	const handleRecognitionResult = (transcript: string) => {
		if (!activeWord) {
			return;
		}

			if (isTranscriptMatch(transcript, activeWord.word)) {
			setResultState("correct");
			return;
		}

		finalizeWrongAttempt();
	};

	const startListening = () => {
		if (!supportsSpeechRecognition || !activeWord) {
			return;
		}

		if (attempts >= 3) {
			return;
		}

		setResultState("none");
		setListenState("listening");

		const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
		const recognition = new SpeechRecognitionCtor();
		recognition.lang = "en-US";
		recognition.continuous = false;
		recognition.interimResults = false;

		recognition.onresult = (event: SpeechRecognitionEvent) => {
			const alternatives: string[] = [];
			for (let resultIndex = 0; resultIndex < event.results.length; resultIndex++) {
				const result = event.results[resultIndex];
				for (let altIndex = 0; altIndex < (result?.length ?? 0); altIndex++) {
					const transcript = result[altIndex]?.transcript?.trim();
					if (transcript) alternatives.push(transcript);
				}
			}

			const selectedTranscript = alternatives[0] ?? "";
			const matchedTranscript = alternatives.find((t) => isTranscriptMatch(t, activeWord.word));

			handleRecognitionResult(matchedTranscript ?? selectedTranscript);
		};

		recognition.onerror = (event: { error: string }) => {
			console.log("Speech recognition error:", event.error);

			if (event.error === "no-speech") {
				setListenState("idle");
				return;
			}

			if (event.error === "not-allowed" || event.error === "permission-denied") {
				setListenState("idle");
				alert("মাইক্রোফোন permission দিন। Browser এর address bar এ click করে Microphone Allow করুন।");
				return;
			}

			finalizeWrongAttempt();
		};

		recognition.onend = () => {
			setListenState("idle");
		};

		recognitionRef.current = recognition;
		recognition.start();
	};

	const handleRetry = () => {
		setResultState("none");
	};

	const handleNext = () => {
		if (isCompleted) {
			return;
		}

		if (mode === "exam" && resultState === "correct") {
			setExamCorrectCount((prev) => prev + 1);
		}

		setCurrentIndex((prev) => prev + 1);
		resetWordState();
	};

	const showHint = mode !== "exam" && attempts >= 3 && resultState === "wrong";
	const showNext = resultState === "correct" || attempts >= 3;

	const micButtonClass =
		resultState === "correct"
			? "h-20 w-20 bg-emerald-500/30 border-2 border-emerald-400/50 text-3xl sm:h-24 sm:w-24 sm:text-4xl"
			: resultState === "wrong"
				? "h-20 w-20 bg-rose-500/20 border-2 border-rose-300/40 text-3xl sm:h-24 sm:w-24 sm:text-4xl"
				: listenState === "listening"
					? "h-20 w-20 bg-rose-500/30 border-2 border-rose-400/60 animate-pulse text-3xl sm:h-24 sm:w-24 sm:text-4xl"
					: "h-20 w-20 bg-violet-500/30 border-2 border-violet-400/50 shadow-lg shadow-violet-500/20 text-3xl sm:h-24 sm:w-24 sm:text-4xl";

	if (isLoading) {
		return (
			<div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
				<div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
				<div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />
				<main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
					<p className="text-slate-300">Loading words...</p>
				</main>
			</div>
		);
	}

	if (loadError) {
		return (
			<div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
				<main className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-4">
					<p className="text-rose-300">{loadError}</p>
				</main>
			</div>
		);
	}

	return (
		<div className="relative min-h-screen overflow-hidden bg-[#0f0f1a] text-slate-100">
			<div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
			<div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl" />

			<main className="relative z-10 mx-auto w-full max-w-4xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
				<section className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0 flex-1">
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
							className="self-start rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
						>
							{stage === "demo" ? "Back to Demo" : "Back to Stage"}
						</Link>
					</div>

					<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
						<button
							type="button"
							onClick={() => handleModeChange("practice")}
							className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
								mode === "practice"
									? "border border-cyan-200/40 bg-cyan-200/20 text-cyan-100"
									: "border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
							}`}
						>
							🎤 Practice Mode
						</button>
						<button
							type="button"
							onClick={() => handleModeChange("exam")}
							className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
								mode === "exam"
									? "border border-amber-300/40 bg-amber-300/20 text-amber-100"
									: "border border-white/20 bg-white/10 text-slate-200 hover:bg-white/20"
							}`}
						>
							📋 Exam Mode
						</button>
					</div>

					{!supportsSpeechRecognition ? (
						<p className="mt-4 text-amber-300">আপনার browser এ Speech Recognition সাপোর্ট নেই। Chrome ব্যবহার করুন।</p>
					) : null}

					{isCompleted ? (
						<div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-6 text-center">
							<h2 className="text-3xl font-extrabold text-emerald-100">🎉 সব শব্দ শেষ!</h2>
							{mode === "exam" ? (
								<>
									<p className="mt-3 text-slate-200">সঠিক: {examCorrectCount} / {totalWords}</p>
									<p className="mt-1 text-slate-200">Accuracy: {examAccuracyPercent}%</p>
									<p className={`mt-3 font-semibold ${examPassed ? "text-emerald-300" : "text-rose-300"}`}>
										{examPassed
											? `Pass (${examPassThreshold}+ লাগবে) - Next level unlock হয়েছে`
											: `Fail (${examPassThreshold}+ লাগবে) - এই level আবার দিন`}
									</p>
								</>
							) : null}
							{isDemoLevel ? (
								<p className="mt-3 text-slate-200">Demo সম্পন্ন হয়েছে, landing page এ নেওয়া হচ্ছে...</p>
							) : (
								<Link
									href={`/stage/${stage}`}
									className="mt-5 inline-flex rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/20"
								>
									স্টেজে ফিরে যান
								</Link>
							)}
						</div>
					) : activeWord ? (
						<>
							<div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-6">
								{mode === "practice" ? (
									<>
										<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="min-w-0 flex-1">
												<h1 className="text-3xl font-extrabold tracking-wide text-slate-100 sm:text-5xl">{activeWord.word}</h1>
												<p className="mt-3 text-xl font-extrabold text-emerald-300 sm:text-3xl">{activeWord.bangla}</p>
												<p className="mt-2 text-xs text-slate-400 sm:text-sm">{activeWord.phonetic}</p>
												<p className="mt-2 text-sm font-bold text-white sm:mt-3 sm:text-base">{activeWord.example}</p>
											</div>
											<button
												type="button"
												onClick={speakWord}
												className="inline-flex h-12 w-12 items-center justify-center self-start rounded-2xl border border-white/20 bg-white/10 text-xl transition hover:bg-white/20 sm:h-16 sm:w-16 sm:text-3xl"
												aria-label="Play pronunciation"
											>
												🔊
											</button>
										</div>
									</>
								) : (
									<>
										<p className="text-sm uppercase tracking-[0.2em] text-slate-400">বাংলা অর্থ</p>
										<h1 className="mt-2 text-3xl font-bold text-emerald-300 sm:text-4xl">{activeWord.bangla}</h1>
										<p className="mt-3 text-sm font-semibold text-slate-300">ইংরেজি phrase নিজে বলুন, hint দেখানো হবে না।</p>
									</>
								)}
							</div>

							<div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4 sm:p-6">
								<div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
									<div className="relative flex items-center justify-center">
										{listenState === "idle" && resultState === "none" ? (
											<div className="absolute h-20 w-20 rounded-full bg-violet-400/10 animate-ping sm:h-24 sm:w-24" />
										) : null}
										<button
											type="button"
											onClick={startListening}
											disabled={!supportsSpeechRecognition || listenState === "listening" || attempts >= 3}
											className={`relative z-10 flex items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${micButtonClass}`}
											aria-label="Start speaking"
										>
											{resultState === "correct" ? "✅" : resultState === "wrong" ? "❌" : listenState === "listening" ? "🔴" : "🎤"}
										</button>
									</div>

									{attempts > 0 ? <p className="text-xs text-slate-400">চেষ্টা: {attempts} / 3</p> : null}

									{listenState === "listening" ? (
										<p className="text-sm text-rose-300 animate-pulse">🔴 শুনছি... বলুন!</p>
									) : resultState === "correct" ? (
										<p className="text-lg font-bold text-emerald-300">✅ সঠিক!</p>
									) : resultState === "wrong" ? (
										<p className="text-sm text-rose-300">❌ ভুল হয়েছে</p>
									) : (
										<p className="text-sm text-slate-300">👆 মাইক্রোফোন চাপুন এবং বলুন</p>
									)}

									{showHint ? (
										<p className="text-sm text-amber-200">
											সঠিক শব্দ: {activeWord.word} ({activeWord.phonetic})
										</p>
									) : null}

									<div className="mt-1 flex items-center gap-3">
										{resultState === "wrong" && attempts < 3 ? (
											<button
												type="button"
												onClick={handleRetry}
												className="rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/20"
											>
												Retry
											</button>
										) : null}

										{showNext ? (
											<button
												type="button"
												onClick={handleNext}
												className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-300/20"
											>
												Next
											</button>
										) : null}
									</div>
								</div>
							</div>
						</>
					) : (
						<p className="mt-8 text-slate-300">কোনো শব্দ পাওয়া যায়নি।</p>
					)}
				</section>
			</main>
		</div>
	);
}
