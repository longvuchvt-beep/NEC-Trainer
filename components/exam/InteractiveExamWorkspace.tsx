'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  BookOpen,
  Volume2,
  Square,
  Sparkles,
  BookmarkPlus,
  Highlighter,
  StickyNote,
  Eye,
  Send,
  Award,
  Layers,
  SplitSquareVertical,
  Check,
  AlertTriangle,
  ArrowLeft,
  Flame,
  Zap,
  CornerDownLeft
} from 'lucide-react';
import FocusLoungeWidget, {
  EyeCareTheme,
  FontScaleLevel
} from '../focus/FocusLoungeWidget';

function normalizeAnswer(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '');
}

export function isQuestionCorrect(q: any, userAnswer: string) {
  if (!userAnswer || !String(userAnswer).trim()) return false;
  const normUser = normalizeAnswer(userAnswer);

  if (q.type === 'mcq' || q.type === 'tfng' || q.type === 'gapped_text') {
    return normUser.toUpperCase() === String(q.answer).trim().toUpperCase();
  }

  if (q.type === 'note_completion' && q.maxWords) {
    const wordCount = normUser.split(/\s+/).filter(Boolean).length;
    if (wordCount > q.maxWords) return false;
  }

  const accepted =
    Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length > 0
      ? q.acceptedAnswers
      : String(q.answer || '')
          .split('/')
          .map((s) => s.trim())
          .filter(Boolean);

  return accepted.some((ans: string) => normalizeAnswer(ans) === normUser);
}

interface InteractiveExamWorkspaceProps {
  exam: any;
  initialMode?: 'practice' | 'simulation';
  onClose?: () => void;
  onExamUpdated?: (updatedExam: any) => void;
  onSavedSubmission?: (submission: any) => void;
  onSaveVocab?: (vocabItem: any) => Promise<void> | void;
  onOpenWritingTask?: (part: any, exam: any) => void;
  theme?: EyeCareTheme;
  onThemeChange?: (theme: EyeCareTheme) => void;
  fontScale?: FontScaleLevel;
  onFontScaleChange?: (scale: FontScaleLevel) => void;
  comboStreak?: number;
  lexicalXp?: number;
  onAwardXp?: (xpDelta: number, isCorrect: boolean) => void;
}

export default function InteractiveExamWorkspace({
  exam,
  initialMode = 'practice',
  onClose,
  onExamUpdated,
  onSavedSubmission,
  onSaveVocab,
  onOpenWritingTask,
  theme: externalTheme,
  onThemeChange: externalOnThemeChange,
  fontScale: externalFontScale,
  onFontScaleChange: externalOnFontScaleChange,
  comboStreak: externalStreak,
  lexicalXp: externalXp,
  onAwardXp
}: InteractiveExamWorkspaceProps) {
  const [currentExam, setCurrentExam] = useState<any>(exam);
  const [mode, setMode] = useState<'practice' | 'simulation'>(initialMode);
  const [activeSectionKey, setActiveSectionKey] = useState<string>('reading');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [gradedQuestions, setGradedQuestions] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>((exam?.duration_minutes || 180) * 60);

  // Eye-Care Theme & Font Scaling state (supports standalone or controlled usage)
  const [localTheme, setLocalTheme] = useState<EyeCareTheme>('warm-paper');
  const [localFontScale, setLocalFontScale] = useState<FontScaleLevel>('A');
  const activeTheme = externalTheme || localTheme;
  const activeFontScale = externalFontScale || localFontScale;

  const handleThemeChange = (nextTheme: EyeCareTheme) => {
    setLocalTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'midnight-slate') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (externalOnThemeChange) externalOnThemeChange(nextTheme);
  };

  const handleFontScaleChange = (nextScale: FontScaleLevel) => {
    setLocalFontScale(nextScale);
    document.documentElement.setAttribute('data-font-scale', nextScale);
    if (externalOnFontScaleChange) externalOnFontScaleChange(nextScale);
  };

  // Gamification state (Combo Streak & Lexical XP)
  const [localStreak, setLocalStreak] = useState<number>(0);
  const [localXp, setLocalXp] = useState<number>(120);
  const [xpBurstMessage, setXpBurstMessage] = useState<string | null>(null);
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null);

  const currentStreak = externalStreak !== undefined ? externalStreak : localStreak;
  const currentXp = externalXp !== undefined ? externalXp : localXp;

  // Resizable 2-Pane Split-Screen state
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const passageContainerRef = useRef<HTMLDivElement | null>(null);
  const inlineInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Evidence Jump & 3-Color Text Highlighter state
  const [activeEvidenceQuote, setActiveEvidenceQuote] = useState<string>('');
  const [activeEvidenceAnchorId, setActiveEvidenceAnchorId] = useState<string>('');
  const [passageNotes, setPassageNotes] = useState<string>('');
  const [userHighlights, setUserHighlights] = useState<Array<{ text: string; color: string }>>([]);
  const [highlightColor, setHighlightColor] = useState<string>('bg-amber-300/60 text-amber-950');
  const [selectedPassageText, setSelectedPassageText] = useState<string>('');
  const [savedVocabIds, setSavedVocabIds] = useState<Record<string, boolean>>({});

  // Audio dock state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // AI Explanation Generator state
  const [aiGenLoading, setAiGenLoading] = useState<boolean>(false);
  const [aiGenStepIndex, setAiGenStepIndex] = useState<number>(-1);
  const [aiGenStats, setAiGenStats] = useState<any>(null);

  useEffect(() => {
    setCurrentExam(exam);
  }, [exam]);

  const triggerWorkspaceToast = (msg: string) => {
    setWorkspaceToast(msg);
    setTimeout(() => setWorkspaceToast(null), 3200);
  };

  // Drag handler for Resizable 2-Pane Split-Screen
  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const pct = Math.min(66, Math.max(34, Math.round((relX / rect.width) * 100)));
      setSplitRatio(pct);
    };
    const handleMouseUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit]);

  // Available sections in the exam
  const availableSections = useMemo(() => {
    const s = currentExam?.sections || {};
    const list: Array<{ key: string; label: string; icon: any }> = [];
    if (s.listening?.parts?.length) list.push({ key: 'listening', label: 'I. Listening', icon: Volume2 });
    if (s.lexicoGrammar?.parts?.length) list.push({ key: 'lexicoGrammar', label: 'II. Lexico-Grammar', icon: Layers });
    if (s.reading?.parts?.length) list.push({ key: 'reading', label: 'III. Reading', icon: BookOpen });
    if (s.writing?.parts?.length) list.push({ key: 'writing', label: 'IV. Writing & Transform', icon: Sparkles });
    return list;
  }, [currentExam]);

  useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some((s) => s.key === activeSectionKey)) {
      const preferred = availableSections.find((s) => s.key === 'reading') || availableSections[0];
      setActiveSectionKey(preferred.key);
    }
  }, [availableSections, activeSectionKey]);

  // Flatten all questions across all sections
  const allQuestions = useMemo(() => {
    const s = currentExam?.sections || {};
    const items: any[] = [];
    ['listening', 'lexicoGrammar', 'reading', 'writing'].forEach((secKey) => {
      const parts = s[secKey]?.parts || [];
      parts.forEach((part: any) => {
        (part.questions || []).forEach((q: any) => {
          items.push({ ...q, sectionKey: secKey, partId: part.id, partTitle: part.title });
        });
      });
    });
    return items;
  }, [currentExam]);

  // Countdown Timer in Simulation Mode
  useEffect(() => {
    if (submitted || mode !== 'simulation') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, mode]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleAnswerChange = (qId: string, val: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Check an individual question in Practice Mode & award Combo Streak + +25 Lexical XP
  const handleCheckQuestionInPractice = (q: any, nextBlankNumber?: number) => {
    if (!q) return;
    const userVal = answers[q.id] || '';
    const wasAlreadyGraded = Boolean(gradedQuestions[q.id]);
    const correct = isQuestionCorrect(q, userVal);

    setRevealedQuestions((prev) => ({ ...prev, [q.id]: true }));
    setGradedQuestions((prev) => ({ ...prev, [q.id]: true }));

    if (!wasAlreadyGraded && userVal.trim()) {
      if (correct) {
        const nextStreak = currentStreak + 1;
        setLocalStreak(nextStreak);
        setLocalXp((xp) => xp + 25);
        if (onAwardXp) onAwardXp(25, true);
        setXpBurstMessage(`🔥 ${nextStreak}x C2 Streak! +25 Lexical XP`);
        setTimeout(() => setXpBurstMessage(null), 1800);
      } else {
        setLocalStreak(0);
        if (onAwardXp) onAwardXp(0, false);
      }
    }

    // Auto-focus the next inline blank if Enter was pressed inside an inline input
    if (nextBlankNumber !== undefined) {
      const nextInput =
        inlineInputRefs.current[nextBlankNumber] ||
        (document.getElementById(`inline-blank-${nextBlankNumber}`) as HTMLInputElement | null);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const toggleRevealQuestion = (q: any) => {
    const qId = q.id;
    const willReveal = !revealedQuestions[qId];
    if (willReveal) {
      handleCheckQuestionInPractice(q);
    } else {
      setRevealedQuestions((prev) => ({ ...prev, [qId]: false }));
    }
  };

  // Capture selected text inside the passage for 3-color Highlighting OR 1-Click SM-2 Vocab Save
  const handlePassageMouseUp = () => {
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (text && text.length >= 3 && text.length <= 240) {
      setSelectedPassageText(text);
    }
  };

  const handleHighlightSelection = () => {
    const sel = window.getSelection();
    const text = (sel ? sel.toString().trim() : '') || selectedPassageText;
    if (text && text.length >= 3 && text.length <= 300) {
      setUserHighlights((prev) => [...prev, { text, color: highlightColor }]);
      if (sel) sel.removeAllRanges();
      setSelectedPassageText('');
    }
  };

  // 1-Click Vocab Vault Collector from highlighted passage phrase
  const handleSaveSelectedPhraseToVault = async () => {
    const phrase = selectedPassageText.trim();
    if (!phrase) return;
    if (onSaveVocab) {
      await onSaveVocab({
        term: phrase,
        category: phrase.includes(' ') ? 'COLLOCATION' : 'C2_LEXIS',
        definition_en: `Contextual C1/C2 expression from ${currentExam.title}`,
        definition_vi: 'Cụm từ học thuật C1/C2 trích trực tiếp từ bài đọc Chuyên Anh',
        example_sentence: `Selected from ${currentExam.tournament} ${currentExam.year}: "${phrase}"`,
        source_exam: `${currentExam.tournament} ${currentExam.year} — ${currentExam.province_school}`
      });
    }
    setLocalXp((xp) => xp + 10);
    if (onAwardXp) onAwardXp(10, true);
    triggerWorkspaceToast(`✨ Đã lưu "${phrase.slice(0, 38)}" vào SM-2 Vocab Vault (+10 XP)!`);
    setSelectedPassageText('');
  };

  // Smooth Evidence Jump: Scrolls Left Pane to #ev-q{number} and pulses an amber highlight
  const handleJumpToEvidence = (questionNumber: number, quote?: string) => {
    const anchorId = `ev-q${questionNumber}`;
    setActiveEvidenceAnchorId(anchorId);
    if (quote) setActiveEvidenceQuote(quote);

    setTimeout(() => {
      document.querySelectorAll('.evidence-anchor-active').forEach((el) => {
        el.classList.remove('evidence-anchor-active');
      });

      const anchorEl = document.getElementById(anchorId);
      if (anchorEl) {
        anchorEl.classList.add('evidence-anchor-active');
        anchorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (passageContainerRef.current) {
        const fallbackEl =
          passageContainerRef.current.querySelector(`#${anchorId}`) ||
          passageContainerRef.current.querySelector('.evidence-anchor-active') ||
          passageContainerRef.current.querySelector('.evidence-highlight');
        if (fallbackEl) {
          fallbackEl.classList.add('evidence-anchor-active');
          fallbackEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 80);
  };

  const handleGenerateAiExplanations = async () => {
    if (aiGenLoading) return;
    setAiGenLoading(true);
    setAiGenStats(null);
    setAiGenStepIndex(0);

    const stepTimer = setInterval(() => {
      setAiGenStepIndex((prev) => (prev < 3 ? prev + 1 : prev));
    }, 320);

    try {
      const res = await fetch(`/api/exams/${currentExam.id}/generate-explanations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveToVocabVault: true, overwriteExisting: true })
      });
      const data = await res.json();
      clearInterval(stepTimer);
      setAiGenStepIndex(4);

      if (res.ok && data.success) {
        if (data.updatedExam) {
          setCurrentExam(data.updatedExam);
          const nextRevealed: Record<string, boolean> = { ...revealedQuestions };
          allQuestions.forEach((q) => {
            nextRevealed[q.id] = true;
          });
          setRevealedQuestions(nextRevealed);
        }
        setAiGenStats(data);
        if (onExamUpdated) onExamUpdated(data.updatedExam);
      }
    } catch {
      clearInterval(stepTimer);
    } finally {
      setAiGenLoading(false);
    }
  };

  const handlePlayTranscriptTTS = (transcriptText: string) => {
    if (!window.speechSynthesis) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(transcriptText);
    utter.lang = 'en-GB';
    utter.rate = speechRate;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  const handleSubmitExam = async () => {
    if (submitted) return;
    let earnedPoints = 0;
    let maxPoints = 0;
    const secEarned: Record<string, number> = { listening: 0, lexicoGrammar: 0, reading: 0, writing: 0 };
    const secMax: Record<string, number> = { listening: 0, lexicoGrammar: 0, reading: 0, writing: 0 };

    allQuestions.forEach((q) => {
      const pts = Number(q.points) || 1;
      maxPoints += pts;
      secMax[q.sectionKey] = (secMax[q.sectionKey] || 0) + pts;
      if (isQuestionCorrect(q, answers[q.id])) {
        earnedPoints += pts;
        secEarned[q.sectionKey] = (secEarned[q.sectionKey] || 0) + pts;
      }
    });

    const percentage = maxPoints > 0 ? Number(((earnedPoints / maxPoints) * 100).toFixed(1)) : 0;
    const score20 = Number(((percentage / 100) * 20).toFixed(1));
    const totalDuration = (exam.duration_minutes || 180) * 60;
    const spent = Math.max(15, totalDuration - timeLeft);

    const sectionScores: Record<string, number> = {};
    Object.keys(secMax).forEach((k) => {
      if (secMax[k] > 0) {
        sectionScores[k] = Math.round((secEarned[k] / secMax[k]) * 100);
      }
    });

    const payload = {
      exam_id: exam.id,
      exam_title: exam.title,
      tournament: exam.tournament,
      mode,
      score: score20,
      max_score: 20,
      percentage,
      time_spent_seconds: spent,
      answers,
      section_scores: sectionScores
    };

    setSubmitted(true);
    setSubmissionResult({ ...payload, earnedPoints, maxPoints });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok && onSavedSubmission) {
        onSavedSubmission(await res.json());
      }
    } catch {}
  };

  const handleSaveVocabFromExplanation = async (vocabItem: any, uniqueKey: string) => {
    if (!vocabItem) return;
    setSavedVocabIds((prev) => ({ ...prev, [uniqueKey]: true }));
    if (onSaveVocab) {
      await onSaveVocab({
        term: vocabItem.term,
        category: vocabItem.category || vocabItem.type || 'C2_LEXIS',
        definition_en:
          vocabItem.definition_en ||
          vocabItem.definitionEn ||
          vocabItem.example ||
          `Advanced C1/C2 expression: ${vocabItem.term}`,
        definition_vi: vocabItem.definition_vi || vocabItem.meaningVi || 'Cấu trúc từ vựng C1/C2 trọng tâm',
        example_sentence: vocabItem.example_sentence || vocabItem.example || '',
        source_exam: `${currentExam.tournament} ${currentExam.year} — ${currentExam.province_school}`
      });
    }
    setLocalXp((xp) => xp + 10);
    if (onAwardXp) onAwardXp(10, true);
    triggerWorkspaceToast(`✨ Đã lưu "${vocabItem.term}" vào SM-2 Vocab Vault (+10 XP)!`);
  };

  // Inject #ev-q{number} evidence anchors & user 3-color highlights
  const ensureEvidenceAnchorsInHtml = (rawText = '', questions: any[] = []) => {
    if (!rawText) return '';
    let htmlContent = rawText;

    (questions || []).forEach((q) => {
      const qNum = q.number || q.questionNumber;
      const quote = q.evidenceQuote || q.explanation?.evidenceQuote;
      const anchorId = `ev-q${qNum}`;
      const isCurrentActive = activeEvidenceAnchorId === anchorId;
      const activeCls = isCurrentActive ? ' evidence-anchor-active' : '';

      if (htmlContent.includes(`id="${anchorId}"`)) {
        if (isCurrentActive) {
          htmlContent = htmlContent.replace(
            new RegExp(`id="${anchorId}"\\s+class="evidence-anchor"`, 'g'),
            `id="${anchorId}" class="evidence-anchor evidence-anchor-active"`
          );
        }
      } else if (quote && quote.trim().length >= 4 && htmlContent.includes(quote.trim())) {
        const cleanQuote = quote.trim();
        htmlContent = htmlContent.replace(
          cleanQuote,
          `<span id="${anchorId}" class="evidence-anchor${activeCls}">${cleanQuote}</span>`
        );
      }
    });

    if (activeEvidenceQuote && !htmlContent.includes('evidence-anchor-active')) {
      const escaped = activeEvidenceQuote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      htmlContent = htmlContent.replace(
        regex,
        `<span id="${activeEvidenceAnchorId || 'ev-q-active'}" class="evidence-anchor evidence-anchor-active">$1</span>`
      );
    }

    userHighlights.forEach((h) => {
      if (h.text && h.text !== activeEvidenceQuote) {
        const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        htmlContent = htmlContent.replace(
          regex,
          `<mark class="${h.color} px-1 py-0.5 rounded font-medium">$1</mark>`
        );
      }
    });

    return htmlContent;
  };

  // Build or normalize passage with {{questionNumber}} or [[questionNumber]] smart inline inputs
  const renderSmartPassageWithInlineInputs = (part: any) => {
    let rawPassage: string = part.passage || part.stimulusText || '';
    const partQuestions: any[] = part.questions || [];

    // If this part is a Word Formation or Open Cloze part where stems contain blanks (____) instead of a combined passage,
    // automatically synthesize an inline passage with {{questionNumber}} tokens so students get full inline inputs + floating rootWord badges!
    if (
      !rawPassage &&
      partQuestions.some((q) => q.type === 'word_formation' || q.type === 'open_cloze')
    ) {
      rawPassage = partQuestions
        .map((q) => {
          const qNum = q.number || q.blankNumber;
          const stemText = String(q.stem || '');
          if (stemText.includes('____') || stemText.includes('...')) {
            return stemText.replace(/_{2,}|\.{3,}/, `{{${qNum}}}`);
          }
          return `${stemText} {{${qNum}}}`;
        })
        .join(' ');
    }

    if (!rawPassage) return null;

    // Normalize [[num]] -> {{num}} so both token formats work identically
    const normalizedPassage = rawPassage.replace(/\[\[(\d+)\]\]/g, '{{$1}}');

    if (normalizedPassage.includes('{{')) {
      const segments = normalizedPassage.split(/(\{\{\d+\}\})/g);
      // Ordered list of blank numbers for Enter-key auto-focus next blank
      const blankNumbersOrder = segments
        .map((s) => {
          const m = s.match(/^\{\{(\d+)\}\}$/);
          return m ? Number(m[1]) : null;
        })
        .filter((n): n is number => n !== null);

      return (
        <div
          onMouseUp={handlePassageMouseUp}
          className="passage-prose leading-[2.35] space-y-4 pt-3"
        >
          {segments.map((seg, idx) => {
            const m = seg.match(/^\{\{(\d+)\}\}$/);
            if (!m) {
              const segWithAnchors = ensureEvidenceAnchorsInHtml(seg, partQuestions);
              return <span key={idx} dangerouslySetInnerHTML={{ __html: segWithAnchors }} />;
            }

            const blankNum = Number(m[1]);
            const currentBlankIdx = blankNumbersOrder.indexOf(blankNum);
            const nextBlankNum =
              currentBlankIdx >= 0 && currentBlankIdx + 1 < blankNumbersOrder.length
                ? blankNumbersOrder[currentBlankIdx + 1]
                : undefined;

            const qObj = partQuestions.find(
              (q) => Number(q.blankNumber || q.number || q.questionNumber) === blankNum
            );
            const qId = qObj ? qObj.id : `blank-${blankNum}`;
            const givenWord = qObj?.givenWord || qObj?.rootWord || null;
            const val = answers[qId] || '';
            const showSol = submitted || Boolean(revealedQuestions[qId]);
            const correct = qObj ? isQuestionCorrect(qObj, val) : false;

            return (
              <span
                key={idx}
                id={`ev-q${blankNum}`}
                className={`relative inline-flex flex-col items-start mx-1.5 my-1 align-middle ${
                  activeEvidenceAnchorId === `ev-q${blankNum}`
                    ? 'evidence-anchor evidence-anchor-active'
                    : ''
                }`}
              >
                {/* Floating Root Word / Blank Number Badge right above the input */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-t-md text-[10px] cloze-mono-input font-bold tracking-wide border border-b-0 ${
                    givenWord
                      ? 'bg-amber-800 text-amber-50 border-amber-900'
                      : 'bg-slate-700 text-white border-slate-800'
                  }`}
                >
                  <span>{blankNum}.</span>
                  {givenWord && <span>{givenWord}</span>}
                </span>

                <span className="inline-flex items-center">
                  <input
                    id={`inline-blank-${blankNum}`}
                    ref={(el) => {
                      inlineInputRefs.current[blankNum] = el;
                    }}
                    type="text"
                    value={val}
                    disabled={submitted}
                    placeholder={givenWord ? `${givenWord} →` : `(${blankNum})`}
                    onChange={(e) => handleAnswerChange(qId, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (mode === 'practice' && qObj) {
                          handleCheckQuestionInPractice(qObj, nextBlankNum);
                        } else if (nextBlankNum !== undefined) {
                          const nextEl = inlineInputRefs.current[nextBlankNum];
                          if (nextEl) nextEl.focus();
                        }
                      }
                    }}
                    className={`w-36 sm:w-40 px-2.5 py-1 text-xs sm:text-sm cloze-mono-input font-semibold rounded-b-lg rounded-tr-lg border transition-all focus:outline-none focus:ring-2 ${
                      showSol
                        ? correct
                          ? 'bg-emerald-500/20 border-emerald-600 text-emerald-900 dark:text-emerald-200 focus:ring-emerald-500'
                          : 'bg-rose-500/20 border-rose-600 text-rose-900 dark:text-rose-200 focus:ring-rose-500'
                        : 'eyecare-card border-amber-800/40 focus:border-amber-700 focus:ring-amber-600/30'
                    }`}
                  />

                  {showSol && !correct && qObj && (
                    <span className="ml-1.5 px-2 py-0.5 text-xs cloze-mono-input font-bold bg-emerald-600 text-white rounded-md shadow-sm">
                      ✓ {qObj.answer}
                    </span>
                  )}
                </span>
              </span>
            );
          })}
        </div>
      );
    }

    const htmlContent = ensureEvidenceAnchorsInHtml(rawPassage, partQuestions);
    return (
      <div
        onMouseUp={handlePassageMouseUp}
        className="passage-prose space-y-4 [&>p]:mb-4"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  // Render an individual Question Card in the Right Pane
  const renderQuestionCard = (q: any, qIdx: number, partQuestions: any[]) => {
    const userVal = answers[q.id] || '';
    const isFlagged = Boolean(flagged[q.id]);
    const showExplanation = submitted || Boolean(revealedQuestions[q.id]);
    const correct = isQuestionCorrect(q, userVal);
    const wordCount = userVal.trim() ? userVal.trim().split(/\s+/).filter(Boolean).length : 0;
    const overWordLimit = q.type === 'note_completion' && q.maxWords && wordCount > q.maxWords;
    const nextQ = partQuestions[qIdx + 1];

    let parsedExplanationJson: any = null;
    if (q.explanationJson) {
      try {
        parsedExplanationJson =
          typeof q.explanationJson === 'string' ? JSON.parse(q.explanationJson) : q.explanationJson;
      } catch {}
    }

    const grammarPoint =
      parsedExplanationJson?.grammarOrLexicalPoint ||
      q.explanation?.grammarOrLexicalPoint ||
      q.explanation?.rule ||
      '';
    const detailedVi =
      parsedExplanationJson?.detailedAnalysisVi ||
      q.explanation?.detailedAnalysisVi ||
      q.explanation?.vi ||
      '';
    const detailedEn = q.explanation?.en || '';
    const optionBreakdown =
      parsedExplanationJson?.optionBreakdown ||
      q.explanation?.optionBreakdown ||
      q.explanation?.optionAnalysis ||
      null;
    const evidenceQuote =
      parsedExplanationJson?.evidenceQuote ||
      q.evidenceQuote ||
      q.explanation?.evidenceQuote ||
      '';
    const evidenceAnchorId =
      parsedExplanationJson?.evidenceAnchorId ||
      q.explanation?.evidenceAnchorId ||
      `ev-q${q.number}`;

    const rawExtractedVocab =
      parsedExplanationJson?.extractedVocab ||
      q.explanation?.extractedVocab ||
      (q.explanation?.vocabItem
        ? [
            {
              term: q.explanation.vocabItem.term,
              type: q.explanation.vocabItem.category || 'C2_LEXIS',
              meaningVi: q.explanation.vocabItem.definition_vi || q.explanation.vocabItem.meaningVi,
              example:
                q.explanation.vocabItem.example_sentence ||
                q.explanation.vocabItem.definition_en ||
                q.stem
            }
          ]
        : []);

    return (
      <div
        key={q.id}
        id={`q-card-${q.id}`}
        className={`question-prose rounded-2xl border p-5 transition-all shadow-sm ${
          showExplanation
            ? correct
              ? 'border-emerald-600/60 bg-emerald-500/5'
              : 'border-rose-600/60 bg-rose-500/5'
            : isFlagged
            ? 'border-amber-500/70 bg-amber-500/5'
            : 'eyecare-card'
        }`}
      >
        {/* Question Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-900 text-amber-50 text-xs font-bold cloze-mono-input">
              Q{q.number}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full eyecare-elevated border">
              {q.type === 'mcq' && 'Multiple Choice'}
              {q.type === 'word_formation' && `Word Formation • Root: ${q.rootWord || q.givenWord}`}
              {q.type === 'open_cloze' && 'Open Cloze (1 Word)'}
              {q.type === 'tfng' && 'True / False / Not Given'}
              {q.type === 'gapped_text' && 'Gapped Text Insertion'}
              {q.type === 'note_completion' && `Note Completion (Max ${q.maxWords || 3} words)`}
              {q.type === 'sentence_transformation' &&
                `Sentence Transformation ${q.keyword ? `• Keyword: ${q.keyword}` : ''}`}
            </span>
            {q.highFrequencyBadge && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                {q.highFrequencyBadge}
              </span>
            )}
            {showExplanation && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  correct
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                {correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {correct ? `Correct (+25 XP)` : 'Incorrect'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {mode === 'practice' && !submitted && (
              <button
                type="button"
                onClick={() => toggleRevealQuestion(q)}
                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  revealedQuestions[q.id]
                    ? 'bg-amber-900 text-amber-50'
                    : 'eyecare-elevated border hover:opacity-90'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {revealedQuestions[q.id] ? 'Ẩn giải thích' : 'Kiểm tra & Chữa (Enter)'}
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleFlag(q.id)}
              title="Đánh dấu xem lại (Flag for Review)"
              className={`p-1.5 rounded-xl border transition ${
                isFlagged
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600'
                  : 'eyecare-elevated opacity-60 hover:opacity-100'
              }`}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Stem */}
        <p className="font-medium mb-4 leading-relaxed">{q.stem}</p>

        {/* MCQ / TFNG / GAPPED TEXT OPTIONS */}
        {(q.type === 'mcq' || q.type === 'tfng' || q.type === 'gapped_text') && (
          <div className="grid grid-cols-1 gap-2">
            {(q.options || []).map((opt: any) => {
              const isSelected = String(userVal).toUpperCase() === String(opt.id).toUpperCase();
              const isRightOpt = String(q.answer).toUpperCase() === String(opt.id).toUpperCase();
              let btnStyle = 'eyecare-elevated hover:border-amber-700/50';
              if (showExplanation) {
                if (isRightOpt) {
                  btnStyle =
                    'border-emerald-600 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100 font-bold';
                } else if (isSelected && !isRightOpt) {
                  btnStyle = 'border-rose-600 bg-rose-500/15 text-rose-950 dark:text-rose-100';
                }
              } else if (isSelected) {
                btnStyle =
                  'border-amber-800 bg-amber-500/15 text-amber-950 dark:text-amber-100 font-bold ring-1 ring-amber-800/40';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitted}
                  onClick={() => {
                    handleAnswerChange(q.id, opt.id);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm flex items-start gap-3 transition ${btnStyle}`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold cloze-mono-input shrink-0 mt-0.5 ${
                      isSelected ? 'bg-amber-900 text-amber-50' : 'eyecare-card border'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="flex-1 leading-relaxed">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* WORD FORMATION / OPEN CLOZE / NOTE COMPLETION INPUT */}
        {(q.type === 'word_formation' || q.type === 'open_cloze' || q.type === 'note_completion') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative flex-1 min-w-[230px]">
                {(q.rootWord || q.givenWord) && (
                  <span className="inline-block mb-1 px-2 py-0.5 rounded-md bg-amber-900 text-amber-50 cloze-mono-input text-[11px] font-bold">
                    {q.number}. {q.rootWord || q.givenWord}
                  </span>
                )}
                <input
                  type="text"
                  disabled={submitted}
                  value={userVal}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (mode === 'practice') {
                        handleCheckQuestionInPractice(q, nextQ?.number);
                      }
                    }
                  }}
                  placeholder={
                    q.type === 'word_formation'
                      ? `Type derived form of ${q.rootWord || q.givenWord} (Press Enter to check)...`
                      : q.type === 'open_cloze'
                      ? 'Type ONE word (Press Enter to check)...'
                      : `Type answer (max ${q.maxWords || 3} words)...`
                  }
                  className="w-full px-3.5 py-2 rounded-xl border eyecare-elevated cloze-mono-input text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-700"
                />
              </div>

              {mode === 'practice' && !submitted && (
                <button
                  type="button"
                  onClick={() => handleCheckQuestionInPractice(q, nextQ?.number)}
                  className="px-3 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-bold flex items-center gap-1"
                  title="Nhấn Enter để kiểm tra nhanh và chuyển sang ô tiếp theo"
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  Enter
                </button>
              )}
            </div>
            {overWordLimit && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Vượt quá giới hạn số từ! Bạn đã nhập {wordCount} từ (Tối đa: {q.maxWords} từ).
              </div>
            )}
          </div>
        )}

        {/* SENTENCE TRANSFORMATION INPUT */}
        {q.type === 'sentence_transformation' && (
          <div className="space-y-2">
            {q.keyword && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-900/15 border border-amber-800/30 text-amber-900 dark:text-amber-300 text-xs cloze-mono-input font-bold">
                KEYWORD: {q.keyword} (Do not change this word)
              </div>
            )}
            {q.promptPrefix && (
              <div className="text-xs opacity-75 font-medium">
                Prompt starter: <span className="font-bold">&ldquo;{q.promptPrefix}...&rdquo;</span>
              </div>
            )}
            <input
              type="text"
              disabled={submitted}
              value={userVal}
              onFocus={() => {
                if (!userVal && q.promptPrefix) {
                  handleAnswerChange(q.id, `${q.promptPrefix} `);
                }
              }}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mode === 'practice') {
                  e.preventDefault();
                  handleCheckQuestionInPractice(q);
                }
              }}
              placeholder={
                q.promptPrefix
                  ? `${q.promptPrefix} ... (Press Enter to check)`
                  : 'Type the complete transformed sentence...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border eyecare-elevated cloze-mono-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-700"
            />
          </div>
        )}

        {/* DEEP C1/C2 SOLUTION & EVIDENCE ANCHORING */}
        {showExplanation && (
          <div className="mt-4 pt-4 border-t border-amber-900/15 dark:border-slate-700 space-y-3 text-sm">
            {/* Answer comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 rounded-xl eyecare-elevated border">
              <div>
                <span className="text-[11px] uppercase tracking-wider opacity-60 block">
                  Bài làm của bạn
                </span>
                <span
                  className={`cloze-mono-input font-bold ${
                    correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 line-through'
                  }`}
                >
                  {userVal || '(Chưa trả lời)'}
                </span>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider opacity-60 block">
                  Đáp án chuẩn (Official Key)
                </span>
                <span className="cloze-mono-input font-bold text-emerald-700 dark:text-emerald-400">
                  {q.answer}
                </span>
              </div>
            </div>

            {grammarPoint && (
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
                Chủ điểm C1/C2: {grammarPoint}
              </div>
            )}

            <div className="space-y-1.5 leading-relaxed">
              {detailedVi && (
                <p>
                  <strong>Giải thích Chuyên sâu:</strong> {detailedVi}
                </p>
              )}
              {detailedEn && (
                <p className="text-xs opacity-75">
                  <strong>Linguistic Note:</strong> {detailedEn}
                </p>
              )}
            </div>

            {optionBreakdown && (
              <div className="p-3 rounded-xl eyecare-elevated border space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">
                  Phân tích 4 Phương án &amp; Bẫy từ vựng (A, B, C, D):
                </div>
                {Object.entries(optionBreakdown).map(([optKey, desc]: [string, any]) => (
                  <div key={optKey} className="text-xs flex items-start gap-2">
                    <span
                      className={`cloze-mono-input font-bold px-1.5 py-0.5 rounded ${
                        optKey === q.answer
                          ? 'bg-emerald-600 text-white'
                          : 'eyecare-card border opacity-75'
                      }`}
                    >
                      {optKey}
                    </span>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Smooth Evidence Jump Button */}
            {(evidenceQuote || activeSectionKey === 'reading' || activeSectionKey === 'listening') && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs space-y-0.5">
                  <div className="cloze-mono-input font-bold text-[11px] text-amber-800 dark:text-amber-300">
                    EVIDENCE ANCHOR: #{evidenceAnchorId}
                  </div>
                  {evidenceQuote ? (
                    <div className="italic font-serif">&ldquo;{evidenceQuote}&rdquo;</div>
                  ) : (
                    <div>Nhấn nút bên phải để cuộn mượt tới vị trí dẫn chứng câu #{q.number} ở khung trái.</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleJumpToEvidence(q.number, evidenceQuote)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-sm shrink-0 transition"
                >
                  🔍 Jump to Evidence
                </button>
              </div>
            )}

            {/* 1-Click Vocab Vault Collector inside Explanations */}
            {rawExtractedVocab.length > 0 && (
              <div className="p-3.5 rounded-xl eyecare-elevated border space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BookmarkPlus className="w-3.5 h-3.5 text-amber-700" />
                  C1/C2 Lexical Vault Collector (Lưu 1 chạm vào Anki SM-2):
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {rawExtractedVocab.map((vItem: any, vIdx: number) => {
                    const saveKey = `${q.id}-vocab-${vIdx}`;
                    const isSaved = Boolean(savedVocabIds[saveKey]);
                    return (
                      <div
                        key={saveKey}
                        className="p-2.5 rounded-xl eyecare-card border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs md:text-sm font-serif">
                              {vItem.term}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] cloze-mono-input font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                              {vItem.type || vItem.category || 'C2_LEXIS'}
                            </span>
                            <span className="text-xs font-semibold">
                              — {vItem.meaningVi || vItem.definition_vi}
                            </span>
                          </div>
                          {(vItem.example || vItem.example_sentence) && (
                            <p className="text-[11px] opacity-75 italic truncate">
                              e.g., &ldquo;{vItem.example || vItem.example_sentence}&rdquo;
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isSaved}
                          onClick={() => handleSaveVocabFromExplanation(vItem, saveKey)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 inline-flex items-center gap-1.5 transition ${
                            isSaved
                              ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-900 hover:bg-amber-800 text-amber-50 shadow-sm'
                          }`}
                        >
                          {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                          {isSaved ? 'Scheduled in SM-2 ✓' : '+ Save to SM-2 Vault'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const currentSection = currentExam?.sections?.[activeSectionKey] || {};
  const currentParts: any[] = currentSection.parts || [];

  // Determine whether Left Sticky Passage / Cloze / Audio Dock should be shown
  // We show the 2-Pane Split-Screen for Reading, Listening, AND Lexico-Grammar (so Word Formation & Cloze passages sit sticky on the left!)
  const showSplitLeftPane =
    activeSectionKey === 'reading' ||
    activeSectionKey === 'listening' ||
    activeSectionKey === 'lexicoGrammar';

  return (
    <div className="fixed inset-0 z-50 eyecare-canvas flex flex-col">
      {/* Celebratory Floating XP Burst Toast */}
      {xpBurstMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-extrabold text-sm shadow-2xl flex items-center gap-2 animate-xp-burst pointer-events-none">
          <Flame className="w-4 h-4 fill-white" />
          <span>{xpBurstMessage}</span>
        </div>
      )}

      {/* Instant SM-2 Vocab Scheduled Toast */}
      {workspaceToast && (
        <div className="fixed bottom-16 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-800 text-white text-xs md:text-sm font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{workspaceToast}</span>
        </div>
      )}

      {/* TOP CBT HEADER BAR WITH FOCUS LOUNGE, EYE-CARE THEME & GAMIFIED STREAK */}
      <header className="min-h-[64px] px-4 lg:px-6 py-2 eyecare-card border-b flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border eyecare-elevated hover:opacity-80 transition"
              title="Quay lại Thư viện đề"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-extrabold rounded bg-amber-900 text-amber-50">
                {currentExam.tournament} {currentExam.year}
              </span>
              <span className="text-xs opacity-70 truncate hidden sm:inline">
                {currentExam.province_school}
              </span>
            </div>
            <h2 className="text-sm md:text-base font-extrabold truncate">{currentExam.title}</h2>
          </div>
        </div>

        {/* Section Switcher Pills */}
        <div className="hidden 2xl:flex items-center gap-1 eyecare-elevated p-1 rounded-xl border">
          {availableSections.map((sec) => {
            const Icon = sec.icon;
            const active = activeSectionKey === sec.key;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveSectionKey(sec.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  active ? 'bg-amber-900 text-amber-50 shadow-sm' : 'opacity-75 hover:opacity-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Right Controls: Focus Lounge + Eye-Care Theme + Mode + Submit */}
        <div className="flex flex-wrap items-center gap-2">
          <FocusLoungeWidget
            theme={activeTheme}
            onThemeChange={handleThemeChange}
            fontScale={activeFontScale}
            onFontScaleChange={handleFontScaleChange}
            comboStreak={currentStreak}
            lexicalXp={currentXp}
            compact
          />

          {!submitted && (
            <div className="hidden md:flex items-center eyecare-elevated p-0.5 rounded-xl border text-xs">
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  mode === 'practice' ? 'bg-emerald-700 text-white' : 'opacity-70'
                }`}
              >
                Practice
              </button>
              <button
                type="button"
                onClick={() => setMode('simulation')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  mode === 'simulation' ? 'bg-amber-800 text-white' : 'opacity-70'
                }`}
              >
                Exam Timer
              </button>
            </div>
          )}

          {mode === 'simulation' && !submitted && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl cloze-mono-input text-xs font-bold border ${
                timeLeft < 600
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 animate-pulse'
                  : 'eyecare-elevated'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              {formatTimer(timeLeft)}
            </div>
          )}

          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmitExam}
              className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              Nộp bài
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
              <Award className="w-4 h-4" />
              {submissionResult?.score} / 20 ({submissionResult?.percentage}%)
            </div>
          )}
        </div>
      </header>

      {/* Secondary Section Bar on compact screens */}
      <div className="2xl:hidden flex items-center justify-between gap-2 px-4 py-2 eyecare-elevated border-b overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5">
          {availableSections.map((sec) => {
            const Icon = sec.icon;
            const active = activeSectionKey === sec.key;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveSectionKey(sec.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${
                  active ? 'bg-amber-900 text-amber-50' : 'eyecare-card border opacity-80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] font-semibold opacity-75 hidden sm:block">
          Mẹo: Gõ đáp án vào ô trống trong bài đọc và nhấn <kbd className="px-1.5 py-0.5 rounded border eyecare-card cloze-mono-input">Enter</kbd> để chấm ngay &amp; nhảy sang câu kế tiếp!
        </div>
      </div>

      {/* RESIZABLE 2-PANE ZERO-SCROLL SPLIT-SCREEN WORKSPACE */}
      <div
        ref={splitContainerRef}
        className="flex-1 overflow-hidden flex flex-col lg:flex-row relative"
      >
        {/* ==================== LEFT PANE: STICKY PASSAGE, INLINE CLOZE & AUDIO DOCK ==================== */}
        {showSplitLeftPane && (
          <div
            ref={passageContainerRef}
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${splitRatio}%` : '100%' }}
            className="h-1/2 lg:h-full overflow-y-auto border-b lg:border-b-0 lg:border-r border-amber-900/15 dark:border-slate-800 p-5 lg:p-8 space-y-6 eyecare-card"
          >
            {/* Sticky Passage Toolbar: 3-Color Highlighter + 1-Click Save Selection to SM-2 + Split Ratio */}
            <div className="sticky top-0 z-20 flex items-center justify-between gap-2 flex-wrap p-2.5 rounded-2xl eyecare-elevated border shadow-sm backdrop-blur">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold flex items-center gap-1 mr-1">
                  <Highlighter className="w-3.5 h-3.5 text-amber-700" />
                  3-Color Highlighter:
                </span>
                {[
                  { cls: 'bg-amber-300/60 text-amber-950', label: 'Amber' },
                  { cls: 'bg-emerald-300/60 text-emerald-950', label: 'Matcha' },
                  { cls: 'bg-rose-300/60 text-rose-950', label: 'Coral' }
                ].map((c) => (
                  <button
                    key={c.cls}
                    type="button"
                    onClick={() => setHighlightColor(c.cls)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                      highlightColor === c.cls ? 'ring-2 ring-amber-900 border-amber-900' : 'border-transparent'
                    } ${c.cls}`}
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleHighlightSelection}
                  className="px-2.5 py-1 rounded-lg bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-bold"
                >
                  Highlight đoạn bôi đen
                </button>

                {selectedPassageText && (
                  <button
                    type="button"
                    onClick={handleSaveSelectedPhraseToVault}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-1 shadow-sm animate-pulse"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    + Save &ldquo;{selectedPassageText.slice(0, 22)}&rdquo; to SM-2 Vault
                  </button>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-1 text-xs">
                <SplitSquareVertical className="w-3.5 h-3.5 opacity-60 mr-1" />
                {[42, 50, 58].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSplitRatio(w)}
                    className={`px-2 py-0.5 rounded cloze-mono-input font-bold ${
                      Math.abs(splitRatio - w) <= 3
                        ? 'bg-amber-900 text-amber-50'
                        : 'eyecare-card border opacity-75'
                    }`}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </div>

            {/* Render each Part's Stimulus / Passage / Audio / Inline Blanks */}
            {currentParts.map((part) => (
              <div
                key={part.id}
                className="space-y-4 pb-6 border-b border-amber-900/15 dark:border-slate-800 last:border-b-0"
              >
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                    {part.title}
                  </span>
                  {part.passageTitle && (
                    <h3 className="text-xl md:text-2xl font-bold font-serif mt-1">
                      {part.passageTitle}
                    </h3>
                  )}
                  <p className="text-xs opacity-75 mt-1">{part.instructions}</p>
                </div>

                {/* Listening Audio Dock + Interactive Transcript */}
                {activeSectionKey === 'listening' && (
                  <div className="p-4 rounded-2xl eyecare-elevated border space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handlePlayTranscriptTTS(part.transcript)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                          isSpeaking
                            ? 'bg-rose-700 text-white'
                            : 'bg-amber-900 hover:bg-amber-800 text-amber-50'
                        }`}
                      >
                        {isSpeaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-4 h-4" />}
                        {isSpeaking ? 'Dừng phát Audio (Stop)' : 'Phát Audio Bài Nghe (Academic Neural TTS)'}
                      </button>

                      <div className="flex items-center gap-1 text-xs">
                        <span className="opacity-70 mr-1">Tốc độ:</span>
                        {[0.75, 1.0, 1.25, 1.5].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSpeechRate(r)}
                            className={`px-2 py-1 rounded cloze-mono-input font-bold ${
                              speechRate === r ? 'bg-amber-900 text-amber-50' : 'eyecare-card border'
                            }`}
                          >
                            {r}x
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-900/15">
                      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1.5">
                        Interactive Transcript (Click bôi đen từ bất kỳ để lưu vào SM-2 Vault):
                      </div>
                      <div
                        onMouseUp={handlePassageMouseUp}
                        className="passage-prose text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: ensureEvidenceAnchorsInHtml(
                            part.transcriptHtml || part.transcript || '',
                            part.questions || []
                          )
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Smart Passage / Inline Cloze / Word Formation Passage */}
                {renderSmartPassageWithInlineInputs(part)}
              </div>
            ))}

            {/* Built-in Scratchpad */}
            <div className="p-4 rounded-2xl eyecare-elevated border space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-400">
                <StickyNote className="w-4 h-4" />
                Ghi chú nháp khi đọc/nghe (Passage Scratchpad &amp; Discourse Outline):
              </div>
              <textarea
                rows={3}
                value={passageNotes}
                onChange={(e) => setPassageNotes(e.target.value)}
                placeholder="Ghi nhanh cấu trúc lập luận, từ khóa hoặc bẫy phủ định (not only, far from, little)..."
                className="w-full p-3 rounded-xl eyecare-card border text-xs focus:outline-none focus:ring-2 focus:ring-amber-700"
              />
            </div>
          </div>
        )}

        {/* DRAGGABLE SPLIT HANDLE */}
        {showSplitLeftPane && (
          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            title="Kéo để thay đổi độ rộng 2 khung Split-Screen"
            className="hidden lg:flex w-2 cursor-col-resize items-center justify-center bg-amber-900/10 hover:bg-amber-700/40 transition-colors select-none"
          >
            <div className="w-0.5 h-12 rounded-full bg-amber-900/40" />
          </div>
        )}

        {/* ==================== RIGHT PANE: INDEPENDENT SCROLL QUESTION CARDS ==================== */}
        <div className="flex-1 h-1/2 lg:h-full overflow-y-auto p-5 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/15 pb-3">
            <div>
              <h3 className="text-lg font-extrabold">{currentSection.title}</h3>
              <p className="text-xs opacity-75">
                {mode === 'practice'
                  ? 'Practice Mode: Nhấn Enter sau khi gõ đáp án để chấm ngay, nhận +25 Lexical XP và tự động nhảy sang ô trống tiếp theo!'
                  : 'Simulation Mode: Hoàn thành tất cả các câu hỏi và nhấn "Nộp bài" trước khi hết giờ.'}
              </p>
            </div>

            <button
              type="button"
              disabled={aiGenLoading}
              onClick={handleGenerateAiExplanations}
              className="px-4 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-2 shadow-sm shrink-0 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {aiGenLoading
                ? 'Analyzing Sections with Gemini AI...'
                : '✨ Generate C1/C2 Explanations (AI)'}
            </button>
          </div>

          {currentParts.map((part) => (
            <div key={part.id} className="space-y-4">
              <div className="p-3.5 rounded-2xl eyecare-elevated border">
                <div className="text-sm font-extrabold text-amber-900 dark:text-amber-300">
                  {part.title}
                </div>
                <div className="text-xs opacity-80 mt-0.5">{part.instructions}</div>
              </div>

              {(part.questions || []).map((q: any, qIdx: number) =>
                renderQuestionCard(q, qIdx, part.questions || [])
              )}

              {/* Extended Writing Tasks inside Section IV */}
              {part.partType && (
                <div className="rounded-2xl border eyecare-card p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-900 text-amber-50 uppercase">
                      {part.partType === 'summary' && 'Part 1: Summary Writing (100–120 words)'}
                      {part.partType === 'chart' && 'Part 2: Chart / Table Description (150 words)'}
                      {part.partType === 'essay' && 'Part 3: Academic Essay (350 words)'}
                    </span>
                    <span className="text-xs cloze-mono-input opacity-75">
                      Target: {part.minWords}–{part.maxWords} words • {part.points} pts
                    </span>
                  </div>

                  {part.sourcePassage && (
                    <div className="p-4 rounded-xl eyecare-elevated border space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider opacity-70">
                        Source Passage for Summary:
                      </div>
                      <p className="passage-prose text-sm leading-relaxed">{part.sourcePassage}</p>
                    </div>
                  )}

                  <p className="text-sm font-semibold leading-relaxed">Prompt: {part.prompt}</p>

                  {onOpenWritingTask && (
                    <button
                      type="button"
                      onClick={() => onOpenWritingTask(part, currentExam)}
                      className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold inline-flex items-center gap-2 shadow-sm transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      Mở trong 3-Tier Sentence Surgery Writing Studio →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM QUESTION NAVIGATION PALETTE */}
      <footer className="h-14 px-4 lg:px-6 eyecare-card border-t flex items-center justify-between gap-4 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold opacity-70 mr-2 whitespace-nowrap">
            Question Palette:
          </span>
          {allQuestions.map((q) => {
            const answered = Boolean(answers[q.id] && String(answers[q.id]).trim());
            const isFlag = Boolean(flagged[q.id]);
            const showSol = submitted || Boolean(revealedQuestions[q.id]);
            const ok = isQuestionCorrect(q, answers[q.id]);

            let pillStyle = 'eyecare-elevated opacity-80';
            if (showSol) {
              pillStyle = ok
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-rose-600 text-white border-rose-500';
            } else if (isFlag) {
              pillStyle = 'bg-amber-500 text-slate-950 border-amber-400 font-bold';
            } else if (answered) {
              pillStyle = 'bg-amber-900 text-amber-50 border-amber-950';
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setActiveSectionKey(q.sectionKey);
                  setTimeout(() => {
                    const el = document.getElementById(`q-card-${q.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 60);
                }}
                className={`w-7 h-7 rounded-lg text-xs cloze-mono-input font-bold border flex items-center justify-center shrink-0 transition ${pillStyle}`}
                title={`Question ${q.number}`}
              >
                {q.number}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs opacity-80 whitespace-nowrap">
          <span>
            Đã trả lời:{' '}
            <strong className="cloze-mono-input">
              {Object.keys(answers).filter((k) => String(answers[k]).trim()).length}/
              {allQuestions.length}
            </strong>
          </span>
          <span>
            Combo:{' '}
            <strong className="text-orange-600 cloze-mono-input">{currentStreak}x 🔥</strong>
          </span>
          <span>
            Lexical XP:{' '}
            <strong className="text-amber-700 cloze-mono-input">{currentXp} XP ⚡</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
