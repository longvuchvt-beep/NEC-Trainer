"use client";

import React, { useState } from "react";
import {
  Printer,
  X,
  Eye,
  EyeOff,
  Download,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { triggerDownloadJsonBackup } from "../../lib/utilities/core-utilities-store";

interface PrintableWorksheetModalProps {
  isOpen: boolean;
  mode: "exam" | "vocab";
  exam?: any;
  questions?: any[];
  vocabList?: any[];
  onClose: () => void;
}

export default function PrintableWorksheetModal({
  isOpen,
  mode,
  exam,
  questions = [],
  vocabList = [],
  onClose,
}: PrintableWorksheetModalProps) {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-start p-3 md:p-6 overflow-y-auto">
      {/* Top Non-Printable Control Bar */}
      <div className="w-full max-w-5xl rounded-2xl eyecare-card border-2 border-amber-900/30 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-50 flex items-center justify-center">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold">
              🖨️ Chế độ Bản In A4 / Xuất PDF ({mode === "exam" ? exam?.title : `Sổ từ vựng C1/C2 (${vocabList.length} từ)`})
            </h3>
            <p className="text-xs opacity-75">
              Định dạng chuẩn đề thi giấy A4 • Tùy chọn bật/tắt bảng Đáp án &amp; Giải thích ở cuối trang
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeAnswerKey((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer ${
              includeAnswerKey
                ? "bg-emerald-700 text-white border-emerald-800"
                : "eyecare-elevated hover:bg-amber-900/10"
            }`}
          >
            {includeAnswerKey ? (
              <>
                <Eye className="w-3.5 h-3.5" /> ✅ Đang kèm Đáp án &amp; Giải thích
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" /> 🙈 Đang ẩn Đáp án (Đề trắng)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => triggerDownloadJsonBackup({ vocabList })}
            className="px-3.5 py-2 rounded-xl eyecare-elevated border text-xs font-extrabold flex items-center gap-1.5 hover:bg-amber-900/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> 💾 Sao lưu JSON
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> 🖨️ In ngay / Lưu PDF
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl eyecare-elevated border hover:bg-rose-500/15 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Printable A4 Sheet Container */}
      <div className="w-full max-w-5xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 md:p-12 space-y-6 font-serif print:shadow-none print:p-0">
        {mode === "exam" && exam ? (
          <>
            {/* Official Vietnamese Olympiad Worksheet Header */}
            <div className="border-b-2 border-slate-900 pb-4 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5 text-center md:text-left space-y-0.5">
                <div className="text-xs font-bold uppercase">
                  KỲ THI HỌC SINH GIỎI QUỐC GIA &amp; CHUYÊN ANH ({exam.tournament})
                </div>
                <div className="text-xs font-extrabold uppercase underline">
                  ĐƠN VỊ: {exam.province_school || "BỘ GIÁO DỤC & ĐÀO TẠO"}
                </div>
                <div className="text-[11px] italic pt-1">
                  Đề thi chính thức gồm {questions.length} câu hỏi chuẩn C1/C2
                </div>
              </div>

              <div className="md:col-span-7 text-center md:text-right space-y-1">
                <h1 className="text-base md:text-lg font-black uppercase">
                  {exam.title}
                </h1>
                <div className="text-xs font-bold">
                  Môn: TIẾNG ANH CHUYÊN • Thời gian làm bài:{" "}
                  {exam.duration_minutes || 180} phút
                </div>
                <div className="text-xs pt-1 flex flex-wrap md:justify-end gap-4">
                  <span>Họ và tên thí sinh: ............................................</span>
                  <span>SBD: ......................</span>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="pb-3 border-b border-slate-200 break-inside-avoid space-y-1.5"
                >
                  <div className="text-xs md:text-sm font-bold leading-relaxed">
                    <span className="font-black mr-1.5">
                      Question {q.number}:
                    </span>
                    <span>{q.stem}</span>
                    {(q.rootWord || q.givenWord) && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-xs font-black">
                        [{q.rootWord || q.givenWord}]
                      </span>
                    )}
                  </div>

                  {Array.isArray(q.options) && q.options.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4 text-xs md:text-sm">
                      {q.options.map((opt: any) => (
                        <div key={opt.id}>
                          <strong>{opt.id}.</strong> {opt.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pl-4 text-xs text-slate-600 font-mono">
                      Your answer: ________________________________________________
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Optional Answer Key & Explanations Section at the End */}
            {includeAnswerKey && (
              <div className="pt-6 border-t-2 border-slate-900 space-y-4 break-before-page">
                <h2 className="text-base md:text-lg font-black uppercase">
                  BẢNG ĐÁP ÁN CHUẨN &amp; GIẢI THÍCH HỌC THUẬT C1/C2 (ANSWER KEY)
                </h2>
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {questions.map((q) => (
                    <div
                      key={`ans-${q.id}`}
                      className="p-2.5 rounded border border-slate-300 bg-slate-50"
                    >
                      <div>
                        <strong>Câu {q.number}:</strong>{" "}
                        <span className="font-mono font-black text-emerald-800">
                          {q.answer}
                        </span>
                      </div>
                      {q.explanation?.vi && (
                        <div className="text-slate-700 mt-0.5">
                          {q.explanation.vi}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Printable Vocabulary Worksheet */
          <div className="space-y-4">
            <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black uppercase">
                  SỔ TỪ VỰNG HỌC THUẬT C1/C2 OLYMPIAD (VOCABULARY WORKSHEET)
                </h1>
                <p className="text-xs text-slate-600">
                  Tổng số mục từ: {vocabList.length} Collocations, Idioms, Phrasal Verbs &amp; Word Forms
                </p>
              </div>
              <span className="text-xs font-bold">V-EngOlympiad Hub</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-900 bg-slate-100">
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Cụm từ C1/C2 (Lexical Item)</th>
                  <th className="p-2 border">
                    {includeAnswerKey
                      ? "Nghĩa tiếng Việt & Cách dùng"
                      : "Tự điền nghĩa tiếng Việt (Active Recall)"}
                  </th>
                  <th className="p-2 border">Ngữ cảnh mẫu (Context)</th>
                </tr>
              </thead>
              <tbody>
                {vocabList.map((v, i) => (
                  <tr key={v.id || i} className="border-b border-slate-300">
                    <td className="p-2 border font-bold">{i + 1}</td>
                    <td className="p-2 border font-bold">
                      {v.term || v.word}
                    </td>
                    <td className="p-2 border">
                      {includeAnswerKey
                        ? v.definition_vi || v.meaning
                        : "............................................................"}
                    </td>
                    <td className="p-2 border italic">
                      {v.example || v.example_sentence || ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
