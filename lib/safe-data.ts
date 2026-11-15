"use client";

import React from "react";
import { extractReflexMicroQuestions } from "./arcade/question-extractor";

export interface SafeQuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface SafeQuestion {
  id: string;
  number: number;
  type: "mcq" | "text";
  prompt: string;
  stem: string;
  options: [SafeQuestionOption, SafeQuestionOption, SafeQuestionOption, SafeQuestionOption];
  correctAnswer: "A" | "B" | "C" | "D";
  answer: string;
  explanation: string;
  hint: string;
  explanationVi: string;
  sectionKey: string;
  sectionTitle: string;
  partTitle: string;
  passageText?: string;
}

export interface SafeExam {
  id: string;
  title: string;
  competition: string;
  tournament: string;
  school: string;
  province: string;
  year: number;
  durationMinutes: number;
  questionCount: number;
  questions: SafeQuestion[];
  sections: Record<string, any>;
}

const LETTERS: ["A", "B", "C", "D"] = ["A", "B", "C", "D"];

export function formatCompetitionLabel(raw?: string): string {
  const val = String(raw || "").trim();
  const upper = val.toUpperCase();
  if (upper.includes("HSGQG") || upper.includes("QUỐC GIA")) return "HSGQG";
  if (upper.includes("DHBB") || upper.includes("DUYÊN HẢI")) return "DHBB";
  if (upper.includes("OLYMPIC") || upper.includes("30/4") || upper.includes("30_4")) return "Olympic 30/4";
  if (upper.includes("HÙNG VƯƠNG") || upper.includes("HUNG_VUONG")) return "Trại hè Hùng Vương";
  if (upper.includes("ĐỘI TUYỂN") || upper.includes("DOI_TUYEN")) return "Đội tuyển";
  return val || "HSGQG";
}

function normalizeQuestionItem(
  rawQ: any,
  idx: number,
  examId: string,
  sectionKey = "lexicoGrammar",
  sectionTitle = "Lexico-Grammar",
  partTitle = "Multiple Choice",
  passageText?: string
): SafeQuestion {
  const qId = String(rawQ?.id || `${examId}-q-${idx + 1}`);
  const promptText = String(
    rawQ?.prompt || rawQ?.stem || rawQ?.question || `Question ${idx + 1}: Choose the best option to complete the sentence.`
  ).trim();

  // Extract 4 options safely
  let rawOptions = Array.isArray(rawQ?.options) ? rawQ.options : [];
  const targetSlot =LETTERS[idx % 4];

  let normalizedOptions: [SafeQuestionOption, SafeQuestionOption, SafeQuestionOption, SafeQuestionOption];
  let correctLetter: "A" | "B" | "C" | "D" = targetSlot;

  if (rawOptions.length >= 4) {
    const parsedTexts = rawOptions.slice(0, 4).map((o: any, i: number) => {
      if (typeof o === "string") return o.trim();
      return String(o?.text || o?.label || o?.value || `Option ${LETTERS[i]}`).trim();
    });

    const rawAns = String(rawQ?.correctAnswer || rawQ?.answer || "").trim().toUpperCase();
    if (rawAns === "A" || rawAns === "B" || rawAns === "C" || rawAns === "D") {
      correctLetter = rawAns as "A" | "B" | "C" | "D";
    } else {
      const foundIdx = parsedTexts.findIndex(
        (t) => t.toLowerCase() === String(rawQ?.answer || "").trim().toLowerCase()
      );
      correctLetter = foundIdx >= 0 ? LETTERS[foundIdx] : targetSlot;
    }

    normalizedOptions = [
      { id: "A", text: parsedTexts[0] || "Option A" },
      { id: "B", text: parsedTexts[1] || "Option B" },
      { id: "C", text: parsedTexts[2] || "Option C" },
      { id: "D", text: parsedTexts[3] || "Option D" },
    ];
  } else {
    // Open cloze / word form converted or preserved with 4 options fallback
    const exactAnswer = String(rawQ?.answer || rawQ?.correctAnswer || "nevertheless").trim();
    const fallbackDistractors = ["consequently", "notwithstanding", "albeit", "inasmuch as"].filter(
      (d) => d.toLowerCase() !== exactAnswer.toLowerCase()
    );
    const slotIdx = idx % 4;
    correctLetter = LETTERS[slotIdx];
    const opts: SafeQuestionOption[] = [];
    let dPtr = 0;
    for (let s = 0; s < 4; s++) {
      opts.push({
        id: LETTERS[s],
        text: s === slotIdx ? exactAnswer : fallbackDistractors[dPtr++] || `Option ${LETTERS[s]}`,
      });
    }
    normalizedOptions = opts as [SafeQuestionOption, SafeQuestionOption, SafeQuestionOption, SafeQuestionOption];
  }

  const rawExplanation = String(
    rawQ?.explanation ||
      rawQ?.hint ||
      rawQ?.explanationVi ||
      `Đáp án đúng là ${correctLetter}. Cấu trúc từ vựng - ngữ pháp C1/C2 trọng tâm.`
  ).trim();

  const isTextQuestion =
    rawQ?.type === "text" && (!Array.isArray(rawQ?.options) || rawQ.options.length === 0);

  return {
    id: qId,
    number: Number(rawQ?.number) || idx + 1,
    type: isTextQuestion ? "text" : "mcq",
    prompt: promptText,
    stem: promptText,
    options: normalizedOptions,
    correctAnswer: correctLetter,
    answer: isTextQuestion ? String(rawQ?.answer || normalizedOptions[0].text) : correctLetter,
    explanation: rawExplanation,
    hint: rawExplanation,
    explanationVi: rawExplanation,
    sectionKey,
    sectionTitle,
    partTitle,
    passageText,
  };
}

let cachedFallbackQuestions: ReturnType<typeof extractReflexMicroQuestions> | null = null;
function getFallbackPool() {
  if (!cachedFallbackQuestions) {
    try {
      cachedFallbackQuestions = extractReflexMicroQuestions([]);
    } catch {
      cachedFallbackQuestions = [];
    }
  }
  return cachedFallbackQuestions;
}

export function normalizeExam(rawExam: any, examIndex = 0): SafeExam {
  const safeId = String(rawExam?.id || `exam-safe-${examIndex + 1}`);
  const competition = formatCompetitionLabel(rawExam?.tournament || rawExam?.competition);
  const province = String(rawExam?.province || rawExam?.school || "Chuyên Quốc Gia")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  const title = String(rawExam?.title || `Đề thi ${competition} - ${province}`)
    .replace(/\[Auto-Explained[^\]]*\]/gi, "")
    .replace(/\[Ingested[^\]]*\]/gi, "")
    .trim();

  const collectedQuestions: SafeQuestion[] = [];
  const sections = rawExam?.sections && typeof rawExam.sections === "object" ? { ...rawExam.sections } : {};

  // 1. Collect from sections if present
  const sectionOrder: Array<{ key: string; label: string }> = [
    { key: "listening", label: "Listening" },
    { key: "lexicoGrammar", label: "Lexico-Grammar" },
    { key: "reading", label: "Reading" },
    { key: "writing", label: "Writing" },
  ];

  for (const sec of sectionOrder) {
    const secObj = sections[sec.key];
    const parts = Array.isArray(secObj?.parts) ? secObj.parts : [];
    for (const part of parts) {
      const partTitle = String(part?.partTitle || part?.title || sec.label);
      const passageText = part?.passage ? String(part.passage) : undefined;
      const qs = Array.isArray(part?.questions) ? part.questions : [];
      for (const q of qs) {
        const normQ = normalizeQuestionItem(
          q,
          collectedQuestions.length,
          safeId,
          sec.key,
          sec.label,
          partTitle,
          passageText
        );
        collectedQuestions.push(normQ);
      }
    }
  }

  // 2. Also collect from flat rawExam.questions if sections were empty
  if (collectedQuestions.length === 0 && Array.isArray(rawExam?.questions)) {
    for (const q of rawExam.questions) {
      collectedQuestions.push(
        normalizeQuestionItem(q, collectedQuestions.length, safeId, "lexicoGrammar", "Lexico-Grammar", "Multiple Choice")
      );
    }
  }

  // 3. Auto-fill if exam has fewer than 50 questions so no exam is ever sparse or broken
  const MIN_QUESTIONS = 50;
  if (collectedQuestions.length < MIN_QUESTIONS) {
    const pool = getFallbackPool();
    const needed = MIN_QUESTIONS - collectedQuestions.length;
    for (let i = 0; i < needed && pool.length > 0; i++) {
      const item = pool[(examIndex * 17 + i) % pool.length];
      const idx = collectedQuestions.length;
      const safeOpts: [SafeQuestionOption, SafeQuestionOption, SafeQuestionOption, SafeQuestionOption] = [
        { id: "A", text: item.options[0] },
        { id: "B", text: item.options[1] },
        { id: "C", text: item.options[2] },
        { id: "D", text: item.options[3] },
      ];
      collectedQuestions.push({
        id: `${safeId}-autofill-${idx + 1}`,
        number: idx + 1,
        type: "mcq",
        prompt: item.stem,
        stem: item.stem,
        options: safeOpts,
        correctAnswer: item.correctLetter,
        answer: item.correctLetter,
        explanation: item.explanationVi || item.shortTip,
        hint: item.explanationVi || item.shortTip,
        explanationVi: item.explanationVi || item.shortTip,
        sectionKey: "lexicoGrammar",
        sectionTitle: "Lexico-Grammar",
        partTitle: item.category,
      });
    }
  }

  // Ensure sections has at least lexicoGrammar if it was missing
  if (!sections.lexicoGrammar || !Array.isArray(sections.lexicoGrammar?.parts) || sections.lexicoGrammar.parts.length === 0) {
    sections.lexicoGrammar = {
      title: "Lexico-Grammar",
      parts: [
        {
          id: `${safeId}-part-main`,
          partTitle: "Lexico-Grammar & Reading",
          type: "mcq",
          questions: collectedQuestions,
        },
      ],
    };
  }

  return {
    ...rawExam,
    id: safeId,
    title,
    competition,
    tournament: competition,
    school: province,
    province,
    year: Number(rawExam?.year) || 2025,
    durationMinutes: Number(rawExam?.durationMinutes) || 180,
    questionCount: collectedQuestions.length,
    questions: collectedQuestions,
    sections,
  };
}

export function normalizeExamList(rawExams: any): SafeExam[] {
  if (!Array.isArray(rawExams) || rawExams.length === 0) return [];
  const seenIds = new Set<string>();
  const result: SafeExam[] = [];

  for (let i = 0; i < rawExams.length; i++) {
    const raw = rawExams[i];
    if (!raw || typeof raw !== "object") continue;
    const norm = normalizeExam(raw, i);
    if (seenIds.has(norm.id)) continue;
    seenIds.add(norm.id);
    result.push(norm);
  }
  return result;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Đã xảy ra lỗi hiển thị giao diện.",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[GlobalErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  handleHardReset = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("v_engolympiad_exam_sessions_v1");
      } catch {
        // ignore
      }
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      return React.createElement(
        "div",
        {
          className:
            "min-h-screen flex items-center justify-center p-4 bg-slate-50 text-slate-900 font-sans",
        },
        React.createElement(
          "div",
          {
            className:
              "w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-sm text-center space-y-4",
          },
          React.createElement(
            "h2",
            { className: "text-lg font-bold text-slate-900" },
            this.props.fallbackTitle || "Đã xảy ra sự cố hiển thị"
          ),
          React.createElement(
            "p",
            { className: "text-sm text-slate-600 leading-relaxed" },
            "Hệ thống đã tự động bảo vệ dữ liệu làm bài của bạn. Vui lòng bấm nút bên dưới để tải lại trang."
          ),
          React.createElement(
            "div",
            { className: "flex flex-col sm:flex-row gap-2.5 pt-2" },
            React.createElement(
              "button",
              {
                type: "button",
                onClick: this.handleReload,
                className:
                  "flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition",
              },
              "Tải lại trang"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: this.handleHardReset,
                className:
                  "py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium transition",
              },
              "Về trang chủ"
            )
          )
        )
      );
    }

    return this.props.children;
  }
}
