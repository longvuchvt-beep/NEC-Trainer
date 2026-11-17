"use client";

import React, { useState, useMemo } from "react";
import { X, Plus, FileText, CheckCircle2 } from "lucide-react";
import {
  autoGenerateEntry,
  addCustomEntries,
  parseBulkVocabulary,
} from "../../lib/vocab/vocab-store";
import { LexicalEntry } from "../../lib/vocab/lexical-data";

interface Props {
  onClose: () => void;
  onAdded: (count: number) => void;
}

const SAMPLE = `ubiquitous - có mặt khắp nơi
pernicious - độc hại ngấm ngầm
obfuscate: làm rối, che giấu
sanguine = lạc quan
cursory - qua loa, đại khái`;

export default function AddWordsModal({ onClose, onAdded }: Props) {
  const [tab, setTab] = useState<"single" | "bulk">("single");
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [cols, setCols] = useState("");
  const [example, setExample] = useState("");
  const [bulk, setBulk] = useState("");

  const preview: LexicalEntry | null = useMemo(
    () => (word.trim() ? autoGenerateEntry({ word, meaningVi: meaning, collocations: cols, example }) : null),
    [word, meaning, cols, example]
  );
  const bulkParsed = useMemo(() => parseBulkVocabulary(bulk), [bulk]);

  const submit = () => {
    if (tab === "single") {
      if (!preview) return;
      addCustomEntries([preview]);
      onAdded(1);
    } else {
      const entries = bulkParsed.map((b) => autoGenerateEntry(b));
      addCustomEntries(entries);
      onAdded(entries.length);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Thêm / Nhập từ</h2>
            <p className="text-xs text-slate-500">Lưu vào "Bộ Từ Của Tôi"</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1.5 mx-5 mt-4 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[
            { id: "single", label: "Thêm một từ", icon: Plus },
            { id: "bulk", label: "Nhập hàng loạt", icon: FileText },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as "single" | "bulk")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold ${
                tab === t.id ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3 overflow-y-auto">
          {tab === "single" ? (
            <>
              <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Từ / cụm từ (vd: unprecedented)" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
              <input value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="Nghĩa tiếng Việt" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
              <input value={cols} onChange={(e) => setCols(e.target.value)} placeholder="Kết hợp từ (phân cách bằng dấu ;)" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
              <textarea value={example} onChange={(e) => setExample(e.target.value)} rows={2} placeholder="Câu ví dụ (không bắt buộc)" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
              {preview && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="font-bold text-slate-700 dark:text-slate-200">Tự động sinh:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Họ từ:{" "}
                    {Object.entries(preview.family)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" • ") || "—"}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">Gốc từ: {preview.etymology}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mỗi dòng một từ: "Từ - Nghĩa"</span>
                <button type="button" onClick={() => setBulk(SAMPLE)} className="text-[11px] font-bold text-indigo-600 hover:underline">
                  Nạp mẫu
                </button>
              </div>
              <textarea
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                rows={8}
                placeholder={"ubiquitous - có mặt khắp nơi\npernicious: độc hại ngấm ngầm"}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
              {bulkParsed.length > 0 && (
                <div className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Nhận diện {bulkParsed.length} từ (có nghĩa: {bulkParsed.filter((b) => b.meaningVi).length})
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={tab === "single" ? !preview : bulkParsed.length === 0}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold"
          >
            {tab === "single" ? "Lưu từ" : `Tạo ${bulkParsed.length} thẻ`}
          </button>
        </div>
      </div>
    </div>
  );
}
