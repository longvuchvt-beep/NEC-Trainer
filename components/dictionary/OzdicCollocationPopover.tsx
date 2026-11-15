'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  BookmarkPlus,
  Check,
  AlertTriangle,
  Sparkles,
  Volume2,
  Search
} from 'lucide-react';

export interface OzdicEntry {
  word: string;
  queriedWord?: string;
  phonetic: string;
  partOfSpeech: string;
  register: 'Formal' | 'Academic' | 'Idiomatic' | 'Literary' | 'Pejorative' | string;
  meaningVi: string;
  definitionEn: string;
  collocations: {
    adjNoun: string[];
    verbNoun: string[];
    preposition: string[];
  };
  confusableWarning: string;
  contextSentence?: string;
}

const REGISTER_BADGE_STYLES: Record<string, string> = {
  Academic: 'bg-indigo-600 text-white',
  Formal: 'bg-amber-900 text-amber-50',
  Idiomatic: 'bg-emerald-700 text-white',
  Literary: 'bg-purple-700 text-white',
  Pejorative: 'bg-rose-700 text-white'
};

const FEATURED_OZDIC_WORDS = [
  'disclose',
  'telemetry',
  'proliferation',
  'dichotomy',
  'mitigate',
  'tethered',
  'entrench',
  'ostensibly'
];

interface OzdicCollocationPopoverProps {
  entry: OzdicEntry | null;
  loading?: boolean;
  onClose: () => void;
  onLookupWord: (word: string) => void;
  onSaveVocab?: (item: any) => void;
}

export default function OzdicCollocationPopover({
  entry,
  loading = false,
  onClose,
  onLookupWord,
  onSaveVocab
}: OzdicCollocationPopoverProps) {
  const [saved, setSaved] = useState(false);
  const [customQuery, setCustomQuery] = useState('');

  useEffect(() => {
    setSaved(false);
    if (entry?.word) {
      setCustomQuery(entry.word);
    }
  }, [entry?.word]);

  if (!entry && !loading) return null;

  const pronounceWord = (w: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(w);
      u.lang = 'en-GB';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div
      id="ozdic-collocation-popover"
      className="fixed bottom-5 left-5 z-50 w-[94vw] max-w-md rounded-3xl eyecare-card border-2 border-amber-900/40 shadow-2xl p-5 space-y-4 transition-all"
    >
      {/* Top Header: Ozdic Title + Quick Word Switcher + Close Button */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-900/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-900 text-amber-50 text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Ozdic C1/C2 Collocation
          </span>
          {entry?.register && (
            <span
              data-testid="ozdic-register-badge"
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                REGISTER_BADGE_STYLES[entry.register] || 'bg-amber-900 text-amber-50'
              }`}
            >
              {entry.register}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng từ điển Ozdic"
          className="p-1.5 rounded-xl eyecare-elevated border hover:bg-amber-900 hover:text-amber-50 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search / Double-Clicked Word Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (customQuery.trim()) onLookupWord(customQuery.trim());
        }}
        className="flex items-center gap-1.5"
      >
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 opacity-50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="Nhập hoặc nhấp đúp từ bất kỳ..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl eyecare-elevated border text-xs font-bold cloze-mono-input focus:outline-none focus:ring-2 focus:ring-amber-800"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold cursor-pointer"
        >
          Tra từ
        </button>
      </form>

      {/* Quick Featured C2 Words Bar */}
      <div className="flex items-center gap-1 flex-wrap">
        {FEATURED_OZDIC_WORDS.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onLookupWord(w)}
            className={`px-2 py-0.5 rounded-md text-[11px] font-bold cloze-mono-input transition cursor-pointer ${
              entry?.word === w
                ? 'bg-amber-900 text-amber-50'
                : 'eyecare-elevated border opacity-80 hover:opacity-100'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {loading || !entry ? (
        <div className="py-6 text-center text-xs font-bold opacity-75">
          Đang tra cứu cấu trúc Collocation &amp; Register C1/C2...
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[62vh] overflow-y-auto pr-1">
          {/* Headword, IPA & Audio */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black font-serif">{entry.word}</h3>
                <span className="text-xs cloze-mono-input opacity-75">{entry.phonetic}</span>
                <button
                  type="button"
                  onClick={() => pronounceWord(entry.word)}
                  title="Nghe phát âm chuẩn Anh-Anh"
                  className="p-1 rounded-lg eyecare-elevated border hover:opacity-80 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-800" />
                </button>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                {entry.partOfSpeech} • Register: {entry.register}
              </div>
            </div>
          </div>

          {/* Meaning in Vietnamese & English */}
          <div className="p-3 rounded-2xl eyecare-elevated border space-y-1">
            <div className="text-xs font-extrabold text-amber-950 dark:text-amber-200">
              🇻🇳 {entry.meaningVi}
            </div>
            <div className="text-[11px] opacity-80">{entry.definitionEn}</div>
          </div>

          {/* Top Collocations (Adj+Noun, Verb+Noun, Preposition) */}
          <div className="space-y-2 text-xs">
            <div className="font-extrabold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Top Collocations (Chuẩn Ozdic / CPE):
            </div>

            <div className="p-3 rounded-2xl eyecare-elevated border space-y-2">
              <div>
                <span className="font-extrabold text-indigo-800 dark:text-indigo-300">
                  • Adj / Adv + {entry.word}:{' '}
                </span>
                <span className="cloze-mono-input">
                  {(entry.collocations?.adjNoun || []).join(' | ')}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                  • Verb + {entry.word}:{' '}
                </span>
                <span className="cloze-mono-input">
                  {(entry.collocations?.verbNoun || []).join(' | ')}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-amber-900 dark:text-amber-300">
                  • Preposition Frame:{' '}
                </span>
                <span className="cloze-mono-input font-semibold">
                  {(entry.collocations?.preposition || []).join(' | ')}
                </span>
              </div>
            </div>
          </div>

          {/* Confusable Word Warning (DHBB / HSGQG Synonym Trap) */}
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-600/40 text-xs leading-relaxed">
            <div className="font-extrabold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Confusable Word Warning (Bẫy Từ Gần Nghĩa):</span>
            </div>
            <p className="opacity-90">{entry.confusableWarning}</p>
          </div>

          {/* 1-Click "+ Add to Flashcards" Button */}
          <button
            type="button"
            disabled={saved}
            onClick={() => {
              setSaved(true);
              if (onSaveVocab) {
                onSaveVocab({
                  term: entry.word,
                  category: `OZDIC_${String(entry.register || 'ACADEMIC').toUpperCase()}`,
                  definition_en: `${entry.definitionEn} | Collocations: ${(
                    entry.collocations?.verbNoun || []
                  ).join(', ')}`,
                  definition_vi: `${entry.meaningVi} (${entry.confusableWarning})`,
                  example_sentence:
                    (entry.collocations?.verbNoun || [])[0] ||
                    (entry.collocations?.adjNoun || [])[0] ||
                    entry.word,
                  source_exam: 'Ozdic Double-Click Collocation Dictionary'
                });
              }
            }}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-900 hover:bg-amber-800 disabled:opacity-65 text-amber-50 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã thêm vào Sổ từ vựng (Added to Flashcards)</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span>+ Add to Flashcards (Lưu từ &amp; Collocations)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
