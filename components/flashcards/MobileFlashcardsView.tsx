"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  AlertCircle,
  BookOpen,
  Trash2,
} from "lucide-react";
import { addUserXp } from "../../lib/auth/auth-store";
import {
  getMistakeVaultItems,
  markMistakeMastered,
  removeMistakeItem,
  MistakeVaultItem,
  speakEnglishText,
  buildDeepLinguisticBreakdown,
  getFullSettings,
} from "../../lib/linguistics/deep-linguistic-engine";

interface VocabCardItem {
  id: string;
  word: string;
  ipa: string;
  register: string;
  meaning: string;
  collocations?: string;
  example?: string;
  etymologyAndNuance: string;
  collocationAndSyntax: string;
  trapAnalysis: string;
  isMistakeItem?: boolean;
  mistakeCount?: number;
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
  const [settings, setSettings] = useState(() => getFullSettings());
  const [mistakeVault, setMistakeVault] = useState<MistakeVaultItem[]>(() =>
    getMistakeVaultItems()
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncMistakes = () => setMistakeVault(getMistakeVaultItems());
    const syncSettings = () => setSettings(getFullSettings());
    window.addEventListener("veng-mistakes-updated", syncMistakes);
    window.addEventListener("veng-settings-changed", syncSettings);
    return () => {
      window.removeEventListener("veng-mistakes-updated", syncMistakes);
      window.removeEventListener("veng-settings-changed", syncSettings);
    };
  }, []);

  const cards: VocabCardItem[] = useMemo(() => {
    const raw = Array.isArray(vocabList) ? vocabList : [];
    const normalized = raw
      .filter((item) => item && (item.word || item.term))
      .map((item, idx) => {
        const wordStr = String(item.word || item.term || "").trim();
        const meaningStr = String(
          item.meaning || item.definition || "Cấu trúc từ vựng học thuật C1/C2"
        ).trim();
        const breakdown = buildDeepLinguisticBreakdown({
          stem: String(item.example || item.context || wordStr),
          correctText: wordStr,
          correctLetter: "A",
          options: [wordStr],
          targetTerm: wordStr,
          category: String(item.collocations || item.category || "Collocation"),
          explanation: meaningStr,
        });

        return {
          id: String(item.id || `vocab-${idx + 1}`),
          word: wordStr,
          ipa: breakdown.ipa,
          register: breakdown.register,
          meaning: meaningStr,
          collocations: String(item.collocations || item.category || "C1/C2").trim(),
          example: String(item.example || item.context || "").trim(),
          etymologyAndNuance: breakdown.etymologyAndNuance,
          collocationAndSyntax: breakdown.collocationAndSyntax,
          trapAnalysis: breakdown.trapAnalysis,
        };
      });

    if (normalized.length > 0) return normalized;

    return [
      {
        id: "fallback-v-1",
        word: "impervious to",
        ipa: "/ɪmˈpɜː.vi.əs tuː/",
        register: "Formal C2 • Academic",
        meaning: "Không bị ảnh hưởng hay lung lay trước lời chỉ trích",
        collocations: "remain impervious to criticism",
        example: "The committee remained impervious to public pressure.",
        etymologyAndNuance:
          "Gốc Latin: im- (không) + per- (xuyên qua) + via (đường đi) → không thể xuyên thủng.",
        collocationAndSyntax: "be / remain impervious to + Noun",
        trapAnalysis:
          "Phân biệt với oblivious to (không nhận thức được) và susceptible to (dễ bị tổn thương).",
      },
    ];
  }, [vocabList]);

  const mistakeCards: VocabCardItem[] = useMemo(() => {
    return mistakeVault.map((m) => ({
      id: m.id,
      word: m.word || m.correctText,
      ipa: m.ipa,
      register: m.register,
      meaning: m.etymologyAndNuance,
      collocations: m.sourceTag,
      example: m.stem,
      etymologyAndNuance: m.etymologyAndNuance,
      collocationAndSyntax: m.collocationAndSyntax,
      trapAnalysis: m.trapAnalysis,
      isMistakeItem: true,
      mistakeCount: m.mistakeCount,
    }));
  }, [mistakeVault]);

  const [viewMode, setViewMode] = useState<"deck" | "list">("deck");
  const [filterMode, setFilterMode] = useState<
    "all" | "mistakes" | "learning" | "mastered"
  >("all");
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

  const activeSourceCards =
    filterMode === "mistakes" ? mistakeCards : cards;

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeSourceCards.filter((c) => {
      if (filterMode === "mastered" && !masteredMap[c.id]) return false;
      if (filterMode === "learning" && masteredMap[c.id]) return false;
      if (!q) return true;
      return (
        c.word.toLowerCase().includes(q) ||
        c.meaning.toLowerCase().includes(q) ||
        (c.collocations || "").toLowerCase().includes(q)
      );
    });
  }, [activeSourceCards, filterMode, masteredMap, searchQuery]);

  const activeCard =
    filteredCards[currentIndex % Math.max(1, filteredCards.length)] ||
    filteredCards[0] ||
    null;

  const masteredCount = useMemo(
    () => cards.filter((c) => masteredMap[c.id]).length,
    [cards, masteredMap]
  );

  const handleMarkCard = (mastered: boolean) => {
    if (!activeCard) return;
    if (activeCard.isMistakeItem) {
      const updated = markMistakeMastered(activeCard.id, mastered);
      setMistakeVault(updated);
    }
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
    speakEnglishText(text);
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
              Từ vựng & Sổ Từ Sai C1/C2
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đã thuộc {masteredCount}/{cards.length} từ • {mistakeCards.length} từ làm sai tự động lưu
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

        {/* Filter Pills Including "Từ làm sai gần đây" */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: `Tất cả (${cards.length})` },
            {
              id: "mistakes",
              label: `Từ làm sai gần đây (${mistakeCards.length})`,
            },
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterMode === tab.id
                  ? tab.id === "mistakes"
                    ? "bg-rose-600 text-white"
                    : "bg-indigo-600 text-white"
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
              placeholder="Nghĩa tiếng Việt & gốc từ"
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

      {filteredCards.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {filterMode === "mistakes"
              ? "Chưa có từ làm sai nào trong Sổ Từ Sai"
              : "Không tìm thấy thẻ từ vựng phù hợp"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filterMode === "mistakes"
              ? "Khi bạn chọn sai trong Game 3D hoặc khi Làm đề, hệ thống sẽ tự động lưu từ đó kèm phân tích 4 tầng vào đây."
              : "Hãy chọn bộ lọc khác hoặc thêm từ mới."}
          </p>
        </div>
      ) : viewMode === "deck" && activeCard ? (
        /* Interactive Flip Card View with 4-Layer Deep Breakdown on Back */
        <div className="space-y-3">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsFlipped((f) => !f);
            }}
            className="min-h-[280px] sm:min-h-[320px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between cursor-pointer select-none shadow-sm hover:border-indigo-500/60 transition"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>
                Thẻ {(currentIndex % filteredCards.length) + 1} /{" "}
                {filteredCards.length}
                {activeCard.isMistakeItem && activeCard.mistakeCount
                  ? ` • Sai ${activeCard.mistakeCount} lần`
                  : ""}
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

            <div className="my-auto py-4">
              {!isFlipped ? (
                <div className="text-center space-y-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                    {activeCard.collocations || activeCard.register}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {activeCard.word}
                  </h2>
                  {settings.showIpaAndRegister && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {activeCard.ipa} • {activeCard.register}
                    </div>
                  )}
                  {activeCard.example && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-md mx-auto pt-1">
                      "{activeCard.example}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 text-left">
                  <div className="flex items-center justify-between flex-wrap gap-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {activeCard.word}
                    </span>
                    {settings.showIpaAndRegister && (
                      <span className="text-xs font-mono text-slate-500">
                        {activeCard.ipa} • {activeCard.register}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bản chất & Gốc từ:</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activeCard.etymologyAndNuance}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs space-y-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kết hợp từ & Cấu trúc:</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      {activeCard.collocationAndSyntax}
                    </p>
                  </div>

                  {settings.explanationDepth === "deep" && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Phân tích Bẫy:</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">
                        {activeCard.trapAnalysis}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 pt-2">
              <RotateCw className="w-3.5 h-3.5" />
              <span>
                Chạm để{" "}
                {isFlipped
                  ? "xem mặt trước"
                  : "lật xem Giải thích chuyên sâu 4 tầng"}
              </span>
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
      ) : (
        /* Searchable List View with Deep Breakdowns */
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ vựng, gốc từ hoặc nghĩa tiếng Việt..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2.5">
            {filteredCards.map((c) => {
              const isMastered = Boolean(masteredMap[c.id]);
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {c.word}
                        </span>
                        {settings.showIpaAndRegister && (
                          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                            {c.ipa}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSpeak(c.word)}
                          className="text-slate-400 hover:text-indigo-600"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400">
                        {c.register}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...masteredMap };
                          if (isMastered) delete next[c.id];
                          else next[c.id] = true;
                          saveMasteredMap(next);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          isMastered
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {isMastered ? "Đã thuộc" : "Đang học"}
                      </button>
                      {c.isMistakeItem && (
                        <button
                          type="button"
                          onClick={() =>
                            setMistakeVault(removeMistakeItem(c.id))
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                          title="Xóa khỏi Sổ Từ Sai"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-semibold">Bản chất & Gốc từ: </span>
                    {c.etymologyAndNuance}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Kết hợp từ: </span>
                    {c.collocationAndSyntax}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
