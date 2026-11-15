"use client";

import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  GraduationCap,
  Award,
  Check,
  ArrowRight,
  LogIn,
  UserPlus,
} from "lucide-react";
import {
  UserProfile,
  TARGET_SCHOOL_OPTIONS,
  AVATAR_PALETTES,
  getInitials,
  registerAccount,
  loginAccount,
  loginAsGuest,
} from "../../lib/auth/auth-store";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "register";
  currentUser: UserProfile;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

const AVATAR_KEYS: Array<UserProfile["avatarId"]> = [
  "indigo",
  "emerald",
  "rose",
  "amber",
  "violet",
  "cyan",
];

const TARGET_EXAMS: Array<"HSGQG" | "DHBB" | "Olympic 30/4"> = [
  "HSGQG",
  "DHBB",
  "Olympic 30/4",
];

export default function AuthModal({
  isOpen,
  initialMode = "register",
  currentUser,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState(
    currentUser?.isGuest && currentUser.username !== "Khách" ? currentUser.username : ""
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [targetSchool, setTargetSchool] = useState(
    currentUser?.targetSchool || TARGET_SCHOOL_OPTIONS[0]
  );
  const [targetExam, setTargetExam] = useState<"HSGQG" | "DHBB" | "Olympic 30/4">(
    currentUser?.targetExam || "HSGQG"
  );
  const [avatarId, setAvatarId] = useState<UserProfile["avatarId"]>(
    currentUser?.avatarId || "indigo"
  );
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (mode === "register") {
      const res = registerAccount({
        username,
        email,
        password,
        targetSchool,
        targetExam,
        avatarId,
      });
      if (!res.ok || !res.user) {
        setErrorMsg(res.error || "Không thể đăng ký tài khoản.");
        return;
      }
      onAuthSuccess(res.user);
      onClose();
    } else {
      const res = loginAccount(email || username, password);
      if (!res.ok || !res.user) {
        setErrorMsg(res.error || "Thông tin đăng nhập không đúng.");
        return;
      }
      onAuthSuccess(res.user);
      onClose();
    }
  };

  const handleGuestQuickStart = () => {
    const guest = loginAsGuest();
    onAuthSuccess(guest);
    onClose();
  };

  const activePalette = AVATAR_PALETTES[avatarId] || AVATAR_PALETTES.indigo;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl ${activePalette.bg} ${activePalette.text} flex items-center justify-center text-xs font-bold tracking-wider`}
            >
              {getInitials(username || "HV")}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentUser?.isGuest
                  ? "Giữ nguyên tiến độ làm bài hiện tại"
                  : "Đồng bộ lịch sử làm bài và từ vựng"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1.5 mx-5 mt-4 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              mode === "register"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg("");
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition ${
              mode === "login"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {mode === "register" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên học sinh
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nguyễn Minh Anh"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hocsinh@chuyen.edu.vn"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 4 ký tự"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trường chuyên / Tỉnh thành
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <select
                    value={targetSchool}
                    onChange={(e) => setTargetSchool(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {TARGET_SCHOOL_OPTIONS.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kỳ thi mục tiêu
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={targetExam}
                      onChange={(e) => setTargetExam(e.target.value as any)}
                      className="w-full pl-9 pr-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {TARGET_EXAMS.map((ex) => (
                        <option key={ex} value={ex}>
                          {ex}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Màu đại diện
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {AVATAR_KEYS.map((key) => {
                      const pal = AVATAR_PALETTES[key];
                      const selected = avatarId === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setAvatarId(key)}
                          className={`w-7 h-7 rounded-full ${pal.bg} flex items-center justify-center transition ${
                            selected ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-105" : "opacity-75 hover:opacity-100"
                          }`}
                          title={pal.label}
                        >
                          {selected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email hoặc Tên học sinh
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập Email hoặc Tên tài khoản"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <span>{mode === "register" ? "Hoàn tất đăng ký" : "Đăng nhập ngay"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGuestQuickStart}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              Dùng thử nhanh (Khách)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
