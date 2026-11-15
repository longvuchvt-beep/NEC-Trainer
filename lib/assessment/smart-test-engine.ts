/**
 * ============================================================================
 * V-EngOlympiad Hub — Next-Gen Diagnostic Assessment & Smart Test Engine
 * (lib/assessment/smart-test-engine.ts)
 * ============================================================================
 * Powers the 5 Next-Gen Assessment Modes & Cross-Province Fingerprinting:
 * 1. Question Fingerprinting & Cross-Exam Frequency Tracker (computeQuestionFingerprint)
 * 2. Mode 1: Custom Exam Matrix Builder (buildCustomMatrixExam)
 * 3. Mode 2: Confidence-Betting Grading (CERTAIN / FIFTY_FIFTY / GUESS -> Solid Mastery, Lucky Guess, Critical Trap)
 * 4. Mode 3: 3-Try Progressive Coaching (100% -> 70% Morphological Hint -> 40% Letter-Skeleton Hint)
 * 5. Mode 4: Partial Credit (0.5x) & Word-by-Word Visual Diff (computeWordByWordDiff)
 * 6. Mode 5: Mistake Clinic & Spaced Redemption Boss Fight with Option Shuffling (shuffleQuestionOptionsForRedemption)
 */

export type ConfidenceLevel = 'CERTAIN' | 'FIFTY_FIFTY' | 'GUESS';

export type DiagnosticOutcome =
  | 'SOLID_MASTERY'   // Correct + CERTAIN
  | 'LUCKY_GUESS'     // Correct + (FIFTY_FIFTY | GUESS) -> Auto-reveal explanation & add to Mistake Clinic
  | 'CRITICAL_TRAP'   // Wrong + CERTAIN -> Blindspot / Exam Trap
  | 'PARTIAL_MASTERY' // Partial (0.5x) on Sentence Transform / Error Correction
  | 'KNOWLEDGE_GAP';  // Wrong + (FIFTY_FIFTY | GUESS)

export interface WordDiffToken {
  text: string;
  status: 'matched' | 'missing' | 'extra';
}

export interface ProgressiveCoachingState {
  attemptNumber: 1 | 2 | 3;
  scoreMultiplier: 1.0 | 0.7 | 0.4;
  morphologicalHintVi?: string;
  letterSkeletonHint?: string;
  unlockedExplanation: boolean;
}

export interface SmartEvaluationResult {
  isCorrect: boolean;
  isPartial: boolean;
  basePoints: number;
  confidence: ConfidenceLevel;
  attemptNumber: number;
  scoreMultiplier: number;
  awardedPoints: number;
  diagnosticOutcome: DiagnosticOutcome;
  diagnosticLabelVi: string;
  diagnosticBadgeColor: string;
  shouldScheduleRedemption: boolean;
  shouldAutoRevealExplanation: boolean;
  wordDiff: WordDiffToken[];
  coachingHintVi?: string;
  letterSkeleton?: string;
}

export interface MatrixBuilderConfig {
  durationMinutes: 15 | 45 | 90 | 180;
  tournaments: string[];        // ['HSGQG', 'DHBB', 'TRAI_HE_HUNG_VUONG', 'OLYMPIC_30_4', 'CHON_DOI_TUYEN', 'HSG_TINH']
  provincesOrSchools: string[]; // ['ALL'] or specific provinces/schools
  regions?: string[];           // ['ALL', 'North', 'Central', 'South']
  counts: {
    mcqGrammar: number;
    wordFormation: number;
    readingCloze: number;
    sentenceTransform: number;
  };
  smartFilter: 'ALL' | 'UNSEEN_ONLY' | 'HIGH_FREQUENCY' | 'WEAK_GRAMMAR_TAGS';
  seenQuestionIds?: string[];
  weakTags?: string[];
}

/**
 * Normalizes text for fingerprinting and token comparison.
 */
export function normalizeAssessmentText(input: string = ''): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/^[.,!?;:\-\s]+|[.,!?;:\-\s]+$/g, '')
    .trim();
}

/**
 * Computes a deterministic FNV-1a hex fingerprint hash for any Question or QuestionGroup passage
 * so identical or near-identical questions across 63 provinces are automatically linked.
 */
export function computeQuestionFingerprint(item: {
  stem?: string | null;
  passage?: string | null;
  givenWord?: string | null;
  rootWord?: string | null;
  keyword?: string | null;
  answer?: string | null;
  correctAnswer?: string | null;
}): string {
  const coreStem = normalizeAssessmentText(item.stem || item.passage || '')
    .replace(/_{2,}|\.\.\.|\[\[\d+\]\]|\{\{\d+\}\}/g, '#GAP#')
    .replace(/[^a-z0-9#']/g, '');
  const cue = normalizeAssessmentText(
    item.givenWord || item.rootWord || item.keyword || item.answer || item.correctAnswer || ''
  ).replace(/[^a-z0-9]/g, '');

  const combined = `${coreStem.slice(0, 180)}::${cue}`;
  let hash = 2166136261;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fp-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

/**
 * Mode 2: Confidence-Betting Diagnostic Classifier.
 * - Correct + CERTAIN -> SOLID_MASTERY
 * - Correct + FIFTY_FIFTY / GUESS -> LUCKY_GUESS (Flags as ⚠️ Lucky Guess, reveals explanation, adds to Mistake Clinic)
 * - Wrong + CERTAIN -> CRITICAL_TRAP (Flags as 🚨 Critical Trap / Blindspot)
 * - Wrong + FIFTY_FIFTY / GUESS -> KNOWLEDGE_GAP
 */
export function classifyConfidenceOutcome(
  isCorrect: boolean,
  isPartial: boolean,
  confidence: ConfidenceLevel = 'CERTAIN'
): {
  outcome: DiagnosticOutcome;
  labelVi: string;
  badgeColor: string;
  shouldScheduleRedemption: boolean;
  shouldAutoRevealExplanation: boolean;
} {
  if (isCorrect) {
    if (confidence === 'CERTAIN') {
      return {
        outcome: 'SOLID_MASTERY',
        labelVi: '✅ Solid Mastery (Vững kiến thức 100%)',
        badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
        shouldScheduleRedemption: false,
        shouldAutoRevealExplanation: false
      };
    }
    return {
      outcome: 'LUCKY_GUESS',
      labelVi:
        confidence === 'GUESS'
          ? '⚠️ Lucky Guess (Đoán mò ăn may — Cần học lại bản chất!)'
          : '⚠️ Lucky Guess (Phân vân 50/50 — Đưa vào Phòng Phục Thù)',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50',
      shouldScheduleRedemption: true,
      shouldAutoRevealExplanation: true
    };
  }

  if (isPartial) {
    return {
      outcome: 'PARTIAL_MASTERY',
      labelVi: '🌓 Partial Credit (Đúng 50% cấu trúc — Xem Visual Diff để hoàn thiện)',
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/40',
      shouldScheduleRedemption: true,
      shouldAutoRevealExplanation: true
    };
  }

  if (confidence === 'CERTAIN') {
    return {
      outcome: 'CRITICAL_TRAP',
      labelVi: '🚨 Critical Trap / Blindspot (Sập bẫy đề thi dù tự tin 100%!)',
      badgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/50',
      shouldScheduleRedemption: true,
      shouldAutoRevealExplanation: true
    };
  }

  return {
    outcome: 'KNOWLEDGE_GAP',
    labelVi: '❌ Knowledge Gap (Lỗ hổng kiến thức — Đã thêm vào Mistake Clinic)',
    badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    shouldScheduleRedemption: true,
    shouldAutoRevealExplanation: true
  };
}

/**
 * Builds a letter-skeleton hint for Attempt 3 in 3-Try Progressive Coaching
 * (e.g., "unprecedented" -> "u _ p _ e _ e _ e _ t _ d").
 */
export function buildLetterSkeleton(answer: string): string {
  const clean = String(answer || '').trim();
  if (!clean) return '_ _ _ _ _';

  return clean
    .split(/\s+/)
    .map(word => {
      if (word.length <= 2) return `${word[0]} _`;
      return word
        .split('')
        .map((ch, idx) => {
          if (!/[a-zA-Z]/.test(ch)) return ch;
          if (idx === 0 || idx === word.length - 1 || idx % 2 === 0) {
            return ch.toLowerCase();
          }
          return '_';
        })
        .join(' ');
    })
    .join('   ');
}

/**
 * Mode 3: 3-Try Progressive Coaching Hint Generator.
 * - Attempt 1 (100% pts): Standard submission.
 * - Attempt 2 (70% pts): Automated Morphological / Structural Hint (no answer key leaked!).
 * - Attempt 3 (40% pts): Letter-skeleton hint (e.g., u _ p _ e _ e _ e _ t _ d).
 */
export function generateProgressiveCoachingHint(
  question: {
    type?: string;
    questionType?: string;
    answer?: string;
    correctAnswer?: string;
    rootWord?: string | null;
    givenWord?: string | null;
    keyword?: string | null;
    explanation?: { rule?: string; vi?: string } | null;
  },
  attemptNumber: 1 | 2 | 3
): ProgressiveCoachingState {
  const targetAns = String(question.answer || question.correctAnswer || '').trim();
  const qType = String(question.type || question.questionType || '').toLowerCase();
  const rootCue = question.rootWord || question.givenWord || question.keyword || '';
  const cleanWord = targetAns.replace(/[^a-zA-Z\s-]/g, '').trim();
  const charCount = cleanWord.replace(/\s+/g, '').length;
  const firstLetter = cleanWord[0] ? cleanWord[0].toUpperCase() : 'A';

  // Infer morphological class from suffix/structure
  let morphCategoryVi = 'từ vựng / cấu trúc học thuật C1–C2';
  const lower = cleanWord.toLowerCase();
  if (lower.endsWith('ly')) {
    morphCategoryVi = 'TRẠNG TỪ (Adverb -ly)';
  } else if (/(tion|sion|ment|ness|ity|ance|ence|ism|ist|ship)$/.test(lower)) {
    morphCategoryVi = 'DANH TỪ TRỪU TƯỢNG (Abstract Noun)';
  } else if (/(ous|ive|al|ic|able|ible|less|ful|ant|ent|ed|ing)$/.test(lower)) {
    morphCategoryVi = 'TÍNH TỪ (Adjective / Participle)';
  } else if (/^(un|in|im|ir|il|dis|non|mis|mal|counter|de)/.test(lower)) {
    morphCategoryVi = 'TỪ MANG TIỀN TỐ PHỦ ĐỊNH / ĐỐI NGHỊCH (Negative/Counter Prefix)';
  }

  const hasNegPrefix = /^(un|in|im|ir|il|dis|non|mis)/.test(lower);
  const prefixNote = hasNegPrefix
    ? ' mang tiền tố phủ định (un-/in-/im-/ir-/dis-),'
    : '';

  let morphologicalHintVi = '';
  if (qType.includes('word_formation') || rootCue) {
    morphologicalHintVi = `💡 Gợi ý Bước 2 (Mức điểm 70%): Từ gốc "${rootCue || 'ROOT'}" cần biến đổi thành một ${morphCategoryVi}${prefixNote} gồm ${charCount} chữ cái, bắt đầu bằng chữ '${firstLetter}'.`;
  } else if (qType.includes('sentence_transform') || qType.includes('rewrite')) {
    const wordTotal = cleanWord.split(/\s+/).filter(Boolean).length;
    morphologicalHintVi = `💡 Gợi ý Bước 2 (Mức điểm 70%): Câu viết lại gồm khoảng ${wordTotal} từ, áp dụng chủ điểm "${
      question.explanation?.rule || 'Đảo ngữ / Thành ngữ C1–C2'
    }", bắt đầu bằng "${cleanWord.split(/\s+/).slice(0, 2).join(' ')}...".`;
  } else if (qType.includes('error')) {
    morphologicalHintVi = `💡 Gợi ý Bước 2 (Mức điểm 70%): Lỗi sai nằm ở sự hòa hợp ngữ pháp / hình thái từ (Chủ điểm: ${
      question.explanation?.rule || 'Confusable Lexical Pair / Agreement'
    }). Đáp án chuẩn bắt đầu bằng '${firstLetter}' (${charCount} chữ cái).`;
  } else {
    morphologicalHintVi = `💡 Gợi ý Bước 2 (Mức điểm 70%): Chỗ trống cần một ${morphCategoryVi}${prefixNote} gồm ${charCount} chữ cái, bắt đầu bằng '${firstLetter}'.`;
  }

  const letterSkeletonHint = buildLetterSkeleton(targetAns);

  return {
    attemptNumber,
    scoreMultiplier: attemptNumber === 1 ? 1.0 : attemptNumber === 2 ? 0.7 : 0.4,
    morphologicalHintVi: attemptNumber >= 2 ? morphologicalHintVi : undefined,
    letterSkeletonHint: attemptNumber >= 3 ? letterSkeletonHint : undefined,
    unlockedExplanation: attemptNumber >= 3
  };
}

/**
 * Mode 4: Word-by-Word Visual Diff Generator for Sentence Transformation & Error Correction.
 * Compares user tokens against target answer tokens and tags each as:
 * - 'matched' (emerald green)
 * - 'missing' (amber/indigo — required word missed by student)
 * - 'extra' (rose red strikethrough — wrong/extraneous word typed by student)
 */
export function computeWordByWordDiff(
  userAnswer: string = '',
  targetAnswer: string = ''
): WordDiffToken[] {
  const userTokens = String(userAnswer || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const targetTokens = String(targetAnswer || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (userTokens.length === 0) {
    return targetTokens.map(t => ({ text: t, status: 'missing' }));
  }

  const normUser = userTokens.map(t => normalizeAssessmentText(t));
  const normTarget = targetTokens.map(t => normalizeAssessmentText(t));

  // LCS (Longest Common Subsequence) table for accurate word-level diff
  const m = normUser.length;
  const n = normTarget.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normUser[i - 1] === normTarget[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diff: WordDiffToken[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normUser[i - 1] === normTarget[j - 1]) {
      diff.unshift({ text: targetTokens[j - 1], status: 'matched' });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ text: targetTokens[j - 1], status: 'missing' });
      j--;
    } else if (i > 0) {
      diff.unshift({ text: userTokens[i - 1], status: 'extra' });
      i--;
    }
  }

  return diff;
}

/**
 * Evaluates a question response with:
 * - 3-Try Progressive Coaching multipliers (1.0x / 0.7x / 0.4x)
 * - Partial Credit (0.5x) for Sentence Transformation & Error Correction when >= 50% of structure matches
 * - Word-by-Word Visual Diff
 * - Confidence-Betting Diagnostic Classification (Solid Mastery, Lucky Guess, Critical Trap, Knowledge Gap)
 */
export function evaluateSmartSubmission(
  question: any,
  userAnswer: string = '',
  confidence: ConfidenceLevel = 'CERTAIN',
  attemptNumber: 1 | 2 | 3 = 1
): SmartEvaluationResult {
  const basePoints = Number(question.points) || 1;
  const rawTarget = String(question.answer || question.correctAnswer || '').trim();
  const acceptedList: string[] =
    Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0
      ? question.acceptedAnswers
      : [rawTarget];

  const normUser = normalizeAssessmentText(userAnswer);
  const qType = String(question.type || question.questionType || '').toLowerCase();

  let isCorrect = false;
  if (normUser) {
    if (qType === 'mcq' || qType === 'tfng' || qType === 'gapped_text') {
      isCorrect = normUser.toUpperCase() === rawTarget.toUpperCase();
    } else {
      isCorrect = acceptedList.some(ans => normalizeAssessmentText(ans) === normUser);
    }
  }

  // Compute word-by-word visual diff against the closest accepted answer
  const wordDiff = computeWordByWordDiff(userAnswer, rawTarget);

  // Check Partial Credit (0.5x) for Sentence Transformation & Error Correction
  let isPartial = false;
  if (
    !isCorrect &&
    normUser.length > 0 &&
    (qType.includes('sentence_transform') ||
      qType.includes('rewrite') ||
      qType.includes('error'))
  ) {
    const matchedCount = wordDiff.filter(d => d.status === 'matched').length;
    const targetWordCount = rawTarget.split(/\s+/).filter(Boolean).length;
    if (targetWordCount > 0 && matchedCount / targetWordCount >= 0.5) {
      isPartial = true;
    } else if (rawTarget.includes('->') && userAnswer.includes('->')) {
      const [uErr] = userAnswer.split('->').map(s => normalizeAssessmentText(s));
      const [tErr] = rawTarget.split('->').map(s => normalizeAssessmentText(s));
      if (uErr && uErr === tErr) isPartial = true;
    }
  }

  const coaching = generateProgressiveCoachingHint(question, attemptNumber);
  const scoreMultiplier = coaching.scoreMultiplier;

  let awardedPoints = 0;
  if (isCorrect) {
    awardedPoints = Number((basePoints * scoreMultiplier).toFixed(2));
  } else if (isPartial) {
    awardedPoints = Number((basePoints * 0.5 * scoreMultiplier).toFixed(2));
  }

  const diag = classifyConfidenceOutcome(isCorrect, isPartial, confidence);

  return {
    isCorrect,
    isPartial,
    basePoints,
    confidence,
    attemptNumber,
    scoreMultiplier,
    awardedPoints,
    diagnosticOutcome: diag.outcome,
    diagnosticLabelVi: diag.labelVi,
    diagnosticBadgeColor: diag.badgeColor,
    shouldScheduleRedemption: diag.shouldScheduleRedemption,
    shouldAutoRevealExplanation: diag.shouldAutoRevealExplanation,
    wordDiff,
    coachingHintVi: coaching.morphologicalHintVi,
    letterSkeleton: coaching.letterSkeletonHint
  };
}

/**
 * Mode 5: Shuffles MCQ option order (A, B, C, D) and remaps the correct answer letter + optionBreakdown
 * for the Mistake Clinic "Redemption Boss Fight" so students cannot rely on memorized option letters.
 */
export function shuffleQuestionOptionsForRedemption(question: any): any {
  const options = Array.isArray(question.options) ? [...question.options] : [];
  if (options.length < 2) {
    return { ...question, isRedemptionShuffled: true };
  }

  const originalAnswerId = String(question.answer || question.correctAnswer || 'A')
    .trim()
    .toUpperCase();
  const originalCorrectOption =
    options.find(o => String(o.id).toUpperCase() === originalAnswerId) || options[0];

  // Deterministic or Fisher-Yates shuffle that guarantees at least one position shift
  const shuffledContents = options.map(o => ({
    originalId: String(o.id).toUpperCase(),
    text: o.text
  }));

  for (let i = shuffledContents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffledContents[i];
    shuffledContents[i] = shuffledContents[j];
    shuffledContents[j] = tmp;
  }

  // Ensure the correct answer moved to a different letter if possible
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, shuffledContents.length);
  if (
    shuffledContents.length > 1 &&
    shuffledContents[0].originalId === originalAnswerId &&
    letters[0] === originalAnswerId
  ) {
    const swap = shuffledContents[0];
    shuffledContents[0] = shuffledContents[1];
    shuffledContents[1] = swap;
  }

  let newAnswerLetter = originalAnswerId;
  const newOptionAnalysis: Record<string, string> = {};
  const oldAnalysis = question.explanation?.optionAnalysis || question.explanation?.optionBreakdown || {};

  const remappedOptions = shuffledContents.map((item, idx) => {
    const newId = letters[idx] || String.fromCharCode(65 + idx);
    if (item.text === originalCorrectOption.text) {
      newAnswerLetter = newId;
    }
    if (oldAnalysis && oldAnalysis[item.originalId]) {
      newOptionAnalysis[newId] = oldAnalysis[item.originalId];
    }
    return {
      id: newId,
      text: item.text,
      originalOptionId: item.originalId
    };
  });

  return {
    ...question,
    isRedemptionShuffled: true,
    originalAnswerBeforeShuffle: originalAnswerId,
    answer: newAnswerLetter,
    correctAnswer: newAnswerLetter,
    options: remappedOptions,
    explanation: question.explanation
      ? {
          ...question.explanation,
          optionAnalysis:
            Object.keys(newOptionAnalysis).length > 0
              ? newOptionAnalysis
              : question.explanation.optionAnalysis
        }
      : question.explanation
  };
}
