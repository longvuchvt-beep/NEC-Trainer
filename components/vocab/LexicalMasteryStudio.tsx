"use client";

import React, { useState, useMemo, useDeferredValue, useCallback } from "react";
import {
  Search,
  Plus,
  BookOpen,
  Layers,
  Wand2,
  Link2,
  Headphones,
  Sprout,
} from "lucide-react";
import {
  DECK_DEFINITIONS,
  DeckId,
  LexicalEntry,
} from "../../lib/vocab/lexical-data";
import {
  getAllEntries,
  countByDeck,
  getSm2Map,
  getMasteryStatus,
  MasteryStatus,
  removeCustomEntry,
  Sm2State,
} from "../../lib/vocab/vocab-store";
import WordMatrixCard from "./WordMatrixCard";
import AddWordsModal from "./AddWordsModal";
import {
  FlipCardsMode,
  WordFormationLabMode,
  PrepSnapMode,
  DictationMode,
  RootDecoderMode,
} from "./PracticeModes";

type ModeId = "dictionary" | "flip" | "wordform" | "prep" | "dictation" | "roots";

const MODES: Array<{ id: ModeId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "dictionary", label: "Từ điển", icon: BookOpen },
  { id: "flip", label: "Thẻ lật", icon: Layers },
  { id: "wordform", label: "Biến đổi từ", icon: Wand2 },
  { id: "prep", label: "Giới từ", icon: Link2 },
  { id: "dictation", label: "Chính tả", icon: Headphones },
  { id: "roots", label: "Gốc từ", icon: Sprout },
];

const STATUS_FILTERS: Array<{ id: "ALL" | MasteryStatus; label: string }> = [
  { id: "ALL", label: "Tất cả" },
  { id: "NEW", label: "Chưa thuộc" },
  { id: "LEARNING", label: "Đang học" },
  { id: "MASTERED", label: "Thành thạo" },
];

const PAGE_SIZE = 20;

export default function LexicalMasteryStudio() {
  const [refreshTick, setRefreshTick] = useState(0);
  const [deck, setDeck] = useState<DeckId>("core");
  const [mode, setMode] = useState<ModeId>("dictionary");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MasteryStatus>("ALL");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sm2Map, setSm2Map] = useState<Record<string, Sm2State>>(() => getSm2Map());
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [toast, setToast] = useState<string | null>(null);

  const allEntries = useMemo(() => getAllEntries(), [refreshTick]);
  const deckCounts = useMemo(() => countByDeck(allEntries), [allEntries]);

  const deckEntries = useMemo(() => allEntries.filter((e) => e.deck === deck), [allEntries, deck]);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return deckEntries.filter((e) => {
      if (statusFilter !== "ALL" && getMasteryStatus(e.id, sm2Map) !== statusFilter) return false;
      if (!q) return true;
      return (
        e.word.toLowerCase().includes(q) ||
        e.meaningVi.toLowerCase().includes(q) ||
        e.collocations.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [deckEntries, statusFilter, deferredQuery, sm2Map]);

  // Flip cards: due-first ordering
  const flipQueue = useMemo(() => {
    const now = Date.now();
    return [...filtered].sort((a, b) => {
      const da = sm2Map[a.id]?.due ?? 0;
      const db = sm2Map[b.id]?.due ?? 0;
      const ad = da <= now ? 0 : 1;
      const bd = db <= now ? 0 : 1;
      return ad - bd || da - db;
    });
  }, [filtered, sm2Map]);

  const masteryStats = useMemo(() => {
    const s = { NEW: 0, LEARNING: 0, MASTERED: 0 };
    for (const e of deckEntries) s[getMasteryStatus(e.id, sm2Map)]++;
    return s;
  }, [deckEntries, sm2Map]);

  const handleGraded = useCallback((map: Record<string, Sm2State>) => setSm2Map(map), []);

  const activeDeck = DECK_DEFINITIONS.find((d) => d.id === deck)!;
  const deckIndependentMode = mode === "wordform" || mode === "prep" || mode === "roots";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Từ vựng C1/C2</h1>
            <p className="text-[11px] text-slate-500">
              {allEntries.length} mục • 6 bộ từ • 5 chế độ luyện
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Thêm / Nhập từ
          </button>
        </div>

        {/* Deck switcher */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {DECK_DEFINITIONS.map((d) => {
            const active = d.id === deck;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setDeck(d.id);
                  setVisibleCount(PAGE_SIZE);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                  active ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {d.label}
                <span className={`text-[10px] px-1.5 rounded-md ${active ? "bg-white/20" : "bg-white dark:bg-slate-900"}`}>
                  {deckCounts[d.id]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 -mt-1">{activeDeck.description}</p>

        {/* Mode tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition ${
                  mode === m.id ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {!deckIndependentMode && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Tìm từ, nghĩa hoặc kết hợp từ..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap ${
                    statusFilter === s.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {s.label}
                  {s.id !== "ALL" && <span className="ml-1 opacity-70">{masteryStats[s.id]}</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
          {toast}
        </div>
      )}

      {/* Mode body */}
      {mode === "dictionary" && (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
              {deck === "mistakes"
                ? "Sổ Từ Sai đang trống. Các câu bạn làm sai trong Đề thi và Game 3D sẽ tự động xuất hiện ở đây."
                : deck === "custom"
                ? "Chưa có từ nào. Bấm \"Thêm / Nhập từ\" để tạo bộ từ riêng."
                : "Không tìm thấy mục phù hợp."}
            </div>
          ) : (
            <>
              {filtered.slice(0, visibleCount).map((e: LexicalEntry) => {
                const open = expandedId === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => setExpandedId(open ? null : e.id)}
                    className={`rounded-2xl bg-white dark:bg-slate-900 border p-3.5 sm:p-4 cursor-pointer transition ${
                      open ? "border-indigo-400 dark:border-indigo-600" : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <WordMatrixCard
                      entry={e}
                      compact={!open}
                      status={getMasteryStatus(e.id, sm2Map)}
                      onRemove={
                        e.deck === "custom"
                          ? () => {
                              removeCustomEntry(e.id);
                              setRefreshTick((t) => t + 1);
                            }
                          : undefined
                      }
                    />
                  </div>
                );
              })}
              {visibleCount < filtered.length && (
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                >
                  Xem thêm ({filtered.length - visibleCount})
                </button>
              )}
            </>
          )}
        </div>
      )}

      {mode === "flip" && <FlipCardsMode key={`${deck}-${statusFilter}`} entries={flipQueue} onGraded={handleGraded} />}
      {mode === "wordform" && <WordFormationLabMode />}
      {mode === "prep" && <PrepSnapMode />}
      {mode === "dictation" && <DictationMode key={deck} entries={filtered} />}
      {mode === "roots" && <RootDecoderMode />}

      {showAdd && (
        <AddWordsModal
          onClose={() => setShowAdd(false)}
          onAdded={(n) => {
            setRefreshTick((t) => t + 1);
            setDeck("custom");
            setMode("dictionary");
            setToast(`Đã thêm ${n} từ vào "Bộ Từ Của Tôi".`);
            setTimeout(() => setToast(null), 2500);
          }}
        />
      )}
    </div>
  );
}
