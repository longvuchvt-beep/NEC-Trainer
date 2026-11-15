'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Target,
  Flame,
  Puzzle,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Scissors,
  Lightbulb,
  Snowflake,
  ChevronRight,
  Clock,
  Gamepad2
} from 'lucide-react';
import KangarooReflexGame from '../arcade/KangarooReflexGame';
import BinaryBlitzGame from '../arcade/BinaryBlitzGame';
import MeteorWordFormGame from '../arcade/MeteorWordFormGame';

// ============================================================================
// CURATED DATA FOR THE 4 ANTI-BOREDOM MODES
// ============================================================================
const DEFAULT_MATCH_PAIRS = [
  {
    pairId: 'mp-1',
    term: 'smoke and mirrors',
    meaning: 'trò hào nhoáng đánh lừa thị giác, sự che mắt'
  },
  {
    pairId: 'mp-2',
    term: 'paper over the cracks',
    meaning: 'vá víu, che đậy tạm thời các khuyết điểm'
  },
  {
    pairId: 'mp-3',
    term: 'give the lie to',
    meaning: 'vạch trần sự giả dối của điều gì'
  },
  {
    pairId: 'mp-4',
    term: 'militate against',
    meaning: 'ngăn cản, gây bất lợi lớn cho'
  },
  {
    pairId: 'mp-5',
    term: 'pay lip service to',
    meaning: 'ủng hộ suông, nói đầu môi chót lưỡi'
  },
  {
    pairId: 'mp-6',
    term: 'shore up confidence',
    meaning: 'củng cố, vực dậy niềm tin đang suy yếu'
  }
];

const DEFAULT_BLITZ_QUESTIONS = [
  {
    id: 'blitz-1',
    stem: '1. The Nobel laureate’s lecture was remarkably _______, distilling quantum equations into analogies accessible to freshmen.',
    options: [
      { id: 'A', text: 'comprehensive' },
      { id: 'B', text: 'comprehendible' },
      { id: 'C', text: 'comprehensible' },
      { id: 'D', text: 'apprehensive' }
    ],
    answer: 'C',
    hint: 'Phân biệt "comprehensible" (dễ hiểu, accessible) với "comprehensive" (toàn diện). Không tồn tại từ "comprehendible" trong chuẩn CPE!',
    explanationVi: '[Đáp án chuẩn: C — "comprehensible"] Comprehensible = dễ hiểu, có thể lĩnh hội được.'
  },
  {
    id: 'blitz-2',
    stem: '2. Not until the declassified diplomatic cables were released _______ the sheer magnitude of the subterfuge.',
    options: [
      { id: 'A', text: 'historians comprehended' },
      { id: 'B', text: 'did historians comprehend' },
      { id: 'C', text: 'had historians comprehended' },
      { id: 'D', text: 'that historians comprehend' }
    ],
    answer: 'B',
    hint: 'Cấu trúc "Not until + mệnh đề phụ + Đảo ngữ trợ động từ ở mệnh đề chính (did + S + V_bare)".',
    explanationVi: '[Đáp án chuẩn: B — "did historians comprehend"] Đảo ngữ mệnh đề chính sau Not until.'
  },
  {
    id: 'blitz-3',
    stem: '3. Harsh climatic conditions and geographic isolation _______ against the establishment of permanent settlements.',
    options: [
      { id: 'A', text: 'mitigate' },
      { id: 'B', text: 'castigate' },
      { id: 'C', text: 'instigate' },
      { id: 'D', text: 'militate' }
    ],
    answer: 'D',
    hint: 'Động từ nội (intransitive verb) đi kèm giới từ "against" mang nghĩa "cản trở, gây bất lợi cho" (bắt đầu bằng M-I-L...).',
    explanationVi: '[Đáp án chuẩn: D — "militate"] Militate against = gây bất lợi, ngăn cản. Mitigate không đi với against.'
  },
  {
    id: 'blitz-4',
    stem: '4. The whistleblower’s testimony _______ the official narrative that the chemical spill had been contained.',
    options: [
      { id: 'A', text: 'gave the lie to' },
      { id: 'B', text: 'paid lip service to' },
      { id: 'C', text: 'turned a blind eye to' },
      { id: 'D', text: 'made light of' }
    ],
    answer: 'A',
    hint: 'Thành ngữ C2 mang nghĩa "vạch trần sự dối trá của điều gì" (chứa từ "lie").',
    explanationVi: '[Đáp án chuẩn: A — "gave the lie to"] Give the lie to something = chứng minh điều gì là sai sự thật.'
  },
  {
    id: 'blitz-5',
    stem: '5. To ensure an impartial verdict, the arbitration panel must be chaired by a wholly _______ legal scholar.',
    options: [
      { id: 'A', text: 'uninterested' },
      { id: 'B', text: 'uninteresting' },
      { id: 'C', text: 'disinterested' },
      { id: 'D', text: 'distempered' }
    ],
    answer: 'C',
    hint: 'Tính từ mang nghĩa "vô tư, khách quan, không có lợi ích cá nhân" (= impartial), bắt đầu bằng tiền tố "dis-".',
    explanationVi: '[Đáp án chuẩn: C — "disinterested"] Disinterested = vô tư, khách quan; uninterested = thờ ơ.'
  },
  {
    id: 'blitz-6',
    stem: '6. The bioethics committee demanded that the pharmaceutical conglomerate _______ all raw clinical telemetry.',
    options: [
      { id: 'A', text: 'discloses' },
      { id: 'B', text: 'had disclosed' },
      { id: 'C', text: 'would disclose' },
      { id: 'D', text: 'disclose' }
    ],
    answer: 'D',
    hint: 'Giả định thức (Mandative Subjunctive) sau "demand that + S + V_bare".',
    explanationVi: '[Đáp án chuẩn: D — "disclose"] Động từ nguyên mẫu không chia sau "demand that".'
  },
  {
    id: 'blitz-7',
    stem: '7. The authoritarian regime remained utterly _______ to international diplomatic pressure.',
    options: [
      { id: 'A', text: 'impervious' },
      { id: 'B', text: 'imperious' },
      { id: 'C', text: 'impetuous' },
      { id: 'D', text: 'impermanent' }
    ],
    answer: 'A',
    hint: 'Tính từ đi với giới từ "to" mang nghĩa "không hề bị lay chuyển hay ảnh hưởng bởi".',
    explanationVi: '[Đáp án chuẩn: A — "impervious"] Impervious to = không bị ảnh hưởng bởi; imperious = hách dịch.'
  },
  {
    id: 'blitz-8',
    stem: '8. Rather than addressing the systemic roots of inflation, the cabinet’s package merely _______ the cracks.',
    options: [
      { id: 'A', text: 'brushes up' },
      { id: 'B', text: 'papers over' },
      { id: 'C', text: 'strikes out' },
      { id: 'D', text: 'boils down' }
    ],
    answer: 'B',
    hint: 'Cụm động từ C2 đi với "the cracks" mang nghĩa "che đậy tạm bợ các vết nứt".',
    explanationVi: '[Đáp án chuẩn: B — "papers over"] Paper over the cracks = vá víu, che đậy tạm thời khuyết điểm.'
  },
  {
    id: 'blitz-9',
    stem: '9. The forensic audit uncovered a _______ disregard for environmental safety regulations.',
    options: [
      { id: 'A', text: 'fragrant' },
      { id: 'B', text: 'vagrant' },
      { id: 'C', text: 'flagrant' },
      { id: 'D', text: 'nascent' }
    ],
    answer: 'C',
    hint: 'Collocation đi với "disregard / violation" mang nghĩa "trắng trợn, ngang nhiên".',
    explanationVi: '[Đáp án chuẩn: C — "flagrant"] Flagrant disregard = sự coi thường trắng trợn.'
  },
  {
    id: 'blitz-10',
    stem: '10. _______ the central bank to tighten monetary policy prematurely, the recovery would grind to a halt.',
    options: [
      { id: 'A', text: 'Should' },
      { id: 'B', text: 'Had' },
      { id: 'C', text: 'Unless' },
      { id: 'D', text: 'Were' }
    ],
    answer: 'D',
    hint: 'Đảo ngữ câu điều kiện loại 2 đi với "to V" ("_______ + S + to V").',
    explanationVi: '[Đáp án chuẩn: D — "Were"] Were + S + to V là đảo ngữ điều kiện loại 2.'
  }
];

const SPOT_TRAP_CARDS = [
  {
    id: 'trap-1',
    sentenceBefore: 'The witness gave a ',
    highlightedPhrase: 'comprehendible',
    sentenceAfter: ' account of the maritime collision to the tribunal.',
    isValidC2: false,
    correction: 'comprehensible',
    explanationVi:
      '❌ BẪY SAI! Trong tiếng Anh học thuật chuẩn C1/C2 không dùng "comprehendible"; tính từ đúng mang nghĩa "dễ hiểu, rõ ràng" là "comprehensible" (còn "comprehensive" = toàn diện).'
  },
  {
    id: 'trap-2',
    sentenceBefore: 'Harsh arctic winds and permafrost ',
    highlightedPhrase: 'militate against',
    sentenceAfter: ' the cultivation of deep-rooted cereal crops.',
    isValidC2: true,
    correction: 'militate against (Chuẩn C2)',
    explanationVi:
      '✅ CHUẨN C2! "Militate against something" = ngăn cản, gây bất lợi lớn cho điều gì. (Bẫy thường gặp là học sinh viết nhầm thành "mitigate against").'
  },
  {
    id: 'trap-3',
    sentenceBefore: 'A judge must remain wholly ',
    highlightedPhrase: 'uninterested',
    sentenceAfter: ' when presiding over a high-profile corporate antitrust lawsuit.',
    isValidC2: false,
    correction: 'disinterested',
    explanationVi:
      '❌ BẪY SAI! "Uninterested" = chán nản, thờ ơ không quan tâm. Để diễn tả "vô tư, khách quan, không vụ lợi" của thẩm phán, bắt buộc phải dùng "disinterested"!'
  },
  {
    id: 'trap-4',
    sentenceBefore: 'DNA fingerprinting provided ',
    highlightedPhrase: 'incontrovertible',
    sentenceAfter: ' forensic proof that exonerated the defendant.',
    isValidC2: true,
    correction: 'incontrovertible (Chuẩn C2)',
    explanationVi:
      '✅ CHUẨN C2! "Incontrovertible proof/evidence" (từ gốc CONTROVERSY) = bằng chứng đanh thép không thể chối cãi.'
  },
  {
    id: 'trap-5',
    sentenceBefore: 'The advisory board ',
    highlightedPhrase: 'comprised of',
    sentenceAfter: ' twelve eminent epidemiologists from six continents.',
    isValidC2: false,
    correction: 'comprised (hoặc consisted of)',
    explanationVi:
      '❌ BẪY SAI KINH ĐIỂN! Ở thể chủ động, "comprise" (= consist of) tuyệt đối KHÔNG đi với giới từ "of". Chỉ viết "comprised twelve..." hoặc "consisted of twelve...".'
  },
  {
    id: 'trap-6',
    sentenceBefore: 'Not until the archives were unsealed ',
    highlightedPhrase: 'did historians comprehend',
    sentenceAfter: ' the true scale of the diplomatic treaty.',
    isValidC2: true,
    correction: 'did historians comprehend (Chuẩn C2)',
    explanationVi:
      '✅ CHUẨN C2! Khi "Not until..." đứng đầu câu, sự đảo ngữ xảy ra ở mệnh đề chính ("did historians comprehend").'
  }
];

const TAP_TO_FILL_QUESTIONS = [
  {
    id: 'tap-1',
    typeLabel: 'Word Formation • Gốc: CONTROVERSY',
    sentencePrefix: 'DNA fingerprinting provided ',
    sentenceSuffix: ' proof that exonerated the wrongfully convicted defendant.',
    correctWord: 'INCONTROVERTIBLE',
    wordBank: ['INCONTROVERTIBLE', 'CONTROVERSIAL', 'UNCONTROVERSIAL', 'CONTROVERTING'],
    explanationVi: 'CONTROVERSY → INCONTROVERTIBLE (tính từ C2: không thể bác bỏ hay chối cãi).'
  },
  {
    id: 'tap-2',
    typeLabel: 'Word Formation • Gốc: RECONCILE',
    sentencePrefix: 'Coalition talks collapsed due to ',
    sentenceSuffix: ' ideological differences between the two factions.',
    correctWord: 'IRRECONCILABLE',
    wordBank: ['RECONCILIATORY', 'IRRECONCILABLE', 'UNRECONCILED', 'RECONCILING'],
    explanationVi: 'RECONCILE → IRRECONCILABLE (không thể dung hòa / hàn gắn được).'
  },
  {
    id: 'tap-3',
    typeLabel: 'Open Cloze • Idiomatic Preposition',
    sentencePrefix: 'When students delegate foundational synthesis to algorithms, critical discernment risks falling ',
    sentenceSuffix: ' atrophy.',
    correctWord: 'into',
    wordBank: ['into', 'under', 'within', 'upon'],
    explanationVi: 'Cụm cố định C2: "fall into atrophy / decline / disuse" (rơi vào trạng thái mai một).'
  },
  {
    id: 'tap-4',
    typeLabel: 'Sentence Transformation • Keyword: ILLUSION',
    sentencePrefix: 'The minister was ',
    sentenceSuffix: ' that the austerity package would provoke fierce union resistance.',
    correctWord: 'under no illusion',
    wordBank: ['under no illusion', 'in no delusion', 'beyond any illusion', 'at a loss'],
    explanationVi: 'Cấu trúc C2: "be under no illusion that..." = hoàn toàn nhận thức rõ thực tế rằng.'
  }
];

interface AntiBoredomArcadeHubProps {
  exam?: any;
  exams?: any[];
  onSaveVocab?: (item: any) => void;
}

export default function AntiBoredomArcadeHub({ exam, exams = [], onSaveVocab }: AntiBoredomArcadeHubProps) {
  // Active Arcade Mode: 'kangaroo' | 'binary' | 'meteor' | 'match' | 'blitz' | 'trap' | 'tap'
  const [activeGame, setActiveGame] = useState<
    'kangaroo' | 'binary' | 'meteor' | 'match' | 'blitz' | 'trap' | 'tap'
  >('kangaroo');

  // ==================== MODE A: 60S SPEED MATCH BOARD STATE ====================
  const [matchTiles, setMatchTiles] = useState<Array<any>>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<Record<string, boolean>>({});
  const [mismatchTileIds, setMismatchTileIds] = useState<string[]>([]);
  const [matchTenths, setMatchTenths] = useState<number>(0);
  const [matchRunning, setMatchRunning] = useState<boolean>(true);
  const [personalBestTenths, setPersonalBestTenths] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('veng_match_best_tenths') || 142);
    }
    return 142; // 14.2s default benchmark
  });

  const initMatchBoard = () => {
    const tiles: Array<any> = [];
    DEFAULT_MATCH_PAIRS.forEach((p, idx) => {
      tiles.push({
        tileId: `term-${p.pairId}`,
        pairId: p.pairId,
        kind: 'TERM',
        text: p.term,
        order: (idx * 7 + 3) % 12
      });
      tiles.push({
        tileId: `mean-${p.pairId}`,
        pairId: p.pairId,
        kind: 'MEANING',
        text: p.meaning,
        order: (idx * 5 + 2) % 12
      });
    });
    // Interleave deterministically so terms and meanings are mixed on the 4x3 grid
    const interleaved = [
      tiles[0],
      tiles[3],
      tiles[4],
      tiles[1],
      tiles[6],
      tiles[9],
      tiles[2],
      tiles[11],
      tiles[8],
      tiles[5],
      tiles[10],
      tiles[7]
    ];
    setMatchTiles(interleaved);
    setSelectedTileId(null);
    setMatchedPairIds({});
    setMismatchTileIds([]);
    setMatchTenths(0);
    setMatchRunning(true);
  };

  useEffect(() => {
    initMatchBoard();
  }, []);

  // Stopwatch timer for Match Board
  useEffect(() => {
    if (activeGame !== 'match' || !matchRunning) return;
    const t = setInterval(() => {
      setMatchTenths((prev) => prev + 1);
    }, 100);
    return () => clearInterval(t);
  }, [activeGame, matchRunning]);

  const handleTileClick = (tile: any) => {
    if (matchedPairIds[tile.pairId]) return;
    if (!selectedTileId) {
      setSelectedTileId(tile.tileId);
      return;
    }
    if (selectedTileId === tile.tileId) {
      setSelectedTileId(null);
      return;
    }

    const firstTile = matchTiles.find((t) => t.tileId === selectedTileId);
    if (!firstTile) {
      setSelectedTileId(tile.tileId);
      return;
    }

    if (firstTile.pairId === tile.pairId && firstTile.tileId !== tile.tileId) {
      // Match found!
      const nextMatched = { ...matchedPairIds, [tile.pairId]: true };
      setMatchedPairIds(nextMatched);
      setSelectedTileId(null);

      // Check if all 6 pairs are cleared
      if (Object.keys(nextMatched).length === DEFAULT_MATCH_PAIRS.length) {
        setMatchRunning(false);
        if (matchTenths < personalBestTenths) {
          setPersonalBestTenths(matchTenths);
          if (typeof window !== 'undefined') {
            localStorage.setItem('veng_match_best_tenths', String(matchTenths));
          }
        }
      }
    } else {
      // Mismatch shake red
      setMismatchTileIds([firstTile.tileId, tile.tileId]);
      setSelectedTileId(null);
      setTimeout(() => {
        setMismatchTileIds([]);
      }, 650);
    }
  };

  // ==================== MODE B: 10-QUESTION BLITZ WITH POWER-UPS STATE ====================
  const [blitzIdx, setBlitzIdx] = useState<number>(0);
  const [blitzStreak, setBlitzStreak] = useState<number>(4);
  const [blitzXp, setBlitzXp] = useState<number>(120);
  const [blitzTimer, setBlitzTimer] = useState<number>(30);
  const [blitzFrozen, setBlitzFrozen] = useState<boolean>(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [showBlitzHint, setShowBlitzHint] = useState<boolean>(false);
  const [blitzSelectedOpt, setBlitzSelectedOpt] = useState<string | null>(null);

  const activeBlitzQ = DEFAULT_BLITZ_QUESTIONS[blitzIdx] || DEFAULT_BLITZ_QUESTIONS[0];

  useEffect(() => {
    if (activeGame !== 'blitz' || blitzFrozen || blitzSelectedOpt) return;
    const t = setInterval(() => {
      setBlitzTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [activeGame, blitzFrozen, blitzSelectedOpt, blitzIdx]);

  const handleUse5050 = () => {
    if (eliminatedOptions.length > 0 || blitzSelectedOpt) return;
    const wrongOpts = activeBlitzQ.options
      .map((o) => o.id)
      .filter((id) => id !== activeBlitzQ.answer);
    setEliminatedOptions(wrongOpts.slice(0, 2));
  };

  const handleSelectBlitzAnswer = (optId: string) => {
    if (eliminatedOptions.includes(optId)) return;
    setBlitzSelectedOpt(optId);
    if (optId === activeBlitzQ.answer) {
      setBlitzStreak((s) => s + 1);
      setBlitzXp((x) => x + 25);
    } else {
      setBlitzStreak(0);
    }
  };

  const handleNextBlitzQuestion = () => {
    setBlitzIdx((i) => (i + 1) % DEFAULT_BLITZ_QUESTIONS.length);
    setBlitzSelectedOpt(null);
    setEliminatedOptions([]);
    setShowBlitzHint(false);
    setBlitzFrozen(false);
    setBlitzTimer(30);
  };

  // ==================== MODE C: 3-SECOND SPOT THE TRAP STATE ====================
  const [trapIdx, setTrapIdx] = useState<number>(0);
  const [trapChoice, setTrapChoice] = useState<boolean | null>(null);
  const [trapScore, setTrapScore] = useState<number>(0);

  const activeTrapCard = SPOT_TRAP_CARDS[trapIdx] || SPOT_TRAP_CARDS[0];

  const handleAnswerTrap = (userSaysValid: boolean) => {
    setTrapChoice(userSaysValid);
    if (userSaysValid === activeTrapCard.isValidC2) {
      setTrapScore((s) => s + 1);
    }
  };

  const handleNextTrapCard = () => {
    setTrapChoice(null);
    setTrapIdx((i) => (i + 1) % SPOT_TRAP_CARDS.length);
  };

  // ==================== MODE D: TAP-TO-FILL WORD BANK STATE ====================
  const [tapIdx, setTapIdx] = useState<number>(0);
  const [tappedWord, setTappedWord] = useState<string>('');
  const [tapChecked, setTapChecked] = useState<boolean>(false);

  const activeTapQ = TAP_TO_FILL_QUESTIONS[tapIdx] || TAP_TO_FILL_QUESTIONS[0];

  const handleTapChip = (word: string) => {
    setTappedWord(word);
    setTapChecked(true);
  };

  const handleNextTapQuestion = () => {
    setTappedWord('');
    setTapChecked(false);
    setTapIdx((i) => (i + 1) % TAP_TO_FILL_QUESTIONS.length);
  };

  return (
    <div className="space-y-6">
      {/* Top Arcade Header & C1/C2 Reflex Arcade Selector */}
      <div className="p-6 rounded-3xl eyecare-card border shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/15 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
              <Gamepad2 className="w-4 h-4" />
              🎮 C1/C2 REFLEX ARCADE (OPENQUIZ KANGAROO HOP • BINARY BLITZ • METEOR STRIKE)
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold font-serif">
              Phòng Game Phản Xạ C1/C2 Tốc Độ Cao • Luyện Collocations, Phrasal Verbs &amp; Word Forms
            </h2>
            <p className="text-xs md:text-sm opacity-75">
              Hơn 160+ câu hỏi phản xạ C1/C2 trích xuất tự động từ kho đề HSGQG, DHBB, Olympic 30/4 &amp; CPE (Phân bổ đáp án chuẩn Fisher-Yates 25% A/B/C/D). Hỗ trợ phím tắt [1-4], [A-D] và [←/→].
            </p>
          </div>
        </div>

        {/* 3 Main OpenQuiz-Style Reflex Games */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveGame('kangaroo')}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-3.5 ${
              activeGame === 'kangaroo'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated border-amber-900/20 hover:border-amber-800/60'
            }`}
          >
            <span className="text-2xl shrink-0">🦘</span>
            <div>
              <div className="text-xs md:text-sm font-extrabold">
                1. Kangaroo C1/C2 Reflex Hop
              </div>
              <div className="text-[11px] opacity-85">
                Nhảy trụ đá qua sông • Phím [1-4] / [A-D] • Super 2x Leap
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('binary')}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-3.5 ${
              activeGame === 'binary'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated border-amber-900/20 hover:border-amber-800/60'
            }`}
          >
            <span className="text-2xl shrink-0">⬅️➡️</span>
            <div>
              <div className="text-xs md:text-sm font-extrabold">
                2. Binary Blitz (Left/Right Sort)
              </div>
              <div className="text-[11px] opacity-85">
                Phân loại 60s siêu tốc • Phím [←] / [→] • 4 Bộ thẻ C1/C2
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('meteor')}
            className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center gap-3.5 ${
              activeGame === 'meteor'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated border-amber-900/20 hover:border-amber-800/60'
            }`}
          >
            <span className="text-2xl shrink-0">☄️</span>
            <div>
              <div className="text-xs md:text-sm font-extrabold">
                3. Meteor Word-Form Strike
              </div>
              <div className="text-[11px] opacity-85">
                Bắn hạ thiên thạch Gốc Từ (PRECEDE, RECONCILE...)
              </div>
            </div>
          </button>
        </div>

        {/* 4 Additional Anti-Boredom Study Mini-Games */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-amber-900/10">
          <button
            type="button"
            onClick={() => setActiveGame('match')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
              activeGame === 'match'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated hover:border-amber-800/60'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0 text-amber-400" />
            <div>
              <div className="text-xs font-extrabold">⚡ Ghép Cặp 60s</div>
              <div className="text-[11px] opacity-80">Quizlet Match Board (4x3)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('blitz')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
              activeGame === 'blitz'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated hover:border-amber-800/60'
            }`}
          >
            <Target className="w-4 h-4 shrink-0 text-emerald-400" />
            <div>
              <div className="text-xs font-extrabold">🎯 Nước Rút 10 Câu</div>
              <div className="text-[11px] opacity-80">Quizizz Blitz + 3 Power-Ups</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('trap')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
              activeGame === 'trap'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated hover:border-amber-800/60'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0 text-rose-400" />
            <div>
              <div className="text-xs font-extrabold">🔥 Bắt Bẫy 3 Giây</div>
              <div className="text-[11px] opacity-80">Chuẩn C2 hay Bẫy Sai?</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveGame('tap')}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
              activeGame === 'tap'
                ? 'bg-amber-900 text-amber-50 border-amber-950 shadow-md'
                : 'eyecare-elevated hover:border-amber-800/60'
            }`}
          >
            <Puzzle className="w-4 h-4 shrink-0 text-indigo-400" />
            <div>
              <div className="text-xs font-extrabold">🧩 Điền Từ Chạm-Thả</div>
              <div className="text-[11px] opacity-80">Tap-to-Fill Word Bank</div>
            </div>
          </button>
        </div>
      </div>

      {/* ==================== GAME 1: 🦘 KANGAROO C1/C2 REFLEX HOP ==================== */}
      {activeGame === 'kangaroo' && (
        <KangarooReflexGame
          exams={exams.length > 0 ? exams : exam ? [exam] : []}
          onSaveVocab={onSaveVocab}
        />
      )}

      {/* ==================== GAME 2: ⬅️➡️ BINARY BLITZ — LEFT/RIGHT SPEED SORT ==================== */}
      {activeGame === 'binary' && (
        <BinaryBlitzGame onSaveVocab={onSaveVocab} />
      )}

      {/* ==================== GAME 3: ☄️ METEOR WORD-FORM STRIKE ==================== */}
      {activeGame === 'meteor' && (
        <MeteorWordFormGame onSaveVocab={onSaveVocab} />
      )}

      {/* ==================== MODE A: ⚡ GHÉP CẶP TỐC ĐỘ 60S (QUIZLET MATCH BOARD) ==================== */}
      {activeGame === 'match' && (
        <div className="p-6 rounded-3xl eyecare-card border shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/10 pb-3">
            <div>
              <h3 className="text-base md:text-lg font-extrabold">
                ⚡ Mode A: Ghép Cặp Tốc Độ 60s (Quizlet Match Board — Lưới 4x3)
              </h3>
              <p className="text-xs opacity-75">
                Bấm chọn 1 thẻ cụm từ C1/C2 tiếng Anh và 1 thẻ nghĩa tiếng Việt tương ứng để xóa cặp thẻ khỏi bàn chơi!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl eyecare-elevated border text-xs font-extrabold cloze-mono-input flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-800" />
                <span>Thời gian: {(matchTenths / 10).toFixed(1)}s</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-600/30 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold cloze-mono-input flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-600" />
                <span>Kỷ lục (Personal Best): {(personalBestTenths / 10).toFixed(1)}s</span>
              </div>

              <button
                type="button"
                onClick={initMatchBoard}
                className="px-3.5 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Chơi ván mới
              </button>
            </div>
          </div>

          {Object.keys(matchedPairIds).length === DEFAULT_MATCH_PAIRS.length ? (
            <div className="p-8 rounded-3xl bg-emerald-500/15 border-2 border-emerald-600/40 text-center space-y-4">
              <Trophy className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-2xl font-black">
                🎉 Hoàn thành xuất sắc trong {(matchTenths / 10).toFixed(1)} giây!
              </h4>
              <p className="text-xs md:text-sm opacity-85">
                Kỷ lục cá nhân (Personal Best): <strong>{(personalBestTenths / 10).toFixed(1)}s</strong>
              </p>
              <button
                type="button"
                onClick={initMatchBoard}
                className="px-6 py-3 rounded-2xl bg-amber-900 text-amber-50 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Chơi lại để phá kỷ lục
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {matchTiles.map((tile) => {
                const isCleared = Boolean(matchedPairIds[tile.pairId]);
                const isSelected = selectedTileId === tile.tileId;
                const isMismatch = mismatchTileIds.includes(tile.tileId);

                if (isCleared) {
                  return (
                    <div
                      key={tile.tileId}
                      className="min-h-[104px] rounded-2xl border-2 border-dashed border-emerald-600/40 bg-emerald-500/10 flex flex-col items-center justify-center p-3 text-center transition-all scale-95 opacity-60"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-1" />
                      <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                        Đã ghép đúng!
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={tile.tileId}
                    type="button"
                    onClick={() => handleTileClick(tile)}
                    className={`min-h-[104px] p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isMismatch
                        ? 'border-rose-600 bg-rose-500/20 text-rose-950 dark:text-rose-100 scale-95'
                        : isSelected
                        ? 'border-amber-900 bg-amber-900 text-amber-50 shadow-lg scale-[1.02]'
                        : 'eyecare-elevated hover:border-amber-800/60 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70 cloze-mono-input">
                      {tile.kind === 'TERM' ? 'C1/C2 IDIOM / VERB' : 'NGHĨA TIẾNG VIỆT'}
                    </span>
                    <span
                      className={`text-xs md:text-sm font-bold leading-snug ${
                        tile.kind === 'TERM' ? 'font-serif text-base' : ''
                      }`}
                    >
                      {tile.text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE B: 🎯 TRẠM NƯỚC RÚT 10 CÂU (QUIZIZZ BLITZ WITH POWER-UPS) ==================== */}
      {activeGame === 'blitz' && (
        <div className="max-w-4xl mx-auto p-6 md:p-8 rounded-3xl eyecare-card border shadow-sm space-y-6">
          {/* Top Bar: Question Counter, Combo Streak, XP & Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold cloze-mono-input">
                Blitz {blitzIdx + 1} / {DEFAULT_BLITZ_QUESTIONS.length}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-500/15 text-orange-800 dark:text-amber-300 border border-orange-500/30 text-xs font-extrabold flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                🔥 {blitzStreak}x Streak
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold cloze-mono-input">
                ⚡ {blitzXp} XP
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black cloze-mono-input border ${
                  blitzFrozen
                    ? 'bg-sky-500/20 border-sky-600 text-sky-900 dark:text-sky-200'
                    : 'eyecare-elevated'
                }`}
              >
                {blitzFrozen ? `❄️ Đã đóng băng (${blitzTimer}s)` : `⏱️ ${blitzTimer}s`}
              </span>
            </div>
          </div>

          {/* 3 Working Power-Up Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl eyecare-elevated border">
            <span className="text-xs font-extrabold uppercase tracking-wider opacity-75">
              Trợ giúp Power-Ups:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={eliminatedOptions.length > 0 || Boolean(blitzSelectedOpt)}
                onClick={handleUse5050}
                className="px-3.5 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 disabled:opacity-50 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>✂️ 50/50 (Loại 2 phương án sai)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBlitzHint(true)}
                className="px-3.5 py-2 rounded-xl eyecare-card border hover:border-amber-800 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>💡 Gợi ý (Hint)</span>
              </button>

              <button
                type="button"
                onClick={() => setBlitzFrozen((f) => !f)}
                className="px-3.5 py-2 rounded-xl eyecare-card border hover:border-sky-600 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Snowflake className="w-3.5 h-3.5 text-sky-600" />
                <span>{blitzFrozen ? '❄️ Đang đóng băng giờ' : '❄️ Đóng băng giờ (Freeze)'}</span>
              </button>
            </div>
          </div>

          {/* Hint Banner when activated */}
          {showBlitzHint && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-600/40 text-xs font-semibold">
              💡 <strong>Gợi ý C1/C2:</strong> {activeBlitzQ.hint}
            </div>
          )}

          {/* Blitz Question Stem */}
          <h3 className="text-lg md:text-xl font-bold font-serif leading-relaxed">
            {activeBlitzQ.stem}
          </h3>

          {/* 4 Options with 50/50 Elimination Support */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeBlitzQ.options.map((opt) => {
              const isEliminated = eliminatedOptions.includes(opt.id);
              const isAnswered = Boolean(blitzSelectedOpt);
              const isRight = opt.id === activeBlitzQ.answer;
              const isChosen = blitzSelectedOpt === opt.id;

              let btnCls = 'eyecare-elevated border hover:border-amber-800/60';
              if (isEliminated) {
                btnCls = 'opacity-30 line-through pointer-events-none border eyecare-elevated';
              } else if (isAnswered) {
                if (isRight) {
                  btnCls =
                    'border-2 border-emerald-600 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold';
                } else if (isChosen && !isRight) {
                  btnCls =
                    'border-2 border-rose-600 bg-rose-500/15 text-rose-950 dark:text-rose-100';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isEliminated}
                  onClick={() => handleSelectBlitzAnswer(opt.id)}
                  className={`p-4 rounded-2xl text-left flex items-center gap-3 transition cursor-pointer ${btnCls}`}
                >
                  <span className="w-8 h-8 rounded-xl eyecare-card border flex items-center justify-center text-xs font-extrabold cloze-mono-input shrink-0">
                    {opt.id}
                  </span>
                  <span className="text-sm md:text-base font-semibold">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {blitzSelectedOpt && (
            <div className="p-4 rounded-2xl eyecare-elevated border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs md:text-sm font-semibold">
                {activeBlitzQ.explanationVi}
              </div>
              <button
                type="button"
                onClick={handleNextBlitzQuestion}
                className="px-4 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Câu Blitz tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE C: 🔥 BẮT BẪY NHANH 3 GIÂY ("CHUẨN C2 HAY BẪY SAI?") ==================== */}
      {activeGame === 'trap' && (
        <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-3xl eyecare-card border shadow-sm space-y-6 text-center">
          <div className="flex items-center justify-between text-xs font-extrabold border-b border-amber-900/10 pb-3">
            <span>
              🔥 Mode C: Bắt Bẫy Nhanh 3 Giây ({trapIdx + 1} / {SPOT_TRAP_CARDS.length})
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 cloze-mono-input">
              Đã bắt trúng: {trapScore} câu
            </span>
          </div>

          <div className="py-6 px-4 rounded-3xl eyecare-elevated border space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-70">
              Cụm từ in đậm dưới đây là CHUẨN C1/C2 hay BẪY SAI?
            </div>
            <p className="text-lg md:text-2xl font-serif leading-relaxed">
              &ldquo;{activeTrapCard.sentenceBefore}
              <span className="px-2.5 py-0.5 rounded-xl bg-amber-500/25 border border-amber-700/40 font-black underline">
                {activeTrapCard.highlightedPhrase}
              </span>
              {activeTrapCard.sentenceAfter}&rdquo;
            </p>
          </div>

          {/* 2 Big Swipe/Click Decision Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleAnswerTrap(true)}
              className="py-4 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm md:text-base font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>✅ Chuẩn C1/C2 (Valid)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAnswerTrap(false)}
              className="py-4 px-5 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white text-sm md:text-base font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
              <span>❌ Bẫy Sai (Trap)</span>
            </button>
          </div>

          {trapChoice !== null && (
            <div className="p-5 rounded-2xl eyecare-elevated border text-left space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Từ/Cấu trúc chuẩn: {activeTrapCard.correction}
                </span>
                <button
                  type="button"
                  onClick={handleNextTrapCard}
                  className="px-4 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <span>Thẻ tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs md:text-sm leading-relaxed">{activeTrapCard.explanationVi}</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODE D: 🧩 ĐIỀN TỪ CHẠM-THẢ (TAP-TO-FILL WORD BANK) ==================== */}
      {activeGame === 'tap' && (
        <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-3xl eyecare-card border shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs font-extrabold border-b border-amber-900/10 pb-3">
            <span>
              🧩 Mode D: Điền Từ Chạm-Thả ({tapIdx + 1} / {TAP_TO_FILL_QUESTIONS.length})
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-900 text-amber-50">
              {activeTapQ.typeLabel}
            </span>
          </div>

          <p className="text-base md:text-xl font-serif leading-relaxed">
            {activeTapQ.sentencePrefix}
            <span className="inline-flex items-center px-3 py-1 mx-1 rounded-xl border-2 border-dashed border-amber-800 bg-amber-500/15 cloze-mono-input font-extrabold text-sm md:text-base">
              {tappedWord || ' [ Chạm từ bên dưới ] '}
            </span>
            {activeTapQ.sentenceSuffix}
          </p>

          <div className="space-y-2">
            <div className="text-xs font-bold opacity-75">
              Chạm vào 1 thẻ từ gợi ý bên dưới để điền ngay vào chỗ trống (không cần gõ phím):
            </div>
            <div className="flex flex-wrap gap-2.5">
              {activeTapQ.wordBank.map((chip) => {
                const isSelected = tappedWord === chip;
                const isCorrectChip = chip === activeTapQ.correctWord;
                let chipCls = 'eyecare-elevated border hover:border-amber-800';
                if (tapChecked && isCorrectChip) {
                  chipCls = 'bg-emerald-700 text-white border-emerald-800';
                } else if (tapChecked && isSelected && !isCorrectChip) {
                  chipCls = 'bg-rose-700 text-white border-rose-800';
                }
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleTapChip(chip)}
                    className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold cloze-mono-input transition cursor-pointer ${chipCls}`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {tapChecked && (
            <div className="p-4 rounded-2xl eyecare-elevated border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs md:text-sm font-semibold">
                {tappedWord === activeTapQ.correctWord ? '✅ Chính xác! ' : '❌ Chưa chính xác. '}
                {activeTapQ.explanationVi}
              </div>
              <button
                type="button"
                onClick={handleNextTapQuestion}
                className="px-4 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
