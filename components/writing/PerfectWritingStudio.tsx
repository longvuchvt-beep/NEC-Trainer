'use client';

import React, { useState, useMemo } from 'react';
import {
  PenTool,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Award,
  ArrowRight,
  RotateCcw,
  Upload,
  Eye,
  FileText,
  BarChart3,
  Layers,
  Wand2,
  ShieldAlert,
  BookmarkCheck,
  Check,
  Copy,
  RefreshCw,
  Sun
} from 'lucide-react';
import {
  detectSourceLifting,
  WritingTaskType,
  WritingEvaluationResult,
  SentenceSurgeryItem
} from '../../lib/ai/writing-grader';

interface TaskPreset {
  id: string;
  taskType: WritingTaskType;
  label: string;
  shortBadge: string;
  maxScore: number;
  targetWordsLabel: string;
  minOptimalWords: number;
  maxOptimalWords: number;
  competitionTag: string;
  promptText: string;
  sourcePassage?: string;
  chartDataSummary?: {
    title: string;
    unit: string;
    rows: Array<{ region: string; y2015: string; y2020: string; y2025: string; y2030: string }>;
  };
  sampleStudentDraft: string;
}

const NEC_WRITING_PRESETS: TaskPreset[] = [
  {
    id: 'nec-part1-summary',
    taskType: 'WRITING_SUMMARY',
    label: 'Part 1: Summary Writing (1.5 pts)',
    shortBadge: '100–120 words • Anti-Lifting',
    maxScore: 1.5,
    targetWordsLabel: '100–120 words',
    minOptimalWords: 95,
    maxOptimalWords: 125,
    competitionTag: 'HSGQG (NEC) & DHBB Official Format',
    promptText:
      'Read the following extract on "Algorithmic Epistemology and the Erosion of Deep Reading" and use your own words to summarize it. Your summary should be between 100 and 120 words long. You MUST NOT copy more than four consecutive words from the original passage.',
    sourcePassage: `The proliferation of algorithmic curation across digital ecosystems has fundamentally reconfigured human epistemic habits, gradually displacing sustained, contemplative reading with fragmented information foraging. While hyper-personalized feeds ostensibly democratize access to global scholarship, their underlying reinforcement schedules prioritize instantaneous affective arousal over nuanced cognitive synthesis. Consequently, readers increasingly exhibit what cognitive scientists term "skimming-induced superficiality"—an inability to trace complex counter-arguments or tolerate structural ambiguity in long-form prose. Furthermore, because recommendation engines systematically filter out dissonant viewpoints to maximize platform retention, intellectual echo chambers become self-reinforcing, eroding the civic capacity for deliberative disagreement. Unless educational institutions deliberately cultivate metacognitive resistance and slow-reading pedagogy, technological convenience will continue to atrophy analytical autonomy.`,
    sampleStudentDraft: `Nowadays, the proliferation of algorithmic curation across digital ecosystems has changed how people read every day. Instead of deep reading, students spend too much time on fragmented information foraging on social media. Even though personalized feeds give people access to global knowledge, their underlying reinforcement schedules prioritize instantaneous affective arousal rather than deep thinking. Because of this problem, readers suffer from skimming-induced superficiality and cannot understand complex arguments. Moreover, recommendation engines systematically filter out dissonant viewpoints, which creates echo chambers and hurts public discussion. Therefore, schools need to teach slow-reading pedagogy so that technological convenience will not destroy analytical autonomy.`
  },
  {
    id: 'nec-part2-chart',
    taskType: 'WRITING_CHART',
    label: 'Part 2: Chart / Data Description (1.5 pts)',
    shortBadge: '~150 words • Multimodal Chart AI',
    maxScore: 1.5,
    targetWordsLabel: '140–170 words (~150w)',
    minOptimalWords: 130,
    maxOptimalWords: 180,
    competitionTag: 'HSGQG (NEC) & Trại hè Hùng Vương',
    promptText:
      'The table and chart below illustrate the percentage share of global Sovereign AI Compute Capacity and Green Hydrogen R&D Investment across four major economic blocs between 2015 and 2030 (projected). Summarize the information by selecting and reporting the main features, and make comparisons where relevant. Write about 150 words.',
    chartDataSummary: {
      title: 'Share of Global AI Compute Capacity (%) by Economic Bloc (2015–2030P)',
      unit: '% of Global Capacity',
      rows: [
        { region: 'North America', y2015: '48.5%', y2020: '42.0%', y2025: '36.4%', y2030: '31.0%' },
        { region: 'East & SE Asia (incl. Vietnam)', y2015: '22.0%', y2020: '31.5%', y2025: '39.8%', y2030: '46.5%' },
        { region: 'European Union', y2015: '21.5%', y2020: '18.5%', y2025: '15.2%', y2030: '13.5%' },
        { region: 'Rest of World', y2015: '8.0%', y2020: '8.0%', y2025: '8.6%', y2030: '9.0%' }
      ]
    },
    sampleStudentDraft: `The table shows how much global AI compute capacity four regions had from 2015 to 2030. Overall, it is clear that North America and the European Union went down over the period, while East and Southeast Asia increased a lot to become the biggest region. In 2015, North America had the highest share at 48.5%, which was more than double East and Southeast Asia at 22.0%. However, North America dropped steadily to 36.4% in 2025 and will reach 31.0% in 2030. On the other hand, East and Southeast Asia grew very fast from 22.0% in 2015 to 39.8% in 2025, overtaking North America. By 2030, this region is predicted to reach 46.5%. Meanwhile, the European Union fell from 21.5% to 13.5%, and the Rest of the World stayed almost the same at around 8% to 9%.`
  },
  {
    id: 'nec-part3-essay',
    taskType: 'WRITING_ESSAY',
    label: 'Part 3: Academic Essay (3.0 pts)',
    shortBadge: '~350 words • C2 Sentence Surgery',
    maxScore: 3.0,
    targetWordsLabel: '320–380 words (~350w)',
    minOptimalWords: 280,
    maxOptimalWords: 420,
    competitionTag: 'HSGQG (NEC) First-Prize Benchmark',
    promptText:
      'Some educational theorists argue that in an era dominated by generative artificial intelligence, assessing students through traditional timed essays and standardized examinations has become obsolete. To what extent do you agree or disagree with this viewpoint? Write an academic essay of about 350 words using advanced C1/C2 lexical and syntactic structures.',
    sampleStudentDraft: `Nowadays, artificial intelligence is developing very fast and changing education around the world. Many people think that traditional timed essays and standardized exams are outdated because AI can write essays in seconds. While I agree that old testing methods have some weaknesses, I believe that completely removing timed assessments is a big mistake for students' intellectual development.

On the one hand, there are several reasons why critics say traditional exams are obsolete. First, in the real world, professionals use AI tools to research and edit their work instead of writing everything from memory in a quiet room. Second, standardized tests often make students memorize templates and sample essays, which hurts their real creativity. Because of this problem, many students only study to pass the test rather than understanding the subject deeply.

On the other hand, timed human-proctored writing still plays a very important role in gifted education. When students write an essay without AI assistance, they have to organize their own thoughts, build logical arguments, and recall advanced vocabulary under pressure. If schools stop testing unassisted writing, young people will depend too much on algorithms and lose their critical thinking skills. Furthermore, oral defense and proctored essays are the fairest way to verify whether a student truly masters cognitive synthesis.

In conclusion, although generative AI requires schools to update how they teach, traditional timed examinations should not be abolished. Instead, educators should combine proctored analytical writing with project-based assessments to protect cognitive autonomy.`
  }
];

export default function PerfectWritingStudio() {
  const [selectedTaskType, setSelectedTaskType] = useState<WritingTaskType>('WRITING_SUMMARY');
  const currentPreset = useMemo(
    () => NEC_WRITING_PRESETS.find((p) => p.taskType === selectedTaskType) || NEC_WRITING_PRESETS[0],
    [selectedTaskType]
  );

  const [promptText, setPromptText] = useState<string>(NEC_WRITING_PRESETS[0].promptText);
  const [sourcePassage, setSourcePassage] = useState<string>(NEC_WRITING_PRESETS[0].sourcePassage || '');
  const [studentEssay, setStudentEssay] = useState<string>(NEC_WRITING_PRESETS[0].sampleStudentDraft);
  const [previousDraftSnapshot, setPreviousDraftSnapshot] = useState<string | null>(null);
  const [warmPaperMode, setWarmPaperMode] = useState<boolean>(true);

  // Multimodal chart upload state (for Part 2 WRITING_CHART)
  const [chartImageBase64, setChartImageBase64] = useState<string | null>(null);
  const [chartImageMimeType, setChartImageMimeType] = useState<string>('image/png');
  const [chartImagePreviewUrl, setChartImagePreviewUrl] = useState<string | null>(null);

  // AI Evaluation state
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<WritingEvaluationResult | null>(null);
  const [autoSavedVocabCount, setAutoSavedVocabCount] = useState<number>(0);
  const [appliedSurgeries, setAppliedSurgeries] = useState<Record<number, 'C1' | 'C2'>>({});
  const [activeRightTab, setActiveRightTab] = useState<'SURGERY' | 'RUBRIC' | 'MODELS' | 'VOCAB'>('SURGERY');
  const [activeModelBand, setActiveModelBand] = useState<'C2' | 'C1_PLUS'>('C2');
  const [needsRescoreBanner, setNeedsRescoreBanner] = useState<boolean>(false);
  const [copiedModel, setCopiedModel] = useState<boolean>(false);

  // Switch task type handler
  const handleSelectTask = (taskType: WritingTaskType) => {
    const preset = NEC_WRITING_PRESETS.find((p) => p.taskType === taskType) || NEC_WRITING_PRESETS[0];
    setSelectedTaskType(taskType);
    setPromptText(preset.promptText);
    setSourcePassage(preset.sourcePassage || '');
    setStudentEssay(preset.sampleStudentDraft);
    setPreviousDraftSnapshot(null);
    setEvaluation(null);
    setAppliedSurgeries({});
    setNeedsRescoreBanner(false);
  };

  // Live Word Count calculation
  const wordCount = useMemo(() => {
    const trimmed = studentEssay.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [studentEssay]);

  // Word Count Zone status
  const wordCountZone = useMemo(() => {
    if (wordCount === 0) {
      return {
        status: 'EMPTY',
        label: 'Chưa nhập bài viết',
        badgeClass: 'bg-slate-200 text-slate-700 border-slate-300'
      };
    }
    if (wordCount >= currentPreset.minOptimalWords && wordCount <= currentPreset.maxOptimalWords) {
      return {
        status: 'OPTIMAL',
        label: 'Optimal Zone (Chuẩn khung điểm NEC)',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-400'
      };
    }
    const diff =
      wordCount < currentPreset.minOptimalWords
        ? currentPreset.minOptimalWords - wordCount
        : wordCount - currentPreset.maxOptimalWords;
    if (diff <= 20) {
      return {
        status: 'NEAR',
        label:
          wordCount < currentPreset.minOptimalWords
            ? `Hơi ngắn (-${diff} từ so với chuẩn)`
            : `Sắp vượt giới hạn (+${diff} từ)`,
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-400'
      };
    }
    return {
      status: 'PENALTY',
      label:
        wordCount < currentPreset.minOptimalWords
          ? `Penalty Zone: Thiếu ${diff} từ (Trừ điểm Content)`
          : `Penalty Zone: Vượt quá ${diff} từ (Trừ điểm Summary/Task)`,
      badgeClass: 'bg-rose-100 text-rose-900 border-rose-400'
    };
  }, [wordCount, currentPreset]);

  // Real-Time Anti-Lifting Detector (runs live on every keystroke for Part 1 Summary or whenever sourcePassage exists)
  const liveLiftingReport = useMemo(() => {
    if (selectedTaskType !== 'WRITING_SUMMARY' || !sourcePassage.trim()) {
      return {
        liftedPhrases: [],
        liftedWordCount: 0,
        studentWordCount: wordCount,
        paraphrasingIndex: 100
      };
    }
    return detectSourceLifting(sourcePassage, studentEssay);
  }, [selectedTaskType, sourcePassage, studentEssay, wordCount]);

  // Build highlighted segments for student draft when lifted phrases exist
  const highlightedStudentSegments = useMemo(() => {
    if (!liveLiftingReport.liftedPhrases.length || !studentEssay) {
      return [{ text: studentEssay, isLifted: false }];
    }

    let segments: Array<{ text: string; isLifted: boolean; matchedPhrase?: string }> = [
      { text: studentEssay, isLifted: false }
    ];

    for (const item of liveLiftingReport.liftedPhrases) {
      const phrase = typeof item === 'string' ? item : item.phrase;
      const words = phrase.split(/\s+/).filter(Boolean);
      if (words.length < 4) continue;
      // Match words allowing punctuation/whitespace between them
      const regexPattern = words
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('[\\s,.;:"\'()\\-]+');
      const regex = new RegExp(`(${regexPattern})`, 'gi');

      const nextSegments: Array<{ text: string; isLifted: boolean; matchedPhrase?: string }> = [];
      for (const seg of segments) {
        if (seg.isLifted) {
          nextSegments.push(seg);
          continue;
        }
        const parts = seg.text.split(regex);
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue;
          if (i % 2 === 1) {
            nextSegments.push({ text: part, isLifted: true, matchedPhrase: phrase });
          } else {
            nextSegments.push({ text: part, isLifted: false });
          }
        }
      }
      segments = nextSegments;
    }

    return segments;
  }, [studentEssay, liveLiftingReport.liftedPhrases]);

  // Handle Chart Image upload for Multimodal Gemini Grading
  const handleChartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setChartImageMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setChartImagePreviewUrl(dataUrl);
      const base64Part = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setChartImageBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  // Trigger AI Grading via POST /api/writing/grade
  const handleGradeSubmission = async () => {
    if (!studentEssay.trim()) return;
    setIsGrading(true);
    setNeedsRescoreBanner(false);
    try {
      const res = await fetch('/api/writing/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: selectedTaskType,
          promptText,
          sourcePassageForSummary: selectedTaskType === 'WRITING_SUMMARY' ? sourcePassage : undefined,
          chartImageBase64: selectedTaskType === 'WRITING_CHART' ? chartImageBase64 : undefined,
          chartImageMimeType: selectedTaskType === 'WRITING_CHART' ? chartImageMimeType : undefined,
          studentEssay
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to grade writing submission');
      }
      setEvaluation(data.evaluation);
      setAutoSavedVocabCount(data.autoSavedVocabCount || 0);
      setAppliedSurgeries({});
    } catch (err: any) {
      alert('Lỗi khi chấm bài Writing: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGrading(false);
    }
  };

  // 1-Click "Thay vào bài của tôi" (Apply C1 or C2 Sentence Surgery directly into Student's Draft)
  const handleApplySentenceSurgery = (
    idx: number,
    surgery: SentenceSurgeryItem,
    tier: 'C1' | 'C2'
  ) => {
    const replacement = tier === 'C2' ? surgery.upgradedC2Masterpiece : surgery.upgradedC1;
    const original = surgery.originalSentence.trim();

    setPreviousDraftSnapshot(studentEssay);

    if (studentEssay.includes(original)) {
      setStudentEssay(studentEssay.replace(original, replacement));
    } else {
      // Case-insensitive or normalized whitespace fallback match
      const escaped = original
        .split(/\s+/)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('\\s+');
      const regex = new RegExp(escaped, 'i');
      if (regex.test(studentEssay)) {
        setStudentEssay(studentEssay.replace(regex, replacement));
      } else {
        // If user already modified that sentence earlier, check if the other tier is currently in the essay
        const alternate = tier === 'C2' ? surgery.upgradedC1 : surgery.upgradedC2Masterpiece;
        if (studentEssay.includes(alternate)) {
          setStudentEssay(studentEssay.replace(alternate, replacement));
        } else {
          // Append or replace closest sentence
          setStudentEssay((prev) => `${prev.trim()} ${replacement}`);
        }
      }
    }

    setAppliedSurgeries((prev) => ({ ...prev, [idx]: tier }));
    setNeedsRescoreBanner(true);
  };

  const handleUndoLastSurgery = () => {
    if (previousDraftSnapshot !== null) {
      setStudentEssay(previousDraftSnapshot);
      setPreviousDraftSnapshot(null);
      setNeedsRescoreBanner(false);
    }
  };

  const issueBadgeStyle = (issueType: SentenceSurgeryItem['issueType']) => {
    switch (issueType) {
      case 'LIFTED_FROM_SOURCE':
        return {
          label: '🚨 LIFTED FROM SOURCE (Sao chép nguyên văn)',
          cls: 'bg-rose-100 text-rose-900 border-rose-300'
        };
      case 'COLLOCATION_MISMATCH':
        return {
          label: '🎯 COLLOCATION MISMATCH (Lệch kết hợp từ C1/C2)',
          cls: 'bg-amber-100 text-amber-900 border-amber-300'
        };
      case 'GRAMMAR_ERROR':
        return {
          label: '⚠️ GRAMMAR / SYNTAX ISSUE (Lỗi cấu trúc câu)',
          cls: 'bg-orange-100 text-orange-900 border-orange-300'
        };
      case 'WEAK_B2_STYLE':
      default:
        return {
          label: '💡 WEAK B2 STYLE (Diễn đạt B2 đơn giản — Cần nâng C2)',
          cls: 'bg-indigo-100 text-indigo-900 border-indigo-300'
        };
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 rounded-2xl border p-4 md:p-6 ${
        warmPaperMode
          ? 'bg-[#FAF6EE] text-[#2C2621] border-[#E6DEC8]'
          : 'bg-slate-50 text-slate-900 border-slate-200'
      }`}
    >
      {/* STUDIO HEADER BAR */}
      <div
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-6 border-b ${
          warmPaperMode ? 'border-[#E5DCC8]' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-900 text-amber-50">
              <PenTool className="w-3.5 h-3.5" />
              NEC / DHBB / CPE Examiner Studio
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-800/10 text-emerald-900 border border-emerald-700/20">
              <Sparkles className="w-3 h-3" />
              3-Tier Sentence Surgery + Anti-Lifting Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            AI Writing Grader &amp; C2 Sentence Surgery Studio
          </h1>
          <p className="text-sm opacity-80 mt-0.5">
            Chấm điểm chuẩn Rubric HSGQG (Part 1 Summary 1.5đ • Part 2 Chart 1.5đ • Part 3 Essay 3.0đ), phát hiện đạo văn nguyên cụm (Anti-Lifting) và nâng cấp từng câu lên chuẩn Giải Nhất Quốc Gia (C2 Masterpiece).
          </p>
        </div>

        {/* TASK SWITCHER + EYE-CARE TOGGLE */}
        <div className="flex flex-wrap items-center gap-2">
          {NEC_WRITING_PRESETS.map((preset) => {
            const active = selectedTaskType === preset.taskType;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectTask(preset.taskType)}
                className={`px-3.5 py-2 rounded-xl text-left transition-all border ${
                  active
                    ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-sm'
                    : warmPaperMode
                    ? 'bg-[#F2ECE1] text-[#3B332B] border-[#DED4BE] hover:bg-[#EAE1D3]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">{preset.label}</div>
                <div className={`text-[11px] ${active ? 'text-amber-200' : 'opacity-70'}`}>
                  {preset.shortBadge}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setWarmPaperMode((v) => !v)}
            title="Chuyển chế độ giấy ấm bảo vệ mắt (Warm-Paper Eye-Care Mode)"
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
              warmPaperMode
                ? 'bg-[#EFE6D5] text-amber-950 border-[#D8CBB3]'
                : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-700" />
            {warmPaperMode ? 'Warm-Paper ON' : 'Standard Light'}
          </button>
        </div>
      </div>

      {/* SPLIT-SCREEN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT PANE: STIMULUS, LIVE ANTI-LIFTING & EDITOR (6 COLS) ==================== */}
        <div className="xl:col-span-6 space-y-5">
          {/* 1. OFFICIAL PROMPT & SOURCE STIMULUS / CHART VIEWER */}
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {currentPreset.competitionTag} — Đề bài &amp; Ngữ liệu gốc
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-900/10 text-amber-950">
                Max Score: {currentPreset.maxScore.toFixed(1)} pts • Target: {currentPreset.targetWordsLabel}
              </span>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">
              Prompt / Task Instructions (Có thể chỉnh sửa hoặc dán đề mới):
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={3}
              className={`w-full rounded-xl border p-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-700 ${
                warmPaperMode
                  ? 'bg-[#FCF9F2] border-[#DDD2BC] text-[#2C2621]'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />

            {/* PART 1: SOURCE PASSAGE FOR SUMMARY + ANTI-LIFTING */}
            {selectedTaskType === 'WRITING_SUMMARY' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Source Passage to Summarize (Đoạn văn gốc ~250 từ):
                  </label>
                  <span className="text-[11px] font-medium opacity-75">
                    Cấm chép nguyên văn từ 4 từ liên tiếp trở lên
                  </span>
                </div>
                <textarea
                  value={sourcePassage}
                  onChange={(e) => setSourcePassage(e.target.value)}
                  rows={6}
                  placeholder="Dán đoạn văn gốc của phần Summary Writing vào đây..."
                  className={`w-full rounded-xl border p-3.5 text-sm leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-amber-700 ${
                    warmPaperMode
                      ? 'bg-[#FCF9F2] border-[#DDD2BC] text-[#2C2621]'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            )}

            {/* PART 2: DATA TABLE & MULTIMODAL CHART IMAGE UPLOAD */}
            {selectedTaskType === 'WRITING_CHART' && (
              <div className="mt-4 space-y-4">
                {currentPreset.chartDataSummary && (
                  <div
                    className={`rounded-xl border p-3.5 ${
                      warmPaperMode ? 'bg-[#FCF9F2] border-[#DDD2BC]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-amber-800" />
                        {currentPreset.chartDataSummary.title}
                      </span>
                      <span className="text-[11px] opacity-75">{currentPreset.chartDataSummary.unit}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-amber-900/20 text-left font-bold">
                            <th className="py-1.5 pr-3">Economic Bloc</th>
                            <th className="py-1.5 px-2">2015</th>
                            <th className="py-1.5 px-2">2020</th>
                            <th className="py-1.5 px-2">2025</th>
                            <th className="py-1.5 pl-2">2030 (Proj.)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPreset.chartDataSummary.rows.map((r, i) => (
                            <tr key={i} className="border-b border-amber-900/10">
                              <td className="py-1.5 pr-3 font-semibold">{r.region}</td>
                              <td className="py-1.5 px-2 font-mono">{r.y2015}</td>
                              <td className="py-1.5 px-2 font-mono">{r.y2020}</td>
                              <td className="py-1.5 px-2 font-mono">{r.y2025}</td>
                              <td className="py-1.5 pl-2 font-mono font-bold text-amber-900">{r.y2030}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Multimodal Chart Image Uploader */}
                <div
                  className={`rounded-xl border border-dashed p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    warmPaperMode ? 'bg-[#FCF9F2] border-[#C9B99B]' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-800" />
                      Multimodal Chart Image Input (Tải ảnh biểu đồ cho Gemini Vision)
                    </div>
                    <p className="text-[11px] opacity-75 mt-0.5">
                      Tải ảnh chụp biểu đồ (Bar/Line/Pie/Table) để AI đối chiếu trực tiếp số liệu trong bài viết của bạn.
                    </p>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-900 text-amber-50 hover:bg-amber-800 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    Chọn ảnh biểu đồ
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChartImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {chartImagePreviewUrl && (
                  <div className="rounded-xl border p-2 bg-white/80">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1 px-1">
                      <span>Ảnh biểu đồ đã đính kèm (Multimodal Ready):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setChartImageBase64(null);
                          setChartImagePreviewUrl(null);
                        }}
                        className="text-rose-700 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                    <img
                      src={chartImagePreviewUrl}
                      alt="Uploaded Chart Stimulus"
                      className="max-h-48 rounded-lg mx-auto object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. LIVE WORD COUNT & REAL-TIME ANTI-LIFTING RADAR */}
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Status Bar: Word Count Badge + Paraphrasing Index */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-amber-900/15">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  Live Word Count:
                </span>
                <span className="text-lg font-black font-mono px-2.5 py-0.5 rounded-lg bg-amber-900 text-amber-50">
                  {wordCount} words
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${wordCountZone.badgeClass}`}
                >
                  {wordCountZone.label}
                </span>
              </div>

              {selectedTaskType === 'WRITING_SUMMARY' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">Paraphrasing Index:</span>
                  <span
                    className={`text-sm font-black font-mono px-2.5 py-0.5 rounded-lg border ${
                      liveLiftingReport.paraphrasingIndex >= 90
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                        : liveLiftingReport.paraphrasingIndex >= 75
                        ? 'bg-amber-100 text-amber-900 border-amber-400'
                        : 'bg-rose-100 text-rose-900 border-rose-400'
                    }`}
                  >
                    {liveLiftingReport.paraphrasingIndex}%
                  </span>
                </div>
              )}
            </div>

            {/* Real-Time Anti-Lifting Warning Banner (for Summary Writing) */}
            {selectedTaskType === 'WRITING_SUMMARY' && (
              <div className="mb-4">
                {liveLiftingReport.liftedPhrases.length > 0 ? (
                  <div className="rounded-xl border border-rose-300 bg-rose-50/95 p-3.5 text-rose-950">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-extrabold uppercase tracking-wide text-rose-900">
                          ⚠️ Cảnh báo đạo văn nguyên cụm (Source Lifting Detected — {liveLiftingReport.liftedPhrases.length} cụm ≥ 4 từ trùng khớp!)
                        </div>
                        <p className="text-xs mt-1 text-rose-800">
                          Giám khảo HSGQG/DHBB sẽ trừ nặng điểm Content &amp; Lexical Resource nếu chép nguyên văn 4+ từ liên tiếp. Hãy danh từ hóa (Nominalize) hoặc thay bằng cấu trúc đồng nghĩa C2:
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {liveLiftingReport.liftedPhrases.map((item, idx) => {
                            const phraseText = typeof item === 'string' ? item : item.phrase;
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-rose-200/80 text-rose-950 border border-rose-400"
                              >
                                &ldquo;{phraseText}&rdquo;
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/90 px-3.5 py-2.5 text-emerald-950 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      100% Paraphrased! Không phát hiện cụm 4+ từ nào sao chép nguyên văn từ bài gốc.
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800">Chuẩn NEC Summary</span>
                  </div>
                )}
              </div>
            )}

            {/* Banner prompting re-score after applying 1-click C2 Sentence Surgery */}
            {needsRescoreBanner && (
              <div className="mb-4 rounded-xl border border-indigo-300 bg-indigo-50 p-3 flex flex-wrap items-center justify-between gap-2 text-indigo-950">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Wand2 className="w-4 h-4 text-indigo-700" />
                  Đã thay thế câu nâng cấp C2 vào bài nháp của bạn! Hãy bấm chấm lại để xem điểm mới.
                </div>
                <div className="flex items-center gap-2">
                  {previousDraftSnapshot !== null && (
                    <button
                      type="button"
                      onClick={handleUndoLastSurgery}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-indigo-300 bg-white hover:bg-indigo-100 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Hoàn tác
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleGradeSubmission}
                    disabled={isGrading}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-700 text-white hover:bg-indigo-800 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGrading ? 'animate-spin' : ''}`} />
                    Chấm điểm lại (Re-Score Draft)
                  </button>
                </div>
              </div>
            )}

            {/* MAIN STUDENT ESSAY EDITOR */}
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider">
                Bài làm của bạn (Student Writing Editor):
              </label>
              <button
                type="button"
                onClick={() => {
                  setStudentEssay(currentPreset.sampleStudentDraft);
                  setNeedsRescoreBanner(false);
                }}
                className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Khôi phục bài mẫu thử nghiệm
              </button>
            </div>

            <textarea
              value={studentEssay}
              onChange={(e) => setStudentEssay(e.target.value)}
              rows={selectedTaskType === 'WRITING_ESSAY' ? 14 : 9}
              placeholder="Nhập bài viết tiếng Anh của bạn tại đây..."
              className={`w-full rounded-xl border p-4 text-sm md:text-base leading-relaxed font-serif focus:outline-none focus:ring-2 focus:ring-amber-800 ${
                warmPaperMode
                  ? 'bg-[#FCF9F2] border-[#D8CBB3] text-[#231E1A]'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />

            {/* Live Anti-Lifting Highlight Preview (when lifted phrases exist in Summary) */}
            {selectedTaskType === 'WRITING_SUMMARY' && liveLiftingReport.liftedPhrases.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-900/20 bg-[#FCF9F2] p-3.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-900 mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  Bản đồ quét đạo văn trực tiếp (Các cụm tô đỏ là chép nguyên văn 4+ từ từ bài gốc):
                </div>
                <div className="text-xs leading-relaxed font-serif">
                  {highlightedStudentSegments.map((seg, i) =>
                    seg.isLifted ? (
                      <mark
                        key={i}
                        title={`Cụm sao chép nguyên văn: "${seg.matchedPhrase}"`}
                        className="bg-rose-200 text-rose-950 font-bold px-1 py-0.5 rounded border-b-2 border-rose-600"
                      >
                        {seg.text}
                      </mark>
                    ) : (
                      <span key={i}>{seg.text}</span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* SUBMIT FOR AI EXAMINER GRADING & SENTENCE SURGERY */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs opacity-75">
                Tự động lưu 5–8 C2 Collocations vào <strong>Anki SM-2 Vocab Vault</strong> sau khi chấm.
              </div>
              <button
                type="button"
                onClick={handleGradeSubmission}
                disabled={isGrading || !studentEssay.trim()}
                className="px-5 py-3 rounded-xl font-bold text-sm bg-amber-900 text-amber-50 hover:bg-amber-800 disabled:opacity-50 shadow-md flex items-center gap-2 transition-all"
              >
                {isGrading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang mổ xẻ câu C1/C2 &amp; chấm theo Rubric HSGQG...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Chấm bài &amp; Phẫu thuật câu 3 tầng (C1 → C2 Masterpiece)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT PANE: NEC RUBRIC, 3-TIER SENTENCE SURGERY & MODELS (6 COLS) ==================== */}
        <div className="xl:col-span-6 space-y-5">
          {!evaluation ? (
            <div
              className={`rounded-2xl border p-8 text-center ${
                warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-900/10 text-amber-900 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-extrabold mb-2">
                Sẵn sàng chấm điểm &amp; Phẫu thuật câu 3 tầng (HSGQG / DHBB / CPE)
              </h2>
              <p className="text-sm opacity-80 max-w-lg mx-auto mb-6">
                Bấm nút <strong>&ldquo;Chấm bài &amp; Phẫu thuật câu 3 tầng&rdquo;</strong> ở khung bên trái để nhận bảng điểm chi tiết theo 4 tiêu chí NEC, phát hiện lỗi Collocation/Lifting, và nâng cấp từng câu lên chuẩn <strong>C2 National Prize</strong> chỉ với 1 cú nhấp chuột.
              </p>
              <button
                type="button"
                onClick={handleGradeSubmission}
                disabled={isGrading}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-900 text-amber-50 hover:bg-amber-800 inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Chấm thử bài mẫu ngay ({currentPreset.label})
              </button>
            </div>
          ) : (
            <>
              {/* 1. OVERALL NEC RUBRIC SCORE CARD */}
              <div
                className={`rounded-2xl border p-5 shadow-sm ${
                  warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-900/15">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-amber-900 text-amber-50">
                        Band: {evaluation.cefrBand}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-800/15 text-emerald-950 border border-emerald-700/30">
                        Quy đổi thang 20: {evaluation.scaledScore20} / 20.0
                      </span>
                      {autoSavedVocabCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          +{autoSavedVocabCount} C2 Collocations đã lưu vào SM-2 Vault
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-extrabold">
                      Kết quả chấm chuẩn Giám khảo HSGQG ({evaluation.taskType})
                    </h2>
                    <p className="text-xs opacity-85 mt-1 leading-relaxed">
                      {evaluation.examinerOverallVerdictVi}
                    </p>
                  </div>

                  {/* Score Circle / Box */}
                  <div className="shrink-0 rounded-2xl bg-amber-900 text-amber-50 px-5 py-3 text-center shadow-sm">
                    <div className="text-[11px] uppercase tracking-wider text-amber-200 font-semibold">
                      Official Score
                    </div>
                    <div className="text-3xl font-black font-mono">
                      {evaluation.overallScore.toFixed(2)}
                      <span className="text-base font-normal text-amber-200">
                        /{evaluation.maxScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {evaluation.wordCountPenaltyWarning && (
                  <div className="mt-3 rounded-xl bg-amber-100/90 border border-amber-400 px-3.5 py-2 text-xs font-semibold text-amber-950 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>{evaluation.wordCountPenaltyWarning}</span>
                  </div>
                )}

                {/* 4 MINI CRITERION PILLS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-2.5">
                    <div className="text-[11px] font-bold opacity-70">1. Content &amp; Task</div>
                    <div className="text-base font-black font-mono text-amber-950">
                      {evaluation.criteriaBreakdown.contentAndTask.score}/
                      {evaluation.criteriaBreakdown.contentAndTask.maxScore}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">
                      Paraphrase: {evaluation.criteriaBreakdown.contentAndTask.paraphrasingIndex}%
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-2.5">
                    <div className="text-[11px] font-bold opacity-70">2. Organization</div>
                    <div className="text-base font-black font-mono text-amber-950">
                      {evaluation.criteriaBreakdown.organizationAndCohesion.score}/
                      {evaluation.criteriaBreakdown.organizationAndCohesion.maxScore}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Cohesion &amp; Flow</div>
                  </div>

                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-2.5">
                    <div className="text-[11px] font-bold opacity-70">3. Lexical (C1/C2)</div>
                    <div className="text-base font-black font-mono text-amber-950">
                      {evaluation.criteriaBreakdown.lexicalResource.score}/
                      {evaluation.criteriaBreakdown.lexicalResource.maxScore}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Collocations &amp; Idioms</div>
                  </div>

                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-2.5">
                    <div className="text-[11px] font-bold opacity-70">4. Grammar Range</div>
                    <div className="text-base font-black font-mono text-amber-950">
                      {evaluation.criteriaBreakdown.grammaticalRange.score}/
                      {evaluation.criteriaBreakdown.grammaticalRange.maxScore}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">Inversion &amp; Nominalization</div>
                  </div>
                </div>

                {/* NAVIGATION TABS FOR RIGHT PANE */}
                <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-amber-900/15">
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('SURGERY')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeRightTab === 'SURGERY'
                        ? 'bg-amber-900 text-amber-50'
                        : 'bg-[#EAE1D0] text-amber-950 hover:bg-[#DFD4BF]'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Phẫu thuật câu 3 tầng ({evaluation.sentenceSurgeries.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRightTab('RUBRIC')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeRightTab === 'RUBRIC'
                        ? 'bg-amber-900 text-amber-50'
                        : 'bg-[#EAE1D0] text-amber-950 hover:bg-[#DFD4BF]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Chi tiết 4 tiêu chí NEC
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRightTab('VOCAB')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeRightTab === 'VOCAB'
                        ? 'bg-amber-900 text-amber-50'
                        : 'bg-[#EAE1D0] text-amber-950 hover:bg-[#DFD4BF]'
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    C2 Collocations ({evaluation.recommendedC2Collocations.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRightTab('MODELS')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      activeRightTab === 'MODELS'
                        ? 'bg-amber-900 text-amber-50'
                        : 'bg-[#EAE1D0] text-amber-950 hover:bg-[#DFD4BF]'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    Bài mẫu C1+ vs. C2 Giải Nhất
                  </button>
                </div>
              </div>

              {/* TAB 1: INTERACTIVE 3-TIER SENTENCE SURGERY CARDS */}
              {activeRightTab === 'SURGERY' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <Wand2 className="w-4 h-4 text-amber-800" />
                      3-Tier Sentence Surgery (Chọn &ldquo;Thay vào bài của tôi&rdquo; để nâng cấp bài nháp)
                    </h3>
                    <span className="text-xs opacity-75">
                      {Object.keys(appliedSurgeries).length}/{evaluation.sentenceSurgeries.length} câu đã áp dụng
                    </span>
                  </div>

                  {evaluation.sentenceSurgeries.map((item, idx) => {
                    const badge = issueBadgeStyle(item.issueType);
                    const appliedTier = appliedSurgeries[idx];

                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 shadow-sm transition-all ${
                          appliedTier
                            ? 'bg-emerald-50/70 border-emerald-400'
                            : warmPaperMode
                            ? 'bg-[#F5EFE2] border-[#E2D8C3]'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* Header: Sentence # + Issue Type Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                            Câu #{idx + 1}: {badge.label}
                          </span>
                          {appliedTier && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full">
                              <Check className="w-3.5 h-3.5" />
                              Đã thay bản {appliedTier} vào bài nháp
                            </span>
                          )}
                        </div>

                        {/* Tier 0: Student's Original Sentence */}
                        <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-3 mb-2.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mb-0.5">
                            Câu gốc trong bài của bạn (Original Draft):
                          </div>
                          <p className="text-xs md:text-sm font-serif text-rose-950 line-through decoration-rose-500/70">
                            &ldquo;{item.originalSentence}&rdquo;
                          </p>
                          <p className="text-xs text-rose-900 mt-1.5 font-medium">
                            🔍 <strong>Chẩn đoán của Giám khảo:</strong> {item.diagnosisVi}
                          </p>
                        </div>

                        {/* Tier 1: Clean Natural C1 Upgrade */}
                        <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 mb-2.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                              Tier 1 — Band C1 Upgrade (Tự nhiên, chuẩn học thuật):
                            </span>
                            <button
                              type="button"
                              onClick={() => handleApplySentenceSurgery(idx, item, 'C1')}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-400 bg-white text-amber-950 hover:bg-amber-100 transition-colors"
                            >
                              Thay bản C1
                            </button>
                          </div>
                          <p className="text-xs md:text-sm font-serif text-amber-950">
                            &ldquo;{item.upgradedC1}&rdquo;
                          </p>
                        </div>

                        {/* Tier 2: NEC First-Prize C2 Masterpiece */}
                        <div className="rounded-xl bg-emerald-50/95 border-2 border-emerald-500/60 p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-950">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                Tier 2 — C2 National First-Prize Masterpiece:
                              </span>
                              <div className="text-[11px] font-semibold text-emerald-800">
                                Kỹ thuật: {item.keyTechniqueApplied}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplySentenceSurgery(idx, item, 'C2')}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-800 text-white hover:bg-emerald-900 shadow-sm flex items-center gap-1.5 transition-all"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              Thay vào bài của tôi (Apply C2)
                            </button>
                          </div>
                          <p className="text-sm font-serif font-semibold text-emerald-950 leading-relaxed">
                            &ldquo;{item.upgradedC2Masterpiece}&rdquo;
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: DETAILED 4-DIMENSION NEC RUBRIC BREAKDOWN */}
              {activeRightTab === 'RUBRIC' && (
                <div
                  className={`rounded-2xl border p-5 space-y-4 ${
                    warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Criterion 1: Content & Task */}
                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-extrabold text-amber-950">
                        1. Content &amp; Task Fulfillment (Nội dung &amp; Hoàn thành yêu cầu đề)
                      </h4>
                      <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded bg-amber-900 text-amber-50">
                        {evaluation.criteriaBreakdown.contentAndTask.score} /{' '}
                        {evaluation.criteriaBreakdown.contentAndTask.maxScore}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed mb-3">
                      {evaluation.criteriaBreakdown.contentAndTask.feedbackVi}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                        <div className="font-bold text-emerald-900 mb-1">✅ Luận điểm đã bao quát tốt:</div>
                        <ul className="space-y-1 text-emerald-950">
                          {evaluation.criteriaBreakdown.contentAndTask.keyPointsCovered.map((pt, i) => (
                            <li key={i}>• {pt}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                        <div className="font-bold text-amber-900 mb-1">⚠️ Điểm cần bổ sung / Tránh sao chép:</div>
                        <ul className="space-y-1 text-amber-950">
                          {evaluation.criteriaBreakdown.contentAndTask.missedOrDistortedPoints.map((pt, i) => (
                            <li key={i}>• {pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Criterion 2: Organization & Cohesion */}
                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-extrabold text-amber-950">
                        2. Organization &amp; Discourse Cohesion (Mạch lạc &amp; Liên kết học thuật)
                      </h4>
                      <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded bg-amber-900 text-amber-50">
                        {evaluation.criteriaBreakdown.organizationAndCohesion.score} /{' '}
                        {evaluation.criteriaBreakdown.organizationAndCohesion.maxScore}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      {evaluation.criteriaBreakdown.organizationAndCohesion.feedbackVi}
                    </p>
                  </div>

                  {/* Criterion 3: Lexical Resource */}
                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-extrabold text-amber-950">
                        3. Lexical Resource &amp; Collocational Precision (Vốn từ vựng C1/C2)
                      </h4>
                      <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded bg-amber-900 text-amber-50">
                        {evaluation.criteriaBreakdown.lexicalResource.score} /{' '}
                        {evaluation.criteriaBreakdown.lexicalResource.maxScore}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed mb-2">
                      {evaluation.criteriaBreakdown.lexicalResource.feedbackVi}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {evaluation.criteriaBreakdown.lexicalResource.strongExpressionsUsed.map((exp, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-950 border border-amber-300"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Criterion 4: Grammatical Range & Syntactic Complexity */}
                  <div className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-extrabold text-amber-950">
                        4. Grammatical Range: Nominalization, Inversion, Subjunctive &amp; Hedging
                      </h4>
                      <span className="text-sm font-black font-mono px-2.5 py-0.5 rounded bg-amber-900 text-amber-50">
                        {evaluation.criteriaBreakdown.grammaticalRange.score} /{' '}
                        {evaluation.criteriaBreakdown.grammaticalRange.maxScore}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed mb-3">
                      {evaluation.criteriaBreakdown.grammaticalRange.feedbackVi}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg border border-amber-900/20 bg-white p-2">
                        <div className="text-[10px] font-bold uppercase opacity-70">Nominalization</div>
                        <div className="text-base font-black text-amber-900">
                          {evaluation.criteriaBreakdown.grammaticalRange.nominalizationCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-900/20 bg-white p-2">
                        <div className="text-[10px] font-bold uppercase opacity-70">Inversion</div>
                        <div className="text-base font-black text-amber-900">
                          {evaluation.criteriaBreakdown.grammaticalRange.inversionCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-900/20 bg-white p-2">
                        <div className="text-[10px] font-bold uppercase opacity-70">Subjunctive</div>
                        <div className="text-base font-black text-amber-900">
                          {evaluation.criteriaBreakdown.grammaticalRange.subjunctiveCount}
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-900/20 bg-white p-2">
                        <div className="text-[10px] font-bold uppercase opacity-70">Hedging</div>
                        <div className="text-base font-black text-amber-900">
                          {evaluation.criteriaBreakdown.grammaticalRange.hedgingCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RECOMMENDED C2 COLLOCATIONS (AUTO-SAVED TO SM-2 VAULT) */}
              {activeRightTab === 'VOCAB' && (
                <div
                  className={`rounded-2xl border p-5 space-y-3 ${
                    warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-950">
                        Recommended C2 Collocations (Đã tự động lưu vào Anki SM-2 Vault)
                      </h3>
                      <p className="text-xs opacity-75">
                        Các cụm từ học thuật C2 thay thế trực tiếp cho cách diễn đạt B2 trong bài viết của bạn.
                      </p>
                    </div>
                    <a
                      href="/vocab"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-900 text-amber-50 hover:bg-amber-800 shrink-0"
                    >
                      Mở SM-2 Vocab Studio →
                    </a>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {evaluation.recommendedC2Collocations.map((coll, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-amber-900/15 bg-[#FCF9F2] p-3.5 flex flex-col justify-between gap-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-amber-950 font-serif">
                              {coll.collocation}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                              {coll.meaningVi}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                            Thay cho: &ldquo;{coll.replacesWeakPhrase}&rdquo;
                          </span>
                        </div>
                        <p className="text-xs font-serif italic opacity-90">
                          &ldquo;{coll.exampleInContext}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DUAL BENCHMARK MODEL ESSAYS (C1+ VS C2 NATIONAL PRIZE) */}
              {activeRightTab === 'MODELS' && (
                <div
                  className={`rounded-2xl border p-5 space-y-4 ${
                    warmPaperMode ? 'bg-[#F5EFE2] border-[#E2D8C3]' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModelBand('C2')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          activeModelBand === 'C2'
                            ? 'bg-emerald-800 text-white shadow-sm'
                            : 'bg-[#EAE1D0] text-amber-950'
                        }`}
                      >
                        🏆 Band C2 National First-Prize Benchmark
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModelBand('C1_PLUS')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                          activeModelBand === 'C1_PLUS'
                            ? 'bg-amber-900 text-white shadow-sm'
                            : 'bg-[#EAE1D0] text-amber-950'
                        }`}
                      >
                        🥈 Band C1+ Strong Distinction Model
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const textToCopy =
                          activeModelBand === 'C2'
                            ? evaluation.modelEssayC2NationalPrize
                            : evaluation.modelEssayC1Plus;
                        navigator.clipboard.writeText(textToCopy);
                        setCopiedModel(true);
                        setTimeout(() => setCopiedModel(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-900/20 bg-[#FCF9F2] hover:bg-amber-100 flex items-center gap-1"
                    >
                      {copiedModel ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedModel ? 'Đã sao chép!' : 'Copy bài mẫu'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-amber-900/20 bg-[#FCF9F2] p-5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-3 pb-2 border-b border-amber-900/10">
                      <span>
                        {activeModelBand === 'C2'
                          ? '✨ Bài mẫu chuẩn Giải Nhất Quốc Gia (C2 Masterpiece — Nominalization, Inversion & C2 Discourse)'
                          : '📘 Bài mẫu chuẩn C1+ (Diễn đạt tự nhiên, mạch lạc, sát khung từ quy định)'}
                      </span>
                      <span className="font-mono">
                        {(activeModelBand === 'C2'
                          ? evaluation.modelEssayC2NationalPrize
                          : evaluation.modelEssayC1Plus
                        )
                          .trim()
                          .split(/\s+/).length}{' '}
                        words
                      </span>
                    </div>
                    <div className="text-sm md:text-base font-serif leading-relaxed whitespace-pre-line text-[#231E1A]">
                      {activeModelBand === 'C2'
                        ? evaluation.modelEssayC2NationalPrize
                        : evaluation.modelEssayC1Plus}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
