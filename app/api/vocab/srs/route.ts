import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  calculateSm2,
  previewAllButtonIntervals,
  buildContextualCloze,
  Sm2Rating
} from '../../../../lib/srs/sm2-engine';

const prisma = new PrismaClient();

/**
 * Helper to derive Word Family derivatives when a card does not yet have explicit derivatives stored.
 */
function buildWordFamilyDerivatives(
  term: string,
  category: string,
  wordFamilyJson?: string | null
): Array<{ pos: string; form: string; note?: string }> {
  if (wordFamilyJson) {
    try {
      const parsed = JSON.parse(wordFamilyJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback below
    }
  }

  const clean = String(term || '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim();

  // Built-in academic C1/C2 word family lookup for common competition roots
  const lower = clean.toLowerCase();
  if (lower.includes('equivocal') || lower.includes('unequivocal')) {
    return [
      { pos: 'ADJ', form: 'unequivocal / equivocal', note: 'unambiguous vs. deliberately vague' },
      { pos: 'ADV', form: 'unequivocally', note: 'in a way that leaves no doubt' },
      { pos: 'VERB', form: 'equivocate', note: 'use ambiguous language to conceal the truth' },
      { pos: 'NOUN', form: 'equivocation', note: 'prevarication / ambiguity' }
    ];
  }
  if (lower.includes('chronicle') || lower.includes('anachronism')) {
    return [
      { pos: 'NOUN', form: 'anachronism', note: 'something out of its proper chronological era' },
      { pos: 'ADJ', form: 'anachronistic / chronic', note: 'outdated / persistent' },
      { pos: 'ADV', form: 'anachronistically', note: 'in a chronologically misplaced manner' }
    ];
  }
  if (lower.includes('commensurate')) {
    return [
      { pos: 'ADJ', form: 'commensurate (with)', note: 'corresponding in size or degree; in proportion' },
      { pos: 'ADJ (Neg)', form: 'incommensurate / incommensurable', note: 'disproportionate / not comparable' },
      { pos: 'ADV', form: 'commensurately', note: 'proportionately' }
    ];
  }
  if (lower.includes('precedent') || lower.includes('unprecedented')) {
    return [
      { pos: 'NOUN', form: 'precedent / precedence', note: 'prior example / priority in importance' },
      { pos: 'ADJ', form: 'unprecedented / precedented', note: 'never done or known before' },
      { pos: 'VERB', form: 'precede', note: 'come before in time or order' }
    ];
  }

  if (clean.includes(' ')) {
    // Idiom / Collocation / Phrasal Verb derivatives & register notes
    const headWord = clean.split(/\s+/).sort((a, b) => b.length - a.length)[0] || clean;
    return [
      { pos: category || 'EXPRESSION', form: clean, note: 'Fixed C1/C2 competition expression' },
      { pos: 'HEAD LEXEME', form: headWord, note: 'Core lexical anchor in Cloze / Rewrite' },
      { pos: 'REGISTER', form: 'Formal / Academic C1–C2', note: 'High-frequency HSGQG & CPE distractor' }
    ];
  }

  return [
    { pos: 'CORE LEXEME', form: clean, note: 'Target C1/C2 form' },
    { pos: 'ADVERBIAL', form: clean.endsWith('ly') ? clean : `${clean}ly`, note: 'Derived modifier' },
    { pos: 'NOMINAL / ADJ', form: clean.endsWith('tion') ? clean : `${clean}ness / ${clean}ity`, note: 'Morphological family' }
  ];
}

/**
 * GET /api/vocab/srs
 * Fetches due VocabularyCard items (nextReviewDate <= now, or all cards when includeUpcoming=true),
 * joins question -> group -> section -> exam (exposed as both question and sourceQuestion) to show
 * the exact competition origin, and returns deck statistics (dueNow, newOrLapsed, learning, mastered).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUpcoming = searchParams.get('includeUpcoming') === 'true';
    const categoryFilter = searchParams.get('category');
    const now = new Date();

    const allCards = await prisma.vocabularyCard.findMany({
      include: {
        question: {
          include: {
            group: {
              include: {
                section: {
                  include: {
                    exam: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [{ nextReviewDate: 'asc' }, { createdAt: 'desc' }]
    });

    // Compute deck statistics across the entire vault
    let dueNow = 0;
    let newOrLapsed = 0;
    let learning = 0;
    let mastered = 0;

    allCards.forEach(c => {
      const reviewDate = c.nextReviewDate || c.nextReviewAt || new Date(0);
      const rep = Number(c.repetitionLevel ?? Math.max(0, (c.srsStage || 1) - 1));
      if (new Date(reviewDate).getTime() <= now.getTime()) {
        dueNow++;
      }
      if (rep <= 0) {
        newOrLapsed++;
      } else if (rep <= 2) {
        learning++;
      } else {
        mastered++;
      }
    });

    const filtered = allCards.filter(c => {
      if (categoryFilter && categoryFilter !== 'ALL') {
        if (!c.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
      }
      if (!includeUpcoming) {
        const reviewDate = c.nextReviewDate || c.nextReviewAt || new Date(0);
        return new Date(reviewDate).getTime() <= now.getTime();
      }
      return true;
    });

    const enrichedCards = filtered.map(c => {
      const q = c.question;
      const grp = q?.group;
      const sec = grp?.section;
      const ex = sec?.exam;

      const examOriginBadge = ex
        ? `${ex.tournament} ${ex.year} (${ex.schoolOrProvince}) - Question #${q.questionNumber}`
        : c.sourceExamTitle || 'HSGQG / DHBB C1–C2 Archive';

      const repetitionLevel = Number(
        c.repetitionLevel !== undefined && c.repetitionLevel !== null
          ? c.repetitionLevel
          : Math.max(0, (c.srsStage || 1) - 1)
      );

      const intervalPreviews = previewAllButtonIntervals(
        {
          repetitionLevel,
          easeFactor: c.easeFactor,
          intervalDays: c.intervalDays,
          nextReviewDate: c.nextReviewDate || c.nextReviewAt
        },
        now
      );

      const cloze = buildContextualCloze(c.term, c.exampleSentence);
      const wordFamily = buildWordFamilyDerivatives(c.term, c.category, c.wordFamilyJson);

      return {
        ...c,
        repetitionLevel,
        nextReviewDate: c.nextReviewDate || c.nextReviewAt,
        sourceQuestion: q,
        examOriginBadge,
        competitionOrigin: ex
          ? {
              competition: ex.tournament,
              tournament: ex.tournament,
              year: ex.year,
              provinceOrSchool: ex.schoolOrProvince,
              schoolOrProvince: ex.schoolOrProvince,
              examTitle: ex.title,
              sectionTitle: sec?.title,
              groupTitle: grp?.title,
              questionNumber: q?.questionNumber
            }
          : null,
        intervalPreviews,
        cloze,
        wordFamily
      };
    });

    return NextResponse.json({
      stats: {
        totalCards: allCards.length,
        dueNow,
        newOrLapsed,
        learning,
        mastered
      },
      cards: enrichedCards
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch SRS vocabulary deck' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vocab/srs
 * Grades a VocabularyCard with Anki SM-2 rating (1: Again, 2: Hard, 3: Good, 4: Easy)
 * and persists repetitionLevel, easeFactor, intervalDays, and nextReviewDate in Prisma.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cardId = String(body.cardId || body.id || '');
    const rawRating = Number(body.rating || 3);
    const rating: Sm2Rating =
      rawRating === 1 || rawRating === 2 || rawRating === 3 || rawRating === 4
        ? rawRating
        : 3;

    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const existing = await prisma.vocabularyCard.findUnique({
      where: { id: cardId }
    });

    if (!existing) {
      return NextResponse.json({ error: `VocabularyCard '${cardId}' not found` }, { status: 404 });
    }

    const sm2Result = calculateSm2(
      {
        repetitionLevel: existing.repetitionLevel,
        srsStage: existing.srsStage,
        easeFactor: existing.easeFactor,
        intervalDays: existing.intervalDays,
        nextReviewDate: existing.nextReviewDate
      },
      rating
    );

    const updated = await prisma.vocabularyCard.update({
      where: { id: cardId },
      data: {
        repetitionLevel: sm2Result.repetitionLevel,
        srsStage: Math.max(1, Math.min(5, sm2Result.repetitionLevel + 1)),
        easeFactor: sm2Result.easeFactor,
        intervalDays: Math.max(0, sm2Result.intervalDays),
        nextReviewDate: sm2Result.nextReviewDate,
        nextReviewAt: sm2Result.nextReviewDate
      }
    });

    return NextResponse.json({
      success: true,
      cardId,
      rating,
      sm2Result,
      card: updated,
      nextIntervalPreviews: previewAllButtonIntervals(updated)
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to update SM-2 card state' },
      { status: 500 }
    );
  }
}
