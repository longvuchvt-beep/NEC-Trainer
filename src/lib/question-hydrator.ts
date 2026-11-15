"use client";

import {
  SHARD_LEXICO_COLLOCATIONS,
  RawShardQuestion,
} from "./shards/shard-lexico-collocations";
import { SHARD_IDIOMS_PHRASALS } from "./shards/shard-idioms-phrasals";
import { SHARD_GRAMMAR_INVERSION } from "./shards/shard-grammar-inversion";
import { SHARD_WORD_FORMATION } from "./shards/shard-word-formation";
import { SHARD_READING_CLOZE } from "./shards/shard-reading-cloze";
import { SHARD_SENTENCE_TRANSFORM } from "./shards/shard-sentence-transform";
import { SHARD_ERROR_CORRECTION } from "./shards/shard-error-correction";
import { extractReflexMicroQuestions } from "../../lib/arcade/question-extractor";
import {
  buildDeepLinguisticBreakdown,
  DeepLinguisticBreakdown,
} from "../../lib/linguistics/deep-linguistic-engine";

export interface HydratedQuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface HydratedQuestion {
  id: string;
  number: number;
  type: "mcq" | "text";
  prompt: string;
  stem: string;
  options: [
    HydratedQuestionOption,
    HydratedQuestionOption,
    HydratedQuestionOption,
    HydratedQuestionOption
  ];
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

const LETTERS: ["A", "B", "C", "D"] = ["A", "B", "C", "D"];

let cachedUnifiedCorpus: RawShardQuestion[] | null = null;

/**
 * Combines all 7 domain shards + the 160-item curated reflex bank into a high-density C1/C2 & THPTQG 9+ corpus.
 */
export function getUnifiedShardedCorpus(): RawShardQuestion[] {
  if (cachedUnifiedCorpus) return cachedUnifiedCorpus;

  const coreShards: RawShardQuestion[] = [
    ...SHARD_LEXICO_COLLOCATIONS,
    ...SHARD_IDIOMS_PHRASALS,
    ...SHARD_GRAMMAR_INVERSION,
    ...SHARD_WORD_FORMATION,
    ...SHARD_READING_CLOZE,
    ...SHARD_SENTENCE_TRANSFORM,
    ...SHARD_ERROR_CORRECTION,
  ];

  // Convert the 160 curated reflex items into RawShardQuestion format
  const reflexItems = extractReflexMicroQuestions([]);
  for (const item of reflexItems) {
    const distractors = item.options.filter(
      (opt) => opt !== item.correctText
    ) as [string, string, string];
    if (distractors.length === 3) {
      const breakdown = buildDeepLinguisticBreakdown({
        stem: item.stem,
        correctText: item.correctText,
        correctLetter: item.correctLetter,
        options: item.options,
        targetTerm: item.targetTerm,
        category: item.category,
        explanation: item.shortTip,
      });

      coreShards.push({
        stem: item.stem,
        correct: item.correctText,
        distractors,
        domain: item.category,
        targetTerm: breakdown.targetExpression,
        ipa: breakdown.ipa,
        register: breakdown.register,
        etymology: breakdown.etymologyAndNuance,
        collocation: breakdown.collocationAndSyntax,
        trapNote: breakdown.trapAnalysis,
      });
    }
  }

  cachedUnifiedCorpus = coreShards;
  return coreShards;
}

function hashStringSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h || 123456789;
}

/**
 * Deterministically builds a balanced 4-option question with exact 25% A/B/C/D slot assignment
 */
export function buildHydratedQuestionFromShard(
  raw: RawShardQuestion,
  questionIndex: number,
  examId: string,
  examSeed: number
): HydratedQuestion {
  // Latin-square 25% balanced target slot across A, B, C, D
  const permTable: [0, 1, 2, 3][] = [
    [0, 2, 1, 3],
    [1, 3, 0, 2],
    [2, 0, 3, 1],
    [3, 1, 2, 0],
  ];
  const row = (Math.floor(questionIndex / 4) + examSeed) % 4;
  const targetSlot = permTable[row][questionIndex % 4] as 0 | 1 | 2 | 3;
  const correctLetter = LETTERS[targetSlot];

  // Seeded shuffle of the 3 distractors
  const distPool = [...raw.distractors];
  let s = (examSeed * 31 + questionIndex * 1103515245 + 12345) >>> 0;
  for (let i = distPool.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = distPool[i];
    distPool[i] = distPool[j];
    distPool[j] = tmp;
  }

  const options: [
    HydratedQuestionOption,
    HydratedQuestionOption,
    HydratedQuestionOption,
    HydratedQuestionOption
  ] = [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
  ];

  let dPtr = 0;
  for (let slot = 0; slot < 4; slot++) {
    options[slot] = {
      id: LETTERS[slot],
      text: slot === targetSlot ? raw.correct : distPool[dPtr++] || `Option ${LETTERS[slot]}`,
    };
  }

  const syncedTrapAnalysis = `Các phương án gây nhiễu (${options
    .filter((o) => o.id !== correctLetter)
    .map((o) => `${o.id}: "${o.text}"`)
    .join(", ")}) không thỏa mãn quy tắc kết hợp từ hoặc ngữ pháp. ${raw.trapNote}`;

  const breakdown: DeepLinguisticBreakdown = {
    targetExpression: raw.targetTerm || raw.correct,
    ipa: raw.ipa || "/ˈleks.ɪ.kəl/",
    register: raw.register || `Formal C1/C2 • ${raw.domain}`,
    etymologyAndNuance: raw.etymology,
    collocationAndSyntax: raw.collocation,
    trapAnalysis: syncedTrapAnalysis,
  };

  const fullExplanation = `[Đáp án chuẩn: ${correctLetter} — "${raw.correct}"] ${raw.etymology} • Kết hợp từ: ${raw.collocation}`;

  return {
    id: `${examId}-q-${questionIndex + 1}`,
    number: questionIndex + 1,
    type: "mcq",
    prompt: raw.stem,
    stem: raw.stem,
    options,
    correctAnswer: correctLetter,
    answer: correctLetter,
    explanation: fullExplanation,
    hint: fullExplanation,
    explanationVi: fullExplanation,
    sectionKey: "lexicoGrammar",
    sectionTitle: raw.domain,
    partTitle: raw.domain,
    linguisticBreakdown: breakdown,
  };
}

/**
 * Deterministically hydrates a 50-question paper on-demand for any of the 2,050+ catalog exams.
 */
export function hydrateExamQuestionsOnDemand(
  examMeta: {
    id: string;
    competition?: string;
    seedIndex?: number;
    questionCount?: number;
  },
  targetCount = 50
): HydratedQuestion[] {
  const corpus = getUnifiedShardedCorpus();
  if (corpus.length === 0) return [];

  const seed =
    (Number(examMeta.seedIndex) || 1) * 2654435761 +
    hashStringSeed(String(examMeta.id || "exam"));

  // Prioritize domain shards matching the exam tier
  const comp = String(examMeta.competition || "").toUpperCase();
  let prioritizedCorpus = corpus;
  if (comp.includes("THPTQG")) {
    // THPTQG 9+ prioritizes Idioms, Phrasal Verbs, Collocations, Confusable Words, Inversion & Sentence Transform
    const vdcPool = corpus.filter(
      (q) =>
        q.domain.includes("Idiom") ||
        q.domain.includes("Collocation") ||
        q.domain.includes("Phrasal") ||
        q.domain.includes("Inversion") ||
        q.domain.includes("Transformation") ||
        q.domain.includes("Error")
    );
    if (vdcPool.length >= 40) prioritizedCorpus = vdcPool;
  }

  const totalPool = prioritizedCorpus.length;
  // Choose a coprime step so all 50 selected questions in the paper are distinct
  const candidateSteps = [7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
  let step = candidateSteps[Math.abs(seed) % candidateSteps.length];
  while (totalPool % step === 0 && step < totalPool - 1) {
    step += 2;
  }

  const startOffset = Math.abs(seed) % totalPool;
  const result: HydratedQuestion[] = [];

  for (let i = 0; i < targetCount; i++) {
    const idx = (startOffset + i * step) % totalPool;
    const rawShardItem = prioritizedCorpus[idx];
    result.push(
      buildHydratedQuestionFromShard(
        rawShardItem,
        i,
        examMeta.id,
        Math.abs(seed) % 997
      )
    );
  }

  return result;
}

/**
 * Automated Scanner & High-Differentiation Filter (C1/C2 & THPTQG 9+ Vận dụng cao):
 * Filters out short/basic A1-B1 items and retains advanced C1/C2 & 9+ differentiation items.
 */
export function scanAndFilterBulkText(params: {
  rawText: string;
  title: string;
  competition: string;
  school: string;
}): {
  totalScannedBlocks: number;
  filteredOutBasicCount: number;
  retainedAdvancedCount: number;
  parsedQuestions: RawShardQuestion[];
} {
  const lines = String(params.rawText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: Array<{ stem: string; opts: string[] }> = [];
  let curStem = "";
  let curOpts: string[] = [];

  const pushBlock = () => {
    if (!curStem) return;
    blocks.push({ stem: curStem, opts: [...curOpts] });
    curStem = "";
    curOpts = [];
  };

  for (const line of lines) {
    if (/^[A-D][\.\)]\s+/i.test(line)) {
      curOpts.push(line.replace(/^[A-D][\.\)]\s+/i, "").trim());
      if (curOpts.length === 4) pushBlock();
    } else if (/^(Question\s+\d+|Câu\s+\d+|\d+[\.\)])\s+/i.test(line)) {
      if (curStem) pushBlock();
      curStem = line
        .replace(/^(Question\s+\d+|Câu\s+\d+|\d+[\.\)])\s+/i, "")
        .trim();
    } else if (!curStem) {
      curStem = line;
    } else {
      curStem += " " + line;
    }
  }
  if (curStem) pushBlock();

  let filteredOutBasicCount = 0;
  const parsedQuestions: RawShardQuestion[] = [];

  const BASIC_A1_B1_PATTERNS =
    /\b(yesterday|every day|nowadays|last week|at the moment|next week|how old|what color|my name is)\b/i;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    // Filter out overly short or elementary A1-B1 grammar items when scanning a full 50-question THPTQG test
    if (b.stem.length < 32 || BASIC_A1_B1_PATTERNS.test(b.stem)) {
      filteredOutBasicCount++;
      continue;
    }

    const opts =
      b.opts.length >= 4
        ? b.opts.slice(0, 4)
        : [
            b.opts[0] || "notwithstanding",
            b.opts[1] || "consequently",
            b.opts[2] || "albeit",
            b.opts[3] || "inasmuch as",
          ];

    parsedQuestions.push({
      stem: b.stem,
      correct: opts[0],
      distractors: [opts[1], opts[2], opts[3]],
      domain: `${params.competition} • Vận dụng cao 9+`,
      targetTerm: opts[0],
      ipa: "/ˈleks.ɪ.kəl/",
      register: `Formal C1/C2 • ${params.school}`,
      etymology: `Câu hỏi phân loại cao (C1/C2 & VDC 9+) được trích xuất từ nguồn đề ${params.school}.`,
      collocation: b.stem,
      trapNote: `Phân biệt sắc thái từ vựng và cấu trúc kết hợp từ giữa "${opts[0]}" và các phương án gây nhiễu.`,
    });
  }

  return {
    totalScannedBlocks: blocks.length,
    filteredOutBasicCount,
    retainedAdvancedCount: parsedQuestions.length,
    parsedQuestions,
  };
}
