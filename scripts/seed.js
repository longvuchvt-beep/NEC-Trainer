const db = require('../db/database');
const { SEED_EXAMS, SEED_VOCAB, SEED_SUBMISSIONS } = require('./seed-datasets');

function runSeed() {
  console.log('==============================================================');
  console.log('  V-EngOlympiad Hub — Autonomous C1/C2 Database Seeding');
  console.log(`  Storage Engine: ${db.useSqlite ? 'SQLite (node:sqlite) + JSON Mirror' : 'JSON Relational Store'}`);
  console.log('==============================================================');

  let examCount = 0;
  for (const exam of SEED_EXAMS) {
    const saved = db.upsertExam(exam);
    examCount++;
    console.log(`  [✓] Seeded Exam [${saved.tournament} ${saved.year}]: ${saved.title} (${saved.total_questions} items)`);
  }

  let vocabCount = 0;
  for (const voc of SEED_VOCAB) {
    db.upsertVocab(voc);
    vocabCount++;
  }
  console.log(`  [✓] Seeded Spaced-Repetition Vocabulary Vault: ${vocabCount} C1/C2 items`);

  const existingSubs = db.getAllSubmissions();
  if (existingSubs.length === 0) {
    for (const sub of SEED_SUBMISSIONS) {
      db.createSubmission(sub);
    }
    console.log(`  [✓] Seeded Baseline Analytics Submissions: ${SEED_SUBMISSIONS.length} records`);
  }

  db.createCrawlLog({
    source_url: 'internal://seed-pipeline/c1-c2-official-compendium',
    source_type: 'seed-script',
    status: 'SUCCESS',
    items_extracted: examCount,
    exam_id: SEED_EXAMS[0].id,
    summary: `Seeded ${examCount} complete C1/C2 exams (HSGQG, DHBB, Hùng Vương, Olympic 30/4, Chuyên Selection) & ${vocabCount} lexical items.`
  });

  console.log('==============================================================');
  console.log(`  Seeding Complete! Total Exams in DB: ${db.getAllExams().length}`);
  console.log('==============================================================');
  return { examCount, vocabCount };
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };
