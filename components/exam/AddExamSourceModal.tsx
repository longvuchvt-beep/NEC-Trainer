"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  FileText,
  GraduationCap,
  Layers,
  Check,
  ArrowRight,
  Filter,
  CheckCircle2,
} from "lucide-react";
import {
  AUTHENTIC_SOURCE_CATALOG,
  generateSpecializedSourceExam,
  createCustomExamFromRawText,
  SafeExam,
} from "../../lib/safe-data";
import { scanAndFilterBulkText } from "../../src/lib/question-hydrator";

interface AddExamSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated: (newExam: SafeExam) => void;
}

const TOPIC_FOCUSES = [
  { id: "ALL", label: "Tổng hợp toàn diện (50 câu C1/C2 & 9+)" },
  { id: "Collocation", label: "Chuyên sâu Kết hợp từ (Collocations)" },
  { id: "Phrasal Verb", label: "Chuyên sâu Cụm động từ (Phrasal Verbs)" },
  { id: "Idiom", label: "Chuyên sâu Thành ngữ (Idioms & Expressions)" },
  { id: "Word Formation", label: "Chuyên sâu Từ loại (Word Formation)" },
  { id: "Lexico-Grammar", label: "Cấu trúc Ngữ pháp & Đảo ngữ C1/C2" },
];

const SAMPLE_BULK_RAW_TEXT = `1. What is your name?
A. John
B. Book
C. Table
D. Chair
2. She goes to school _____ bus every day.
A. by
B. on
C. in
D. with
3. The Prime Minister remained completely _____ to the scathing criticism from the opposition benches.
A. impervious
B. imperious
C. impetuous
D. impertinent
4. Hardly had the austerity measures been announced _____ widespread industrial action erupted across the capital.
A. when
B. than
C. that
D. then
5. During the cross-examination, the defence barrister managed to _____ holes in the prosecution's circumstantial evidence.
A. pick
B. dig
C. punch
D. poke`;

export default function AddExamSourceModal({
  isOpen,
  onClose,
  onExamCreated,
}: AddExamSourceModalProps) {
  const [tab, setTab] = useState<"generator" | "paste">("generator");
  const [selectedCatId, setSelectedCatId] = useState<string>(
    AUTHENTIC_SOURCE_CATALOG[0].id
  );
  const activeCategory =
    AUTHENTIC_SOURCE_CATALOG.find((c) => c.id === selectedCatId) ||
    AUTHENTIC_SOURCE_CATALOG[0];

  const [selectedSchool, setSelectedSchool] = useState<string>(
    activeCategory.schools[0]
  );
  const [topicFocus, setTopicFocus] = useState<string>("ALL");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [rawPasteText, setRawPasteText] = useState<string>("");

  const liveScanPreview = useMemo(() => {
    if (!rawPasteText.trim()) return null;
    return scanAndFilterBulkText(rawPasteText);
  }, [rawPasteText]);

  if (!isOpen) return null;

  const handleCategoryChange = (catId: string) => {
    setSelectedCatId(catId);
    const cat = AUTHENTIC_SOURCE_CATALOG.find((c) => c.id === catId);
    if (cat && cat.schools.length > 0) {
      setSelectedSchool(cat.schools[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "generator") {
      const created = generateSpecializedSourceExam({
        competition: selectedCatId,
        school: selectedSchool,
        topicFocus,
        customTitle,
      });
      onExamCreated(created);
      onClose();
    } else {
      const created = createCustomExamFromRawText({
        title: customTitle || `Đề quét & lọc 9+ / C1-C2 — ${selectedSchool}`,
        competition: selectedCatId,
        school: selectedSchool,
        rawText: rawPasteText || SAMPLE_BULK_RAW_TEXT,
      });
      onExamCreated(created);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Quét & Nạp Đề Hàng Loạt (HSG & THPTQG 9+)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn 9 nhóm đề quốc gia hoặc dán văn bản để lọc tự động câu C1/C2 & 9+
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-1 p-1.5 mx-5 mt-4 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setTab("generator")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              tab === "generator"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Chọn Trường / Nguồn đề</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("paste")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              tab === "paste"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Quét & Lọc Đề Hàng Loạt</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {/* 1. Tournament / Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nhóm kỳ thi / Phân khúc (8 Hạng mục Quốc gia + Quốc tế)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {AUTHENTIC_SOURCE_CATALOG.map((cat) => {
                const active = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold text-left flex items-center justify-between transition ${
                      active
                        ? "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{cat.shortLabel}</span>
                    {active && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Specific School / Source Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Đơn vị / Trường chuyên thuộc {activeCategory.shortLabel}
            </label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              {activeCategory.schools.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>

          {tab === "generator" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chuyên đề trọng tâm
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={topicFocus}
                  onChange={(e) => setTopicFocus(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100"
                >
                  {TOPIC_FOCUSES.map((tf) => (
                    <option key={tf.id} value={tf.id}>
                      {tf.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dán đề thô (Tự động loại bỏ câu dễ A1–B1, giữ câu 9+ / C1-C2)
                </label>
                <button
                  type="button"
                  onClick={() => setRawPasteText(SAMPLE_BULK_RAW_TEXT)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Nạp văn bản mẫu
                </button>
              </div>
              <textarea
                rows={5}
                value={rawPasteText}
                onChange={(e) => setRawPasteText(e.target.value)}
                placeholder={`Dán nội dung đề thi thử THPTQG hoặc đề HSG Tỉnh vào đây...\nHệ thống sẽ tự động loại bỏ các câu nhận biết A1-B1 và giữ lại câu Vận dụng cao 9+ / C1-C2.`}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono"
              />

              {liveScanPreview && (
                <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 p-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Đã quét {liveScanPreview.totalScanned} câu • Loại bỏ{" "}
                      {liveScanPreview.filteredBasicCount} câu A1-B1
                    </span>
                  </div>
                  <span className="font-bold text-indigo-700 dark:text-indigo-300">
                    Giữ lại {liveScanPreview.retainedCount} câu 9+ / C1-C2
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên bộ đề (Không bắt buộc)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={`Đề luyện ${selectedSchool} (2025)`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bộ đề 50 câu kèm giải thích 4 tầng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
