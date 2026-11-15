"use client";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password?: string;
  targetSchool: string;
  targetExam: "HSGQG" | "DHBB" | "Olympic 30/4";
  avatarId: "indigo" | "emerald" | "rose" | "amber" | "violet" | "cyan";
  isGuest: boolean;
  streakDays: number;
  xp: number;
  createdAt: string;
}

export const TARGET_SCHOOL_OPTIONS = [
  "THPT Chuyên Hùng Vương (Phú Thọ)",
  "THPT Chuyên Phan Bội Châu (Nghệ An)",
  "THPT Chuyên Hà Nội - Amsterdam",
  "THPT Chuyên Lê Hồng Phong (TP.HCM)",
  "THPT Chuyên Lam Sơn (Thanh Hóa)",
  "THPT Chuyên Trần Phú (Hải Phòng)",
  "THPT Chuyên Ngoại Ngữ (ĐHQGHN)",
  "THPT Chuyên Khoa học Tự nhiên / Sư Phạm",
  "THPT Chuyên Bắc Ninh",
  "THPT Chuyên Vĩnh Phúc",
  "THPT Chuyên Lê Quý Đôn (Đà Nẵng)",
  "THPT Chuyên Quốc Học (Huế)",
];

export const AVATAR_PALETTES: Record<
  UserProfile["avatarId"],
  { bg: string; text: string; ring: string; label: string }
> = {
  indigo: {
    bg: "bg-indigo-600",
    text: "text-white",
    ring: "ring-indigo-500/30",
    label: "Chàm",
  },
  emerald: {
    bg: "bg-emerald-600",
    text: "text-white",
    ring: "ring-emerald-500/30",
    label: "Ngọc lục",
  },
  rose: {
    bg: "bg-rose-600",
    text: "text-white",
    ring: "ring-rose-500/30",
    label: "Đỏ hồng",
  },
  amber: {
    bg: "bg-amber-600",
    text: "text-white",
    ring: "ring-amber-500/30",
    label: "Hổ phách",
  },
  violet: {
    bg: "bg-violet-600",
    text: "text-white",
    ring: "ring-violet-500/30",
    label: "Tím đậm",
  },
  cyan: {
    bg: "bg-cyan-600",
    text: "text-white",
    ring: "ring-cyan-500/30",
    label: "Xanh lam",
  },
};

const ACCOUNTS_KEY = "veng_auth_accounts_v1";
const CURRENT_USER_KEY = "veng_auth_current_user_v1";
const LOCAL_SUBMISSIONS_KEY = "veng_local_submissions_v1";
const BOOKMARKS_KEY = "veng_bookmarks_v1";

const DEFAULT_GUEST_USER: UserProfile = {
  id: "guest-local",
  username: "Khách",
  email: "",
  targetSchool: "THPT Chuyên Hùng Vương (Phú Thọ)",
  targetExam: "HSGQG",
  avatarId: "indigo",
  isGuest: true,
  streakDays: 3,
  xp: 250,
  createdAt: new Date().toISOString(),
};

export function getInitials(name: string): string {
  const clean = String(name || "HV").trim();
  if (!clean) return "HV";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAllAccounts(): UserProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllAccounts(accounts: UserProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

export function getCurrentUser(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_GUEST_USER;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.id) {
        return {
          ...DEFAULT_GUEST_USER,
          ...parsed,
        };
      }
    }
  } catch {}
  return DEFAULT_GUEST_USER;
}

function saveUserScopedSnapshot(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const subs = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    const bms = localStorage.getItem(BOOKMARKS_KEY);
    if (subs !== null) {
      localStorage.setItem(`${LOCAL_SUBMISSIONS_KEY}_${userId}`, subs);
    }
    if (bms !== null) {
      localStorage.setItem(`${BOOKMARKS_KEY}_${userId}`, bms);
    }
  } catch {}
}

function restoreUserScopedSnapshot(userId: string, inheritFromGuest = false): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    if (inheritFromGuest) {
      // Carry current guest data directly into the newly registered user's scope
      saveUserScopedSnapshot(userId);
      return;
    }
    const userSubs = localStorage.getItem(`${LOCAL_SUBMISSIONS_KEY}_${userId}`);
    const userBms = localStorage.getItem(`${BOOKMARKS_KEY}_${userId}`);
    if (userSubs !== null) {
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, userSubs);
    }
    if (userBms !== null) {
      localStorage.setItem(BOOKMARKS_KEY, userBms);
    }
  } catch {}
}

export function setCurrentUser(user: UserProfile, inheritGuestData = false): UserProfile {
  if (typeof window !== "undefined") {
    try {
      const prev = getCurrentUser();
      if (prev?.id && prev.id !== user.id) {
        saveUserScopedSnapshot(prev.id);
      }
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      restoreUserScopedSnapshot(user.id, inheritGuestData);
      window.dispatchEvent(new CustomEvent("veng-auth-changed", { detail: user }));
    } catch {}
  }
  return user;
}

export function registerAccount(input: {
  username: string;
  email: string;
  password: string;
  targetSchool: string;
  targetExam: "HSGQG" | "DHBB" | "Olympic 30/4";
  avatarId: UserProfile["avatarId"];
}): { ok: boolean; user?: UserProfile; error?: string } {
  const username = String(input.username || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");

  if (username.length < 2) {
    return { ok: false, error: "Tên hiển thị cần ít nhất 2 ký tự." };
  }
  if (!email.includes("@")) {
    return { ok: false, error: "Email không hợp lệ." };
  }
  if (password.length < 4) {
    return { ok: false, error: "Mật khẩu cần ít nhất 4 ký tự." };
  }

  const accounts = getAllAccounts();
  const existing = accounts.find(
    (a) => a.email.toLowerCase() === email || a.username.toLowerCase() === username.toLowerCase()
  );
  if (existing) {
    return { ok: false, error: "Tên tài khoản hoặc Email này đã được đăng ký." };
  }

  const current = getCurrentUser();
  const wasGuest = current.isGuest;

  const newUser: UserProfile = {
    id: `user-${Date.now()}`,
    username,
    email,
    password,
    targetSchool: input.targetSchool || TARGET_SCHOOL_OPTIONS[0],
    targetExam: input.targetExam || "HSGQG",
    avatarId: input.avatarId || "indigo",
    isGuest: false,
    streakDays: Math.max(1, current.streakDays || 1),
    xp: Math.max(100, current.xp || 100),
    createdAt: new Date().toISOString(),
  };

  const nextAccounts = [newUser, ...accounts];
  saveAllAccounts(nextAccounts);
  setCurrentUser(newUser, wasGuest);

  return { ok: true, user: newUser };
}

export function loginAccount(
  identifier: string,
  password: string
): { ok: boolean; user?: UserProfile; error?: string } {
  const idClean = String(identifier || "").trim().toLowerCase();
  const accounts = getAllAccounts();
  const match = accounts.find(
    (a) => a.email.toLowerCase() === idClean || a.username.toLowerCase() === idClean
  );

  if (!match) {
    return { ok: false, error: "Không tìm thấy tài khoản. Vui lòng kiểm tra lại hoặc tạo tài khoản mới." };
  }

  if (match.password && match.password !== password) {
    return { ok: false, error: "Mật khẩu không chính xác." };
  }

  setCurrentUser(match, false);
  return { ok: true, user: match };
}

export function loginAsGuest(): UserProfile {
  const current = getCurrentUser();
  if (current.isGuest) return current;
  return setCurrentUser(DEFAULT_GUEST_USER, false);
}

export function updateCurrentUserProfile(patch: Partial<UserProfile>): UserProfile {
  const current = getCurrentUser();
  const updated: UserProfile = {
    ...current,
    ...patch,
  };
  setCurrentUser(updated, false);

  if (!updated.isGuest) {
    const accounts = getAllAccounts().map((a) => (a.id === updated.id ? updated : a));
    saveAllAccounts(accounts);
  }
  return updated;
}

export function addUserXp(amount: number): UserProfile {
  const current = getCurrentUser();
  return updateCurrentUserProfile({
    xp: (current.xp || 0) + Math.max(0, amount),
  });
}
