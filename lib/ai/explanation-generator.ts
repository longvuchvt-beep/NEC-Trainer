import { GoogleGenAI } from '@google/genai';

/**
 * Schema & Interfaces for Gemini C1/C2 Auto-Explanation Engine
 * Note: Uses `gemini-3.8-flash` via the official `@google/genai` Interactions API
 * (substituting `gemini-3.8-flash` for legacy `gemini-2.5-flash`).
 */
export const GEMINI_EXPLANATION_MODEL = 'gemini-3.8-flash';

export interface ExtractedVocabItem {
  term: string;
  category: 'IDIOM' | 'PHRASAL_VERB' | 'COLLOCATION' | 'WORD_FORMATION' | 'INVERSION' | string;
  phonetic?: string;
  definitionEn: string;
  definitionVi: string;
  exampleSentence: string;
  grammarNote?: string;
}

export interface OptionBreakdownMap {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  [key: string]: string | undefined;
}

export interface QuestionExplanationPayload {
  questionId?: string;
  questionNumber: number;
  grammarOrLexicalPoint: string;
  detailedAnalysisVi: string;
  detailedAnalysisEn?: string;
  optionBreakdown?: OptionBreakdownMap;
  evidenceQuote?: string;
  evidenceAnchorId: string; // Format: "ev-q{number}"
  topicTags: string[];
  extractedVocab: ExtractedVocabItem[];
}

export interface BatchExplanationResponse {
  explanations: QuestionExplanationPayload[];
}

/**
 * JSON Schema passed to `response_format` for strict structured JSON output.
 */
export const batchExplanationResponseSchema = {
  type: 'object',
  properties: {
    explanations: {
      type: 'array',
      description: 'Array of deep C1/C2 explanations for each question in the batch (up to 12 items).',
      items: {
        type: 'object',
        properties: {
          questionNumber: {
            type: 'integer',
            description: 'The question number in the exam.'
          },
          grammarOrLexicalPoint: {
            type: 'string',
            description: 'Core C1/C2 grammar rule, syntactic structure, collocation, or morphological pattern tested.'
          },
          detailedAnalysisVi: {
            type: 'string',
            description: 'Deep Vietnamese linguistic breakdown tailored for HSGQG, DHBB, Olympic 30/4, and CPE candidates.'
          },
          detailedAnalysisEn: {
            type: 'string',
            description: 'Concise English linguistic analysis of the structure and register.'
          },
          optionBreakdown: {
            type: 'object',
            description: 'Detailed analysis of options A, B, C, D explaining why the key fits and why each distractor is a lexical/collocational trap.',
            properties: {
              A: { type: 'string' },
              B: { type: 'string' },
              C: { type: 'string' },
              D: { type: 'string' }
            }
          },
          evidenceQuote: {
            type: 'string',
            description: 'Exact verbatim substring from the reading passage or listening transcript that proves the answer.'
          },
          evidenceAnchorId: {
            type: 'string',
            description: 'HTML anchor ID in the format ev-q{questionNumber}, e.g. ev-q17.'
          },
          topicTags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Linguistic topic tags e.g. ["Negative Inversion", "C2 Collocation", "Subjunctive"].'
          },
          extractedVocab: {
            type: 'array',
            description: 'High-value C1/C2 idioms, phrasal verbs, collocations, and word families extracted from this question.',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                category: {
                  type: 'string',
                  enum: ['IDIOM', 'PHRASAL_VERB', 'COLLOCATION', 'WORD_FORMATION', 'INVERSION']
                },
                phonetic: { type: 'string' },
                definitionEn: { type: 'string' },
                definitionVi: { type: 'string' },
                exampleSentence: { type: 'string' },
                grammarNote: { type: 'string' }
              },
              required: ['term', 'category', 'definitionEn', 'definitionVi', 'exampleSentence']
            }
          }
        },
        required: [
          'questionNumber',
          'grammarOrLexicalPoint',
          'detailedAnalysisVi',
          'evidenceAnchorId',
          'topicTags',
          'extractedVocab'
        ]
      }
    }
  },
  required: ['explanations']
};

/**
 * Wraps verbatim `evidenceQuote` substrings inside `stimulusText` or `transcriptHtml`
 * with `<span id="ev-q{number}" class="evidence-anchor" data-q="{number}">...</span>`.
 */
export function injectEvidenceAnchors(
  sourceText: string | null | undefined,
  items: Array<{ questionNumber: number; evidenceQuote?: string | null; evidenceAnchorId?: string | null }>
): string {
  if (!sourceText || !sourceText.trim()) return '';
  let output = sourceText;

  for (const item of items) {
    const qNum = item.questionNumber;
    const anchorId = item.evidenceAnchorId || `ev-q${qNum}`;
    const rawQuote = (item.evidenceQuote || '').trim();
    if (!rawQuote || rawQuote.length < 8) continue;

    // Skip if this anchor ID is already present in the text
    if (output.includes(`id="${anchorId}"`) || output.includes(`id='${anchorId}'`)) {
      continue;
    }

    // Escape regex special characters for verbatim substring match
    const escaped = rawQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'i');

    if (regex.test(output)) {
      output = output.replace(
        regex,
        `<span id="${anchorId}" class="evidence-anchor" data-question="${qNum}">$1</span>`
      );
    } else {
      // Fallback: match the first 5+ words of the quote if minor punctuation differs
      const shortSnippet = rawQuote.split(/\s+/).slice(0, 7).join(' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (shortSnippet.length > 14) {
        const shortRegex = new RegExp(`(${shortSnippet}[^.!?<]*)`, 'i');
        if (shortRegex.test(output)) {
          output = output.replace(
            shortRegex,
            `<span id="${anchorId}" class="evidence-anchor" data-question="${qNum}">$1</span>`
          );
        }
      }
    }
  }

  return output;
}

/**
 * Deterministic C1/C2 Linguistic Fallback Analyzer (used when GEMINI_API_KEY is not set
 * or for zero-latency local verification).
 */
export function buildDeterministicBatchExplanations(
  group: {
    groupType?: string;
    stimulusText?: string | null;
    transcript?: string | null;
    questions: Array<{
      id?: string;
      questionNumber: number;
      questionType?: string;
      stem?: string | null;
      givenWord?: string | null;
      optionsJson?: string | null;
      options?: Array<{ id: string; text: string }>;
      correctAnswer: string;
      grammarRule?: string | null;
      explanationVi?: string | null;
      explanationEn?: string | null;
      evidenceQuote?: string | null;
    }>;
  }
): BatchExplanationResponse {
  const sourceContext = (group.stimulusText || group.transcript || '').replace(/<[^>]+>/g, ' ').trim();
  const sentences = sourceContext
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const explanations: QuestionExplanationPayload[] = (group.questions || []).map(q => {
    const qNum = Number(q.questionNumber);
    const anchorId = `ev-q${qNum}`;
    const opts: Array<{ id: string; text: string }> =
      q.options ||
      (() => {
        try {
          return q.optionsJson ? JSON.parse(q.optionsJson) : [];
        } catch {
          return [];
        }
      })();

    const chosenOpt = opts.find(o => String(o.id).toUpperCase() === String(q.correctAnswer).toUpperCase());
    const targetPhrase = chosenOpt ? chosenOpt.text : q.correctAnswer;

    // Locate best verbatim sentence from stimulusText / transcript if not already provided
    let evidenceQuote = (q.evidenceQuote || '').trim();
    if (!evidenceQuote && sentences.length > 0) {
      const stemWords = `${q.stem || ''} ${targetPhrase}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 4);

      let bestSent = sentences[0];
      let bestScore = -1;
      for (const s of sentences) {
        const lowerS = s.toLowerCase();
        let score = 0;
        if (targetPhrase.length > 3 && lowerS.includes(targetPhrase.toLowerCase())) score += 5;
        for (const w of stemWords) {
          if (lowerS.includes(w)) score += 1;
        }
        if (score > bestScore) {
          bestScore = score;
          bestSent = s;
        }
      }
      evidenceQuote = bestSent;
    }

    const optionBreakdown: OptionBreakdownMap = {};
    if (opts.length > 0) {
      for (const opt of opts) {
        const isCorrect = String(opt.id).toUpperCase() === String(q.correctAnswer).toUpperCase();
        optionBreakdown[opt.id] = isCorrect
          ? `Đáp án ĐÚNG: "${opt.text}" thỏa mãn chính xác cấu trúc Collocation C1/C2, ngữ cảnh học thuật và sắc thái biểu đạt (register) của câu.`
          : `Phương án nhiễu (Trap): "${opt.text}" gây xung đột về kết hợp từ (collocation mismatch) hoặc sai lệch sắc thái nghĩa trong văn cảnh CPE/HSGQG.`;
      }
    }

    const grammarPoint =
      q.grammarRule ||
      (q.givenWord
        ? `C1/C2 Morphological Derivation & Lexical Precision (${q.givenWord} → ${q.correctAnswer})`
        : 'C1/C2 Advanced Syntactic & Collocational Mastery');

    const detailedVi =
      q.explanationVi ||
      `Phân tích chuyên sâu HSGQG/CPE (Câu #${qNum}): Đáp án chuẩn là "${q.correctAnswer}"${
        chosenOpt ? ` (${chosenOpt.text})` : ''
      }. ${
        q.givenWord
          ? `Từ gốc "${q.givenWord}" được biến đổi hình thái thành "${q.correctAnswer}" để khớp với vị trí ngữ pháp và cực tính ngữ nghĩa của mệnh đề.`
          : `Cấu trúc này kiểm tra độ nhạy bén về Collocation học thuật và bẫy ngữ pháp C1/C2 thường xuất hiện trong đề thi Quốc gia (NEC) và Duyên hải Bắc Bộ (DHBB).`
      }`;

    const topicTags = [
      group.groupType || q.questionType || 'C1/C2 Lexico-Grammar',
      q.givenWord ? `Root: ${q.givenWord}` : 'CPE Register',
      'HSGQG / DHBB High-Yield'
    ];

    const extractedVocab: ExtractedVocabItem[] = [
      {
        term: q.givenWord ? `${q.correctAnswer} (< ${q.givenWord})` : targetPhrase,
        category: q.givenWord
          ? 'WORD_FORMATION'
          : /had|no sooner|scarcely|little|only/i.test(targetPhrase)
          ? 'INVERSION'
          : 'COLLOCATION',
        phonetic: '',
        definitionEn:
          q.explanationEn ||
          `High-register C1/C2 lexical or syntactic item ("${targetPhrase}") tested in Question #${qNum}.`,
        definitionVi: detailedVi,
        exampleSentence:
          (q.stem || evidenceQuote || `Mastery of "${targetPhrase}" is essential for C2 writing.`).replace(
            /_{2,}|\{\{\d+\}\}/g,
            targetPhrase
          ),
        grammarNote: grammarPoint
      }
    ];

    return {
      questionId: q.id,
      questionNumber: qNum,
      grammarOrLexicalPoint: grammarPoint,
      detailedAnalysisVi: detailedVi,
      detailedAnalysisEn:
        q.explanationEn ||
        `"${targetPhrase}" satisfies the C1/C2 syntactic and collocational requirements of Question #${qNum}.`,
      optionBreakdown: Object.keys(optionBreakdown).length > 0 ? optionBreakdown : undefined,
      evidenceQuote: evidenceQuote || undefined,
      evidenceAnchorId: anchorId,
      topicTags,
      extractedVocab
    };
  });

  return { explanations };
}

/**
 * Generates deep C1/C2 explanations for a batch of up to 12 questions in a QuestionGroup
 * using Gemini (`gemini-3.8-flash`) with structured JSON output (`batchExplanationResponseSchema`).
 */
export async function generateExplanationsForBatch(
  group: {
    id?: string;
    groupType?: string;
    title?: string;
    stimulusText?: string | null;
    transcript?: string | null;
    questions: Array<any>;
  },
  apiKey?: string
): Promise<BatchExplanationResponse> {
  const batchQuestions = (group.questions || []).slice(0, 12);
  const resolvedKey = apiKey || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);

  if (!resolvedKey) {
    return buildDeterministicBatchExplanations({ ...group, questions: batchQuestions });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: resolvedKey });
    const systemInstruction = `You are a Chief Examiner for the Vietnamese National English Competition (HSGQG / NEC), DHBB, Olympic 30/4, and Cambridge C2 Proficiency (CPE).
Analyze the provided QuestionGroup (up to 12 questions) and generate exhaustive C1/C2 explanations in Vietnamese and English.
For every question:
1. Identify the exact grammarOrLexicalPoint (e.g., Negative Inversion, Mandative Subjunctive, C2 Idiomatic Collocation, Morphological Derivation).
2. Provide a rigorous detailedAnalysisVi explaining the syntax, register, and collocation rules in Vietnamese.
3. Provide optionBreakdown for A, B, C, D explaining why the correct answer works and why each distractor is a trap.
4. Extract the exact verbatim evidenceQuote from the passage/transcript (if present) and set evidenceAnchorId to "ev-q{questionNumber}".
5. Extract C1/C2 idioms, phrasal verbs, collocations, and word families into extractedVocab.`;

    const promptPayload = {
      groupType: group.groupType,
      title: group.title,
      stimulusText: group.stimulusText || null,
      transcript: group.transcript || null,
      questions: batchQuestions.map(q => ({
        questionNumber: q.questionNumber,
        questionType: q.questionType,
        stem: q.stem,
        givenWord: q.givenWord,
        options: q.options || q.optionsJson,
        correctAnswer: q.correctAnswer
      }))
    };

    const interaction = await ai.interactions.create({
      model: GEMINI_EXPLANATION_MODEL,
      system_instruction: systemInstruction,
      input: JSON.stringify(promptPayload, null, 2),
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: batchExplanationResponseSchema
      }
    });

    const parsed = JSON.parse(interaction.output_text || '{}') as BatchExplanationResponse;
    if (Array.isArray(parsed.explanations) && parsed.explanations.length > 0) {
      return parsed;
    }
    return buildDeterministicBatchExplanations({ ...group, questions: batchQuestions });
  } catch (err) {
    return buildDeterministicBatchExplanations({ ...group, questions: batchQuestions });
  }
}
