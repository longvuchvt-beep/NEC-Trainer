"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Gamepad2,
  Target,
  Sliders,
  Volume2,
  Download,
  Upload,
  Trash2,
  Check,
  Sun,
  Leaf,
  Moon,
  Key,
  Calendar,
} from "lucide-react";
import {
  getFullSettings,
  saveFullSettings,
  FullControlSettings,
  getDailyProgress,
  getMistakeVaultItems,
  clearMistakeVault,
  speakEnglishText,
} from "../../lib/linguistics/deep-linguistic-engine";
import {
  exportFullBackupJson,
  restoreUserDataFromBackupObject,
  computeDaysUntilExam,
} from "../../lib/utilities/core-utilities-store";
import {
  TARGET_SCHOOL_OPTIONS,
  updateCurrentUserProfile,
} from "../../lib/auth/auth-store";

interface ComprehensiveSettingsHubProps {
  theme: string;
  onChangeTheme: (next: string) => void;
  fontScale: string;
  onChangeFontScale: (next: string) => void;
  onProfileSynced?: () => void;
}

export default function ComprehensiveSettingsHub({
  theme,
  onChangeTheme,
  fontScale,
  onChangeFontScale,
  onProfileSynced,
}: ComprehensiveSettingsHubProps) {
  const [settings, setSettings] = useState<FullControlSettings>(() =>
    getFullSettings()
  );
  const [dailyProgress, setDailyProgress] = useState(() => getDailyProgress());
  const [mistakeCount, setMistakeCount] = useState(
    () => getMistakeVaultItems().length
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncAll = () => {
      setSettings(getFullSettings());
      setDailyProgress(getDailyProgress());
      setMistakeCount(getMistakeVaultItems().length);
    };
    window.addEventListener("veng-settings-changed", syncAll);
    window.addEventListener("veng-daily-progress-updated", syncAll);
    window.addEventListener("veng-mistakes-updated", syncAll);
    return () => {
      window.removeEventListener("veng-settings-changed", syncAll);
      window.removeEventListener("veng-daily-progress-updated", syncAll);
      window.removeEventListener("veng-mistakes-updated", syncAll);
    };
  }, []);

  const updateSetting = (patch: Partial<FullControlSettings>) => {
    const updated = saveFullSettings(patch);
    setSettings(updated);
    if (patch.theme) onChangeTheme(patch.theme);
    if (patch.fontScale) onChangeFontScale(patch.fontScale);
    if (patch.targetSchool || patch.targetCompetition) {
      updateCurrentUserProfile({
        targetSchool: updated.targetSchool,
        targetExam:
          updated.targetCompetition === "DHBB" ||
          updated.targetCompetition === "Olympic 30/4"
            ? updated.targetCompetition
            : "HSGQG",
      });
      if (onProfileSynced) onProfileSynced();
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const res = restoreUserDataFromBackupObject(parsed);
        setStatusMessage(res.summary);
        setTimeout(() => setStatusMessage(null), 4000);
      } catch {
        setStatusMessage("Không thể đọc file sao lưu JSON.");
      }
    };
    reader.readAsText(file);
  };

  const daysRemaining = computeDaysUntilExam(settings.targetExamDate);
  const dailyPct = Math.min(
    100,
    Math.round(
      (dailyProgress.count / Math.max(1, settings.dailyGoalQuestions)) * 100
    )
  );

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ================================================================== */}
      {/* SECTION 1: CÀI ĐẶT HỌC NGÔN NGỮ & GIẢI THÍCH                       */}
      {/* ================================================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Cài đặt Học Ngôn Ngữ & Giải Thích
          </h3>
        </div>

        {/* Độ sâu lời giải */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Độ sâu lời giải
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateSetting({ explanationDepth: "deep" })}
              className={`p-3 rounded-xl border text-left transition ${
                settings.explanationDepth === "deep"
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="text-xs font-bold">
                Chuyên sâu Ngôn ngữ học (Khuyên dùng)
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Đầy đủ 4 tầng: Gốc từ + Kết hợp từ + Phân tích bẫy
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateSetting({ explanationDepth: "standard" })}
              className={`p-3 rounded-xl border text-left transition ${
                settings.explanationDepth === "standard"
                  ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="text-xs font-bold">Tiêu chuẩn (Ngắn gọn)</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Hiển thị đáp án và tóm tắt nghĩa trọng tâm
              </div>
            </button>
          </div>
        </div>

        {/* Auto-Save Mistakes & Show IPA Toggles */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tự động lưu từ sai (Auto-Save Mistakes)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Tự động lưu mọi câu làm sai vào Sổ Từ Sai kèm giải thích 4 tầng
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSetting({ autoSaveMistakes: !settings.autoSaveMistakes })
              }
              className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                settings.autoSaveMistakes
                  ? "bg-indigo-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoSaveMistakes ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Hiển thị phiên âm IPA & Từ loại
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Hiển thị phiên âm quốc tế và nhãn cấp độ C1/C2
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSetting({
                  showIpaAndRegister: !settings.showIpaAndRegister,
                })
              }
              className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                settings.showIpaAndRegister
                  ? "bg-indigo-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.showIpaAndRegister
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Voice Accent & Speed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Giọng đọc phát âm
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "en-GB", label: "Anh-Anh (UK)" },
                { id: "en-US", label: "Anh-Mỹ (US)" },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    updateSetting({ voiceAccent: v.id as "en-GB" | "en-US" })
                  }
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    settings.voiceAccent === v.id
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tốc độ đọc
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {([0.8, 1.0, 1.2] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => updateSetting({ voiceSpeed: spd })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
                    settings.voiceSpeed === spd
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            speakEnglishText("Impervious to criticism. By leaps and bounds.")
          }
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
        >
          <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Nghe thử giọng phát âm ({settings.voiceAccent})</span>
        </button>
      </div>

      {/* ================================================================== */}
      {/* SECTION 2: CÀI ĐẶT GAME 3D & TỐC ĐỘ PHẢN XẠ                        */}
      {/* ================================================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Gamepad2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Cài đặt Game 3D & Tốc độ Phản xạ
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Tốc độ trụ đá Kangaroo
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                sec: 9 as const,
                title: "Thong thả (9 giây/câu)",
                desc: "Đọc kỹ câu hỏi dài",
              },
              {
                sec: 6 as const,
                title: "Chuẩn (6 giây/câu)",
                desc: "Cân bằng tốc độ & tư duy",
              },
              {
                sec: 3.5 as const,
                title: "Phản xạ Cao (3.5 giây/câu)",
                desc: "Luyện phản xạ siêu tốc",
              },
            ].map((opt) => (
              <button
                key={opt.sec}
                type="button"
                onClick={() => updateSetting({ kangarooSpeedSec: opt.sec })}
                className={`p-3 rounded-xl border text-left transition ${
                  settings.kangarooSpeedSec === opt.sec
                    ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">{opt.title}</div>
                <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tự động dừng khi làm sai (Pause on Mistake)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Tạm dừng thời gian để đọc kỹ giải thích ngôn ngữ 4 tầng trước khi nhảy tiếp
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSetting({ pauseOnMistake: !settings.pauseOnMistake })
              }
              className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                settings.pauseOnMistake
                  ? "bg-emerald-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.pauseOnMistake ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Hiệu ứng Âm thanh & Rung phản hồi
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Phát âm thanh nhảy qua trụ đá và báo hiệu khi hoàn thành chuỗi
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSetting({ soundAndHaptics: !settings.soundAndHaptics })
              }
              className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
                settings.soundAndHaptics
                  ? "bg-emerald-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundAndHaptics ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 3: MỤC TIÊU CÁ NHÂN & LỘ TRÌNH                             */}
      {/* ================================================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Mục tiêu Cá nhân & Lộ trình
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
            Còn {daysRemaining} ngày
          </span>
        </div>

        {/* Live Daily Goal Progress Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-200">
              Tiến độ mục tiêu hôm nay
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {dailyProgress.count} / {settings.dailyGoalQuestions} câu ({dailyPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kỳ thi mục tiêu
            </label>
            <select
              value={settings.targetCompetition}
              onChange={(e) =>
                updateSetting({ targetCompetition: e.target.value as any })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {[
                "HSGQG",
                "DHBB",
                "Trại hè Hùng Vương",
                "Olympic 30/4",
                "Thi Chuyên",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ngày thi dự kiến
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={settings.targetExamDate}
                onChange={(e) =>
                  updateSetting({ targetExamDate: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Trường chuyên / Tỉnh thành
          </label>
          <select
            value={settings.targetSchool}
            onChange={(e) => updateSetting({ targetSchool: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100"
          >
            {TARGET_SCHOOL_OPTIONS.map((sch) => (
              <option key={sch} value={sch}>
                {sch}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mục tiêu số câu luyện mỗi ngày
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([15, 30, 50] as const).map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => updateSetting({ dailyGoalQuestions: goal })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  settings.dailyGoalQuestions === goal
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {goal} câu / ngày
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 4: GIAO DIỆN, AI KEY & QUẢN LÝ DỮ LIỆU                     */}
      {/* ================================================================== */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            4. Giao diện, AI Key & Quản lý Dữ liệu
          </h3>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Màu nền bảo vệ mắt
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "warm-paper", label: "Giấy Kem Ấm", icon: Sun },
              { id: "forest-matcha", label: "Xanh Matcha", icon: Leaf },
              { id: "midnight-slate", label: "Ban Đêm", icon: Moon },
            ].map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateSetting({ theme: t.id as any })}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    active
                      ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Cỡ chữ hiển thị
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "A", label: "Nhỏ (A)" },
              { id: "A+", label: "Vừa (A+)" },
              { id: "A++", label: "Lớn (A++)" },
            ].map((fs) => (
              <button
                key={fs.id}
                type="button"
                onClick={() => updateSetting({ fontScale: fs.id as any })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  fontScale === fs.id
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
              >
                {fs.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gemini API Key */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Gemini API Key (Lưu cục bộ trên trình duyệt)
          </label>
          <div className="relative">
            <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => updateSetting({ geminiApiKey: e.target.value })}
              placeholder="AIzaSy... (Không bắt buộc — dùng để mở rộng đề AI)"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Backup, Restore & Reset Mistake Vault */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Sao lưu & Khôi phục dữ liệu (.json)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportFullBackupJson}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file sao lưu (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Khôi phục từ file (.json)</span>
            </button>

            {mistakeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearMistakeVault(false);
                  setMistakeCount(0);
                  setStatusMessage("Đã đặt lại danh sách Sổ Từ Sai.");
                  setTimeout(() => setStatusMessage(null), 3000);
                }}
                className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Đặt lại Sổ Từ Sai ({mistakeCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
