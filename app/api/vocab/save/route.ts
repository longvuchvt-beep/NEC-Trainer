import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/vocab/save
 * Saves a vocabulary item from any Exam Explanation Card directly into VocabularyCard
 * with SM-2 defaults (repetitionLevel: 0, easeFactor: 2.5, nextReviewDate: now).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const term = String(body.term || '').trim();
    if (!term) {
      return NextResponse.json({ error: 'term is required' }, { status: 400 });
    }

    const questionId = body.questionId || body.sourceQuestionId || null;
    const category = String(body.category || body.type || 'COLLOCATION').toUpperCase();
    const definitionVi = String(body.definitionVi || body.definition_vi || body.meaningVi || 'Cấu trúc C1/C2 trọng tâm');
    const definitionEn = String(
      body.definitionEn ||
        body.definition_en ||
        body.example ||
        `Advanced C1/C2 Olympiad lexical item: ${term}`
    );
    const exampleSentence = String(
      body.exampleSentence || body.example_sentence || body.example || ''
    );
    const sourceExamTitle = String(
      body.sourceExamTitle || body.source_exam || 'HSGQG / DHBB Official Competition'
    );
    const wordFamilyJson = Array.isArray(body.wordFamily)
      ? JSON.stringify(body.wordFamily)
      : typeof body.wordFamilyJson === 'string'
      ? body.wordFamilyJson
      : '[]';

    const existing = await prisma.vocabularyCard.findFirst({
      where: { term }
    });

    if (existing) {
      const updated = await prisma.vocabularyCard.update({
        where: { id: existing.id },
        data: {
          questionId: questionId || existing.questionId,
          category,
          definitionVi,
          definitionEn,
          exampleSentence: exampleSentence || existing.exampleSentence,
          sourceExamTitle: sourceExamTitle || existing.sourceExamTitle,
          wordFamilyJson: wordFamilyJson !== '[]' ? wordFamilyJson : existing.wordFamilyJson
        }
      });
      return NextResponse.json({ success: true, created: false, card: updated });
    }

    const now = new Date();
    const created = await prisma.vocabularyCard.create({
      data: {
        questionId,
        term,
        category,
        phonetic: body.phonetic || null,
        definitionEn,
        definitionVi,
        exampleSentence: exampleSentence || null,
        sourceExamTitle,
        grammarNote: body.grammarNote || body.grammar_note || null,
        wordFamilyJson,
        repetitionLevel: 0,
        srsStage: 1,
        easeFactor: 2.5,
        intervalDays: 0,
        nextReviewDate: now,
        nextReviewAt: now
      }
    });

    return NextResponse.json({ success: true, created: true, card: created });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to save vocabulary card' },
      { status: 500 }
    );
  }
}
