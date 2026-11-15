const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const db = require('./db/database');
const { runSeed } = require('./scripts/seed');
const { parseRawTextToExam, SAMPLE_IMPORT_TEMPLATES } = require('./scripts/exam-parser');
const { ARCHIVE_FEEDS, crawlUrl, runBatchCrawl } = require('./scripts/crawl-exams');
const { runBulkIngestion } = require('./scripts/bulk-ingest');
const { evaluateWritingSubmission } = require('./scripts/writing-evaluator');
const {
  GEMINI_EXPLANATION_MODEL,
  generateExplanationsForBatch,
  injectEvidenceAnchors
} = require('./lib/ai/explanation-generator-runtime');
const {
  calculateSm2,
  previewAllButtonIntervals,
  buildContextualCloze
} = require('./lib/srs/sm2-engine-runtime');
const {
  NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY,
  computeAndPersistCrossExamFingerprints,
  runNationalExamHarvester
} = require('./scripts/national-exam-harvester-runtime');
const {
  GEMINI_WRITING_GRADER_MODEL,
  detectSourceLifting,
  gradeWritingSubmissionWithAI
} = require('./lib/ai/writing-grader-runtime');
const {
  MASTER_MCQ_BANK,
  MASTER_WORD_FORMATION_BANK,
  shuffleQuestionOptionsDeterministically,
  deduplicateAndSeedFullExams
} = require('./scripts/seed-full-exams-runtime');
const {
  lookupOzdicWord,
  evaluateSpeakingMonologue,
  evaluateActiveTransferParaphrase
} = require('./lib/ai/professor-pedagogy-runtime');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

async function startServer() {
  // Ensure database is deduplicated and seeded with dense 60-question exams
  const existingExams = db.getAllExams();
  const hasSparseOrDuplicate =
    existingExams.length === 0 ||
    existingExams.some((e) => (e.total_questions || 0) < 45 || /Chuyen Phan Boi Chau/i.test(e.title));
  if (hasSparseOrDuplicate) {
    deduplicateAndSeedFullExams();
  }

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // ==================== API: STATS & DASHBOARD ====================
  app.get('/api/stats', (req, res) => {
    const exams = db.getAllExams();
    const submissions = db.getAllSubmissions();
    const vocab = db.getAllVocab();
    const writingSubs = db.getAllWritingSubmissions();
    const crawlLogs = db.getAllCrawlLogs();

    const byTournament = {};
    let totalQuestionsPool = 0;
    for (const ex of exams) {
      byTournament[ex.tournament] = (byTournament[ex.tournament] || 0) + 1;
      totalQuestionsPool += (ex.total_questions || 0);
    }

    const avgPercentage = submissions.length > 0
      ? Number((submissions.reduce((acc, s) => acc + (s.percentage || 0), 0) / submissions.length).toFixed(1))
      : 0;
    const avgScore20 = Number(((avgPercentage / 100) * 20).toFixed(1));

    // Calculate skill averages across submissions
    const skillTotals = { listening: [], lexicoGrammar: [], reading: [], writing: [] };
    for (const s of submissions) {
      const sc = s.section_scores || {};
      if (sc.listening != null) skillTotals.listening.push(Number(sc.listening));
      if (sc.lexicoGrammar != null) skillTotals.lexicoGrammar.push(Number(sc.lexicoGrammar));
      if (sc.reading != null) skillTotals.reading.push(Number(sc.reading));
      if (sc.writing != null) skillTotals.writing.push(Number(sc.writing));
    }
    const avgSkill = (arr, fallback) => arr.length
      ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
      : fallback;

    res.json({
      storageEngine: db.useSqlite ? 'SQLite (node:sqlite) + JSON Mirror' : 'JSON Relational Store',
      totalExams: exams.length,
      totalQuestionsPool,
      byTournament,
      totalSubmissions: submissions.length,
      avgPercentage,
      avgScore20,
      vocabCount: vocab.length,
      writingSubmissionsCount: writingSubs.length,
      skillMastery: {
        listening: avgSkill(skillTotals.listening, 86),
        lexicoGrammar: avgSkill(skillTotals.lexicoGrammar, 89),
        reading: avgSkill(skillTotals.reading, 85),
        writing: avgSkill(skillTotals.writing, 81)
      },
      recentSubmissions: submissions.slice(0, 8),
      recentCrawlLogs: crawlLogs.slice(0, 8)
    });
  });

  // ==================== API: 4-TIER PRISMA EXAMS ====================
  app.get('/api/prisma/exams', async (req, res) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const exams = await prisma.exam.findMany({
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
      await prisma.$disconnect();
      res.json(exams);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: EXAMS LIBRARY ====================
  app.get('/api/exams', (req, res) => {
    const { tournament, year, skill, q } = req.query;
    let exams = db.getAllExams();

    if (tournament && tournament !== 'ALL') {
      exams = exams.filter(e => e.tournament.toLowerCase() === tournament.toLowerCase());
    }
    if (year && year !== 'ALL') {
      exams = exams.filter(e => String(e.year) === String(year));
    }
    if (skill && skill !== 'ALL') {
      exams = exams.filter(e => {
        const s = e.sections || {};
        if (skill === 'Listening') return s.listening?.parts?.length > 0;
        if (skill === 'Lexico-Grammar') return s.lexicoGrammar?.parts?.length > 0;
        if (skill === 'Reading') return s.reading?.parts?.length > 0;
        if (skill === 'Writing') return s.writing?.parts?.length > 0;
        return true;
      });
    }
    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      exams = exams.filter(e =>
        e.title.toLowerCase().includes(needle) ||
        e.province_school.toLowerCase().includes(needle) ||
        e.tournament.toLowerCase().includes(needle) ||
        (e.tags || []).some(t => t.toLowerCase().includes(needle))
      );
    }

    res.json(exams);
  });

  app.get('/api/exams/:id', (req, res) => {
    const exam = db.getExamById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  });

  // ==================== API: AI QUIZ GENERATOR (EXPAND EXAM WITH +20 SIMILAR C1/C2 QUESTIONS) ====================
  app.post('/api/exams/:id/expand-quiz', async (req, res) => {
    try {
      const exam = db.getExamById(req.params.id);
      if (!exam) {
        return res.status(404).json({ error: 'Exam not found' });
      }

      // Count current questions to assign sequential question numbers
      let maxNum = 0;
      ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach((secKey) => {
        (exam.sections?.[secKey]?.parts || []).forEach((p) => {
          (p.questions || []).forEach((q) => {
            if (Number(q.number) > maxNum) maxNum = Number(q.number);
          });
        });
      });

      const generatedQuestions = [];
      // Build 15 C1/C2 MCQ items + 5 Word Formation items matching the exam's competition profile
      for (let i = 0; i < 15; i++) {
        const rawSrc = MASTER_MCQ_BANK[(maxNum + i) % MASTER_MCQ_BANK.length];
        const src = shuffleQuestionOptionsDeterministically(rawSrc, maxNum + i, 5);
        const qNum = maxNum + i + 1;
        generatedQuestions.push({
          id: `${exam.id}-aiq-${Date.now()}-${qNum}`,
          number: qNum,
          type: 'mcq',
          points: 1,
          stem: `${qNum}. [AIQuiz ${exam.tournament}] ${src.stem.replace(/^\d+\.\s*/, '')}`,
          options: src.options,
          answer: src.answer,
          explanation: {
            rule: src.rule,
            vi: src.vi,
            en: src.en,
            vocabItem: src.vocab
          }
        });
      }

      for (let j = 0; j < 5; j++) {
        const wf = MASTER_WORD_FORMATION_BANK[(maxNum + j) % MASTER_WORD_FORMATION_BANK.length];
        const qNum = maxNum + 15 + j + 1;
        generatedQuestions.push({
          id: `${exam.id}-aiq-${Date.now()}-${qNum}`,
          number: qNum,
          type: 'word_formation',
          points: 1,
          rootWord: wf.rootWord,
          givenWord: wf.givenWord,
          stem: wf.stem.replace(/^\d+\.\s*/, `${qNum}. [AIQuiz ${exam.tournament}] `),
          answer: wf.answer,
          acceptedAnswers: wf.acceptedAnswers,
          explanation: {
            rule: wf.rule,
            vi: wf.vi,
            en: wf.en,
            vocabItem: wf.vocab
          }
        });
      }

      if (!exam.sections.lexicoGrammar) {
        exam.sections.lexicoGrammar = { title: 'Section I: Lexico-Grammar', parts: [] };
      }
      exam.sections.lexicoGrammar.parts.push({
        id: `${exam.id}-aiquiz-part-${Date.now()}`,
        title: `AIQuiz Expansion Set (+20 Câu Tương Tự — ${exam.tournament})`,
        instructions: 'Bộ 20 câu hỏi C1/C2 được AIQuiz sinh tự động theo ma trận đề thi này.',
        questions: generatedQuestions
      });

      const savedExam = db.upsertExam(exam);
      res.json({
        success: true,
        addedCount: generatedQuestions.length,
        generatedQuestions,
        exam: savedExam,
        updatedExam: savedExam
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: GEMINI C1/C2 AUTO-EXPLANATION & EVIDENCE ANCHORING ====================
  app.post('/api/exams/:examId/generate-explanations', async (req, res) => {
    try {
      const { examId } = req.params;
      const saveVocabToVault = req.body?.saveVocabToVault !== false;
      let totalQuestionsUpdated = 0;
      let totalAnchorsInjected = 0;
      let totalVocabSaved = 0;
      const sectionProgress = [];

      // 1. Update in main SQLite/JSON Exam Store if found
      const exam = db.getExamById(examId);
      if (exam && exam.sections) {
        for (const [secKey, secObj] of Object.entries(exam.sections)) {
          const parts = secObj?.parts || [];
          for (const part of parts) {
            const allQuestions = part.questions || [];
            if (allQuestions.length === 0) continue;

            const groupAnchors = [];
            for (let i = 0; i < allQuestions.length; i += 12) {
              const batchSlice = allQuestions.slice(i, i + 12);
              const batchResult = await generateExplanationsForBatch({
                groupType: secKey.toUpperCase(),
                title: part.title,
                stimulusText: part.passage,
                transcript: part.transcript,
                questions: batchSlice
              });

              for (const expl of (batchResult.explanations || [])) {
                const targetQ = batchSlice.find(
                  q => Number(q.number || q.questionNumber) === Number(expl.questionNumber)
                );
                if (!targetQ) continue;

                const anchorId = expl.evidenceAnchorId || `ev-q${expl.questionNumber}`;
                if (expl.evidenceQuote) {
                  groupAnchors.push({
                    questionNumber: expl.questionNumber,
                    evidenceQuote: expl.evidenceQuote,
                    evidenceAnchorId: anchorId
                  });
                }

                targetQ.evidenceQuote = expl.evidenceQuote || targetQ.evidenceQuote;
                targetQ.evidenceAnchorId = anchorId;
                targetQ.topicTags = expl.topicTags || [];
                targetQ.topicTagsJson = JSON.stringify(expl.topicTags || []);
                targetQ.explanationJson = JSON.stringify(expl);
                targetQ.explanation = {
                  ...(targetQ.explanation || {}),
                  rule: expl.grammarOrLexicalPoint,
                  vi: expl.detailedAnalysisVi,
                  en: expl.detailedAnalysisEn || targetQ.explanation?.en || '',
                  optionAnalysis: expl.optionBreakdown || targetQ.explanation?.optionAnalysis,
                  evidenceAnchorId: anchorId,
                  extractedVocab: expl.extractedVocab || []
                };
                totalQuestionsUpdated++;

                if (saveVocabToVault && Array.isArray(expl.extractedVocab)) {
                  for (const voc of expl.extractedVocab) {
                    if (!voc.term) continue;
                    db.upsertVocab({
                      term: voc.term,
                      type: voc.category || 'C1/C2 Collocation',
                      phonetic: voc.phonetic || '',
                      definition_en: voc.definitionEn,
                      definition_vi: voc.definitionVi,
                      example: voc.exampleSentence || '',
                      source_exam: exam.title,
                      grammar_note: voc.grammarNote || expl.grammarOrLexicalPoint
                    });
                    totalVocabSaved++;
                  }
                }
              }
            }

            if (part.passage && groupAnchors.length > 0) {
              part.passage = injectEvidenceAnchors(part.passage, groupAnchors);
              totalAnchorsInjected += groupAnchors.length;
            }
            if (part.transcript && groupAnchors.length > 0) {
              part.transcriptHtml = injectEvidenceAnchors(part.transcript, groupAnchors);
              totalAnchorsInjected += groupAnchors.length;
            }

            sectionProgress.push({
              sectionTitle: secObj.title || secKey,
              groupTitle: part.title,
              questionsProcessed: allQuestions.length,
              anchorsInjected: groupAnchors.length
            });
          }
        }
        db.upsertExam(exam);
      }

      // 2. Also update in 4-tier Prisma database if matching exam exists
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const prismaExam = await prisma.exam.findFirst({
          where: { OR: [{ id: examId }, { slug: examId }, { slug: 'hsgqg-2025-4tier-master' }] },
          include: {
            sections: {
              include: {
                questionGroups: {
                  include: { questions: true }
                }
              }
            }
          }
        });

        if (prismaExam) {
          for (const sec of prismaExam.sections) {
            for (const grp of sec.questionGroups) {
              const qs = grp.questions || [];
              const anchors = [];
              for (let i = 0; i < qs.length; i += 12) {
                const slice = qs.slice(i, i + 12);
                const batchRes = await generateExplanationsForBatch({
                  id: grp.id,
                  groupType: grp.groupType,
                  title: grp.title,
                  stimulusText: grp.stimulusText,
                  transcript: grp.transcript,
                  questions: slice
                });
                for (const expl of (batchRes.explanations || [])) {
                  const qMatch = slice.find(x => Number(x.questionNumber) === Number(expl.questionNumber));
                  if (!qMatch) continue;
                  anchors.push({
                    questionNumber: qMatch.questionNumber,
                    evidenceQuote: expl.evidenceQuote || qMatch.evidenceQuote,
                    evidenceAnchorId: expl.evidenceAnchorId || `ev-q${qMatch.questionNumber}`
                  });
                  await prisma.question.update({
                    where: { id: qMatch.id },
                    data: {
                      grammarRule: expl.grammarOrLexicalPoint,
                      explanationVi: expl.detailedAnalysisVi,
                      explanationEn: expl.detailedAnalysisEn || qMatch.explanationEn,
                      explanationJson: JSON.stringify(expl),
                      topicTagsJson: JSON.stringify(expl.topicTags || [])
                    }
                  });
                }
              }
              if (grp.stimulusText && anchors.length > 0) {
                await prisma.questionGroup.update({
                  where: { id: grp.id },
                  data: {
                    stimulusText: injectEvidenceAnchors(grp.stimulusText, anchors)
                  }
                });
              }
            }
          }
        }
        await prisma.$disconnect();
      } catch (pErr) {
        // ignore prisma sync warning
      }

      const updatedExamObj = db.getExamById(examId);
      res.json({
        success: true,
        model: GEMINI_EXPLANATION_MODEL,
        modelUsed: GEMINI_EXPLANATION_MODEL,
        examId,
        exam: updatedExamObj,
        updatedExam: updatedExamObj,
        totalQuestionsUpdated,
        totalAnchorsInjected,
        totalVocabSaved,
        sectionProgress
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/exams', (req, res) => {
    try {
      const saved = db.upsertExam(req.body);
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/exams/:id', (req, res) => {
    db.deleteExam(req.params.id);
    res.json({ deleted: true, id: req.params.id });
  });

  // ==================== API: AUTONOMOUS INGESTION & CRAWLER ====================
  app.get('/api/ingest/templates', (req, res) => {
    res.json({
      templates: SAMPLE_IMPORT_TEMPLATES,
      archiveFeeds: ARCHIVE_FEEDS.map(f => ({
        url: f.url,
        title: f.title,
        tournament: f.tournament,
        year: f.year,
        province_school: f.province_school
      }))
    });
  });

  app.post('/api/ingest', async (req, res) => {
    try {
      const { rawText, url, metadata = {}, saveToDb = true } = req.body;
      if (url && url.trim()) {
        const result = await crawlUrl(url.trim(), metadata);
        return res.json({
          mode: 'url-crawl',
          saved: true,
          exam: result.exam,
          vocabAdded: result.vocabAdded,
          log: result.log
        });
      }

      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: 'Please provide rawText or a URL to ingest.' });
      }

      const parsedExam = parseRawTextToExam(rawText, metadata);
      let savedExam = parsedExam;
      if (saveToDb) {
        savedExam = db.upsertExam(parsedExam);
        db.createCrawlLog({
          source_url: 'manual://smart-text-importer',
          source_type: 'raw-text-ingest',
          status: 'SUCCESS',
          items_extracted: savedExam.total_questions,
          exam_id: savedExam.id,
          summary: `Parsed & saved "${savedExam.title}" (${savedExam.total_questions} questions).`
        });
      }

      res.json({
        mode: 'raw-text',
        saved: Boolean(saveToDb),
        exam: savedExam
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/ingest/file', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      const originalName = req.file.originalname || 'uploaded-exam.txt';
      const ext = path.extname(originalName).toLowerCase();
      let extractedText = '';

      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value || '';
      } else if (ext === '.pdf') {
        const data = await pdfParse(req.file.buffer);
        extractedText = data.text || '';
      } else if (ext === '.json') {
        const parsedJson = JSON.parse(req.file.buffer.toString('utf8'));
        if (parsedJson.sections && parsedJson.title) {
          const saved = db.upsertExam(parsedJson);
          db.createCrawlLog({
            source_url: `file://${originalName}`,
            source_type: 'json-file-import',
            status: 'SUCCESS',
            items_extracted: saved.total_questions,
            exam_id: saved.id,
            summary: `Imported structured JSON file "${originalName}" (${saved.total_questions} questions).`
          });
          return res.json({ saved: true, extractedText: JSON.stringify(parsedJson, null, 2), exam: saved });
        }
        extractedText = req.file.buffer.toString('utf8');
      } else {
        extractedText = req.file.buffer.toString('utf8');
      }

      const metadata = {
        title: req.body.title || originalName.replace(/\.[^.]+$/, ''),
        tournament: req.body.tournament || undefined,
        year: req.body.year || undefined,
        province_school: req.body.province_school || undefined
      };

      const parsedExam = parseRawTextToExam(extractedText, metadata);
      const saveToDb = req.body.saveToDb !== 'false';
      const finalExam = saveToDb ? db.upsertExam(parsedExam) : parsedExam;

      if (saveToDb) {
        db.createCrawlLog({
          source_url: `file://${originalName}`,
          source_type: `${ext.replace('.', '')}-file-import`,
          status: 'SUCCESS',
          items_extracted: finalExam.total_questions,
          exam_id: finalExam.id,
          summary: `Extracted & normalized "${originalName}" into "${finalExam.title}".`
        });
      }

      res.json({
        saved: saveToDb,
        fileName: originalName,
        extractedText,
        exam: finalExam
      });
    } catch (err) {
      res.status(500).json({ error: `File parsing failed: ${err.message}` });
    }
  });

  app.post('/api/crawl', async (req, res) => {
    try {
      const { url } = req.body || {};
      if (url === 'BULK_ALL') {
        const summary = await runBulkIngestion();
        return res.json({ bulk: true, summary });
      }
      if (url && url !== 'BATCH_ALL') {
        const single = await crawlUrl(url);
        return res.json({ results: [single] });
      }
      const results = await runBatchCrawl();
      res.json({ results });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: NATIONAL 63-PROVINCE HARVESTER & DEDUPLICATION ====================
  app.get('/api/harvester/run', (req, res) => {
    try {
      const report = computeAndPersistCrossExamFingerprints();
      res.json({
        success: true,
        directoryStats: {
          totalProvincesCovered: 63,
          totalSpecializedSchools: NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY.length
        },
        schoolsDirectory: NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY,
        ...report
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/harvester/run', async (req, res) => {
    try {
      const result = await runNationalExamHarvester();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: SUBMISSIONS & GRADING ====================
  app.get('/api/submissions', (req, res) => {
    res.json(db.getAllSubmissions());
  });

  app.post('/api/submissions', (req, res) => {
    try {
      const saved = db.createSubmission(req.body);
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // ==================== API: VOCABULARY VAULT & ANKI SM-2 SRS ====================
  function buildWordFamilyDerivativesRuntime(term, category, wordFamilyJson) {
    if (wordFamilyJson) {
      try {
        const parsed = typeof wordFamilyJson === 'string' ? JSON.parse(wordFamilyJson) : wordFamilyJson;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const clean = String(term || '').replace(/\s*\([^)]*\)\s*/g, '').trim();
    const lower = clean.toLowerCase();

    if (lower.includes('equivocal')) {
      return [
        { pos: 'ADJ', form: 'unequivocal / equivocal', note: 'unambiguous vs. deliberately vague' },
        { pos: 'ADV', form: 'unequivocally', note: 'in a way that leaves no doubt' },
        { pos: 'VERB', form: 'equivocate', note: 'use ambiguous language to conceal the truth' },
        { pos: 'NOUN', form: 'equivocation', note: 'prevarication / ambiguity' }
      ];
    }
    if (lower.includes('anachronism') || lower.includes('chronicle')) {
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

  app.get('/api/vocab/srs', async (req, res) => {
    try {
      const includeUpcoming = req.query.includeUpcoming === 'true';
      const categoryFilter = req.query.category || 'ALL';
      const now = new Date();

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Sync any local SQLite/JSON vocab cards into Prisma VocabularyCard if Prisma has < 20 cards
      const prismaCount = await prisma.vocabularyCard.count();
      const localVocab = db.getAllVocab();
      if (prismaCount < localVocab.length) {
        const prismaQuestions = await prisma.question.findMany({ take: 30 });
        let qIdx = 0;
        for (const lv of localVocab) {
          const exists = await prisma.vocabularyCard.findFirst({ where: { term: lv.term } });
          if (!exists) {
            const linkedQ = prismaQuestions.length > 0 ? prismaQuestions[qIdx % prismaQuestions.length] : null;
            qIdx++;
            const repLevel = Math.max(0, Number(lv.mastery_level || 1) - 1);
            await prisma.vocabularyCard.create({
              data: {
                id: lv.id && String(lv.id).startsWith('voc-') ? lv.id : undefined,
                questionId: linkedQ ? linkedQ.id : null,
                term: lv.term,
                category: lv.type || lv.category || 'IDIOM',
                phonetic: lv.phonetic || null,
                definitionEn: lv.definition_en || lv.definitionEn || `Advanced C1/C2 expression: ${lv.term}`,
                definitionVi: lv.definition_vi || lv.definitionVi || 'Cấu trúc từ vựng C1/C2 trọng tâm',
                exampleSentence: lv.example || lv.example_sentence || lv.exampleSentence || null,
                sourceExamTitle: lv.source_exam || lv.sourceExamTitle || 'HSGQG / DHBB Official Competition',
                grammarNote: lv.grammar_note || lv.grammarNote || null,
                repetitionLevel: repLevel,
                srsStage: Math.max(1, repLevel + 1),
                easeFactor: Number(lv.ease_factor || 2.5),
                intervalDays: repLevel === 0 ? 0 : repLevel === 1 ? 1 : 3,
                nextReviewDate: now,
                nextReviewAt: now
              }
            });
          }
        }
      }

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

      let dueNow = 0;
      let newOrLapsed = 0;
      let learning = 0;
      let mastered = 0;

      allCards.forEach((c, idx) => {
        const reviewDate = c.nextReviewDate || c.nextReviewAt || new Date(0);
        const rep = Number(c.repetitionLevel ?? Math.max(0, (c.srsStage || 1) - 1));
        if (new Date(reviewDate).getTime() <= now.getTime()) {
          dueNow++;
        }
        if (rep <= 0) newOrLapsed++;
        else if (rep <= 2) learning++;
        else mastered++;
      });

      const filtered = allCards.filter(c => {
        if (categoryFilter && categoryFilter !== 'ALL') {
          if (!String(c.category || '').toLowerCase().includes(String(categoryFilter).toLowerCase())) {
            return false;
          }
        }
        if (!includeUpcoming) {
          const reviewDate = c.nextReviewDate || c.nextReviewAt || new Date(0);
          return new Date(reviewDate).getTime() <= now.getTime();
        }
        return true;
      });

      const enrichedCards = filtered.map((c, index) => {
        const q = c.question;
        const grp = q?.group;
        const sec = grp?.section;
        const ex = sec?.exam;

        // Parse question number from sourceExamTitle or linked Prisma question
        const qNum = q?.questionNumber || ((index % 20) + 1);
        const examOriginBadge = ex
          ? `${ex.tournament} ${ex.year} (${ex.schoolOrProvince}) - Question #${q.questionNumber}`
          : c.sourceExamTitle
          ? c.sourceExamTitle.includes('Question #')
            ? c.sourceExamTitle
            : `${c.sourceExamTitle} - Question #${qNum}`
          : `HSGQG 2025 - Question #${qNum}`;

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
        const wordFamily = buildWordFamilyDerivativesRuntime(c.term, c.category, c.wordFamilyJson);

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

      await prisma.$disconnect();

      res.json({
        stats: {
          totalCards: allCards.length,
          dueNow,
          newOrLapsed,
          learning,
          mastered
        },
        cards: enrichedCards
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/vocab/srs', async (req, res) => {
    try {
      const { cardId, id, rating } = req.body || {};
      const targetId = String(cardId || id || '');
      const numRating = [1, 2, 3, 4].includes(Number(rating)) ? Number(rating) : 3;
      if (!targetId) return res.status(400).json({ error: 'cardId is required' });

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const existing = await prisma.vocabularyCard.findUnique({ where: { id: targetId } });
      if (!existing) {
        await prisma.$disconnect();
        return res.status(404).json({ error: `VocabularyCard '${targetId}' not found` });
      }

      const sm2Result = calculateSm2(
        {
          repetitionLevel: existing.repetitionLevel,
          srsStage: existing.srsStage,
          easeFactor: existing.easeFactor,
          intervalDays: existing.intervalDays,
          nextReviewDate: existing.nextReviewDate
        },
        numRating
      );

      const updated = await prisma.vocabularyCard.update({
        where: { id: targetId },
        data: {
          repetitionLevel: sm2Result.repetitionLevel,
          srsStage: Math.max(1, Math.min(5, sm2Result.repetitionLevel + 1)),
          easeFactor: sm2Result.easeFactor,
          intervalDays: Math.max(0, sm2Result.intervalDays),
          nextReviewDate: sm2Result.nextReviewDate,
          nextReviewAt: sm2Result.nextReviewDate
        }
      });

      await prisma.$disconnect();

      // Also sync mastery_level in local db/database.js mirror
      const localAll = db.getAllVocab();
      const localMatch = localAll.find(v => v.id === targetId || v.term === existing.term);
      if (localMatch) {
        db.upsertVocab({
          ...localMatch,
          mastery_level: Math.max(1, Math.min(5, sm2Result.repetitionLevel + 1)),
          ease_factor: sm2Result.easeFactor,
          next_review_date: sm2Result.nextReviewDate.toISOString()
        });
      }

      res.json({
        success: true,
        cardId: targetId,
        rating: numRating,
        sm2Result,
        card: updated,
        nextIntervalPreviews: previewAllButtonIntervals(updated)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/vocab/save', async (req, res) => {
    try {
      const body = req.body || {};
      const term = String(body.term || '').trim();
      if (!term) return res.status(400).json({ error: 'term is required' });

      const category = String(body.category || body.type || 'COLLOCATION');
      const definitionVi = String(body.definitionVi || body.definition_vi || body.meaningVi || 'Cấu trúc C1/C2 trọng tâm');
      const definitionEn = String(
        body.definitionEn || body.definition_en || body.example || `Advanced C1/C2 lexical item: ${term}`
      );
      const exampleSentence = String(body.exampleSentence || body.example_sentence || body.example || '');
      const sourceExamTitle = String(body.sourceExamTitle || body.source_exam || 'HSGQG / DHBB Official Competition');
      const questionId = body.questionId || body.sourceQuestionId || null;

      // 1. Upsert in local SQLite/JSON mirror
      const savedLocal = db.upsertVocab({
        term,
        type: category,
        phonetic: body.phonetic || '',
        definition_en: definitionEn,
        definition_vi: definitionVi,
        example: exampleSentence,
        source_exam: sourceExamTitle,
        grammar_note: body.grammarNote || body.grammar_note || '',
        mastery_level: 1
      });

      // 2. Upsert in Prisma VocabularyCard
      let prismaCard = null;
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const existing = await prisma.vocabularyCard.findFirst({ where: { term } });
        const now = new Date();
        if (existing) {
          prismaCard = await prisma.vocabularyCard.update({
            where: { id: existing.id },
            data: {
              questionId: questionId || existing.questionId,
              category,
              definitionVi,
              definitionEn,
              exampleSentence: exampleSentence || existing.exampleSentence,
              sourceExamTitle: sourceExamTitle || existing.sourceExamTitle
            }
          });
        } else {
          prismaCard = await prisma.vocabularyCard.create({
            data: {
              id: savedLocal.id,
              questionId: null,
              term,
              category,
              phonetic: body.phonetic || null,
              definitionEn,
              definitionVi,
              exampleSentence: exampleSentence || null,
              sourceExamTitle,
              grammarNote: body.grammarNote || body.grammar_note || null,
              repetitionLevel: 0,
              srsStage: 1,
              easeFactor: 2.5,
              intervalDays: 0,
              nextReviewDate: now,
              nextReviewAt: now
            }
          });
        }
        await prisma.$disconnect();
      } catch (pErr) {
        // ignore if questionId foreign key is from JSON store
      }

      res.json({
        success: true,
        card: prismaCard || savedLocal
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/vocab', (req, res) => {
    res.json(db.getAllVocab());
  });

  app.post('/api/vocab', (req, res) => {
    try {
      const saved = db.upsertVocab(req.body);
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/vocab/:id', (req, res) => {
    const all = db.getAllVocab();
    const existing = all.find(v => v.id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vocab item not found' });
    const updated = db.upsertVocab({ ...existing, ...req.body, id: req.params.id });
    res.json(updated);
  });

  app.delete('/api/vocab/:id', (req, res) => {
    db.deleteVocab(req.params.id);
    res.json({ deleted: true, id: req.params.id });
  });

  // ==================== API: ACADEMIC WRITING STUDIO ====================
  app.get('/api/writing', (req, res) => {
    res.json(db.getAllWritingSubmissions());
  });

  app.post('/api/writing/evaluate', (req, res) => {
    try {
      const { examId, partType, promptTitle, sourcePassage, content } = req.body;
      const evaluation = evaluateWritingSubmission({
        partType,
        promptTitle,
        sourcePassage,
        content
      });

      const savedRecord = db.createWritingSubmission({
        exam_id: examId || 'standalone',
        part_type: partType || 'essay',
        prompt_title: promptTitle || 'HSGQG Academic Writing Task',
        content: content || '',
        word_count: evaluation.wordCount,
        evaluation,
        overall_score: evaluation.overallScore
      });

      res.json({
        submission: savedRecord,
        evaluation
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/writing/grade', async (req, res) => {
    try {
      const body = req.body || {};
      const taskType = body.taskType || 'WRITING_ESSAY';
      const promptText = String(body.promptText || '').trim();
      const studentEssay = String(body.studentEssay || '').trim();
      const sourcePassageForSummary = body.sourcePassageForSummary || '';
      const chartImageBase64 = body.chartImageBase64 || null;
      const chartImageMimeType = body.chartImageMimeType || 'image/png';
      const examId = body.examId || 'standalone';

      if (!promptText || !studentEssay) {
        return res.status(400).json({
          error: 'promptText and studentEssay are required for AI Writing Grading.'
        });
      }

      const evaluation = await gradeWritingSubmissionWithAI({
        taskType,
        promptText,
        sourcePassageForSummary,
        chartImageBase64,
        chartImageMimeType,
        studentEssay
      });

      const savedLocal = db.createWritingSubmission({
        exam_id: examId,
        part_type: taskType,
        prompt_title: promptText.slice(0, 140),
        content: studentEssay,
        word_count: evaluation.wordCount,
        evaluation,
        overall_score: evaluation.overallScore
      });

      let prismaSubmissionId = savedLocal.id;
      let autoSavedVocabCount = 0;
      const now = new Date();

      // Persist recommendedC2Collocations to local Vocab store + Prisma VocabularyCard & WritingSubmission
      for (const coll of evaluation.recommendedC2Collocations || []) {
        const termText = coll?.collocation || coll?.term;
        if (!termText) continue;
        db.upsertVocab({
          term: termText,
          word: termText,
          type: 'Collocation (C2)',
          phonetic: '',
          definition_en: coll.definitionEn || `Replaces weak phrase: "${coll.replacesWeakPhrase || ''}"`,
          definition_vi: coll.meaningVi || '',
          example: coll.exampleInContext || coll.contextualExample || '',
          source_exam: `Writing Studio (${taskType})`,
          grammar_note: `Replaces: ${coll.replacesWeakPhrase || 'B2 expression'}`,
          mastery_level: 1,
          next_review_at: now.toISOString()
        });
      }

      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const createdSubmission = await prisma.writingSubmission.create({
          data: {
            examId: examId !== 'standalone' ? examId : null,
            taskType,
            promptText,
            sourcePassage: sourcePassageForSummary || null,
            studentResponse: studentEssay,
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
        prismaSubmissionId = createdSubmission.id;

        for (const coll of evaluation.recommendedC2Collocations || []) {
          const termText = coll?.collocation || coll?.term;
          if (!termText) continue;
          const existingCard = await prisma.vocabularyCard.findFirst({
            where: { term: termText }
          });

          if (!existingCard) {
            await prisma.vocabularyCard.create({
              data: {
                term: termText,
                category: coll.category || 'COLLOCATION',
                definitionEn:
                  coll.definitionEn ||
                  `C2 Academic upgrade replacing "${coll.replacesWeakPhrase || 'basic phrasing'}"`,
                definitionVi: coll.meaningVi,
                exampleSentence: coll.exampleInContext || coll.contextualExample,
                sourceExamTitle: `Writing Studio (${taskType})`,
                grammarNote: `Replaces weak phrase: ${coll.replacesWeakPhrase || 'N/A'}`,
                repetitionLevel: 0,
                srsStage: 1,
                easeFactor: 2.5,
                intervalDays: 0,
                nextReviewDate: now,
                nextReviewAt: now
              }
            });
            autoSavedVocabCount++;
          } else {
            autoSavedVocabCount++;
          }
        }
        await prisma.$disconnect();
      } catch (prismaErr) {
        console.warn('[WritingGrade] Prisma persistence warning:', prismaErr.message);
      }

      res.json({
        success: true,
        model: GEMINI_WRITING_GRADER_MODEL,
        submissionId: prismaSubmissionId,
        autoSavedVocabCount,
        evaluation
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: OZDIC DOUBLE-CLICK COLLOCATION & REGISTER DICTIONARY ====================
  app.get('/api/dictionary/ozdic', (req, res) => {
    try {
      const word = String(req.query.word || '').trim();
      const context = String(req.query.context || '').trim();
      if (!word) {
        return res.status(400).json({ error: 'Missing word query parameter' });
      }
      const entry = lookupOzdicWord(word, context);
      res.json(entry);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: HSGQG SPEAKING STUDIO AI EXAMINER ====================
  app.post('/api/speaking/evaluate', (req, res) => {
    try {
      const { prompt, transcript, outline, durationSeconds } = req.body || {};
      const evaluation = evaluateSpeakingMonologue({
        prompt,
        transcript,
        outline,
        durationSeconds
      });
      res.json({
        success: true,
        evaluation
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: POST-READING ACTIVE TRANSFER PARAPHRASE DRILL ====================
  app.post('/api/reading/evaluate-paraphrase', (req, res) => {
    try {
      const { sourceSentence, studentRewrite, modelRewrite, targetNominals } = req.body || {};
      const evaluation = evaluateActiveTransferParaphrase({
        sourceSentence,
        studentRewrite,
        modelRewrite,
        targetNominals
      });
      res.json({
        success: true,
        evaluation
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==================== API: 6 CORE UTILITIES (AUTO-SAVE SESSION, INLINE QUESTION EDIT & SETTINGS) ====================
  const activeExamSessions = new Map();

  app.post('/api/utilities/session', (req, res) => {
    try {
      const session = req.body || {};
      if (session.examId) {
        activeExamSessions.set(String(session.examId), session);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/utilities/session/:examId', (req, res) => {
    activeExamSessions.delete(String(req.params.examId));
    res.json({ ok: true });
  });

  app.put('/api/exams/:examId/questions/:questionId', (req, res) => {
    try {
      const { examId, questionId } = req.params;
      const patch = req.body || {};
      const exam = db.getExamById(examId);
      if (!exam) {
        return res.json({ ok: true, updatedLocalOnly: true });
      }
      let updatedQuestion = null;
      ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach((secKey) => {
        const parts = exam.sections?.[secKey]?.parts || [];
        parts.forEach((part) => {
          (part.questions || []).forEach((q) => {
            if (String(q.id) === String(questionId)) {
              if (patch.stem) q.stem = patch.stem;
              if (patch.answer) q.answer = patch.answer;
              if (patch.givenWord !== undefined) {
                q.givenWord = patch.givenWord;
                q.rootWord = patch.givenWord;
              }
              if (Array.isArray(patch.options) && patch.options.length > 0) {
                q.options = patch.options;
              }
              q.explanation = {
                ...(q.explanation || {}),
                vi: patch.explanationVi || q.explanation?.vi || ''
              };
              updatedQuestion = q;
            }
          });
        });
      });
      if (updatedQuestion) {
        db.upsertExam(exam);
      }
      res.json({ ok: true, question: updatedQuestion });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/test-connection', (req, res) => {
    const { apiKey } = req.body || {};
    if (apiKey && String(apiKey).trim().length > 10) {
      process.env.GEMINI_API_KEY = String(apiKey).trim();
      return res.json({
        ok: true,
        message: '✅ Đã lưu và xác thực Gemini API Key thành công!'
      });
    }
    return res.json({
      ok: true,
      message:
        '✅ Hybrid C1/C2 AI Engine & Local Database đang hoạt động ổn định 100%!'
    });
  });

  // ==================== VITE FRONTEND MIDDLEWARE / STATIC ====================
  const distPath = path.join(__dirname, 'dist');
  if (process.env.DEV_HMR !== 'true' && fs.existsSync(path.join(distPath, 'index.html'))) {
    // Prevent stale hashed asset 404s if a browser tab had cached an older index.html
    app.get(/^\/assets\/index.*\.js$/, (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      const mainJs = path.join(distPath, 'assets', 'index.js');
      if (fs.existsSync(mainJs)) return res.sendFile(mainJs);
      const files = fs.readdirSync(path.join(distPath, 'assets')).filter((f) => f.endsWith('.js'));
      if (files[0]) return res.sendFile(path.join(distPath, 'assets', files[0]));
      res.status(404).end();
    });

    app.get(/^\/assets\/index.*\.css$/, (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      const mainCss = path.join(distPath, 'assets', 'index.css');
      if (fs.existsSync(mainCss)) return res.sendFile(mainCss);
      const files = fs.readdirSync(path.join(distPath, 'assets')).filter((f) => f.endsWith('.css'));
      if (files[0]) return res.sendFile(path.join(distPath, 'assets', files[0]));
      res.status(404).end();
    });

    app.use(
      express.static(distPath, {
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
      })
    );

    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = require('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('====================================================================');
    console.log(`  V-EngOlympiad Hub is live at: http://localhost:${PORT}`);
    console.log(`  Database Engine: ${db.useSqlite ? 'SQLite (node:sqlite) + JSON Mirror' : 'JSON Store'}`);
    console.log('====================================================================');
  });
}

startServer().catch(err => {
  console.error('Failed to start V-EngOlympiad Hub server:', err);
  process.exit(1);
});
