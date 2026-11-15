/**
 * V-EngOlympiad Hub — Specialized C1/C2 Grading Engine
 * Implements:
 *  - normalizeText()
 *  - expandOptionalFragments() (parenthetical optional words & slash variations)
 *  - gradeQuestion() for GAPPED_TEXT, MATCHING_HEADINGS, WORD_FORMATION_PASSAGE,
 *    OPEN_CLOZE, SENTENCE_TRANSFORM, ERROR_CORRECTION, MCQ, TFNG, NOTE_COMPLETION.
 */

export type SpecializedQuestionType =
  | 'MCQ'
  | 'TFNG'
  | 'GAPPED_TEXT'
  | 'MATCHING_HEADINGS'
  | 'WORD_FORMATION'
  | 'WORD_FORMATION_PASSAGE'
  | 'OPEN_CLOZE'
  | 'SENTENCE_TRANSFORM'
  | 'ERROR_CORRECTION'
  | 'ERROR_CORRECTION_PASSAGE'
  | 'NOTE_COMPLETION';

export interface GradableQuestion {
  id?: string;
  questionNumber?: number;
  questionType: SpecializedQuestionType | string;
  stem?: string | null;
  givenWord?: string | null;
  promptPrefix?: string | null;
  promptSuffix?: string | null;
  maxWords?: number | null;
  correctAnswer: string;
  acceptedAnswers?: string[] | string | null;
  points?: number;
}

export interface ErrorCorrectionInput {
  errorWord: string;
  correction: string;
}

export interface GradeResult {
  isCorrect: boolean;
  isPartial?: boolean;
  awardedPoints: number;
  maxPoints: number;
  normalizedUserAnswer: string;
  matchedCanonicalAnswer: string | null;
  allExpandedAccepted: string[];
  diagnosticMessage: string;
}

/**
 * Normalizes student and canonical text for deterministic comparison.
 */
export function normalizeText(
  input: string | null | undefined,
  options: { preserveCase?: boolean; stripPunctuation?: boolean } = {}
): string {
  if (!input) return '';
  let text = String(input)
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .trim();

  if (options.stripPunctuation !== false) {
    // Strip leading/trailing punctuation and collapse internal punctuation spacing
    text = text.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '');
  }

  // Collapse multiple spaces into a single space
  text = text.replace(/\s+/g, ' ').trim();

  if (!options.preserveCase) {
    text = text.toLowerCase();
  }

  return text;
}

/**
 * Expands a canonical answer pattern containing:
 *  1) Optional parenthetical fragments: e.g. "had I (just) arrived (at the station)"
 *     -> ["had I just arrived at the station", "had I arrived at the station", "had I just arrived", "had I arrived"]
 *  2) Slash alternatives: e.g. "Under/In no circumstances must/should you"
 *     -> ["Under no circumstances must you", "Under no circumstances should you", "In no circumstances must you", "In no circumstances should you"]
 */
export function expandOptionalFragments(pattern: string): string[] {
  if (!pattern || !pattern.trim()) return [];

  // Step 1: Recursively expand parenthetical optional groups (...)
  const expandParentheses = (str: string): string[] => {
    const match = str.match(/\(([^()]+)\)/);
    if (!match || match.index === undefined) {
      return [str];
    }
    const before = str.slice(0, match.index);
    const inside = match[1];
    const after = str.slice(match.index + match[0].length);

    // Branch A: Include the optional content
    const withInside = expandParentheses(`${before}${inside}${after}`);
    // Branch B: Omit the optional content
    const withoutInside = expandParentheses(`${before}${after}`);

    return [...withInside, ...withoutInside];
  };

  // Step 2: Expand slash alternatives (e.g. "must/should" or "expense/cost")
  const expandSlashes = (str: string): string[] => {
    // Avoid splitting arrow separators like "->"
    const tokens = str.trim().split(/\s+/);
    let combinations: string[][] = [[]];

    for (const token of tokens) {
      if (token.includes('/') && !token.startsWith('http') && token.length > 2) {
        const cleanParts = token.split('/').map(p => p.trim()).filter(Boolean);
        if (cleanParts.length > 1) {
          const nextCombos: string[][] = [];
          for (const existing of combinations) {
            for (const part of cleanParts) {
              nextCombos.push([...existing, part]);
            }
          }
          combinations = nextCombos;
          continue;
        }
      }
      combinations = combinations.map(existing => [...existing, token]);
    }

    return combinations.map(tokensArr => tokensArr.join(' '));
  };

  const results = new Set<string>();
  const parenExpanded = expandParentheses(pattern);

  for (const variant of parenExpanded) {
    const slashExpanded = expandSlashes(variant);
    for (const finalStr of slashExpanded) {
      const cleaned = finalStr.replace(/\s+/g, ' ').trim();
      if (cleaned) {
        results.add(cleaned);
      }
    }
  }

  return Array.from(results);
}

/**
 * Helper to extract all accepted answer strings from a GradableQuestion.
 */
export function getExpandedAcceptedPool(question: GradableQuestion): string[] {
  const rawPool: string[] = [];
  if (question.correctAnswer) {
    rawPool.push(question.correctAnswer);
  }

  if (Array.isArray(question.acceptedAnswers)) {
    rawPool.push(...question.acceptedAnswers);
  } else if (typeof question.acceptedAnswers === 'string' && question.acceptedAnswers.trim()) {
    try {
      const parsed = JSON.parse(question.acceptedAnswers);
      if (Array.isArray(parsed)) rawPool.push(...parsed);
      else rawPool.push(question.acceptedAnswers);
    } catch {
      rawPool.push(question.acceptedAnswers);
    }
  }

  const expandedSet = new Set<string>();
  for (const rawPattern of rawPool) {
    // Also split on pipe "|" if multiple distinct answers are stored in a single string
    const pipeParts = String(rawPattern).split('|').map(p => p.trim()).filter(Boolean);
    for (const part of pipeParts) {
      for (const expanded of expandOptionalFragments(part)) {
        expandedSet.add(expanded);
      }
    }
  }

  return Array.from(expandedSet);
}

/**
 * Grades any specialized Vietnamese Olympiad question type.
 */
export function gradeQuestion(
  question: GradableQuestion,
  userResponse: string | ErrorCorrectionInput | null | undefined
): GradeResult {
  const maxPoints = Number(question.points ?? 1.0);
  const qType = String(question.questionType || 'MCQ').toUpperCase();
  const expandedPool = getExpandedAcceptedPool(question);

  // Handle empty response
  if (
    userResponse === null ||
    userResponse === undefined ||
    (typeof userResponse === 'string' && !userResponse.trim()) ||
    (typeof userResponse === 'object' && !userResponse.errorWord?.trim() && !userResponse.correction?.trim())
  ) {
    return {
      isCorrect: false,
      awardedPoints: 0,
      maxPoints,
      normalizedUserAnswer: '',
      matchedCanonicalAnswer: null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: 'Chưa trả lời (Unanswered).'
    };
  }

  // 1. ERROR_CORRECTION & ERROR_CORRECTION_PASSAGE (Dual input: Error Word -> Correction)
  if (qType === 'ERROR_CORRECTION' || qType === 'ERROR_CORRECTION_PASSAGE') {
    let userErr = '';
    let userCorr = '';

    if (typeof userResponse === 'object') {
      userErr = normalizeText(userResponse.errorWord);
      userCorr = normalizeText(userResponse.correction);
    } else {
      const rawStr = String(userResponse);
      const splitArrow = rawStr.split(/\s*(?:->|=>|:|\/)\s*/);
      userErr = normalizeText(splitArrow[0] || '');
      userCorr = normalizeText(splitArrow[1] || '');
    }

    const combinedDisplay = userCorr ? `${userErr} -> ${userCorr}` : userErr;

    for (const candidate of expandedPool) {
      const parts = candidate.split(/\s*(?:->|=>|:)\s*/);
      const targetErr = normalizeText(parts[0] || '');
      const targetCorr = normalizeText(parts[1] || '');

      if (targetErr && targetCorr) {
        if (userErr === targetErr && userCorr === targetCorr) {
          return {
            isCorrect: true,
            awardedPoints: maxPoints,
            maxPoints,
            normalizedUserAnswer: combinedDisplay,
            matchedCanonicalAnswer: candidate,
            allExpandedAccepted: expandedPool,
            diagnosticMessage: 'Chính xác cả từ sai (Error Word) và từ sửa (Correction)!'
          };
        }
        // Partial credit if student correctly identified the error word in the passage
        if (userErr === targetErr && userCorr !== targetCorr) {
          const half = Number((maxPoints * 0.5).toFixed(2));
          return {
            isCorrect: false,
            isPartial: true,
            awardedPoints: half,
            maxPoints,
            normalizedUserAnswer: combinedDisplay,
            matchedCanonicalAnswer: candidate,
            allExpandedAccepted: expandedPool,
            diagnosticMessage: `Xác định đúng lỗi sai ("${targetErr}") nhưng phần sửa chưa chuẩn (Đáp án sửa: "${targetCorr}"). Đạt 50% số điểm.`
          };
        }
      } else if (normalizeText(candidate) === normalizeText(combinedDisplay)) {
        return {
          isCorrect: true,
          awardedPoints: maxPoints,
          maxPoints,
          normalizedUserAnswer: combinedDisplay,
          matchedCanonicalAnswer: candidate,
          allExpandedAccepted: expandedPool,
          diagnosticMessage: 'Chính xác!'
        };
      }
    }

    return {
      isCorrect: false,
      awardedPoints: 0,
      maxPoints,
      normalizedUserAnswer: combinedDisplay,
      matchedCanonicalAnswer: null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: `Chưa chính xác. Đáp án chuẩn: ${question.correctAnswer}`
    };
  }

  const rawUserString = typeof userResponse === 'string' ? userResponse : `${userResponse.errorWord} -> ${userResponse.correction}`;
  const normUser = normalizeText(rawUserString);

  // 2. GAPPED_TEXT (Paragraph Bank A-H) & MATCHING_HEADINGS (Roman Numerals i-x) & MCQ / TFNG
  if (qType === 'GAPPED_TEXT' || qType === 'MATCHING_HEADINGS' || qType === 'MCQ' || qType === 'TFNG') {
    const matched = expandedPool.find(cand => normalizeText(cand) === normUser);
    return {
      isCorrect: Boolean(matched),
      awardedPoints: matched ? maxPoints : 0,
      maxPoints,
      normalizedUserAnswer: qType === 'MATCHING_HEADINGS' ? normUser.toLowerCase() : normUser.toUpperCase(),
      matchedCanonicalAnswer: matched || null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: matched
        ? `Chính xác (${matched})!`
        : `Chưa khớp. Đáp án đúng là "${question.correctAnswer}".`
    };
  }

  // 3. OPEN_CLOZE (Strictly ONE word)
  if (qType === 'OPEN_CLOZE') {
    const words = normUser.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return {
        isCorrect: false,
        awardedPoints: 0,
        maxPoints,
        normalizedUserAnswer: normUser,
        matchedCanonicalAnswer: null,
        allExpandedAccepted: expandedPool,
        diagnosticMessage: `Open Cloze chỉ cho phép điền ĐÚNG 1 TỪ (Bạn đã điền ${words.length} từ).`
      };
    }
    const matched = expandedPool.find(cand => normalizeText(cand) === normUser);
    return {
      isCorrect: Boolean(matched),
      awardedPoints: matched ? maxPoints : 0,
      maxPoints,
      normalizedUserAnswer: normUser,
      matchedCanonicalAnswer: matched || null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: matched ? 'Chính xác (Open Cloze)!' : `Đáp án chuẩn là "${question.correctAnswer}".`
    };
  }

  // 4. WORD_FORMATION & WORD_FORMATION_PASSAGE
  if (qType === 'WORD_FORMATION' || qType === 'WORD_FORMATION_PASSAGE') {
    const matched = expandedPool.find(cand => normalizeText(cand) === normUser);
    return {
      isCorrect: Boolean(matched),
      awardedPoints: matched ? maxPoints : 0,
      maxPoints,
      normalizedUserAnswer: normUser,
      matchedCanonicalAnswer: matched || null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: matched
        ? `Biến đổi từ loại chính xác (${normUser})!`
        : `Chưa chính xác. Từ gốc "${question.givenWord || ''}" phải biến đổi thành "${question.correctAnswer}".`
    };
  }

  // 5. NOTE_COMPLETION (Strict maxWords validator)
  if (qType === 'NOTE_COMPLETION' || qType === 'LISTENING_NOTE_COMPLETION') {
    const wordCount = normUser.split(/\s+/).filter(Boolean).length;
    if (question.maxWords && wordCount > question.maxWords) {
      return {
        isCorrect: false,
        awardedPoints: 0,
        maxPoints,
        normalizedUserAnswer: normUser,
        matchedCanonicalAnswer: null,
        allExpandedAccepted: expandedPool,
        diagnosticMessage: `Vượt quá giới hạn số từ! Đề quy định tối đa ${question.maxWords} từ (Bạn đã nhập ${wordCount} từ).`
      };
    }
    const matched = expandedPool.find(cand => normalizeText(cand) === normUser);
    return {
      isCorrect: Boolean(matched),
      awardedPoints: matched ? maxPoints : 0,
      maxPoints,
      normalizedUserAnswer: normUser,
      matchedCanonicalAnswer: matched || null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: matched ? 'Chính xác!' : `Đáp án chuẩn: "${question.correctAnswer}".`
    };
  }

  // 6. SENTENCE_TRANSFORM (Supports optional fragments, slash variations, and prefix-included or suffix-only entry)
  if (qType === 'SENTENCE_TRANSFORM' || qType === 'SENTENCE_TRANSFORMATION') {
    const normPrefix = normalizeText(question.promptPrefix || '');
    const userCandidates = [normUser];
    if (normPrefix && !normUser.startsWith(normPrefix)) {
      userCandidates.push(`${normPrefix} ${normUser}`.trim());
    }

    // Verify required keyword if specified (unless keyword is a morphological hint like DID)
    if (question.givenWord) {
      const kw = normalizeText(question.givenWord);
      const fullAttempt = userCandidates[userCandidates.length - 1];
      if (kw && !fullAttempt.includes(kw)) {
        return {
          isCorrect: false,
          awardedPoints: 0,
          maxPoints,
          normalizedUserAnswer: normUser,
          matchedCanonicalAnswer: null,
          allExpandedAccepted: expandedPool,
          diagnosticMessage: `Câu viết lại bắt buộc phải chứa từ khóa "${question.givenWord}" (không được biến đổi từ khóa).`
        };
      }
    }

    for (const candidate of expandedPool) {
      const normCand = normalizeText(candidate);
      if (userCandidates.includes(normCand)) {
        return {
          isCorrect: true,
          awardedPoints: maxPoints,
          maxPoints,
          normalizedUserAnswer: normUser,
          matchedCanonicalAnswer: candidate,
          allExpandedAccepted: expandedPool,
          diagnosticMessage: 'Cấu trúc viết lại câu C1/C2 hoàn toàn chính xác!'
        };
      }
    }

    return {
      isCorrect: false,
      awardedPoints: 0,
      maxPoints,
      normalizedUserAnswer: normUser,
      matchedCanonicalAnswer: null,
      allExpandedAccepted: expandedPool,
      diagnosticMessage: `Chưa khớp cấu trúc chuẩn: "${question.correctAnswer}"`
    };
  }

  // Default fallback comparison
  const matched = expandedPool.find(cand => normalizeText(cand) === normUser);
  return {
    isCorrect: Boolean(matched),
    awardedPoints: matched ? maxPoints : 0,
    maxPoints,
    normalizedUserAnswer: normUser,
    matchedCanonicalAnswer: matched || null,
    allExpandedAccepted: expandedPool,
    diagnosticMessage: matched ? 'Chính xác!' : `Đáp án chuẩn: "${question.correctAnswer}"`
  };
}
