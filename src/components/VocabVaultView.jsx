'use client';

import React, { useState, useMemo } from 'react';
import {
  BookmarkCheck, Sparkles, RotateCcw, Plus, Trash2, Search, Volume2,
  CheckCircle2, Layers, BrainCircuit, ChevronLeft, ChevronRight, Printer, Download
} from 'lucide-react';
import SpacedRepetitionStudio from '../../components/vocab/SpacedRepetitionStudio';
import PrintableWorksheetModal from '../../components/utilities/PrintableWorksheetModal';
import { triggerDownloadJsonBackup } from '../../lib/utilities/core-utilities-store';

export default function VocabVaultView({ vocabList = [], onAddVocab, onUpdateVocab, onDeleteVocab }) {
  const [viewMode, setViewMode] = useState('studio'); // 'studio' | 'grid' | 'flashcard'
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // New vocab modal form
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPrintVocab, setShowPrintVocab] = useState(false);
  const [newItem, setNewItem] = useState({
    term: '',
    type: 'C2 Idiom',
    phonetic: '',
    definition_en: '',
    definition_vi: '',
    example: '',
    source_exam: 'Custom Study Note'
  });

  const filteredVocab = useMemo(() => {
    return vocabList.filter(v => {
      if (typeFilter !== 'ALL' && !v.type?.toLowerCase().includes(typeFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.term?.toLowerCase().includes(q) ||
          v.definition_vi?.toLowerCase().includes(q) ||
          v.definition_en?.toLowerCase().includes(q) ||
          v.source_exam?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vocabList, searchQuery, typeFilter]);

  const currentCard = filteredVocab[cardIdx] || filteredVocab[0] || null;

  const speakTerm = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    window.speechSynthesis.speak(u);
  };

  const handleGradeCard = async (newLevel) => {
    if (!currentCard) return;
    if (onUpdateVocab) {
      await onUpdateVocab(currentCard.id, { mastery_level: newLevel });
    }
    setFlipped(false);
    setCardIdx(prev => (prev + 1) % Math.max(1, filteredVocab.length));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newItem.term.trim()) return;
    if (onAddVocab) {
      await onAddVocab(newItem);
    }
    setNewItem({
      term: '',
      type: 'C2 Idiom',
      phonetic: '',
      definition_en: '',
      definition_vi: '',
      example: '',
      source_exam: 'Custom Study Note'
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold">
            <BrainCircuit className="w-3.5 h-3.5" />
            SPACED REPETITION VOCABULARY VAULT • SỔ TAY TỪ VỰNG CHUYÊN ANH
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Kho Lưu Trữ Idioms, Phrasal Verbs, Collocations & Word Formation ({vocabList.length} mục)
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Tự động đồng bộ từ nút "+ Lưu vào Sổ tay từ vựng" khi chữa đề HSGQG, DHBB, Hùng Vương, Olympic 30/4 và Writing Studio.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'studio' ? 'grid' : 'studio')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
            {viewMode === 'studio' ? 'Xem Toàn Bộ Bảng Từ Vựng (Grid)' : 'Mở Anki SM-2 & Active Cloze Studio'}
          </button>

          <button
            type="button"
            onClick={() => setShowPrintVocab(true)}
            className="px-3.5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            🖨️ In đề / Xuất PDF (Print View)
          </button>

          <button
            type="button"
            onClick={() => triggerDownloadJsonBackup({ vocabList })}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            💾 Sao lưu JSON
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm từ mới
          </button>
        </div>
      </div>

      {/* Add New Vocab Form */}
      {showAddForm && (
        <form onSubmit={handleCreateSubmit} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/40 space-y-4">
          <div className="text-sm font-bold text-slate-900 dark:text-white">Thêm cấu trúc / từ vựng C1–C2 mới vào Sổ tay SRS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Term / Idiom (e.g., carry the can)"
              value={newItem.term}
              onChange={e => setNewItem(p => ({ ...p, term: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm"
            />
            <select
              value={newItem.type}
              onChange={e => setNewItem(p => ({ ...p, type: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm"
            >
              <option value="C2 Idiom">C2 Idiom</option>
              <option value="C1/C2 Collocation">C1/C2 Collocation</option>
              <option value="Word Formation">Word Formation</option>
              <option value="C2 Syntactic Inversion">C2 Syntactic Inversion</option>
              <option value="Phrasal Verb">Phrasal Verb</option>
            </select>
            <input
              type="text"
              placeholder="Nguồn đề (e.g., Olympic 30/4 2025)"
              value={newItem.source_exam}
              onChange={e => setNewItem(p => ({ ...p, source_exam: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Nghĩa tiếng Việt..."
              value={newItem.definition_vi}
              onChange={e => setNewItem(p => ({ ...p, definition_vi: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm"
            />
            <input
              type="text"
              placeholder="English definition..."
              value={newItem.definition_en}
              onChange={e => setNewItem(p => ({ ...p, definition_en: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Câu ví dụ minh họa (Example sentence)..."
              value={newItem.example}
              onChange={e => setNewItem(p => ({ ...p, example: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs md:text-sm"
            />
            <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">
              Lưu vào Sổ tay
            </button>
          </div>
        </form>
      )}

      {/* ANKI SM-2 SPACED REPETITION & ACTIVE CLOZE STUDIO */}
      {viewMode === 'studio' && (
        <SpacedRepetitionStudio />
      )}

      {/* Search & Filter Controls (Shown in Grid/Flashcard Mode) */}
      {viewMode !== 'studio' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm idiom, collocation, word formation, nguồn đề..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs md:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'Idiom', 'Collocation', 'Word Formation', 'Inversion'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setTypeFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  typeFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLASHCARD SRS MODE */}
      {viewMode === 'flashcard' && currentCard && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer min-h-[280px] p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-xl flex flex-col justify-between items-center text-center transition hover:border-indigo-500"
          >
            <div className="flex items-center justify-between w-full text-xs text-slate-400">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-500 font-bold">
                {currentCard.type}
              </span>
              <span className="font-mono">
                Card {cardIdx + 1} / {filteredVocab.length} • Mastery Lv.{currentCard.mastery_level || 1}/5
              </span>
            </div>

            {!flipped ? (
              <div className="my-8 space-y-3">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                  {currentCard.term}
                </h3>
                {currentCard.phonetic && (
                  <p className="text-sm font-mono text-indigo-500">{currentCard.phonetic}</p>
                )}
                <p className="text-xs text-slate-400 pt-4">
                  (Click vào thẻ để lật xem nghĩa tiếng Việt, giải thích C2 & câu ví dụ)
                </p>
              </div>
            ) : (
              <div className="my-4 space-y-3 text-left w-full">
                <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  Nghĩa (VI): {currentCard.definition_vi}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Definition (EN):</strong> {currentCard.definition_en}
                </div>
                {currentCard.example && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs italic text-slate-700 dark:text-slate-300">
                    " {currentCard.example} "
                  </div>
                )}
                {currentCard.grammar_note && (
                  <div className="text-xs text-amber-500">
                    <strong>Lưu ý đề thi:</strong> {currentCard.grammar_note}
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-slate-400">
              Nguồn: {currentCard.source_exam}
            </div>
          </div>

          {/* SRS Rating Buttons */}
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: 'Quên (Again)', level: 1, cls: 'bg-rose-600 hover:bg-rose-500 text-white' },
              { label: 'Khó (Hard)', level: 2, cls: 'bg-amber-600 hover:bg-amber-500 text-white' },
              { label: 'Nhớ tốt (Good)', level: 4, cls: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
              { label: 'Thành thạo (Easy)', level: 5, cls: 'bg-emerald-600 hover:bg-emerald-500 text-white' }
            ].map(btn => (
              <button
                key={btn.label}
                type="button"
                onClick={() => handleGradeCard(btn.level)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold shadow transition ${btn.cls}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID / LIST MODE */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVocab.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-indigo-500/40 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      {item.type}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                      {item.term}
                      <button
                        type="button"
                        onClick={() => speakTerm(item.term)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-500"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                      Mastery {item.mastery_level || 1}/5
                    </span>
                    {onDeleteVocab && (
                      <button
                        type="button"
                        onClick={() => onDeleteVocab(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Xóa khỏi sổ tay"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs md:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {item.definition_vi}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.definition_en}
                </p>

                {item.example && (
                  <p className="text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
                    "{item.example}"
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Nguồn: <strong className="text-slate-600 dark:text-slate-300">{item.source_exam}</strong></span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(lv => (
                    <button
                      key={lv}
                      type="button"
                      onClick={() => onUpdateVocab && onUpdateVocab(item.id, { mastery_level: lv })}
                      className={`w-2.5 h-2.5 rounded-full ${
                        (item.mastery_level || 1) >= lv ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                      title={`Set Mastery Level ${lv}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PrintableWorksheetModal
        isOpen={showPrintVocab}
        mode="vocab"
        vocabList={vocabList}
        onClose={() => setShowPrintVocab(false)}
      />
    </div>
  );
}
