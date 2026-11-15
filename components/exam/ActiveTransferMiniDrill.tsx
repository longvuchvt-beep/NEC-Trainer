'use client';

import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
  Check,
  Wand2
} from 'lucide-react';

interface ActiveTransferMiniDrillProps {
  passageTitle?: string;
  passageHtml?: string;
  onSaveVocab?: (item: any) => void;
}

export default function ActiveTransferMiniDrill({
  passageTitle = 'Academic Passage',
  passageHtml = '',
  onSaveVocab
}: ActiveTransferMiniDrillProps) {
  // Select a rich nominalization challenge tailored to the passage
  const isUrban = /urban|gentrification|spatial|commute/i.test(passageTitle + passageHtml);
  const isEpistemic = /epistemic|algorithm|cognitive|memory/i.test(passageTitle + passageHtml);

  const challenge = isUrban
    ? {
        sourceSentence:
          'When city planners build green parks without rent controls, low-income families are forced to move to the outer suburbs.',
        targetNominals: ['implementation of', 'displacement of', 'periphery', 'precipitates'],
        starterHint: 'The uncalibrated implementation of ecological urbanism...',
        modelRewrite:
          'The uncalibrated implementation of ecological urbanism without statutory rent safeguards precipitates the systemic displacement of low-income households to the urban periphery.'
      }
    : isEpistemic
    ? {
        sourceSentence:
          'Because students rely too much on algorithmic search engines, they cannot remember complex knowledge deeply.',
        targetNominals: ['proliferation of', 'over-reliance on', 'consolidation', 'atrophy'],
        starterHint: 'Habitual over-reliance on algorithmic retrieval...',
        modelRewrite:
          'Habitual over-reliance on algorithmic retrieval mechanisms precipitates the gradual atrophy of hippocampal schema consolidation and deep epistemic autonomy.'
      }
    : {
        sourceSentence:
          'When governments ignore long-term ecological limits to boost short-term profits, environmental damage becomes much worse.',
        targetNominals: ['subordination of', 'imperatives', 'exacerbation of', 'degradation'],
        starterHint: 'The subordination of planetary boundaries to short-term...',
        modelRewrite:
          'The systematic subordination of long-term ecological imperatives to short-term pecuniary gains inevitably precipitates the severe exacerbation of environmental degradation.'
      };

  const [studentRewrite, setStudentRewrite] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [savedToVault, setSavedToVault] = useState<boolean>(false);

  const handleEvaluate = async (textOverride?: string) => {
    const textToGrade = (textOverride ?? studentRewrite).trim();
    if (!textToGrade || evaluating) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/reading/evaluate-paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSentence: challenge.sourceSentence,
          studentRewrite: textToGrade,
          modelRewrite: challenge.modelRewrite,
          targetNominals: challenge.targetNominals
        })
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.evaluation);
      }
    } catch {} finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="mt-4 p-5 rounded-2xl eyecare-elevated border-2 border-amber-900/25 space-y-3.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900 text-amber-50 text-[11px] font-extrabold">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          ⚡ Thử thách Nâng cấp Câu (Nominalization &amp; Paraphrase Challenge)
        </div>
        <span className="text-[11px] font-bold opacity-75">
          Active Transfer • Chuyển hóa Đọc hiểu → Viết học thuật C2
        </span>
      </div>

      {/* Source Sentence & Target Nominalization Triggers */}
      <div className="p-3.5 rounded-xl eyecare-card border space-y-2 text-xs">
        <div>
          <span className="font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
            Câu gốc (B2 Clausal Style):
          </span>
          <p className="font-serif text-sm font-semibold mt-0.5">
            &ldquo;{challenge.sourceSentence}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="font-bold opacity-75">Từ khóa Danh hóa C2 gợi ý:</span>
          {challenge.targetNominals.map((nom) => (
            <button
              key={nom}
              type="button"
              onClick={() =>
                setStudentRewrite((prev) => `${prev ? prev.trim() + ' ' : ''}${nom} `)
              }
              className="px-2 py-0.5 rounded-md eyecare-elevated border text-[11px] font-bold cloze-mono-input hover:border-amber-800 cursor-pointer"
            >
              + {nom}
            </button>
          ))}
        </div>
      </div>

      {/* Rewrite Input & Action Buttons */}
      <div className="space-y-2">
        <textarea
          rows={2}
          value={studentRewrite}
          onChange={(e) => setStudentRewrite(e.target.value)}
          placeholder={`Viết lại câu trên theo phong cách Danh hóa C2 (Ví dụ: "${challenge.starterHint}")`}
          className="w-full p-3 rounded-xl border eyecare-card text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-800"
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setStudentRewrite(challenge.modelRewrite);
              handleEvaluate(challenge.modelRewrite);
            }}
            className="px-3 py-1.5 rounded-xl eyecare-card border hover:border-amber-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-800" />
            Thử nghiệm với câu C2 mẫu
          </button>

          <button
            type="button"
            disabled={evaluating || !studentRewrite.trim()}
            onClick={() => handleEvaluate()}
            className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 disabled:opacity-50 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {evaluating ? 'Đang chấm cấu trúc C2...' : 'Chấm điểm Nâng cấp Câu'}
          </button>
        </div>
      </div>

      {/* Instant Evaluation Result */}
      {result && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-600/40 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 font-extrabold text-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Điểm Danh hóa &amp; C2 Paraphrase: {result.overallScore}/100 ({result.cefrLevel})
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-bold cloze-mono-input">
              Paraphrase Index: {result.paraphraseRatio}%
            </span>
          </div>

          <p className="leading-relaxed opacity-90">{result.feedbackVi}</p>

          <div className="p-3 rounded-xl eyecare-card border space-y-1">
            <div className="font-extrabold text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-400">
              🌟 Đáp án Danh hóa C2 Chuẩn Giám Khảo HSGQG:
            </div>
            <p className="font-serif font-bold text-xs md:text-sm">
              &ldquo;{result.modelC2Rewrite}&rdquo;
            </p>
          </div>

          {onSaveVocab && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={savedToVault}
                onClick={() => {
                  setSavedToVault(true);
                  onSaveVocab({
                    term: challenge.targetNominals.slice(0, 2).join(' / '),
                    category: 'NOMINALIZATION_C2',
                    definition_en: result.modelC2Rewrite,
                    definition_vi: `Cấu trúc Danh hóa C2 nâng cấp từ: "${challenge.sourceSentence}"`,
                    example_sentence: result.modelC2Rewrite,
                    source_exam: `Active Transfer Drill — ${passageTitle}`
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-60"
              >
                {savedToVault ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Đã lưu cấu trúc C2
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" /> + Lưu cấu trúc C2 vào Flashcards
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
