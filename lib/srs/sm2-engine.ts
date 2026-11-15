/**
 * ============================================================================
 * V-EngOlympiad Hub — Anki SM-2 Spaced Repetition & Contextual Cloze Engine
 * (lib/srs/sm2-engine.ts)
 * ============================================================================
 * Implements:
 * 1. calculateSm2(current, rating) — 4-button Anki SM-2 scheduler (1: Again, 2: Hard, 3: Good, 4: Easy)
 *    updating repetitionLevel, easeFactor (floor at 1.3), and nextReviewDate.
 * 2. previewAllButtonIntervals(card) — returns human-readable Vietnamese interval previews
 *    ('10 phút', '1 ngày', '3 ngày', etc.) for all 4 rating buttons.
 * 3. buildContextualCloze(term, exampleSentence) — masks the target C1/C2 lexical item in the
 *    example sentence while preserving short prepositions ('to', 'of', 'on', 'with', etc.)
 *    and first/last letter hints for active recall practice.
 */

export type Sm2Rating = 1 | 2 | 3 | 4;

export interface Sm2CardState {
  repetitionLevel?: number;
  srsStage?: number;
  easeFactor?: number;
  intervalDays?: number;
  nextReviewDate?: Date | string | null;
}

export interface Sm2CalculationResult {
  repetitionLevel: number;
  easeFactor: number;
  intervalDays: number;
  intervalMinutes: number;
  nextReviewDate: Date;
  humanIntervalVi: string;
}

export interface ButtonIntervalPreviews {
  1: string;
  2: string;
  3: string;
  4: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
}

export interface ContextualClozeResult {
  maskedSentence: string;
  beforeMask: string;
  maskHint: string;
  afterMask: string;
  targetTerm: string;
  preservedTokens: string[];
}

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

const PRESERVED_SHORT_PREPOSITIONS = new Set([
  'to',
  'of',
  'on',
  'with',
  'in',
  'at',
  'by',
  'for',
  'from',
  'into',
  'out',
  'up',
  'off',
  'over',
  'under',
  'as',
  'a',
  'an',
  'the',
  'one',
  "one's",
  'someone',
  'something'
]);

/**
 * Formats an interval in minutes/days into human-readable Vietnamese ('10 phút', '1 ngày', '3 ngày', '2.5 tháng', etc.).
 */
export function formatIntervalVi(intervalMinutes: number, intervalDays: number): string {
  if (intervalDays <= 0 || intervalMinutes < 1440) {
    const mins = Math.max(1, Math.round(intervalMinutes || 10));
    if (mins < 60) return `${mins} phút`;
    const hours = Math.round(mins / 60);
    return `${hours} giờ`;
  }
  if (intervalDays === 1) return '1 ngày';
  if (intervalDays < 30) return `${intervalDays} ngày`;
  if (intervalDays < 365) {
    const months = Number((intervalDays / 30).toFixed(1).replace(/\.0$/, ''));
    return `${months} tháng`;
  }
  const years = Number((intervalDays / 365).toFixed(1).replace(/\.0$/, ''));
  return `${years} năm`;
}

/**
 * Core Anki SM-2 algorithm supporting 4 ratings:
 * - 1 (Again / Quên): resets repetitionLevel to 0, reduces easeFactor by 0.20 (min 1.3), schedules in 10 minutes.
 * - 2 (Hard / Khó): keeps or slightly advances repetitionLevel, reduces easeFactor by 0.15 (min 1.3),
 *   multiplies interval by 1.2x (minimum 1 day).
 * - 3 (Good / Nhớ tốt): increments repetitionLevel (+1), keeps easeFactor steady (or minor SM-2 adjustment),
 *   progresses 1 day -> 3 days -> round(prevInterval * easeFactor).
 * - 4 (Easy / Dễ): increments repetitionLevel (+1), increases easeFactor by +0.15,
 *   progresses 4 days -> 7 days -> round(prevInterval * easeFactor * 1.3).
 */
export function calculateSm2(
  current: Sm2CardState = {},
  rating: Sm2Rating,
  referenceNow: Date = new Date()
): Sm2CalculationResult {
  const prevRep = Math.max(
    0,
    Number(
      current.repetitionLevel !== undefined
        ? current.repetitionLevel
        : current.srsStage !== undefined
        ? Math.max(0, Number(current.srsStage) - 1)
        : 0
    )
  );
  const prevEase = Math.max(
    MIN_EASE_FACTOR,
    Number(current.easeFactor !== undefined ? current.easeFactor : DEFAULT_EASE_FACTOR)
  );

  // Estimate previous interval in days from either intervalDays or repetitionLevel
  let prevIntervalDays = Number(current.intervalDays || 0);
  if (prevIntervalDays <= 0) {
    if (prevRep === 0) prevIntervalDays = 0;
    else if (prevRep === 1) prevIntervalDays = 1;
    else if (prevRep === 2) prevIntervalDays = 3;
    else prevIntervalDays = Math.round(3 * Math.pow(prevEase, prevRep - 2));
  }

  let repetitionLevel = prevRep;
  let easeFactor = prevEase;
  let intervalDays = 0;
  let intervalMinutes = 10;

  if (rating === 1) {
    // 1: Again (Lapse / Relearning step: 10 minutes)
    repetitionLevel = 0;
    easeFactor = Math.max(MIN_EASE_FACTOR, Number((prevEase - 0.2).toFixed(2)));
    intervalDays = 0;
    intervalMinutes = 10;
  } else if (rating === 2) {
    // 2: Hard
    easeFactor = Math.max(MIN_EASE_FACTOR, Number((prevEase - 0.15).toFixed(2)));
    if (prevRep <= 0) {
      repetitionLevel = 1;
      intervalDays = 1;
    } else if (prevRep === 1) {
      repetitionLevel = 1;
      intervalDays = 2;
    } else {
      repetitionLevel = prevRep + 1;
      intervalDays = Math.max(prevIntervalDays + 1, Math.round(prevIntervalDays * 1.2));
    }
    intervalMinutes = intervalDays * 1440;
  } else if (rating === 3) {
    // 3: Good
    repetitionLevel = prevRep + 1;
    easeFactor = Math.max(MIN_EASE_FACTOR, Number(prevEase.toFixed(2)));
    if (prevRep === 0) {
      intervalDays = 1;
    } else if (prevRep === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(prevIntervalDays + 1, Math.round(prevIntervalDays * easeFactor));
    }
    intervalMinutes = intervalDays * 1440;
  } else {
    // 4: Easy
    repetitionLevel = prevRep + 1;
    easeFactor = Math.max(MIN_EASE_FACTOR, Number((prevEase + 0.15).toFixed(2)));
    if (prevRep === 0) {
      intervalDays = 4;
    } else if (prevRep === 1) {
      intervalDays = 7;
    } else {
      intervalDays = Math.max(
        prevIntervalDays + 2,
        Math.round(prevIntervalDays * easeFactor * 1.3)
      );
    }
    intervalMinutes = intervalDays * 1440;
  }

  const nextReviewDate = new Date(referenceNow.getTime() + intervalMinutes * 60 * 1000);
  const humanIntervalVi = formatIntervalVi(intervalMinutes, intervalDays);

  return {
    repetitionLevel,
    easeFactor,
    intervalDays,
    intervalMinutes,
    nextReviewDate,
    humanIntervalVi
  };
}

/**
 * Returns human-readable Vietnamese interval previews ('10 phút', '1 ngày', '3 ngày', etc.)
 * for all 4 Anki rating buttons (1: Again, 2: Hard, 3: Good, 4: Easy).
 */
export function previewAllButtonIntervals(
  card: Sm2CardState = {},
  referenceNow: Date = new Date()
): ButtonIntervalPreviews {
  const r1 = calculateSm2(card, 1, referenceNow).humanIntervalVi;
  const r2 = calculateSm2(card, 2, referenceNow).humanIntervalVi;
  const r3 = calculateSm2(card, 3, referenceNow).humanIntervalVi;
  const r4 = calculateSm2(card, 4, referenceNow).humanIntervalVi;

  return {
    1: r1,
    2: r2,
    3: r3,
    4: r4,
    again: r1,
    hard: r2,
    good: r3,
    easy: r4
  };
}

/**
 * Masks a single word using first/last letter hints while preserving short prepositions
 * ('to', 'of', 'on', 'with', etc.).
 */
function maskTokenWithFirstLastHint(token: string): { masked: string; preserved: boolean } {
  // Strip leading/trailing punctuation while keeping it around the token
  const match = token.match(/^([^a-zA-Z0-9']*)([a-zA-Z0-9'-]+)([^a-zA-Z0-9']*)$/);
  if (!match) {
    return { masked: token, preserved: true };
  }

  const [, prefix, core, suffix] = match;
  const lower = core.toLowerCase();

  if (PRESERVED_SHORT_PREPOSITIONS.has(lower)) {
    return { masked: token, preserved: true };
  }

  if (core.length <= 2) {
    return { masked: `${prefix}${core[0]}_${suffix}`, preserved: false };
  }

  const firstChar = core[0];
  const lastChar = core[core.length - 1];
  const middleUnderscores = Array(Math.max(2, core.length - 2))
    .fill('_')
    .join('');

  return {
    masked: `${prefix}${firstChar}${middleUnderscores}${lastChar}${suffix}`,
    preserved: false
  };
}

/**
 * Builds an active-recall Cloze mask for a C1/C2 lexical item inside its example sentence.
 * - Preserves short prepositions ('to', 'of', 'on', 'with', 'in', 'for', 'from', 'by')
 * - Displays first/last letter hints for lexical content words (e.g. "make no b___s about" or "p_______t to")
 */
export function buildContextualCloze(
  term: string,
  exampleSentence?: string | null
): ContextualClozeResult {
  const cleanTerm = String(term || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\.{2,}|…/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const fallbackSentence =
    exampleSentence && exampleSentence.trim().length > 0
      ? exampleSentence.trim()
      : `In high-level academic discourse, candidates frequently employ "${cleanTerm}" to convey nuanced C1/C2 register.`;

  const tokens = cleanTerm.split(/\s+/).filter(Boolean);
  const preservedTokens: string[] = [];
  const maskedParts = tokens.map(tok => {
    const res = maskTokenWithFirstLastHint(tok);
    if (res.preserved) preservedTokens.push(tok);
    return res.masked;
  });

  const maskHint = maskedParts.join(' ');

  // Locate the term (or its main content words) in the example sentence case-insensitively
  const escapedTerm = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactRegex = new RegExp(escapedTerm, 'i');
  const exactMatch = fallbackSentence.match(exactRegex);

  if (exactMatch && exactMatch.index !== undefined) {
    const startIdx = exactMatch.index;
    const matchedText = exactMatch[0];
    const beforeMask = fallbackSentence.slice(0, startIdx);
    const afterMask = fallbackSentence.slice(startIdx + matchedText.length);

    // Mask the actual matched substring word-by-word so inflected forms also keep prepositions & hints
    const matchedWords = matchedText.split(/\s+/);
    const dynamicHint = matchedWords
      .map(w => maskTokenWithFirstLastHint(w).masked)
      .join(' ');

    return {
      maskedSentence: `${beforeMask}[ ${dynamicHint} ]${afterMask}`,
      beforeMask,
      maskHint: dynamicHint,
      afterMask,
      targetTerm: cleanTerm,
      preservedTokens
    };
  }

  // Fallback: try matching the longest content word of the term in the sentence (e.g. inflected verb/noun)
  const contentWords = tokens
    .filter(w => !PRESERVED_SHORT_PREPOSITIONS.has(w.toLowerCase()) && w.length >= 4)
    .sort((a, b) => b.length - a.length);

  for (const cw of contentWords) {
    const stemRoot = cw.slice(0, Math.max(4, cw.length - 2)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stemRegex = new RegExp(`\\b${stemRoot}[a-zA-Z]*\\b`, 'i');
    const m = fallbackSentence.match(stemRegex);
    if (m && m.index !== undefined) {
      const beforeMask = fallbackSentence.slice(0, m.index);
      const afterMask = fallbackSentence.slice(m.index + m[0].length);
      return {
        maskedSentence: `${beforeMask}[ ${maskHint} ]${afterMask}`,
        beforeMask,
        maskHint,
        afterMask,
        targetTerm: cleanTerm,
        preservedTokens
      };
    }
  }

  return {
    maskedSentence: `${fallbackSentence} — Target Cloze: [ ${maskHint} ]`,
    beforeMask: `${fallbackSentence} (Target: `,
    maskHint,
    afterMask: ')',
    targetTerm: cleanTerm,
    preservedTokens
  };
}
