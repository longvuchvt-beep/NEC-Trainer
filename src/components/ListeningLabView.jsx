'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Headphones, Play, Pause, RotateCcw, RotateCw, Repeat, Upload, Link2,
  CheckCircle2, XCircle, Eye, Sparkles, Volume2, AlertTriangle, HelpCircle
} from 'lucide-react';
import { isQuestionCorrect } from './ExamRoomModal';

const FALLBACK_LISTENING_TRACKS = [
  {
    id: 'hsgqg-2025-listening-p1',
    examId: 'hsgqg-2025-national-official',
    examTitle: 'Đề Thi Chọn Học Sinh Giỏi Quốc Gia THPT 2025 – Bộ GD&ĐT (Bảng A)',
    tournament: 'HSGQG',
    year: 2025,
    school: 'Bộ Giáo dục & Đào tạo (Toàn quốc)',
    title: 'Part 1: Academic Lecture — Algorithmic Epistemology & Cognitive Offloading',
    instructions: 'For questions 1–5, listen to an academic lecture on cognitive offloading and choose the best answer (A, B, C, or D).',
    audioUrl: '',
    transcript:
      'Welcome to today’s symposium on cognitive science. For decades, scholars assumed that externalizing memory—whether onto clay tablets or cloud servers—merely freed up working memory for higher-order synthesis. However, recent neurobiological telemetry reveals a far more ambivalent picture. When learners habitually delegate retrieval to algorithmic indices, hippocampal consolidation weakens, creating what we term an epistemic illusion of competence. Rather than internalizing conceptual schemas, users mistake seamless access to information for genuine comprehension.',
    questions: [
      {
        id: 'listen-q1',
        number: 1,
        type: 'mcq',
        stem: '1. According to the speaker, what did scholars traditionally assume about externalizing memory?',
        options: [
          { id: 'A', text: 'It inevitably leads to hippocampal atrophy in adolescents.' },
          { id: 'B', text: 'It liberates cognitive bandwidth for complex analytical synthesis.' },
          { id: 'C', text: 'It prevents the formation of long-term semantic schemas.' },
          { id: 'D', text: 'It is inferior to oral traditions of knowledge transmission.' }
        ],
        answer: 'B',
        explanation: {
          rule: 'Listening for Academic Paraphrase',
          vi: 'Diễn giả nêu rõ: các học giả từng cho rằng việc lưu trữ trí nhớ ra bên ngoài giúp giải phóng trí nhớ làm việc cho sự tổng hợp bậc cao (higher-order synthesis).',
          en: 'Externalizing memory freed up working memory for higher-order synthesis.'
        }
      },
      {
        id: 'listen-q2',
        number: 2,
        type: 'mcq',
        stem: '2. What does the speaker mean by the phrase "epistemic illusion of competence"?',
        options: [
          { id: 'A', text: 'Believing one understands a subject simply because one can look it up instantly.' },
          { id: 'B', text: 'Overestimating the accuracy of algorithmic search engines.' },
          { id: 'C', text: 'Memorizing facts without knowing their practical application.' },
          { id: 'D', text: 'Designing AI models that mimic human reasoning.' }
        ],
        answer: 'A',
        explanation: {
          rule: 'Inferring Conceptual Meaning in Lectures',
          vi: 'Người dùng nhầm lẫn giữa việc truy cập thông tin dễ dàng với sự thấu hiểu thực sự (mistake seamless access to information for genuine comprehension).',
          en: 'Users mistake seamless access to information for genuine comprehension.'
        }
      }
    ]
  }
];

export default function ListeningLabView({ exams = [], onSaveVocab }) {
  // Collect all listening parts across all exams
  const listeningTracks = useMemo(() => {
    const list = [];
    exams.forEach(exam => {
      const parts = exam.sections?.listening?.parts || [];
      parts.forEach(p => {
        list.push({
          ...p,
          examId: exam.id,
          examTitle: exam.title,
          tournament: exam.tournament,
          year: exam.year,
          school: exam.province_school
        });
      });
    });
    return list.length > 0 ? list : FALLBACK_LISTENING_TRACKS;
  }, [exams]);

  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const activeTrack = listeningTracks[selectedTrackIdx] || listeningTracks[0] || null;

  // Audio player state
  const [customAudioSrc, setCustomAudioSrc] = useState('');
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(65);
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState(0);

  // Workspace tabs: 'questions' | 'dictation' | 'transcript'
  const [labTab, setLabTab] = useState('questions');
  const [answers, setAnswers] = useState({});
  const [checkedQuestions, setCheckedQuestions] = useState(false);
  const [dictationInputs, setDictationInputs] = useState({});
  const [dictationChecked, setDictationChecked] = useState(false);

  const audioRef = useRef(null);
  const ttsTimerRef = useRef(null);

  const sentences = useMemo(() => {
    if (!activeTrack?.transcript) return [];
    return activeTrack.transcript
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [activeTrack]);

  useEffect(() => {
    stopAllPlayback();
    setCheckedQuestions(false);
    setDictationChecked(false);
    setDictationInputs({});
    setLoopA(null);
    setLoopB(null);
    setCurrentTime(0);
  }, [selectedTrackIdx]);

  useEffect(() => {
    return () => stopAllPlayback();
  }, []);

  const stopAllPlayback = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (ttsTimerRef.current) clearInterval(ttsTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (customAudioSrc && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    // Web Speech API / High-Quality Neural TTS Engine with A-B segment loop support
    if (!window.speechSynthesis || !activeTrack?.transcript) return;
    if (isPlaying) {
      stopAllPlayback();
      return;
    }

    window.speechSynthesis.cancel();
    let textToSpeak = activeTrack.transcript;

    // If A-B loop is set in TTS mode, speak the selected segment range
    if (loopA !== null && loopB !== null && loopB > loopA) {
      const startRatio = loopA / duration;
      const endRatio = loopB / duration;
      const startChar = Math.floor(startRatio * textToSpeak.length);
      const endChar = Math.ceil(endRatio * textToSpeak.length);
      textToSpeak = textToSpeak.slice(startChar, endChar);
    }

    const utter = new SpeechSynthesisUtterance(textToSpeak);
    utter.lang = 'en-GB';
    utter.rate = playbackRate;

    const estimatedSecs = Math.max(20, Math.round(textToSpeak.split(/\s+/).length / (2.3 * playbackRate)));
    setDuration(estimatedSecs);

    utter.onend = () => {
      if (loopA !== null && loopB !== null && loopB > loopA) {
        // Repeat A-B loop automatically
        setCurrentTime(loopA);
        window.speechSynthesis.speak(utter);
      } else {
        setIsPlaying(false);
        if (ttsTimerRef.current) clearInterval(ttsTimerRef.current);
      }
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utter);

    if (ttsTimerRef.current) clearInterval(ttsTimerRef.current);
    ttsTimerRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 1;
        if (loopA !== null && loopB !== null && next >= loopB) {
          return loopA;
        }
        const ratio = Math.min(0.99, next / estimatedSecs);
        setActiveSentenceIdx(Math.floor(ratio * sentences.length));
        return next >= estimatedSecs ? 0 : next;
      });
    }, 1000);
  };

  const handleSeek = (deltaSecs) => {
    if (customAudioSrc && audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 60, audioRef.current.currentTime + deltaSecs));
      setCurrentTime(Math.round(audioRef.current.currentTime));
      return;
    }
    setCurrentTime(prev => Math.max(0, Math.min(duration, prev + deltaSecs)));
  };

  const handleRateChange = (newRate) => {
    setPlaybackRate(newRate);
    if (customAudioSrc && audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopAllPlayback();
    const url = URL.createObjectURL(file);
    setCustomAudioSrc(url);
  };

  // Build Dictation tokens for Dictation Mode
  const dictationTokens = useMemo(() => {
    if (!activeTrack?.transcript) return [];
    const targetList = (activeTrack.dictationWords || [
      'neuroaesthetics', 'cortisol', 'monolithic', 'cognitive', 'biophilic',
      'restorative', 'subliminal', 'chemosynthesis', 'geothermal', 'hydrostatic'
    ]).map(w => w.toLowerCase());

    const rawWords = activeTrack.transcript.split(/(\s+)/);
    let blankCounter = 0;
    return rawWords.map((token, idx) => {
      const stripped = token.replace(/[^a-zA-Z]/g, '');
      const lower = stripped.toLowerCase();
      if (stripped.length >= 6 && targetList.includes(lower)) {
        blankCounter++;
        const prefix = token.slice(0, token.indexOf(stripped));
        const suffix = token.slice(token.indexOf(stripped) + stripped.length);
        return {
          idx,
          isBlank: true,
          blankId: `dict-${blankCounter}`,
          number: blankCounter,
          answer: stripped,
          prefix,
          suffix
        };
      }
      return { idx, isBlank: false, text: token };
    });
  }, [activeTrack]);

  if (!activeTrack) {
    return <div className="p-8 text-center text-slate-400">No listening tracks found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-slate-900 to-violet-900/50 border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
            <Headphones className="w-3.5 h-3.5" />
            MODULE 4 • SPECIALIZED C1/C2 LISTENING LAB (LUYỆN NGHE CHUYÊN SÂU)
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Phòng Lab Luyện Nghe Học Thuật & Nghe Chép Chính Tả (Dictation)
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Hỗ trợ điều chỉnh tốc độ (0.75x–1.5x), tua 5 giây, lặp đoạn khó A–B Loop, kiểm tra giới hạn từ (Word-Count Validator) và chế độ Nghe chép chính tả C1/C2.
          </p>
        </div>

        {/* Track Selector */}
        <div className="min-w-[280px]">
          <label className="text-xs font-semibold text-indigo-300 block mb-1">Chọn Bài Nghe Chuyên Anh:</label>
          <select
            value={selectedTrackIdx}
            onChange={e => setSelectedTrackIdx(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-indigo-500/40 text-xs md:text-sm font-semibold text-white focus:outline-none focus:border-indigo-400"
          >
            {listeningTracks.map((t, i) => (
              <option key={t.id || i} value={i}>
                [{t.tournament} {t.year}] {t.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom Audio Player Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {customAudioSrc && (
          <audio
            ref={audioRef}
            src={customAudioSrc}
            onTimeUpdate={() => {
              if (!audioRef.current) return;
              const t = audioRef.current.currentTime;
              setCurrentTime(Math.round(t));
              if (loopA !== null && loopB !== null && t >= loopB) {
                audioRef.current.currentTime = loopA;
              }
            }}
            onLoadedMetadata={() => {
              if (audioRef.current?.duration) setDuration(Math.round(audioRef.current.duration));
            }}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Play / Rewind 5s / Forward 5s */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSeek(-5)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-xs font-mono font-bold"
              title="Rewind 5 seconds"
            >
              <RotateCcw className="w-4 h-4" /> -5s
            </button>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Tạm dừng (Pause)' : customAudioSrc ? 'Phát File Audio' : 'Phát Audio (Neural TTS)'}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(5)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-xs font-mono font-bold"
              title="Forward 5 seconds"
            >
              +5s <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Control (0.75x - 1.5x) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Speed:</span>
            {[0.75, 0.9, 1.0, 1.25, 1.5].map(rate => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  playbackRate === rate
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* A-B Segment Loop Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Repeat className="w-4 h-4 text-amber-500 mr-0.5" />
            <button
              type="button"
              onClick={() => setLoopA(currentTime)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                loopA !== null
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {loopA !== null ? `A: ${loopA}s` : 'Set A'}
            </button>
            <button
              type="button"
              onClick={() => setLoopB(Math.max((loopA || 0) + 4, currentTime))}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
                loopB !== null
                  ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {loopB !== null ? `B: ${loopB}s` : 'Set B'}
            </button>
            {(loopA !== null || loopB !== null) && (
              <button
                type="button"
                onClick={() => { setLoopA(null); setLoopB(null); }}
                className="px-2 py-1 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 font-semibold"
              >
                Clear A-B
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            {loopA !== null && loopB !== null && (
              <div
                style={{
                  left: `${(loopA / duration) * 100}%`,
                  width: `${Math.max(2, ((loopB - loopA) / duration) * 100)}%`
                }}
                className="absolute top-0 bottom-0 bg-amber-500/40"
              />
            )}
            <div
              style={{ width: `${Math.min(100, (currentTime / duration) * 100)}%` }}
              className="h-full bg-indigo-500 transition-all"
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>{currentTime}s</span>
            <span>{loopA !== null && loopB !== null ? `Looping segment [${loopA}s – ${loopB}s]` : 'Academic Audio Stream Ready'}</span>
            <span>{duration}s</span>
          </div>
        </div>

        {/* Custom Audio File Upload or External Audio URL */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition">
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              Tải file Audio (.mp3/.wav)
              <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            </label>
            {customAudioSrc && (
              <button
                type="button"
                onClick={() => { stopAllPlayback(); setCustomAudioSrc(''); }}
                className="text-rose-500 hover:underline font-medium"
              >
                Dùng lại Neural TTS mặc định
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={externalUrlInput}
              onChange={e => setExternalUrlInput(e.target.value)}
              placeholder="Hoặc dán URL file audio .mp3 ngoài..."
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => { if (externalUrlInput.trim()) setCustomAudioSrc(externalUrlInput.trim()); }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold"
            >
              Nạp URL
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'questions', label: '1. Làm Bài Nghe (Note Completion & MCQ)' },
          { id: 'dictation', label: '2. Nghe Chép Chính Tả C1/C2 (Dictation Mode)' },
          { id: 'transcript', label: '3. Interactive Transcript & Phân tích Dẫn chứng' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setLabTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition ${
              labTab === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: QUESTIONS WITH STRICT WORD-COUNT VALIDATOR */}
      {labTab === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {activeTrack.instructions}
            </p>
            <button
              type="button"
              onClick={() => setCheckedQuestions(!checkedQuestions)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {checkedQuestions ? 'Ẩn Đáp án' : 'Kiểm tra Đáp án & Chữa bài'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(activeTrack.questions || []).map(q => {
              const val = answers[q.id] || '';
              const wc = val.trim() ? val.trim().split(/\s+/).filter(Boolean).length : 0;
              const overMax = q.maxWords && wc > q.maxWords;
              const ok = isQuestionCorrect(q, val);

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                      Question {q.number} • {q.type === 'note_completion' ? `NO MORE THAN ${q.maxWords || 3} WORDS` : 'Multiple Choice'}
                    </span>
                    {q.maxWords && (
                      <span className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full ${
                        overMax
                          ? 'bg-rose-500/20 text-rose-500 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        Số từ đã gõ: {wc}/{q.maxWords} words
                      </span>
                    )}
                  </div>

                  <p className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-100">{q.stem}</p>

                  {q.type === 'note_completion' ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={val}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={`Nhập tối đa ${q.maxWords || 3} từ...`}
                        className={`w-full md:w-96 px-3.5 py-2 rounded-xl border text-sm font-medium focus:outline-none ${
                          overMax
                            ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500'
                        }`}
                      />
                      {overMax && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Cảnh báo: Bạn đã gõ {wc} từ, vượt quá quy định NO MORE THAN {q.maxWords} WORDS!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {(q.options || []).map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                          className={`text-left px-3.5 py-2.5 rounded-xl border text-xs md:text-sm flex items-start gap-2.5 transition ${
                            answers[q.id] === opt.id
                              ? 'border-indigo-500 bg-indigo-500/15 font-semibold text-indigo-900 dark:text-indigo-100'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
                          }`}
                        >
                          <span className="font-mono font-bold text-indigo-500">{opt.id}.</span>
                          <span>{opt.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {checkedQuestions && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs md:text-sm">
                      <div className="flex items-center gap-2 font-bold">
                        {ok ? (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Chính xác! Đáp án: {q.answer}
                          </span>
                        ) : (
                          <span className="text-rose-500 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Chưa chính xác • Đáp án chuẩn: <strong className="text-emerald-500 ml-1">{q.answer}</strong>
                          </span>
                        )}
                      </div>
                      {q.evidenceQuote && (
                        <p className="text-xs italic text-amber-600 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                          <strong>Dẫn chứng trong Audio:</strong> "{q.evidenceQuote}"
                        </p>
                      )}
                      {q.explanation?.vi && (
                        <p className="text-slate-600 dark:text-slate-300">{q.explanation.vi}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DICTATION MODE (NGHE CHÉP CHÍNH TẢ C1/C2) */}
      {labTab === 'dictation' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Chế độ Nghe Chép Chính Tả Học Thuật (C1/C2 Academic Dictation)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các thuật ngữ C1/C2 trọng tâm trong bài nghe đã được ẩn đi. Hãy bấm Phát Audio phía trên và điền từ chính xác vào các ô trống.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDictationChecked(!dictationChecked)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                {dictationChecked ? 'Làm lại / Ẩn đáp án' : 'Chấm điểm Chính tả'}
              </button>
            </div>
          </div>

          <div className="passage-prose text-base leading-loose text-slate-800 dark:text-slate-200">
            {dictationTokens.map(tok => {
              if (!tok.isBlank) {
                return <span key={tok.idx}>{tok.text}</span>;
              }
              const userWord = dictationInputs[tok.blankId] || '';
              const isMatch = userWord.trim().toLowerCase() === tok.answer.toLowerCase();
              return (
                <span key={tok.idx} className="inline-flex items-center mx-1 align-baseline">
                  {tok.prefix}
                  <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-500 rounded-l border border-r-0 border-indigo-500/40">
                    {tok.number}
                  </span>
                  <input
                    type="text"
                    value={userWord}
                    onChange={e => setDictationInputs(prev => ({ ...prev, [tok.blankId]: e.target.value }))}
                    placeholder={`${tok.answer[0]}... (${tok.answer.length})`}
                    className={`w-36 px-2 py-0.5 text-sm font-sans font-semibold rounded-r border focus:outline-none ${
                      dictationChecked
                        ? isMatch
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                          : 'border-rose-500 bg-rose-500/20 text-rose-600 dark:text-rose-300'
                        : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-indigo-500'
                    }`}
                  />
                  {dictationChecked && !isMatch && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-mono bg-emerald-500/20 text-emerald-500 rounded">
                      {tok.answer}
                    </span>
                  )}
                  {tok.suffix}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE TRANSCRIPT SYNCED WITH SENTENCES */}
      {labTab === 'transcript' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
            Interactive Synced Transcript (Click bất kỳ câu nào để phát câu đó):
          </div>
          <div className="space-y-2.5">
            {sentences.map((sent, sIdx) => {
              const isCurrent = isPlaying && activeSentenceIdx === sIdx;
              return (
                <div
                  key={sIdx}
                  onClick={() => {
                    if (window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(sent);
                      u.lang = 'en-GB';
                      u.rate = playbackRate;
                      setActiveSentenceIdx(sIdx);
                      setIsPlaying(true);
                      u.onend = () => setIsPlaying(false);
                      window.speechSynthesis.speak(u);
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition passage-prose text-sm md:text-base ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-500/15 text-slate-900 dark:text-white font-semibold'
                      : 'border-slate-200/70 dark:border-slate-800/80 hover:border-indigo-500/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="font-mono text-xs text-indigo-500 mr-2">[{sIdx + 1}]</span>
                  {sent}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
