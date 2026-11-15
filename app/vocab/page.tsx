'use client';

import React from 'react';
import SpacedRepetitionStudio from '../../components/vocab/SpacedRepetitionStudio';

/**
 * Next.js App Router Page — /vocab (app/vocab/page.tsx)
 * Mounts the Anki SM-2 Spaced Repetition Engine & Active Cloze Vocabulary Studio.
 */
export default function VocabPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <SpacedRepetitionStudio />
      </div>
    </main>
  );
}
