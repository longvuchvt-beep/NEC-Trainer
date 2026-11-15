'use client';

import React, { useState } from 'react';
import { PenTool, Mic } from 'lucide-react';
import PerfectWritingStudio from '../../components/writing/PerfectWritingStudio';
import HsgqgSpeakingStudio from '../../components/speaking/HsgqgSpeakingStudio';

export default function WritingStudioView({ initialTask, onSaveVocab, initialSubTab = 'writing' }) {
  const [subTab, setSubTab] = useState(initialSubTab); // 'writing' | 'speaking'

  return (
    <div className="space-y-6">
      {/* Clean Sub-Hub Switcher inside Writing & Speaking Studio */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl eyecare-card border shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('writing')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'writing'
                ? 'bg-amber-900 text-amber-50 shadow-sm'
                : 'eyecare-elevated border opacity-85 hover:opacity-100'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>1. Writing Studio (Summary, Chart &amp; Essay C1/C2)</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('speaking')}
            className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
              subTab === 'speaking'
                ? 'bg-amber-900 text-amber-50 shadow-sm'
                : 'eyecare-elevated border opacity-85 hover:opacity-100'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>2. HSGQG Speaking Studio (5-Min Prep &amp; Monologue)</span>
          </button>
        </div>

        <span className="text-xs font-bold opacity-75 px-3">
          Chuẩn ma trận Đề thi chọn Học sinh giỏi Quốc gia (NEC Bảng A)
        </span>
      </div>

      {subTab === 'writing' ? (
        <PerfectWritingStudio />
      ) : (
        <HsgqgSpeakingStudio onSaveVocab={onSaveVocab} />
      )}
    </div>
  );
}
