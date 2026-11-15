/**
 * ============================================================================
 * V-EngOlympiad Hub — AI Writing Grader, Anti-Lifting Detector & 3-Tier
 * Sentence Surgery Engine (lib/ai/writing-grader.ts)
 * ============================================================================
 * Supports all 3 official HSGQG (NEC) / DHBB / CPE Writing tasks:
 * - Part 1: WRITING_SUMMARY (1.5 pts, 100–120 words)
 * - Part 2: WRITING_CHART (1.5 pts, ~150 words, multimodal chart image + table support)
 * - Part 3: WRITING_ESSAY (3.0 pts, ~350 words)
 *
 * Uses the official @google/genai SDK with gemini-3.8-flash (upgraded from
 * deprecated gemini-2.5-flash) and strict writingGradingSchema JSON output.
 */

export const GEMINI_WRITING_GRADER_MODEL = 'gemini-3.8-flash';

export type WritingEvaluationResult = WritingGradingResult;

export type WritingTaskType = 'WRITING_SUMMARY' | 'WRITING_CHART' | 'WRITING_ESSAY';

export type CefrPrizeBand = 'B2' | 'C1' | 'C1+' | 'C2 National Prize';

export type SurgeryIssueType =
  | 'LIFTED_FROM_SOURCE'
  | 'COLLOCATION_MISMATCH'
  | 'GRAMMAR_ERROR'
  | 'WEAK_B2_STYLE';

export interface LiftedPhraseMatch {
  phrase: string;
  wordCount: number;
  startIndexInStudent: number;
}

export interface SourceLiftingReport {
  paraphrasingIndex: number; // 0 to 100 (%)
  liftedPercentage: number;  // 0 to 100 (%)
  liftedWordCount: number;
  studentWordCount: number;
  liftedPhrases: LiftedPhraseMatch[];
  severity: 'NONE' | 'LOW' | 'WARNING' | 'CRITICAL_LIFTING_PENALTY';
  warningMessageVi: string;
}

export interface SentenceSurgeryItem {
  originalSentence: string;
  issueType: SurgeryIssueType;
  diagnosisVi: string;
  upgradedC1: string;
  upgradedC2Masterpiece: string;
  keyTechniqueApplied: string;
}

export interface RecommendedC2Collocation {
  term: string;
  category: 'COLLOCATION' | 'IDIOM' | 'NOMINALIZATION' | 'HEDGING_PHRASE';
  meaningVi: string;
  definitionEn: string;
  contextualExample: string;
}

export interface WritingGradingResult {
  taskType: WritingTaskType;
  wordCount: number;
  targetWordRange: { min: number; max: number; optimalLabel: string };
  lengthPenaltyApplied: number;
  overallScore: number;
  maxScore: number; // 1.5 for WRITING_SUMMARY & WRITING_CHART, 3.0 for WRITING_ESSAY
  scaledScore20: number;
  cefrBand: CefrPrizeBand;
  antiLiftingReport: SourceLiftingReport;
  criteriaBreakdown: {
    contentAndTask: {
      score: number;
      maxScore: number;
      feedbackVi: string;
      keyPointsCovered: string[];
      missedOrDistortedPoints: string[];
    };
    organizationAndCohesion: {
      score: number;
      maxScore: number;
      feedbackVi: string;
      cohesiveDevicesUsed: string[];
    };
    lexicalResource: {
      score: number;
      maxScore: number;
      feedbackVi: string;
      c1c2VocabularyDetected: string[];
    };
    grammaticalRange: {
      score: number;
      maxScore: number;
      feedbackVi: string;
      trackedStructures: {
        nominalization: string[];
        inversion: string[];
        subjunctive: string[];
        hedging: string[];
      };
    };
  };
  sentenceSurgeries: SentenceSurgeryItem[];
  recommendedC2Collocations: RecommendedC2Collocation[];
  modelEssayC1Plus: string;
  modelEssayC2NationalPrize: string;
}

/**
 * JSON Schema for Gemini Structured Output (writingGradingSchema)
 */
export const writingGradingSchema = {
  type: 'object',
  properties: {
    overallScore: {
      type: 'number',
      description: 'Total score out of 1.5 (Summary/Chart) or 3.0 (Essay).'
    },
    cefrBand: {
      type: 'string',
      enum: ['B2', 'C1', 'C1+', 'C2 National Prize']
    },
    criteriaBreakdown: {
      type: 'object',
      properties: {
        contentAndTask: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            maxScore: { type: 'number' },
            feedbackVi: { type: 'string' },
            keyPointsCovered: { type: 'array', items: { type: 'string' } },
            missedOrDistortedPoints: { type: 'array', items: { type: 'string' } }
          },
          required: [
            'score',
            'maxScore',
            'feedbackVi',
            'keyPointsCovered',
            'missedOrDistortedPoints'
          ]
        },
        organizationAndCohesion: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            maxScore: { type: 'number' },
            feedbackVi: { type: 'string' },
            cohesiveDevicesUsed: { type: 'array', items: { type: 'string' } }
          },
          required: ['score', 'maxScore', 'feedbackVi', 'cohesiveDevicesUsed']
        },
        lexicalResource: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            maxScore: { type: 'number' },
            feedbackVi: { type: 'string' },
            c1c2VocabularyDetected: { type: 'array', items: { type: 'string' } }
          },
          required: ['score', 'maxScore', 'feedbackVi', 'c1c2VocabularyDetected']
        },
        grammaticalRange: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            maxScore: { type: 'number' },
            feedbackVi: { type: 'string' },
            trackedStructures: {
              type: 'object',
              properties: {
                nominalization: { type: 'array', items: { type: 'string' } },
                inversion: { type: 'array', items: { type: 'string' } },
                subjunctive: { type: 'array', items: { type: 'string' } },
                hedging: { type: 'array', items: { type: 'string' } }
              },
              required: ['nominalization', 'inversion', 'subjunctive', 'hedging']
            }
          },
          required: ['score', 'maxScore', 'feedbackVi', 'trackedStructures']
        }
      },
      required: [
        'contentAndTask',
        'organizationAndCohesion',
        'lexicalResource',
        'grammaticalRange'
      ]
    },
    sentenceSurgeries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          originalSentence: { type: 'string' },
          issueType: {
            type: 'string',
            enum: [
              'LIFTED_FROM_SOURCE',
              'COLLOCATION_MISMATCH',
              'GRAMMAR_ERROR',
              'WEAK_B2_STYLE'
            ]
          },
          diagnosisVi: { type: 'string' },
          upgradedC1: { type: 'string' },
          upgradedC2Masterpiece: { type: 'string' },
          keyTechniqueApplied: { type: 'string' }
        },
        required: [
          'originalSentence',
          'issueType',
          'diagnosisVi',
          'upgradedC1',
          'upgradedC2Masterpiece',
          'keyTechniqueApplied'
        ]
      }
    },
    recommendedC2Collocations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          category: {
            type: 'string',
            enum: ['COLLOCATION', 'IDIOM', 'NOMINALIZATION', 'HEDGING_PHRASE']
          },
          meaningVi: { type: 'string' },
          definitionEn: { type: 'string' },
          contextualExample: { type: 'string' }
        },
        required: ['term', 'category', 'meaningVi', 'definitionEn', 'contextualExample']
      }
    },
    modelEssayC1Plus: { type: 'string' },
    modelEssayC2NationalPrize: { type: 'string' }
  },
  required: [
    'overallScore',
    'cefrBand',
    'criteriaBreakdown',
    'sentenceSurgeries',
    'recommendedC2Collocations',
    'modelEssayC1Plus',
    'modelEssayC2NationalPrize'
  ]
} as const;

/**
 * Sliding 4-to-6-word window Anti-Lifting Detector.
 * Identifies verbatim copying ("Lifting") from sourceText inside studentSummary
 * and computes a real-time Paraphrasing Index (%).
 */
export function detectSourceLifting(
  sourceText: string = '',
  studentSummary: string = ''
): SourceLiftingReport {
  const cleanStudent = String(studentSummary || '').trim();
  const studentWordsRaw = cleanStudent ? cleanStudent.split(/\s+/).filter(Boolean) : [];
  const studentWordCount = studentWordsRaw.length;

  if (!sourceText || !sourceText.trim() || studentWordCount === 0) {
    return {
      paraphrasingIndex: 100,
      liftedPercentage: 0,
      liftedWordCount: 0,
      studentWordCount,
      liftedPhrases: [],
      severity: 'NONE',
      warningMessageVi: '100% Paraphrased — Không phát hiện sao chép nguyên văn (Lifting) từ bài gốc.'
    };
  }

  const normalizeToken = (w: string) =>
    w
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');

  const sourceNormalized = String(sourceText)
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean)
    .join(' ');

  const studentNormTokens = studentWordsRaw.map(normalizeToken);
  const liftedTokenFlags = new Array(studentWordCount).fill(false);
  const liftedPhrases: LiftedPhraseMatch[] = [];

  // Sliding window from 6 words down to 4 words
  let i = 0;
  while (i <= studentWordCount - 4) {
    let matchedWindowLen = 0;

    for (let winSize = Math.min(10, studentWordCount - i); winSize >= 4; winSize--) {
      const candidateNorm = studentNormTokens
        .slice(i, i + winSize)
        .filter(Boolean)
        .join(' ');
      if (candidateNorm.length >= 14 && sourceNormalized.includes(candidateNorm)) {
        matchedWindowLen = winSize;
        break;
      }
    }

    if (matchedWindowLen >= 4) {
      for (let k = i; k < i + matchedWindowLen; k++) {
        liftedTokenFlags[k] = true;
      }
      const rawPhrase = studentWordsRaw
        .slice(i, i + matchedWindowLen)
        .join(' ')
        .replace(/[.,;!?]+$/, '');
      const startIndexInStudent = cleanStudent.indexOf(rawPhrase);
      liftedPhrases.push({
        phrase: rawPhrase,
        wordCount: matchedWindowLen,
        startIndexInStudent: startIndexInStudent >= 0 ? startIndexInStudent : 0
      });
      i += matchedWindowLen;
    } else {
      i++;
    }
  }

  const liftedWordCount = liftedTokenFlags.filter(Boolean).length;
  const liftedPercentage =
    studentWordCount > 0 ? Math.min(100, Math.round((liftedWordCount / studentWordCount) * 100)) : 0;
  const paraphrasingIndex = Math.max(0, 100 - liftedPercentage);

  let severity: SourceLiftingReport['severity'] = 'NONE';
  let warningMessageVi =
    '✅ Paraphrasing xuất sắc (100%): Không có cụm 4+ từ nào chép nguyên văn từ văn bản gốc.';

  if (liftedPhrases.length > 0) {
    if (liftedPercentage >= 25 || liftedPhrases.length >= 3) {
      severity = 'CRITICAL_LIFTING_PENALTY';
      warningMessageVi = `🚨 CẢNH BÁO LIFTING NGHIÊM TRỌNG: Phát hiện ${liftedPhrases.length} cụm từ (${liftedPercentage}% bài viết) chép nguyên văn từ bài đọc gốc! Giám khảo HSGQG sẽ trừ nặng điểm Paraphrasing.`;
    } else if (liftedPercentage >= 10 || liftedPhrases.length === 2) {
      severity = 'WARNING';
      warningMessageVi = `⚠️ Cảnh báo Lifting: Phát hiện ${liftedPhrases.length} cụm từ (4+ từ liên tiếp) trùng khớp nguyên văn với bài gốc. Hãy dùng Nominalization hoặc đồng nghĩa C1/C2 để viết lại.`;
    } else {
      severity = 'LOW';
      warningMessageVi = `💡 Lưu ý nhẹ: Có 1 cụm ngắn ("${liftedPhrases[0].phrase}") trùng với bài gốc. Nên paraphrase để đạt điểm tối đa.`;
    }
  }

  return {
    paraphrasingIndex,
    liftedPercentage,
    liftedWordCount,
    studentWordCount,
    liftedPhrases,
    severity,
    warningMessageVi
  };
}

export async function gradeWritingSubmissionWithAI(input: {
  taskType: WritingTaskType;
  promptText: string;
  sourceText?: string;
  sourcePassageForSummary?: string;
  chartDataJson?: any;
  chartImageBase64?: string;
  chartImageMimeType?: string;
  studentText?: string;
  studentEssay?: string;
}): Promise<WritingGradingResult> {
  if (typeof window === 'undefined') {
    // Server-side execution (Next.js API Route or Express Server)
    const reqFn = eval('require');
    const runtimeWritingGrader = reqFn('./writing-grader-runtime');
    return runtimeWritingGrader.gradeWritingSubmissionWithAI(input);
  }
  const response = await fetch('/api/writing/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const data = await response.json();
  return data.evaluation;
}
