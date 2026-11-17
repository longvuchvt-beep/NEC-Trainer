"use client";

import React, { memo } from "react";
import { Volume2, GitBranch, Link2, Sprout, AlertTriangle, Trash2 } from "lucide-react";
import { LexicalEntry } from "../../lib/vocab/lexical-data";
import { MasteryStatus, speakWord } from "../../lib/vocab/vocab-store";

const REGISTER_STYLES: Record<string, string> = {
  Formal: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  "Academic C2": "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
  Idiom: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  Literary: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800",
  Pejorative: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  "Phrasal Verb": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  Neutral: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  Informal: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
};

const STATUS_LABEL: Record<MasteryStatus, { label: string; cls: string }> = {
  NEW: { label: "Chưa thuộc", cls: "text-slate-500" },
  LEARNING: { label: "Đang học", cls: "text-amber-600 dark:text-amber-400" },
  MASTERED: { label: "Thành thạo", cls: "text-emerald-600 dark:text-emerald-400" },
};

const FAMILY_LABELS: Array<[keyof LexicalEntry["family"], string]> = [
  ["noun", "Noun"],
  ["verb", "Verb"],
  ["adj", "Adj"],
  ["neg", "Phủ định"],
  ["adv", "Adv"],
];

interface Props {
  entry: LexicalEntry;
  status?: MasteryStatus;
  compact?: boolean;
  accent?: "en-GB" | "en-US";
  onRemove?: () => void;
}

function WordMatrixCardInner({ entry, status, compact, accent = "en-GB", onRemove }: Props) {
  const familyItems = FAMILY_LABELS.filter(([k]) => entry.family[k] && entry.family[k] !== "—");

  return (
    <div className="space-y-3 text-left">
      {/* Layer 1: Headword + IPA + Register */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
              {entry.word}
            </h3>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${REGISTER_STYLES[entry.register] || REGISTER_STYLES.Formal}`}>
              {entry.register}
            </span>
            {status && (
              <span className={`text-[10px] font-semibold ${STATUS_LABEL[status].cls}`}>
                {STATUS_LABEL[status].label}
              </span>
            )}
          </div>
          {entry.ipa && (
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{entry.ipa}</div>
          )}
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{entry.meaningVi}</p>
          {entry.sourceTag && (
            <p className="text-[10px] text-slate-400 mt-0.5">{entry.sourceTag}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakWord(entry.word, "en-GB");
            }}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
            title="Phát âm Anh-Anh"
          >
            <Volume2 className="w-3.5 h-3.5" />
            UK
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakWord(entry.word, "en-US");
            }}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600"
            title="Phát âm Anh-Mỹ"
          >
            US
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <>
          {/* Layer 2: Word family */}
          {familyItems.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1 mb-1">
                <GitBranch className="w-3 h-3" /> Cây gia đình từ
              </div>
              <div className="flex flex-wrap gap-1.5">
                {familyItems.map(([k, label]) => (
                  <span
                    key={k}
                    className={`px-2 py-0.5 rounded-md text-[11px] border ${
                      k === "neg"
                        ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300"
                        : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <b className="mr-1">{label}:</b>
                    {entry.family[k]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Layer 3: Collocations */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1 mb-1">
              <Link2 className="w-3 h-3" /> Khung kết hợp từ
            </div>
            <ul className="space-y-0.5">
              {entry.collocations.map((c, i) => (
                <li key={i} className="text-xs font-mono text-emerald-800 dark:text-emerald-300">
                  {c}
                </li>
              ))}
            </ul>
            {entry.example && (
              <p className="text-xs italic text-slate-600 dark:text-slate-400 mt-1">“{entry.example}”</p>
            )}
          </div>

          {/* Layer 4: Etymology */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700">
            <div className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mb-0.5">
              <Sprout className="w-3 h-3" /> Gốc từ & mẹo nhớ
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">{entry.etymology}</p>
          </div>

          {/* Layer 5: Trap */}
          <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
            <div className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-0.5">
              <AlertTriangle className="w-3 h-3" /> Phân biệt bẫy từ
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">{entry.trap}</p>
          </div>
        </>
      )}
    </div>
  );
}

const WordMatrixCard = memo(WordMatrixCardInner);
export default WordMatrixCard;
