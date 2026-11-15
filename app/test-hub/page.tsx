'use client';

import React, { useState, useEffect } from 'react';
import DiagnosticAssessmentHub from '../../components/assessment/DiagnosticAssessmentHub';

/**
 * Next.js App Router Page — /test-hub (app/test-hub/page.tsx)
 * Mounts the 5-Mode Next-Gen Diagnostic Assessment Hub & 63-Province Exam Harvester.
 */
export default function TestHubPage() {
  const [exams, setExams] = useState<any[]>([]);

  const loadExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        setExams(await res.json());
      }
    } catch {
      // ignore initial error
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DiagnosticAssessmentHub exams={exams} onRefreshExams={loadExams} />
      </div>
    </main>
  );
}
