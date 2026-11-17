"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  RotateCw,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Shuffle,
} from "lucide-react";
import {
  LexicalEntry,
  WORD_FORMATION_LAB,
  PREP_SNAP_ITEMS,
  ROOTS_40,
  WordFormationItem,
} from "../../lib/vocab/lexical-data";
import {
  Grade,
  gradeCard,
  previewIntervals,
  speakWord,
  Sm2State,
} from "../../lib/vocab/vocab-store";
import { addUserXp } from "../../lib/auth/auth-store";
import WordMatrixCard from "./WordMatrixCard";

const EmptyState = ({ text }: { text: string }) => (
  <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
    {text}
  </div>
);

// ============================================================================
// MODE 1 — SM-2 FLIP CARDS
// ============================================================================
export function FlipCardsMode({
  entries,
  onGraded,
}: {
  entries: LexicalEntry[];
  onGraded: (map: Record<string, Sm2State>) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const touchX = useRef<number | null>(null);

  const entry = entries.length ? entries[idx % entries.length] : null;
  const intervals = useMemo(() => (entry ? previewIntervals(entry.id) : null), [entry, sessionCount]);

  const handleGrade = useCallback(
    (g: Grade) => {
      if (!entry) return;
      const map = gradeCard(entry.id, g);
      onGraded(map);
      if (g >= 3) addUserXp(g === 4 ? 8 : 5);
      setFlipped(false);
      setSessionCount((c) => c + 1);
      setIdx((i) => (i + 1) % Math.max(1, entries.length));
    },
    [entry, entries.length, onGraded]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
        handleGrade(Number(e.key) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, handleGrade]);

  if (!entry || !intervals) return <EmptyState text="Bộ từ này chưa có thẻ nào để ôn." />;

  const GRADE_BTNS: Array<{ g: Grade; label: string; cls: string }> = [
    { g: 1, label: "Quên", cls: "bg-rose-600 hover:bg-rose-700" },
    { g: 2, label: "Khó", cls: "bg-amber-500 hover:bg-amber-600" },
    { g: 3, label: "Nhớ", cls: "bg-emerald-600 hover:bg-emerald-700" },
    { g: 4, label: "Phản xạ", cls: "bg-indigo-600 hover:bg-indigo-700" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>
          Thẻ {(idx % entries.length) + 1}/{entries.length} • Đã ôn {sessionCount}
        </span>
        <span className="hidden sm:inline">Space: lật • 1–4: chấm điểm • vuốt trái/phải để lật</span>
      </div>

      <div
        className="relative min-h-[320px] [perspective:1200px] cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) setFlipped((f) => !f);
          touchX.current = null;
        }}
      >
        <div
          className="relative w-full min-h-[320px] transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center p-6 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{entry.register}</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white break-words">{entry.word}</h2>
            {entry.ipa && <p className="text-sm font-mono text-slate-500 mt-1">{entry.ipa}</p>}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(entry.word);
              }}
              className="mt-4 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <p className="text-[11px] text-slate-400 mt-6 flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Chạm để lật thẻ
            </p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-xs p-4 sm:p-5 overflow-y-auto">
            <WordMatrixCard entry={entry} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {GRADE_BTNS.map((b) => (
          <button
            key={b.g}
            type="button"
            disabled={!flipped}
            onClick={() => handleGrade(b.g)}
            className={`py-2.5 rounded-xl text-white text-xs font-bold flex flex-col items-center gap-0.5 transition disabled:opacity-35 ${b.cls}`}
          >
            <span>
              {b.g}. {b.label}
            </span>
            <span className="text-[10px] font-semibold opacity-90">{intervals[b.g]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MODE 2 — WORD FORMATION LAB
// ============================================================================
const SLOT_CHIPS = ["Noun", "Verb", "Adj", "Adv"] as const;

export function WordFormationLabMode() {
  const [order, setOrder] = useState<WordFormationItem[]>(() => WORD_FORMATION_LAB);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [pol, setPol] = useState<string | null>(null);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const item = order[idx % order.length];

  const next = () => {
    setIdx((i) => (i + 1) % order.length);
    setTyped("");
    setSlot(null);
    setPol(null);
    setChecked(null);
  };

  const check = () => {
    const ok = item.answers.includes(typed.trim().toLowerCase());
    setChecked(ok);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
    if (ok) addUserXp(10);
  };

  const feedback = useMemo(() => {
    if (checked === null || checked) return null;
    const t = typed.trim().toLowerCase();
    const ans = item.answers[0];
    const notes: string[] = [];
    const hasNeg = /^(un|in|im|il|ir|dis|mis)/.test(t);
    const ansNeg = /^(un|in|im|il|ir|dis|mis)/.test(ans);
    if (ansNeg && !hasNeg) notes.push("Thiếu tiền tố phủ định — ngữ cảnh mang sắc thái tiêu cực.");
    if (!ansNeg && hasNeg) notes.push("Thừa tiền tố phủ định.");
    if (ansNeg && hasNeg && t.slice(0, 2) !== ans.slice(0, 2))
      notes.push(`Sai tiền tố: cần "${ans.match(/^(un|in|im|il|ir|dis|mis)/)?.[0]}-".`);
    if (item.slot === "Adv" && !t.endsWith("ly")) notes.push("Vị trí cần Trạng từ (thường kết thúc -ly).");
    if (item.slot === "Noun" && /ly$/.test(t)) notes.push("Vị trí cần Danh từ, không phải Trạng từ.");
    if (notes.length === 0) notes.push("Sai hậu tố hoặc chính tả — đối chiếu với đáp án.");
    return notes;
  }, [checked, typed, item]);

  const parts = item.sentence.split("_____");

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>Câu {(idx % order.length) + 1}/{order.length}</span>
        <div className="flex items-center gap-2">
          <span>Đúng {score.right}/{score.total}</span>
          <button
            type="button"
            onClick={() => {
              setOrder([...order].sort(() => Math.random() - 0.5));
              setIdx(0);
            }}
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Xáo trộn"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
        {parts[0]}
        <span className="inline-block min-w-[90px] px-2 mx-1 border-b-2 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold text-center">
          {checked !== null ? item.answers[0] : typed || "\u00a0"}
        </span>
        {parts[1]}
        <span className="ml-2 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold tracking-wider">
          {item.root}
        </span>
      </p>

      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-500">Gợi ý hình thái 1 chạm:</div>
        <div className="flex flex-wrap gap-1.5">
          {SLOT_CHIPS.map((s) => {
            const picked = slot === s;
            const correct = item.slot === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                  picked
                    ? correct
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-rose-600 border-rose-600 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                [{s}]
              </button>
            );
          })}
          <span className="text-slate-300 px-0.5">|</span>
          {[
            { id: "POSITIVE", label: "+ Khẳng định" },
            { id: "NEGATIVE", label: "– Phủ định" },
          ].map((p) => {
            const picked = pol === p.id;
            const correct = item.polarity === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPol(p.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                  picked
                    ? correct
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-rose-600 border-rose-600 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                [{p.label}]
              </button>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (checked === null) check();
          else next();
        }}
        className="flex gap-2"
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={checked !== null}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={`Biến đổi từ ${item.root}...`}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
        >
          {checked === null ? "Kiểm tra" : (<>Tiếp <ArrowRight className="w-3.5 h-3.5" /></>)}
        </button>
      </form>

      {checked !== null && (
        <div
          className={`p-3 rounded-xl border text-xs space-y-1 ${
            checked
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800"
              : "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800"
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
            {checked ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
            Đáp án: {item.answers[0]} [{item.slot} • {item.polarity === "NEGATIVE" ? "Phủ định" : "Khẳng định"}]
          </div>
          {feedback?.map((f, i) => (
            <p key={i} className="text-rose-700 dark:text-rose-300">• {f}</p>
          ))}
          <p className="text-slate-700 dark:text-slate-300">{item.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODE 3 — COLLOCATION & PREP SNAP
// ============================================================================
export function PrepSnapMode() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(8);
  const item = PREP_SNAP_ITEMS[idx % PREP_SNAP_ITEMS.length];

  useEffect(() => {
    if (picked !== null) return;
    setTimeLeft(8);
    const id = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [idx, picked]);

  useEffect(() => {
    if (timeLeft === 0 && picked === null) {
      setPicked("__timeout__");
      setStreak(0);
    }
  }, [timeLeft, picked]);

  const choose = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    if (opt === item.answer) {
      setStreak((s) => s + 1);
      addUserXp(6);
    } else setStreak(0);
  };

  const advance = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  useEffect(() => {
    if (picked === item.answer) {
      const t = setTimeout(advance, 700);
      return () => clearTimeout(t);
    }
  }, [picked, item.answer]);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>Câu {(idx % PREP_SNAP_ITEMS.length) + 1}/{PREP_SNAP_ITEMS.length} • Chuỗi đúng {streak}</span>
        <span className={`tabular-nums ${timeLeft <= 3 ? "text-rose-600" : ""}`}>{timeLeft}s</span>
      </div>
      <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 8) * 100}%` }} />
      </div>

      <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
        {item.before}{" "}
        <span className={`inline-block min-w-[64px] px-2 rounded-lg border-2 text-center ${
          picked === null
            ? "border-dashed border-indigo-400 text-indigo-500"
            : picked === item.answer
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700"
            : "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700"
        }`}>
          {picked === null ? "___" : item.answer}
        </span>{" "}
        {item.after}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {item.options.map((o) => {
          const isAns = o === item.answer;
          const isPicked = o === picked;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              className={`py-3 rounded-xl border-2 text-sm font-bold transition ${
                picked === null
                  ? "border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-800 dark:text-slate-100"
                  : isAns
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200"
                  : isPicked
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200"
                  : "border-slate-200 dark:border-slate-700 text-slate-400"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>

      {picked !== null && picked !== item.answer && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            {picked === "__timeout__" ? "Hết giờ. " : ""}Khung chuẩn: <span className="font-mono">{item.rule}</span>
          </span>
          <button type="button" onClick={advance} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold">
            Tiếp
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODE 4 — AUDIO DICTATION & SPELLING
// ============================================================================
function buildMask(word: string): string {
  return word
    .split(" ")
    .map((w) =>
      w.length <= 2
        ? w.split("").map(() => "_").join(" ")
        : w[0] + " " + Array(w.length - 2).fill("_").join(" ") + " " + w[w.length - 1]
    )
    .join("   ");
}

export function DictationMode({ entries }: { entries: LexicalEntry[] }) {
  const pool = useMemo(() => entries.filter((e) => e.word.length >= 4 && e.word.length <= 32), [entries]);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [accent, setAccent] = useState<"en-GB" | "en-US">("en-GB");
  const entry = pool.length ? pool[idx % pool.length] : null;
  const target = entry ? entry.word.toLowerCase().replace(/[^a-z\s'-]/g, "").trim() : "";

  useEffect(() => {
    if (entry) {
      const t = setTimeout(() => speakWord(entry.word, accent, 0.85), 250);
      return () => clearTimeout(t);
    }
  }, [entry, accent]);

  if (!entry) return <EmptyState text="Chưa có từ phù hợp để luyện chính tả trong bộ này." />;

  const check = () => {
    const ok = typed.trim().toLowerCase().replace(/\s+/g, " ") === target;
    setResult(ok);
    if (ok) addUserXp(8);
  };

  const diff = result === false
    ? target.split("").map((ch, i) => ({ ch, ok: typed.toLowerCase()[i] === ch }))
    : null;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500">Từ {(idx % pool.length) + 1}/{pool.length}</span>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
          {(["en-GB", "en-US"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAccent(a)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${accent === a ? "bg-white dark:bg-slate-900 text-indigo-600" : "text-slate-500"}`}
            >
              {a === "en-GB" ? "UK" : "US"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => speakWord(entry.word, accent, 0.85)}
            className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
            title="Nghe lại"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => speakWord(entry.word, accent, 0.6)}
            className="px-3 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
          >
            Chậm
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 text-center max-w-md">
          <b>Định nghĩa:</b> {entry.definitionEn}
        </p>
        <p className="font-mono text-base tracking-wider text-slate-800 dark:text-slate-100">{buildMask(target)}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (result === null) check();
          else {
            setIdx((i) => i + 1);
            setTyped("");
            setResult(null);
          }
        }}
        className="flex gap-2"
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={result !== null}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Gõ chính xác từ vừa nghe..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
          {result === null ? "Kiểm tra" : "Tiếp"}
        </button>
      </form>

      {result !== null && (
        <div className={`p-3 rounded-xl border text-xs ${result ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800" : "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800"}`}>
          <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">
            {result ? "Chính xác." : "Chưa đúng — chữ sai được tô đỏ:"}
          </div>
          {diff && (
            <p className="font-mono text-base tracking-wide">
              {diff.map((d, i) => (
                <span key={i} className={d.ok ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 font-bold underline"}>
                  {d.ch}
                </span>
              ))}
            </p>
          )}
          <p className="text-slate-600 dark:text-slate-300 mt-1">{entry.meaningVi}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODE 5 — ROOT & AFFIX DECODER
// ============================================================================
export function RootDecoderMode() {
  const [view, setView] = useState<"explore" | "quiz">("explore");
  const [q, setQ] = useState("");
  const [originFilter, setOriginFilter] = useState<string>("ALL");
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizPick, setQuizPick] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ROOTS_40.filter(
      (r) =>
        (originFilter === "ALL" || r.origin === originFilter) &&
        (!s || r.root.toLowerCase().includes(s) || r.meaning.toLowerCase().includes(s) || r.words.some((w) => w.includes(s)))
    );
  }, [q, originFilter]);

  const quiz = useMemo(() => {
    const r = ROOTS_40[(quizIdx * 7) % ROOTS_40.length];
    const word = r.words[quizIdx % r.words.length];
    const distractors = ROOTS_40.filter((x) => x.root !== r.root)
      .sort((a, b) => ((a.root.length * 31 + quizIdx) % 17) - ((b.root.length * 31 + quizIdx) % 17))
      .slice(0, 3)
      .map((x) => x.root);
    const options = [...distractors];
    options.splice(quizIdx % 4, 0, r.root);
    return { word, answer: r.root, meaning: r.meaning, options };
  }, [quizIdx]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        {[
          { id: "explore", label: "Tra cứu gốc từ" },
          { id: "quiz", label: "Đố gốc từ" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id as "explore" | "quiz")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${view === t.id ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs" : "text-slate-600 dark:text-slate-400"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "explore" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm gốc, nghĩa hoặc từ ví dụ..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {["ALL", "Latin", "Greek", "Prefix", "Suffix"].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOriginFilter(o)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap ${originFilter === o ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                >
                  {o === "ALL" ? "Tất cả" : o === "Prefix" ? "Tiền tố" : o === "Suffix" ? "Hậu tố" : o}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] text-slate-500">{filtered.length} mục</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((r) => (
              <div key={r.root} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-700 dark:text-indigo-300">{r.root}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{r.origin}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{r.meaning}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {r.words.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => speakWord(w)}
                      className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-200 hover:border-indigo-400"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4">
          <p className="text-xs text-slate-500">Từ sau được cấu tạo từ gốc / phụ tố nào?</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center">{quiz.word}</h3>
          <div className="grid grid-cols-2 gap-2">
            {quiz.options.map((o) => {
              const isAns = o === quiz.answer;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => {
                    if (quizPick) return;
                    setQuizPick(o);
                    if (isAns) addUserXp(5);
                  }}
                  className={`py-2.5 rounded-xl border-2 text-sm font-mono font-bold ${
                    quizPick === null
                      ? "border-slate-200 dark:border-slate-700 hover:border-indigo-500"
                      : isAns
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800"
                      : quizPick === o
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800"
                      : "border-slate-200 dark:border-slate-700 text-slate-400"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
          {quizPick && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-700 dark:text-slate-300">
                <b className="font-mono">{quiz.answer}</b> = {quiz.meaning}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuizPick(null);
                  setQuizIdx((i) => i + 1);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
              >
                Tiếp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
