const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SQLITE_PATH = path.join(DATA_DIR, 'v_engolympiad.sqlite');
const JSON_DB_PATH = path.join(DATA_DIR, 'db_snapshot.json');
const BUNDLE_FALLBACK_PATH = path.join(__dirname, '..', 'src', 'data', 'full-exams-bundle.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  // Serverless read-only filesystem (e.g. Vercel) — safe to ignore
}

let sqliteDb = null;
let useSqlite = false;
let inMemorySnapshot = null;

try {
  // Disable SQLite file locking on read-only serverless platforms (Vercel)
  if (!process.env.VERCEL && !process.env.NOW_REGION) {
    const { DatabaseSync } = require('node:sqlite');
    sqliteDb = new DatabaseSync(SQLITE_PATH);
    useSqlite = true;
    initSqliteSchema();
  }
} catch (err) {
  useSqlite = false;
}

function initSqliteSchema() {
  if (!sqliteDb) return;
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tournament TEXT NOT NULL,
      year INTEGER NOT NULL,
      province_school TEXT NOT NULL,
      grade_level TEXT DEFAULT '11-12',
      duration_minutes INTEGER DEFAULT 180,
      difficulty TEXT DEFAULT 'C1-C2',
      tags_json TEXT DEFAULT '[]',
      sections_json TEXT NOT NULL,
      total_questions INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      exam_title TEXT NOT NULL,
      tournament TEXT NOT NULL,
      mode TEXT DEFAULT 'simulation',
      score REAL NOT NULL,
      max_score REAL NOT NULL,
      percentage REAL NOT NULL,
      time_spent_seconds INTEGER DEFAULT 0,
      answers_json TEXT NOT NULL,
      section_scores_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vocab_vault (
      id TEXT PRIMARY KEY,
      term TEXT NOT NULL,
      type TEXT DEFAULT 'Idiom / Collocation',
      phonetic TEXT DEFAULT '',
      definition_en TEXT NOT NULL,
      definition_vi TEXT NOT NULL,
      example TEXT DEFAULT '',
      source_exam TEXT DEFAULT '',
      grammar_note TEXT DEFAULT '',
      mastery_level INTEGER DEFAULT 1,
      next_review_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS writing_submissions (
      id TEXT PRIMARY KEY,
      exam_id TEXT DEFAULT 'standalone',
      part_type TEXT NOT NULL,
      prompt_title TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      evaluation_json TEXT NOT NULL,
      overall_score REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS crawl_logs (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL,
      items_extracted INTEGER DEFAULT 0,
      exam_id TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

function loadJsonSnapshot() {
  if (inMemorySnapshot) {
    return inMemorySnapshot;
  }
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      inMemorySnapshot = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf8'));
      return inMemorySnapshot;
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FALLBACK_PATH)) {
      const b = JSON.parse(fs.readFileSync(BUNDLE_FALLBACK_PATH, 'utf8'));
      inMemorySnapshot = {
        exams: b.exams || [],
        submissions: b.submissions || [],
        vocab_vault: b.vocab || [],
        writing_submissions: b.writingSubmissions || [],
        crawl_logs: b.crawlLogs || []
      };
      return inMemorySnapshot;
    }
  } catch (e) {}

  inMemorySnapshot = {
    exams: [],
    submissions: [],
    vocab_vault: [],
    writing_submissions: [],
    crawl_logs: []
  };
  return inMemorySnapshot;
}

function saveJsonSnapshot(data) {
  inMemorySnapshot = data;
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Read-only serverless filesystem on Vercel: inMemorySnapshot retains updates
  }
}

function syncSqliteToJson() {
  if (!useSqlite) return;
  try {
    const exams = getAllExams();
    const submissions = getAllSubmissions();
    const vocab_vault = getAllVocab();
    const writing_submissions = getAllWritingSubmissions();
    const crawl_logs = getAllCrawlLogs();
    saveJsonSnapshot({
      engine: 'node:sqlite + json-mirror',
      updated_at: new Date().toISOString(),
      exams,
      submissions,
      vocab_vault,
      writing_submissions,
      crawl_logs
    });
  } catch (e) {
    // ignore snapshot sync error
  }
}

// ==================== EXAMS CRUD ====================
function countQuestionsInSections(sections = {}) {
  let count = 0;
  if (sections.listening?.parts) {
    sections.listening.parts.forEach(p => { count += (p.questions?.length || 0); });
  }
  if (sections.lexicoGrammar?.parts) {
    sections.lexicoGrammar.parts.forEach(p => { count += (p.questions?.length || 0); });
  }
  if (sections.reading?.parts) {
    sections.reading.parts.forEach(p => { count += (p.questions?.length || 0); });
  }
  if (sections.writing?.parts) {
    sections.writing.parts.forEach(p => {
      if (p.questions && p.questions.length > 0) {
        count += p.questions.length;
      } else {
        count += 1;
      }
    });
  }
  return count;
}

function upsertExam(exam) {
  const totalQuestions = exam.total_questions || countQuestionsInSections(exam.sections);
  const createdAt = exam.created_at || new Date().toISOString();
  const normalized = {
    id: exam.id,
    title: exam.title,
    tournament: exam.tournament,
    year: Number(exam.year) || 2025,
    province_school: exam.province_school || 'Bộ GD&ĐT',
    grade_level: exam.grade_level || 'Chuyên 11-12',
    duration_minutes: Number(exam.duration_minutes) || 180,
    difficulty: exam.difficulty || 'C1-C2',
    tags: Array.isArray(exam.tags) ? exam.tags : [],
    sections: exam.sections || {},
    total_questions: totalQuestions,
    created_at: createdAt
  };

  if (useSqlite) {
    const stmt = sqliteDb.prepare(`
      INSERT INTO exams (id, title, tournament, year, province_school, grade_level, duration_minutes, difficulty, tags_json, sections_json, total_questions, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        tournament = excluded.tournament,
        year = excluded.year,
        province_school = excluded.province_school,
        grade_level = excluded.grade_level,
        duration_minutes = excluded.duration_minutes,
        difficulty = excluded.difficulty,
        tags_json = excluded.tags_json,
        sections_json = excluded.sections_json,
        total_questions = excluded.total_questions
    `);
    stmt.run(
      normalized.id,
      normalized.title,
      normalized.tournament,
      normalized.year,
      normalized.province_school,
      normalized.grade_level,
      normalized.duration_minutes,
      normalized.difficulty,
      JSON.stringify(normalized.tags),
      JSON.stringify(normalized.sections),
      normalized.total_questions,
      normalized.created_at
    );
    syncSqliteToJson();
  } else {
    const snap = loadJsonSnapshot();
    const idx = snap.exams.findIndex(e => e.id === normalized.id);
    if (idx >= 0) snap.exams[idx] = normalized;
    else snap.exams.push(normalized);
    saveJsonSnapshot(snap);
  }
  return normalized;
}

function getAllExams() {
  if (useSqlite) {
    const rows = sqliteDb.prepare(`SELECT * FROM exams ORDER BY year DESC, created_at DESC`).all();
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      tournament: r.tournament,
      year: r.year,
      province_school: r.province_school,
      grade_level: r.grade_level,
      duration_minutes: r.duration_minutes,
      difficulty: r.difficulty,
      tags: JSON.parse(r.tags_json || '[]'),
      sections: JSON.parse(r.sections_json || '{}'),
      total_questions: r.total_questions,
      created_at: r.created_at
    }));
  }
  return loadJsonSnapshot().exams || [];
}

function getExamById(id) {
  if (useSqlite) {
    const r = sqliteDb.prepare(`SELECT * FROM exams WHERE id = ?`).get(id);
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      tournament: r.tournament,
      year: r.year,
      province_school: r.province_school,
      grade_level: r.grade_level,
      duration_minutes: r.duration_minutes,
      difficulty: r.difficulty,
      tags: JSON.parse(r.tags_json || '[]'),
      sections: JSON.parse(r.sections_json || '{}'),
      total_questions: r.total_questions,
      created_at: r.created_at
    };
  }
  return (loadJsonSnapshot().exams || []).find(e => e.id === id) || null;
}

function deleteExam(id) {
  if (useSqlite) {
    sqliteDb.prepare(`DELETE FROM exams WHERE id = ?`).run(id);
    syncSqliteToJson();
    return true;
  }
  const snap = loadJsonSnapshot();
  snap.exams = (snap.exams || []).filter(e => e.id !== id);
  saveJsonSnapshot(snap);
  return true;
}

// ==================== SUBMISSIONS CRUD ====================
function createSubmission(sub) {
  const item = {
    id: sub.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exam_id: sub.exam_id,
    exam_title: sub.exam_title || 'Exam',
    tournament: sub.tournament || 'HSGQG',
    mode: sub.mode || 'simulation',
    score: Number(sub.score) || 0,
    max_score: Number(sub.max_score) || 100,
    percentage: Number(sub.percentage) || 0,
    time_spent_seconds: Number(sub.time_spent_seconds) || 0,
    answers: sub.answers || {},
    section_scores: sub.section_scores || {},
    created_at: sub.created_at || new Date().toISOString()
  };

  if (useSqlite) {
    sqliteDb.prepare(`
      INSERT INTO submissions (id, exam_id, exam_title, tournament, mode, score, max_score, percentage, time_spent_seconds, answers_json, section_scores_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.exam_id,
      item.exam_title,
      item.tournament,
      item.mode,
      item.score,
      item.max_score,
      item.percentage,
      item.time_spent_seconds,
      JSON.stringify(item.answers),
      JSON.stringify(item.section_scores),
      item.created_at
    );
    syncSqliteToJson();
  } else {
    const snap = loadJsonSnapshot();
    snap.submissions.unshift(item);
    saveJsonSnapshot(snap);
  }
  return item;
}

function getAllSubmissions() {
  if (useSqlite) {
    const rows = sqliteDb.prepare(`SELECT * FROM submissions ORDER BY created_at DESC`).all();
    return rows.map(r => ({
      id: r.id,
      exam_id: r.exam_id,
      exam_title: r.exam_title,
      tournament: r.tournament,
      mode: r.mode,
      score: r.score,
      max_score: r.max_score,
      percentage: r.percentage,
      time_spent_seconds: r.time_spent_seconds,
      answers: JSON.parse(r.answers_json || '{}'),
      section_scores: JSON.parse(r.section_scores_json || '{}'),
      created_at: r.created_at
    }));
  }
  return loadJsonSnapshot().submissions || [];
}

// ==================== VOCAB VAULT CRUD ====================
function upsertVocab(item) {
  const v = {
    id: item.id || `voc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    term: item.term || item.word || item.wordOrPhrase || 'C2 Collocation',
    type: item.type || item.pos || item.partOfSpeech || 'Collocation / Idiom',
    phonetic: item.phonetic || '',
    definition_en: item.definition_en || item.meaning_en || item.definitionEn || '',
    definition_vi: item.definition_vi || item.meaning_vi || item.definitionVi || '',
    example: item.example || item.example_exam || item.exampleSentence || '',
    source_exam: item.source_exam || item.source_exam_title || item.sourceExamTitle || 'HSGQG Archive',
    grammar_note: item.grammar_note || item.grammarNote || '',
    mastery_level: Number(item.mastery_level ?? 1),
    next_review_at: item.next_review_at || new Date().toISOString(),
    created_at: item.created_at || new Date().toISOString()
  };

  if (useSqlite) {
    sqliteDb.prepare(`
      INSERT INTO vocab_vault (id, term, type, phonetic, definition_en, definition_vi, example, source_exam, grammar_note, mastery_level, next_review_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        term = excluded.term,
        type = excluded.type,
        phonetic = excluded.phonetic,
        definition_en = excluded.definition_en,
        definition_vi = excluded.definition_vi,
        example = excluded.example,
        source_exam = excluded.source_exam,
        grammar_note = excluded.grammar_note,
        mastery_level = excluded.mastery_level,
        next_review_at = excluded.next_review_at
    `).run(
      v.id, v.term, v.type, v.phonetic, v.definition_en, v.definition_vi,
      v.example, v.source_exam, v.grammar_note, v.mastery_level, v.next_review_at, v.created_at
    );
    syncSqliteToJson();
  } else {
    const snap = loadJsonSnapshot();
    const idx = (snap.vocab_vault || []).findIndex(x => x.id === v.id || x.term.toLowerCase() === v.term.toLowerCase());
    if (idx >= 0) snap.vocab_vault[idx] = v;
    else snap.vocab_vault.unshift(v);
    saveJsonSnapshot(snap);
  }
  return v;
}

function getAllVocab() {
  if (useSqlite) {
    return sqliteDb.prepare(`SELECT * FROM vocab_vault ORDER BY created_at DESC`).all();
  }
  return loadJsonSnapshot().vocab_vault || [];
}

function deleteVocab(id) {
  if (useSqlite) {
    sqliteDb.prepare(`DELETE FROM vocab_vault WHERE id = ?`).run(id);
    syncSqliteToJson();
    return true;
  }
  const snap = loadJsonSnapshot();
  snap.vocab_vault = (snap.vocab_vault || []).filter(x => x.id !== id);
  saveJsonSnapshot(snap);
  return true;
}

// ==================== WRITING SUBMISSIONS CRUD ====================
function createWritingSubmission(w) {
  const item = {
    id: w.id || `wrt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exam_id: w.exam_id || 'standalone',
    part_type: w.part_type || 'Part 3: Academic Essay',
    prompt_title: w.prompt_title || 'Writing Task',
    content: w.content || '',
    word_count: Number(w.word_count) || 0,
    evaluation: w.evaluation || {},
    overall_score: Number(w.overall_score) || 0,
    created_at: w.created_at || new Date().toISOString()
  };

  if (useSqlite) {
    sqliteDb.prepare(`
      INSERT INTO writing_submissions (id, exam_id, part_type, prompt_title, content, word_count, evaluation_json, overall_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id, item.exam_id, item.part_type, item.prompt_title, item.content,
      item.word_count, JSON.stringify(item.evaluation), item.overall_score, item.created_at
    );
    syncSqliteToJson();
  } else {
    const snap = loadJsonSnapshot();
    snap.writing_submissions.unshift(item);
    saveJsonSnapshot(snap);
  }
  return item;
}

function getAllWritingSubmissions() {
  if (useSqlite) {
    const rows = sqliteDb.prepare(`SELECT * FROM writing_submissions ORDER BY created_at DESC`).all();
    return rows.map(r => ({
      id: r.id,
      exam_id: r.exam_id,
      part_type: r.part_type,
      prompt_title: r.prompt_title,
      content: r.content,
      word_count: r.word_count,
      evaluation: JSON.parse(r.evaluation_json || '{}'),
      overall_score: r.overall_score,
      created_at: r.created_at
    }));
  }
  return loadJsonSnapshot().writing_submissions || [];
}

// ==================== CRAWL LOGS CRUD ====================
function createCrawlLog(log) {
  const item = {
    id: log.id || `crawl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    source_url: log.source_url || 'local-repository',
    source_type: log.source_type || 'web-crawler',
    status: log.status || 'SUCCESS',
    items_extracted: Number(log.items_extracted) || 0,
    exam_id: log.exam_id || '',
    summary: log.summary || '',
    created_at: log.created_at || new Date().toISOString()
  };

  if (useSqlite) {
    sqliteDb.prepare(`
      INSERT INTO crawl_logs (id, source_url, source_type, status, items_extracted, exam_id, summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id, item.source_url, item.source_type, item.status,
      item.items_extracted, item.exam_id, item.summary, item.created_at
    );
    syncSqliteToJson();
  } else {
    const snap = loadJsonSnapshot();
    snap.crawl_logs.unshift(item);
    saveJsonSnapshot(snap);
  }
  return item;
}

function getAllCrawlLogs() {
  if (useSqlite) {
    return sqliteDb.prepare(`SELECT * FROM crawl_logs ORDER BY created_at DESC LIMIT 50`).all();
  }
  return loadJsonSnapshot().crawl_logs || [];
}

module.exports = {
  useSqlite,
  SQLITE_PATH,
  JSON_DB_PATH,
  upsertExam,
  getAllExams,
  getExamById,
  deleteExam,
  createSubmission,
  getAllSubmissions,
  upsertVocab,
  getAllVocab,
  deleteVocab,
  createWritingSubmission,
  getAllWritingSubmissions,
  createCrawlLog,
  getAllCrawlLogs,
  countQuestionsInSections
};
