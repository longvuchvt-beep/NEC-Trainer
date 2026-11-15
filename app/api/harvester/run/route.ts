import { NextRequest, NextResponse } from 'next/server';
import {
  runNationalExamHarvester,
  computeAndPersistCrossExamFingerprints,
  NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY
} from '../../../../scripts/national-exam-harvester';

/**
 * GET /api/harvester/run
 * Returns the 63-Province Specialized High School directory and current Cross-Province
 * High-Frequency Question clusters.
 */
export async function GET() {
  try {
    const report = computeAndPersistCrossExamFingerprints();
    return NextResponse.json({
      success: true,
      directoryStats: {
        totalProvincesCovered: 63,
        totalSpecializedSchools: NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY.length
      },
      schoolsDirectory: NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY,
      ...report
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch harvester telemetry' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/harvester/run
 * Executes the National Multi-Province Harvester:
 * 1. Scans /raw_exams/** (.docx, .pdf, .txt, .html)
 * 2. Seeds multi-province specialized school exams across North, Central, and South
 * 3. Computes fingerprintHash and Cross-Exam High-Frequency Badges
 */
export async function POST(_request: NextRequest) {
  try {
    const result = await runNationalExamHarvester();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to run national exam harvester' },
      { status: 500 }
    );
  }
}
