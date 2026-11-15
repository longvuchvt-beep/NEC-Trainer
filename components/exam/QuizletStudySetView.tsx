'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Clock,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookmarkPlus,
  Check,
  MapPin,
  Award,
  PenTool,
  RefreshCw,
  BrainCircuit,
  FileCheck2,
  Gamepad2,
  Puzzle,
  Star,
  StickyNote,
  Edit3,
  Printer,
  Flag
} from 'lucide-react';
import { isQuestionCorrect } from './InteractiveExamWorkspace';
import OzdicCollocationPopover, { OzdicEntry } from '../dictionary/OzdicCollocationPopover';
import ActiveTransferMiniDrill from './ActiveTransferMiniDrill';
import AntiBoredomArcadeHub from '../games/AntiBoredomArcadeHub';
import InlineQuestionEditModal from '../utilities/InlineQuestionEditModal';
import PrintableWorksheetModal from '../utilities/PrintableWorksheetModal';
import {
  saveExamSession,
  getExamSession,
  clearExamSession,
  saveLocalSubmission,
  getBookmarksMap,
  toggleBookmarkQuestion,
  getQuestionNotesMap,
  saveQuestionNote,
  applyQuestionEditOverridesToExam,
  getAppSettings,
  QuestionEditPatch
} from '../../lib/utilities/core-utilities-store';

export type StudySetMode = 'learn' | 'test' | 'flashcards' | 'games' | 'aiquiz';

interface QuizletStudySetViewProps {
  exam: any;
  initialMode?: 'learn' | 'test' | 'flashcards' | 'games' | 'practice' | 'simulation';
  onClose: () => void;
  onExamUpdated?: (updatedExam: any) => void;
  onSavedSubmission?: (submission: any) => void;
  onSaveVocab?: (vocabItem: any) => void;
  onOpenWritingTask?: (part: any, exam: any) => void;
}

export default function QuizletStudySetView({
  exam: initialExam,
  initialMode = 'learn',
  onClose,
  onExamUpdated,
  onSavedSubmission,
  onSaveVocab,
  onOpenWritingTask
}: QuizletStudySetViewProps) {
  const [currentExam, setCurrentExam] = useState<any>(() =>
    applyQuestionEditOverridesToExam(initialExam)
  );
  const [studyMode, setStudyMode] = useState<StudySetMode>(
    initialMode === 'simulation' || initialMode === 'test'
      ? 'test'
      : initialMode === 'flashcards'
      ? 'flashcards'
      : initialMode === 'games'
      ? 'games'
      : 'learn'
  );

  useEffect(() => {
    setStudyMode(
      initialMode === 'simulation' || initialMode === 'test'
        ? 'test'
        : initialMode === 'flashcards'
        ? 'flashcards'
        : initialMode === 'games'
        ? 'games'
        : 'learn'
    );
  }, [initialMode]);

  // Flatten all questions across sections in clean sequential order (1 -> 60+)
  const allQuestions = useMemo(() => {
    const s = currentExam?.sections || {};
    const list: any[] = [];
    ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach((secKey) => {
      const secObj = s[secKey];
      const parts = secObj?.parts || [];
      parts.forEach((part: any) => {
        (part.questions || []).forEach((q: any) => {
          list.push({
            ...q,
            sectionKey: secKey,
            sectionTitle: secObj?.title || secKey,
            partId: part.id,
            partTitle: part.title,
            partInstructions: part.instructions,
            partPassage: part.passage || null,
            partPassageTitle: part.passageTitle || null
          });
        });
      });
    });
    return list.sort((a, b) => Number(a.number) - Number(b.number));
  }, [currentExam]);

  // Extract all C1/C2 Flashcards from the current exam's questions
  const examFlashcards = useMemo(() => {
    const cards: Array<{
      id: string;
      term: string;
      category: string;
      meaningVi: string;
      definitionEn: string;
      example: string;
      questionNumber: number;
    }> = [];
    const seen = new Set<string>();

    allQuestions.forEach((q) => {
      const v = q.explanation?.vocabItem;
      if (v && v.term) {
        const key = String(v.term).toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          cards.push({
            id: `fc-${q.id}`,
            term: v.term,
            category: v.category || 'C1/C2 LEXIS',
            meaningVi: v.meaningVi || v.definition_vi || q.explanation?.vi || '',
            definitionEn: q.explanation?.en || v.example || '',
            example: v.example || q.stem,
            questionNumber: q.number
          });
        }
      }
    });
    return cards;
  }, [allQuestions]);

  // ==================== LEARN & TEST AUTO-SAVED SESSION STATE ====================
  const savedSession = useMemo(
    () => (initialExam?.id ? getExamSession(initialExam.id) : null),
    [initialExam?.id]
  );

  const [learnIndex, setLearnIndex] = useState<number>(() => savedSession?.learnIndex || 0);
  const [learnAnswers, setLearnAnswers] = useState<Record<string, string>>(
    () => savedSession?.learnAnswers || {}
  );
  const [learnChecked, setLearnChecked] = useState<Record<string, boolean>>(
    () => savedSession?.learnChecked || {}
  );
  const [textDraft, setTextDraft] = useState<string>('');
  const [easyTapMode, setEasyTapMode] = useState<boolean>(true);

  // ==================== TEST MODE STATE ====================
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>(
    () => savedSession?.testAnswers || {}
  );
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>(
    () => savedSession?.flaggedQuestions || {}
  );
  const [testSubmitted, setTestSubmitted] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(
    () => savedSession?.timeLeft || (initialExam?.duration_minutes || 180) * 60
  );

  // ==================== CORE UTILITIES: BOOKMARKS, NOTES, INLINE EDIT & PRINT ====================
  const [bookmarksMap, setBookmarksMap] = useState<Record<string, any>>(() =>
    getBookmarksMap()
  );
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() =>
    getQuestionNotesMap()
  );
  const [openNoteIds, setOpenNoteIds] = useState<Record<string, boolean>>({});
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // ==================== FLASHCARDS MODE STATE ====================
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [savedCardMap, setSavedCardMap] = useState<Record<string, boolean>>({});

  // ==================== AI QUIZ EXPANSION STATE ====================
  const [isExpandingQuiz, setIsExpandingQuiz] = useState<boolean>(false);
  const [lastExpandedCount, setLastExpandedCount] = useState<number>(0);

  // ==================== DOUBLE-CLICK OZDIC COLLOCATION POPOVER STATE ====================
  const [ozdicEntry, setOzdicEntry] = useState<OzdicEntry | null>(null);
  const [ozdicLoading, setOzdicLoading] = useState<boolean>(false);

  const lookupOzdic = async (rawWord: string) => {
    const cleaned = String(rawWord || '')
      .trim()
      .replace(/^[^a-zA-Z-]+|[^a-zA-Z-]+$/g, '');
    if (!cleaned || cleaned.length < 2) return;
    setOzdicLoading(true);
    try {
      const res = await fetch(`/api/dictionary/ozdic?word=${encodeURIComponent(cleaned)}`);
      if (res.ok) {
        const data = await res.json();
        setOzdicEntry(data);
      }
    } catch {} finally {
      setOzdicLoading(false);
    }
  };

  const handleDoubleClickWord = (e: React.MouseEvent<HTMLElement>) => {
    const sel = typeof window !== 'undefined' ? window.getSelection()?.toString()?.trim() : '';
    if (sel && /^[a-zA-Z-]{2,28}$/.test(sel)) {
      lookupOzdic(sel);
      return;
    }

    const targetText = (e.target as HTMLElement)?.innerText || '';
    const englishWords = (targetText.match(/\b[a-zA-Z]{5,22}\b/g) || []).filter(
      (w) => !/^(Question|Choose|Section|correct|answer)$/i.test(w)
    );
    if (englishWords.length > 0) {
      const preferred =
        englishWords.find((w) =>
          /^(disclose|telemetry|proliferation|dichotomy|tethered|entrench|relegate|epistemic|mitigate|alleviate|ostensibly|exacerbate|ubiquitous|paradigm|scrutiny|precipitate)$/i.test(
            w
          )
        ) || englishWords[0];
      lookupOzdic(preferred);
    }
  };

  useEffect(() => {
    setCurrentExam(applyQuestionEditOverridesToExam(initialExam));
  }, [initialExam]);

  const activeLearnQuestion = allQuestions[learnIndex] || allQuestions[0];

  useEffect(() => {
    if (activeLearnQuestion) {
      setTextDraft(learnAnswers[activeLearnQuestion.id] || '');
    }
  }, [learnIndex, activeLearnQuestion?.id]);

  // Real-time Auto-Save Session on every change
  const answeredSessionCount = useMemo(() => {
    const learnCount = Object.keys(learnChecked).length;
    const testCount = Object.keys(testAnswers).filter((k) =>
      String(testAnswers[k] || '').trim()
    ).length;
    return Math.max(learnCount, testCount);
  }, [learnChecked, testAnswers]);

  useEffect(() => {
    if (!currentExam?.id) return;
    if (
      answeredSessionCount > 0 ||
      learnIndex > 0 ||
      Object.keys(flaggedQuestions).length > 0
    ) {
      saveExamSession(currentExam.id, {
        examTitle: currentExam.title,
        studyMode: studyMode === 'aiquiz' ? 'learn' : studyMode,
        learnIndex,
        learnAnswers,
        learnChecked,
        testAnswers,
        flaggedQuestions,
        timeLeft,
        answeredCount: answeredSessionCount,
        totalQuestions: allQuestions.length
      });
    }
  }, [
    currentExam?.id,
    currentExam?.title,
    studyMode,
    learnIndex,
    learnAnswers,
    learnChecked,
    testAnswers,
    flaggedQuestions,
    timeLeft,
    answeredSessionCount,
    allQuestions.length
  ]);

  const handleResetExamSession = () => {
    if (currentExam?.id) {
      clearExamSession(currentExam.id);
    }
    setLearnIndex(0);
    setLearnAnswers({});
    setLearnChecked({});
    setTestAnswers({});
    setFlaggedQuestions({});
    setTestSubmitted(false);
    setTestResult(null);
    setTimeLeft((currentExam?.duration_minutes || 180) * 60);
    setTextDraft('');
  };

  const handleToggleBookmarkOnQuestion = (q: any) => {
    if (!q || !currentExam) return;
    const res = toggleBookmarkQuestion({
      questionId: q.id,
      examId: currentExam.id,
      examTitle: currentExam.title,
      tournament: currentExam.tournament,
      questionNumber: q.number,
      stem: q.stem,
      type: q.type,
      options: q.options,
      answer: q.answer,
      givenWord: q.rootWord || q.givenWord,
      explanationVi: q.explanation?.vi || ''
    });
    setBookmarksMap({ ...res.map });
  };

  const handleQuestionInlineSaved = (questionId: string, patch: QuestionEditPatch) => {
    const updated = applyQuestionEditOverridesToExam(currentExam);
    setCurrentExam(updated);
    if (onExamUpdated) {
      onExamUpdated(updated);
    }
  };

  // Test mode timer
  useEffect(() => {
    if (studyMode !== 'test' || testSubmitted) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [studyMode, testSubmitted]);

  // Keyboard shortcuts for Learn Mode (Enter -> Next Question) & Flashcards Mode (Space -> Flip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (studyMode === 'flashcards' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        if (e.key === ' ') {
          e.preventDefault();
          setIsCardFlipped((f) => !f);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setIsCardFlipped(false);
          setCardIndex((i) => (i + 1) % Math.max(1, examFlashcards.length));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setIsCardFlipped(false);
          setCardIndex(
            (i) => (i - 1 + Math.max(1, examFlashcards.length)) % Math.max(1, examFlashcards.length)
          );
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, examFlashcards.length]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Learn Mode: Select MCQ Option -> Instant Feedback (+ optional Auto-Advance from Settings)
  const handleSelectLearnOption = (q: any, optionId: string) => {
    setLearnAnswers((prev) => ({ ...prev, [q.id]: optionId }));
    setLearnChecked((prev) => ({ ...prev, [q.id]: true }));
    const appSettings = getAppSettings();
    if (
      appSettings.autoAdvanceEnabled &&
      String(q.answer).toUpperCase() === String(optionId).toUpperCase()
    ) {
      setTimeout(() => {
        setLearnIndex((prevIdx) =>
          prevIdx + 1 < allQuestions.length ? prevIdx + 1 : 0
        );
      }, 1100);
    }
  };

  // Learn Mode: Check Typed Input (Word Formation / Open Cloze / Sentence Transform)
  const handleCheckLearnText = (q: any) => {
    if (!textDraft.trim()) return;
    setLearnAnswers((prev) => ({ ...prev, [q.id]: textDraft.trim() }));
    setLearnChecked((prev) => ({ ...prev, [q.id]: true }));
  };

  const handleNextLearnQuestion = () => {
    if (learnIndex + 1 < allQuestions.length) {
      setLearnIndex(learnIndex + 1);
    } else {
      setLearnIndex(0);
    }
  };

  // Submit full Test Mode
  const handleSubmitFullTest = async () => {
    if (testSubmitted) return;
    let correctCount = 0;
    allQuestions.forEach((q) => {
      if (isQuestionCorrect(q, testAnswers[q.id] || '')) {
        correctCount++;
      }
    });
    const total = Math.max(1, allQuestions.length);
    const percentage = Number(((correctCount / total) * 100).toFixed(1));
    const score20 = Number(((percentage / 100) * 20).toFixed(1));

    const payload = {
      exam_id: currentExam.id,
      exam_title: currentExam.title,
      tournament: currentExam.tournament,
      mode: 'simulation',
      score: score20,
      max_score: 20,
      percentage,
      time_spent_seconds: Math.max(30, (currentExam.duration_minutes || 180) * 60 - timeLeft),
      answers: testAnswers,
      section_scores: {}
    };

    saveLocalSubmission(payload);
    clearExamSession(currentExam.id);
    setTestSubmitted(true);
    setTestResult({ ...payload, correctCount, total });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok && onSavedSubmission) {
        onSavedSubmission(await res.json());
      } else if (onSavedSubmission) {
        onSavedSubmission(payload);
      }
    } catch {
      if (onSavedSubmission) onSavedSubmission(payload);
    }
  };

  // 1-Click AIQuiz Expansion ("✨ Sinh thêm 20 câu tương tự (AIQuiz)")
  const handleExpandExamWithAI = async () => {
    if (isExpandingQuiz) return;
    setIsExpandingQuiz(true);
    try {
      const res = await fetch(`/api/exams/${currentExam.id}/expand-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.updatedExam) {
        const previousLen = allQuestions.length;
        setCurrentExam(data.updatedExam);
        setLastExpandedCount(data.addedCount || 20);
        if (onExamUpdated) onExamUpdated(data.updatedExam);
        // Jump directly to the first newly generated question in Learn Mode
        setStudyMode('learn');
        setLearnIndex(previousLen);
      }
    } catch {} finally {
      setIsExpandingQuiz(false);
    }
  };

  const masteredInLearnCount = useMemo(() => {
    return allQuestions.filter(
      (q) => learnChecked[q.id] && isQuestionCorrect(q, learnAnswers[q.id] || '')
    ).length;
  }, [allQuestions, learnChecked, learnAnswers]);

  return (
    <div
      onDoubleClick={handleDoubleClickWord}
      className="min-h-screen eyecare-canvas pb-16"
    >
      {/* ==================== TOP STUDY SET BAR (QUIZLET / QUIZIZZ STYLE) ==================== */}
      <div className="sticky top-0 z-30 eyecare-card border-b px-4 lg:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Back button + Set Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border eyecare-elevated hover:bg-amber-900 hover:text-amber-50 text-xs font-extrabold flex items-center gap-1.5 transition shrink-0"
              title="Quay lại Thư viện Đề"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Thư viện</span>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-900 text-amber-50">
                  {currentExam.tournament}
                </span>
                <span className="text-xs opacity-70 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {currentExam.province_school}
                </span>
                <span className="text-xs font-bold cloze-mono-input px-2 py-0.5 rounded-md eyecare-elevated border">
                  {allQuestions.length} câu hỏi
                </span>
              </div>
              <h1 className="text-sm md:text-base font-extrabold truncate mt-0.5">
                {currentExam.title}
              </h1>
            </div>
          </div>

          {/* Right: 4 Clean Quizlet / AIQuiz Study Modes */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStudyMode('learn')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                studyMode === 'learn'
                  ? 'bg-amber-900 text-amber-50 shadow-sm'
                  : 'eyecare-elevated border hover:opacity-90'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              1. Chế độ Học (Learn)
            </button>

            <button
              type="button"
              onClick={() => setStudyMode('test')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                studyMode === 'test'
                  ? 'bg-amber-900 text-amber-50 shadow-sm'
                  : 'eyecare-elevated border hover:opacity-90'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              2. Làm Đề (Test)
            </button>

            <button
              type="button"
              onClick={() => setStudyMode('flashcards')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                studyMode === 'flashcards'
                  ? 'bg-amber-900 text-amber-50 shadow-sm'
                  : 'eyecare-elevated border hover:opacity-90'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3. Thẻ Từ ({examFlashcards.length})
            </button>

            <button
              type="button"
              onClick={() => setStudyMode('games')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                studyMode === 'games'
                  ? 'bg-amber-900 text-amber-50 shadow-sm'
                  : 'eyecare-elevated border hover:opacity-90'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              4. 🎮 Mini-Games C1/C2
            </button>

            <button
              type="button"
              disabled={isExpandingQuiz}
              onClick={handleExpandExamWithAI}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isExpandingQuiz ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              ✨ Sinh thêm 20 câu tương tự (AIQuiz)
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-extrabold eyecare-elevated border hover:border-amber-800 flex items-center gap-1.5 transition cursor-pointer"
              title="In đề giấy A4 hoặc Xuất PDF (Kèm tùy chọn Đáp án)"
            >
              <Printer className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
              <span>🖨️ In đề / Xuất PDF</span>
            </button>

            {answeredSessionCount > 0 && (
              <button
                type="button"
                onClick={handleResetExamSession}
                className="px-3 py-2 rounded-xl text-xs font-extrabold bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 flex items-center gap-1.5 transition cursor-pointer"
                title="Xóa tiến độ đang lưu để làm lại từ đầu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>🔄 Làm lại từ đầu (Reset {answeredSessionCount}/{allQuestions.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner when AIQuiz adds +20 questions */}
      {lastExpandedCount > 0 && (
        <div className="max-w-4xl mx-auto mt-4 px-4">
          <div className="p-3 rounded-2xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Đã sinh thêm {lastExpandedCount} câu hỏi C1/C2 tương tự vào bộ đề này! Tổng số câu hiện tại: {allQuestions.length} câu.
            </span>
            <button
              type="button"
              onClick={() => setLastExpandedCount(0)}
              className="text-xs underline opacity-75"
            >
              Ẩn
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODE 1: CHẾ ĐỘ HỌC (LEARN MODE — QUIZLET / QUIZIZZ SINGLE CARD) ==================== */}
      {studyMode === 'learn' && activeLearnQuestion && (
        <div className="max-w-5xl mx-auto px-4 pt-6 space-y-5">
          {/* Clean Top Progress Bar */}
          <div className="eyecare-card rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold cloze-mono-input">
                Câu {learnIndex + 1} / {allQuestions.length}
              </span>
              <span className="text-xs font-semibold opacity-75">
                {activeLearnQuestion.partTitle}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Đã thuộc: {masteredInLearnCount} / {allQuestions.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setLearnIndex((i) => (i - 1 + allQuestions.length) % allQuestions.length)
                  }
                  className="p-1.5 rounded-lg border eyecare-elevated hover:opacity-80"
                  title="Câu trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextLearnQuestion}
                  className="p-1.5 rounded-lg border eyecare-elevated hover:opacity-80"
                  title="Câu tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress Line */}
          <div className="h-2 w-full rounded-full eyecare-elevated overflow-hidden">
            <div
              style={{ width: `${Math.round(((learnIndex + 1) / allQuestions.length) * 100)}%` }}
              className="h-full bg-amber-800 transition-all duration-300"
            />
          </div>

          {/* Main Centered Study Workspace (2-column if question has a Reading/Cloze passage, else centered single card) */}
          <div
            className={`grid grid-cols-1 ${
              activeLearnQuestion.partPassage ? 'lg:grid-cols-12 gap-6' : 'max-w-3xl mx-auto'
            }`}
          >
            {/* Optional Reading / Cloze Passage Box */}
            {activeLearnQuestion.partPassage && (
              <div className="lg:col-span-6 eyecare-card rounded-3xl border p-6 max-h-[680px] overflow-y-auto space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    {activeLearnQuestion.partPassageTitle || 'Ngữ liệu bài đọc'}
                  </div>
                  <span className="text-[11px] font-semibold opacity-70">
                    💡 Nhấp đúp từ tiếng Anh bất kỳ để tra Ozdic Collocation
                  </span>
                </div>
                <div
                  className="passage-prose text-sm md:text-base leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: activeLearnQuestion.partPassage.replace(
                      new RegExp(`\\{\\{${activeLearnQuestion.number}\\}\\}|\\(${activeLearnQuestion.number}\\)`, 'g'),
                      `<mark class="bg-amber-300 text-amber-950 font-bold px-2 py-0.5 rounded">[ Ô số ${activeLearnQuestion.number} ]</mark>`
                    )
                  }}
                />

                {/* Post-Reading Active Transfer Mini-Drill */}
                <ActiveTransferMiniDrill
                  passageTitle={activeLearnQuestion.partPassageTitle || activeLearnQuestion.partTitle}
                  passageHtml={activeLearnQuestion.partPassage}
                  onSaveVocab={onSaveVocab}
                />
              </div>
            )}

            {/* Focused Question Card */}
            <div
              className={`${
                activeLearnQuestion.partPassage ? 'lg:col-span-6' : ''
              } eyecare-card rounded-3xl border p-6 md:p-8 shadow-sm space-y-6`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  {activeLearnQuestion.type === 'mcq' && 'Trắc nghiệm C1/C2 (Multiple Choice)'}
                  {activeLearnQuestion.type === 'word_formation' &&
                    `Cấu tạo từ (Word Formation) • Gốc: ${
                      activeLearnQuestion.rootWord || activeLearnQuestion.givenWord
                    }`}
                  {activeLearnQuestion.type === 'open_cloze' && 'Điền từ (Open Cloze — 1 từ)'}
                  {activeLearnQuestion.type === 'tfng' && 'Đúng / Sai / Không nêu (T/F/NG)'}
                  {activeLearnQuestion.type === 'sentence_transformation' &&
                    `Viết lại câu • Từ khóa: ${activeLearnQuestion.keyword}`}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleBookmarkOnQuestion(activeLearnQuestion)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                      bookmarksMap[activeLearnQuestion.id]
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'eyecare-elevated hover:border-amber-800'
                    }`}
                    title="Ghim câu hỏi khó này vào Sổ tay ⭐"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        bookmarksMap[activeLearnQuestion.id] ? 'fill-slate-950' : ''
                      }`}
                    />
                    <span>
                      {bookmarksMap[activeLearnQuestion.id] ? '⭐ Đã ghim' : '⭐ Lưu câu khó'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenNoteIds((prev) => ({
                        ...prev,
                        [activeLearnQuestion.id]: !prev[activeLearnQuestion.id]
                      }))
                    }
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
                      notesMap[activeLearnQuestion.id]
                        ? 'bg-amber-900/15 border-amber-700 text-amber-900 dark:text-amber-300'
                        : 'eyecare-elevated hover:border-amber-800'
                    }`}
                    title="Mở ghi chú cá nhân cho câu hỏi này"
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>📝 Ghi chú cá nhân</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingQuestion(activeLearnQuestion)}
                    className="px-2.5 py-1 rounded-lg eyecare-elevated border hover:border-amber-800 text-[11px] font-extrabold flex items-center gap-1 transition cursor-pointer"
                    title="Sửa nhanh nội dung câu hỏi, đáp án hoặc giải thích"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>✏️ Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetWord =
                        activeLearnQuestion.explanation?.vocabItem?.term?.split(/\s+/)[0] ||
                        'disclose';
                      lookupOzdic(targetWord);
                    }}
                    className="px-2.5 py-1 rounded-lg eyecare-elevated border hover:border-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    title="Nhấp đúp từ bất kỳ hoặc bấm vào đây để mở từ điển Ozdic Collocation"
                  >
                    <BookOpen className="w-3 h-3 text-amber-800" />
                    <span>📖 Tra Ozdic</span>
                  </button>
                </div>
              </div>

              {/* Collapsible Personal Sticky Note Input */}
              {(openNoteIds[activeLearnQuestion.id] || notesMap[activeLearnQuestion.id]) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-600/30 space-y-1.5">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>📝 Ghi chú cá nhân của bạn (Tự động lưu cho Câu #{activeLearnQuestion.number}):</span>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenNoteIds((prev) => ({
                          ...prev,
                          [activeLearnQuestion.id]: false
                        }))
                      }
                      className="text-[10px] underline opacity-75 cursor-pointer"
                    >
                      Thu gọn
                    </button>
                  </div>
                  <input
                    type="text"
                    value={notesMap[activeLearnQuestion.id] || ''}
                    onChange={(e) => {
                      const next = saveQuestionNote(activeLearnQuestion.id, e.target.value);
                      setNotesMap({ ...next });
                    }}
                    placeholder="Gõ mẹo nhớ nhanh, cấu trúc đồng nghĩa hoặc lưu ý bẫy của câu này..."
                    className="w-full px-3.5 py-2 rounded-xl eyecare-card border text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              )}

              {/* Question Stem */}
              <h2 className="text-lg md:text-xl font-bold leading-relaxed font-serif">
                {activeLearnQuestion.stem}
              </h2>

              {/* Answer Input Area */}
              {(activeLearnQuestion.type === 'mcq' || activeLearnQuestion.type === 'tfng') ? (
                <div className="grid grid-cols-1 gap-3">
                  {(activeLearnQuestion.options || []).map((opt: any) => {
                    const isChecked = Boolean(learnChecked[activeLearnQuestion.id]);
                    const userChoice = learnAnswers[activeLearnQuestion.id];
                    const isSelected =
                      String(userChoice).toUpperCase() === String(opt.id).toUpperCase();
                    const isRight =
                      String(activeLearnQuestion.answer).toUpperCase() ===
                      String(opt.id).toUpperCase();

                    let cardCls =
                      'eyecare-elevated border hover:border-amber-800/60 hover:shadow-sm';
                    if (isChecked) {
                      if (isRight) {
                        cardCls =
                          'border-2 border-emerald-600 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold';
                      } else if (isSelected && !isRight) {
                        cardCls =
                          'border-2 border-rose-600 bg-rose-500/15 text-rose-950 dark:text-rose-100';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectLearnOption(activeLearnQuestion, opt.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer ${cardCls}`}
                      >
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold cloze-mono-input shrink-0 ${
                            isChecked && isRight
                              ? 'bg-emerald-600 text-white'
                              : isChecked && isSelected && !isRight
                              ? 'bg-rose-600 text-white'
                              : 'eyecare-card border'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="text-sm md:text-base flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {(activeLearnQuestion.rootWord || activeLearnQuestion.givenWord) && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-900 text-amber-50 text-xs cloze-mono-input font-bold">
                      Từ gốc: {activeLearnQuestion.rootWord || activeLearnQuestion.givenWord}
                    </div>
                  )}
                  {activeLearnQuestion.promptPrefix && (
                    <div className="text-xs opacity-75">
                      Gợi ý đầu câu: <strong>&ldquo;{activeLearnQuestion.promptPrefix}...&rdquo;</strong>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={textDraft}
                      disabled={Boolean(learnChecked[activeLearnQuestion.id])}
                      onFocus={() => {
                        if (!textDraft && activeLearnQuestion.promptPrefix) {
                          setTextDraft(`${activeLearnQuestion.promptPrefix} `);
                        }
                      }}
                      onChange={(e) => setTextDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!learnChecked[activeLearnQuestion.id]) {
                            handleCheckLearnText(activeLearnQuestion);
                          } else {
                            handleNextLearnQuestion();
                          }
                        }
                      }}
                      placeholder="Nhập đáp án của bạn rồi nhấn Enter..."
                      className="flex-1 px-4 py-3 rounded-2xl border eyecare-elevated cloze-mono-input text-sm md:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                    {!learnChecked[activeLearnQuestion.id] && (
                      <button
                        type="button"
                        onClick={() => handleCheckLearnText(activeLearnQuestion)}
                        className="px-5 py-3 rounded-2xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs md:text-sm font-extrabold shrink-0 cursor-pointer"
                      >
                        Kiểm tra (Enter)
                      </button>
                    )}
                  </div>

                  {/* Mode D: Tap-to-Fill Word Bank Toggle & Chips */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setEasyTapMode((v) => !v)}
                        className="px-3 py-1 rounded-xl eyecare-elevated border hover:border-amber-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Puzzle className="w-3.5 h-3.5 text-amber-800" />
                        <span>
                          {easyTapMode
                            ? '🧩 Đang bật Ngân Hàng Từ Gợi Ý (Easy Tap Mode)'
                            : '🧩 Bật Ngân Hàng Từ Gợi Ý (Easy Tap Mode)'}
                        </span>
                      </button>
                      <span className="text-[11px] opacity-70">
                        Chạm vào từ gợi ý để điền ngay không cần gõ phím
                      </span>
                    </div>

                    {easyTapMode && (
                      <div className="flex flex-wrap gap-2 p-3 rounded-2xl eyecare-elevated border">
                        {(() => {
                          const ans = String(activeLearnQuestion.answer || '').trim();
                          const root = String(
                            activeLearnQuestion.rootWord || activeLearnQuestion.givenWord || 'FORM'
                          );
                          const chips =
                            activeLearnQuestion.type === 'word_formation'
                              ? [ans, `${root}ING`, `UN${root}ED`, `${root}TION`]
                              : activeLearnQuestion.type === 'open_cloze'
                              ? [ans, 'upon', 'within', 'whereby']
                              : [ans, `${activeLearnQuestion.promptPrefix || ''} nothing short of`];
                          return chips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setTextDraft(chip);
                                setLearnAnswers((prev) => ({
                                  ...prev,
                                  [activeLearnQuestion.id]: chip
                                }));
                                setLearnChecked((prev) => ({
                                  ...prev,
                                  [activeLearnQuestion.id]: true
                                }));
                              }}
                              className="px-3.5 py-2 rounded-xl eyecare-card border hover:border-amber-800 text-xs font-extrabold cloze-mono-input cursor-pointer transition"
                            >
                              {chip}
                            </button>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Smooth Slide-Down Feedback & C1/C2 Explanation */}
              {learnChecked[activeLearnQuestion.id] && (
                <div className="pt-4 border-t border-amber-900/15 space-y-4">
                  {(() => {
                    const ok = isQuestionCorrect(
                      activeLearnQuestion,
                      learnAnswers[activeLearnQuestion.id] || ''
                    );
                    return (
                      <div
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                          ok
                            ? 'bg-emerald-500/15 border-emerald-600/40 text-emerald-950 dark:text-emerald-200'
                            : 'bg-rose-500/15 border-rose-600/40 text-rose-950 dark:text-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {ok ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                          )}
                          <div>
                            <div className="text-sm font-extrabold">
                              {ok ? 'Chính xác! Xuất sắc!' : 'Chưa chính xác'}
                            </div>
                            <div className="text-xs mt-0.5">
                              Đáp án chuẩn:{' '}
                              <strong className="cloze-mono-input underline">
                                {activeLearnQuestion.answer}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleNextLearnQuestion}
                          className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-sm shrink-0"
                        >
                          Câu tiếp theo (Enter)
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Clean Vietnamese C1/C2 Explanation */}
                  <div className="p-4 rounded-2xl eyecare-elevated border space-y-2 text-sm leading-relaxed">
                    {activeLearnQuestion.explanation?.rule && (
                      <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                        📌 {activeLearnQuestion.explanation.rule}
                      </div>
                    )}
                    <p>{activeLearnQuestion.explanation?.vi}</p>
                    {activeLearnQuestion.explanation?.vocabItem && (
                      <div className="pt-2 mt-2 border-t border-amber-900/10 flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-xs">
                          <strong>Từ vựng C1/C2:</strong>{' '}
                          <span className="font-serif font-bold">
                            {activeLearnQuestion.explanation.vocabItem.term}
                          </span>{' '}
                          — {activeLearnQuestion.explanation.vocabItem.meaningVi}
                        </div>
                        {onSaveVocab && (
                          <button
                            type="button"
                            onClick={() =>
                              onSaveVocab({
                                term: activeLearnQuestion.explanation.vocabItem.term,
                                category:
                                  activeLearnQuestion.explanation.vocabItem.category || 'C2_LEXIS',
                                definition_en: activeLearnQuestion.explanation.en || '',
                                definition_vi:
                                  activeLearnQuestion.explanation.vocabItem.meaningVi || '',
                                example_sentence:
                                  activeLearnQuestion.explanation.vocabItem.example || '',
                                source_exam: currentExam.title
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-amber-900/15 hover:bg-amber-900/25 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center gap-1"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />+ Lưu thẻ từ
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Persistent Previous / Next Question Footer Bar */}
              <div className="pt-4 border-t border-amber-900/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setLearnIndex((i) => (i - 1 + allQuestions.length) % allQuestions.length)
                  }
                  className="px-4 py-2.5 rounded-xl border eyecare-elevated hover:border-amber-800/50 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Câu trước (Previous)
                </button>

                <span className="text-xs font-bold cloze-mono-input opacity-70">
                  Câu {learnIndex + 1} / {allQuestions.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextLearnQuestion}
                  className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                >
                  Câu tiếp theo (Next)
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODE 2: CHẾ ĐỘ LÀM ĐỀ (FULL TEST MODE WITH RIGHT PALETTE 1 -> 60) ==================== */}
      {studyMode === 'test' && (
        <div className="max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 9 Cols: Full Exam Segmented Clearly by Part */}
          <div className="lg:col-span-9 space-y-6">
            {testSubmitted && testResult && (
              <div className="p-6 rounded-3xl bg-emerald-600/15 border-2 border-emerald-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Kết quả bài thi của bạn
                  </div>
                  <h2 className="text-2xl font-black mt-1">
                    Điểm quy đổi HSGQG: {testResult.score} / 20.0 ({testResult.percentage}%)
                  </h2>
                  <p className="text-xs opacity-80 mt-0.5">
                    Số câu đúng: {testResult.correctCount} / {testResult.total} câu hỏi. Xem giải thích chi tiết từng câu bên dưới.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTestSubmitted(false);
                    setTestAnswers({});
                    setTestResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  Làm lại đề này
                </button>
              </div>
            )}

            {['lexicoGrammar', 'reading', 'writing'].map((secKey) => {
              const secObj = currentExam.sections?.[secKey];
              if (!secObj || !secObj.parts?.length) return null;
              return (
                <div key={secKey} className="space-y-5">
                  <div className="px-4 py-3 rounded-2xl bg-amber-900 text-amber-50 font-extrabold text-sm">
                    {secObj.title}
                  </div>

                  {secObj.parts.map((part: any) => (
                    <div
                      key={part.id}
                      className="eyecare-card rounded-3xl border p-6 space-y-5 shadow-sm"
                    >
                      <div className="border-b border-amber-900/10 pb-3">
                        <h3 className="text-base font-extrabold">{part.title}</h3>
                        <p className="text-xs opacity-75 mt-0.5">{part.instructions}</p>
                      </div>

                      {part.passage && (
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl eyecare-elevated border passage-prose text-sm md:text-base leading-relaxed">
                            {part.passageTitle && (
                              <h4 className="font-bold text-base mb-2">{part.passageTitle}</h4>
                            )}
                            <div dangerouslySetInnerHTML={{ __html: part.passage }} />
                          </div>

                          {/* Post-Reading Active Transfer Mini-Drill at the end of every Reading/Cloze passage */}
                          <ActiveTransferMiniDrill
                            passageTitle={part.passageTitle || part.title}
                            passageHtml={part.passage}
                            onSaveVocab={onSaveVocab}
                          />
                        </div>
                      )}

                      {/* Questions in this Part */}
                      <div className="space-y-4">
                        {(part.questions || []).map((q: any) => {
                          const val = testAnswers[q.id] || '';
                          const ok = isQuestionCorrect(q, val);
                          return (
                            <div
                              key={q.id}
                              id={`test-q-${q.number}`}
                              className={`p-4 rounded-2xl border transition ${
                                testSubmitted
                                  ? ok
                                    ? 'border-emerald-600/50 bg-emerald-500/5'
                                    : 'border-rose-600/50 bg-rose-500/5'
                                  : 'eyecare-elevated'
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-900 text-amber-50 text-xs font-bold cloze-mono-input">
                                    Câu {q.number}
                                  </span>
                                  {(q.rootWord || q.givenWord) && (
                                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs cloze-mono-input font-bold">
                                      Gốc: {q.rootWord || q.givenWord}
                                    </span>
                                  )}
                                </div>

                                {/* Question Utility Buttons: Bookmark, Sticky Note, Flag, Quick-Edit */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBookmarkOnQuestion(q)}
                                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                      bookmarksMap[q.id]
                                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                                        : 'eyecare-card hover:border-amber-800'
                                    }`}
                                  >
                                    <Star className="w-3 h-3" />
                                    <span>{bookmarksMap[q.id] ? '⭐ Đã ghim' : '⭐ Lưu câu khó'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenNoteIds((prev) => ({
                                        ...prev,
                                        [q.id]: !prev[q.id]
                                      }))
                                    }
                                    className="px-2 py-0.5 rounded-lg eyecare-card border hover:border-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <StickyNote className="w-3 h-3" />
                                    <span>📝 Ghi chú</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFlaggedQuestions((prev) => ({
                                        ...prev,
                                        [q.id]: !prev[q.id]
                                      }))
                                    }
                                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                      flaggedQuestions[q.id]
                                        ? 'bg-rose-500/20 text-rose-700 border-rose-500/40'
                                        : 'eyecare-card hover:border-amber-800'
                                    }`}
                                  >
                                    <Flag className="w-3 h-3" />
                                    <span>{flaggedQuestions[q.id] ? '🚩 Đã cắm cờ' : '🚩 Cờ'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingQuestion(q)}
                                    className="px-2 py-0.5 rounded-lg eyecare-card border hover:border-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>✏️ Sửa</span>
                                  </button>
                                </div>
                              </div>

                              {(openNoteIds[q.id] || notesMap[q.id]) && (
                                <div className="mb-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-600/30">
                                  <input
                                    type="text"
                                    value={notesMap[q.id] || ''}
                                    onChange={(e) => {
                                      const next = saveQuestionNote(q.id, e.target.value);
                                      setNotesMap({ ...next });
                                    }}
                                    placeholder="📝 Nhập ghi chú cá nhân cho câu hỏi này..."
                                    className="w-full px-3 py-1.5 rounded-lg eyecare-card border text-xs"
                                  />
                                </div>
                              )}

                              <p className="text-sm md:text-base font-semibold mb-3">{q.stem}</p>

                              {(q.type === 'mcq' || q.type === 'tfng') ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(q.options || []).map((opt: any) => {
                                    const selected =
                                      String(val).toUpperCase() === String(opt.id).toUpperCase();
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        disabled={testSubmitted}
                                        onClick={() =>
                                          setTestAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                                        }
                                        className={`text-left px-3.5 py-2.5 rounded-xl border text-xs md:text-sm flex items-center gap-2.5 transition ${
                                          selected
                                            ? 'bg-amber-900 text-amber-50 border-amber-950 font-bold'
                                            : 'eyecare-card hover:opacity-90'
                                        }`}
                                      >
                                        <span className="cloze-mono-input font-extrabold">
                                          {opt.id}.
                                        </span>
                                        <span>{opt.text}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  disabled={testSubmitted}
                                  value={val}
                                  onChange={(e) =>
                                    setTestAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: e.target.value
                                    }))
                                  }
                                  placeholder={
                                    q.promptPrefix
                                      ? `${q.promptPrefix} ...`
                                      : 'Nhập câu trả lời...'
                                  }
                                  className="w-full px-3.5 py-2 rounded-xl border eyecare-card cloze-mono-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-800"
                                />
                              )}

                              {testSubmitted && (
                                <div className="mt-3 pt-3 border-t border-amber-900/10 text-xs space-y-1">
                                  <div className="font-bold">
                                    Đáp án chuẩn:{' '}
                                    <span className="text-emerald-700 dark:text-emerald-400 cloze-mono-input">
                                      {q.answer}
                                    </span>
                                  </div>
                                  <p className="opacity-85">{q.explanation?.vi}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Extended Writing Prompt inside Section III */}
                      {part.partType && (
                        <div className="p-4 rounded-2xl eyecare-elevated border space-y-2">
                          <p className="text-sm font-semibold">{part.prompt}</p>
                          {onOpenWritingTask && (
                            <button
                              type="button"
                              onClick={() => onOpenWritingTask(part, currentExam)}
                              className="px-4 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                              Mở trong Phòng Viết AI để chấm điểm
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Right 3 Cols: Simple Sticky Question Palette (1 -> 60) & Submit Button */}
          <div className="lg:col-span-3 sticky top-24 eyecare-card rounded-3xl border p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-3">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider opacity-70">
                  Thời gian còn lại
                </div>
                <div className="text-xl font-black cloze-mono-input text-amber-900 dark:text-amber-300">
                  {formatTimer(timeLeft)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold opacity-70">Đã làm</div>
                <div className="text-sm font-extrabold cloze-mono-input">
                  {Object.keys(testAnswers).filter((k) => String(testAnswers[k]).trim()).length} /{' '}
                  {allQuestions.length}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold mb-2">Bảng câu hỏi (1 → {allQuestions.length}):</div>
              <div className="grid grid-cols-6 gap-1.5 max-h-72 overflow-y-auto pr-1">
                {allQuestions.map((q) => {
                  const answered = Boolean(
                    testAnswers[q.id] && String(testAnswers[q.id]).trim()
                  );
                  const ok = isQuestionCorrect(q, testAnswers[q.id] || '');
                  let btnCls = 'eyecare-elevated opacity-75';
                  if (testSubmitted) {
                    btnCls = ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white';
                  } else if (answered) {
                    btnCls = 'bg-amber-900 text-amber-50 font-bold';
                  }
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`test-q-${q.number}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`h-8 rounded-lg text-xs cloze-mono-input font-bold border transition ${btnCls}`}
                    >
                      {q.number}
                    </button>
                  );
                })}
              </div>
            </div>

            {!testSubmitted && (
              <button
                type="button"
                onClick={handleSubmitFullTest}
                className="w-full py-3 rounded-2xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition"
              >
                <Send className="w-4 h-4" />
                Nộp bài &amp; Chấm điểm
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODE 3: CHẾ ĐỘ THẺ TỪ (FLASHCARDS MODE — QUIZLET FLIP CARDS) ==================== */}
      {studyMode === 'flashcards' && (
        <div className="max-w-3xl mx-auto px-4 pt-8 space-y-6">
          {examFlashcards.length === 0 ? (
            <div className="eyecare-card rounded-3xl border p-8 text-center">
              <p className="text-sm opacity-75">Đang trích xuất thẻ từ C1/C2 từ đề thi...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>
                  Thẻ từ vựng C1/C2 trích từ đề thi ({cardIndex + 1} / {examFlashcards.length})
                </span>
                <span className="opacity-70">Nhấn Space hoặc click vào thẻ để lật mặt sau</span>
              </div>

              {/* Quizlet Flip Card */}
              <div
                onClick={() => setIsCardFlipped((f) => !f)}
                className="cursor-pointer eyecare-card rounded-3xl border-2 border-amber-900/20 p-8 md:p-12 min-h-[320px] flex flex-col items-center justify-center text-center shadow-md hover:shadow-lg transition-all select-none"
              >
                {!isCardFlipped ? (
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full text-xs cloze-mono-input font-bold bg-amber-900/15 text-amber-900 dark:text-amber-300">
                      {examFlashcards[cardIndex].category} • Câu #{examFlashcards[cardIndex].questionNumber}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-extrabold font-serif">
                      {examFlashcards[cardIndex].term}
                    </h2>
                    <p className="text-xs md:text-sm italic opacity-75 max-w-lg mx-auto">
                      &ldquo;{examFlashcards[cardIndex].example}&rdquo;
                    </p>
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-400 pt-4">
                      Nhấn để lật xem nghĩa tiếng Việt ↻
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600/15 text-emerald-800 dark:text-emerald-300">
                      Nghĩa tiếng Việt &amp; Cách dùng C1/C2
                    </span>
                    <h3 className="text-xl md:text-2xl font-extrabold text-amber-900 dark:text-amber-300">
                      {examFlashcards[cardIndex].meaningVi}
                    </h3>
                    <p className="text-sm opacity-85 max-w-lg mx-auto">
                      {examFlashcards[cardIndex].definitionEn}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation & Save to Vault */}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCardFlipped(false);
                    setCardIndex(
                      (i) => (i - 1 + examFlashcards.length) % examFlashcards.length
                    );
                  }}
                  className="px-4 py-2.5 rounded-2xl border eyecare-card text-xs font-bold flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Thẻ trước
                </button>

                {onSaveVocab && (
                  <button
                    type="button"
                    disabled={Boolean(savedCardMap[examFlashcards[cardIndex].id])}
                    onClick={() => {
                      const c = examFlashcards[cardIndex];
                      setSavedCardMap((prev) => ({ ...prev, [c.id]: true }));
                      onSaveVocab({
                        term: c.term,
                        category: c.category,
                        definition_en: c.definitionEn,
                        definition_vi: c.meaningVi,
                        example_sentence: c.example,
                        source_exam: currentExam.title
                      });
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    {savedCardMap[examFlashcards[cardIndex].id] ? (
                      <>
                        <Check className="w-4 h-4" /> Đã lưu vào Sổ từ vựng
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-4 h-4" /> + Lưu vào Sổ từ vựng (Flashcards)
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsCardFlipped(false);
                    setCardIndex((i) => (i + 1) % examFlashcards.length);
                  }}
                  className="px-4 py-2.5 rounded-2xl border eyecare-card text-xs font-bold flex items-center gap-1.5"
                >
                  Thẻ tiếp <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== MODE 4: 🎮 MINI-GAMES C1/C2 (4 ANTI-BOREDOM STUDY MODES) ==================== */}
      {studyMode === 'games' && (
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <AntiBoredomArcadeHub exam={currentExam} onSaveVocab={onSaveVocab} />
        </div>
      )}

      {/* Floating Double-Click Ozdic Collocation & Register Popover */}
      <OzdicCollocationPopover
        entry={ozdicEntry}
        loading={ozdicLoading}
        onClose={() => setOzdicEntry(null)}
        onLookupWord={lookupOzdic}
        onSaveVocab={onSaveVocab}
      />

      {/* Inline Quick-Edit Question Modal (✏️ Sửa nhanh) */}
      <InlineQuestionEditModal
        isOpen={Boolean(editingQuestion)}
        examId={currentExam?.id || 'exam-1'}
        question={editingQuestion}
        onClose={() => setEditingQuestion(null)}
        onSaved={handleQuestionInlineSaved}
      />

      {/* Printable A4 Worksheet & PDF Export Modal (🖨️ In đề / Xuất PDF) */}
      <PrintableWorksheetModal
        isOpen={showPrintModal}
        mode="exam"
        exam={currentExam}
        questions={allQuestions}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
}
