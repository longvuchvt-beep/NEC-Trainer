"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Flame,
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  Pause,
  Play,
  Zap,
} from "lucide-react";

interface BinaryCardItem {
  id: string;
  term: string;
  contextHint: string;
  correctSide: "LEFT" | "RIGHT";
  resolvedForm: string;
  explanationVi: string;
}

interface SortingDeck {
  id: string;
  title: string;
  subtitle: string;
  leftLabel: string;
  rightLabel: string;
  cards: BinaryCardItem[];
}

const BINARY_SORTING_DECKS: SortingDeck[] = [
  {
    id: "collocation-make-do",
    title: "1. Collocation Sort (MAKE vs. DO / TAKE)",
    subtitle: "Phân loại siêu tốc các cụm cố định C1/C2 đi với MAKE hay DO / TAKE",
    leftLabel: "⬅️ Đi với MAKE",
    rightLabel: "Đi với DO / TAKE ➡️",
    cards: [
      {
        id: "cm-1",
        term: "_______ amends for the diplomatic blunder",
        contextHint: "Bồi thường, chuộc lỗi",
        correctSide: "LEFT",
        resolvedForm: "MAKE amends for",
        explanationVi: "Make amends for = chuộc lỗi, đền bù thiệt hại đã gây ra.",
      },
      {
        id: "cm-2",
        term: "_______ Precedence over partisan interests",
        contextHint: "Được ưu tiên hơn",
        correctSide: "RIGHT",
        resolvedForm: "TAKE precedence over",
        explanationVi: "Take precedence over = có quyền ưu tiên cao hơn.",
      },
      {
        id: "cm-3",
        term: "_______ a concerted effort to curb inflation",
        contextHint: "Nỗ lực phối hợp đồng bộ",
        correctSide: "LEFT",
        resolvedForm: "MAKE a concerted effort",
        explanationVi: "Make a concerted effort = nỗ lực chung sức, quyết tâm.",
      },
      {
        id: "cm-4",
        term: "_______ wonders for the team’s morale",
        contextHint: "Tạo ra hiệu quả kỳ diệu cho",
        correctSide: "RIGHT",
        resolvedForm: "DO wonders for",
        explanationVi: "Do wonders for = mang lại tác dụng tuyệt vời cho.",
      },
      {
        id: "cm-5",
        term: "_______ light of a potentially fatal hazard",
        contextHint: "Xem nhẹ, đùa cợt trước nguy hiểm",
        correctSide: "LEFT",
        resolvedForm: "MAKE light of",
        explanationVi: "Make light of something = coi thường, xem nhẹ vấn đề nghiêm trọng.",
      },
      {
        id: "cm-6",
        term: "_______ exception to the tone of the editorial",
        contextHint: "Phản đối gay gắt, tự ái vì",
        correctSide: "RIGHT",
        resolvedForm: "TAKE exception to",
        explanationVi: "Take exception to = phật ý, phản đối mạnh mẽ điều gì.",
      },
      {
        id: "cm-7",
        term: "_______ a clean breast of the financial irregularities",
        contextHint: "Thú nhận toàn bộ sự thật",
        correctSide: "LEFT",
        resolvedForm: "MAKE a clean breast of",
        explanationVi: "Make a clean breast of = thú nhận hết mọi tội lỗi/sai phạm.",
      },
      {
        id: "cm-8",
        term: "_______ justice to the composer’s intricate score",
        contextHint: "Thể hiện xứng tầm giá trị của",
        correctSide: "RIGHT",
        resolvedForm: "DO justice to",
        explanationVi: "Do justice to = đánh giá/thể hiện đúng tầm vóc của tác phẩm.",
      },
      {
        id: "cm-9",
        term: "_______ allowances for novices in the laboratory",
        contextHint: "Chiếu cố, thông cảm cho",
        correctSide: "LEFT",
        resolvedForm: "MAKE allowances for",
        explanationVi: "Make allowances for = chiếu cố, tính đến hoàn cảnh đặc thù.",
      },
      {
        id: "cm-10",
        term: "_______ umbrage at the reviewer’s remarks",
        contextHint: "Cảm thấy bị xúc phạm nặng nề",
        correctSide: "RIGHT",
        resolvedForm: "TAKE umbrage at",
        explanationVi: "Take umbrage at = nổi giận, phật lòng vì cảm thấy bị xúc phạm.",
      },
      {
        id: "cm-11",
        term: "_______ headway in the peace negotiations",
        contextHint: "Đạt được tiến triển thực chất",
        correctSide: "LEFT",
        resolvedForm: "MAKE headway",
        explanationVi: "Make headway = có bước tiến khả quan khi giải quyết việc khó.",
      },
      {
        id: "cm-12",
        term: "_______ a dim view of chronic tardiness",
        contextHint: "Có cái nhìn không mấy thiện cảm",
        correctSide: "RIGHT",
        resolvedForm: "TAKE a dim view of",
        explanationVi: "Take a dim/poor view of = phản đối, không hài lòng với hành vi nào.",
      },
    ],
  },
  {
    id: "preposition-to-with",
    title: "2. Preposition Sort (TO vs. WITH / ON)",
    subtitle: "Phản xạ giới từ đi kèm tính từ & động từ học thuật C1/C2",
    leftLabel: "⬅️ Đi với TO",
    rightLabel: "Đi với WITH / ON ➡️",
    cards: [
      {
        id: "pr-1",
        term: "tantamount _______ an admission of guilt",
        contextHint: "Tương đương với, chẳng khác nào",
        correctSide: "LEFT",
        resolvedForm: "tantamount TO",
        explanationVi: "Tantamount to + N/V-ing = tương đương với.",
      },
      {
        id: "pr-2",
        term: "commensurate _______ her academic credentials",
        contextHint: "Tương xứng với năng lực",
        correctSide: "RIGHT",
        resolvedForm: "commensurate WITH",
        explanationVi: "Commensurate with = tương xứng, tỷ lệ thuận với.",
      },
      {
        id: "pr-3",
        term: "impervious _______ external political pressure",
        contextHint: "Không bị lay chuyển/ảnh hưởng bởi",
        correctSide: "LEFT",
        resolvedForm: "impervious TO",
        explanationVi: "Impervious to = không bị tác động, trơ ra trước.",
      },
      {
        id: "pr-4",
        term: "imbued _______ a spirit of civic duty",
        contextHint: "Thấm đẫm tinh thần trách nhiệm",
        correctSide: "RIGHT",
        resolvedForm: "imbued WITH",
        explanationVi: "Imbued with = thấm nhuần, tràn đầy cảm xúc/phẩm chất.",
      },
      {
        id: "pr-5",
        term: "conducive _______ deep intellectual inquiry",
        contextHint: "Tạo điều kiện thuận lợi cho",
        correctSide: "LEFT",
        resolvedForm: "conducive TO",
        explanationVi: "Conducive to = có lợi, tạo môi trường thuận lợi cho.",
      },
      {
        id: "pr-6",
        term: "predicated _______ macroeconomic stability",
        contextHint: "Đặt nền tảng dựa trên",
        correctSide: "RIGHT",
        resolvedForm: "predicated ON",
        explanationVi: "Be predicated on/upon = dựa trên tiền đề/giả định.",
      },
      {
        id: "pr-7",
        term: "susceptible _______ confirmation bias",
        contextHint: "Dễ bị ảnh hưởng bởi thiên kiến",
        correctSide: "LEFT",
        resolvedForm: "susceptible TO",
        explanationVi: "Susceptible to = nhạy cảm, dễ mắc phải.",
      },
      {
        id: "pr-8",
        term: "conversant _______ international patent law",
        contextHint: "Thông thạo, am hiểu tường tận",
        correctSide: "RIGHT",
        resolvedForm: "conversant WITH",
        explanationVi: "Be conversant with = am hiểu sâu sắc về.",
      },
      {
        id: "pr-9",
        term: "adhere strictly _______ ethical guidelines",
        contextHint: "Tuân thủ nghiêm ngặt",
        correctSide: "LEFT",
        resolvedForm: "adhere TO",
        explanationVi: "Adhere to = tuân thủ (trong khi Comply đi với WITH).",
      },
      {
        id: "pr-10",
        term: "fraught _______ unforeseen legal complications",
        contextHint: "Đầy rẫy những rủi ro phức tạp",
        correctSide: "RIGHT",
        resolvedForm: "fraught WITH",
        explanationVi: "Fraught with = đầy rẫy những nguy cơ/trắc trở.",
      },
      {
        id: "pr-11",
        term: "alien _______ the democratic traditions of the republic",
        contextHint: "Xa lạ, trái ngược hoàn toàn với",
        correctSide: "LEFT",
        resolvedForm: "alien TO",
        explanationVi: "Alien to = hoàn toàn xa lạ, đi ngược lại bản chất.",
      },
      {
        id: "pr-12",
        term: "encroach _______ protected indigenous territories",
        contextHint: "Xâm lấn dần vào lãnh thổ",
        correctSide: "RIGHT",
        resolvedForm: "encroach ON / UPON",
        explanationVi: "Encroach on/upon = xâm lấn đất đai hoặc quyền lợi.",
      },
    ],
  },
  {
    id: "trap-detector",
    title: "3. Trap Detector (Chuẩn C1/C2 vs. Bẫy Sai / Nhầm Từ)",
    subtitle: "Nhận diện ngay cách dùng chuẩn CPE hay bẫy nhầm từ kinh điển trong đề HSGQG",
    leftLabel: "⬅️ Chuẩn C1/C2 (Valid)",
    rightLabel: "Bẫy Sai / Nhầm Từ (Trap) ➡️",
    cards: [
      {
        id: "tr-1",
        term: '"a disinterested judge" (= một thẩm phán khách quan, vô tư)',
        contextHint: "Kiểm tra nghĩa của DISINTERESTED",
        correctSide: "LEFT",
        resolvedForm: "Chuẩn C1/C2: Disinterested = impartial (khách quan)",
        explanationVi: "ĐÚNG! Disinterested = vô tư, không vụ lợi. Uninterested mới là thờ ơ.",
      },
      {
        id: "tr-2",
        term: '"The lecture was easily comprehendible to freshmen."',
        contextHint: "Kiểm tra tính từ của COMPREHEND",
        correctSide: "RIGHT",
        resolvedForm: "BẪY TỪ! Phải dùng 'comprehensible'",
        explanationVi: "BẪY! Trong bài thi CPE/HSGQG phải dùng 'comprehensible' (dễ hiểu), không dùng 'comprehendible'.",
      },
      {
        id: "tr-3",
        term: '"Harsh weather militated against rescue efforts."',
        contextHint: "Kiểm tra cụm MILITATE AGAINST",
        correctSide: "LEFT",
        resolvedForm: "Chuẩn C1/C2: militate against = gây cản trở",
        explanationVi: "ĐÚNG! Militate against = ngăn cản, gây bất lợi lớn cho.",
      },
      {
        id: "tr-4",
        term: '"New policies will mitigate against inflation."',
        contextHint: "Kiểm tra cách dùng MITIGATE",
        correctSide: "RIGHT",
        resolvedForm: "BẪY NGỮ PHÁP! Mitigate là ngoại động từ (không có against)",
        explanationVi: "BẪY! Mitigate something (làm dịu nhẹ) không đi kèm giới từ 'against'.",
      },
      {
        id: "tr-5",
        term: '"an unassuming billionaire" (= vị tỷ phú khiêm tốn, giản dị)',
        contextHint: "Kiểm tra nghĩa của UNASSUMING",
        correctSide: "LEFT",
        resolvedForm: "Chuẩn C1/C2: unassuming = modest, không phô trương",
        explanationVi: "ĐÚNG! Unassuming = khiêm nhường, không khoa trương.",
      },
      {
        id: "tr-6",
        term: '"Exhausted although they were, they kept marching."',
        contextHint: "Kiểm tra đảo tính từ nhượng bộ",
        correctSide: "RIGHT",
        resolvedForm: "BẪY! Phải dùng 'Exhausted though/as they were'",
        explanationVi: "BẪY! Khi đảo tính từ lên đầu câu nhượng bộ, bắt buộc dùng AS hoặc THOUGH, tuyệt đối không dùng ALTHOUGH.",
      },
      {
        id: "tr-7",
        term: '"The committee defrayed the travel expenses."',
        contextHint: "Kiểm tra collocation DEFRAY EXPENSES",
        correctSide: "LEFT",
        resolvedForm: "Chuẩn C2: defray the costs/expenses",
        explanationVi: "ĐÚNG! Defray the costs/expenses = đài thọ, thanh toán chi phí.",
      },
      {
        id: "tr-8",
        term: '"The diplomat tried to diffuse the border crisis."',
        contextHint: "Phân biệt DEFUSE và DIFFUSE",
        correctSide: "RIGHT",
        resolvedForm: "BẪY CHÍNH TẢ! Phải dùng 'defuse' (tháo ngòi nổ)",
        explanationVi: "BẪY! Xoa dịu khủng hoảng là 'defuse a crisis'. 'Diffuse' là khuếch tán ánh sáng/khí!",
      },
      {
        id: "tr-9",
        term: '"a salutary lesson" (= bài học cảnh tỉnh quý giá)',
        contextHint: "Kiểm tra nghĩa của SALUTARY",
        correctSide: "LEFT",
        resolvedForm: "Chuẩn C2: salutary lesson/reminder",
        explanationVi: "ĐÚNG! Salutary = mang tính cảnh tỉnh bổ ích.",
      },
      {
        id: "tr-10",
        term: '"The witness’s alibi was completelyirreplacable."',
        contextHint: "Kiểm tra chính tả IRREPLACEABLE",
        correctSide: "RIGHT",
        resolvedForm: "BẪY CHÍNH TẢ! Phải giữ chữ 'e': irreplaceable",
        explanationVi: "BẪY! Irreplaceable bắt buộc giữ nguyên chữ 'e' sau 'c' để giữ âm /s/.",
      },
    ],
  },
  {
    id: "prefix-sort",
    title: "4. Prefix Sort (UN- / IN- vs. IM- / IR- / IL-)",
    subtitle: "Chọn đúng tiền tố phủ định C1/C2 cho tính từ trong phần Word Formation",
    leftLabel: "⬅️ Tiền tố UN- / IN-",
    rightLabel: "Tiền tố IM- / IR- / IL- ➡️",
    cards: [
      {
        id: "pf-1",
        term: "_______precedented (PRECEDE)",
        contextHint: "Chưa từng có tiền lệ",
        correctSide: "LEFT",
        resolvedForm: "UNprecedented",
        explanationVi: "Unprecedented = chưa từng có tiền lệ (tiền tố UN-).",
      },
      {
        id: "pf-2",
        term: "_______reconcilable (RECONCILE)",
        contextHint: "Không thể hòa giải/dung hòa",
        correctSide: "RIGHT",
        resolvedForm: "IRreconcilable",
        explanationVi: "Irreconcilable = bất đồng không thể dung hòa (tiền tố IR-).",
      },
      {
        id: "pf-3",
        term: "_______dispensable (DISPENSE)",
        contextHint: "Không thể thiếu được",
        correctSide: "LEFT",
        resolvedForm: "INdispensable",
        explanationVi: "Indispensable = thiết yếu, không thể thiếu (tiền tố IN-).",
      },
      {
        id: "pf-4",
        term: "_______perceptible (PERCEIVE)",
        contextHint: "Hầu như không thể nhận thấy",
        correctSide: "RIGHT",
        resolvedForm: "IMperceptible",
        explanationVi: "Imperceptible = rất nhỏ, khó nhận biết bằng giác quan (tiền tố IM-).",
      },
      {
        id: "pf-5",
        term: "_______equivocal (EQUIVOCATE)",
        contextHint: "Dứt khoát, không mập mờ",
        correctSide: "LEFT",
        resolvedForm: "UNequivocal",
        explanationVi: "Unequivocal = rõ ràng, dứt khoát (tiền tố UN-).",
      },
      {
        id: "pf-6",
        term: "_______revocable (REVOKE)",
        contextHint: "Không thể hủy bỏ/thu hồi",
        correctSide: "RIGHT",
        resolvedForm: "IRrevocable",
        explanationVi: "Irrevocable = không thể đảo ngược/thu hồi (tiền tố IR-).",
      },
      {
        id: "pf-7",
        term: "_______explicable (EXPLAIN)",
        contextHint: "Không thể giải thích nổi",
        correctSide: "LEFT",
        resolvedForm: "INexplicable",
        explanationVi: "Inexplicable = kỳ lạ, không thể lý giải (tiền tố IN-).",
      },
      {
        id: "pf-8",
        term: "_______licit (LICIT)",
        contextHint: "Phi pháp, bất hợp pháp",
        correctSide: "RIGHT",
        resolvedForm: "ILlicit",
        explanationVi: "Illicit = lén lút, trái pháp luật (tiền tố IL-).",
      },
      {
        id: "pf-9",
        term: "_______controversial (CONTROVERSY)",
        contextHint: "Không gây tranh cãi",
        correctSide: "LEFT",
        resolvedForm: "UNcontroversial",
        explanationVi: "Uncontroversial = êm thấm, không gây tranh cãi (tiền tố UN-).",
      },
      {
        id: "pf-10",
        term: "_______mutable (MUTATE)",
        contextHint: "Bất biến, không thể thay đổi",
        correctSide: "RIGHT",
        resolvedForm: "IMmutable",
        explanationVi: "Immutable = bất dịch, vĩnh cửu không đổi (tiền tố IM-).",
      },
    ],
  },
];

interface BinaryBlitzGameProps {
  onSaveVocab?: (item: {
    word: string;
    meaning: string;
    example: string;
    level?: string;
  }) => void;
}

export default function BinaryBlitzGame({ onSaveVocab }: BinaryBlitzGameProps) {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    BINARY_SORTING_DECKS[0].id
  );
  const activeDeck =
    BINARY_SORTING_DECKS.find((d) => d.id === selectedDeckId) ||
    BINARY_SORTING_DECKS[0];

  const [cardIndex, setCardIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [sortedCount, setSortedCount] = useState(0);
  const [swipeAnim, setSwipeAnim] = useState<"LEFT" | "RIGHT" | null>(null);
  const [lastFeedback, setLastFeedback] = useState<{
    correct: boolean;
    card: BinaryCardItem;
  } | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const lockRef = useRef(false);

  const multiplier = Math.min(5, 1 + Math.floor(streak / 3));
  const currentCard =
    activeDeck.cards[cardIndex % activeDeck.cards.length] || activeDeck.cards[0];

  const handleSortChoice = useCallback(
    (side: "LEFT" | "RIGHT") => {
      if (lockRef.current || secondsLeft <= 0 || !currentCard) return;
      lockRef.current = true;
      setSwipeAnim(side);

      const isCorrect = side === currentCard.correctSide;
      if (isCorrect) {
        const nextStreak = streak + 1;
        const mult = Math.min(5, 1 + Math.floor(nextStreak / 3));
        setStreak(nextStreak);
        setScore((s) => s + 50 * mult);
        setSortedCount((c) => c + 1);
      } else {
        setStreak(0);
      }

      setLastFeedback({
        correct: isCorrect,
        card: currentCard,
      });

      setTimeout(() => {
        setSwipeAnim(null);
        setCardIndex((i) => i + 1);
        lockRef.current = false;
      }, 240);
    },
    [secondsLeft, currentCard, streak]
  );

  // 60-second countdown timer
  useEffect(() => {
    if (isPaused || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, secondsLeft]);

  // Left/Right Arrow keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft" || e.key.toUpperCase() === "A" || e.key === "1") {
        e.preventDefault();
        handleSortChoice("LEFT");
      } else if (
        e.key === "ArrowRight" ||
        e.key.toUpperCase() === "D" ||
        e.key === "2"
      ) {
        e.preventDefault();
        handleSortChoice("RIGHT");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSortChoice]);

  const handleResetDeck = (newDeckId?: string) => {
    if (newDeckId) setSelectedDeckId(newDeckId);
    lockRef.current = false;
    setCardIndex(0);
    setSecondsLeft(60);
    setScore(0);
    setStreak(0);
    setSortedCount(0);
    setLastFeedback(null);
    setSwipeAnim(null);
  };

  return (
    <div className="space-y-4">
      {/* 4 Selectable Sorting Decks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {BINARY_SORTING_DECKS.map((deck) => {
          const active = deck.id === activeDeck.id;
          return (
            <button
              key={deck.id}
              type="button"
              onClick={() => handleResetDeck(deck.id)}
              className={`p-3.5 rounded-2xl text-left border transition cursor-pointer ${
                active
                  ? "bg-amber-900 text-amber-50 border-amber-900 shadow-sm"
                  : "eyecare-card hover:bg-amber-900/5"
              }`}
            >
              <div className="text-xs font-extrabold">{deck.title}</div>
              <div className="text-[11px] opacity-80 mt-0.5 line-clamp-1">
                {deck.leftLabel} vs {deck.rightLabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Binary Blitz Arena */}
      <div className="p-6 rounded-3xl eyecare-card border-2 border-amber-900/20 shadow-md space-y-5">
        {/* HUD Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div className="space-y-0.5">
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
              ⬅️➡️ BINARY BLITZ • PHÂN LOẠI PHẢN XẠ 2 CHIỀU (60 GIÂY)
            </span>
            <h3 className="text-base md:text-lg font-extrabold font-serif">
              {activeDeck.subtitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Hệ số: {multiplier}x</span>
              <span>(🔥 {streak} streak)</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {score} XP ({sortedCount} thẻ)
              </span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold cloze-mono-input flex items-center gap-1.5 ${
                secondsLeft <= 10
                  ? "bg-rose-600 text-white border-rose-500 animate-pulse"
                  : "eyecare-elevated"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{secondsLeft}s</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="px-3 py-1.5 rounded-xl eyecare-elevated border text-xs font-bold flex items-center gap-1 hover:bg-amber-900/10 cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" /> Tiếp tục
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" /> Tạm dừng
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleResetDeck()}
              className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1 hover:bg-amber-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Chơi lại 60s
            </button>
          </div>
        </div>

        {/* Center Falling Card & Left/Right Buttons */}
        {secondsLeft > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2">
            {/* LEFT CHOICE BUTTON */}
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={() => handleSortChoice("LEFT")}
                className="w-full py-6 px-4 rounded-3xl bg-indigo-600/15 hover:bg-indigo-600 hover:text-white border-2 border-indigo-600/40 text-indigo-950 dark:text-indigo-200 transition flex flex-col items-center justify-center gap-2 shadow-sm cursor-pointer group"
              >
                <ArrowLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm md:text-base font-black text-center">
                  {activeDeck.leftLabel}
                </span>
                <span className="text-[11px] font-bold opacity-75">
                  Phím [←] hoặc [A]
                </span>
              </button>
            </div>

            {/* FALLING CARD */}
            <div className="md:col-span-6">
              <div
                className={`p-6 md:p-8 rounded-3xl eyecare-elevated border-2 border-amber-900/25 shadow-lg text-center space-y-3 transition-all duration-200 ${
                  swipeAnim === "LEFT"
                    ? "-translate-x-12 -rotate-6 opacity-60"
                    : swipeAnim === "RIGHT"
                    ? "translate-x-12 rotate-6 opacity-60"
                    : "translate-x-0 rotate-0 opacity-100"
                }`}
              >
                <span className="inline-block px-3 py-1 rounded-full bg-amber-900/15 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
                  Thẻ #{cardIndex + 1} • {currentCard.contextHint}
                </span>
                <div className="text-lg md:text-2xl font-black font-serif leading-snug py-2">
                  {currentCard.term}
                </div>
                <p className="text-xs font-bold opacity-65">
                  Nhấn phím Mũi tên Trái [←] hoặc Mũi tên Phải [→] để phân loại tức thì!
                </p>
              </div>
            </div>

            {/* RIGHT CHOICE BUTTON */}
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={() => handleSortChoice("RIGHT")}
                className="w-full py-6 px-4 rounded-3xl bg-teal-600/15 hover:bg-teal-600 hover:text-white border-2 border-teal-600/40 text-teal-950 dark:text-teal-200 transition flex flex-col items-center justify-center gap-2 shadow-sm cursor-pointer group"
              >
                <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                <span className="text-sm md:text-base font-black text-center">
                  {activeDeck.rightLabel}
                </span>
                <span className="text-[11px] font-bold opacity-75">
                  Phím [→] hoặc [D]
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-amber-900/10 border text-center space-y-3">
            <h4 className="text-xl font-black font-serif">
              ⏱️ Hết 60 giây! Bạn đã phân loại đúng {sortedCount} thẻ C1/C2 • Tổng điểm: {score} XP
            </h4>
            <button
              type="button"
              onClick={() => handleResetDeck()}
              className="px-5 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs md:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Chơi lượt 60s mới
            </button>
          </div>
        )}

        {/* Instant 1-Line Learning Explanation */}
        {lastFeedback && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              lastFeedback.correct
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                : "bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-200"
            }`}
          >
            <div className="text-xs md:text-sm space-y-0.5">
              <div className="font-extrabold flex items-center gap-1.5">
                {lastFeedback.correct ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>
                  {lastFeedback.correct ? "Chính xác!" : "Nhầm hướng!"} Đáp án:{" "}
                  <strong>{lastFeedback.card.resolvedForm}</strong>
                </span>
              </div>
              <p className="text-xs opacity-90 pl-5">
                💡 {lastFeedback.card.explanationVi}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onSaveVocab) {
                  onSaveVocab({
                    word: lastFeedback.card.resolvedForm,
                    meaning: lastFeedback.card.explanationVi,
                    example: lastFeedback.card.term,
                    level: "C1/C2 Binary Blitz",
                  });
                }
                setSavedIds((prev) => ({
                  ...prev,
                  [lastFeedback.card.id]: true,
                }));
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              {savedIds[lastFeedback.card.id]
                ? "Đã lưu SM-2 ✓"
                : "+ Lưu vào Flashcard"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
