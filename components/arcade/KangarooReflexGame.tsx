"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Heart,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  Zap,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import {
  ArcadeReflexQuestion,
  extractMicroQuestionsFromExams,
  getAnswerDistributionStats,
} from "../../lib/arcade/question-extractor";

interface KangarooReflexGameProps {
  exams?: any[];
  onSaveVocab?: (item: {
    word: string;
    meaning: string;
    example: string;
    level?: string;
  }) => void;
}

// Web Audio API Synthesized Sounds (Zero external MP3 dependencies)
function playJumpAudio(superLeap: boolean, muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = superLeap ? "triangle" : "sine";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(superLeap ? 360 : 280, now);
    osc.frequency.exponentialRampToValueAtTime(superLeap ? 880 : 620, now + 0.18);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
    setTimeout(() => ctx.close().catch(() => {}), 300);
  } catch {
    // Ignore audio context restriction errors
  }
}

function playSplashAudio(muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.28);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    setTimeout(() => ctx.close().catch(() => {}), 360);
  } catch {
    // Ignore audio context restriction errors
  }
}

const CATEGORIES = [
  { id: "ALL", label: "Tất cả C1/C2" },
  { id: "Confusable Words", label: "Từ dễ nhầm (Confusables)" },
  { id: "Collocation", label: "Collocations" },
  { id: "Phrasal Verb", label: "Phrasal Verbs" },
  { id: "Idiom", label: "Idioms C1/C2" },
  { id: "Preposition", label: "Giới từ (Prepositions)" },
  { id: "Lexico-Grammar", label: "Đảo ngữ & Bàng thái" },
  { id: "Word Formation", label: "Word Formation" },
];

export default function KangarooReflexGame({
  exams = [],
  onSaveVocab,
}: KangarooReflexGameProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const questionPool = useMemo(
    () => extractMicroQuestionsFromExams(exams, selectedCategory),
    [exams, selectedCategory]
  );
  const distributionStats = useMemo(
    () => getAnswerDistributionStats(questionPool),
    [questionPool]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [pillarNumber, setPillarNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(1450);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Animation states: 'idle' | 'leap' | 'super-leap' | 'splash'
  const [kangarooState, setKangarooState] = useState<
    "idle" | "leap" | "super-leap" | "splash"
  >("idle");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [instantFeedback, setInstantFeedback] = useState<{
    correct: boolean;
    message: string;
    shortTip: string;
    question: ArcadeReflexQuestion;
  } | null>(null);

  const [missedQuestions, setMissedQuestions] = useState<ArcadeReflexQuestion[]>([]);
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Record<string, boolean>>({});
  const [savedAllBanner, setSavedAllBanner] = useState(false);

  // Sinking Pillar Countdown Timer (starts at 6.0s, scales down to 3.5s as streak grows)
  const maxPillarSeconds = useMemo(
    () => Math.max(3.5, Number((6.0 - Math.min(streak, 10) * 0.25).toFixed(2))),
    [streak]
  );
  const [remainingMs, setRemainingMs] = useState(6000);
  const lockRef = useRef(false);

  const currentQuestion =
    questionPool[currentIndex % Math.max(1, questionPool.length)] || questionPool[0];

  // Reset timer when advancing to a new question
  useEffect(() => {
    setRemainingMs(maxPillarSeconds * 1000);
  }, [currentIndex, selectedCategory, maxPillarSeconds]);

  const advanceToNextQuestion = useCallback(
    (nextHearts: number) => {
      lockRef.current = false;
      setSelectedSlot(null);
      setKangarooState("idle");
      if (nextHearts <= 0) {
        setGameOver(true);
      } else {
        setCurrentIndex((prev) => (prev + 1) % Math.max(1, questionPool.length));
      }
    },
    [questionPool.length]
  );

  const handleAnswerChoice = useCallback(
    (choiceIndex: number | "TIMEOUT") => {
      if (lockRef.current || gameOver || !currentQuestion) return;
      lockRef.current = true;

      const isCorrect =
        choiceIndex !== "TIMEOUT" && choiceIndex === currentQuestion.correctIndex;
      setSelectedSlot(typeof choiceIndex === "number" ? choiceIndex : -1);

      if (isCorrect) {
        const nextStreak = streak + 1;
        const isSuperDoubleLeap = nextStreak >= 5;
        const leapSteps = isSuperDoubleLeap ? 2 : 1;
        const speedBonus = Math.round((remainingMs / (maxPillarSeconds * 1000)) * 60);
        const earnedPoints = (100 + speedBonus) * (isSuperDoubleLeap ? 2 : 1);

        playJumpAudio(isSuperDoubleLeap, isMuted);
        setKangarooState(isSuperDoubleLeap ? "super-leap" : "leap");
        setStreak(nextStreak);
        setMaxStreak((m) => Math.max(m, nextStreak));
        setPillarNumber((p) => p + leapSteps);
        setScore((s) => {
          const updated = s + earnedPoints;
          if (updated > highScore) setHighScore(updated);
          return updated;
        });

        setInstantFeedback({
          correct: true,
          message: isSuperDoubleLeap
            ? `⚡ SUPER DOUBLE-LEAP (2x Points)! +${earnedPoints} XP • Nhảy vọt 2 trụ đá!`
            : `🦘 Chuẩn xác! +${earnedPoints} XP • Đáp án ${currentQuestion.correctLetter}: "${currentQuestion.correctText}"`,
          shortTip: currentQuestion.shortTip,
          question: currentQuestion,
        });

        setTimeout(() => {
          advanceToNextQuestion(hearts);
        }, 620);
      } else {
        const nextHearts = Math.max(0, hearts - 1);
        playSplashAudio(isMuted);
        setKangarooState("splash");
        setStreak(0);
        setHearts(nextHearts);
        setMissedQuestions((prev) =>
          prev.some((q) => q.id === currentQuestion.id)
            ? prev
            : [...prev, currentQuestion]
        );

        const timeoutPrefix =
          choiceIndex === "TIMEOUT"
            ? "🌊 Trụ đá đã chìm! Hết giờ phản xạ — "
            : `💦 Trượt chân xuống sông! Đáp án đúng là ${currentQuestion.correctLetter} ("${currentQuestion.correctText}") — `;

        setInstantFeedback({
          correct: false,
          message: `${timeoutPrefix}Mất 1 ❤️`,
          shortTip: currentQuestion.shortTip,
          question: currentQuestion,
        });

        setTimeout(() => {
          advanceToNextQuestion(nextHearts);
        }, 900);
      }
    },
    [
      gameOver,
      currentQuestion,
      streak,
      remainingMs,
      maxPillarSeconds,
      isMuted,
      highScore,
      advanceToNextQuestion,
      hearts,
    ]
  );

  // Sinking Pillar live countdown loop (100ms ticks)
  useEffect(() => {
    if (isPaused || gameOver || lockRef.current) return;
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 100) {
          clearInterval(timer);
          handleAnswerChoice("TIMEOUT");
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isPaused, gameOver, currentIndex, handleAnswerChoice]);

  // Keyboard shortcuts: 1, 2, 3, 4 or A, B, C, D
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toUpperCase();
      if (key === "1" || key === "A") {
        e.preventDefault();
        handleAnswerChoice(0);
      } else if (key === "2" || key === "B") {
        e.preventDefault();
        handleAnswerChoice(1);
      } else if (key === "3" || key === "C") {
        e.preventDefault();
        handleAnswerChoice(2);
      } else if (key === "4" || key === "D") {
        e.preventDefault();
        handleAnswerChoice(3);
      } else if (key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameOver, handleAnswerChoice]);

  const handleRestartGame = () => {
    lockRef.current = false;
    setHearts(3);
    setScore(0);
    setStreak(0);
    setPillarNumber(1);
    setSelectedSlot(null);
    setKangarooState("idle");
    setGameOver(false);
    setSavedAllBanner(false);
    setMissedQuestions([]);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, questionPool.length));
  };

  const handleContinuePractice = () => {
    lockRef.current = false;
    setHearts(3);
    setSelectedSlot(null);
    setKangarooState("idle");
    setGameOver(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, questionPool.length));
  };

  const handleSaveSingleMissed = (q: ArcadeReflexQuestion) => {
    if (onSaveVocab) {
      onSaveVocab({
        word: q.targetTerm || q.correctText,
        meaning: q.shortTip,
        example: q.stem.replace("_______", `[${q.correctText}]`),
        level: "C1/C2 Reflex Arcade",
      });
    }
    setSavedFlashcardIds((prev) => ({ ...prev, [q.id]: true }));
  };

  const handleSaveAllMissedToFlashcards = () => {
    const itemsToSave =
      missedQuestions.length > 0 ? missedQuestions : [currentQuestion];
    const nextSaved: Record<string, boolean> = { ...savedFlashcardIds };
    for (const q of itemsToSave) {
      if (!q) continue;
      if (onSaveVocab && !nextSaved[q.id]) {
        onSaveVocab({
          word: q.targetTerm || q.correctText,
          meaning: q.shortTip,
          example: q.stem.replace("_______", `[${q.correctText}]`),
          level: "C1/C2 Reflex Arcade",
        });
      }
      nextSaved[q.id] = true;
    }
    setSavedFlashcardIds(nextSaved);
    setSavedAllBanner(true);
  };

  const timeRatio = Math.max(
    0,
    Math.min(1, remainingMs / (maxPillarSeconds * 1000))
  );
  // Current pillar sinks downward up to 44px as time runs out
  const sinkOffsetPx = Math.round((1 - timeRatio) * 44);

  return (
    <div className="space-y-4">
      {/* Top Category Filter & Fisher-Yates Balance Bar */}
      <div className="p-3.5 rounded-2xl eyecare-card border flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  active
                    ? "bg-amber-900 text-amber-50 shadow-sm"
                    : "eyecare-elevated border opacity-85 hover:opacity-100"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-bold opacity-80">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
            Kho {questionPool.length} câu C1/C2 • Phân bổ chuẩn: A({distributionStats.A}) • B({distributionStats.B}) • C({distributionStats.C}) • D({distributionStats.D})
          </span>
        </div>
      </div>

      {/* Main Kangaroo Stepping-Stone River Arena */}
      {!gameOver ? (
        <div className="rounded-3xl eyecare-card border-2 border-amber-900/20 shadow-md overflow-hidden">
          {/* HUD Bar */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-amber-900/10 via-emerald-900/10 to-sky-900/10 border-b flex flex-wrap items-center justify-between gap-3">
            {/* Hearts */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                {[1, 2, 3].map((h) => (
                  <Heart
                    key={h}
                    className={`w-4 h-4 transition-transform ${
                      h <= hearts
                        ? "text-rose-600 fill-rose-600 scale-100"
                        : "text-slate-400/40 scale-75"
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs font-extrabold text-rose-700 dark:text-rose-300">
                  {hearts}/3 Tim
                </span>
              </div>

              {/* Combo Streak Badge */}
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition ${
                  streak >= 5
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse"
                    : "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30"
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>
                  🔥 {streak}x Combo {streak >= 5 ? "• ⚡ SUPER 2X LEAP!" : ""}
                </span>
              </div>

              <span className="px-3 py-1.5 rounded-xl eyecare-elevated border text-xs font-extrabold">
                Trụ Đá #{pillarNumber}
              </span>
            </div>

            {/* Score & Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                <span>{score} XP</span>
                <span className="opacity-70">(Kỷ lục: {highScore})</span>
              </div>

              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 border transition cursor-pointer ${
                  isPaused
                    ? "bg-amber-900 text-amber-50"
                    : "eyecare-elevated hover:bg-amber-900/10"
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" /> Tiếp tục
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Tạm dừng trụ ({(remainingMs / 1000).toFixed(1)}s)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                title={isMuted ? "Bật âm thanh nhảy" : "Tắt âm thanh"}
                className="p-2 rounded-xl eyecare-elevated border hover:bg-amber-900/10 transition cursor-pointer"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 opacity-70" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-800 dark:text-amber-300" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setGameOver(true)}
                className="px-3 py-1.5 rounded-xl eyecare-elevated border text-xs font-bold hover:bg-rose-500/15 hover:text-rose-700 transition cursor-pointer"
              >
                🏁 Tổng kết ({missedQuestions.length} câu sai)
              </button>
            </div>
          </div>

          {/* Visual Stepping-Stone River Stage */}
          <div className="relative h-48 bg-gradient-to-b from-sky-500/10 via-teal-500/10 to-cyan-700/25 px-6 pt-4 pb-2 flex flex-col justify-between overflow-hidden select-none">
            {/* Top Sinking Pillar Timer Bar */}
            <div className="space-y-1 z-10">
              <div className="flex items-center justify-between text-[11px] font-extrabold">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  ĐỒNG HỒ TRỤ ĐÁ ĐANG CHÌM (Tốc độ hiện tại: {maxPillarSeconds.toFixed(1)}s/trụ)
                </span>
                <span
                  className={`cloze-mono-input ${
                    remainingMs <= 2000
                      ? "text-rose-600 dark:text-rose-400 font-black animate-pulse"
                      : ""
                  }`}
                >
                  {(remainingMs / 1000).toFixed(1)}s • Phím tắt: [1-4] hoặc [A-D]
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900/15 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 rounded-full ${
                    timeRatio > 0.5
                      ? "bg-emerald-600"
                      : timeRatio > 0.25
                      ? "bg-amber-500"
                      : "bg-rose-600"
                  }`}
                  style={{ width: `${Math.round(timeRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Stepping Stones & Animated Kangaroo */}
            <div className="relative flex items-end justify-around h-32 pb-3 z-10">
              {[0, 1, 2, 3, 4].map((offset) => {
                const stoneNum = pillarNumber + offset - 1;
                if (stoneNum < 1) {
                  return <div key={offset} className="w-20 h-16 opacity-0" />;
                }
                const isCurrentPillar = offset === 1;
                const isNextPillar = offset === 2;
                const isDoubleLeapPillar = offset === 3;

                return (
                  <div
                    key={offset}
                    className="flex flex-col items-center justify-end relative"
                    style={{
                      transform: isCurrentPillar
                        ? `translateY(${sinkOffsetPx}px)`
                        : "translateY(0px)",
                      transition: "transform 120ms linear",
                    }}
                  >
                    {/* Animated Kangaroo Character on the Active Pillar */}
                    {isCurrentPillar && (
                      <div
                        className={`mb-1 flex flex-col items-center transition-all duration-500 ${
                          kangarooState === "leap"
                            ? "translate-x-16 -translate-y-8 scale-110"
                            : kangarooState === "super-leap"
                            ? "translate-x-32 -translate-y-12 scale-125"
                            : kangarooState === "splash"
                            ? "translate-y-10 rotate-12 opacity-60"
                            : "animate-bounce"
                        }`}
                      >
                        {streak >= 5 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow mb-0.5">
                            ⚡ 2X LEAP
                          </span>
                        )}
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/25 border-2 border-amber-600/50 flex items-center justify-center text-3xl shadow-md">
                          {kangarooState === "splash" ? "💦" : "🦘"}
                        </div>
                      </div>
                    )}

                    {/* Next Pillar Target Marker */}
                    {isNextPillar && streak < 5 && (
                      <span className="text-[10px] font-extrabold opacity-65 mb-1">
                        Đích nhảy +1
                      </span>
                    )}
                    {isDoubleLeapPillar && streak >= 5 && (
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 mb-1">
                        ⚡ Đích Nhảy Kép +2
                      </span>
                    )}

                    {/* Stepping Stone Pillar Graphic */}
                    <div
                      className={`w-20 sm:w-24 rounded-t-2xl border-2 flex flex-col items-center justify-center py-2 shadow-md ${
                        isCurrentPillar
                          ? remainingMs <= 2000
                            ? "bg-rose-900/80 border-rose-400 text-rose-50 h-14"
                            : "bg-amber-900 text-amber-50 border-amber-500 h-16"
                          : "bg-stone-700/80 text-stone-100 border-stone-500/60 h-14 opacity-85"
                      }`}
                    >
                      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                        Trụ đá
                      </span>
                      <span className="text-xs font-black cloze-mono-input">
                        #{stoneNum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Animated River Waves Overlay (pointer-events-none so it never blocks clicks) */}
            <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-r from-cyan-600/35 via-sky-500/40 to-teal-600/35 border-t border-cyan-400/40 pointer-events-none flex items-center justify-around text-[11px] font-bold text-sky-950 dark:text-sky-100 opacity-85">
              <span>〰️ Dòng sông C1/C2 Olympic 〰️</span>
              <span className="hidden sm:inline">〰️ Nhảy đúng trước khi trụ đá chìm! 〰️</span>
            </div>
          </div>

          {/* Question Stem & 4 Instant Reflex Buttons */}
          {currentQuestion && (
            <div className="p-5 md:p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-900/15 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
                    {currentQuestion.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg eyecare-elevated border text-xs font-bold opacity-80">
                    {currentQuestion.sourceTag}
                  </span>
                </div>

                <span className="text-xs font-bold opacity-70">
                  Câu #{currentIndex + 1} / {questionPool.length}
                </span>
              </div>

              {/* Stem */}
              <div className="p-4 md:p-5 rounded-2xl eyecare-elevated border-2 border-amber-900/15">
                <p className="text-base md:text-lg font-bold font-serif leading-relaxed">
                  {currentQuestion.stem}
                </p>
              </div>

              {/* 4 Reflex Option Buttons (Keys 1-4 / A-D) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((optText, idx) => {
                  const letter = ["A", "B", "C", "D"][idx];
                  const isChosen = selectedSlot === idx;
                  const isCorrectOption = idx === currentQuestion.correctIndex;

                  let btnStyle =
                    "eyecare-elevated border-2 border-amber-900/15 hover:border-amber-800 hover:bg-amber-900/5";
                  if (selectedSlot !== null) {
                    if (isCorrectOption) {
                      btnStyle =
                        "bg-emerald-600/20 border-2 border-emerald-600 text-emerald-950 dark:text-emerald-200";
                    } else if (isChosen && !isCorrectOption) {
                      btnStyle =
                        "bg-rose-600/20 border-2 border-rose-600 text-rose-950 dark:text-rose-200";
                    }
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleAnswerChoice(idx)}
                      className={`p-4 rounded-2xl text-left transition flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-900 text-amber-50 text-xs font-black flex items-center justify-center shrink-0">
                          {idx + 1} • {letter}
                        </span>
                        <span className="text-sm md:text-base font-extrabold">
                          {optText}
                        </span>
                      </div>

                      <span className="text-[11px] font-bold opacity-60 shrink-0 hidden md:inline">
                        Phím [{idx + 1}] / [{letter}]
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 1-Line Instant Learning Tip Bar (Never interrupts game flow) */}
              {instantFeedback && (
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                    instantFeedback.correct
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                      : "bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-200"
                  }`}
                >
                  <div className="space-y-0.5 text-xs md:text-sm">
                    <div className="font-extrabold flex items-center gap-1.5">
                      {instantFeedback.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{instantFeedback.message}</span>
                    </div>
                    <p className="text-xs opacity-90 pl-5">
                      💡 <strong>Mẹo nhớ nhanh:</strong> {instantFeedback.shortTip}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveSingleMissed(instantFeedback.question)}
                    className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold shrink-0 flex items-center gap-1.5 hover:bg-amber-800 transition cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    {savedFlashcardIds[instantFeedback.question.id]
                      ? "Đã lưu SM-2 ✓"
                      : "+ Lưu vào Flashcard"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* End-of-Run Summary & 1-Click SM-2 Flashcard Vault Save */
        <div className="p-6 md:p-8 rounded-3xl eyecare-card border-2 border-amber-900/25 shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900 text-amber-50 text-xs font-extrabold">
                🦘 TỔNG KẾT LƯỢT NHẢY KANGAROO C1/C2
              </span>
              <h3 className="text-xl md:text-2xl font-extrabold font-serif">
                Bạn đã nhảy tới Trụ Đá #{pillarNumber} • Đạt {score} XP (Combo tối đa: {maxStreak}x)
              </h3>
              <p className="text-xs md:text-sm opacity-80">
                Ôn lại ngay các câu bị sẩy chân bên dưới và lưu 1 chạm vào Sổ từ vựng SM-2 để không bao giờ sai lại trong phòng thi HSGQG.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveAllMissedToFlashcards}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs md:text-sm font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <BookmarkPlus className="w-4 h-4" />
                {savedAllBanner
                  ? "✓ Đã lưu toàn bộ vào Sổ từ vựng SM-2!"
                  : `💾 Lưu tất cả (${Math.max(1, missedQuestions.length)}) câu cần ôn vào SM-2`}
              </button>

              <button
                type="button"
                onClick={handleContinuePractice}
                className="px-4 py-2.5 rounded-xl eyecare-elevated border text-xs md:text-sm font-extrabold hover:bg-amber-900/10 transition cursor-pointer"
              >
                🛡️ Hồi 3 Tim &amp; Nhảy tiếp từ Trụ #{pillarNumber}
              </button>

              <button
                type="button"
                onClick={handleRestartGame}
                className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs md:text-sm font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Chơi lượt mới
              </button>
            </div>
          </div>

          {missedQuestions.length === 0 ? (
            <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-sm font-bold flex items-center justify-between gap-3">
              <span>
                🎉 Xuất sắc! Bạn chưa trả lời sai câu nào trong lượt nhảy này. Bạn vẫn có thể lưu câu hiện tại ({currentQuestion?.targetTerm}) vào Sổ từ vựng SM-2!
              </span>
              {currentQuestion && (
                <button
                  type="button"
                  onClick={() => handleSaveSingleMissed(currentQuestion)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-extrabold shrink-0 cursor-pointer"
                >
                  {savedFlashcardIds[currentQuestion.id]
                    ? "Đã lưu SM-2 ✓"
                    : "+ Lưu câu vừa gặp"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                Danh sách câu cần ôn lại ({missedQuestions.length} câu):
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {missedQuestions.map((mq, i) => (
                  <div
                    key={mq.id}
                    className="p-4 rounded-2xl eyecare-elevated border flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[11px] font-extrabold">
                          Câu sai #{i + 1} • {mq.category}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                          Đáp án đúng: {mq.correctLetter} — {mq.correctText}
                        </span>
                      </div>
                      <p className="text-sm font-bold font-serif">{mq.stem}</p>
                      <p className="text-xs opacity-85">💡 {mq.shortTip}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveSingleMissed(mq)}
                      className="px-3.5 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold shrink-0 flex items-center gap-1.5 hover:bg-amber-800 transition cursor-pointer"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      {savedFlashcardIds[mq.id]
                        ? "Đã lưu SM-2 ✓"
                        : "Lưu thẻ SM-2"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
