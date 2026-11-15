/**
 * ============================================================================
 * V-EngOlympiad Hub — Full 60-Question Exam Bank Seeder & Deduplicator
 * (scripts/seed-full-exams.ts)
 * ============================================================================
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const runtimeFullSeeder = require('./seed-full-exams-runtime');

export const CURATED_EXAM_PROFILES = runtimeFullSeeder.CURATED_EXAM_PROFILES;
export const buildFull60QuestionExam = runtimeFullSeeder.buildFull60QuestionExam;
export const deduplicateAndSeedFullExams = runtimeFullSeeder.deduplicateAndSeedFullExams;

if (require.main === module) {
  const result = deduplicateAndSeedFullExams();
  console.log('Full Exam Seeding Complete:', result);
}
