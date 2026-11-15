/**
 * CommonJS Runtime Mirror of lib/srs/sm2-engine.ts for Express server.js
 */

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

const PRESERVED_SHORT_PREPOSITIONS = new Set([
  'to', 'of', 'on', 'with', 'in', 'at', 'by', 'for', 'from', 'into',
  'out', 'up', 'off', 'over', 'under', 'as', 'a', 'an', 'the',
  'one', "one's", 'someone', 'something'
]);

function formatIntervalVi(intervalMinutes, intervalDays) {
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

function calculateSm2(current = {}, rating = 3, referenceNow = new Date()) {
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

  const numRating = Number(rating);

  if (numRating === 1) {
    repetitionLevel = 0;
    easeFactor = Math.max(MIN_EASE_FACTOR, Number((prevEase - 0.2).toFixed(2)));
    intervalDays = 0;
    intervalMinutes = 10;
  } else if (numRating === 2) {
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
  } else if (numRating === 3) {
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

function previewAllButtonIntervals(card = {}, referenceNow = new Date()) {
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

function maskTokenWithFirstLastHint(token) {
  const match = String(token).match(/^([^a-zA-Z0-9']*)([a-zA-Z0-9'-]+)([^a-zA-Z0-9']*)$/);
  if (!match) return { masked: token, preserved: true };
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
  const middleUnderscores = Array(Math.max(2, core.length - 2)).fill('_').join('');
  return {
    masked: `${prefix}${firstChar}${middleUnderscores}${lastChar}${suffix}`,
    preserved: false
  };
}

function buildContextualCloze(term, exampleSentence) {
  const cleanTerm = String(term || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\.{2,}|…/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const fallbackSentence =
    exampleSentence && String(exampleSentence).trim().length > 0
      ? String(exampleSentence).trim()
      : `In high-level academic discourse, candidates frequently employ "${cleanTerm}" to convey nuanced C1/C2 register.`;

  const tokens = cleanTerm.split(/\s+/).filter(Boolean);
  const preservedTokens = [];
  const maskedParts = tokens.map(tok => {
    const res = maskTokenWithFirstLastHint(tok);
    if (res.preserved) preservedTokens.push(tok);
    return res.masked;
  });

  const maskHint = maskedParts.join(' ');
  const escapedTerm = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactRegex = new RegExp(escapedTerm, 'i');
  const exactMatch = fallbackSentence.match(exactRegex);

  if (exactMatch && exactMatch.index !== undefined) {
    const startIdx = exactMatch.index;
    const matchedText = exactMatch[0];
    const beforeMask = fallbackSentence.slice(0, startIdx);
    const afterMask = fallbackSentence.slice(startIdx + matchedText.length);
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

  return {
    maskedSentence: `${fallbackSentence} — Target Cloze: [ ${maskHint} ]`,
    beforeMask: `${fallbackSentence} (Target: `,
    maskHint,
    afterMask: ')',
    targetTerm: cleanTerm,
    preservedTokens
  };
}

module.exports = {
  calculateSm2,
  previewAllButtonIntervals,
  buildContextualCloze,
  formatIntervalVi
};
