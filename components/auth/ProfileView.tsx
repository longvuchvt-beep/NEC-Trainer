"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LogIn,
  UserPlus,
  LogOut,
  Bookmark,
  History,
  GraduationCap,
  ChevronRight,
  Trash2,
  Eye,
  X,
  AlertCircle,
  Settings,
  Volume2,
} from "lucide-react";
import {
  UserProfile,
  AVATAR_PALETTES,
  TARGET_SCHOOL_OPTIONS,
  getInitials,
  updateCurrentUserProfile,
} from "../../lib/auth/auth-store";
import {
  getLocalSubmissions,
  getBookmarksMap,
  toggleBookmarkQuestion,
} from "../../lib/utilities/core-utilities-store";
import {
  getMistakeVaultItems,
  removeMistakeItem,
  speakEnglishText,
  MistakeVaultItem,
} from "../../lib/linguistics/deep-linguistic-engine";
import ComprehensiveSettingsHub from "../utilities/ComprehensiveSettingsHub";
import { SafeExam } from "../../lib/safe-data";

interface ProfileViewProps {
  user: UserProfile;
  exams: SafeExam[];
  serverSubmissions?: any[];
  initialSubTab?: "history" | "mistakes" | "saved" | "settings";
  theme: string;
  onChangeTheme: (next: string) => void;
  fontScale: string;
  onChangeFontScale: (next: string) => void;
  onOpenAuthModal: (mode: "login" | "register") => void;
  onLogout: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onOpenExam: (examId: string) => void;
}

export default function ProfileView({
  user,
  exams,
  serverSubmissions = [],
  initialSubTab = "history",
  theme,
  onChangeTheme,
  fontScale,
  onChangeFontScale,
  onOpenAuthModal,
  onLogout,
  onUserUpdated,
  onOpenExam,
}: ProfileViewProps) {
  const [subTab, setSubTab] = useState<
    "history" | "mistakes" | "saved" | "settings"
  >(initialSubTab);
  const [reviewAttempt, setReviewAttempt] = useState<any | null>(null);
  const [bookmarksMap, setBookmarksMap] = useState(() => getBookmarksMap());
  const [mistakesList, setMistakesList] = useState<MistakeVaultItem[]>(() =>
    getMistakeVaultItems()
  );
  const [editingTarget, setEditingTarget] = useState(false);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncMistakes = () => setMistakesList(getMistakeVaultItems());
    window.addEventListener("veng-mistakes-updated", syncMistakes);
    return () =>
      window.removeEventListener("veng-mistakes-updated", syncMistakes);
  }, []);

  const palette = AVATAR_PALETTES[user.avatarId] || AVATAR_PALETTES.indigo;

  const attempts = useMemo(() => {
    const localSubs = getLocalSubmissions();
    const combined = [
      ...localSubs,
      ...(Array.isArray(serverSubmissions) ? serverSubmissions : []),
    ];
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const item of combined) {
      if (!item || typeof item !== "object") continue;
      const key = String(item.id || `${item.exam_id}-${item.created_at}`);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }
    return unique;
  }, [serverSubmissions, user.id]);

  const savedQuestions = useMemo(() => {
    return Object.values(bookmarksMap || {}).sort(
      (a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0)
    );
  }, [bookmarksMap]);

  const summaryStats = useMemo(() => {
    const completedCount = attempts.length;
    if (completedCount === 0) {
      return {
        completedCount: 0,
        accuracyPercent: 0,
        bestScore: 0,
      };
    }
    let totalScore20 = 0;
    let bestScore = 0;
    for (const att of attempts) {
      const s = Number(att.score) || 0;
      totalScore20 += s;
      if (s > bestScore) bestScore = s;
    }
    const avgScore20 = totalScore20 / completedCount;
    const accuracyPercent = Math.min(100, Math.round((avgScore20 / 20) * 100));
    return {
      completedCount,
      accuracyPercent,
      bestScore: Number(bestScore.toFixed(1)),
    };
  }, [attempts]);

  const handleRemoveBookmark = (questionId: string) => {
    const existing = bookmarksMap[questionId];
    if (!existing) return;
    const res = toggleBookmarkQuestion(existing);
    setBookmarksMap({ ...res.map });
  };

  const handleSchoolChange = (newSchool: string) => {
    const updated = updateCurrentUserProfile({ targetSchool: newSchool });
    onUserUpdated(updated);
    setEditingTarget(false);
  };

  const handleTargetExamChange = (
    newExam: "HSGQG" | "DHBB" | "Olympic 30/4"
  ) => {
    const updated = updateCurrentUserProfile({ targetExam: newExam });
    onUserUpdated(updated);
  };

  const reviewExamObj = useMemo(() => {
    if (!reviewAttempt) return null;
    return (
      exams.find((e) => e.id === reviewAttempt.exam_id) || exams[0] || null
    );
  }, [reviewAttempt, exams]);

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* User Identity Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-14 h-14 rounded-2xl ${palette.bg} ${palette.text} flex items-center justify-center text-lg font-bold tracking-wider shrink-0 shadow-xs`}
            >
              {getInitials(user.username)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user.username}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  {user.targetExam}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user.targetSchool}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {user.isGuest ? "Tài khoản khách (Lưu trên thiết bị)" : user.email}
              </p>
            </div>
          </div>

          {user.isGuest ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuthModal("login")}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal("register")}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>

        {/* Quick Target School & Exam Switcher */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Mục tiêu:</span>
            <div className="flex items-center gap-1">
              {(["HSGQG", "DHBB", "Olympic 30/4"] as const).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleTargetExamChange(ex)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                    user.targetExam === ex
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditingTarget((v) => !v)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {editingTarget ? "Đóng chọn trường" : "Đổi trường chuyên"}
          </button>
        </div>

        {editingTarget && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn trường chuyên / tỉnh thành
            </label>
            <select
              value={user.targetSchool}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
            >
              {TARGET_SCHOOL_OPTIONS.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {summaryStats.completedCount}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Đề đã làm
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
          <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {summaryStats.accuracyPercent}%
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Chính xác
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
          <div className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">
            {mistakesList.length}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Sổ từ sai
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3 text-center">
          <div className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {savedQuestions.length}
          </div>
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Câu đã lưu
          </div>
        </div>
      </div>

      {/* Sub-navigation: Lịch sử | Sổ từ sai | Đã lưu | Cài đặt */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80">
        <button
          type="button"
          onClick={() => setSubTab("history")}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition ${
            subTab === "history"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch sử</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("mistakes")}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition ${
            subTab === "mistakes"
              ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Sổ từ sai ({mistakesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("saved")}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition ${
            subTab === "saved"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Đã lưu</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("settings")}
          className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition ${
            subTab === "settings"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* Tab 1: Attempt History */}
      {subTab === "history" && (
        <div className="space-y-2.5">
          {attempts.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Chưa có bài làm nào được nộp
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hãy chọn một đề thi ở mục Đề thi để bắt đầu luyện tập.
              </p>
            </div>
          ) : (
            attempts.map((att, index) => {
              const matchedExam = exams.find((e) => e.id === att.exam_id);
              const title =
                att.exam_title || matchedExam?.title || "Đề thi Chuyên Anh";
              const badge = matchedExam?.competition || "HSGQG";
              const score = Number(att.score || 0).toFixed(1);
              const dateStr = att.created_at
                ? new Date(att.created_at).toLocaleDateString("vi-VN")
                : "Hôm nay";

              return (
                <div
                  key={att.id || index}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {badge}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {dateStr}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {title}
                    </h3>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Điểm: {score} / 20.0
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewAttempt(att)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem lại bài làm</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Sổ Từ Sai (Auto-Saved Mistakes with 4-Layer Deep Breakdown) */}
      {subTab === "mistakes" && (
        <div className="space-y-2.5">
          {mistakesList.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Chưa có từ hoặc câu làm sai nào
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mọi câu chọn sai trong Game 3D hoặc khi Làm đề sẽ được tự động lưu vào đây kèm giải thích 4 tầng.
              </p>
            </div>
          ) : (
            mistakesList.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {m.sourceTag} • Đã chọn: {m.userWrongAnswer} (Đúng: {m.correctAnswer})
                    </span>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {m.word}
                      </span>
                      <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                        {m.ipa}
                      </span>
                      <button
                        type="button"
                        onClick={() => speakEnglishText(m.word)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMistakesList(removeMistakeItem(m.id))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                  {m.stem}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 space-y-1.5 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      1. Bản chất & Gốc từ:{" "}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {m.etymologyAndNuance}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      2. Kết hợp từ:{" "}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {m.collocationAndSyntax}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      3. Phân tích Bẫy:{" "}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {m.trapAnalysis}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Saved Questions */}
      {subTab === "saved" && (
        <div className="space-y-2.5">
          {savedQuestions.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Chưa có câu hỏi nào được lưu
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bấm nút Lưu câu khi đang làm đề để ôn tập lại tại đây.
              </p>
            </div>
          ) : (
            savedQuestions.map((item) => (
              <div
                key={item.questionId}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {item.examTitle || "Đề thi Chuyên Anh"} • Câu{" "}
                    {item.questionNumber}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.examId && (
                      <button
                        type="button"
                        onClick={() => onOpenExam(item.examId)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span>Mở đề</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(item.questionId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Bỏ lưu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.stem}
                </p>
                <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  Đáp án: {item.answer}
                </div>
                {item.explanationVi && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                    {item.explanationVi}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Comprehensive 4-Section Settings Control Center */}
      {subTab === "settings" && (
        <ComprehensiveSettingsHub
          theme={theme}
          onChangeTheme={onChangeTheme}
          fontScale={fontScale}
          onChangeFontScale={onChangeFontScale}
        />
      )}

      {/* Attempt Review Modal ("Xem lại bài làm") */}
      {reviewAttempt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Xem lại bài làm
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {reviewAttempt.exam_title ||
                    reviewExamObj?.title ||
                    "Đề thi Chuyên Anh"}{" "}
                  • Điểm: {Number(reviewAttempt.score || 0).toFixed(1)}/20.0
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewAttempt(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {(reviewExamObj?.questions || []).slice(0, 30).map((q, idx) => {
                const userAnsMap =
                  reviewAttempt.answers &&
                  typeof reviewAttempt.answers === "object"
                    ? reviewAttempt.answers
                    : {};
                const userAns = userAnsMap[q.id] || "Chưa chọn";
                const isCorrect =
                  String(userAns).trim().toUpperCase() ===
                  String(q.correctAnswer).trim().toUpperCase();

                return (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">
                        Câu {idx + 1}
                      </span>
                      <span
                        className={
                          isCorrect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        Bạn chọn: {userAns} • Đáp án: {q.correctAnswer}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium">
                      {q.prompt}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {q.linguisticBreakdown?.etymologyAndNuance ||
                        q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              {reviewExamObj && (
                <button
                  type="button"
                  onClick={() => {
                    const targetId = reviewExamObj.id;
                    setReviewAttempt(null);
                    onOpenExam(targetId);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  Làm lại đề này
                </button>
              )}
              <button
                type="button"
                onClick={() => setReviewAttempt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
