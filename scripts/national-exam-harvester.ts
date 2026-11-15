/**
 * ============================================================================
 * V-EngOlympiad Hub — National Multi-Province Exam Harvester & Cross-Province
 * Deduplication Pipeline (scripts/national-exam-harvester.ts)
 * ============================================================================
 * Covers all 63 Provinces, 70+ Specialized High Schools (THPT Chuyên), and 6 Competition
 * Categories: HSGQG, DHBB, TRAI_HE_HUNG_VUONG, OLYMPIC_30_4, CHON_DOI_TUYEN, HSG_TINH.
 */

import { computeQuestionFingerprint } from '../lib/assessment/smart-test-engine';

export type CompetitionCategory =
  | 'HSGQG'
  | 'DHBB'
  | 'TRAI_HE_HUNG_VUONG'
  | 'OLYMPIC_30_4'
  | 'CHON_DOI_TUYEN'
  | 'HSG_TINH';

export type VietnamRegion = 'North' | 'Central' | 'South' | 'National';

export interface SpecializedSchoolMetadata {
  province: string;
  school: string;
  region: VietnamRegion;
  tournaments: CompetitionCategory[];
}

export interface CrossProvinceFrequencyCluster {
  fingerprintHash: string;
  frequencyCount: number;
  appearedInExams: string[];
  badgeText: string;
  sampleStem: string;
  questionType: string;
}

// Re-export the runtime harvester functions for Next.js API routes & CLI scripts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const runtimeHarvester = require('./national-exam-harvester-runtime');

export const NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY: SpecializedSchoolMetadata[] =
  runtimeHarvester.NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY;

export const MULTI_PROVINCE_HARVEST_DATASETS =
  runtimeHarvester.MULTI_PROVINCE_HARVEST_DATASETS;

export function computeAndPersistCrossExamFingerprints(): {
  totalExamsIndexed: number;
  totalUniqueFingerprints: number;
  highFrequencyQuestionsCount: number;
  highFrequencyClusters: CrossProvinceFrequencyCluster[];
} {
  return runtimeHarvester.computeAndPersistCrossExamFingerprints();
}

export async function runNationalExamHarvester() {
  return runtimeHarvester.runNationalExamHarvester();
}

export { computeQuestionFingerprint };
