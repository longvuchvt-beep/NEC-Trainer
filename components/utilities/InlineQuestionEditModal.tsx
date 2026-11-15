"use client";

import React, { useState, useEffect } from "react";
import { X, Save, CheckCircle2, Edit3 } from "lucide-react";
import {
  QuestionEditPatch,
  saveQuestionEdit,
} from "../../lib/utilities/core-utilities-store";

interface InlineQuestionEditModalProps {
  isOpen: boolean;
  examId: string;
  question: any;
  onClose: () => void;
  onSaved: (questionId: string, patch: QuestionEditPatch) => void;
}

export default function InlineQuestionEditModal({
  isOpen,
  examId,
  question,
  onClose,
  onSaved,
}: InlineQuestionEditModalProps) {
  const [stem, setStem] = useState("");
  const [givenWord, setGivenWord] = useState("");
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ]);
  const [answer, setAnswer] = useState("");
  const [explanationVi, setExplanationVi] = useState("");
  const [rule, setRule] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setStem(question.stem || "");
      setGivenWord(question.rootWord || question.givenWord || "");
      if (Array.isArray(question.options) && question.options.length > 0) {
        setOptions(
          question.options.map((o: any) => ({
            id: String(o.id),
            text: String(o.text || ""),
          }))
        );
      } else {
        setOptions([]);
      }
      setAnswer(String(question.answer || ""));
      setExplanationVi(
        question.explanation?.vi || question.explanationVi || ""
      );
      setRule(question.explanation?.rule || "");
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const patch: QuestionEditPatch = {
      stem: stem.trim(),
      givenWord: givenWord.trim() || undefined,
      options: options.length > 0 ? options : undefined,
      answer: answer.trim(),
      explanationVi: explanationVi.trim(),
      rule: rule.trim() || undefined,
    };
    await saveQuestionEdit(examId, question.id, patch);
    setSaving(false);
    onSaved(question.id, patch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl eyecare-card border-2 border-amber-900/30 shadow-2xl p-6 md:p-7 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-amber-900/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-50 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-extrabold">
                ✏️ Sửa nhanh Câu #{question.number} ({question.id})
              </h3>
              <p className="text-xs opacity-75">
                Cập nhật tức thì nội dung câu hỏi, phương án A/B/C/D, đáp án chuẩn &amp; giải thích C1/C2
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl eyecare-elevated border hover:bg-rose-500/15 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Stem */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider opacity-80">
              Nội dung câu hỏi (Question Stem):
            </label>
            <textarea
              rows={3}
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl eyecare-elevated border text-xs md:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          {/* Root Word / Given Word + Correct Answer Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                Từ gốc (Root Word / Given Word — nếu có):
              </label>
              <input
                type="text"
                value={givenWord}
                onChange={(e) => setGivenWord(e.target.value)}
                placeholder="VD: PRECEDE, RECONCILE..."
                className="w-full px-3.5 py-2 rounded-xl eyecare-elevated border text-xs md:text-sm cloze-mono-input font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                Đáp án chuẩn (Correct Answer Key):
              </label>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
                placeholder="VD: A, B, C, D hoặc từ điền..."
                className="w-full px-3.5 py-2 rounded-xl eyecare-elevated border-2 border-emerald-600/40 text-xs md:text-sm cloze-mono-input font-extrabold text-emerald-800 dark:text-emerald-300"
              />
            </div>
          </div>

          {/* Options A, B, C, D (if MCQ) */}
          {options.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                Các phương án lựa chọn (Options A, B, C, D):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {options.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className="flex items-center gap-2 p-2 rounded-xl eyecare-elevated border"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-900 text-amber-50 text-xs font-black flex items-center justify-center shrink-0">
                      {opt.id}
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const copy = [...options];
                        copy[idx] = { ...copy[idx], text: e.target.value };
                        setOptions(copy);
                      }}
                      className="flex-1 bg-transparent text-xs md:text-sm font-semibold focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vietnamese C1/C2 Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider opacity-80">
              Giải thích học thuật C1/C2 (Vietnamese Explanation):
            </label>
            <textarea
              rows={3}
              value={explanationVi}
              onChange={(e) => setExplanationVi(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl eyecare-elevated border text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl eyecare-elevated border text-xs font-bold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Đang lưu..." : "💾 Lưu thay đổi ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
