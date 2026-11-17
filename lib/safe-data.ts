"use client";

import React from "react";
import { extractReflexMicroQuestions } from "./arcade/question-extractor";
import {
  buildDeepLinguisticBreakdown,
  DeepLinguisticBreakdown,
} from "./linguistics/deep-linguistic-engine";
import {
  getCatalog2000,
  EXAM_TIER_FILTERS,
  DISTINCT_PROVINCE_NAMES,
  EXAM_YEARS,
} from "../src/lib/catalog-2000";
import {
  hydrateExamQuestionsOnDemand,
  scanAndFilterBulkText,
} from "../src/lib/question-hydrator";

export { EXAM_TIER_FILTERS, DISTINCT_PROVINCE_NAMES, EXAM_YEARS };

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
  linguisticBreakdown: DeepLinguisticBreakdown;
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
  seedIndex?: number;
  _searchIndex?: string;
}

export interface SourceCategoryDefinition {
  id: string;
  shortLabel: string;
  fullName: string;
  schools: string[];
}

export const AUTHENTIC_SOURCE_CATALOG: SourceCategoryDefinition[] = [
  {
    id: "HSGQG",
    shortLabel: "HSGQG",
    fullName: "HSG Quốc Gia (NEC & TST - Bộ GD&ĐT)",
    schools: [
      "Đề chính thức Bộ GD&ĐT (NEC)",
      "Đề thi thử Đội tuyển Quốc gia (Vòng 1 & 2)",
      "Đề Dự tuyển Olympic Quốc tế & Khu vực (TST)",
    ],
  },
  {
    id: "Chọn Đội Tuyển",
    shortLabel: "Chọn Đội Tuyển",
    fullName: "Đề Chọn Đội Tuyển Quốc Gia (63 Sở GD&ĐT)",
    schools: [
      "THPT Chuyên Phan Bội Châu (Nghệ An)",
      "THPT Chuyên Hà Tĩnh",
      "THPT Chuyên Lam Sơn (Thanh Hóa)",
      "THPT Chuyên Hà Nội - Amsterdam",
      "THPT Chuyên Ngoại Ngữ (CNN - ĐHQGHN)",
      "THPT Chuyên ĐH Sư Phạm (CSP)",
      "THPT Chuyên Hùng Vương (Phú Thọ)",
      "THPT Chuyên Trần Phú (Hải Phòng)",
    ],
  },
  {
    id: "DHBB",
    shortLabel: "DHBB",
    fullName: "Duyên hải & Đồng bằng Bắc Bộ (Khối 10 & 11)",
    schools: [
      "THPT Chuyên Trần Phú (Hải Phòng)",
      "THPT Chuyên Hạ Long (Quảng Ninh)",
      "THPT Chuyên Bắc Ninh",
      "THPT Chuyên Lê Hồng Phong (Nam Định)",
      "THPT Chuyên Thái Bình",
      "THPT Chuyên Nguyễn Trãi (Hải Dương)",
    ],
  },
  {
    id: "Trại hè Hùng Vương",
    shortLabel: "Hùng Vương",
    fullName: "Trại hè Hùng Vương & Trại hè Phương Nam",
    schools: [
      "THPT Chuyên Hùng Vương (Phú Thọ)",
      "THPT Chuyên Vĩnh Phúc",
      "THPT Chuyên Thái Nguyên",
      "THPT Chuyên Biên Hòa (Hà Nam)",
      "THPT Chuyên Tuyên Quang",
      "THPT Chuyên Lào Cai",
    ],
  },
  {
    id: "Olympic 30/4",
    shortLabel: "Olympic 30/4",
    fullName: "Olympic Truyền thống 30/4 (Miền Nam & Miền Trung)",
    schools: [
      "THPT Chuyên Lê Hồng Phong (TP.HCM)",
      "Phổ Thông Năng Khiếu (ĐHQG TP.HCM)",
      "THPT Chuyên Quốc Học (Huế)",
      "THPT Chuyên Lê Quý Đôn (Đà Nẵng)",
      "THPT Chuyên Thoại Ngọc Hầu (An Giang)",
    ],
  },
  {
    id: "HSG Tỉnh",
    shortLabel: "HSG Tỉnh",
    fullName: "HSG Cấp Tỉnh Bảng A & Olympic ĐHQG",
    schools: [
      "Sở GD&ĐT Hà Nội — HSG Thành phố Bảng A",
      "Sở GD&ĐT TP.HCM — HSG Thành phố Bảng A",
      "Sở GD&ĐT Nghệ An — HSG Tỉnh Bảng A",
      "Olympic bậc THPT ĐHQG Hà Nội",
      "Sở GD&ĐT Hải Phòng — HSG Thành phố Bảng A",
    ],
  },
  {
    id: "Vào 10 Chuyên",
    shortLabel: "Vào 10 Chuyên",
    fullName: "Tuyển sinh Vào lớp 10 Chuyên Anh Toàn Quốc",
    schools: [
      "THPT Chuyên Ngoại Ngữ (CNN - ĐHQGHN)",
      "THPT Chuyên ĐH Sư Phạm (CSP)",
      "THPT Chuyên Hà Nội - Amsterdam",
      "Phổ Thông Năng Khiếu (ĐHQG TP.HCM)",
      "THPT Chuyên Lê Hồng Phong (TP.HCM)",
      "THPT Chuyên Phan Bội Châu (Nghệ An)",
    ],
  },
  {
    id: "THPTQG Nâng Cao (9+)",
    shortLabel: "THPTQG 9+",
    fullName: "Đề Thi Thử THPTQG Vận Dụng Cao (Mục tiêu 9.0–10.0)",
    schools: [
      "Liên trường THPT Chuyên Nghệ An - Hà Tĩnh (9+)",
      "Sở GD&ĐT Hà Nội — Đề khảo sát Vận dụng cao 9+",
      "Sở GD&ĐT Nam Định — Đề thi thử THPTQG Nâng cao",
      "Sở GD&ĐT Phú Thọ — Đề khảo sát chất lượng 9+",
      "THPT Chuyên Ngoại Ngữ — Đề thi thử THPTQG 9.5+",
      "Sở GD&ĐT Vĩnh Phúc — Đề phân hóa 9.0–10.0",
    ],
  },
  {
    id: "Học thuật Quốc tế",
    shortLabel: "Quốc tế",
    fullName: "Nguồn Học Thuật Quốc Tế (CPE / Economist / Aeon)",
    schools: [
      "Cambridge CPE Use of English (C2 Proficiency)",
      "The Economist — Lexical & Reading Drills",
      "Aeon Essays — Philosophical & Cognitive English",
      "New Scientist — Scientific & Environmental Discourse",
    ],
  },
];

const CUSTOM_EXAMS_STORAGE_KEY = "veng_custom_exams_v1";
const LETTERS: ["A", "B", "C", "D"] = ["A", "B", "C", "D"];

export function formatCompetitionLabel(raw?: string): string {
  const val = String(raw || "").trim();
  const upper = val.toUpperCase();
  if (
    upper.includes("THPTQG") ||
    upper.includes("9+") ||
    upper.includes("VẬN DỤNG CAO")
  ) {
    return "THPTQG Nâng Cao (9+)";
  }
  if (upper.includes("VÀO 10") || upper.includes("TUYỂN SINH 10")) {
    return "Vào 10 Chuyên";
  }
  if (upper.includes("HSG TỈNH") || upper.includes("BẢNG A")) {
    return "HSG Tỉnh";
  }
  if (
    upper.includes("CHỌN ĐỘI TUYỂN") ||
    upper.includes("ĐỘI TUYỂN") ||
    upper.includes("DOI_TUYEN") ||
    upper.includes("HSG_TINH")
  ) {
    return "Chọn Đội Tuyển";
  }
  if (
    upper.includes("CAMBRIDGE") ||
    upper.includes("ECONOMIST") ||
    upper.includes("AEON") ||
    upper.includes("QUỐC TẾ") ||
    upper.includes("ACADEMIC")
  ) {
    return "Học thuật Quốc tế";
  }
  if (upper.includes("HSGQG") || upper.includes("QUỐC GIA") || upper.includes("NEC")) {
    return "HSGQG";
  }
  if (upper.includes("DHBB") || upper.includes("DUYÊN HẢI")) return "DHBB";
  if (upper.includes("OLYMPIC") || upper.includes("30/4") || upper.includes("30_4")) {
    return "Olympic 30/4";
  }
  if (upper.includes("HÙNG VƯƠNG") || upper.includes("HUNG_VUONG")) {
    return "Trại hè Hùng Vương";
  }
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
    rawQ?.prompt ||
      rawQ?.stem ||
      rawQ?.question ||
      `Question ${idx + 1}: Choose the best option to complete the sentence.`
  ).trim();

  const rawOptions = Array.isArray(rawQ?.options) ? rawQ.options : [];
  const targetSlot = LETTERS[idx % 4];

  let normalizedOptions: [
    SafeQuestionOption,
    SafeQuestionOption,
    SafeQuestionOption,
    SafeQuestionOption
  ];
  let correctLetter: "A" | "B" | "C" | "D" = targetSlot;

  if (rawOptions.length >= 4) {
    const parsedTexts = rawOptions.slice(0, 4).map((o: any, i: number) => {
      if (typeof o === "string") return o.trim();
      return String(o?.text || o?.label || o?.value || `Option ${LETTERS[i]}`).trim();
    });

    const rawAns = String(rawQ?.correctAnswer || rawQ?.answer || "")
      .trim()
      .toUpperCase();
    if (rawAns === "A" || rawAns === "B" || rawAns === "C" || rawAns === "D") {
      correctLetter = rawAns as "A" | "B" | "C" | "D";
    } else {
      const foundIdx = parsedTexts.findIndex(
        (t) =>
          t.toLowerCase() ===
          String(rawQ?.answer || "").trim().toLowerCase()
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
    const exactAnswer = String(
      rawQ?.answer || rawQ?.correctAnswer || "nevertheless"
    ).trim();
    const fallbackDistractors = [
      "consequently",
      "notwithstanding",
      "albeit",
      "inasmuch as",
    ].filter((d) => d.toLowerCase() !== exactAnswer.toLowerCase());
    const slotIdx = idx % 4;
    correctLetter = LETTERS[slotIdx];
    const opts: SafeQuestionOption[] = [];
    let dPtr = 0;
    for (let s = 0; s < 4; s++) {
      opts.push({
        id: LETTERS[s],
        text:
          s === slotIdx
            ? exactAnswer
            : fallbackDistractors[dPtr++] || `Option ${LETTERS[s]}`,
      });
    }
    normalizedOptions = opts as [
      SafeQuestionOption,
      SafeQuestionOption,
      SafeQuestionOption,
      SafeQuestionOption
    ];
  }

  const correctOptionObj =
    normalizedOptions.find((o) => o.id === correctLetter) || normalizedOptions[0];

  const rawExplanation = String(
    rawQ?.explanation ||
      rawQ?.hint ||
      rawQ?.explanationVi ||
      `Đáp án đúng là ${correctLetter} ("${correctOptionObj.text}"). Cấu trúc từ vựng - ngữ pháp C1/C2 trọng tâm.`
  ).trim();

  const linguisticBreakdown =
    rawQ?.linguisticBreakdown ||
    buildDeepLinguisticBreakdown({
      stem: promptText,
      correctText: correctOptionObj.text,
      correctLetter,
      options: normalizedOptions,
      targetTerm: rawQ?.targetTerm || correctOptionObj.text,
      category: partTitle,
      explanation: rawExplanation,
    });

  const isTextQuestion =
    rawQ?.type === "text" &&
    (!Array.isArray(rawQ?.options) || rawQ.options.length === 0);

  return {
    id: qId,
    number: Number(rawQ?.number) || idx + 1,
    type: isTextQuestion ? "text" : "mcq",
    prompt: promptText,
    stem: promptText,
    options: normalizedOptions,
    correctAnswer: correctLetter,
    answer: isTextQuestion
      ? String(rawQ?.answer || normalizedOptions[0].text)
      : correctLetter,
    explanation: rawExplanation,
    hint: rawExplanation,
    explanationVi: rawExplanation,
    sectionKey,
    sectionTitle,
    partTitle,
    passageText,
    linguisticBreakdown,
  };
}

let cachedFallbackQuestions: ReturnType<typeof extractReflexMicroQuestions> | null =
  null;
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

const hydratedExamCache = new Map<string, SafeExam>();

/**
 * Full on-demand hydration of a single exam (50 questions across 7 shards + deep 4-layer linguistics).
 * Called when the user opens an exam in MobileExamRunner or creates a custom exam.
 */
export function normalizeExam(rawExam: any, examIndex = 0): SafeExam {
  const safeId = String(rawExam?.id || `exam-safe-${examIndex + 1}`);
  if (hydratedExamCache.has(safeId) && (!rawExam?.questions || rawExam.questions.length === 0)) {
    return hydratedExamCache.get(safeId)!;
  }

  const competition = formatCompetitionLabel(
    rawExam?.tournament || rawExam?.competition
  );
  const school = String(
    rawExam?.school || rawExam?.province || "Chuyên Quốc Gia"
  ).trim();
  const province = String(
    rawExam?.province || rawExam?.school || "Toàn quốc"
  ).trim();
  const title = String(rawExam?.title || `Đề thi ${competition} - ${school}`)
    .replace(/\[Auto-Explained[^\]]*\]/gi, "")
    .replace(/\[Ingested[^\]]*\]/gi, "")
    .trim();

  const collectedQuestions: SafeQuestion[] = [];
  const sections =
    rawExam?.sections && typeof rawExam.sections === "object"
      ? { ...rawExam.sections }
      : {};

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

  if (collectedQuestions.length === 0 && Array.isArray(rawExam?.questions)) {
    for (const q of rawExam.questions) {
      collectedQuestions.push(
        normalizeQuestionItem(
          q,
          collectedQuestions.length,
          safeId,
          q?.sectionKey || "lexicoGrammar",
          q?.sectionTitle || "Lexico-Grammar",
          q?.partTitle || "Multiple Choice",
          q?.passageText
        )
      );
    }
  }

  const MIN_QUESTIONS = 50;
  if (collectedQuestions.length < MIN_QUESTIONS) {
    const seedIdx = Number(rawExam?.seedIndex ?? rawExam?.seedOffset ?? examIndex) || 0;
    const shardedHydrated = hydrateExamQuestionsOnDemand(
      {
        id: safeId,
        competition,
        school,
        province,
        year: Number(rawExam?.year) || 2025,
        seedIndex: seedIdx,
      },
      MIN_QUESTIONS - collectedQuestions.length
    );

    for (let i = 0; i < shardedHydrated.length; i++) {
      const sq = shardedHydrated[i];
      const nextNum = collectedQuestions.length + 1;
      collectedQuestions.push({
        ...sq,
        id: `${safeId}-shard-${nextNum}`,
        number: nextNum,
      });
    }
  }

  if (
    !sections.lexicoGrammar ||
    !Array.isArray(sections.lexicoGrammar?.parts) ||
    sections.lexicoGrammar.parts.length === 0
  ) {
    sections.lexicoGrammar = {
      title: "Lexico-Grammar & Reading",
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

  const finalExam: SafeExam = {
    ...rawExam,
    id: safeId,
    title,
    competition,
    tournament: competition,
    school,
    province,
    year: Number(rawExam?.year) || 2025,
    durationMinutes: Number(rawExam?.durationMinutes) || 180,
    questionCount: collectedQuestions.length,
    questions: collectedQuestions,
    sections,
  };

  hydratedExamCache.set(safeId, finalExam);
  return finalExam;
}

const EXPANDED_SCHOOL_TEMPLATES: Array<{
  id: string;
  title: string;
  competition: string;
  school: string;
  province: string;
  year: number;
  seedOffset: number;
}> = [
  {
    id: "chon-dt-thanh-hoa-lam-son-2025",
    title: "Đề Chọn Đội Tuyển Quốc Gia (2025) — THPT Chuyên Lam Sơn (Thanh Hóa): Vòng 1 & Vòng 2",
    competition: "Chọn Đội Tuyển",
    school: "THPT Chuyên Lam Sơn (Thanh Hóa)",
    province: "Thanh Hóa",
    year: 2025,
    seedOffset: 5,
  },
  {
    id: "exam-hv-vinh-phuc-2025",
    title: "Đề Trại hè Hùng Vương — THPT Chuyên Vĩnh Phúc",
    competition: "Trại hè Hùng Vương",
    school: "THPT Chuyên Vĩnh Phúc",
    province: "Vĩnh Phúc",
    year: 2025,
    seedOffset: 7,
  },
  {
    id: "exam-hv-thai-nguyen-2025",
    title: "Đề Trại hè Hùng Vương — THPT Chuyên Thái Nguyên",
    competition: "Trại hè Hùng Vương",
    school: "THPT Chuyên Thái Nguyên",
    province: "Thái Nguyên",
    year: 2025,
    seedOffset: 15,
  },
  {
    id: "exam-dhbb-ha-long-2025",
    title: "Đề Duyên hải Bắc Bộ — THPT Chuyên Hạ Long (Quảng Ninh)",
    competition: "DHBB",
    school: "THPT Chuyên Hạ Long (Quảng Ninh)",
    province: "Quảng Ninh",
    year: 2025,
    seedOffset: 31,
  },
  {
    id: "exam-olympic-quoc-hoc-hue-2025",
    title: "Đề Olympic Truyền thống 30/4 — THPT Chuyên Quốc Học (Huế)",
    competition: "Olympic 30/4",
    school: "THPT Chuyên Quốc Học (Huế)",
    province: "Thừa Thiên Huế",
    year: 2025,
    seedOffset: 61,
  },
  {
    id: "exam-dt-cnn-csp-2025",
    title: "Đề Chọn Đội Tuyển — THPT Chuyên Ngoại Ngữ (CNN) & Chuyên Sư Phạm",
    competition: "Chọn Đội Tuyển",
    school: "THPT Chuyên Ngoại Ngữ (CNN - ĐHQGHN)",
    province: "Hà Nội",
    year: 2025,
    seedOffset: 83,
  },
  {
    id: "exam-intl-cambridge-cpe-2025",
    title: "Cambridge CPE C2 Proficiency — Use of English & Lexical Precision",
    competition: "Học thuật Quốc tế",
    school: "Cambridge CPE Use of English (C2 Proficiency)",
    province: "Quốc tế",
    year: 2025,
    seedOffset: 109,
  },
  {
    id: "exam-intl-economist-aeon-2025",
    title: "The Economist, Aeon Essays & New Scientist — Academic Discourse Set",
    competition: "Học thuật Quốc tế",
    school: "The Economist & Aeon Essays",
    province: "Quốc tế",
    year: 2025,
    seedOffset: 127,
  },
];

export function getCustomUserExams(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_EXAMS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomUserExam(examObj: any): SafeExam {
  const norm = normalizeExam(examObj, Date.now() % 1000);
  if (typeof window !== "undefined") {
    try {
      const existing = getCustomUserExams().filter((e) => e?.id !== norm.id);
      localStorage.setItem(
        CUSTOM_EXAMS_STORAGE_KEY,
        JSON.stringify([norm, ...existing])
      );
    } catch {}
  }
  return norm;
}

export function generateSpecializedSourceExam(params: {
  competition: string;
  school: string;
  topicFocus: string;
  customTitle?: string;
}): SafeExam {
  const pool = getFallbackPool();
  const filteredPool =
    params.topicFocus && params.topicFocus !== "ALL"
      ? pool.filter((q) => q.category === params.topicFocus)
      : pool;
  const activePool = filteredPool.length >= 20 ? filteredPool : pool;

  const selectedQuestions = [];
  const offset = Math.abs(
    (params.school.length * 13 + params.competition.length * 7) %
      Math.max(1, activePool.length)
  );
  for (let i = 0; i < 50 && activePool.length > 0; i++) {
    const item = activePool[(offset + i * 3) % activePool.length];
    selectedQuestions.push({
      id: `gen-${Date.now()}-${i + 1}`,
      number: i + 1,
      type: "mcq",
      prompt: item.stem,
      options: [
        { id: "A", text: item.options[0] },
        { id: "B", text: item.options[1] },
        { id: "C", text: item.options[2] },
        { id: "D", text: item.options[3] },
      ],
      correctAnswer: item.correctLetter,
      explanation: item.explanationVi || item.shortTip,
      targetTerm: item.targetTerm,
      partTitle: item.category,
    });
  }

  const rawExam = {
    id: `custom-src-${Date.now()}`,
    title:
      params.customTitle?.trim() ||
      `Đề chuyên đề ${params.topicFocus === "ALL" ? "Tổng hợp C1/C2 & 9+" : params.topicFocus} — ${params.school}`,
    competition: params.competition,
    tournament: params.competition,
    school: params.school,
    province: params.school,
    year: 2025,
    durationMinutes: 90,
    questions: selectedQuestions,
  };

  return saveCustomUserExam(rawExam);
}

export function createCustomExamFromRawText(params: {
  title: string;
  competition: string;
  school: string;
  rawText: string;
}): SafeExam {
  const scanRes = scanAndFilterBulkText(params.rawText || "");
  const retained = scanRes.retainedQuestions.map((rq, idx) => ({
    id: `scanned-q-${Date.now()}-${idx + 1}`,
    number: idx + 1,
    type: "mcq",
    prompt: rq.stem,
    options: [
      { id: "A", text: rq.options[0] },
      { id: "B", text: rq.options[1] },
      { id: "C", text: rq.options[2] },
      { id: "D", text: rq.options[3] },
    ],
    correctAnswer: rq.correctLetter,
    targetTerm: rq.targetTerm,
    partTitle: rq.category,
    explanation: rq.explanationVi,
  }));

  const rawExam = {
    id: `imported-exam-${Date.now()}`,
    title: params.title?.trim() || `Đề quét & lọc C1/C2 (9+) — ${params.school}`,
    competition: params.competition,
    tournament: params.competition,
    school: params.school,
    province: params.school,
    year: 2025,
    durationMinutes: 90,
    questions: retained,
  };

  return saveCustomUserExam(rawExam);
}

export function createBulkScannedExamWithReport(params: {
  title: string;
  competition: string;
  school: string;
  rawText: string;
}) {
  const scanReport = scanAndFilterBulkText(params.rawText || "");
  const createdExam = createCustomExamFromRawText(params);
  return {
    exam: createdExam,
    totalScanned: scanReport.totalScanned,
    retainedCount: scanReport.retainedCount,
    filteredBasicCount: scanReport.filteredBasicCount,
  };
}

/**
 * High-speed Catalog Normalization (2,060+ exams).
 * Does NOT eagerly hydrate 50 questions × 2,060 exams on initial list render.
 * Instead, returns lightweight catalog items (`questionCount: 50`) so filtering & virtual pagination run at 60fps.
 * When any exam is opened in MobileExamRunner, `normalizeExam(rawExam)` hydrates all 50 questions on-demand!
 */
export function normalizeExamList(rawExams: any): SafeExam[] {
  const baseList = Array.isArray(rawExams) ? rawExams : [];
  const customList = getCustomUserExams();
  const catalog2000 = getCatalog2000();

  const combined = [
    ...customList,
    ...baseList,
    ...EXPANDED_SCHOOL_TEMPLATES,
    ...catalog2000,
  ];

  const seenIds = new Set<string>();
  const result: SafeExam[] = [];

  for (let i = 0; i < combined.length; i++) {
    const raw = combined[i];
    if (!raw || typeof raw !== "object") continue;
    const safeId = String(raw.id || `exam-safe-${i + 1}`);
    if (seenIds.has(safeId)) continue;
    seenIds.add(safeId);

    const competition = formatCompetitionLabel(raw.tournament || raw.competition);
    const school = String(raw.school || raw.province || "Chuyên Quốc Gia").trim();
    const province = String(raw.province || raw.school || "Toàn quốc").trim();
    const title = String(raw.title || `Đề thi ${competition} — ${school}`)
      .replace(/\[Auto-Explained[^\]]*\]/gi, "")
      .replace(/\[Ingested[^\]]*\]/gi, "")
      .trim();

    const seedIndex = Number(raw.seedIndex ?? raw.seedOffset ?? i) || i;
    const yearNum = Number(raw.year) || 2025;
    const searchStr = `${safeId} ${title} ${school} ${province} ${competition} ${yearNum}`.toLowerCase();

    result.push({
      id: safeId,
      title,
      competition,
      tournament: competition,
      school,
      province,
      year: yearNum,
      durationMinutes: Number(raw.durationMinutes) || 120,
      questionCount: Number(raw.questionCount) || 50,
      questions: Array.isArray(raw.questions) ? raw.questions : [],
      sections: raw.sections && typeof raw.sections === "object" ? raw.sections : {},
      seedIndex,
      _searchIndex: searchStr,
    });
  }

  return result;
}

function toAsciiSlug(str: string): string {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves any /exams/[slug] route instantaneously.
 */
export function resolveExamByIdOrSlug(
  exams: SafeExam[],
  idOrSlug: string | null | undefined
): SafeExam | null {
  if (!idOrSlug) return null;
  const target = String(idOrSlug).trim();
  if (!target) return null;

  // 1. Direct ID match (O(n) scan on pre-built array)
  const exact = exams.find((e) => e.id === target);
  if (exact) return exact;

  // 2. Normalized slug match
  const targetSlug = toAsciiSlug(target);
  const tokens = targetSlug.split("-").filter((t) => t.length >= 2);
  let bestExam: SafeExam | null = null;
  let bestScore = 0;

  for (let i = 0; i < exams.length; i++) {
    const ex = exams[i];
    const exSlug = toAsciiSlug(`${ex.id} ${ex.title} ${ex.school} ${ex.province} ${ex.year}`);
    if (exSlug === targetSlug) return ex;
    let score = 0;
    for (const tk of tokens) {
      if (exSlug.includes(tk)) score++;
    }
    if (score > bestScore && score >= Math.min(3, tokens.length)) {
      bestScore = score;
      bestExam = ex;
    }
  }

  if (bestExam) return bestExam;

  // 3. Deterministic fallback exam for arbitrary custom URL slugs
  return {
    id: target,
    title: `Đề thi Chuyên Anh — ${target.replace(/-/g, " ").toUpperCase()}`,
    competition: "Chọn Đội Tuyển",
    tournament: "Chọn Đội Tuyển",
    school: "Trường THPT Chuyên Quốc Gia",
    province: "Toàn quốc",
    year: 2025,
    durationMinutes: 120,
    questionCount: 50,
    questions: [],
    sections: {},
    seedIndex: Math.abs(target.length * 17),
    _searchIndex: target.toLowerCase(),
  };
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class GlobalErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
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
      } catch {}
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
            this.props.fallbackTitle || "Đang khôi phục phiên làm việc"
          ),
          React.createElement(
            "p",
            { className: "text-xs text-slate-500 leading-relaxed" },
            this.state.errorMessage
          ),
          React.createElement(
            "div",
            { className: "flex items-center justify-center gap-3 pt-2" },
            React.createElement(
              "button",
              {
                type: "button",
                onClick: this.handleReload,
                className:
                  "px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition",
              },
              "Tải lại trang"
            ),
            React.createElement(
              "button",
              {
                type: "button",
                onClick: this.handleHardReset,
                className:
                  "px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition",
              },
              "Làm mới dữ liệu"
            )
          )
        )
      );
    }
    return this.props.children;
  }
}
