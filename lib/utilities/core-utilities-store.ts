"use client";

export interface ExamSessionState {
  examId: string;
  examTitle?: string;
  studyMode: "learn" | "test" | "flashcards" | "games";
  learnIndex: number;
  learnAnswers: Record<string, string>;
  learnChecked: Record<string, boolean>;
  testAnswers: Record<string, string>;
  flaggedQuestions: Record<string, boolean>;
  timeLeft: number;
  answeredCount: number;
  totalQuestions: number;
  updatedAt: number;
}

export interface BookmarkedQuestionItem {
  questionId: string;
  examId: string;
  examTitle: string;
  tournament: string;
  questionNumber: number;
  stem: string;
  type: string;
  options?: Array<{ id: string; text: string }>;
  answer: string;
  givenWord?: string;
  explanationVi?: string;
  bookmarkedAt: number;
}

export interface QuestionEditPatch {
  stem: string;
  givenWord?: string;
  options?: Array<{ id: string; text: string }>;
  answer: string;
  explanationVi: string;
  rule?: string;
}

export interface AppSettings {
  geminiApiKey: string;
  targetCompetition: string;
  targetExamDate: string;
  soundEffectsEnabled: boolean;
  autoAdvanceEnabled: boolean;
}

const SESSION_PREFIX = "veng_session_";
const BOOKMARKS_KEY = "veng_bookmarks_v1";
const NOTES_KEY = "veng_question_notes_v1";
const QUESTION_EDITS_KEY = "veng_question_edits_v1";
const SETTINGS_KEY = "veng_app_settings_v1";
const LOCAL_SUBMISSIONS_KEY = "veng_local_submissions_v1";

function getDefaultTargetDate38Days(): string {
  const d = new Date();
  d.setDate(d.getDate() + 38);
  return d.toISOString().split("T")[0];
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  geminiApiKey: "",
  targetCompetition: "DHBB",
  targetExamDate: getDefaultTargetDate38Days(),
  soundEffectsEnabled: true,
  autoAdvanceEnabled: false,
};

// ============================================================================
// 1. REAL-TIME AUTO-SAVE & RESUME EXAM SESSION
// ============================================================================
export function saveExamSession(
  examId: string,
  session: Omit<ExamSessionState, "examId" | "updatedAt">
): ExamSessionState {
  const full: ExamSessionState = {
    ...session,
    examId,
    updatedAt: Date.now(),
  };
  if (typeof window !== "undefined" && examId) {
    try {
      localStorage.setItem(`${SESSION_PREFIX}${examId}`, JSON.stringify(full));
      localStorage.setItem(
        `veng_progress_${examId}`,
        JSON.stringify({
          answered: full.answeredCount,
          total: full.totalQuestions,
          updatedAt: full.updatedAt,
        })
      );
      // Non-blocking sync to backend
      fetch("/api/utilities/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(full),
      }).catch(() => {});
    } catch {}
  }
  return full;
}

export function getExamSession(examId: string): ExamSessionState | null {
  if (typeof window === "undefined" || !examId) return null;
  try {
    const raw = localStorage.getItem(`${SESSION_PREFIX}${examId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
    // Check legacy veng_progress_ fallback
    const legacyRaw = localStorage.getItem(`veng_progress_${examId}`);
    if (legacyRaw) {
      const leg = JSON.parse(legacyRaw);
      if (leg && leg.answered > 0) {
        return {
          examId,
          studyMode: "learn",
          learnIndex: 0,
          learnAnswers: {},
          learnChecked: {},
          testAnswers: {},
          flaggedQuestions: {},
          timeLeft: 180 * 60,
          answeredCount: Number(leg.answered) || 0,
          totalQuestions: Number(leg.total) || 60,
          updatedAt: leg.updatedAt || Date.now(),
        };
      }
    }
  } catch {}
  return null;
}

export function clearExamSession(examId: string): void {
  if (typeof window === "undefined" || !examId) return;
  try {
    localStorage.removeItem(`${SESSION_PREFIX}${examId}`);
    localStorage.removeItem(`veng_progress_${examId}`);
    fetch(`/api/utilities/session/${encodeURIComponent(examId)}`, {
      method: "DELETE",
    }).catch(() => {});
  } catch {}
}

// ============================================================================
// 2. EXAM STATUS BADGE & ATTEMPT HISTORY HELPERS
// ============================================================================
export function getLocalSubmissions(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSubmission(submission: any): void {
  if (typeof window === "undefined" || !submission) return;
  try {
    let activeUserId = "guest-local";
    try {
      const uRaw = localStorage.getItem("veng_auth_current_user_v1");
      if (uRaw) {
        const parsedU = JSON.parse(uRaw);
        if (parsedU?.id) activeUserId = parsedU.id;
      }
    } catch {}
    const existing = getLocalSubmissions();
    const withId = {
      id: submission.id || `sub-${Date.now()}`,
      userId: activeUserId,
      created_at: submission.created_at || new Date().toISOString(),
      ...submission,
    };
    const next = [withId, ...existing.filter((s) => s.id !== withId.id)].slice(
      0,
      100
    );
    localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(next));
    localStorage.setItem(`${LOCAL_SUBMISSIONS_KEY}_${activeUserId}`, JSON.stringify(next));
  } catch {}
}

export function getExamCompletionStatus(
  examId: string,
  totalQuestions: number,
  allSubmissions: any[] = []
): {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  answeredCount: number;
  totalQuestions: number;
  bestScore20: number | null;
  attemptsCount: number;
  session: ExamSessionState | null;
} {
  const session = getExamSession(examId);
  const localSubs = getLocalSubmissions();
  const mergedSubs = [...allSubmissions, ...localSubs];
  const examSubs = mergedSubs.filter((s) => s && s.exam_id === examId);

  let bestScore20: number | null = null;
  for (const sub of examSubs) {
    const sc = Number(sub.score);
    if (!Number.isNaN(sc)) {
      if (bestScore20 === null || sc > bestScore20) {
        bestScore20 = Number(sc.toFixed(1));
      }
    }
  }

  const answeredCount = session?.answeredCount || 0;
  const total = session?.totalQuestions || totalQuestions || 60;

  if (bestScore20 !== null && examSubs.length > 0) {
    return {
      status: "COMPLETED",
      answeredCount,
      totalQuestions: total,
      bestScore20,
      attemptsCount: examSubs.length,
      session,
    };
  }

  if (answeredCount > 0) {
    return {
      status: "IN_PROGRESS",
      answeredCount,
      totalQuestions: total,
      bestScore20: null,
      attemptsCount: 0,
      session,
    };
  }

  return {
    status: "NOT_STARTED",
    answeredCount: 0,
    totalQuestions: total,
    bestScore20: null,
    attemptsCount: 0,
    session: null,
  };
}

// ============================================================================
// 3. BOOKMARK (⭐) QUESTIONS & PERSONAL STICKY NOTES (📝)
// ============================================================================
export function getBookmarksMap(): Record<string, BookmarkedQuestionItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function toggleBookmarkQuestion(
  item: Omit<BookmarkedQuestionItem, "bookmarkedAt">
): {
  bookmarked: boolean;
  map: Record<string, BookmarkedQuestionItem>;
} {
  const map = getBookmarksMap();
  const exists = Boolean(map[item.questionId]);
  if (exists) {
    delete map[item.questionId];
  } else {
    map[item.questionId] = {
      ...item,
      bookmarkedAt: Date.now(),
    };
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(map));
      const uRaw = localStorage.getItem("veng_auth_current_user_v1");
      if (uRaw) {
        const parsedU = JSON.parse(uRaw);
        if (parsedU?.id) {
          localStorage.setItem(`${BOOKMARKS_KEY}_${parsedU.id}`, JSON.stringify(map));
        }
      }
    } catch {}
  }
  return { bookmarked: !exists, map };
}

export function getQuestionNotesMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveQuestionNote(
  questionId: string,
  noteText: string
): Record<string, string> {
  const map = getQuestionNotesMap();
  const trimmed = noteText.trim();
  if (!trimmed) {
    delete map[questionId];
  } else {
    map[questionId] = noteText;
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(map));
    } catch {}
  }
  return map;
}

// ============================================================================
// 4. INLINE QUICK-EDIT FOR QUESTIONS (✏️ SỬA NHANH)
// ============================================================================
export function getQuestionEditsMap(): Record<string, QuestionEditPatch> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(QUESTION_EDITS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveQuestionEdit(
  examId: string,
  questionId: string,
  patch: QuestionEditPatch
): Promise<boolean> {
  if (typeof window !== "undefined") {
    try {
      const map = getQuestionEditsMap();
      map[questionId] = patch;
      localStorage.setItem(QUESTION_EDITS_KEY, JSON.stringify(map));
    } catch {}
  }
  try {
    const res = await fetch(
      `/api/exams/${encodeURIComponent(examId)}/questions/${encodeURIComponent(
        questionId
      )}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function applyQuestionEditOverridesToExam(exam: any): any {
  if (!exam || !exam.sections) return exam;
  const edits = getQuestionEditsMap();
  if (Object.keys(edits).length === 0) return exam;

  const cloned = JSON.parse(JSON.stringify(exam));
  ["listening", "lexicoGrammar", "reading", "writing"].forEach((secKey) => {
    const parts = cloned.sections?.[secKey]?.parts || [];
    parts.forEach((part: any) => {
      (part.questions || []).forEach((q: any) => {
        const patch = edits[q.id];
        if (patch) {
          q.stem = patch.stem;
          q.answer = patch.answer;
          if (patch.givenWord !== undefined) {
            q.givenWord = patch.givenWord;
            q.rootWord = patch.givenWord;
          }
          if (Array.isArray(patch.options) && patch.options.length > 0) {
            q.options = patch.options;
          }
          q.explanation = {
            ...(q.explanation || {}),
            vi: patch.explanationVi,
            rule: patch.rule || q.explanation?.rule || "C1/C2 Edited Note",
          };
        }
      });
    });
  });
  return cloned;
}

// ============================================================================
// 5. 1-CLICK DATA BACKUP (EXPORT JSON) & RESTORE (IMPORT JSON)
// ============================================================================
export function buildUserDataBackupPayload(extraServerData: any = {}) {
  const sessions: Record<string, ExamSessionState> = {};
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SESSION_PREFIX)) {
        try {
          sessions[key] = JSON.parse(localStorage.getItem(key) || "{}");
        } catch {}
      }
    }
  }
  return {
    app: "V-EngOlympiad Hub",
    version: "2.0",
    exportedAt: new Date().toISOString(),
    settings: getAppSettings(),
    bookmarks: getBookmarksMap(),
    notes: getQuestionNotesMap(),
    questionEdits: getQuestionEditsMap(),
    examSessions: sessions,
    localSubmissions: getLocalSubmissions(),
    vocabVault: extraServerData.vocabList || [],
    serverSubmissions: extraServerData.submissions || [],
  };
}

export function triggerDownloadJsonBackup(extraServerData: any = {}) {
  if (typeof window === "undefined") return;
  const payload = buildUserDataBackupPayload(extraServerData);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `v-engolympiad-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function restoreUserDataFromBackupObject(data: any): {
  success: boolean;
  summary: string;
} {
  if (!data || typeof data !== "object") {
    return { success: false, summary: "File JSON không hợp lệ." };
  }
  try {
    if (data.settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    }
    if (data.bookmarks) {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data.bookmarks));
    }
    if (data.notes) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(data.notes));
    }
    if (data.questionEdits) {
      localStorage.setItem(
        QUESTION_EDITS_KEY,
        JSON.stringify(data.questionEdits)
      );
    }
    if (data.examSessions && typeof data.examSessions === "object") {
      Object.entries(data.examSessions).forEach(([k, val]) => {
        localStorage.setItem(k, JSON.stringify(val));
      });
    }
    if (Array.isArray(data.localSubmissions)) {
      localStorage.setItem(
        LOCAL_SUBMISSIONS_KEY,
        JSON.stringify(data.localSubmissions)
      );
    }
    const bookmarkCount = Object.keys(data.bookmarks || {}).length;
    const noteCount = Object.keys(data.notes || {}).length;
    const sessionCount = Object.keys(data.examSessions || {}).length;
    return {
      success: true,
      summary: `Đã khôi phục ${bookmarkCount} câu đã ghim, ${noteCount} ghi chú, ${sessionCount} phiên làm bài!`,
    };
  } catch (err: any) {
    return {
      success: false,
      summary: err?.message || "Lỗi khi đọc dữ liệu sao lưu.",
    };
  }
}

// ============================================================================
// 6. IN-APP SETTINGS & TARGET EXAM COUNTDOWN
// ============================================================================
export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(next: Partial<AppSettings>): AppSettings {
  const merged = { ...getAppSettings(), ...next };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    } catch {}
  }
  return merged;
}

export function computeDaysUntilExam(targetDateStr: string): number {
  if (!targetDateStr) return 38;
  const target = new Date(targetDateStr);
  if (Number.isNaN(target.getTime())) return 38;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export const exportFullBackupJson = () => triggerDownloadJsonBackup({});
