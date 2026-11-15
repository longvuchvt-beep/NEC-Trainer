'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  BookOpen,
  Layers,
  Gamepad2,
  User,
  Search,
  GraduationCap,
  Play,
  Clock,
  Zap,
  CheckCircle2,
  RotateCcw,
  LogIn
} from 'lucide-react';

import MobileExamRunner from '../components/exam/MobileExamRunner';
import MobileFlashcardsView from '../components/flashcards/MobileFlashcardsView';
import AuthModal from '../components/auth/AuthModal';
import ProfileView from '../components/auth/ProfileView';
import {
  GlobalErrorBoundary,
  normalizeExamList
} from '../lib/safe-data';
import {
  getExamCompletionStatus,
  clearExamSession
} from '../lib/utilities/core-utilities-store';
import {
  getCurrentUser,
  loginAsGuest,
  AVATAR_PALETTES,
  getInitials
} from '../lib/auth/auth-store';
import {
  getInitialBundledExams,
  getInitialBundledVocab,
  getInitialBundledStats,
  installServerlessFetchInterceptor
} from './lib/serverless-client-engine';

const LazyKangaroo3DGame = React.lazy(() =>
  import('../components/arcade/Kangaroo3DGame')
);

installServerlessFetchInterceptor();

const COMPETITION_FILTERS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'HSGQG', label: 'HSGQG' },
  { id: 'DHBB', label: 'DHBB' },
  { id: 'Olympic 30/4', label: 'Olympic 30/4' },
  { id: 'Trại hè Hùng Vương', label: 'Hùng Vương' }
];

const COMPETITION_BADGE_STYLES = {
  HSGQG: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/70',
  DHBB: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/70',
  'Olympic 30/4':
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70',
  'Trại hè Hùng Vương':
    'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70',
  'Đội tuyển':
    'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/70'
};

const FONT_SIZE_CLASS_MAP = {
  A: 'text-base',
  'A+': 'text-lg',
  'A++': 'text-xl'
};

export default function App() {
  // 1. Theme & Font Scale
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('veye_theme') : null;
    if (saved === 'midnight-slate' || saved === 'forest-matcha' || saved === 'warm-paper') {
      return saved;
    }
    return 'warm-paper';
  });

  const [fontScale, setFontScale] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('veye_font_scale') : null;
    return saved === 'A+' || saved === 'A++' ? saved : 'A';
  });

  // 2. 4 Core Navigation Tabs: 'exams' | 'flashcards' | 'game3d' | 'profile'
  const [activeTab, setActiveTab] = useState('exams');

  // 3. Normalized Data State
  const [rawExams, setRawExams] = useState(() => getInitialBundledExams());
  const [vocabList, setVocabList] = useState(() => getInitialBundledVocab());
  const [stats, setStats] = useState(() => getInitialBundledStats());
  const [sessionRefreshTick, setSessionRefreshTick] = useState(0);

  const safeExams = useMemo(() => normalizeExamList(rawExams), [rawExams]);

  // 4. User Auth State
  const [user, setUser] = useState(() => getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('register');

  // 5. Filters & Active Exam Runner State
  const [selectedCompetition, setSelectedCompetition] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeExamId, setActiveExamId] = useState(null);
  const [activeExamMode, setActiveExamMode] = useState('practice');

  // Sync theme to document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'midnight-slate') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('veye_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('veye_font_scale', fontScale);
    }
  }, [fontScale]);

  // Listen for auth or XP updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onAuthChange = () => {
      setUser(getCurrentUser());
      setSessionRefreshTick((t) => t + 1);
    };
    window.addEventListener('veng-auth-changed', onAuthChange);
    return () => window.removeEventListener('veng-auth-changed', onAuthChange);
  }, []);

  // Support URL navigation (/exams/:id or /profile)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncPath = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/exams\/([^/]+)/);
      if (match && match[1]) {
        setActiveExamId(decodeURIComponent(match[1]));
        setActiveTab('exams');
      } else if (path === '/profile') {
        setActiveExamId(null);
        setActiveTab('profile');
      }
    };
    syncPath();
    window.addEventListener('popstate', syncPath);
    return () => window.removeEventListener('popstate', syncPath);
  }, []);

  const handleOpenExam = (examId, mode = 'practice') => {
    setActiveExamId(examId);
    setActiveExamMode(mode);
    setActiveTab('exams');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/exams/${encodeURIComponent(examId)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCloseExam = () => {
    setActiveExamId(null);
    setSessionRefreshTick((t) => t + 1);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSwitchTab = (tabId) => {
    setActiveTab(tabId);
    setActiveExamId(null);
    if (typeof window !== 'undefined') {
      const targetUrl = tabId === 'profile' ? '/profile' : '/';
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveVocab = async (item) => {
    const newEntry = {
      id: `vocab-${Date.now()}`,
      word: item.word,
      meaning: item.meaning,
      collocations: item.collocations || 'C1/C2',
      example: item.example || '',
      createdAt: new Date().toISOString()
    };
    setVocabList((prev) => [newEntry, ...prev]);
    try {
      await fetch('/api/vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });
    } catch {
      // handled by localStorage interceptor
    }
  };

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return safeExams.filter((exam) => {
      if (selectedCompetition !== 'ALL' && exam.competition !== selectedCompetition) {
        return false;
      }
      if (!q) return true;
      return (
        exam.title.toLowerCase().includes(q) ||
        exam.school.toLowerCase().includes(q) ||
        exam.competition.toLowerCase().includes(q)
      );
    });
  }, [safeExams, selectedCompetition, searchQuery]);

  const activeExamObj = useMemo(() => {
    if (!activeExamId) return null;
    return safeExams.find((e) => e.id === activeExamId) || null;
  }, [activeExamId, safeExams]);

  const avatarPalette = AVATAR_PALETTES[user.avatarId] || AVATAR_PALETTES.indigo;
  const fontScaleClass = FONT_SIZE_CLASS_MAP[fontScale] || 'text-base';

  const CORE_TABS = [
    { id: 'exams', label: 'Đề thi', icon: BookOpen },
    { id: 'flashcards', label: 'Từ vựng', icon: Layers },
    { id: 'game3d', label: 'Game 3D', icon: Gamepad2 },
    { id: 'profile', label: 'Tài khoản', icon: User }
  ];

  return (
    <GlobalErrorBoundary>
      <div
        className={`min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans ${fontScaleClass}`}
      >
        {/* ================================================================ */}
        {/* CLEAN MINIMALIST TOP HEADER (LOGO + STREAK/AVATAR ONLY)          */}
        {/* ================================================================ */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4">
          <div className="max-w-5xl mx-auto h-full flex items-center justify-between gap-3">
            {/* Brand Logo */}
            <button
              type="button"
              onClick={() => handleSwitchTab('exams')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                V-EngOlympiad
              </span>
            </button>

            {/* Desktop Center Nav Pills */}
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {CORE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSwitchTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: XP/Streak + User Avatar */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Zap className="w-3.5 h-3.5" />
                <span>{user.xp || 250} XP</span>
              </div>

              {user.isGuest ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSwitchTab('profile')}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div
                    className={`w-6 h-6 rounded-lg ${avatarPalette.bg} ${avatarPalette.text} flex items-center justify-center text-[10px] font-bold`}
                  >
                    {getInitials(user.username)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[90px] truncate">
                    {user.username}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ================================================================ */}
        {/* MAIN CONTENT AREA                                                */}
        {/* ================================================================ */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 pb-24 md:pb-10">
          {/* TAB 1: ĐỀ THI (EXAMS LIBRARY OR ACTIVE EXAM RUNNER) */}
          {activeTab === 'exams' && (
            <>
              {activeExamObj ? (
                <MobileExamRunner
                  exam={activeExamObj}
                  initialMode={activeExamMode}
                  onClose={handleCloseExam}
                  onSavedSubmission={(sub) => {
                    setStats((prev) => ({
                      ...prev,
                      recentSubmissions: [sub, ...(prev?.recentSubmissions || [])]
                    }));
                    setSessionRefreshTick((t) => t + 1);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {/* Search & Competition Filter Strip */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm đề thi, trường chuyên, tỉnh thành..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {COMPETITION_FILTERS.map((f) => {
                        const active = selectedCompetition === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedCompetition(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                              active
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clean Exam Cards Grid (Max 2 Badges per Card + Question Count + Progress Bar) */}
                  <div
                    key={sessionRefreshTick}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  >
                    {filteredExams.map((exam) => {
                      const totalQ = exam.questionCount || exam.questions.length || 60;
                      const compStatus = getExamCompletionStatus(
                        exam.id,
                        totalQ,
                        stats?.recentSubmissions || []
                      );
                      const progressPct =
                        compStatus.status === 'COMPLETED'
                          ? 100
                          : Math.min(
                              100,
                              Math.round((compStatus.answeredCount / Math.max(1, totalQ)) * 100)
                            );

                      const badgeClass =
                        COMPETITION_BADGE_STYLES[exam.competition] ||
                        COMPETITION_BADGE_STYLES.HSGQG;

                      return (
                        <div
                          key={exam.id}
                          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 p-4 flex flex-col justify-between gap-3.5 shadow-xs hover:border-indigo-500/60 transition"
                        >
                          <div className="space-y-2">
                            {/* Max 2 Badges: (1) Competition Badge, (2) Completion Score if Completed */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${badgeClass}`}
                              >
                                {exam.competition}
                              </span>

                              {compStatus.status === 'COMPLETED' &&
                                compStatus.bestScore20 !== null && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{compStatus.bestScore20}/20</span>
                                  </span>
                                )}
                            </div>

                            {/* Title & School Name */}
                            <div>
                              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                                {exam.title}
                              </h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {exam.school} • {exam.year}
                              </p>
                            </div>
                          </div>

                          {/* Question Count + Progress Bar + Actions */}
                          <div className="space-y-2.5 pt-1">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                <span>{totalQ} câu</span>
                                <span>
                                  {compStatus.answeredCount > 0
                                    ? `Đã làm ${compStatus.answeredCount}/${totalQ}`
                                    : `${exam.durationMinutes} phút`}
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    compStatus.status === 'COMPLETED'
                                      ? 'bg-emerald-500'
                                      : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenExam(exam.id, 'practice')}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>
                                  {compStatus.answeredCount > 0 ? 'Tiếp tục' : 'Làm bài'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenExam(exam.id, 'test')}
                                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Kiểm tra</span>
                              </button>

                              {compStatus.answeredCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearExamSession(exam.id);
                                    setSessionRefreshTick((t) => t + 1);
                                  }}
                                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 transition"
                                  title="Làm lại từ đầu"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: TỪ VỰNG (FLASHCARDS) */}
          {activeTab === 'flashcards' && (
            <MobileFlashcardsView
              vocabList={vocabList}
              onAddVocab={handleSaveVocab}
            />
          )}

          {/* TAB 3: GAME 3D (3D KANGAROO REFLEX JUMPER) */}
          {activeTab === 'game3d' && (
            <Suspense
              fallback={
                <div className="h-[65vh] rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                  Đang khởi tạo đồ họa 3D...
                </div>
              }
            >
              <LazyKangaroo3DGame
                exams={safeExams}
                onSaveVocab={handleSaveVocab}
              />
            </Suspense>
          )}

          {/* TAB 4: TÀI KHOẢN (PROFILE / AUTH / HISTORY / SAVED) */}
          {activeTab === 'profile' && (
            <ProfileView
              user={user}
              exams={safeExams}
              serverSubmissions={stats?.recentSubmissions || []}
              theme={theme}
              onChangeTheme={setTheme}
              fontScale={fontScale}
              onChangeFontScale={setFontScale}
              onOpenAuthModal={(mode) => {
                setAuthModalMode(mode);
                setAuthModalOpen(true);
              }}
              onLogout={() => {
                const guest = loginAsGuest();
                setUser(guest);
              }}
              onUserUpdated={(updated) => setUser(updated)}
              onOpenExam={(examId) => handleOpenExam(examId, 'practice')}
            />
          )}
        </main>

        {/* ================================================================ */}
        {/* FIXED MOBILE BOTTOM NAVIGATION BAR (4 CORE TABS)                 */}
        {/* ================================================================ */}
        <nav className="fixed bottom-0 inset-x-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 md:hidden px-2">
          <div className="h-full max-w-md mx-auto grid grid-cols-4 gap-1">
            {CORE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl transition ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 font-medium'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ================================================================ */}
        {/* AUTH MODAL (SIGN UP / LOG IN / GUEST UPGRADE)                    */}
        {/* ================================================================ */}
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          currentUser={user}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setSessionRefreshTick((t) => t + 1);
          }}
        />
      </div>
    </GlobalErrorBoundary>
  );
}
