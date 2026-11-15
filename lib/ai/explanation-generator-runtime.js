const { GoogleGenAI } = require('@google/genai');

const GEMINI_EXPLANATION_MODEL = 'gemini-3.8-flash';

const batchExplanationResponseSchema = {
  type: 'object',
  properties: {
    explanations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionNumber: { type: 'integer' },
          grammarOrLexicalPoint: { type: 'string' },
          detailedAnalysisVi: { type: 'string' },
          detailedAnalysisEn: { type: 'string' },
          optionBreakdown: {
            type: 'object',
            properties: {
              A: { type: 'string' },
              B: { type: 'string' },
              C: { type: 'string' },
              D: { type: 'string' }
            }
          },
          evidenceQuote: { type: 'string' },
          evidenceAnchorId: { type: 'string' },
          topicTags: {
            type: 'array',
            items: { type: 'string' }
          },
          extractedVocab: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                term: { type: 'string' },
                category: { type: 'string' },
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

function injectEvidenceAnchors(sourceText, items = []) {
  if (!sourceText || !sourceText.trim()) return '';
  let output = sourceText;

  for (const item of items) {
    const qNum = item.questionNumber;
    const anchorId = item.evidenceAnchorId || `ev-q${qNum}`;
    const rawQuote = (item.evidenceQuote || '').trim();
    if (!rawQuote || rawQuote.length < 8) continue;

    if (output.includes(`id="${anchorId}"`) || output.includes(`id='${anchorId}'`)) {
      continue;
    }

    const escaped = rawQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'i');

    if (regex.test(output)) {
      output = output.replace(
        regex,
        `<span id="${anchorId}" class="evidence-anchor" data-question="${qNum}">$1</span>`
      );
    } else {
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

function buildDeterministicBatchExplanations(group) {
  const sourceContext = (group.stimulusText || group.passage || group.transcript || '').replace(/<[^>]+>/g, ' ').trim();
  const sentences = sourceContext
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const explanations = (group.questions || []).map(q => {
    const qNum = Number(q.questionNumber || q.number || 1);
    const anchorId = `ev-q${qNum}`;
    const opts =
      q.options ||
      (() => {
        try {
          return q.optionsJson ? JSON.parse(q.optionsJson) : [];
        } catch {
          return [];
        }
      })();

    const correctAns = String(q.correctAnswer || q.answer || 'A');
    const chosenOpt = opts.find(o => String(o.id).toUpperCase() === correctAns.toUpperCase());
    const targetPhrase = chosenOpt ? chosenOpt.text : correctAns;
    const givenRoot = q.givenWord || q.rootWord || q.keyword || '';

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

    const optionBreakdown = q.explanation?.optionAnalysis || {};
    if (opts.length > 0 && Object.keys(optionBreakdown).length === 0) {
      for (const opt of opts) {
        const isCorrect = String(opt.id).toUpperCase() === correctAns.toUpperCase();
        optionBreakdown[opt.id] = isCorrect
          ? `Đáp án ĐÚNG: "${opt.text}" thỏa mãn chính xác cấu trúc Collocation C1/C2, ngữ cảnh học thuật và sắc thái biểu đạt (register) của câu.`
          : `Phương án nhiễu (Lexical/Collocation Trap): "${opt.text}" gây xung đột về kết hợp từ hoặc sai lệch sắc thái nghĩa trong văn cảnh CPE/HSGQG.`;
      }
    }

    const grammarPoint =
      q.grammarRule ||
      q.explanation?.rule ||
      (givenRoot
        ? `C1/C2 Morphological Derivation & Lexical Precision (${givenRoot} → ${correctAns})`
        : 'C1/C2 Advanced Syntactic & Collocational Mastery');

    const detailedVi =
      q.explanationVi ||
      q.explanation?.vi ||
      `Phân tích chuyên sâu HSGQG/CPE (Câu #${qNum}): Đáp án chuẩn là "${correctAns}"${
        chosenOpt ? ` (${chosenOpt.text})` : ''
      }. Cấu trúc này kiểm tra độ nhạy bén về Collocation học thuật và ngữ pháp nâng cao C1/C2.`;

    const detailedEn =
      q.explanationEn ||
      q.explanation?.en ||
      `"${targetPhrase}" satisfies the C1/C2 syntactic and collocational constraints of Question #${qNum}.`;

    const topicTags = [
      group.groupType || q.questionType || q.type || 'C1/C2 Lexico-Grammar',
      givenRoot ? `Root/Keyword: ${givenRoot}` : 'CPE Register',
      'HSGQG / DHBB High-Yield'
    ];

    const extractedVocab = [
      {
        term: givenRoot ? `${correctAns} (< ${givenRoot})` : targetPhrase,
        category: givenRoot ? 'WORD_FORMATION' : 'COLLOCATION',
        phonetic: q.explanation?.vocabItem?.phonetic || '',
        definitionEn: q.explanation?.vocabItem?.definition_en || detailedEn,
        definitionVi: q.explanation?.vocabItem?.definition_vi || detailedVi,
        exampleSentence:
          q.explanation?.vocabItem?.example ||
          (q.stem || evidenceQuote || `Mastery of "${targetPhrase}" is vital for C2 proficiency.`).replace(
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
      detailedAnalysisEn: detailedEn,
      optionBreakdown: Object.keys(optionBreakdown).length > 0 ? optionBreakdown : undefined,
      evidenceQuote: evidenceQuote || undefined,
      evidenceAnchorId: anchorId,
      topicTags,
      extractedVocab
    };
  });

  return { explanations };
}

async function generateExplanationsForBatch(group, apiKey) {
  const batchQuestions = (group.questions || []).slice(0, 12);
  const resolvedKey = apiKey || process.env.GEMINI_API_KEY;

  if (!resolvedKey) {
    return buildDeterministicBatchExplanations({ ...group, questions: batchQuestions });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: resolvedKey });
    const interaction = await ai.interactions.create({
      model: GEMINI_EXPLANATION_MODEL,
      system_instruction:
        'You are a Chief Examiner for the Vietnamese National English Competition (HSGQG/NEC), DHBB, Olympic 30/4, and Cambridge CPE. Generate deep C1/C2 explanations in JSON.',
      input: JSON.stringify({
        groupType: group.groupType,
        title: group.title,
        stimulusText: group.stimulusText || group.passage || null,
        transcript: group.transcript || null,
        questions: batchQuestions
      }),
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: batchExplanationResponseSchema
      }
    });

    const parsed = JSON.parse(interaction.output_text || '{}');
    if (Array.isArray(parsed.explanations) && parsed.explanations.length > 0) {
      return parsed;
    }
    return buildDeterministicBatchExplanations({ ...group, questions: batchQuestions });
  } catch (err) {
    return buildDeterministicBatchExplanations({ ...group, questions: batchQuestions });
  }
}

module.exports = {
  GEMINI_EXPLANATION_MODEL,
  batchExplanationResponseSchema,
  injectEvidenceAnchors,
  buildDeterministicBatchExplanations,
  generateExplanationsForBatch
};
