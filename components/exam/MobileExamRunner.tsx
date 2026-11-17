"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  LayoutGrid,
  Send,
  Award,
  Brain,
  Zap,
  Volume2,
  Timer,
} from "lucide-react";
import { SafeExam, SafeQuestion, normalizeExam } from "../../lib/safe-data";
import {
  saveExamSession,
  getExamSession,
  clearExamSession,
  saveLocalSubmission,
  getBookmarksMap,
  toggleBookmarkQuestion,
  flushPendingSessionWrites,
} from "../../lib/utilities/core-utilities-store";
import { addUserXp } from "../../lib/auth/auth-store";
import {
  getFullSettings,
  autoSaveMistakeItem,
  incrementDailyAnsweredCount,
} from "../../lib/linguistics/deep-linguistic-engine";
import {
  getIntuitionModePreference,
  setIntuitionModePreference,
  getLockedReflexIds,
  recordLockedReflex,
  buildRedemptionTwinCard,
  RedemptionTwinCard,
  speakLexicalChunkEnGB,
} from "../../lib/linguistics/second-nature-engine";
import ExamTimer from "./ExamTimer";
import MemoizedQuestionCard from "./MemoizedQuestionCard";

interface MobileExamRunnerProps {
  exam: any;
  initialMode?: "practice" | "test";
  onClose: () => void;
  onSavedSubmission?: (submission: any) => void;
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

  // Isolated Timer Ref (never triggers parent re-renders on 1-second ticks)
  const initialSeconds =
    existingSession?.timeLeft || (safeExam.durationMinutes || 90) * 60;
  const timeLeftRef = useRef<number>(initialSeconds);
  const [timerResetSignal, setTimerResetSignal] = useState<number>(0);

  const [bookmarksMap, setBookmarksMap] = useState(() => getBookmarksMap());
  const [showGridDrawer, setShowGridDrawer] = useState(false);
  const [autoSaveBanner, setAutoSaveBanner] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    score20: number;
    correctCount: number;
    totalCount: number;
  } | null>(null);

  // ==========================================================================
  // SECOND-NATURE (BẢN NĂNG NGÔN NGỮ) TRAINING STATE
  // ==========================================================================
  const [intuitionMode, setIntuitionMode] = useState<boolean>(() =>
    getIntuitionModePreference()
  );
  const [lockedReflexIds, setLockedReflexIds] = useState<string[]>(() =>
    getLockedReflexIds()
  );

  // 3-Question Micro-Loop Queue & Active Redemption Twin Card
  const [redemptionQueue, setRedemptionQueue] = useState<RedemptionTwinCard[]>(
    []
  );
  const [activeRedemptionTwin, setActiveRedemptionTwin] =
    useState<RedemptionTwinCard | null>(null);
  const [twinSelectedAns, setTwinSelectedAns] = useState<string | null>(null);
  const [twinSecondsLeft, setTwinSecondsLeft] = useState<number>(5);
  const [twinLockedSuccess, setTwinLockedSuccess] = useState<boolean | null>(
    null
  );

  const currentQuestion: SafeQuestion =
    questions[currentIndex] || questions[0];

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((k) => Boolean(answers[k])).length,
    [answers]
  );

  // Debounced background session auto-save (800ms via requestIdleCallback in core-utilities-store)
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
      timeLeft: timeLeftRef.current,
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
    answeredCount,
    questions.length,
    submittedResult,
  ]);

  // Flush pending writes when leaving exam runner
  useEffect(() => {
    return () => {
      flushPendingSessionWrites();
    };
  }, []);

  // 5-Second Countdown for Active Redemption Twin Card
  useEffect(() => {
    if (!activeRedemptionTwin || twinSelectedAns !== null) return;
    setTwinSecondsLeft(5);
    const id = setInterval(() => {
      setTwinSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [activeRedemptionTwin, twinSelectedAns]);

  const handleToggleIntuitionMode = useCallback(() => {
    setIntuitionMode((prev) => {
      const next = !prev;
      setIntuitionModePreference(next);
      return next;
    });
  }, []);

  // Advance Micro-Loop Counter & Trigger Redemption Twin after 3 questions
  const advanceMicroLoopStep = useCallback(
    (nextQuestionIdx: number) => {
      setRedemptionQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue;
        const updated = prevQueue.map((item) => ({
          ...item,
          answeredSinceQueued: item.answeredSinceQueued + 1,
        }));

        const readyIdx = updated.findIndex(
          (item) =>
            item.answeredSinceQueued >= item.triggerAfterCount ||
            nextQuestionIdx + 1 >= item.originQuestionNumber + 3
        );

        if (readyIdx >= 0 && !activeRedemptionTwin) {
          const triggered = updated[readyIdx];
          setTimeout(() => {
            setTwinSelectedAns(null);
            setTwinLockedSuccess(null);
            setTwinSecondsLeft(5);
            setActiveRedemptionTwin(triggered);
          }, 180);
          return updated.filter((_, idx) => idx !== readyIdx);
        }
        return updated;
      });
    },
    [activeRedemptionTwin]
  );

  const handleSelectOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion || submittedResult) return;
      const qId = currentQuestion.id;

      if (mode === "practice" && checkedMap[qId]) return;

      setAnswers((prev) => ({ ...prev, [qId]: optionId }));
      incrementDailyAnsweredCount(1);

      if (mode === "practice") {
        setCheckedMap((prev) => ({ ...prev, [qId]: true }));
        if (optionId === currentQuestion.correctAnswer) {
          addUserXp(15);
          setAutoSaveBanner(null);
          advanceMicroLoopStep(currentIndex);
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

          // Queue 3-Question Micro-Loop Redemption Twin Card!
          const twinCard = buildRedemptionTwinCard(
            currentQuestion,
            currentIndex + 1
          );
          setRedemptionQueue((prev) => {
            const filtered = prev.filter(
              (t) => t.originQuestionId !== currentQuestion.id
            );
            return [...filtered, twinCard];
          });

          if (res.saved) {
            setAutoSaveBanner(
              `Đã lưu vào Sổ Từ Sai & Đặt lịch Lặp lại Tức thì sau 3 câu (sau Câu ${Math.min(
                questions.length,
                currentIndex + 4
              )})`
            );
          }
        }
      }
    },
    [
      currentQuestion,
      submittedResult,
      mode,
      checkedMap,
      safeExam.competition,
      safeExam.school,
      currentIndex,
      questions.length,
      advanceMicroLoopStep,
    ]
  );

  const handleAnswerRedemptionTwin = useCallback(
    (optId: "A" | "B" | "C" | "D") => {
      if (!activeRedemptionTwin || twinSelectedAns !== null) return;
      setTwinSelectedAns(optId);
      const isCorrect = optId === activeRedemptionTwin.correctAnswer;
      const within5Sec = twinSecondsLeft > 0;

      if (isCorrect && within5Sec) {
        setTwinLockedSuccess(true);
        addUserXp(25);
        const updatedLocked = recordLockedReflex(
          activeRedemptionTwin.originQuestionId
        );
        setLockedReflexIds(updatedLocked);
        speakLexicalChunkEnGB(activeRedemptionTwin.lexicalChunkTarget);
      } else if (isCorrect) {
        setTwinLockedSuccess(true);
        addUserXp(15);
        const updatedLocked = recordLockedReflex(
          activeRedemptionTwin.originQuestionId
        );
        setLockedReflexIds(updatedLocked);
      } else {
        setTwinLockedSuccess(false);
      }
    },
    [activeRedemptionTwin, twinSelectedAns, twinSecondsLeft]
  );

  const handleToggleBookmark = useCallback(() => {
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
  }, [
    currentQuestion,
    safeExam.id,
    safeExam.title,
    safeExam.competition,
    currentIndex,
  ]);

  const handleResetExam = useCallback(() => {
    clearExamSession(safeExam.id);
    setAnswers({});
    setCheckedMap({});
    setCurrentIndex(0);
    setSubmittedResult(null);
    setAutoSaveBanner(null);
    setRedemptionQueue([]);
    setActiveRedemptionTwin(null);
    timeLeftRef.current = (safeExam.durationMinutes || 90) * 60;
    setTimerResetSignal((s) => s + 1);
  }, [safeExam.id, safeExam.durationMinutes]);

  const handleSubmitExam = useCallback(() => {
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
  }, [
    questions,
    answers,
    safeExam.id,
    safeExam.title,
    safeExam.competition,
    safeExam.school,
    onSavedSubmission,
  ]);

  const isBookmarked = Boolean(
    currentQuestion && bookmarksMap[currentQuestion.id]
  );
  const selectedAns = currentQuestion ? answers[currentQuestion.id] || "" : "";
  const isRevealed =
    Boolean(submittedResult) ||
    (mode === "practice" &&
      Boolean(currentQuestion && checkedMap[currentQuestion.id]));

  const isCurrentQuestionLockedReflex = Boolean(
    currentQuestion && lockedReflexIds.includes(currentQuestion.id)
  );

  const progressPct = Math.round(
    (answeredCount / Math.max(1, questions.length)) * 100
  );

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-3">
      {/* Top Bar */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
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
              <ExamTimer
                initialSeconds={initialSeconds}
                isRunning={mode === "test" && !submittedResult}
                resetSignal={timerResetSignal}
                timeLeftRef={timeLeftRef}
                onExpire={handleSubmitExam}
              />
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

        {/* Second-Nature Intuition Mode Header Control + Micro-Loop Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleToggleIntuitionMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              intuitionMode
                ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>
              Chế độ Rèn Bản Năng (Intuition Mode): {intuitionMode ? "BẬT" : "TẮT"}
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            {redemptionQueue.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const nextTwin = redemptionQueue[0];
                  setRedemptionQueue((q) => q.slice(1));
                  setTwinSelectedAns(null);
                  setTwinLockedSuccess(null);
                  setTwinSecondsLeft(5);
                  setActiveRedemptionTwin(nextTwin);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 hover:bg-amber-100 transition"
                title="Nhấn để kiểm tra thẻ lặp lại tức thì ngay"
              >
                <Timer className="w-3 h-3" />
                <span>Lặp sau 3 câu: {redemptionQueue.length}</span>
              </button>
            )}

            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Đã Khóa Phản Xạ: {lockedReflexIds.length}</span>
            </span>
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

      {/* Mechanic 4: "3-Question Micro-Loop" Instant Redemption Twin Card Popup */}
      {activeRedemptionTwin && (
        <div className="rounded-2xl bg-indigo-950 text-white border-2 border-indigo-400 p-4 sm:p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-xs font-extrabold">
                Vòng Lặp Tức Thì Sau 3 Câu ( từ Câu #{activeRedemptionTwin.originQuestionNumber} )
              </span>
              <span className="text-xs text-indigo-200 font-semibold">
                Trả lời trong 5 giây để khóa vào Bản năng C1/C2
              </span>
            </div>

            <div className="px-2.5 py-1 rounded-lg bg-indigo-900 border border-indigo-500 text-xs font-bold tabular-nums flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-amber-300" />
              <span>{twinSecondsLeft}s</span>
            </div>
          </div>

          <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
            {activeRedemptionTwin.microPrompt}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeRedemptionTwin.options.map((opt) => {
              const isSelected = twinSelectedAns === opt.id;
              const isCorrect = opt.id === activeRedemptionTwin.correctAnswer;
              let btnStyle =
                "border-indigo-700 bg-indigo-900/70 hover:border-amber-400 text-white";
              if (twinSelectedAns !== null) {
                if (isCorrect) {
                  btnStyle = "border-emerald-400 bg-emerald-600 text-white";
                } else if (isSelected && !isCorrect) {
                  btnStyle = "border-rose-400 bg-rose-600 text-white";
                }
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAnswerRedemptionTwin(opt.id)}
                  className={`p-3 rounded-xl border-2 text-left text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 transition ${btnStyle}`}
                >
                  <span>
                    {opt.id}. {opt.text}
                  </span>
                  {twinSelectedAns !== null && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  {twinSelectedAns !== null && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {twinSelectedAns !== null && (
            <div className="p-3 rounded-xl bg-indigo-900/90 border border-indigo-700 flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                {twinLockedSuccess ? (
                  <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Đã Khóa Phản Xạ (Locked Into Second-Nature) +25 XP!
                    </span>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-rose-300">
                    Cụm chuẩn cần nhớ: [{activeRedemptionTwin.lexicalChunkTarget}]
                  </div>
                )}
                <div className="text-[11px] text-indigo-200">
                  Công thức: {activeRedemptionTwin.syntacticFormula}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    speakLexicalChunkEnGB(
                      activeRedemptionTwin.lexicalChunkTarget
                    )
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe en-GB</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRedemptionTwin(null)}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                >
                  Tiếp tục làm đề
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Memoized Question Card (Only re-renders when active question props change) */}
      {currentQuestion && (
        <MemoizedQuestionCard
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={questions.length}
          selectedAns={selectedAns}
          isRevealed={isRevealed}
          isBookmarked={isBookmarked}
          intuitionModeEnabled={intuitionMode}
          isLockedReflex={isCurrentQuestionLockedReflex}
          autoSaveBanner={autoSaveBanner}
          settings={settings}
          onSelectOption={handleSelectOption}
          onToggleBookmark={handleToggleBookmark}
        />
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
              const nextIdx = Math.min(questions.length - 1, currentIndex + 1);
              setCurrentIndex(nextIdx);
              advanceMicroLoopStep(nextIdx);
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
