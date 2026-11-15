import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Flame,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Compass,
  Swords,
  Clock,
  HelpCircle,
  Layers,
  Award,
  RefreshCw,
  Play,
  Eye,
  BookmarkPlus,
  Check
} from 'lucide-react';
import {
  ConfidenceLevel,
  evaluateSmartSubmission,
  generateProgressiveCoachingHint,
  shuffleQuestionOptionsForRedemption,
  computeQuestionFingerprint,
  SmartEvaluationResult
} from '../../lib/assessment/smart-test-engine';

export interface AssessmentQuestion {
  id: string;
  number: number;
  type: string;
  points: number;
  stem: string;
  options?: Array<{ id: string; text: string; originalOptionId?: string }>;
  answer: string;
  acceptedAnswers?: string[];
  rootWord?: string;
  keyword?: string;
  promptPrefix?: string;
  explanation?: {
    rule?: string;
    vi?: string;
    en?: string;
    optionAnalysis?: Record<string, string>;
  };
  examId?: string;
  examTitle?: string;
  tournament?: string;
  provinceSchool?: string;
  region?: string;
  fingerprintHash?: string;
  frequencyCount?: number;
  appearedInExams?: string[];
  highFrequencyBadge?: string | null;
  isRedemptionShuffled?: boolean;
  originalAnswerBeforeShuffle?: string;
}

export interface MistakeClinicItem {
  id: string;
  question: AssessmentQuestion;
  diagnosticOutcome: 'LUCKY_GUESS' | 'CRITICAL_TRAP' | 'KNOWLEDGE_GAP' | 'PARTIAL_MASTERY';
  diagnosticLabelVi: string;
  userLastAnswer: string;
  confidenceUsed: ConfidenceLevel;
  recordedAt: string;
  cleared: boolean;
}

export interface DiagnosticAssessmentHubProps {
  exams?: any[];
  onSaveVocab?: (item: any) => void;
  onRefreshExams?: () => void;
}

const INITIAL_MISTAKE_CLINIC_SEED: MistakeClinicItem[] = [
  {
    id: 'mc-seed-1',
    diagnosticOutcome: 'CRITICAL_TRAP',
    diagnosticLabelVi: '🚨 Critical Trap / Blindspot (Sập bẫy đảo ngữ dù cược 100% Chắc chắn)',
    userLastAnswer: 'B',
    confidenceUsed: 'CERTAIN',
    recordedAt: '10 phút trước',
    cleared: false,
    question: {
      id: 'pt-hv-q1',
      number: 1,
      type: 'mcq',
      points: 2,
      stem: 'Not until the forensic audit was published ________ the full scale of the liquidity crisis.',
      options: [
        { id: 'A', text: 'did the shareholders comprehend' },
        { id: 'B', text: 'the shareholders comprehended' },
        { id: 'C', text: 'had the shareholders comprehended' },
        { id: 'D', text: 'would the shareholders comprehend' }
      ],
      answer: 'A',
      tournament: 'TRAI_HE_HUNG_VUONG',
      provinceSchool: 'Phú Thọ (THPT Chuyên Hùng Vương)',
      frequencyCount: 3,
      appearedInExams: ['Phú Thọ', 'Nam Định', 'Olympic 30/4'],
      highFrequencyBadge:
        '🔥 High-Frequency Badge: Xuất hiện trong 3 đề thi (Phú Thọ, Nam Định, Olympic 30/4)',
      explanation: {
        rule: 'Negative Adverbial Inversion (Not until + clause + Aux + S + V)',
        vi: 'Cấu trúc đảo ngữ với "Not until": Mệnh đề phụ giữ nguyên trật tự (was published), mệnh đề chính đảo trợ động từ quá khứ đơn "did + S + V(inf)" (did the shareholders comprehend).',
        optionAnalysis: {
          A: 'ĐÚNG: Đảo ngữ chuẩn ở mệnh đề chính (did + S + V nguyên mẫu).',
          B: 'SAI: Bẫy phổ biến nhất — quên đảo ngữ ở mệnh đề chính.',
          C: 'SAI: Sai phối thì (Quá khứ hoàn thành không dùng cho hành động xảy ra sau).',
          D: 'SAI: Sai nghĩa tình thái.'
        }
      }
    }
  },
  {
    id: 'mc-seed-2',
    diagnosticOutcome: 'LUCKY_GUESS',
    diagnosticLabelVi: '⚠️ Lucky Guess (Đúng ăn may khi chọn 🔴 Đoán mò — Cần kiểm tra lại)',
    userLastAnswer: 'A',
    confidenceUsed: 'GUESS',
    recordedAt: '25 phút trước',
    cleared: false,
    question: {
      id: 'pt-hv-q2',
      number: 2,
      type: 'mcq',
      points: 2,
      stem: 'The minister’s evasive testimony merely served to ________ rumours of a cabinet rift.',
      options: [
        { id: 'A', text: 'give currency to' },
        { id: 'B', text: 'pay lip service to' },
        { id: 'C', text: 'cast aspersions on' },
        { id: 'D', text: 'make no bones about' }
      ],
      answer: 'A',
      tournament: 'HSG_TINH',
      provinceSchool: 'Nghệ An (THPT Chuyên Phan Bội Châu)',
      frequencyCount: 2,
      appearedInExams: ['Phú Thọ', 'Nghệ An'],
      highFrequencyBadge: '🔥 High-Frequency Badge: Xuất hiện trong 2 đề thi (Phú Thọ, Nghệ An)',
      explanation: {
        rule: 'C2 Idiomatic Collocation: give currency to something',
        vi: '"Give currency to (rumours/ideas)" = làm lan truyền, khiến một tin đồn/quan điểm trở nên phổ biến.',
        optionAnalysis: {
          A: 'ĐÚNG: give currency to rumours = làm lan truyền tin đồn.',
          B: 'SAI: pay lip service to = chỉ ủng hộ ngoài miệng.',
          C: 'SAI: cast aspersions on = gièm pha, bôi nhọ.',
          D: 'SAI: make no bones about = thẳng thắn không giấu giếm.'
        }
      }
    }
  },
  {
    id: 'mc-seed-3',
    diagnosticOutcome: 'PARTIAL_MASTERY',
    diagnosticLabelVi: '🌓 Partial Credit (0.5x — Thiếu giới từ "about" trong cấu trúc make no bones about)',
    userLastAnswer: "The auditor made no bones criticizing the board's reckless fiscal policy",
    confidenceUsed: 'FIFTY_FIFTY',
    recordedAt: 'Hôm qua',
    cleared: false,
    question: {
      id: 'pt-hv-q4',
      number: 3,
      type: 'sentence_transformation',
      points: 2,
      keyword: 'BONES',
      promptPrefix: 'The auditor made',
      stem: 'The auditor did not hesitate to criticize the board’s reckless fiscal policy. (BONES)',
      answer: "The auditor made no bones about criticizing the board's reckless fiscal policy",
      acceptedAnswers: [
        "The auditor made no bones about criticizing the board's reckless fiscal policy",
        "The auditor made no bones about criticising the board's reckless fiscal policy"
      ],
      tournament: 'CHON_DOI_TUYEN',
      provinceSchool: 'Nam Định (THPT Chuyên Lê Hồng Phong)',
      frequencyCount: 3,
      appearedInExams: ['Phú Thọ', 'Nam Định', 'Olympic 30/4'],
      highFrequencyBadge:
        '🔥 High-Frequency Badge: Xuất hiện trong 3 đề thi (Phú Thọ, Nam Định, Olympic 30/4)',
      explanation: {
        rule: 'C2 Idiom: make no bones about + V-ing',
        vi: 'Cấu trúc bắt buộc có giới từ "about": make no bones about doing something (thẳng thắn, không ngần ngại làm gì).'
      }
    }
  }
];

export const DiagnosticAssessmentHub: React.FC<DiagnosticAssessmentHubProps> = ({
  exams = [],
  onSaveVocab,
  onRefreshExams
}) => {
  // Top-level sub-view: 'matrix' | 'arena' | 'clinic' | 'harvester'
  const [activeTab, setActiveTab] = useState<'matrix' | 'arena' | 'clinic' | 'harvester'>('arena');

  // Harvester & 63-Province Directory state
  const [harvesterData, setHarvesterData] = useState<any>(null);
  const [harvesting, setHarvesting] = useState<boolean>(false);
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Mode 1: Custom Exam Matrix Builder Configuration
  const [durationMinutes, setDurationMinutes] = useState<15 | 45 | 90 | 180>(45);
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([
    'HSGQG',
    'DHBB',
    'TRAI_HE_HUNG_VUONG',
    'OLYMPIC_30_4',
    'CHON_DOI_TUYEN',
    'HSG_TINH'
  ]);
  const [mcqCount, setMcqCount] = useState<number>(4);
  const [wfCount, setWfCount] = useState<number>(3);
  const [readingCount, setReadingCount] = useState<number>(2);
  const [transformCount, setTransformCount] = useState<number>(2);
  const [smartFilter, setSmartFilter] = useState<
    'ALL' | 'HIGH_FREQUENCY' | 'UNSEEN_ONLY' | 'WEAK_GRAMMAR_TAGS'
  >('ALL');

  // Active Arena Questions & Per-Question State
  const [arenaQuestions, setArenaQuestions] = useState<AssessmentQuestion[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [confidences, setConfidences] = useState<Record<string, ConfidenceLevel>>({});
  const [attemptCounts, setAttemptCounts] = useState<Record<string, 1 | 2 | 3>>({});
  const [evaluations, setEvaluations] = useState<Record<string, SmartEvaluationResult>>({});
  const [coachingHints, setCoachingHints] = useState<
    Record<string, { morphHint?: string; skeletonHint?: string }>
  >({});
  const [isRedemptionBossMode, setIsRedemptionBossMode] = useState<boolean>(false);

  // Mode 5: Mistake Clinic state
  const [mistakeClinic, setMistakeClinic] = useState<MistakeClinicItem[]>(
    INITIAL_MISTAKE_CLINIC_SEED
  );
  const [savedVocabKeys, setSavedVocabKeys] = useState<Record<string, boolean>>({});

  // Flatten all questions across all exams in DB and enrich with cross-exam frequency badges
  const allPoolQuestions: AssessmentQuestion[] = useMemo(() => {
    const list: AssessmentQuestion[] = [];
    const fpMap = new Map<string, { count: number; origins: Set<string> }>();

    exams.forEach(ex => {
      const originShort = ex.province_school
        ? ex.province_school.split('(')[0].trim()
        : `${ex.tournament} ${ex.year}`;
      const originLabel =
        ex.tournament === 'Olympic 30/4' || ex.tournament === 'OLYMPIC_30_4'
          ? 'Olympic 30/4'
          : originShort;

      const sections = ex.sections || {};
      ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach(secKey => {
        const parts = sections[secKey]?.parts || [];
        parts.forEach((part: any) => {
          (part.questions || []).forEach((q: any) => {
            const fp = q.fingerprintHash || computeQuestionFingerprint(q);
            if (!fpMap.has(fp)) {
              fpMap.set(fp, { count: 0, origins: new Set() });
            }
            const entry = fpMap.get(fp)!;
            entry.count++;
            entry.origins.add(originLabel);

            list.push({
              ...q,
              examId: ex.id,
              examTitle: ex.title,
              tournament: ex.tournament,
              provinceSchool: ex.province_school,
              region: ex.region || 'National',
              fingerprintHash: fp
            });
          });
        });
      });
    });

    return list.map(q => {
      const entry = fpMap.get(q.fingerprintHash!);
      const freq = q.frequencyCount || (entry ? entry.count : 1);
      const origins =
        Array.isArray(q.appearedInExams) && q.appearedInExams.length > 0
          ? q.appearedInExams
          : entry
          ? Array.from(entry.origins)
          : [];
      const badge =
        q.highFrequencyBadge ||
        (freq >= 2
          ? `🔥 High-Frequency Badge: Xuất hiện trong ${freq} đề thi (${origins.join(', ')})`
          : null);

      return {
        ...q,
        frequencyCount: freq,
        appearedInExams: origins,
        highFrequencyBadge: badge
      };
    });
  }, [exams]);

  // Fetch Harvester & 63-Province directory stats
  const fetchHarvesterTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/harvester/run');
      if (res.ok) {
        setHarvesterData(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchHarvesterTelemetry();
  }, [fetchHarvesterTelemetry]);

  // Initialize Arena with a rich curated set of questions (including cross-province high-frequency items)
  useEffect(() => {
    if (arenaQuestions.length === 0 && allPoolQuestions.length > 0) {
      // Prioritize high-frequency cross-province questions + diverse question types
      const sorted = [...allPoolQuestions].sort(
        (a, b) => (b.frequencyCount || 1) - (a.frequencyCount || 1)
      );
      const selected = sorted.slice(0, 10).map((q, idx) => ({
        ...q,
        number: idx + 1
      }));
      setArenaQuestions(selected);
    }
  }, [allPoolQuestions, arenaQuestions.length]);

  const currentQuestion: AssessmentQuestion | null =
    arenaQuestions[activeQuestionIdx] || arenaQuestions[0] || null;

  // Keyboard shortcuts for Mode 2 Confidence Betting: Z (CERTAIN), X (FIFTY_FIFTY), C (GUESS)
  useEffect(() => {
    if (activeTab !== 'arena' || !currentQuestion) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'z') {
        setConfidences(prev => ({ ...prev, [currentQuestion.id]: 'CERTAIN' }));
      } else if (k === 'x') {
        setConfidences(prev => ({ ...prev, [currentQuestion.id]: 'FIFTY_FIFTY' }));
      } else if (k === 'c') {
        setConfidences(prev => ({ ...prev, [currentQuestion.id]: 'GUESS' }));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, currentQuestion]);

  // Build Custom Matrix Test (Mode 1)
  const handleBuildMatrixExam = () => {
    let pool = [...allPoolQuestions];
    if (smartFilter === 'HIGH_FREQUENCY') {
      const hf = pool.filter(q => (q.frequencyCount || 1) >= 2);
      if (hf.length > 0) pool = hf;
    }

    const mcqs = pool.filter(q => q.type === 'mcq').slice(0, mcqCount);
    const wfs = pool.filter(q => q.type === 'word_formation').slice(0, wfCount);
    const reads = pool
      .filter(q => q.type === 'open_cloze' || q.type === 'tfng' || q.type === 'gapped_text')
      .slice(0, readingCount);
    const transforms = pool
      .filter(q => q.type === 'sentence_transformation')
      .slice(0, transformCount);

    const combined = [...mcqs, ...wfs, ...reads, ...transforms].map((q, idx) => ({
      ...q,
      number: idx + 1
    }));

    if (combined.length > 0) {
      setArenaQuestions(combined);
      setActiveQuestionIdx(0);
      setUserAnswers({});
      setEvaluations({});
      setAttemptCounts({});
      setCoachingHints({});
      setIsRedemptionBossMode(false);
      setActiveTab('arena');
    }
  };

  // Mode 2, 3, 4: Check / Submit Single Question with 3-Try Progressive Coaching & Confidence Betting
  const handleCheckArenaQuestion = (q: AssessmentQuestion) => {
    const uAns = userAnswers[q.id] || '';
    const conf: ConfidenceLevel = confidences[q.id] || 'CERTAIN';
    const currentAttempt: 1 | 2 | 3 = attemptCounts[q.id] || 1;
    const isCoachableType =
      q.type === 'word_formation' ||
      q.type === 'open_cloze' ||
      q.type === 'sentence_transformation' ||
      q.type === 'error_correction';

    const evalRes = evaluateSmartSubmission(q, uAns, conf, currentAttempt);

    // Mode 3: 3-Try Progressive Coaching — If wrong on Attempt 1 or 2 for non-MCQ types, DO NOT leak answer key yet!
    if (!evalRes.isCorrect && isCoachableType && currentAttempt < 3) {
      const nextAttempt = (currentAttempt + 1) as 2 | 3;
      const hintObj = generateProgressiveCoachingHint(q, nextAttempt);
      setAttemptCounts(prev => ({ ...prev, [q.id]: nextAttempt }));
      setCoachingHints(prev => ({
        ...prev,
        [q.id]: {
          morphHint: hintObj.morphologicalHintVi,
          skeletonHint: nextAttempt === 3 ? hintObj.letterSkeletonHint : undefined
        }
      }));
      return;
    }

    // Final evaluation (Correct, or MCQ, or Attempt 3 reached)
    setEvaluations(prev => ({ ...prev, [q.id]: evalRes }));

    // Mode 5: If in Redemption Boss Mode and student achieved SOLID_MASTERY, clear from Mistake Clinic!
    if (isRedemptionBossMode && evalRes.diagnosticOutcome === 'SOLID_MASTERY') {
      setMistakeClinic(prev =>
        prev.map(item =>
          item.question.id === q.id || item.question.stem === q.stem
            ? { ...item, cleared: true }
            : item
        )
      );
    }

    // Automatically push Lucky Guesses, Critical Traps, Partial Credits, and Wrong answers to Mistake Clinic
    if (evalRes.shouldScheduleRedemption && evalRes.diagnosticOutcome !== 'SOLID_MASTERY') {
      setMistakeClinic(prev => {
        const exists = prev.some(m => m.question.stem === q.stem);
        if (exists) {
          return prev.map(m =>
            m.question.stem === q.stem
              ? {
                  ...m,
                  diagnosticOutcome: evalRes.diagnosticOutcome as any,
                  diagnosticLabelVi: evalRes.diagnosticLabelVi,
                  userLastAnswer: uAns || '(Blank)',
                  confidenceUsed: conf,
                  recordedAt: 'Vừa xong',
                  cleared: false
                }
              : m
          );
        }
        return [
          {
            id: `mc-${Date.now()}-${q.id}`,
            question: q,
            diagnosticOutcome: evalRes.diagnosticOutcome as any,
            diagnosticLabelVi: evalRes.diagnosticLabelVi,
            userLastAnswer: uAns || '(Blank)',
            confidenceUsed: conf,
            recordedAt: 'Vừa xong',
            cleared: false
          },
          ...prev
        ];
      });
    }
  };

  // Mode 5: Launch Redemption Boss Fight (Shuffles Option Order A, B, C, D)
  const handleLaunchRedemptionBossFight = () => {
    const activeMistakes = mistakeClinic.filter(m => !m.cleared);
    const sourceList = activeMistakes.length > 0 ? activeMistakes : mistakeClinic;
    const shuffledQuestions = sourceList.map((m, idx) => {
      const shuffled = shuffleQuestionOptionsForRedemption(m.question);
      return {
        ...shuffled,
        number: idx + 1
      };
    });

    setArenaQuestions(shuffledQuestions);
    setActiveQuestionIdx(0);
    setUserAnswers({});
    setEvaluations({});
    setAttemptCounts({});
    setCoachingHints({});
    setIsRedemptionBossMode(true);
    setActiveTab('arena');
  };

  // Pillar 1: Run National 63-Province Harvester
  const handleRunHarvester = async () => {
    setHarvesting(true);
    try {
      const res = await fetch('/api/harvester/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setHarvesterData(data);
        if (onRefreshExams) onRefreshExams();
      }
    } catch {
      // ignore
    } finally {
      setHarvesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Header & 4-Mode Navigation Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 border border-indigo-500/30 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              63-PROVINCE HARVESTER & 5-MODE NEXT-GEN DIAGNOSTIC ASSESSMENT HUB
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Hệ Thống Đánh Giá Chẩn Đoán Thế Hệ Mới & Thu Thập Đề Chuyên 63 Tỉnh Thành
            </h2>
            <p className="text-xs md:text-sm text-slate-300">
              Tự lắp ghép đề theo ma trận • Đặt cược độ tự tin (Z/X/C) phát hiện Lucky Guess & Critical Trap • Chấm gợi mở 3 bước (100% → 70% → 40%) • Visual Word Diff • Phòng Phục Thù Đảo Đáp Án.
            </p>
          </div>

          {/* 4 Sub-Tab Switchers */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'arena', label: '🎯 Diagnostic Arena (Modes 2–4)', icon: Sparkles },
              { id: 'matrix', label: '🧩 Matrix Builder (Mode 1)', icon: Sliders },
              {
                id: 'clinic',
                label: `⚔️ Mistake Clinic (${mistakeClinic.filter(m => !m.cleared).length})`,
                icon: Swords
              },
              { id: 'harvester', label: '🗺️ 63-Province Harvester', icon: Compass }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: INTERACTIVE DIAGNOSTIC ASSESSMENT ARENA (MODES 2, 3, 4 & REDEMPTION)
         ===================================================================== */}
      {activeTab === 'arena' && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Active Question Card with Confidence Betting, 3-Try Coaching & Visual Diff */}
          <div className="lg:col-span-8 space-y-4">
            {isRedemptionBossMode && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-extrabold text-rose-600 dark:text-rose-300">
                  <Swords className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>
                    REDEMPTION BOSS FIGHT ACTIVE: Thứ tự đáp án (A, B, C, D) đã được đảo ngẫu nhiên! Hãy chọn đáp án ĐÚNG kèm độ tự tin 🟢 100% Chắc chắn để xóa lỗi khỏi Mistake Clinic.
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500/30 shadow-xl space-y-5">
              {/* Top Question Metadata & Cross-Province High-Frequency Badge */}
              <div className="space-y-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-mono text-xs font-black">
                      Question #{currentQuestion.number} / {arenaQuestions.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {currentQuestion.type === 'mcq' && 'Multiple Choice (A, B, C, D)'}
                      {currentQuestion.type === 'word_formation' &&
                        `Word Formation • ROOT: ${currentQuestion.rootWord}`}
                      {currentQuestion.type === 'sentence_transformation' &&
                        `Sentence Transformation • KEYWORD: ${currentQuestion.keyword}`}
                      {currentQuestion.type === 'open_cloze' && 'Open Cloze (1 Word)'}
                    </span>
                    {currentQuestion.provinceSchool && (
                      <span className="px-2.5 py-1 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300 text-xs font-bold">
                        {currentQuestion.provinceSchool}
                      </span>
                    )}
                  </div>

                  {/* 3-Try Progressive Coaching Multiplier Pill */}
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Attempt #{attemptCounts[currentQuestion.id] || 1}/3 • Multiplier:{' '}
                    {(attemptCounts[currentQuestion.id] || 1) === 1
                      ? '100% pts'
                      : (attemptCounts[currentQuestion.id] || 1) === 2
                      ? '70% pts'
                      : '40% pts'}
                  </span>
                </div>

                {/* 🔥 High-Frequency Cross-Province Badge */}
                {currentQuestion.highFrequencyBadge && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-extrabold">
                    <span>{currentQuestion.highFrequencyBadge}</span>
                    {currentQuestion.fingerprintHash && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20">
                        {currentQuestion.fingerprintHash}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Question Stem */}
              <p className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQuestion.stem}
              </p>

              {/* MODE 2: CONFIDENCE-BETTING SELECTOR (Z / X / C) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Mode 2: Đặt Cược Độ Tự Tin (Confidence-Betting — Phím tắt Z / X / C):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Phát hiện Đúng Ăn May (Lucky Guess) vs. Sập Bẫy Đề Thi (Critical Trap)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      level: 'CERTAIN' as ConfidenceLevel,
                      key: 'Z',
                      label: '🟢 100% Chắc chắn (CERTAIN)',
                      desc: 'Nắm vững quy tắc C1/C2',
                      activeCls: 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                    },
                    {
                      level: 'FIFTY_FIFTY' as ConfidenceLevel,
                      key: 'X',
                      label: '🟡 Phân vân 50/50 (FIFTY_FIFTY)',
                      desc: 'Loại được 2 đáp án nhiễu',
                      activeCls: 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20'
                    },
                    {
                      level: 'GUESS' as ConfidenceLevel,
                      key: 'C',
                      label: '🔴 Đoán mò (GUESS)',
                      desc: 'Chưa biết cấu trúc này',
                      activeCls: 'border-rose-500 bg-rose-500/15 text-rose-800 dark:text-rose-200 ring-2 ring-rose-500/20'
                    }
                  ].map(cBtn => {
                    const currentConf = confidences[currentQuestion.id] || 'CERTAIN';
                    const isSelected = currentConf === cBtn.level;
                    return (
                      <button
                        key={cBtn.level}
                        type="button"
                        onClick={() =>
                          setConfidences(prev => ({ ...prev, [currentQuestion.id]: cBtn.level }))
                        }
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? cBtn.activeCls
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-extrabold">
                          <span>{cBtn.label}</span>
                          <kbd className="px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">
                            {cBtn.key}
                          </kbd>
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5">{cBtn.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Answer Input Area */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options.map(opt => {
                    const selected =
                      String(userAnswers[currentQuestion.id] || '').toUpperCase() ===
                      String(opt.id).toUpperCase();
                    const evalDone = evaluations[currentQuestion.id];
                    const isRight =
                      String(currentQuestion.answer).toUpperCase() === String(opt.id).toUpperCase();

                    let optCls =
                      'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-indigo-500/50';
                    if (evalDone) {
                      if (isRight) {
                        optCls =
                          'border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold';
                      } else if (selected && !isRight) {
                        optCls =
                          'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200';
                      }
                    } else if (selected) {
                      optCls =
                        'border-indigo-500 bg-indigo-500/15 text-indigo-900 dark:text-indigo-100 font-bold';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.id }))
                        }
                        className={`p-3.5 rounded-xl border text-left text-sm flex items-start gap-3 transition ${optCls}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {opt.id}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                        {opt.originalOptionId && opt.originalOptionId !== opt.id && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-400">
                            Shuffled from {opt.originalOptionId}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  {currentQuestion.promptPrefix && (
                    <div className="text-xs text-slate-500">
                      Prompt starter:{' '}
                      <strong className="text-slate-900 dark:text-white">
                        "{currentQuestion.promptPrefix}..."
                      </strong>
                    </div>
                  )}
                  <input
                    type="text"
                    value={userAnswers[currentQuestion.id] || ''}
                    onFocus={() => {
                      if (!userAnswers[currentQuestion.id] && currentQuestion.promptPrefix) {
                        setUserAnswers(prev => ({
                          ...prev,
                          [currentQuestion.id]: `${currentQuestion.promptPrefix} `
                        }));
                      }
                    }}
                    onChange={e =>
                      setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))
                    }
                    placeholder={
                      currentQuestion.rootWord
                        ? `Nhập từ phái sinh của ${currentQuestion.rootWord}...`
                        : currentQuestion.promptPrefix
                        ? `${currentQuestion.promptPrefix} ...`
                        : 'Nhập câu trả lời của bạn...'
                    }
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 text-sm md:text-base font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* MODE 3: 3-TRY PROGRESSIVE COACHING HINTS (SHOWN WHEN ATTEMPT 2 OR 3 IS UNLOCKED BEFORE ANSWER REVEAL) */}
              {coachingHints[currentQuestion.id]?.morphHint && !evaluations[currentQuestion.id] && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Mode 3: 3-Try Progressive Coaching (Chưa lộ đáp án — Hãy thử lại!):
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
                    {coachingHints[currentQuestion.id].morphHint}
                  </p>
                  {coachingHints[currentQuestion.id]?.skeletonHint && (
                    <div className="p-3 rounded-xl bg-slate-900 text-amber-300 font-mono text-sm md:text-base font-black tracking-widest text-center">
                      Letter Skeleton (Attempt 3 — 40% pts):{' '}
                      {coachingHints[currentQuestion.id].skeletonHint}
                    </div>
                  )}
                </div>
              )}

              {/* Check / Next Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCheckArenaQuestion(currentQuestion)}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {coachingHints[currentQuestion.id] && !evaluations[currentQuestion.id]
                    ? `Nộp Lại Lượt #${attemptCounts[currentQuestion.id] || 2} (Progressive Coaching)`
                    : 'Chấm Chẩn Đoán (Evaluate with Confidence & Diff)'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx(prev => Math.max(0, prev - 1))}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
                  >
                    ← Câu trước
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveQuestionIdx(prev => (prev + 1) % Math.max(1, arenaQuestions.length))
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold"
                  >
                    Câu tiếp theo →
                  </button>
                </div>
              </div>

              {/* DIAGNOSTIC EVALUATION BREAKDOWN + MODE 4 WORD-BY-WORD VISUAL DIFF */}
              {evaluations[currentQuestion.id] && (
                <div className="pt-5 border-t-2 border-slate-200 dark:border-slate-800 space-y-4">
                  {/* Diagnostic Outcome Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      evaluations[currentQuestion.id].diagnosticBadgeColor
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs md:text-sm font-black">
                        {evaluations[currentQuestion.id].diagnosticLabelVi}
                      </div>
                      <div className="text-xs opacity-85">
                        Độ tự tin đã cược: <strong>{evaluations[currentQuestion.id].confidence}</strong> • Lượt thử:{' '}
                        <strong>#{evaluations[currentQuestion.id].attemptNumber}</strong> (Hệ số:{' '}
                        {Math.round(evaluations[currentQuestion.id].scoreMultiplier * 100)}%)
                      </div>
                    </div>
                    <div className="font-mono text-base font-black shrink-0">
                      +{evaluations[currentQuestion.id].awardedPoints} /{' '}
                      {evaluations[currentQuestion.id].basePoints} pts
                    </div>
                  </div>

                  {/* MODE 4: COLOR-CODED WORD-BY-WORD VISUAL DIFF */}
                  {currentQuestion.type !== 'mcq' && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>Mode 4: Word-by-Word Visual Diff & Partial Credit Analysis</span>
                        <span className="font-mono text-emerald-500">
                          Key: {currentQuestion.answer}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-sm font-mono">
                        {evaluations[currentQuestion.id].wordDiff.map((tok, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded font-bold ${
                              tok.status === 'matched'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                : tok.status === 'missing'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-dashed border-amber-500'
                                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 line-through'
                            }`}
                            title={
                              tok.status === 'matched'
                                ? 'Matched word (Khớp chính xác)'
                                : tok.status === 'missing'
                                ? 'Missing target word (Từ còn thiếu trong đáp án)'
                                : 'Extra / Wrong word (Từ thừa hoặc sai)'
                            }
                          >
                            {tok.status === 'missing' ? `[+${tok.text}]` : tok.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full C1/C2 Explanation */}
                  {currentQuestion.explanation && (
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2 text-xs md:text-sm">
                      {currentQuestion.explanation.rule && (
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-xs">
                          Chủ điểm C1/C2: {currentQuestion.explanation.rule}
                        </div>
                      )}
                      {currentQuestion.explanation.vi && (
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          <strong className="text-slate-900 dark:text-white">Giải thích:</strong>{' '}
                          {currentQuestion.explanation.vi}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Cols: Question Palette & Live Diagnostic Summary */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Bảng Điều Hướng & Chẩn Đoán</span>
                <span className="text-xs font-mono text-indigo-500">
                  {Object.keys(evaluations).length}/{arenaQuestions.length} đã chấm
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {arenaQuestions.map((q, idx) => {
                  const ev = evaluations[q.id];
                  const active = idx === activeQuestionIdx;
                  let btnCls =
                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
                  if (ev) {
                    if (ev.diagnosticOutcome === 'SOLID_MASTERY') {
                      btnCls = 'bg-emerald-600 text-white border-emerald-500';
                    } else if (ev.diagnosticOutcome === 'LUCKY_GUESS') {
                      btnCls = 'bg-amber-500 text-slate-950 border-amber-400 font-black';
                    } else if (ev.diagnosticOutcome === 'CRITICAL_TRAP') {
                      btnCls = 'bg-rose-600 text-white border-rose-500 font-black';
                    } else {
                      btnCls = 'bg-indigo-600 text-white border-indigo-500';
                    }
                  }
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveQuestionIdx(idx)}
                      className={`h-10 rounded-xl border font-mono text-xs font-bold flex items-center justify-center transition ${btnCls} ${
                        active ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''
                      }`}
                    >
                      {q.number}
                    </button>
                  );
                })}
              </div>

              {/* Quick Legend */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>✅ Solid Mastery (Đúng + Chắc chắn)</span>
                  <span className="font-mono font-bold text-emerald-500">
                    {
                      Object.values(evaluations).filter(
                        e => e.diagnosticOutcome === 'SOLID_MASTERY'
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>⚠️ Lucky Guess (Đúng ăn may)</span>
                  <span className="font-mono font-bold text-amber-500">
                    {
                      Object.values(evaluations).filter(
                        e => e.diagnosticOutcome === 'LUCKY_GUESS'
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>🚨 Critical Trap (Sập bẫy đề thi)</span>
                  <span className="font-mono font-bold text-rose-500">
                    {
                      Object.values(evaluations).filter(
                        e => e.diagnosticOutcome === 'CRITICAL_TRAP'
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MODE 1 — CUSTOM EXAM MATRIX BUILDER ("TỰ LẮP GHÉP ĐỀ THEO MA TRẬN")
         ===================================================================== */}
      {activeTab === 'matrix' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
              MODE 1: CUSTOM EXAM MATRIX BUILDER
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Tự Lắp Ghép Đề Thi Chuyên Anh Theo Ma Trận Trong 10 Giây
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn thời lượng, nguồn đề các tỉnh/kỳ thi, tỷ lệ câu hỏi và bộ lọc tần suất cao để tạo đề luyện tập cá nhân hóa.
            </p>
          </div>

          {/* Step 1: Time Limit */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              1. Chọn Thời Lượng Làm Bài (Time Limit):
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { mins: 15 as const, title: '15m Blitz', desc: 'Luyện nhanh 10–15 câu trọng tâm' },
                { mins: 45 as const, title: '45m Period', desc: 'Kiểm tra 1 tiết chuyên sâu' },
                { mins: 90 as const, title: '90m Half-Mock', desc: 'Nửa đề thi chọn đội tuyển' },
                { mins: 180 as const, title: '180m Full Simulation', desc: 'Mô phỏng chuẩn HSGQG / DHBB' }
              ].map(t => (
                <button
                  key={t.mins}
                  type="button"
                  onClick={() => setDurationMinutes(t.mins)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    durationMinutes === t.mins
                      ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                  }`}
                >
                  <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {t.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Question Mix Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'MCQ Lexico-Grammar', val: mcqCount, set: setMcqCount, max: 15 },
              { label: 'Word Formation (Inline/Passage)', val: wfCount, set: setWfCount, max: 10 },
              { label: 'Reading / Open Cloze / Gapped Text', val: readingCount, set: setReadingCount, max: 10 },
              { label: 'Sentence Transformation', val: transformCount, set: setTransformCount, max: 10 }
            ].map(item => (
              <div
                key={item.label}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="flex justify-between text-xs font-bold">
                  <span>{item.label}</span>
                  <span className="font-mono text-indigo-500">{item.val} câu</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={item.max}
                  value={item.val}
                  onChange={e => item.set(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            ))}
          </div>

          {/* Step 3: Smart Filter */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              3. Bộ Lọc Thông Minh (Smart Question Filter):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { id: 'ALL', label: 'Tất cả câu hỏi phù hợp' },
                { id: 'HIGH_FREQUENCY', label: '🔥 Câu hỏi tần suất cao liên tỉnh (High-Frequency)' },
                { id: 'UNSEEN_ONLY', label: '✨ Chỉ câu chưa từng làm (Unseen Only)' },
                { id: 'WEAK_GRAMMAR_TAGS', label: '🎯 Chủ điểm ngữ pháp yếu (Weak Tags)' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSmartFilter(f.id as any)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                    smartFilter === f.id
                      ? 'border-indigo-500 bg-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBuildMatrixExam}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4" />
            ⚡ Lắp Ghép Đề Ngay ({mcqCount + wfCount + readingCount + transformCount} câu • {durationMinutes} phút) & Bắt Đầu Chẩn Đoán
          </button>
        </div>
      )}

      {/* =====================================================================
          TAB 3: MODE 5 — MISTAKE CLINIC & SPACED REDEMPTION BOSS FIGHT
         ===================================================================== */}
      {activeTab === 'clinic' && (
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
                MODE 5: MISTAKE CLINIC & SPACED REDEMPTION TEST (PHÒNG PHỤC THÙ LỖI SAI)
              </div>
              <h3 className="text-xl font-black text-white">
                Kho Lưu Trữ Critical Traps, Lucky Guesses & Lỗi Sai Cần Phục Thù ({mistakeClinic.length} câu)
              </h3>
              <p className="text-xs text-slate-300">
                Khi khởi động Redemption Boss Fight, hệ thống sẽ tự động đảo vị trí các phương án (A, B, C, D) để kiểm tra bản chất thật sự.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchRedemptionBossFight}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs md:text-sm font-black flex items-center gap-2 shadow-xl shadow-rose-600/30 shrink-0 transition"
            >
              <Swords className="w-4 h-4" />
              ⚔️ Khởi Động Redemption Boss Fight (Shuffle A-B-C-D)
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mistakeClinic.map(item => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition ${
                  item.cleared
                    ? 'border-emerald-500/40 bg-emerald-500/5 opacity-75'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      item.diagnosticOutcome === 'CRITICAL_TRAP'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                        : item.diagnosticOutcome === 'LUCKY_GUESS'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                    }`}
                  >
                    {item.diagnosticLabelVi}
                  </span>

                  <span className="text-xs font-mono text-slate-400">
                    {item.question.provinceSchool} • {item.recordedAt}
                  </span>
                </div>

                <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-2">
                  {item.question.stem}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div>
                    Bài làm trước: <strong className="text-rose-500 font-mono">{item.userLastAnswer}</strong> • Đáp án chuẩn:{' '}
                    <strong className="text-emerald-500 font-mono">{item.question.answer}</strong>
                  </div>
                  {item.question.highFrequencyBadge && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      {item.question.highFrequencyBadge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: PILLAR 1 — NATIONAL 63-PROVINCE HARVESTER & CROSS-EXAM DEDUPLICATION
         ===================================================================== */}
      {activeTab === 'harvester' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
                PILLAR 1: NATIONAL MULTI-PROVINCE EXAM HARVESTER & FINGERPRINTING
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
                Hệ Thống Quét Đề Chuyên 63 Tỉnh Thành & Phát Hiện Câu Hỏi Trùng Lặp Liên Tỉnh
              </h3>
              <p className="text-xs text-slate-500">
                Tự động băm nội dung câu hỏi (`fingerprintHash`) để liên kết các câu hỏi xuất hiện lặp lại giữa DHBB, Trại hè Hùng Vương, Olympic 30/4 và Đề HSG Tỉnh.
              </p>
            </div>

            <button
              type="button"
              disabled={harvesting}
              onClick={handleRunHarvester}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-black flex items-center gap-2 shadow-lg shrink-0 transition"
            >
              <RefreshCw className={`w-4 h-4 ${harvesting ? 'animate-spin' : ''}`} />
              {harvesting
                ? 'Đang thu thập & băm Fingerprint 63 tỉnh...'
                : '🚀 Run National 63-Province Harvester'}
            </button>
          </div>

          {/* High-Frequency Cross-Province Question Clusters */}
          {harvesterData?.highFrequencyClusters?.length > 0 && (
            <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/30 space-y-4">
              <div className="text-sm font-black text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Các Câu Hỏi Tần Suất Cao Xuất Hiện Trong Nhiều Đề Thi Tỉnh/Quốc Gia (Cross-Province Fingerprint Matches):
              </div>

              <div className="grid grid-cols-1 gap-3">
                {harvesterData.highFrequencyClusters.map((cl: any) => (
                  <div
                    key={cl.fingerprintHash}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-extrabold">
                        {cl.badgeText}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        Hash: {cl.fingerprintHash}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      "{cl.sampleStem}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 63-Province Specialized High School Directory Explorer */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Danh Bạ 63 Tỉnh Thành & 70+ Trường THPT Chuyên Trọng Điểm Quốc Gia
              </h4>
              <div className="flex items-center gap-1.5">
                {['ALL', 'North', 'Central', 'South'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRegionFilter(r)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      regionFilter === r
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {r === 'ALL'
                      ? 'Toàn Quốc (63 Tỉnh)'
                      : r === 'North'
                      ? 'Miền Bắc (DHBB / Hùng Vương)'
                      : r === 'Central'
                      ? 'Miền Trung & Tây Nguyên'
                      : 'Miền Nam (Olympic 30/4)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {(harvesterData?.schoolsDirectory || [])
                .filter((s: any) => regionFilter === 'ALL' || s.region === regionFilter)
                .map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <span>{s.province}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-500/10">
                        {s.region}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm font-extrabold text-slate-900 dark:text-white">
                      {s.school}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {(s.tournaments || []).map((t: string) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticAssessmentHub;
