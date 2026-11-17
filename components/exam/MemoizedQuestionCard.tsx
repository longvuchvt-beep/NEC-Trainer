"use client";

import React, { useState, useEffect, useMemo, memo } from "react";
import {
  Bookmark,
  CheckCircle2,
  XCircle,
  BookOpen,
  Volume2,
  Layers,
  AlertCircle,
  Eye,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SafeQuestion } from "../../lib/safe-data";
import {
  FullUserSettings,
  speakEnglishText,
} from "../../lib/linguistics/deep-linguistic-engine";
import {
  getIntuitionPredictionPrompt,
  extractLexicalChunkFromQuestion,
  speakLexicalChunkEnGB,
  inferMorphologicalSlot,
  MorphologicalSlotType,
  PolarityType,
} from "../../lib/linguistics/second-nature-engine";

interface MemoizedQuestionCardProps {
  question: SafeQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAns: string;
  isRevealed: boolean;
  isBookmarked: boolean;
  intuitionModeEnabled: boolean;
  isLockedReflex: boolean;
  autoSaveBanner: string | null;
  settings: FullUserSettings;
  onSelectOption: (optionId: string) => void;
  onToggleBookmark: () => void;
}

const SLOT_CHIPS: MorphologicalSlotType[] = [
  "Noun",
  "Verb",
  "Adj",
  "Adv",
  "Prep/Conj",
];

const POLARITY_CHIPS: Array<{ id: PolarityType; label: string }> = [
  { id: "POSITIVE", label: "+ Khẳng định" },
  { id: "NEGATIVE", label: "– Phủ định (un/in/im/dis...)" },
];

function QuestionCardInner({
  question,
  questionIndex,
  totalQuestions,
  selectedAns,
  isRevealed,
  isBookmarked,
  intuitionModeEnabled,
  isLockedReflex,
  autoSaveBanner,
  settings,
  onSelectOption,
  onToggleBookmark,
}: MemoizedQuestionCardProps) {
  const [showPassage, setShowPassage] = useState(false);

  // Mechanic 1: Intuition-First 1.5s Option Blur State
  const [optionsBlurred, setOptionsBlurred] = useState<boolean>(
    intuitionModeEnabled && !isRevealed && !selectedAns
  );

  // Mechanic 3: 1-Second Morphological Slot Predictor State
  const [pickedSlot, setPickedSlot] = useState<MorphologicalSlotType | null>(
    null
  );
  const [pickedPolarity, setPickedPolarity] = useState<PolarityType | null>(
    null
  );

  // Lazy-render toggle for 4-Layer Deep Linguistic Breakdown (mounted only when isRevealed is true)
  const [showDeepLayers, setShowDeepLayers] = useState<boolean>(true);

  useEffect(() => {
    setPickedSlot(null);
    setPickedPolarity(null);
    setShowDeepLayers(true);

    if (intuitionModeEnabled && !isRevealed && !selectedAns) {
      setOptionsBlurred(true);
      const timer = setTimeout(() => {
        setOptionsBlurred(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setOptionsBlurred(false);
    }
  }, [question.id, intuitionModeEnabled, isRevealed, selectedAns]);

  const intuitionPrompt = useMemo(
    () => getIntuitionPredictionPrompt(question),
    [question]
  );

  const lexicalChunkData = useMemo(
    () => extractLexicalChunkFromQuestion(question),
    [question]
  );

  const morphSlotData = useMemo(
    () => inferMorphologicalSlot(question),
    [question]
  );

  // Auto-play British English Lexical Chunk when checked if audioAutoPlay is enabled
  useEffect(() => {
    if (isRevealed && settings.audioAutoPlay && lexicalChunkData.spokenChunkText) {
      speakLexicalChunkEnGB(lexicalChunkData.spokenChunkText);
    }
  }, [isRevealed, settings.audioAutoPlay, lexicalChunkData.spokenChunkText]);

  // Render glowing blank before answer vs. unified Lexical Chunk badge after answer
  const renderEnhancedStem = () => {
    if (isRevealed) {
      return (
        <div className="space-y-2">
          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
            <span>{lexicalChunkData.beforeChunk}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs">
              <span>[{lexicalChunkData.lexicalChunk}]</span>
            </span>
            <span>{lexicalChunkData.afterChunk}</span>
          </p>

          {/* Acoustic Priming Bar for the Full Lexical Chunk */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/70">
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <span className="font-bold">Cụm Phản Xạ C1/C2 (Lexical Chunk): </span>
              <span className="font-mono font-semibold">
                [{lexicalChunkData.lexicalChunk}]
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                speakLexicalChunkEnGB(lexicalChunkData.spokenChunkText)
              }
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Nghe Cụm Phản Xạ (en-GB)</span>
            </button>
          </div>
        </div>
      );
    }

    const parts = question.prompt.split(/(_{2,}|\.{3,})/);
    return (
      <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
        {parts.map((part, i) => {
          if (/^(_{2,}|\.{3,})$/.test(part)) {
            return (
              <span
                key={i}
                className={`inline-block px-3 py-0.5 mx-1 rounded-lg font-mono font-bold border transition ${
                  intuitionModeEnabled
                    ? "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                _______
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  const breakdown = question.linguisticBreakdown;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            Câu {questionIndex + 1} / {totalQuestions}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            {question.partTitle}
          </span>
          {isLockedReflex && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đã Khóa Phản Xạ</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {question.passageText && (
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
            onClick={onToggleBookmark}
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

      {/* Reading Passage Drawer */}
      {showPassage && question.passageText && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 max-h-60 overflow-y-auto text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-serif whitespace-pre-line">
          {question.passageText}
        </div>
      )}

      {/* Question Stem with Glowing Blank OR Highlighted Lexical Chunk */}
      {renderEnhancedStem()}

      {/* Mechanic 1: "Intuition-First" Blind Prediction Callout */}
      {intuitionModeEnabled && !isRevealed && (
        <div className="px-3.5 py-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-indigo-950 dark:text-indigo-200">
                {intuitionPrompt.promptVi}{" "}
              </span>
              <span className="text-indigo-800/90 dark:text-indigo-300/90">
                {intuitionPrompt.clueHintVi}
              </span>
            </div>
          </div>
          {optionsBlurred && (
            <button
              type="button"
              onClick={() => setOptionsBlurred(false)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shrink-0"
            >
              <Eye className="w-3 h-3" />
              <span>Mở ngay</span>
            </button>
          )}
        </div>
      )}

      {/* Mechanic 3: 1-Second Morphological Slot Predictor Chips */}
      <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/80 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
            Phản xạ 1 Giây — Dự đoán Ô Từ Loại (Slot) & Sắc Thái:
          </span>
          {(pickedSlot || pickedPolarity) && (
            <span
              className={`text-[11px] font-bold ${
                (pickedSlot === morphSlotData.expectedSlot || !pickedSlot) &&
                (pickedPolarity === morphSlotData.expectedPolarity ||
                  !pickedPolarity)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              Chuẩn cấu trúc: [{morphSlotData.expectedSlot}] •{" "}
              {morphSlotData.expectedPolarity === "NEGATIVE"
                ? "[– Phủ định]"
                : "[+ Khẳng định]"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {SLOT_CHIPS.map((slot) => {
            const isPicked = pickedSlot === slot;
            const isExpected = morphSlotData.expectedSlot === slot;
            let chipStyle =
              "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400";
            if (isPicked || isRevealed) {
              if (isExpected) {
                chipStyle =
                  "bg-emerald-600 border-emerald-600 text-white font-bold";
              } else if (isPicked && !isExpected) {
                chipStyle = "bg-rose-600 border-rose-600 text-white font-bold";
              }
            }
            return (
              <button
                key={slot}
                type="button"
                onClick={() => setPickedSlot(slot)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${chipStyle}`}
              >
                [{slot}]
              </button>
            );
          })}

          <span className="text-slate-300 dark:text-slate-600 px-0.5">|</span>

          {POLARITY_CHIPS.map((pol) => {
            const isPicked = pickedPolarity === pol.id;
            const isExpected = morphSlotData.expectedPolarity === pol.id;
            let chipStyle =
              "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400";
            if (isPicked || isRevealed) {
              if (isExpected) {
                chipStyle =
                  "bg-indigo-600 border-indigo-600 text-white font-bold";
              } else if (isPicked && !isExpected) {
                chipStyle = "bg-rose-600 border-rose-600 text-white font-bold";
              }
            }
            return (
              <button
                key={pol.id}
                type="button"
                onClick={() => setPickedPolarity(pol.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${chipStyle}`}
              >
                [{pol.label}]
              </button>
            );
          })}
        </div>

        {(pickedSlot || pickedPolarity) && (
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug pt-0.5">
            {morphSlotData.slotReasoningVi}
          </p>
        )}
      </div>

      {/* Options List (Softly Blurred during 1.5s Intuition-First Window) */}
      <div
        onMouseEnter={() => {
          if (optionsBlurred) setOptionsBlurred(false);
        }}
        className="relative space-y-2.5"
      >
        {optionsBlurred && (
          <button
            type="button"
            onClick={() => setOptionsBlurred(false)}
            className="absolute inset-0 z-10 rounded-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800/60 transition"
          >
            <span>Đang kích hoạt Phản xạ Đoán Trước (1.5s) — Chạm để mở 4 đáp án</span>
          </button>
        )}

        <div
          className={`space-y-2.5 transition duration-200 ${
            optionsBlurred ? "blur-xs select-none opacity-60" : ""
          }`}
        >
          {question.options.map((opt) => {
            const isSelected = selectedAns === opt.id;
            const isCorrectOption = opt.id === question.correctAnswer;

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
                onClick={() => {
                  if (optionsBlurred) setOptionsBlurred(false);
                  onSelectOption(opt.id);
                }}
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
      </div>

      {/* Auto-Save Mistake Banner */}
      {autoSaveBanner && isRevealed && selectedAns !== question.correctAnswer && (
        <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-xs font-semibold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{autoSaveBanner}</span>
        </div>
      )}

      {/* Lazy-Mounted 4-Layer Deep Linguistic Breakdown (ONLY mounted when isRevealed is true) */}
      {isRevealed && breakdown && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Giải Thích Ngôn Ngữ Chuyên Sâu
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Đáp án {question.correctAnswer}: {breakdown.targetExpression}
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

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => speakEnglishText(breakdown.targetExpression)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeepLayers((v) => !v)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-indigo-600"
                title={showDeepLayers ? "Thu gọn" : "Mở rộng"}
              >
                {showDeepLayers ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {showDeepLayers &&
            (settings.explanationDepth === "deep" ? (
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
                {question.explanation}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}

const MemoizedQuestionCard = memo(
  QuestionCardInner,
  (prev, next) =>
    prev.question.id === next.question.id &&
    prev.questionIndex === next.questionIndex &&
    prev.totalQuestions === next.totalQuestions &&
    prev.selectedAns === next.selectedAns &&
    prev.isRevealed === next.isRevealed &&
    prev.isBookmarked === next.isBookmarked &&
    prev.intuitionModeEnabled === next.intuitionModeEnabled &&
    prev.isLockedReflex === next.isLockedReflex &&
    prev.autoSaveBanner === next.autoSaveBanner &&
    prev.settings.explanationDepth === next.settings.explanationDepth &&
    prev.settings.showIpaAndRegister === next.settings.showIpaAndRegister &&
    prev.settings.audioAutoPlay === next.settings.audioAutoPlay
);

export default MemoizedQuestionCard;
