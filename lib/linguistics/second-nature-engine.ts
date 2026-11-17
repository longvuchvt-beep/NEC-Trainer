"use client";

import { SafeQuestion } from "../safe-data";

export type MorphologicalSlotType = "Noun" | "Verb" | "Adj" | "Adv" | "Prep/Conj";
export type PolarityType = "POSITIVE" | "NEGATIVE";

export interface LexicalChunkExtraction {
  beforeChunk: string;
  lexicalChunk: string;
  afterChunk: string;
  spokenChunkText: string;
  syntacticFormula: string;
}

export interface MorphologicalSlotPrediction {
  expectedSlot: MorphologicalSlotType;
  expectedPolarity: PolarityType;
  slotReasoningVi: string;
}

export interface RedemptionTwinCard {
  id: string;
  originQuestionId: string;
  originQuestionNumber: number;
  triggerAfterCount: number; // Default: 3 questions after mistake
  answeredSinceQueued: number;
  microPrompt: string;
  lexicalChunkTarget: string;
  options: Array<{ id: "A" | "B" | "C" | "D"; text: string }>;
  correctAnswer: "A" | "B" | "C" | "D";
  correctText: string;
  syntacticFormula: string;
}

const INTUITION_MODE_KEY = "veng_intuition_mode_enabled_v1";
const LOCKED_REFLEXES_KEY = "veng_locked_reflexes_v1";

export function getIntuitionModePreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(INTUITION_MODE_KEY);
    if (val === null) return true; // Default enabled so students experience Second-Nature training immediately
    return val === "true";
  } catch {
    return true;
  }
}

export function setIntuitionModePreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INTUITION_MODE_KEY, String(enabled));
  } catch {}
}

export function getLockedReflexIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCKED_REFLEXES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordLockedReflex(questionId: string): string[] {
  const existing = getLockedReflexIds();
  if (existing.includes(questionId)) return existing;
  const next = [questionId, ...existing];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCKED_REFLEXES_KEY, JSON.stringify(next));
    } catch {}
  }
  return next;
}

/**
 * Mechanic 1: "Intuition-First" Blind Prediction Prompt
 */
export function getIntuitionPredictionPrompt(question: SafeQuestion): {
  promptVi: string;
  clueHintVi: string;
} {
  const cat = String(question?.partTitle || "").toLowerCase();
  const stem = String(question?.prompt || "");

  if (cat.includes("word formation") || /[A-Z]{4,}/.test(stem)) {
    return {
      promptVi: "Não bạn bật ra giới từ / từ loại gì đầu tiên?",
      clueHintVi:
        "Quan sát từ đứng ngay trước & sau chỗ trống để chốt Từ loại (Noun/Verb/Adj/Adv) và Sắc thái (+/-) trước khi mở đáp án.",
    };
  }
  if (cat.includes("inversion") || cat.includes("syntax") || /^(____|Little|Hardly|Scarcely|Not only|No sooner|Were|Had|Should)/i.test(stem)) {
    return {
      promptVi: "Não bạn bật ra cấu trúc đảo ngữ / giới từ gì đầu tiên?",
      clueHintVi:
        "Nhận diện trạng từ bán phủ định hoặc mệnh đề điều kiện ẩn để dự đoán trợ động từ đảo lên trước chủ ngữ.",
    };
  }
  if (cat.includes("phrasal") || cat.includes("idiom")) {
    return {
      promptVi: "Não bạn bật ra giới từ / tiểu từ (particle) hay hình ảnh ẩn dụ nào đầu tiên?",
      clueHintVi:
        "Đừng nhìn phương án gây nhiễu vội — hãy đọc tân ngữ phía sau chỗ trống để gọi tên cụm cố định (Collocation/Idiom).",
    };
  }
  return {
    promptVi: "Não bạn bật ra giới từ / từ loại gì đầu tiên?",
    clueHintVi:
      "Đọc động từ và giới từ quanh chỗ trống (Collocation Frame) để kích hoạt trí nhớ chủ động trước khi nhìn 4 đáp án.",
  };
}

/**
 * Mechanic 2: Visual "Lexical Chunk" Highlighting & Acoustic Priming
 * Extracts the surrounding multi-word Collocation / Syntactic Frame around the blank
 * so the student perceives the entire C1/C2 phrase as one rhythmic unit.
 */
export function extractLexicalChunkFromQuestion(
  question: SafeQuestion
): LexicalChunkExtraction {
  const rawStem = String(question?.prompt || "")
    .replace(/^(Question\s+\d+|Câu\s+\d+|\d+)[\.\:\)]\s*/i, "")
    .trim();

  const correctOpt =
    question?.options?.find((o) => o.id === question.correctAnswer) ||
    question?.options?.[0];
  const answerText = String(correctOpt?.text || "").trim();

  const blankRegex = /_{2,}|\.{3,}|\[blank\]/i;
  const match = rawStem.match(blankRegex);

  if (!match || match.index === undefined) {
    // If no explicit blank (e.g., error correction or transformation), highlight the core target phrase
    const targetExpr =
      question?.linguisticBreakdown?.targetExpression || answerText;
    return {
      beforeChunk: rawStem + " → ",
      lexicalChunk: answerText,
      afterChunk: "",
      spokenChunkText: answerText,
      syntacticFormula:
        question?.linguisticBreakdown?.collocationAndSyntax || targetExpr,
    };
  }

  const blankStart = match.index;
  const blankEnd = blankStart + match[0].length;

  const leftPart = rawStem.slice(0, blankStart);
  const rightPart = rawStem.slice(blankEnd);

  // Grab up to 3 words before the blank (stopping at punctuation) and up to 4 words after the blank
  const leftTokens = leftPart.split(/\s+/).filter(Boolean);
  const rightTokens = rightPart.split(/\s+/).filter(Boolean);

  let chunkLeftWords: string[] = [];
  for (let i = leftTokens.length - 1; i >= 0 && chunkLeftWords.length < 3; i--) {
    const w = leftTokens[i];
    chunkLeftWords.unshift(w.replace(/^[,;:"'(\[]+/, ""));
    if (/[,;:.?!]$/.test(w)) break;
  }

  let chunkRightWords: string[] = [];
  for (let i = 0; i < rightTokens.length && chunkRightWords.length < 4; i++) {
    const w = rightTokens[i];
    const cleanW = w.replace(/[,;:.?!"')\]]+$/, "");
    if (cleanW && !/^\([A-Z]+\)$/.test(cleanW)) {
      chunkRightWords.push(cleanW);
    }
    if (/[,;:.?!)]$/.test(w)) break;
  }

  const chunkLeftStr = chunkLeftWords.join(" ").trim();
  const chunkRightStr = chunkRightWords.join(" ").trim();

  const fullChunk = [chunkLeftStr, answerText, chunkRightStr]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  // Compute exact slice boundaries in the original sentence for inline rendering
  const leftBoundaryIdx = chunkLeftStr
    ? leftPart.lastIndexOf(chunkLeftWords[0])
    : blankStart;
  const safeLeftIdx = leftBoundaryIdx >= 0 ? leftBoundaryIdx : blankStart;

  let rightBoundaryIdx = blankEnd;
  if (chunkRightWords.length > 0) {
    const lastWord = chunkRightWords[chunkRightWords.length - 1];
    const foundPos = rightPart.indexOf(lastWord);
    if (foundPos >= 0) {
      rightBoundaryIdx = blankEnd + foundPos + lastWord.length;
    }
  }

  const beforeChunk = rawStem.slice(0, safeLeftIdx);
  const afterChunk = rawStem.slice(rightBoundaryIdx);

  return {
    beforeChunk,
    lexicalChunk: fullChunk || answerText,
    afterChunk,
    spokenChunkText: fullChunk || answerText,
    syntacticFormula:
      question?.linguisticBreakdown?.collocationAndSyntax || fullChunk,
  };
}

/**
 * Speak the unified Lexical Chunk in natural British English (en-GB) for acoustic priming
 */
export function speakLexicalChunkEnGB(chunkText: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleaned = String(chunkText || "")
      .replace(/\[|\]/g, "")
      .replace(/\([A-Z]{3,}\)/g, "")
      .trim();
    if (!cleaned) return;

    const utter = new SpeechSynthesisUtterance(cleaned);
    utter.lang = "en-GB";
    utter.rate = 0.93;
    utter.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const ukVoice =
      voices.find(
        (v) =>
          v.lang.includes("en-GB") &&
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Libby") ||
            v.name.includes("Ryan"))
      ) || voices.find((v) => v.lang.includes("en-GB"));

    if (ukVoice) {
      utter.voice = ukVoice;
    }
    window.speechSynthesis.speak(utter);
  } catch {}
}

/**
 * Mechanic 3: 1-Second Morphological Slot Predictor
 * Determines the expected Part of Speech (Noun, Verb, Adj, Adv, Prep/Conj) and Semantic Polarity (+ / -)
 */
export function inferMorphologicalSlot(
  question: SafeQuestion
): MorphologicalSlotPrediction {
  const correctOpt =
    question?.options?.find((o) => o.id === question.correctAnswer) ||
    question?.options?.[0];
  const ans = String(correctOpt?.text || "")
    .trim()
    .toLowerCase();
  const stem = String(question?.prompt || "");

  let expectedSlot: MorphologicalSlotType = "Adj";
  if (
    /^(in|on|at|to|for|with|by|from|of|into|upon|under|against|despite|albeit|whereas|lest|whereby|inasmuch)\b/i.test(
      ans
    ) ||
    /^(when|than|that|whether|unless|provided|albeit)$/i.test(ans)
  ) {
    expectedSlot = "Prep/Conj";
  } else if (/ly$/.test(ans) && !/^(friendly|costly|likely|timely)$/.test(ans)) {
    expectedSlot = "Adv";
  } else if (
    /(tion|sion|ment|ness|ity|ance|ence|ship|hood|ism|ist|cy|tude)$/.test(ans)
  ) {
    expectedSlot = "Noun";
  } else if (
    /(ous|ive|al|ic|able|ible|ful|less|ant|ent|ary|ory|ish|ate)$/.test(ans) ||
    /\b(remained|was|were|is|are|become|became|seem|seemed|rendered|proved)\s+_{2,}/i.test(
      stem
    )
  ) {
    expectedSlot = "Adj";
  } else if (
    /\b(to|would|could|should|might|must|can|will|did|does)\s+_{2,}/i.test(
      stem
    ) ||
    /(ize|ise|ate|ify|en)$/.test(ans) ||
    ans.split(/\s+/).length >= 2
  ) {
    expectedSlot = "Verb";
  }

  // Infer Semantic Polarity (+ Khẳng định vs. - Phủ định / Đối lập)
  const isNegative =
    /^(un|in|im|ir|il|dis|mis|non|de|anti|counter)/i.test(ans) ||
    /less$/.test(ans) ||
    /\b(little|hardly|scarcely|barely|no sooner|never|nor|neither|not|without|fail|refuse|reject|critic|outcry|flaw|futile|dire)\b/i.test(
      ans + " " + stem
    );

  const expectedPolarity: PolarityType = isNegative ? "NEGATIVE" : "POSITIVE";

  const slotLabels: Record<MorphologicalSlotType, string> = {
    Noun: "Danh từ (Noun)",
    Verb: "Động từ / Cụm động từ (Verb Phrase)",
    Adj: "Tính từ học thuật (Adjective)",
    Adv: "Trạng từ (Adverb)",
    "Prep/Conj": "Giới từ / Liên từ cấu trúc (Prep/Conj)",
  };

  const polarityLabel =
    expectedPolarity === "NEGATIVE"
      ? "Sắc thái Phủ định / Đối lập (–)"
      : "Sắc thái Khẳng định / Củng cố (+)";

  return {
    expectedSlot,
    expectedPolarity,
    slotReasoningVi: `Vị trí chỗ trống đòi hỏi ${slotLabels[expectedSlot]} mang ${polarityLabel} để khớp với cấu trúc ngữ pháp quanh chỗ trống ("${ans}").`,
  };
}

/**
 * Mechanic 4: "3-Question Micro-Loop" Instant Redemption Twin Card Builder
 */
export function buildRedemptionTwinCard(
  question: SafeQuestion,
  questionNumber: number
): RedemptionTwinCard {
  const chunkInfo = extractLexicalChunkFromQuestion(question);
  const correctOpt =
    question.options.find((o) => o.id === question.correctAnswer) ||
    question.options[0];

  // Create a stripped-down, high-speed micro-prompt focusing strictly on the lexical chunk
  const blankedChunk = chunkInfo.lexicalChunk.replace(
    new RegExp(
      correctOpt.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    ),
    "_______"
  );

  const microPrompt =
    blankedChunk.includes("_______") && blankedChunk !== "_______"
      ? `Khóa Phản Xạ Cụm C1/C2: "... ${blankedChunk} ..."`
      : question.prompt;

  return {
    id: `twin-${question.id}-${Date.now()}`,
    originQuestionId: question.id,
    originQuestionNumber: questionNumber,
    triggerAfterCount: 3, // Pops up right after 3 subsequent questions!
    answeredSinceQueued: 0,
    microPrompt,
    lexicalChunkTarget: chunkInfo.lexicalChunk,
    options: question.options,
    correctAnswer: question.correctAnswer,
    correctText: correctOpt.text,
    syntacticFormula: chunkInfo.syntacticFormula,
  };
}
