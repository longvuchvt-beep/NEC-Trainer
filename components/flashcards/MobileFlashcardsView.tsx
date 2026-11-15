"use client";

import React, { useState, useMemo } from "react";
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Plus,
  Search,
  Volume2,
  Layers,
  List,
} from "lucide-react";
import { addUserXp } from "../../lib/auth/auth-store";

interface VocabCardItem {
  id: string;
  word: string;
  meaning: string;
  collocations?: string;
  example?: string;
  level?: string;
}

interface MobileFlashcardsViewProps {
  vocabList: any[];
  onAddVocab?: (newWord: {
    word: string;
    meaning: string;
    collocations?: string;
    example?: string;
  }) => void;
}

const MASTERED_STORAGE_KEY = "veng_flashcards_mastered_v1";

export default function MobileFlashcardsView({
  vocabList = [],
  onAddVocab,
}: MobileFlashcardsViewProps) {
  const cards: VocabCardItem[] = useMemo(() => {
    const raw = Array.isArray(vocabList) ? vocabList : [];
    const normalized = raw
      .filter((item) => item && (item.word || item.term))
      .map((item, idx) => ({
        id: String(item.id || `vocab-${idx + 1}`),
        word: String(item.word || item.term || "").trim(),
        meaning: String(
          item.meaning || item.definition || "Cấu trúc từ vựng học thuật C1/C2"
        ).trim(),
        collocations: String(item.collocations || item.category || "C1/C2").trim(),
        example: String(item.example || item.context || "").trim(),
        level: String(item.level || "C1/C2"),
      }));

    if (normalized.length > 0) return normalized;

    return [
      {
        id: "fallback-v-1",
        word: "cast doubt on",
        meaning: "Dấy lên nghi ngờ về điều gì",
        collocations: "Collocation • HSGQG",
        example: "New findings have cast doubt on the validity of the hypothesis.",
      },
      {
        id: "fallback-v-2",
        word: "by leaps and bounds",
        meaning: "Tiến bộ vượt bậc, nhanh chóng",
        collocations: "Idiom • DHBB",
        example: "Her fluency improved by leaps and bounds after intensive practice.",
      },
      {
        id: "fallback-v-3",
        word: "in the wake of",
        meaning: "Ngay sau khi, hệ quả từ sự kiện gì",
        collocations: "Prepositional Phrase • C2",
        example: "Stricter regulations were introduced in the wake of the crisis.",
      },
    ];
  }, [vocabList]);

  const [viewMode, setViewMode] = useState<"deck" | "list">("deck");
  const [filterMode, setFilterMode] = useState<"all" | "learning" | "mastered">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newExample, setNewExample] = useState("");

  const [masteredMap, setMasteredMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(MASTERED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const saveMasteredMap = (next: Record<string, boolean>) => {
    setMasteredMap(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MASTERED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
  };

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cards.filter((c) => {
      if (filterMode === "mastered" && !masteredMap[c.id]) return false;
      if (filterMode === "learning" && masteredMap[c.id]) return false;
      if (!q) return true;
      return (
        c.word.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.collocations || "").toLowerCase().includes(q)
      );
    });
  }, [cards, filterMode, masteredMap, searchQuery]);

  const activeCard =
    filteredCards[currentIndex % Math.max(1, filteredCards.length)] ||
    filteredCards[0] ||
    cards[0];

  const masteredCount = useMemo(
    () => cards.filter((c) => masteredMap[c.id]).length,
    [cards, masteredMap]
  );

  const handleMarkCard = (mastered: boolean) => {
    if (!activeCard) return;
    const next = { ...masteredMap };
    if (mastered) {
      next[activeCard.id] = true;
      addUserXp(10);
    } else {
      delete next[activeCard.id];
    }
    saveMasteredMap(next);
    setIsFlipped(false);
    setCurrentIndex((i) => (i + 1) % Math.max(1, filteredCards.length));
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-GB";
      utter.rate = 0.95;
      window.speechSynthesis.speak(utter);
    } catch {}
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim()) return;
    if (onAddVocab) {
      onAddVocab({
        word: newWord.trim(),
        meaning: newMeaning.trim(),
        collocations: "Từ tự thêm",
        example: newExample.trim(),
      });
    }
    setNewWord("");
    setNewMeaning("");
    setNewExample("");
    setShowAddForm(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-14">
      {/* Header & Mode Switch */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Từ vựng C1/C2
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đã thuộc {masteredCount} / {cards.length} từ
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm từ</span>
            </button>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("deck")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "deck"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500"
                }`}
                title="Thẻ lật"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500"
                }`}
                title="Danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: `Tất cả (${cards.length})` },
            {
              id: "learning",
              label: `Đang học (${cards.length - masteredCount})`,
            },
            { id: "mastered", label: `Đã thuộc (${masteredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterMode(tab.id as any);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterMode === tab.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Word Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Thêm từ hoặc cụm từ mới
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              required
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Từ / Cụm từ tiếng Anh"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
            <input
              type="text"
              required
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="Nghĩa tiếng Việt"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <input
            type="text"
            value={newExample}
            onChange={(e) => setNewExample(e.target.value)}
            placeholder="Câu ví dụ (không bắt buộc)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              Lưu vào bộ thẻ
            </button>
          </div>
        </form>
      )}

      {viewMode === "deck" ? (
        /* Interactive Flip Card View */
        activeCard ? (
          <div className="space-y-3">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsFlipped((f) => !f)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setIsFlipped((f) => !f);
              }}
              className="min-h-[260px] sm:min-h-[300px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-6 flex flex-col justify-between cursor-pointer select-none shadow-sm hover:border-indigo-500/60 transition"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>
                  Thẻ {(currentIndex % filteredCards.length) + 1} /{" "}
                  {filteredCards.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleSpeak(activeCard.word, e)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 transition"
                    title="Phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="my-auto py-6 text-center space-y-3">
                {!isFlipped ? (
                  <>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                      {activeCard.collocations || "C1/C2"}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {activeCard.word}
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {activeCard.word}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                      {activeCard.meaning}
                    </h3>
                    {activeCard.example && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic max-w-md mx-auto pt-1">
                        "{activeCard.example}"
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Chạm để {isFlipped ? "xem mặt trước" : "lật nghĩa tiếng Việt"}</span>
              </div>
            </div>

            {/* Thumb-Friendly Controls */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(
                    (i) =>
                      (i - 1 + filteredCards.length) %
                      Math.max(1, filteredCards.length)
                  );
                }}
                className="py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkCard(false)}
                className="py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <X className="w-4 h-4" />
                <span>Chưa nhớ</span>
              </button>

              <button
                type="button"
                onClick={() => handleMarkCard(true)}
                className="py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <Check className="w-4 h-4" />
                <span>Đã thuộc</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(
                    (i) => (i + 1) % Math.max(1, filteredCards.length)
                  );
                }}
                className="py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <span>Tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null
      ) : (
        /* Searchable List View */
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ vựng hoặc nghĩa tiếng Việt..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            {filteredCards.map((c) => {
              const isMastered = Boolean(masteredMap[c.id]);
              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {c.word}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(c.word)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {c.meaning}
                    </p>
                    {c.example && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        "{c.example}"
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...masteredMap };
                      if (isMastered) delete next[c.id];
                      else next[c.id] = true;
                      saveMasteredMap(next);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                      isMastered
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isMastered ? "Đã thuộc" : "Đang học"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
