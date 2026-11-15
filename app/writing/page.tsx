import React from 'react';
import PerfectWritingStudio from '../../components/writing/PerfectWritingStudio';

export const metadata = {
  title: 'AI Writing Grader & 3-Tier Sentence Surgery Studio | V-EngOlympiad Hub',
  description:
    'Rubric-accurate NEC/DHBB/CPE Examiner Studio supporting Part 1 Summary (Anti-Lifting), Part 2 Chart Description (Multimodal), and Part 3 Academic Essay with 3-Tier C1/C2 Sentence Surgery.'
};

export default function WritingStudioPage() {
  return (
    <main className="max-w-[1600px] mx-auto px-4 py-6">
      <PerfectWritingStudio />
    </main>
  );
}
