import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BrainCircuit,
  RotateCcw,
  Keyboard,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Award,
  Layers,
  BookOpen,
  Flame,
  Clock,
  RefreshCw,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import {
  calculateSm2,
  previewAllButtonIntervals,
  buildContextualCloze,
  Sm2Rating,
  ButtonIntervalPreviews,
  ContextualClozeResult
} from '../../lib/srs/sm2-engine';

export interface WordFamilyDerivative {
  pos: string;
  form: string;
  note?: string;
}

export interface SrsVocabularyCard {
  id: string;
  questionId?: string | null;
  term: string;
  category: string;
  phonetic?: string | null;
  definitionEn: string;
  definitionVi: string;
  exampleSentence?: string | null;
  sourceExamTitle?: string | null;
  grammarNote?: string | null;
  repetitionLevel: number;
  easeFactor: number;
  intervalDays: number;
  nextReviewDate: string | Date;
  examOriginBadge?: string;
  intervalPreviews?: ButtonIntervalPreviews;
  cloze?: ContextualClozeResult;
  wordFamily?: WordFamilyDerivative[];
}

export interface SrsDeckStats {
  totalCards: number;
  dueNow: number;
  newOrLapsed: number;
  learning: number;
  mastered: number;
}

export interface SpacedRepetitionStudioProps {
  onDeckUpdated?: () => void;
}

function normalizeClozeAnswer(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SpacedRepetitionStudio: React.FC<SpacedRepetitionStudioProps> = ({
  onDeckUpdated
}) => {
  const [studyMode, setStudyMode] = useState<'flip' | 'cloze'>('flip'); // 'flip' (Anki 3D Flip Mode) | 'cloze' (Active Cloze Typing Mode)
  const [includeUpcoming, setIncludeUpcoming] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [cards, setCards] = useState<SrsVocabularyCard[]>([]);
  const [stats, setStats] = useState<SrsDeckStats>({
    totalCards: 0,
    dueNow: 0,
    newOrLapsed: 0,
    learning: 0,
    mastered: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);

  // Active Cloze typing state
  const [clozeInput, setClozeInput] = useState<string>('');
  const [clozeChecked, setClozeChecked] = useState<boolean>(false);
  const [clozeIsCorrect, setClozeIsCorrect] = useState<boolean>(false);

  // Session telemetry
  const [sessionReviewedCount, setSessionReviewedCount] = useState<number>(0);
  const [lastGradedFeedback, setLastGradedFeedback] = useState<string>('');

  const clozeInputRef = useRef<HTMLInputElement | null>(null);

  const fetchSrsDeck = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        includeUpcoming: String(includeUpcoming),
        category: categoryFilter
      });
      const res = await fetch(`/api/vocab/srs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
        if (data.stats) setStats(data.stats);
        setCurrentIndex(0);
        setIsRevealed(false);
        setClozeInput('');
        setClozeChecked(false);
      }
    } catch (err) {
      // ignore offline error
    } finally {
      setLoading(false);
    }
  }, [includeUpcoming, categoryFilter]);

  useEffect(() => {
    fetchSrsDeck();
  }, [fetchSrsDeck]);

  const currentCard: SrsVocabularyCard | null = useMemo(() => {
    if (!cards.length) return null;
    return cards[currentIndex % cards.length] || cards[0];
  }, [cards, currentIndex]);

  const currentCloze: ContextualClozeResult | null = useMemo(() => {
    if (!currentCard) return null;
    return (
      currentCard.cloze ||
      buildContextualCloze(currentCard.term, currentCard.exampleSentence)
    );
  }, [currentCard]);

  const currentPreviews: ButtonIntervalPreviews | null = useMemo(() => {
    if (!currentCard) return null;
    return (
      currentCard.intervalPreviews ||
      previewAllButtonIntervals({
        repetitionLevel: currentCard.repetitionLevel,
        easeFactor: currentCard.easeFactor,
        intervalDays: currentCard.intervalDays,
        nextReviewDate: currentCard.nextReviewDate
      })
    );
  }, [currentCard]);

  const currentWordFamily: WordFamilyDerivative[] = useMemo(() => {
    if (!currentCard) return [];
    if (Array.isArray(currentCard.wordFamily) && currentCard.wordFamily.length > 0) {
      return currentCard.wordFamily;
    }
    const clean = currentCard.term.replace(/\s*\([^)]*\)\s*/g, '').trim();
    return [
      { pos: currentCard.category || 'LEXEME', form: clean, note: 'Primary competition form' },
      { pos: 'DERIVATIVE', form: clean.endsWith('ly') ? clean : `${clean}ly`, note: 'Morphological variant' }
    ];
  }, [currentCard]);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  const handleCheckCloze = useCallback(() => {
    if (!currentCard || !currentCloze) return;
    const expected = normalizeClozeAnswer(currentCloze.targetTerm);
    const actual = normalizeClozeAnswer(clozeInput);
    const isOk = Boolean(actual && (actual === expected || expected.includes(actual) && actual.length >= 4));
    setClozeIsCorrect(isOk);
    setClozeChecked(true);
    setIsRevealed(true);
  }, [currentCard, currentCloze, clozeInput]);

  const handleRateCard = useCallback(
    async (rating: Sm2Rating) => {
      if (!currentCard) return;

      // Compute optimistic SM-2 update
      const optimistic = calculateSm2(
        {
          repetitionLevel: currentCard.repetitionLevel,
          easeFactor: currentCard.easeFactor,
          intervalDays: currentCard.intervalDays,
          nextReviewDate: currentCard.nextReviewDate
        },
        rating
      );

      const ratingLabels: Record<Sm2Rating, string> = {
        1: 'Again (Học lại)',
        2: 'Hard (Khó)',
        3: 'Good (Nhớ tốt)',
        4: 'Easy (Thành thạo)'
      };

      setLastGradedFeedback(
        `Đã chấm "${currentCard.term}" → ${ratingLabels[rating]} • Hẹn ôn lại sau: ${optimistic.humanIntervalVi} (EF: ${optimistic.easeFactor})`
      );
      setSessionReviewedCount(prev => prev + 1);

      try {
        await fetch('/api/vocab/srs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: currentCard.id,
            rating
          })
        });
        if (onDeckUpdated) onDeckUpdated();
      } catch {
        // ignore network error, optimistic update still applies
      }

      // Update local card state and advance to next card
      setCards(prev =>
        prev.map((c, idx) =>
          idx === currentIndex
            ? {
                ...c,
                repetitionLevel: optimistic.repetitionLevel,
                easeFactor: optimistic.easeFactor,
                intervalDays: optimistic.intervalDays,
                nextReviewDate: optimistic.nextReviewDate.toISOString(),
                intervalPreviews: previewAllButtonIntervals(optimistic)
              }
            : c
        )
      );

      setIsRevealed(false);
      setClozeInput('');
      setClozeChecked(false);
      setCurrentIndex(prev => (prev + 1) % Math.max(1, cards.length));
    },
    [currentCard, currentIndex, cards.length, onDeckUpdated]
  );

  // Keyboard shortcuts: Space to reveal answer, 1-4 to submit SM-2 rating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInputFocused) {
        if (e.key === 'Enter' && studyMode === 'cloze' && !clozeChecked) {
          e.preventDefault();
          handleCheckCloze();
        }
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isRevealed) {
          setIsRevealed(true);
          if (studyMode === 'cloze') {
            setClozeChecked(true);
          }
        } else {
          setIsRevealed(false);
        }
        return;
      }

      if (isRevealed && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const numRating = Number(e.key) as Sm2Rating;
        handleRateCard(numRating);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, studyMode, clozeChecked, handleCheckCloze, handleRateCard]);

  return (
    <div className="space-y-6">
      {/* Top SM-2 Deck Telemetry & Mode Switcher */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
              ANKI SM-2 SPACED REPETITION ENGINE & ACTIVE CLOZE STUDIO
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Phòng Luyện Từ Vựng Chuyên Anh C1/C2 (Anki 3D Flip & Contextual Cloze)
            </h2>
            <p className="text-xs md:text-sm text-slate-300">
              Thuật toán lặp lại ngắt quãng SM-2 chuẩn Anki (EF ≥ 1.3) • Phím tắt: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300">Space</kbd> để lật thẻ/hiện đáp án, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300">1–4</kbd> để chấm mức độ nhớ.
            </p>
          </div>

          {/* Mode Toggle: Anki 3D Flip Mode vs Active Cloze Typing Mode */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start">
            <button
              type="button"
              onClick={() => {
                setStudyMode('flip');
                setIsRevealed(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                studyMode === 'flip'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Anki 3D Flip Mode
            </button>
            <button
              type="button"
              onClick={() => {
                setStudyMode('cloze');
                setIsRevealed(false);
                setClozeChecked(false);
                setTimeout(() => clozeInputRef.current?.focus(), 60);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                studyMode === 'cloze'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Active Cloze Typing Mode
            </button>
          </div>
        </div>

        {/* 4 Deck Stat Counters: dueNow, newOrLapsed, learning, mastered */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-rose-500/30">
            <div className="text-[11px] text-rose-300 font-semibold">Cần ôn ngay (dueNow)</div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">{stats.dueNow}</div>
            <div className="text-[10px] text-slate-400">nextReviewDate ≤ now</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30">
            <div className="text-[11px] text-amber-300 font-semibold">Mới / Quên (newOrLapsed)</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">{stats.newOrLapsed}</div>
            <div className="text-[10px] text-slate-400">Repetition Level 0</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30">
            <div className="text-[11px] text-indigo-300 font-semibold">Đang học (learning)</div>
            <div className="text-2xl font-black font-mono text-indigo-400 mt-0.5">{stats.learning}</div>
            <div className="text-[10px] text-slate-400">Repetition Level 1–2</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
            <div className="text-[11px] text-emerald-300 font-semibold">Thành thạo (mastered)</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{stats.mastered}</div>
            <div className="text-[10px] text-slate-400">Repetition Level ≥ 3</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-violet-500/30 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-violet-300 font-semibold">Phiên hiện tại (Session)</div>
            <div className="text-2xl font-black font-mono text-violet-400 mt-0.5">
              {sessionReviewedCount} / {cards.length}
            </div>
            <div className="text-[10px] text-slate-400">Đã chấm SM-2 hôm nay</div>
          </div>
        </div>
      </div>

      {/* Filter & Queue Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'IDIOM', 'COLLOCATION', 'WORD_FORMATION', 'PHRASAL_VERB', 'INVERSION'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả Nhóm từ' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeUpcoming}
              onChange={e => setIncludeUpcoming(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Hiển thị cả thẻ sắp tới hạn (includeUpcoming)
          </label>

          <button
            type="button"
            onClick={fetchSrsDeck}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition"
            title="Làm mới bộ thẻ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Last Graded SM-2 Toast Banner */}
      {lastGradedFeedback && (
        <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            {lastGradedFeedback}
          </span>
          <span className="font-mono text-[11px] text-slate-400">SM-2 Persisted</span>
        </div>
      )}

      {/* Main Active Card Workspace */}
      {loading ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-400">
          Đang tải bộ thẻ Anki SM-2 từ Cơ sở dữ liệu...
        </div>
      ) : !currentCard ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Award className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="text-base font-bold text-slate-900 dark:text-white">
            Bạn đã hoàn thành toàn bộ thẻ đến hạn ôn tập!
          </div>
          <p className="text-xs text-slate-500">
            Bật tùy chọn "Hiển thị cả thẻ sắp tới hạn (includeUpcoming)" để luyện tập thêm.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Card Container */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-xl overflow-hidden transition-all">
            {/* Card Top Metadata Header with Exam Origin Badge */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  {currentCard.category}
                </span>

                {/* Exam Origin Badge (HSGQG / DHBB / Olympic 30/4 - Question #X) */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {currentCard.examOriginBadge || currentCard.sourceExamTitle || 'HSGQG 2025 - Question #1'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span>
                  Card #{currentIndex + 1}/{cards.length}
                </span>
                <span>•</span>
                <span>Rep: {currentCard.repetitionLevel}</span>
                <span>•</span>
                <span>EF: {Number(currentCard.easeFactor || 2.5).toFixed(2)}</span>
              </div>
            </div>

            {/* =====================================================================
                MODE A: ANKI 3D FLIP MODE
               ===================================================================== */}
            {studyMode === 'flip' && (
              <div
                onClick={() => setIsRevealed(!isRevealed)}
                className="p-7 md:p-9 cursor-pointer space-y-6 select-none"
              >
                {/* Front Face (Always Visible) */}
                <div className="text-center space-y-3 py-4">
                  <div className="inline-flex items-center gap-2">
                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentCard.term}
                    </h3>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        speakText(currentCard.term);
                      }}
                      className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition"
                      title="Phát âm chuẩn Anh-Anh (en-GB)"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {currentCard.phonetic && (
                    <div className="text-sm font-mono text-indigo-500">{currentCard.phonetic}</div>
                  )}

                  {/* Contextual Cloze Preview on Front */}
                  {currentCloze && !isRevealed && (
                    <div className="max-w-2xl mx-auto mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm text-slate-600 dark:text-slate-300 italic">
                      "{currentCloze.beforeMask}
                      <span className="px-2 py-0.5 mx-1 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-mono font-bold not-italic">
                        {currentCloze.maskHint}
                      </span>
                      {currentCloze.afterMask}"
                    </div>
                  )}

                  {!isRevealed && (
                    <div className="pt-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow">
                        Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-indigo-800 font-mono">Space</kbd> hoặc Click vào thẻ để lật xem Giải nghĩa & Word Family
                      </span>
                    </div>
                  )}
                </div>

                {/* Back Face (Revealed on Space or Click) */}
                {isRevealed && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-5 cursor-default"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Nghĩa Tiếng Việt Chuyên Sâu (Vietnamese Meaning):
                        </div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">
                          {currentCard.definitionVi}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          English Academic Definition & Register:
                        </div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {currentCard.definitionEn}
                        </div>
                      </div>
                    </div>

                    {currentCard.exampleSentence && (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Ngữ cảnh trong Đề thi (Contextual Example):
                        </div>
                        <p className="text-sm italic text-slate-800 dark:text-slate-200 leading-relaxed">
                          "{currentCard.exampleSentence}"
                        </p>
                      </div>
                    )}

                    {/* Word Family & Morphological Derivatives */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Word Family & Morphological Derivatives (Họ từ & Biến thể C1/C2):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {currentWordFamily.map((wf, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px]">
                              {wf.pos}
                            </span>
                            <div className="font-bold text-slate-900 dark:text-white mt-1">
                              {wf.form}
                            </div>
                            {wf.note && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {wf.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                MODE B: ACTIVE CLOZE TYPING MODE
               ===================================================================== */}
            {studyMode === 'cloze' && currentCloze && (
              <div className="p-7 md:p-9 space-y-6">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Active Recall Cloze Prompt (Gợi ý chữ cái đầu/cuối & giữ nguyên giới từ):
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm md:text-base font-bold text-slate-900 dark:text-white">
                    Nghĩa tiếng Việt: <span className="text-emerald-600 dark:text-emerald-400">{currentCard.definitionVi}</span>
                    <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                      Definition (EN): {currentCard.definitionEn}
                    </div>
                  </div>
                </div>

                {/* Contextual Cloze Sentence with Preserved Prepositions & First/Last Letter Hints */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
                  <p className="passage-prose text-base md:text-lg leading-relaxed text-slate-800 dark:text-slate-200">
                    {currentCloze.beforeMask}
                    <span className="inline-flex items-center px-3 py-1 mx-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 font-mono text-sm md:text-base font-bold text-amber-700 dark:text-amber-300">
                      {currentCloze.maskHint}
                    </span>
                    {currentCloze.afterMask}
                  </p>

                  {currentCloze.preservedTokens.length > 0 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Giới từ / hư từ giữ nguyên:{' '}
                      {currentCloze.preservedTokens.map((p, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 mx-0.5 rounded bg-indigo-500/15 text-indigo-500 font-mono font-bold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Active Typing Input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <input
                      ref={clozeInputRef}
                      type="text"
                      value={clozeInput}
                      onChange={e => setClozeInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCheckCloze();
                        }
                      }}
                      placeholder={`Nhập cụm từ C1/C2 (Hint: ${currentCloze.maskHint})...`}
                      className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-sm md:text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleCheckCloze}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs md:text-sm font-extrabold transition shrink-0"
                    >
                      Kiểm tra Cloze (Enter)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRevealed(true);
                        setClozeChecked(true);
                      }}
                      className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition shrink-0"
                    >
                      Hiện đáp án (Space)
                    </button>
                  </div>
                </div>

                {/* Cloze Verification Result + Word Family */}
                {(clozeChecked || isRevealed) && (
                  <div className="space-y-4 pt-2">
                    <div
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
                        clozeIsCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {clozeIsCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold uppercase">
                            {clozeIsCorrect
                              ? 'Chính xác! (Exact Active Recall Match — Gợi ý bấm phím [3] Good hoặc [4] Easy)'
                              : 'Chưa khớp hoàn toàn — Hãy đối chiếu đáp án chuẩn bên dưới'}
                          </div>
                          <div className="text-base font-black font-mono mt-0.5 text-slate-900 dark:text-white">
                            Đáp án chuẩn: <span className="text-emerald-500">{currentCard.term}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakText(currentCard.term)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Nghe phát âm
                      </button>
                    </div>

                    {/* Word Family Derivatives */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Word Family & Morphological Derivatives:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {currentWordFamily.map((wf, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px]">
                              {wf.pos}
                            </span>
                            <div className="font-bold text-slate-900 dark:text-white mt-1">{wf.form}</div>
                            {wf.note && <div className="text-[11px] text-slate-500 mt-0.5">{wf.note}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4 Anki SM-2 Grading Buttons with Vietnamese Interval Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                rating: 1 as Sm2Rating,
                keyHint: '1',
                title: 'Again (Quên)',
                interval: currentPreviews?.[1] || '10 phút',
                cls: 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500'
              },
              {
                rating: 2 as Sm2Rating,
                keyHint: '2',
                title: 'Hard (Khó)',
                interval: currentPreviews?.[2] || '1 ngày',
                cls: 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
              },
              {
                rating: 3 as Sm2Rating,
                keyHint: '3',
                title: 'Good (Nhớ tốt)',
                interval: currentPreviews?.[3] || '3 ngày',
                cls: 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
              },
              {
                rating: 4 as Sm2Rating,
                keyHint: '4',
                title: 'Easy (Thành thạo)',
                interval: currentPreviews?.[4] || '4 ngày',
                cls: 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
              }
            ].map(btn => (
              <button
                key={btn.rating}
                type="button"
                onClick={() => handleRateCard(btn.rating)}
                className={`p-3.5 rounded-2xl border shadow-md flex flex-col items-center justify-center gap-1 transition ${btn.cls}`}
              >
                <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded bg-black/20">
                  Sau: {btn.interval}
                </span>
                <div className="text-xs md:text-sm font-black flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.2 rounded bg-white/20 font-mono text-xs">[{btn.keyHint}]</kbd>
                  <span>{btn.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacedRepetitionStudio;
