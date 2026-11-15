import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  generateExplanationsForBatch,
  injectEvidenceAnchors,
  GEMINI_EXPLANATION_MODEL
} from '../../../../../lib/ai/explanation-generator';

const prisma = new PrismaClient();

/**
 * POST /api/exams/[examId]/generate-explanations
 * Processes QuestionGroup items in batches of up to 12 questions,
 * updates Question.explanationJson and Question.topicTagsJson,
 * injects <span id="ev-q{number}" class="evidence-anchor"> into QuestionGroup.stimulusText & transcriptHtml,
 * and optionally saves extractedVocab into VocabularyCard.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ examId: string }> | { examId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { examId } = resolvedParams;
    const body = await req.json().catch(() => ({}));
    const saveVocabToVault = body.saveVocabToVault !== false;

    const exam = await prisma.exam.findFirst({
      where: {
        OR: [{ id: examId }, { slug: examId }]
      },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            questionGroups: {
              orderBy: { orderIndex: 'asc' },
              include: {
                questions: {
                  orderBy: { questionNumber: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: `Exam "${examId}" not found.` }, { status: 404 });
    }

    let totalQuestionsUpdated = 0;
    let totalAnchorsInjected = 0;
    let totalVocabSaved = 0;
    const sectionProgress: Array<{
      sectionTitle: string;
      groupTitle: string;
      questionsProcessed: number;
      anchorsInjected: number;
    }> = [];

    for (const section of exam.sections) {
      for (const group of section.questionGroups) {
        const allQuestions = group.questions || [];
        const groupAnchors: Array<{
          questionNumber: number;
          evidenceQuote?: string | null;
          evidenceAnchorId?: string | null;
        }> = [];

        // Process in batches of up to 12 questions
        for (let i = 0; i < allQuestions.length; i += 12) {
          const batchSlice = allQuestions.slice(i, i + 12);
          const batchResponse = await generateExplanationsForBatch({
            id: group.id,
            groupType: group.groupType,
            title: group.title,
            stimulusText: group.stimulusText,
            transcript: group.transcript || section.transcript,
            questions: batchSlice
          });

          for (const expl of batchResponse.explanations) {
            const targetQ = batchSlice.find(q => Number(q.questionNumber) === Number(expl.questionNumber));
            if (!targetQ) continue;

            const anchorId = expl.evidenceAnchorId || `ev-q${targetQ.questionNumber}`;
            if (expl.evidenceQuote) {
              groupAnchors.push({
                questionNumber: targetQ.questionNumber,
                evidenceQuote: expl.evidenceQuote,
                evidenceAnchorId: anchorId
              });
            }

            await prisma.question.update({
              where: { id: targetQ.id },
              data: {
                grammarRule: expl.grammarOrLexicalPoint,
                explanationVi: expl.detailedAnalysisVi,
                explanationEn: expl.detailedAnalysisEn || null,
                distractorAnalysisJson: expl.optionBreakdown
                  ? JSON.stringify(expl.optionBreakdown)
                  : targetQ.distractorAnalysisJson,
                evidenceQuote: expl.evidenceQuote || targetQ.evidenceQuote,
                explanationJson: JSON.stringify(expl),
                topicTagsJson: JSON.stringify(expl.topicTags || [])
              }
            });
            totalQuestionsUpdated++;

            // Optionally save extractedVocab into VocabularyCard
            if (saveVocabToVault && Array.isArray(expl.extractedVocab)) {
              for (const voc of expl.extractedVocab) {
                if (!voc.term) continue;
                await prisma.vocabularyCard.create({
                  data: {
                    questionId: targetQ.id,
                    term: voc.term,
                    category: voc.category || 'COLLOCATION',
                    phonetic: voc.phonetic || '',
                    definitionEn: voc.definitionEn,
                    definitionVi: voc.definitionVi,
                    exampleSentence: voc.exampleSentence || '',
                    sourceExamTitle: exam.title,
                    grammarNote: voc.grammarNote || expl.grammarOrLexicalPoint
                  }
                });
                totalVocabSaved++;
              }
            }
          }
        }

        // Inject <span id="ev-q{number}" class="evidence-anchor"> into stimulusText & transcriptHtml
        let updatedStimulusText = group.stimulusText;
        let updatedTranscriptHtml = group.transcriptHtml || group.transcript || section.transcript;

        if (updatedStimulusText && groupAnchors.length > 0) {
          updatedStimulusText = injectEvidenceAnchors(updatedStimulusText, groupAnchors);
          totalAnchorsInjected += groupAnchors.length;
        }
        if (updatedTranscriptHtml && groupAnchors.length > 0) {
          updatedTranscriptHtml = injectEvidenceAnchors(updatedTranscriptHtml, groupAnchors);
        }

        await prisma.questionGroup.update({
          where: { id: group.id },
          data: {
            stimulusText: updatedStimulusText,
            transcriptHtml: updatedTranscriptHtml
          }
        });

        sectionProgress.push({
          sectionTitle: section.title,
          groupTitle: group.title,
          questionsProcessed: allQuestions.length,
          anchorsInjected: groupAnchors.length
        });
      }
    }

    return NextResponse.json({
      success: true,
      modelUsed: GEMINI_EXPLANATION_MODEL,
      examId: exam.id,
      examTitle: exam.title,
      totalQuestionsUpdated,
      totalAnchorsInjected,
      totalVocabSaved,
      sectionProgress
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate C1/C2 explanations.' },
      { status: 500 }
    );
  }
}
