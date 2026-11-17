"use client";

import {
  LexicalEntry,
  PREBUILT_ENTRIES,
  DeckId,
} from "./lexical-data";
import {
  getMistakeVaultItems,
  MistakeVaultItem,
} from "../linguistics/deep-linguistic-engine";

// ============================================================================
// SM-2 SPACED REPETITION STATE
// ============================================================================
export interface Sm2State {
  ease: number; // easiness factor (>=1.3)
  interval: number; // minutes
  reps: number;
  due: number; // epoch ms
  lapses: number;
  lastGrade: number;
}

export type MasteryStatus = "NEW" | "LEARNING" | "MASTERED";
export type Grade = 1 | 2 | 3 | 4; // 1 Quên · 2 Khó · 3 Nhớ · 4 Phản xạ

const SM2_KEY = "veng_lexical_sm2_v1";
const CUSTOM_KEY = "veng_lexical_custom_v1";
const DAY_MIN = 1440;

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

let sm2Cache: Record<string, Sm2State> | null = null;

export function getSm2Map(): Record<string, Sm2State> {
  if (!sm2Cache) sm2Cache = safeRead<Record<string, Sm2State>>(SM2_KEY, {});
  return sm2Cache;
}

const DEFAULT_SM2: Sm2State = {
  ease: 2.5,
  interval: 0,
  reps: 0,
  due: 0,
  lapses: 0,
  lastGrade: 0,
};

/** Pure SM-2 scheduling (minutes). */
export function computeNextSm2(prev: Sm2State | undefined, grade: Grade): Sm2State {
  const s = prev ? { ...prev } : { ...DEFAULT_SM2 };
  const q = grade === 1 ? 1 : grade === 2 ? 3 : grade === 3 ? 4 : 5;
  s.ease = Math.max(1.3, s.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (grade === 1) {
    s.reps = 0;
    s.lapses += 1;
    s.interval = 10; // 10 minutes
  } else if (grade === 2) {
    s.interval = s.reps === 0 ? DAY_MIN : Math.max(DAY_MIN, Math.round(s.interval * 1.2));
    s.reps += 1;
  } else if (grade === 3) {
    s.interval =
      s.reps === 0 ? DAY_MIN : s.reps === 1 ? 4 * DAY_MIN : Math.round(s.interval * s.ease);
    s.reps += 1;
  } else {
    s.interval =
      s.reps === 0 ? 4 * DAY_MIN : Math.round(Math.max(4 * DAY_MIN, s.interval) * s.ease * 1.3);
    s.reps += 1;
  }
  s.lastGrade = grade;
  s.due = Date.now() + s.interval * 60000;
  return s;
}

export function formatIntervalVi(minutes: number): string {
  if (minutes < 60) return `${minutes}p`;
  if (minutes < DAY_MIN) return `${Math.round(minutes / 60)} giờ`;
  const days = Math.round(minutes / DAY_MIN);
  if (days < 30) return `${days} ngày`;
  return `${Math.round(days / 30)} tháng`;
}

export function previewIntervals(id: string): Record<Grade, string> {
  const prev = getSm2Map()[id];
  return {
    1: formatIntervalVi(computeNextSm2(prev, 1).interval),
    2: formatIntervalVi(computeNextSm2(prev, 2).interval),
    3: formatIntervalVi(computeNextSm2(prev, 3).interval),
    4: formatIntervalVi(computeNextSm2(prev, 4).interval),
  };
}

export function gradeCard(id: string, grade: Grade): Record<string, Sm2State> {
  const map = { ...getSm2Map() };
  map[id] = computeNextSm2(map[id], grade);
  sm2Cache = map;
  safeWrite(SM2_KEY, map);
  return map;
}

export function getMasteryStatus(
  id: string,
  map: Record<string, Sm2State> = getSm2Map()
): MasteryStatus {
  const s = map[id];
  if (!s || s.reps === 0 && s.lapses === 0) return "NEW";
  if (s.interval >= 4 * DAY_MIN && s.lastGrade >= 3) return "MASTERED";
  return "LEARNING";
}

// ============================================================================
// CUSTOM WORDS ("Bộ Từ Của Tôi")
// ============================================================================
let customCache: LexicalEntry[] | null = null;

export function getCustomEntries(): LexicalEntry[] {
  if (!customCache) customCache = safeRead<LexicalEntry[]>(CUSTOM_KEY, []);
  return customCache;
}

function persistCustom(next: LexicalEntry[]) {
  customCache = next;
  safeWrite(CUSTOM_KEY, next);
}

export function removeCustomEntry(id: string): LexicalEntry[] {
  const next = getCustomEntries().filter((e) => e.id !== id);
  persistCustom(next);
  return next;
}

const NEG_PREFIX = /^(un|in|im|il|ir|dis|mis|non)/i;

/** Heuristic auto-generation of the 5-layer matrix for a user-entered word. */
export function autoGenerateEntry(input: {
  word: string;
  meaningVi?: string;
  example?: string;
  collocations?: string;
}): LexicalEntry {
  const word = input.word.trim();
  const lower = word.toLowerCase();
  const family: LexicalEntry["family"] = {};
  const stem = lower.replace(/(ation|ition|ment|ness|ity|ous|ive|able|ible|al|ly|ize|ise|ate|ed|ing)$/,"");

  if (/(tion|sion|ment|ness|ity|ance|ence)$/.test(lower)) family.noun = lower;
  else if (/ly$/.test(lower)) family.adv = lower;
  else if (/(ous|ive|able|ible|al|ic|ful|less|ent|ant)$/.test(lower)) {
    family.adj = lower;
    family.adv = lower.endsWith("le") ? lower.slice(0, -1) + "y" : lower + "ly";
  } else if (/(ize|ise|ate|ify|en)$/.test(lower)) family.verb = lower;
  else if (!lower.includes(" ")) family.verb = lower;

  if (NEG_PREFIX.test(lower)) family.neg = lower;
  else if (family.adj) {
    const first = family.adj[0];
    const prefix = first === "l" ? "il" : first === "r" ? "ir" : "bmp".includes(first) ? "im" : "un";
    family.neg = prefix + family.adj;
  }

  const prefixNote = NEG_PREFIX.test(lower)
    ? `Tiền tố phủ định "${lower.match(NEG_PREFIX)?.[0]}-" + gốc "${lower.replace(NEG_PREFIX, "")}".`
    : `Gốc "${stem || lower}"${lower !== stem ? ` + hậu tố "-${lower.slice(stem.length)}"` : ""}.`;

  const cols = (input.collocations || "")
    .split(/[;,|]/)
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    deck: "custom",
    word,
    ipa: "",
    register: word.includes(" ") ? "Idiom" : "Formal",
    meaningVi: input.meaningVi?.trim() || "(Chưa có nghĩa — chạm để bổ sung)",
    definitionEn: input.meaningVi?.trim() || word,
    family,
    collocations: cols.length ? cols : [`use "${word}" in context`],
    etymology: prefixNote,
    trap: "Kiểm tra từ điển Oxford Collocations để xác nhận giới từ / động từ đi kèm.",
    example: input.example?.trim() || "",
  };
}

export function addCustomEntries(entries: LexicalEntry[]): LexicalEntry[] {
  const existing = getCustomEntries();
  const seen = new Set(existing.map((e) => e.word.toLowerCase()));
  const fresh = entries.filter((e) => {
    const k = e.word.toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const next = [...fresh, ...existing];
  persistCustom(next);
  return next;
}

/** Parses lines like "word - meaning", "word: meaning", "word\tmeaning", "word = meaning". */
export function parseBulkVocabulary(raw: string): Array<{ word: string; meaningVi: string }> {
  return String(raw || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(\d+[\.\)]|[-*•])\s*/, "").trim())
    .filter((l) => l.length > 1)
    .map((line) => {
      const m = line.match(/^(.+?)\s*(?:\s[-–—]\s|:|\t|=)\s*(.+)$/);
      if (m) return { word: m[1].trim(), meaningVi: m[2].trim() };
      return { word: line, meaningVi: "" };
    })
    .filter((x) => x.word.length > 0 && x.word.length < 80);
}

// ============================================================================
// MISTAKE VAULT → LEXICAL ENTRIES
// ============================================================================
export function mistakeToEntry(m: MistakeVaultItem): LexicalEntry {
  const word = (m.word || m.correctText || "").replace(/\(.*?\)/g, "").trim() || m.correctText;
  return {
    id: `mistake-${m.id}`,
    deck: "mistakes",
    word,
    ipa: m.ipa || "",
    register: (m.register as LexicalEntry["register"]) || "Formal",
    meaningVi: m.meaning || m.etymologyAndNuance,
    definitionEn: m.correctText,
    family: {},
    collocations: [m.collocationAndSyntax].filter(Boolean),
    etymology: m.etymologyAndNuance,
    trap: m.trapAnalysis,
    example: (m.stem || "").replace(/_{2,}/g, m.correctText),
    sourceTag: `${m.sourceTag} • sai ${m.mistakeCount} lần`,
  };
}

export function getAllEntries(): LexicalEntry[] {
  let mistakes: LexicalEntry[] = [];
  try {
    mistakes = getMistakeVaultItems().map(mistakeToEntry);
  } catch {}
  return [...mistakes, ...PREBUILT_ENTRIES, ...getCustomEntries()];
}

export function countByDeck(entries: LexicalEntry[]): Record<DeckId, number> {
  const out: Record<DeckId, number> = {
    mistakes: 0,
    core: 0,
    wordform: 0,
    confusable: 0,
    academic: 0,
    custom: 0,
  };
  for (const e of entries) out[e.deck] += 1;
  return out;
}

// ============================================================================
// SPEECH
// ============================================================================
export function speakWord(text: string, accent: "en-GB" | "en-US" = "en-GB", rate = 0.92) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[\[\]()]/g, ""));
    u.lang = accent;
    u.rate = rate;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang === accent);
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {}
}
