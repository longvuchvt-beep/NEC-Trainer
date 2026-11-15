"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  Bookmark,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  Send,
  BookOpen,
  Award,
  Volume2,
  Layers,
  AlertCircle,
} from "lucide-react";
import { SafeExam, SafeQuestion, normalizeExam } from "../../lib/safe-data";
import {
  saveExamSession,
  getExamSession,
  clearExamSession,
  saveLocalSubmission,
  getBookmarksMap,
  toggleBookmarkQuestion,
} from "../../lib/utilities/core-utilities-store";
import { addUserXp } from "../../lib/auth/auth-store";
import {
  getFullSettings,
  autoSaveMistakeItem,
  speakEnglishText,
  incrementDailyAnsweredCount,
} from "../../lib/linguistics/deep-linguistic-engine";

interface MobileExamRunnerProps {
  exam: any;
  initialMode?: "practice" | "test";
  onClose: () => void;
  onSavedSubmission?: (submission: any) => void;
}

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

export default function MobileExamRunner({
  exam: rawExam,
  initialMode = "practice",
  onClose,
  onSavedSubmission,
}: MobileExamRunnerProps) {
  const safeExam: SafeExam = useMemo(() => normalizeExam(rawExam), [rawExam]);
  const questions: SafeQuestion[] = safeExam.questions;

  const existingSession = useMemo(
    () => getExamSession(safeExam.id),
    [safeExam.id]
  );

  const [settings, setSettings] = useState(() => getFullSettings());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSettingsChange = () => setSettings(getFullSettings());
    window.addEventListener("veng-settings-changed", onSettingsChange);
    return () =>
      window.removeEventListener("veng-settings-changed", onSettingsChange);
  }, []);

  const [mode, setMode] = useState<"practice" | "test">(() => {
    if (existingSession?.studyMode === "test") return "test";
    return initialMode;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    const savedIdx = existingSession?.learnIndex || 0;
    return savedIdx >= 0 && savedIdx < questions.length ? savedIdx : 0;
  });

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (existingSession) {
      return {
        ...(existingSession.testAnswers || {}),
        ...(existingSession.learnAnswers || {}),
      };
    }
    return {};
  });

  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(() => {
    return existingSession?.learnChecked || {};
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return existingSession?.timeLeft || (safeExam.durationMinutes || 90) * 60;
  });

  const [bookmarksMap, setBookmarksMap] = useState(() => getBookmarksMap());
  const [showGridDrawer, setShowGridDrawer] = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [autoSaveBanner, setAutoSaveBanner] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    score20: number;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  const currentQuestion: SafeQuestion =
    questions[currentIndex] || questions[0];

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => Boolean(answers[k])).length,
    [answers]
  );

  // Auto-save progress on change
  useEffect(() => {
    if (submittedResult) return;
    saveExamSession(safeExam.id, {
      examTitle: safeExam.title,
      studyMode: mode === "test" ? "test" : "learn",
      learnIndex: currentIndex,
      learnAnswers: answers,
      learnChecked: checkedMap,
      testAnswers: answers,
      flaggedQuestions: {},
      timeLeft,
      answeredCount,
      totalQuestions: questions.length,
    });
  }, [
    safeExam.id,
    safeExam.title,
    mode,
    currentIndex,
    answers,
    checkedMap,
    timeLeft,
    answeredCount,
    questions.length,
    submittedResult,
  ]);

  // Countdown timer in Test mode
  useEffect(() => {
    if (mode !== "test" || submittedResult) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, submittedResult]);

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion || submittedResult) return;
    const qId = currentQuestion.id;

    if (mode === "practice" && checkedMap[qId]) return;

    const nextAnswers = { ...answers, [qId]: optionId };
    setAnswers(nextAnswers);
    incrementDailyAnsweredCount(1);

    if (mode === "practice") {
      setCheckedMap((prev) => ({ ...prev, [qId]: true }));
      if (optionId === currentQuestion.correctAnswer) {
        addUserXp(15);
        setAutoSaveBanner(null);
      } else {
        const correctOpt =
          currentQuestion.options.find(
            (o) => o.id === currentQuestion.correctAnswer
          ) || currentQuestion.options[0];
        const res = autoSaveMistakeItem({
          questionId: currentQuestion.id,
          stem: currentQuestion.prompt,
          options: currentQuestion.options,
          userWrongAnswer: optionId,
          correctAnswer: currentQuestion.correctAnswer,
          correctText: correctOpt.text,
          targetTerm: currentQuestion.linguisticBreakdown?.targetExpression,
          category: currentQuestion.partTitle,
          explanation: currentQuestion.explanation,
          sourceTag: `${safeExam.competition} • ${safeExam.school}`,
        });
        if (res.saved) {
          setAutoSaveBanner(
            "Đã tự động lưu vào Sổ Từ Sai kèm giải thích chuyên sâu"
          );
        }
      }
    }
  };

  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    const res = toggleBookmarkQuestion({
      questionId: currentQuestion.id,
      examId: safeExam.id,
      examTitle: safeExam.title,
      tournament: safeExam.competition,
      questionNumber: currentQuestion.number || currentIndex + 1,
      stem: currentQuestion.prompt,
      type: "mcq",
      options: currentQuestion.options,
      answer: currentQuestion.correctAnswer,
      explanationVi: currentQuestion.explanation,
    });
    setBookmarksMap({ ...res.map });
  };

  const handleResetExam = () => {
    clearExamSession(safeExam.id);
    setAnswers({});
    setCheckedMap({});
    setCurrentIndex(0);
    setSubmittedResult(null);
    setAutoSaveBanner(null);
    setTimeLeft((safeExam.durationMinutes || 90) * 60);
  };

  const handleSubmitExam = () => {
    let correctCount = 0;
    for (const q of questions) {
      const userAns = String(answers[q.id] || "").trim().toUpperCase();
      if (userAns && userAns === q.correctAnswer) {
        correctCount++;
      } else if (userAns && userAns !== q.correctAnswer) {
        const correctOpt =
          q.options.find((o) => o.id === q.correctAnswer) || q.options[0];
        autoSaveMistakeItem({
          questionId: q.id,
          stem: q.prompt,
          options: q.options,
          userWrongAnswer: userAns,
          correctAnswer: q.correctAnswer,
          correctText: correctOpt.text,
          targetTerm: q.linguisticBreakdown?.targetExpression,
          category: q.partTitle,
          explanation: q.explanation,
          sourceTag: `${safeExam.competition} • ${safeExam.school}`,
        });
      }
    }
    const totalCount = Math.max(1, questions.length);
    const score20 = Number(((correctCount / totalCount) * 20).toFixed(1));

    const submissionPayload = {
      id: `sub-${Date.now()}`,
      exam_id: safeExam.id,
      exam_title: safeExam.title,
      score: score20,
      correct_count: correctCount,
      total_questions: totalCount,
      answers,
      created_at: new Date().toISOString(),
    };

    saveLocalSubmission(submissionPayload);
    clearExamSession(safeExam.id);
    addUserXp(100 + correctCount * 5);

    if (onSavedSubmission) {
      onSavedSubmission(submissionPayload);
    }

    setSubmittedResult({
      score20,
      correctCount,
      totalCount,
    });
  };

  const isBookmarked = Boolean(
    currentQuestion && bookmarksMap[currentQuestion.id]
  );
  const selectedAns = currentQuestion ? answers[currentQuestion.id] : "";
  const isRevealed =
    Boolean(submittedResult) ||
    (mode === "practice" &&
      Boolean(currentQuestion && checkedMap[currentQuestion.id]));

  const progressPct = Math.round(
    (answeredCount / Math.max(1, questions.length)) * 100
  );
  const breakdown = currentQuestion?.linguisticBreakdown;

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-3">
      {/* Top Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setMode("practice")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === "practice"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Làm bài
            </button>
            <button
              type="button"
              onClick={() => setMode("test")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                mode === "test"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Kiểm tra
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {mode === "test" && !submittedResult && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleResetExam}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              title="Làm lại từ đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Exam Title & Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {safeExam.title}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">
              {answeredCount}/{questions.length} câu
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Submitted Score Banner */}
      {submittedResult && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                Điểm bài làm: {submittedResult.score20} / 20.0
              </h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Đúng {submittedResult.correctCount} /{" "}
                {submittedResult.totalCount} câu (
                {Math.round(
                  (submittedResult.correctCount / submittedResult.totalCount) *
                    100
                )}
                %)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetExam}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition"
          >
            Làm lại
          </button>
        </div>
      )}

      {/* Active Question Card */}
      {currentQuestion && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                {currentQuestion.partTitle}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {currentQuestion.passageText && (
                <button
                  type="button"
                  onClick={() => setShowPassage((v) => !v)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{showPassage ? "Ẩn bài đọc" : "Bài đọc"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                  isBookmarked
                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    isBookmarked ? "fill-amber-500 text-amber-500" : ""
                  }`}
                />
                <span>{isBookmarked ? "Đã lưu" : "Lưu câu"}</span>
              </button>
            </div>
          </div>

          {showPassage && currentQuestion.passageText && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 max-h-60 overflow-y-auto text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-serif whitespace-pre-line">
              {currentQuestion.passageText}
            </div>
          )}

          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
            {currentQuestion.prompt}
          </p>

          <div className="space-y-2.5">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedAns === opt.id;
              const isCorrectOption = opt.id === currentQuestion.correctAnswer;

              let cardClass =
                "border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 hover:border-indigo-500";

              if (isRevealed) {
                if (isCorrectOption) {
                  cardClass =
                    "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100";
                } else if (isSelected && !isCorrectOption) {
                  cardClass =
                    "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-100";
                }
              } else if (isSelected) {
                cardClass =
                  "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-100";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full p-3.5 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition active:scale-[0.99] ${cardClass}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {opt.id}
                    </span>
                    <span className="text-xs sm:text-sm font-medium leading-snug break-words">
                      {opt.text}
                    </span>
                  </div>
                  {isRevealed && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isRevealed && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {autoSaveBanner && isRevealed && selectedAns !== currentQuestion.correctAnswer && (
            <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-xs font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{autoSaveBanner}</span>
            </div>
          )}

          {/* 4-Layer Deep Linguistic Breakdown when Revealed */}
          {isRevealed && breakdown && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Giải Thích Ngôn Ngữ Chuyên Sâu
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      Đáp án {currentQuestion.correctAnswer}:{" "}
                      {breakdown.targetExpression}
                    </span>
                    {settings.showIpaAndRegister && (
                      <>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                          {breakdown.ipa}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                          {breakdown.register}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglishText(breakdown.targetExpression)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600 shrink-0"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {settings.explanationDepth === "deep" ? (
                <div className="space-y-2 text-xs leading-relaxed">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1. Bản chất & Gốc từ (Etymology & Nuance)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {breakdown.etymologyAndNuance}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-0.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2. Cấu trúc Kết hợp từ (Collocation & Syntax)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {breakdown.collocationAndSyntax}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>3. Phân tích Bẫy (Tại sao phương án khác sai)</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                      {breakdown.trapAnalysis}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom Question Navigation Controls */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 flex items-center justify-between gap-2 shadow-xs">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            setAutoSaveBanner(null);
            setCurrentIndex((i) => Math.max(0, i - 1));
          }}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <button
          type="button"
          onClick={() => setShowGridDrawer((v) => !v)}
          className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Danh sách câu</span>
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              setAutoSaveBanner(null);
              setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
            }}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
          >
            <span>Câu tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmitExam}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài</span>
          </button>
        )}
      </div>

      {!submittedResult &&
        answeredCount > 0 &&
        currentIndex < questions.length - 1 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmitExam}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                Chấm điểm ngay ({answeredCount}/{questions.length} câu)
              </span>
            </button>
          </div>
        )}

      {showGridDrawer && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Chọn câu hỏi nhanh</span>
            <button
              type="button"
              onClick={() => setShowGridDrawer(false)}
              className="text-indigo-600 dark:text-indigo-400"
            >
              Thu gọn
            </button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-56 overflow-y-auto">
            {questions.map((q, idx) => {
              const hasAns = Boolean(answers[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowGridDrawer(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-bold border transition ${
                    isCurrent
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : hasAns
                      ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
