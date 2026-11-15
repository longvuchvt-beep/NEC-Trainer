const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const db = require('../db/database');
const { parseRawTextToExam } = require('./exam-parser');
const { runBatchCrawl } = require('./crawl-exams');

const RAW_EXAMS_DIR = path.join(__dirname, '..', 'raw_exams');

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.docx') {
    const res = await mammoth.extractRawText({ buffer });
    return res.value || '';
  }
  if (ext === '.pdf') {
    const res = await pdfParse(buffer);
    return res.text || '';
  }
  return buffer.toString('utf8');
}

async function runBulkIngestion() {
  console.log('========================================================================');
  console.log('  V-EngOlympiad Hub — Autonomous Bulk Exam Scraper & Local Ingestor');
  console.log('========================================================================');

  if (!fs.existsSync(RAW_EXAMS_DIR)) {
    fs.mkdirSync(RAW_EXAMS_DIR, { recursive: true });
    console.log(`  [+] Created missing directory: ${RAW_EXAMS_DIR}`);
  }

  const beforeExams = db.getAllExams();
  const beforeQuestions = beforeExams.reduce((acc, e) => acc + (e.total_questions || 0), 0);

  // STEP 1: Scan /raw_exams for .docx, .pdf, .txt, .json
  const files = fs.readdirSync(RAW_EXAMS_DIR).filter(f => /\.(docx|pdf|txt|json)$/i.test(f));
  console.log(`\n[STEP 1] Scanning local /raw_exams directory (${files.length} files found)...`);

  const localIngested = [];
  let explanationsSynthesized = 0;

  for (const fileName of files) {
    const fullPath = path.join(RAW_EXAMS_DIR, fileName);
    const rawText = await extractTextFromFile(fullPath);
    const slug = fileName.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const examId = `rawfile-${slug}`;

    const parsedExam = parseRawTextToExam(rawText, { id: examId });
    const saved = db.upsertExam(parsedExam);

    // Count auto-synthesized C1/C2 explanations & extract vocabulary into SRS Vault
    let fileExplCount = 0;
    let fileVocabCount = 0;
    ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach(secKey => {
      const parts = saved.sections?.[secKey]?.parts || [];
      parts.forEach(part => {
        (part.questions || []).forEach(q => {
          if (q.explanation?.vi && q.explanation?.en) {
            fileExplCount++;
            explanationsSynthesized++;
          }
          if (q.explanation?.vocabItem?.term) {
            db.upsertVocab({
              ...q.explanation.vocabItem,
              source_exam: saved.title
            });
            fileVocabCount++;
          }
        });
      });
    });

    db.createCrawlLog({
      source_url: `local://raw_exams/${fileName}`,
      source_type: 'raw-exams-scanner',
      status: 'SUCCESS',
      items_extracted: saved.total_questions,
      exam_id: saved.id,
      summary: `Ingested "${fileName}" -> [${saved.tournament} ${saved.year}] ${saved.title} (${saved.total_questions} tasks, ${fileExplCount} auto-generated C1/C2 explanations).`
    });

    console.log(`  [✓] File Ingested: ${fileName}`);
    console.log(`      ↳ Title: ${saved.title}`);
    console.log(`      ↳ Tournament: ${saved.tournament} (${saved.year}) | School: ${saved.province_school}`);
    console.log(`      ↳ Extracted: Listening + Lexico-Grammar (MCQ, WF, Error ID, Open Cloze) + Reading + Writing`);
    console.log(`      ↳ Total Items: ${saved.total_questions} | Auto-Synthesized C1/C2 Explanations: ${fileExplCount} | +${fileVocabCount} SRS Vocab`);

    localIngested.push({
      fileName,
      examId: saved.id,
      title: saved.title,
      tournament: saved.tournament,
      totalQuestions: saved.total_questions,
      explanationsGenerated: fileExplCount
    });
  }

  // STEP 2: Run Web Crawler for Public Vietnamese Gifted English Exam Feeds
  console.log(`\n[STEP 2] Running Autonomous Web Crawler across Public Olympiad Archives...`);
  const crawledResults = await runBatchCrawl();
  for (const cr of crawledResults) {
    const ex = cr.exam;
    // Count explanations in crawled exam
    let cExpl = 0;
    ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach(secKey => {
      (ex.sections?.[secKey]?.parts || []).forEach(p => {
        cExpl += (p.questions || []).filter(q => q.explanation?.vi).length;
      });
    });
    explanationsSynthesized += cExpl;
    console.log(`  [✓] Web Crawled: [${ex.tournament} ${ex.year}] ${ex.title} (${ex.total_questions} items, ${cExpl} C1/C2 explanations)`);
  }

  const afterExams = db.getAllExams();
  const afterQuestions = afterExams.reduce((acc, e) => acc + (e.total_questions || 0), 0);
  const allVocab = db.getAllVocab();

  console.log('\n========================================================================');
  console.log('  BULK INGESTION & CRAWLER SUMMARY');
  console.log('========================================================================');
  console.log(`  • Local /raw_exams Files Processed : ${localIngested.length} files`);
  console.log(`  • Web Crawler Archives Processed   : ${crawledResults.length} feeds`);
  console.log(`  • Net New Exams Added in This Run  : +${afterExams.length - beforeExams.length} exams (Total in DB: ${afterExams.length} exams)`);
  console.log(`  • Net New Questions Added          : +${afterQuestions - beforeQuestions} questions (Total Pool: ${afterQuestions} questions)`);
  console.log(`  • Auto-Generated C1/C2 Explanations: ${explanationsSynthesized} bilingual explanations + evidence quotes`);
  console.log(`  • Total SRS Vocabulary Vault Items : ${allVocab.length} C1/C2 idioms, collocations & word forms`);
  console.log('========================================================================');

  return {
    localFilesProcessed: localIngested.length,
    webFeedsCrawled: crawledResults.length,
    netNewExams: afterExams.length - beforeExams.length,
    totalExamsInDb: afterExams.length,
    netNewQuestions: afterQuestions - beforeQuestions,
    totalQuestionsInDb: afterQuestions,
    explanationsSynthesized,
    totalVocabInVault: allVocab.length,
    localIngested,
    crawledExams: crawledResults.map(r => ({
      examId: r.exam.id,
      title: r.exam.title,
      tournament: r.exam.tournament,
      totalQuestions: r.exam.total_questions
    }))
  };
}

if (require.main === module) {
  runBulkIngestion().catch(err => {
    console.error('[Bulk Ingestion Error]:', err);
    process.exit(1);
  });
}

module.exports = { runBulkIngestion };
