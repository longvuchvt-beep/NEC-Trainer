import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  gradeWritingSubmissionWithAI,
  WritingTaskType,
  GEMINI_WRITING_GRADER_MODEL
} from '../../../../lib/ai/writing-grader';

const prisma = new PrismaClient();

/**
 * POST /api/writing/grade
 * Runs gradeWritingSubmissionWithAI, persists the full evaluation into prisma.writingSubmission,
 * and automatically saves recommendedC2Collocations into prisma.vocabularyCard for SM-2 review.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawType = String(body.taskType || body.partType || 'WRITING_ESSAY').toUpperCase();
    const taskType: WritingTaskType =
      rawType.includes('SUMMARY')
        ? 'WRITING_SUMMARY'
        : rawType.includes('CHART')
        ? 'WRITING_CHART'
        : 'WRITING_ESSAY';

    const promptText = String(body.promptText || body.promptTitle || 'HSGQG Academic Writing Task');
    const sourceText = String(body.sourceText || body.sourcePassage || '');
    const studentText = String(body.studentText || body.content || '').trim();

    if (!studentText) {
      return NextResponse.json(
        { error: 'studentText is required for AI grading' },
        { status: 400 }
      );
    }

    const evaluation = await gradeWritingSubmissionWithAI({
      taskType,
      promptText,
      sourceText,
      chartDataJson: body.chartDataJson || null,
      chartImageBase64: body.chartImageBase64 || undefined,
      chartImageMimeType: body.chartImageMimeType || undefined,
      studentText
    });

    // 1. Persist into prisma.writingSubmission
    const savedSubmission = await prisma.writingSubmission.create({
      data: {
        examId: body.examId || null,
        taskType,
        promptText,
        sourcePassage: sourceText || null,
        studentResponse: studentText,
        wordCount: evaluation.wordCount,
        taskAchievementScore: evaluation.criteriaBreakdown.contentAndTask.score,
        coherenceCohesionScore: evaluation.criteriaBreakdown.organizationAndCohesion.score,
        lexicalResourceScore: evaluation.criteriaBreakdown.lexicalResource.score,
        grammaticalRangeScore: evaluation.criteriaBreakdown.grammaticalRange.score,
        overallScore: evaluation.overallScore,
        feedbackJson: JSON.stringify(evaluation),
        sentenceUpgradesJson: JSON.stringify(evaluation.sentenceSurgeries || [])
      }
    });

    // 2. Automatically save recommendedC2Collocations into prisma.vocabularyCard for SM-2 review
    const savedVocabCards = [];
    const now = new Date();
    for (const col of evaluation.recommendedC2Collocations || []) {
      if (!col.term) continue;
      const existing = await prisma.vocabularyCard.findFirst({
        where: { term: col.term }
      });

      if (existing) {
        savedVocabCards.push(existing);
      } else {
        const created = await prisma.vocabularyCard.create({
          data: {
            term: col.term,
            category: col.category || 'COLLOCATION',
            definitionVi: col.meaningVi,
            definitionEn: col.definitionEn,
            exampleSentence: col.contextualExample,
            sourceExamTitle: `AI Writing Studio (${taskType})`,
            repetitionLevel: 0,
            srsStage: 1,
            easeFactor: 2.5,
            intervalDays: 0,
            nextReviewDate: now,
            nextReviewAt: now
          }
        });
        savedVocabCards.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      model: GEMINI_WRITING_GRADER_MODEL,
      submissionId: savedSubmission.id,
      evaluation,
      autoSavedVocabCount: savedVocabCards.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to grade writing submission' },
      { status: 500 }
    );
  }
}
