"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Rocket,
  Shield,
  Flame,
  Trophy,
  RotateCcw,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
  Send,
  Sparkles,
} from "lucide-react";

interface RawMeteorItem {
  rootWord: string;
  targetPosHint: string;
  sentenceStem: string;
  correctDerivative: string;
  distractors: [string, string, string];
  morphTip: string;
}

interface BalancedMeteorItem extends RawMeteorItem {
  id: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  correctLetter: "A" | "B" | "C" | "D";
}

const RAW_METEOR_BANK: RawMeteorItem[] = [
  {
    rootWord: "PRECEDE",
    targetPosHint: "Negative Adjective (Chưa từng có tiền lệ)",
    sentenceStem: "The pandemic caused an _______ disruption to global supply chains.",
    correctDerivative: "unprecedented",
    distractors: ["unprecedenting", "inprecedented", "precedential"],
    morphTip: "PRECEDE -> precedent -> unprecedented (tiền tố UN- + hậu tố -ED).",
  },
  {
    rootWord: "RECONCILE",
    targetPosHint: "Negative Adjective (Không thể dung hòa)",
    sentenceStem: "Talks collapsed due to _______ differences between the two factions.",
    correctDerivative: "irreconcilable",
    distractors: ["unreconcilable", "irreconciliable", "inreconcilable"],
    morphTip: "RECONCILE -> irreconcilable (bỏ 'e' trước -able, dùng tiền tố IR-).",
  },
  {
    rootWord: "BREAK",
    targetPosHint: "Compound Noun (Sự bùng phát dịch bệnh)",
    sentenceStem: "Epidemiologists traced the cholera _______ to a contaminated well.",
    correctDerivative: "outbreak",
    distractors: ["breakout", "breakage", "breakdown"],
    morphTip: "BREAK -> outbreak (sự bùng phát dịch bệnh/chiến tranh). Breakout = vượt ngục.",
  },
  {
    rootWord: "CONTROVERSY",
    targetPosHint: "Negative Adjective (Không gây tranh cãi)",
    sentenceStem: "The judge’s _______ nomination was approved unanimously by the senate.",
    correctDerivative: "uncontroversial",
    distractors: ["incontroversial", "discontroversial", "noncontroversy"],
    morphTip: "CONTROVERSY -> controversial -> uncontroversial.",
  },
  {
    rootWord: "PROPORTION",
    targetPosHint: "Negative Adverb (Một cách bất cân xứng)",
    sentenceStem: "Low-income families are _______ burdened by consumption taxes.",
    correctDerivative: "disproportionately",
    distractors: ["unproportionately", "inproportionately", "misproportionally"],
    morphTip: "PROPORTION -> disproportionate -> disproportionately (tiền tố DIS-).",
  },
  {
    rootWord: "EQUIVOCATE",
    targetPosHint: "Negative Adjective (Dứt khoát, không mập mờ)",
    sentenceStem: "The council issued an _______ condemnation of the cyberattack.",
    correctDerivative: "unequivocal",
    distractors: ["inequivocal", "disequivocal", "equivocative"],
    morphTip: "EQUIVOCATE -> unequivocal (rõ ràng, dứt khoát 100%).",
  },
  {
    rootWord: "DISPENSE",
    targetPosHint: "Negative Adjective (Không thể thiếu được)",
    sentenceStem: "Extreme-ultraviolet lithography is _______ to modern chipmaking.",
    correctDerivative: "indispensable",
    distractors: ["undispensable", "indispensible", "dispensatory"],
    morphTip: "DISPENSE -> indispensable (chú ý đuôi -ABLE, không phải -ible!).",
  },
  {
    rootWord: "REPLACE",
    targetPosHint: "Negative Adjective (Không thể thay thế)",
    sentenceStem: "The fire destroyed several _______ medieval tapestries.",
    correctDerivative: "irreplaceable",
    distractors: ["irreplacable", "unreplaceable", "inreplaceable"],
    morphTip: "REPLACE -> irreplaceable (bắt buộc giữ chữ 'e' sau 'c': irreplace-able).",
  },
  {
    rootWord: "EXPLAIN",
    targetPosHint: "Negative Adjective (Không thể lý giải nổi)",
    sentenceStem: "For reasons that remain _______, the sonar array went offline.",
    correctDerivative: "inexplicable",
    distractors: ["unexplainable", "inexplainable", "explicative"],
    morphTip: "EXPLAIN -> inexplicable (biến đổi gốc từ chuẩn C1/C2).",
  },
  {
    rootWord: "REVOKE",
    targetPosHint: "Negative Adjective (Không thể thu hồi/hủy bỏ)",
    sentenceStem: "Once notarized, the sovereign guarantee becomes legally _______.",
    correctDerivative: "irrevocable",
    distractors: ["irrevokable", "unrevocable", "inrevocable"],
    morphTip: "REVOKE -> irrevocable (đổi 'ke' thành 'c' + able).",
  },
  {
    rootWord: "COMPARE",
    targetPosHint: "Negative Adjective (Vô song, không gì sánh kịp)",
    sentenceStem: "The cellist played with an _______ depth of emotional expression.",
    correctDerivative: "incomparable",
    distractors: ["uncomparable", "incomparible", "noncomparable"],
    morphTip: "COMPARE -> incomparable (bỏ 'e' + able, tiền tố IN-).",
  },
  {
    rootWord: "COME",
    targetPosHint: "Compound Noun (Khuyết điểm, nhược điểm)",
    sentenceStem: "Chronic impatience remained the commander’s greatest tactical _______.",
    correctDerivative: "shortcoming",
    distractors: ["downcoming", "outcoming", "incoming"],
    morphTip: "COME -> shortcoming (khuyết điểm, thiếu sót).",
  },
];

function buildBalancedMeteorDeck(): BalancedMeteorItem[] {
  const letters: ["A", "B", "C", "D"] = ["A", "B", "C", "D"];
  return RAW_METEOR_BANK.map((item, idx) => {
    const targetSlot = ((idx * 3 + 1) % 4) as 0 | 1 | 2 | 3;
    const options: [string, string, string, string] = ["", "", "", ""];
    let dIdx = 0;
    for (let s = 0; s < 4; s++) {
      if (s === targetSlot) {
        options[s] = item.correctDerivative;
      } else {
        options[s] = item.distractors[dIdx++];
      }
    }
    return {
      ...item,
      id: `meteor-${idx + 1}`,
      options,
      correctIndex: targetSlot,
      correctLetter: letters[targetSlot],
    };
  });
}

interface MeteorWordFormGameProps {
  onSaveVocab?: (item: {
    word: string;
    meaning: string;
    example: string;
    level?: string;
  }) => void;
}

export default function MeteorWordFormGame({
  onSaveVocab,
}: MeteorWordFormGameProps) {
  const meteorDeck = useMemo(() => buildBalancedMeteorDeck(), []);
  const [meteorIdx, setMeteorIdx] = useState(0);
  const [altitudePercent, setAltitudePercent] = useState(8); // 8% (top sky) -> 88% (city impact)
  const [cityShields, setCityShields] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [typedDerivative, setTypedDerivative] = useState("");
  const [blastState, setBlastState] = useState<"falling" | "exploded" | "impact">(
    "falling"
  );
  const [lastReport, setLastReport] = useState<{
    success: boolean;
    item: BalancedMeteorItem;
  } | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const lockRef = useRef(false);

  const currentMeteor =
    meteorDeck[meteorIdx % meteorDeck.length] || meteorDeck[0];

  const handleFireRocket = useCallback(
    (selectedOptionOrTyped: string | "IMPACT") => {
      if (lockRef.current || !currentMeteor) return;
      lockRef.current = true;

      const normalizedInput = String(selectedOptionOrTyped)
        .trim()
        .toLowerCase();
      const isHit =
        selectedOptionOrTyped !== "IMPACT" &&
        normalizedInput === currentMeteor.correctDerivative.toLowerCase();

      if (isHit) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setBlastState("exploded");
        const altitudeBonus = Math.max(10, 100 - altitudePercent);
        setScore((s) => s + 120 + altitudeBonus);
        setLastReport({
          success: true,
          item: currentMeteor,
        });
      } else {
        setStreak(0);
        setBlastState("impact");
        setCityShields((sh) => Math.max(0, sh - 1));
        setLastReport({
          success: false,
          item: currentMeteor,
        });
      }

      setTypedDerivative("");
      setTimeout(() => {
        setBlastState("falling");
        setAltitudePercent(8);
        setMeteorIdx((i) => i + 1);
        lockRef.current = false;
      }, 650);
    },
    [currentMeteor, streak, altitudePercent]
  );

  // Meteor Descent Loop
  useEffect(() => {
    if (isPaused || cityShields <= 0 || lockRef.current) return;
    const interval = setInterval(() => {
      setAltitudePercent((prev) => {
        if (prev >= 86) {
          clearInterval(interval);
          handleFireRocket("IMPACT");
          return 86;
        }
        return prev + 2;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isPaused, cityShields, meteorIdx, handleFireRocket]);

  const handleRestartDefense = () => {
    lockRef.current = false;
    setCityShields(3);
    setScore(0);
    setStreak(0);
    setAltitudePercent(8);
    setBlastState("falling");
    setMeteorIdx((i) => i + 1);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl eyecare-card border-2 border-amber-900/20 shadow-md overflow-hidden">
        {/* Top Defense HUD */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900/10 via-amber-900/10 to-rose-900/10 border-b flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5">
              ☄️ METEOR WORD-FORM STRIKE
            </span>

            <div className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-900 dark:text-sky-300 border border-sky-500/30 text-xs font-extrabold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Khiên Thành Phố: {cityShields}/3 🛡️</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 text-xs font-extrabold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              <span>🔥 {streak}x Streak</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>{score} XP</span>
            </div>

            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="px-3 py-1.5 rounded-xl eyecare-elevated border text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" /> Tiếp tục
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" /> Đóng băng thiên thạch
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleRestartDefense}
              className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Chơi lại
            </button>
          </div>
        </div>

        {cityShields > 0 ? (
          <div className="p-5 md:p-6 space-y-5">
            {/* Sky Arena with Descending Root-Word Meteor */}
            <div className="relative h-52 rounded-2xl bg-gradient-to-b from-slate-900 via-indigo-950 to-amber-950 text-white overflow-hidden border border-amber-500/30 p-4 flex flex-col justify-between">
              {/* Altitude Progress */}
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-200/90 z-10">
                <span>
                  Thiên thạch #{meteorIdx + 1}: {currentMeteor.rootWord} ➔{" "}
                  {currentMeteor.targetPosHint}
                </span>
                <span className="cloze-mono-input">
                  Độ cao va chạm: {Math.max(0, 88 - altitudePercent)}%
                </span>
              </div>

              {/* Descending Meteor */}
              <div
                className="mx-auto transition-all duration-150 z-10"
                style={{
                  transform: `translateY(${Math.round(
                    (altitudePercent / 90) * 68
                  )}px)`,
                }}
              >
                <div
                  className={`px-5 py-3 rounded-2xl border-2 shadow-xl text-center transition ${
                    blastState === "exploded"
                      ? "bg-emerald-500 border-emerald-200 text-slate-950 scale-110"
                      : blastState === "impact"
                      ? "bg-rose-600 border-rose-200 text-white scale-95"
                      : "bg-gradient-to-r from-amber-600 to-orange-600 border-amber-300 text-white"
                  }`}
                >
                  <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-90">
                    {blastState === "exploded"
                      ? "💥 ĐÃ BẮN HẠ THIÊN THẠCH!"
                      : blastState === "impact"
                      ? "⚠️ VA CHẠM KHIÊN THÀNH PHỐ!"
                      : `☄️ GỐC TỪ: ${currentMeteor.rootWord}`}
                  </div>
                  <div className="text-sm md:text-base font-black mt-0.5">
                    {currentMeteor.targetPosHint}
                  </div>
                </div>
              </div>

              {/* Sentence Context at City Horizon */}
              <div className="z-10 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-amber-400/30 text-xs md:text-sm font-serif text-amber-50 text-center">
                {currentMeteor.sentenceStem}
              </div>
            </div>

            {/* 4 Clickable Derivative Defense Rockets */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-75 flex items-center justify-between">
                <span>🚀 Phóng Tên Lửa Phái Sinh (Chọn 1 trong 4 hoặc Gõ trực tiếp):</span>
                <span>Phân bổ chuẩn Fisher-Yates A/B/C/D</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {currentMeteor.options.map((opt, idx) => {
                  const letter = ["A", "B", "C", "D"][idx];
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleFireRocket(opt)}
                      className="p-4 rounded-2xl eyecare-elevated border-2 border-amber-900/20 hover:border-amber-700 hover:bg-amber-900/10 transition flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-900 text-amber-50 text-xs font-black flex items-center justify-center">
                          {letter}
                        </span>
                        <span className="text-sm md:text-base font-black cloze-mono-input">
                          {opt}
                        </span>
                      </div>
                      <Rocket className="w-4 h-4 text-amber-700 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Direct Typing Laser Cannon */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (typedDerivative.trim()) {
                  handleFireRocket(typedDerivative.trim());
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={typedDerivative}
                onChange={(e) => setTypedDerivative(e.target.value)}
                placeholder={`Hoặc gõ trực tiếp từ phái sinh của ${currentMeteor.rootWord} rồi nhấn Enter...`}
                className="flex-1 px-4 py-2.5 rounded-xl eyecare-elevated border text-xs md:text-sm cloze-mono-input focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Khai hỏa
              </button>
            </form>

            {/* Instant Morphological Tip */}
            {lastReport && (
              <div
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  lastReport.success
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                    : "bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-200"
                }`}
              >
                <div className="text-xs md:text-sm space-y-0.5">
                  <div className="font-extrabold flex items-center gap-1.5">
                    {lastReport.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>
                      {lastReport.item.rootWord} ➔{" "}
                      <strong className="cloze-mono-input">
                        {lastReport.item.correctDerivative}
                      </strong>{" "}
                      (Tên lửa {lastReport.item.correctLetter})
                    </span>
                  </div>
                  <p className="text-xs opacity-90 pl-5">
                    💡 {lastReport.item.morphTip}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onSaveVocab) {
                      onSaveVocab({
                        word: `${lastReport.item.rootWord} -> ${lastReport.item.correctDerivative}`,
                        meaning: lastReport.item.morphTip,
                        example: lastReport.item.sentenceStem.replace(
                          "_______",
                          `[${lastReport.item.correctDerivative}]`
                        ),
                        level: "C1/C2 Word Formation",
                      });
                    }
                    setSavedIds((prev) => ({
                      ...prev,
                      [lastReport.item.id]: true,
                    }));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  {savedIds[lastReport.item.id]
                    ? "Đã lưu SM-2 ✓"
                    : "+ Lưu Word Form"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center space-y-3">
            <h4 className="text-xl font-black font-serif">
              🛡️ Khiên Thành Phố đã cạn! Bạn đạt {score} XP trong chiến dịch chống bão thiên thạch Word-Form.
            </h4>
            <button
              type="button"
              onClick={handleRestartDefense}
              className="px-5 py-2.5 rounded-xl bg-amber-900 text-amber-50 text-xs md:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Khôi phục 3 Khiên &amp; Chơi lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
