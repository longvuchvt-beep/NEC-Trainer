"use client";

export interface DeepLinguisticBreakdown {
  targetExpression: string;
  ipa: string;
  register: string;
  etymologyAndNuance: string;
  collocationAndSyntax: string;
  trapAnalysis: string;
}

export interface MistakeVaultItem {
  id: string;
  questionId: string;
  word: string;
  ipa: string;
  register: string;
  meaning: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  userWrongAnswer: string;
  correctAnswer: string;
  correctText: string;
  etymologyAndNuance: string;
  collocationAndSyntax: string;
  trapAnalysis: string;
  sourceTag: string;
  mistakeCount: number;
  mastered: boolean;
  lastMissedAt: number;
}

export interface FullControlSettings {
  // 1. Linguistic Depth & Audio
  explanationDepth: "standard" | "deep";
  autoSaveMistakes: boolean;
  showIpaAndRegister: boolean;
  voiceAccent: "en-GB" | "en-US";
  voiceSpeed: 0.8 | 1.0 | 1.2;

  // 2. 3D Game & Reflex Settings
  kangarooSpeedSec: 9 | 6 | 3.5;
  pauseOnMistake: boolean;
  soundAndHaptics: boolean;

  // 3. Personal Goals & Roadmap
  targetCompetition: "HSGQG" | "DHBB" | "Trại hè Hùng Vương" | "Olympic 30/4" | "Thi Chuyên";
  targetSchool: string;
  targetExamDate: string;
  dailyGoalQuestions: 15 | 30 | 50;

  // 4. Appearance & AI Key
  theme: "warm-paper" | "forest-matcha" | "midnight-slate";
  fontScale: "A" | "A+" | "A++";
  geminiApiKey: string;
}

const FULL_SETTINGS_KEY = "veng_full_control_settings_v2";
const MISTAKE_VAULT_KEY = "veng_mistake_vault_v1";
const DAILY_PROGRESS_KEY = "veng_daily_progress_v1";

function getDefaultExamDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 45);
  return d.toISOString().split("T")[0];
}

export const DEFAULT_FULL_SETTINGS: FullControlSettings = {
  explanationDepth: "deep",
  autoSaveMistakes: true,
  showIpaAndRegister: true,
  voiceAccent: "en-GB",
  voiceSpeed: 1.0,
  kangarooSpeedSec: 6,
  pauseOnMistake: true,
  soundAndHaptics: true,
  targetCompetition: "HSGQG",
  targetSchool: "THPT Chuyên Hùng Vương (Phú Thọ)",
  targetExamDate: getDefaultExamDate(),
  dailyGoalQuestions: 30,
  theme: "warm-paper",
  fontScale: "A",
  geminiApiKey: "",
};

export function getFullSettings(): FullControlSettings {
  if (typeof window === "undefined") return DEFAULT_FULL_SETTINGS;
  try {
    const raw = localStorage.getItem(FULL_SETTINGS_KEY);
    if (!raw) return DEFAULT_FULL_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FULL_SETTINGS,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch {
    return DEFAULT_FULL_SETTINGS;
  }
}

export function saveFullSettings(
  patch: Partial<FullControlSettings>
): FullControlSettings {
  const current = getFullSettings();
  const next: FullControlSettings = {
    ...current,
    ...patch,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(FULL_SETTINGS_KEY, JSON.stringify(next));
      if (patch.theme) localStorage.setItem("veye_theme", patch.theme);
      if (patch.fontScale) localStorage.setItem("veye_font_scale", patch.fontScale);
      window.dispatchEvent(
        new CustomEvent("veng-settings-changed", { detail: next })
      );
    } catch {}
  }
  return next;
}

// ============================================================================
// DAILY GOAL TRACKER
// ============================================================================
export function getDailyProgress(): { date: string; count: number } {
  const today = new Date().toISOString().split("T")[0];
  if (typeof window === "undefined") return { date: today, count: 0 };
  try {
    const raw = localStorage.getItem(DAILY_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.date === today) {
        return { date: today, count: Number(parsed.count) || 0 };
      }
    }
  } catch {}
  return { date: today, count: 0 };
}

export function incrementDailyAnsweredCount(delta = 1): number {
  const cur = getDailyProgress();
  const nextCount = cur.count + Math.max(1, delta);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        DAILY_PROGRESS_KEY,
        JSON.stringify({ date: cur.date, count: nextCount })
      );
      window.dispatchEvent(new CustomEvent("veng-daily-progress-updated"));
    } catch {}
  }
  return nextCount;
}

// ============================================================================
// CURATED ETYMOLOGY, IPA & COLLOCATION DICTIONARY FOR C1/C2 EXPRESSIONS
// ============================================================================
const CURATED_LINGUISTIC_NOTES: Record<
  string,
  {
    ipa: string;
    register: string;
    etymology: string;
    collocation: string;
  }
> = {
  impervious: {
    ipa: "/ɪmˈpɜː.vi.əs/",
    register: "Formal C2 • Academic",
    etymology:
      "Gốc Latin: im- (không) + per- (xuyên qua) + via (con đường) → không thể xuyên thủng; nghĩa bóng chỉ người hoặc vật hoàn toàn không bị ảnh hưởng hay lung lay trước lời chỉ trích.",
    collocation: "be / remain impervious to + Noun (criticism / pain / change)",
  },
  cast: {
    ipa: "/kɑːst daʊt ɒn/",
    register: "Formal C1/C2 • Academic",
    etymology:
      "Gốc Bắc Âu cổ 'kasta' (ném/chiếu rọi): 'cast doubt/aspersion/shadow on' mang hình ảnh phủ một bóng nghi ngờ lên tính xác thực của luận điểm.",
    collocation: "cast doubt / aspersions / a shadow on + Noun",
  },
  intractable: {
    ipa: "/ɪnˈtræk.tə.bəl/",
    register: "Formal C2 • Literary/Academic",
    etymology:
      "Gốc Latin: in- (không) + tractare (kéo/xử lý/điều khiển) → vấn đề quá phức tạp, dai dẳng và khó giải quyết dứt điểm.",
    collocation: "an intractable problem / conflict / dilemma",
  },
  ubiquitous: {
    ipa: "/juːˈbɪk.wɪ.təs/",
    register: "Formal C1/C2 • Academic",
    etymology:
      "Gốc Latin 'ubique' (ở khắp mọi nơi: ubi = ở đâu + que = bất cứ) → hiện diện khắp mọi nơi cùng một lúc.",
    collocation: "become ubiquitous in modern society / ubiquitous presence",
  },
  ephemeral: {
    ipa: "/ɪˈfem.ər.əl/",
    register: "Formal C2 • Literary",
    etymology:
      "Gốc Hy Lạp 'ephemeros' (epi- = trên + hemera = một ngày) → chỉ tồn tại trong thời gian cực ngắn, sớm nở tối tàn.",
    collocation: "ephemeral nature / fame / trend / beauty",
  },
  exacerbate: {
    ipa: "/ɪɡˈzæs.ə.beɪt/",
    register: "Formal C1/C2 • Academic",
    etymology:
      "Gốc Latin: ex- (làm tăng mạnh) + acerbus (chua chát, khắc nghiệt) → làm trầm trọng thêm một tình huống xấu hoặc mâu thuẫn.",
    collocation: "exacerbate tensions / disparities / a crisis",
  },
  mitigate: {
    ipa: "/ˈmɪt.ɪ.ɡeɪt/",
    register: "Formal C1/C2 • Policy/Academic",
    etymology:
      "Gốc Latin: mitis (dịu nhẹ, mềm mại) + agere (làm cho) → làm giảm nhẹ mức độ nghiêm trọng hoặc thiệt hại.",
    collocation: "mitigate the impact / risk / adverse effects of + Noun",
  },
  unprecedented: {
    ipa: "/ʌnˈpres.ɪ.den.tɪd/",
    register: "Formal C1 • Academic",
    etymology:
      "Gốc Latin: un- (chưa từng) + prae- (trước) + cedere (đi) → chưa từng có tiền lệ trong lịch sử.",
    collocation: "on an unprecedented scale / unprecedented rate",
  },
  precipitate: {
    ipa: "/prɪˈsɪp.ɪ.teɪt/",
    register: "Formal C2 • Academic",
    etymology:
      "Gốc Latin 'praecipitare' (lao đầu xuống từ vách đá: prae- = trước + caput = đầu) → châm ngòi làm một biến cố (thường là khủng hoảng) xảy ra đột ngột, sớm hơn dự kiến.",
    collocation: "precipitate a crisis / diplomatic row / collapse",
  },
  perfidious: {
    ipa: "/pəˈfɪd.i.əs/",
    register: "Literary C2",
    etymology:
      "Gốc Latin 'perfidia' (per- = phá bỏ + fides = lòng tin/đức tin) → phản bội, bội tín, không thể tin cậy.",
    collocation: "perfidious act / betrayal / ally",
  },
  ostensible: {
    ipa: "/ɒsˈten.sə.bəl/",
    register: "Formal C2 • Academic",
    etymology:
      "Gốc Latin 'ostendere' (phô bày ra bên ngoài) → bề ngoài có vẻ là như vậy (nhưng thực chất che giấu động cơ khác bên trong).",
    collocation: "the ostensible reason / purpose (ostensibly + Adj/Adv)",
  },
  disclose: {
    ipa: "/dɪsˈkləʊz/",
    register: "Formal C1 • Legal/Official",
    etymology:
      "Gốc Latin/Pháp cổ: dis- (mở ra, đảo ngược) + claudere (đóng kín) → tiết lộ thông tin mật hoặc công bố sự thật.",
    collocation: "disclose confidential information / financial assets to + Noun",
  },
};

function generatePhoneticEstimate(term: string): string {
  const clean = term
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-zA-Z\s-]/g, "")
    .trim()
    .toLowerCase();
  if (!clean) return "/ˈleks.ɪ.kəl/";

  for (const [key, val] of Object.entries(CURATED_LINGUISTIC_NOTES)) {
    if (clean.includes(key)) return val.ipa;
  }

  // Heuristic British IPA approximation for common C1/C2 suffixes
  const firstWord = clean.split(/\s+/)[0] || clean;
  if (firstWord.endsWith("tion")) {
    return `/${firstWord.slice(0, -4)}ˈʃən/`;
  }
  if (firstWord.endsWith("ous")) {
    return `/${firstWord.slice(0, -3)}əs/`;
  }
  if (firstWord.endsWith("ity")) {
    return `/${firstWord.slice(0, -3)}ɪ.ti/`;
  }
  if (firstWord.endsWith("ment")) {
    return `/${firstWord.slice(0, -4)}mənt/`;
  }
  if (firstWord.endsWith("able") || firstWord.endsWith("ible")) {
    return `/${firstWord.slice(0, -4)}ə.bəl/`;
  }
  return `/${firstWord}/`;
}

export function buildDeepLinguisticBreakdown(input: {
  stem: string;
  correctText: string;
  correctLetter: string;
  options: Array<{ id: string; text: string } | string>;
  targetTerm?: string;
  category?: string;
  explanation?: string;
}): DeepLinguisticBreakdown {
  const rawCorrect = String(input.correctText || "").trim();
  const rawTarget = String(input.targetTerm || rawCorrect)
    .replace(/\(.*$/g, "")
    .replace(/[()]/g, "")
    .trim();
  const lowerCheck = `${rawTarget} ${rawCorrect} ${input.stem}`.toLowerCase();

  let matchedCurated: (typeof CURATED_LINGUISTIC_NOTES)[string] | null = null;
  for (const [key, entry] of Object.entries(CURATED_LINGUISTIC_NOTES)) {
    if (lowerCheck.includes(key)) {
      matchedCurated = entry;
      break;
    }
  }

  const ipa = matchedCurated?.ipa || generatePhoneticEstimate(rawTarget || rawCorrect);
  const categoryLabel = input.category || "Lexico-Grammar";
  const register =
    matchedCurated?.register || `Formal C1/C2 • ${categoryLabel}`;

  const cleanBaseExp = String(input.explanation || "")
    .replace(/^\[Đáp án chuẩn:[^\]]+\]\s*/i, "")
    .trim();

  // Layer 2: Etymology & Nuance
  let etymologyAndNuance = matchedCurated?.etymology || "";
  if (!etymologyAndNuance) {
    if (
      /^(not until|no sooner|scarcely|hardly|little|only by|only when|under no circumstances|on no account)/i.test(
        rawCorrect
      ) ||
      lowerCheck.includes("đảo ngữ")
    ) {
      etymologyAndNuance = `Cơ chế Cú pháp Đảo ngữ (Negative/Restrictive Inversion): Khi trạng ngữ phủ định hoặc giới hạn đứng đầu câu để nhấn mạnh sắc thái học thuật C1/C2, mệnh đề chính bắt buộc đảo trợ động từ lên trước chủ ngữ. ${cleanBaseExp}`;
    } else if (categoryLabel.includes("Word Formation")) {
      etymologyAndNuance = `Hình thái học (Morphology & Affixation): Biến đổi gốc từ bằng tiền tố (prefix) và hậu tố (suffix) để khớp chính xác vị trí ngữ pháp trong câu. ${cleanBaseExp}`;
    } else if (categoryLabel.includes("Phrasal Verb")) {
      etymologyAndNuance = `Bản chất Cụm động từ (Particle Semantics): Tiểu từ đi kèm thay đổi hoàn toàn nghĩa gốc của động từ thành nghĩa ẩn dụ C1/C2. ${cleanBaseExp}`;
    } else if (categoryLabel.includes("Idiom")) {
      etymologyAndNuance = `Bản chất Thành ngữ (Idiomatic Metaphor): Cụm cố định mang tính hình tượng cao trong văn phong C1/C2, không dịch theo nghĩa đen từng từ. ${cleanBaseExp}`;
    } else {
      etymologyAndNuance =
        cleanBaseExp ||
        `Sắc thái nghĩa C1/C2: "${rawCorrect}" mang nét nghĩa học thuật chính xác nhất trong ngữ cảnh câu hỏi này.`;
    }
  }

  // Layer 3: Collocation & Syntax Pattern
  let collocationAndSyntax = matchedCurated?.collocation || "";
  if (!collocationAndSyntax) {
    const completedSentence = input.stem.includes("__")
      ? input.stem.replace(/_{2,}/g, `[${rawCorrect}]`)
      : `${rawTarget} — xuất hiện trong cấu trúc chuẩn của câu.`;
    collocationAndSyntax = `Khung kết hợp chuẩn: "${rawTarget}" • Ngữ cảnh: ${completedSentence}`;
  }

  // Layer 4: Trap Analysis (Why the 3 distractors fail)
  const normOpts = (input.options || []).map((o, idx) => {
    const letters = ["A", "B", "C", "D"];
    if (typeof o === "string") {
      return { id: letters[idx] || "A", text: o };
    }
    return {
      id: String(o?.id || letters[idx] || "A").toUpperCase(),
      text: String(o?.text || ""),
    };
  });

  const distractors = normOpts.filter(
    (o) =>
      o.id !== String(input.correctLetter).toUpperCase() &&
      o.text.toLowerCase() !== rawCorrect.toLowerCase()
  );

  const distractorTextList = distractors
    .map((d) => `${d.id} ("${d.text}")`)
    .join(", ");

  const trapAnalysis = distractorTextList
    ? `Các phương án gây nhiễu ${distractorTextList} là bẫy thường gặp trong đề HSGQG/DHBB do gần âm/gần nghĩa nhưng sai quy tắc kết hợp từ (collocation), sai giới từ đi kèm hoặc không khớp văn phong học thuật C1/C2 so với đáp án chuẩn ${input.correctLetter} ("${rawCorrect}").`
    : `Đáp án ${input.correctLetter} ("${rawCorrect}") là lựa chọn duy nhất thỏa mãn cả cấu trúc ngữ pháp lẫn sắc thái từ vựng C1/C2.`;

  return {
    targetExpression: rawTarget || rawCorrect,
    ipa,
    register,
    etymologyAndNuance,
    collocationAndSyntax,
    trapAnalysis,
  };
}

// ============================================================================
// MISTAKE VAULT STORAGE (AUTO-SAVE WRONG WORDS & QUESTIONS)
// ============================================================================
export function getMistakeVaultItems(): MistakeVaultItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISTAKE_VAULT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMistakeVaultItems(items: MistakeVaultItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MISTAKE_VAULT_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("veng-mistakes-updated", { detail: items })
    );
  } catch {}
}

export function autoSaveMistakeItem(params: {
  questionId: string;
  stem: string;
  options: Array<{ id: string; text: string } | string>;
  userWrongAnswer: string;
  correctAnswer: string;
  correctText: string;
  targetTerm?: string;
  category?: string;
  explanation?: string;
  sourceTag?: string;
}): { saved: boolean; item: MistakeVaultItem } {
  const settings = getFullSettings();
  const letters = ["A", "B", "C", "D"];
  const normalizedOptions = (params.options || []).map((o, idx) => {
    if (typeof o === "string") {
      return { id: letters[idx] || "A", text: o };
    }
    return {
      id: String(o?.id || letters[idx] || "A").toUpperCase(),
      text: String(o?.text || ""),
    };
  });

  const breakdown = buildDeepLinguisticBreakdown({
    stem: params.stem,
    correctText: params.correctText,
    correctLetter: params.correctAnswer,
    options: normalizedOptions,
    targetTerm: params.targetTerm,
    category: params.category,
    explanation: params.explanation,
  });

  const existingList = getMistakeVaultItems();
  const existingIdx = existingList.findIndex(
    (m) => m.questionId === params.questionId || m.stem === params.stem
  );

  const item: MistakeVaultItem = {
    id:
      existingIdx >= 0
        ? existingList[existingIdx].id
        : `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    questionId: params.questionId,
    word: breakdown.targetExpression,
    ipa: breakdown.ipa,
    register: breakdown.register,
    meaning:
      params.explanation ||
      breakdown.etymologyAndNuance,
    stem: params.stem,
    options: normalizedOptions,
    userWrongAnswer: params.userWrongAnswer,
    correctAnswer: params.correctAnswer,
    correctText: params.correctText,
    etymologyAndNuance: breakdown.etymologyAndNuance,
    collocationAndSyntax: breakdown.collocationAndSyntax,
    trapAnalysis: breakdown.trapAnalysis,
    sourceTag: params.sourceTag || "Luyện phản xạ C1/C2",
    mistakeCount:
      existingIdx >= 0 ? (existingList[existingIdx].mistakeCount || 1) + 1 : 1,
    mastered: false,
    lastMissedAt: Date.now(),
  };

  if (!settings.autoSaveMistakes) {
    return { saved: false, item };
  }

  let nextList: MistakeVaultItem[];
  if (existingIdx >= 0) {
    nextList = [
      item,
      ...existingList.filter((_, idx) => idx !== existingIdx),
    ].slice(0, 200);
  } else {
    nextList = [item, ...existingList].slice(0, 200);
  }

  saveMistakeVaultItems(nextList);
  return { saved: true, item };
}

export function markMistakeMastered(id: string, mastered: boolean): MistakeVaultItem[] {
  const list = getMistakeVaultItems().map((item) =>
    item.id === id ? { ...item, mastered } : item
  );
  saveMistakeVaultItems(list);
  return list;
}

export function removeMistakeItem(id: string): MistakeVaultItem[] {
  const list = getMistakeVaultItems().filter((item) => item.id !== id);
  saveMistakeVaultItems(list);
  return list;
}

export function clearMistakeVault(onlyMastered = false): MistakeVaultItem[] {
  const next = onlyMastered
    ? getMistakeVaultItems().filter((item) => !item.mastered)
    : [];
  saveMistakeVaultItems(next);
  return next;
}

export function speakEnglishText(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const settings = getFullSettings();
    window.speechSynthesis.cancel();
    const clean = String(text || "")
      .replace(/\([^)]*\)/g, "")
      .trim();
    if (!clean) return;
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = settings.voiceAccent || "en-GB";
    utter.rate = settings.voiceSpeed || 1.0;
    window.speechSynthesis.speak(utter);
  } catch {}
}
