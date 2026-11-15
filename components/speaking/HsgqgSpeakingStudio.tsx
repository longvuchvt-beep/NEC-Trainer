'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  BookmarkPlus,
  Check,
  Clock,
  FileText,
  Award,
  Volume2,
  Wand2,
  MessageSquareQuote
} from 'lucide-react';

interface SpeakingPrompt {
  id: string;
  code: string;
  title: string;
  question: string;
  analyticalAngles: string[];
  sampleTranscript: string;
}

const NEC_SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 'nec-speak-01',
    code: 'HSGQG 2025 • Question 01',
    title: 'Algorithmic Epistemology & Cognitive Offloading',
    question:
      'Some scholars argue that the ubiquitous integration of generative AI and algorithmic search engines liberates human intellect for higher-order synthesis. Others contend that habitual cognitive offloading erodes deep analytical inquiry and epistemic autonomy. Discuss both views and give your opinion. You have 5 minutes to sketch out what you are going to say and 5 minutes to present your talk.',
    analyticalAngles: [
      'Macro-perspective: Institutional productivity vs. homogenization of thought',
      'Cognitive mechanism: Hippocampal schema consolidation vs. the "illusion of explanatory depth"',
      'Pedagogical resolution: Designing assessment around epistemic vigilance rather than rote retrieval'
    ],
    sampleTranscript:
      'To approach this issue from both a cognitive and a macroeconomic standpoint, we must examine what happens when human beings delegate retrieval and synthesis to algorithmic intermediaries. At the crux of this debate lies a fundamental tension between short-term operational efficiency and long-term intellectual autonomy. While proponents ostensibly contend that generative tools liberate working memory for creative problem-solving, empirical reality suggests a more ambivalent picture. When students habitually offload analytical friction onto automated systems, hippocampal consolidation weakens, creating an epistemic illusion of competence. Be that as it may, an outright ban on algorithmic tools would be a false dichotomy. Ultimately, reconciling technological utility with deep scholarship necessitates a pedagogical paradigm shift that rewards critical interrogation over passive consumption.'
  },
  {
    id: 'nec-speak-02',
    code: 'HSGQG 2025 • Question 02',
    title: 'The Tyranny of Merit & Educational Stratification',
    question:
      'Standardized high-stakes testing is often celebrated as the ultimate guarantor of social mobility and objective meritocracy. Yet sociologists increasingly warn that credentialism merely legitimizes existing socioeconomic disparities. To what extent do you agree with this assessment?',
    analyticalAngles: [
      'Historical function of meritocracy vs. shadow education (cramming industry) inequalities',
      'Psychological externalities: "Meritocratic hubris" among winners and demoralization among the marginalized',
      'Policy reform: Holistic pluralistic evaluation alongside rigorous academic benchmarks'
    ],
    sampleTranscript:
      'At the crux of this debate lies the paradox of modern meritocracy. To approach this issue from a sociological standpoint, standardized assessments were originally conceived to dismantle hereditary privilege. Nevertheless, in an era of hyper-competitive credentialism, access to elite test preparation has become inextricably tethered to household wealth. Consequently, what appears ostensibly neutral on paper often risks entrenching existing class divides. Turning to the flip side of the coin, abandoning objective academic standards altogether would undermine institutional accountability. Ultimately, reconciling fairness with excellence requires broadening our definition of merit while equalizing foundational educational resources.'
  },
  {
    id: 'nec-speak-03',
    code: 'DHBB 2025 • Question 03',
    title: 'Green Growth vs. Post-Industrial Degrowth',
    question:
      'Can technological innovation and carbon market mechanisms decouple economic growth from ecological degradation, or does planetary survival demand a fundamental contraction of consumer capitalism?',
    analyticalAngles: [
      'Jevons paradox: Why efficiency gains often trigger higher aggregate resource consumption',
      'Distributional justice: Global North decarbonization obligations vs. Global South developmental rights',
      'Synthesis: Circular industrial policy paired with strict ecological ceilings'
    ],
    sampleTranscript:
      'To approach this issue from an environmental and macroeconomic standpoint, we must confront the limits of techno-optimism. For decades, policymakers have subscribed to the paradigm of green decoupling—the belief that market incentives alone can mitigate ecological degradation without curbing consumption. However, empirical scrutiny reveals that efficiency gains frequently trigger the Jevons paradox, whereby cheaper clean energy fuels higher aggregate resource extraction. Be that as it may, imposing abrupt economic contraction on developing nations would exacerbate global poverty. Ultimately, reconciling planetary boundaries with human dignity necessitates binding ecological ceilings alongside equitable technology transfer.'
  },
  {
    id: 'nec-speak-04',
    code: 'Olympic 30/4 • Question 04',
    title: 'Digital Cosmopolitanism vs. Echo-Chamber Polarization',
    question:
      'While the early architects of the internet envisioned a borderless "global village" fostering cross-cultural empathy, contemporary digital platforms appear to fracture society into hyper-partisan epistemic bubbles. Why has this shift occurred, and how can civic discourse be revitalized?',
    analyticalAngles: [
      'Attention-economy business models: Outrage maximization and algorithmic curation',
      'Epistemic bubbles vs. active echo chambers that discredit external evidence',
      'Civic remedies: Algorithmic transparency and deliberative media literacy'
    ],
    sampleTranscript:
      'When we examine the trajectory of digital communication, a stark dichotomy emerges between its cosmopolitan promise and its polarizing reality. To approach this issue from an institutional standpoint, the culprit is not connectivity per se, but the commodification of human attention. Because engagement algorithms prioritize visceral outrage over nuanced deliberation, citizens are increasingly relegated to self-reinforcing epistemic bubbles. Nevertheless, fatalism is unwarranted. Reclaiming the public sphere necessitates regulatory scrutiny of algorithmic amplification alongside cultivating intellectual humility in our classrooms.'
  }
];

const SIGNPOSTING_BANK = [
  {
    category: '1. Mở đầu & Định khung (Framing & Thesis)',
    phrases: [
      'To approach this issue from a macroeconomic and pedagogical standpoint...',
      'At the crux of this debate lies a fundamental tension between...',
      'Before unpacking the systemic ramifications, it is imperative to define...'
    ]
  },
  {
    category: '2. Nhượng bộ & Phản biện (Concession & Rebuttal)',
    phrases: [
      'While proponents ostensibly contend that..., empirical scrutiny reveals otherwise.',
      'Be that as it may, one cannot overlook the unintended externalities of...',
      'Granted, there is a kernel of truth to the claim that...; nonetheless...'
    ]
  },
  {
    category: '3. Chuyển ý & Tổng hợp (Transition & Synthesis)',
    phrases: [
      'Turning to the flip side of the coin, we must consider...',
      'Framing this as an either-or choice perpetuates a false dichotomy.',
      'Ultimately, reconciling these competing imperatives necessitates a paradigm shift.'
    ]
  }
];

interface HsgqgSpeakingStudioProps {
  onSaveVocab?: (item: any) => void;
}

export default function HsgqgSpeakingStudio({ onSaveVocab }: HsgqgSpeakingStudioProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(NEC_SPEAKING_PROMPTS[0].id);
  const activePrompt =
    NEC_SPEAKING_PROMPTS.find((p) => p.id === selectedPromptId) || NEC_SPEAKING_PROMPTS[0];

  // Active Phase: 'prep' | 'record' | 'feedback'
  const [activePhase, setActivePhase] = useState<'prep' | 'record' | 'feedback'>('prep');

  // Phase 1: 5-Minute Preparation Timer (300s) + Scratchpad Outline
  const [prepSeconds, setPrepSeconds] = useState<number>(300);
  const [prepRunning, setPrepRunning] = useState<boolean>(false);
  const [outlineNotes, setOutlineNotes] = useState<string>(
    '• Thesis / Core Tension: Short-term algorithmic efficiency vs. long-term epistemic autonomy\n• Argument 1 (Macro): Democratization of knowledge & institutional speed\n• Argument 2 (Counter/Rebuttal): Habitual cognitive offloading weakens hippocampal schema consolidation\n• Coda / Synthesis: Reject false dichotomy -> cultivate epistemic vigilance'
  );

  // Phase 2: 5-Minute Monologue Recorder (300s) + MediaRecorder + Web Speech API
  const [speakSeconds, setSpeakSeconds] = useState<number>(300);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [transcript, setTranscript] = useState<string>(NEC_SPEAKING_PROMPTS[0].sampleTranscript);
  const [recordingStatus, setRecordingStatus] = useState<string>('');

  // Phase 3: AI Examiner Feedback
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [savedCardTerms, setSavedCardTerms] = useState<Record<string, boolean>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecRef = useRef<any>(null);

  // Sync sample transcript when switching prompts if user hasn't recorded custom text
  const handleSelectPrompt = (promptObj: SpeakingPrompt) => {
    setSelectedPromptId(promptObj.id);
    setTranscript(promptObj.sampleTranscript);
    setEvaluation(null);
  };

  // Phase 1 Prep Timer Interval
  useEffect(() => {
    if (!prepRunning) return;
    const t = setInterval(() => {
      setPrepSeconds((prev) => {
        if (prev <= 1) {
          setPrepRunning(false);
          setActivePhase('record');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [prepRunning]);

  // Phase 2 Speaking Timer Interval
  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => {
      setSpeakSeconds((prev) => {
        if (prev <= 1) {
          stopRecordingMonologue();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  const formatMmSs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const insertSignpostingPhrase = (phrase: string) => {
    if (activePhase === 'prep') {
      setOutlineNotes((prev) => `${prev ? prev + '\n' : ''}• [Signpost] ${phrase}`);
    } else {
      setTranscript((prev) => `${prev ? prev.trim() + ' ' : ''}${phrase} `);
    }
  };

  const startRecordingMonologue = async () => {
    setRecordingStatus('Đang ghi âm & nhận diện giọng nói trực tiếp...');
    setIsRecording(true);
    setActivePhase('record');

    // 1. Start Web Speech API (SpeechRecognition) if supported in browser
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (event: any) => {
          let finalChunk = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalChunk += event.results[i][0].transcript + ' ';
            }
          }
          if (finalChunk.trim()) {
            setTranscript((prev) => `${prev.trim()} ${finalChunk.trim()}`);
          }
        };
        rec.onerror = () => {};
        rec.start();
        speechRecRef.current = rec;
      }
    } catch {}

    // 2. Start MediaRecorder if microphone is available
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach((track) => track.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      }
    } catch {
      setRecordingStatus(
        'Đang chạy chế độ Mô phỏng Phòng Thi (Simulated Mic) — bạn có thể chỉnh sửa trực tiếp bản ghi lời nói bên dưới.'
      );
    }
  };

  const stopRecordingMonologue = () => {
    setIsRecording(false);
    setRecordingStatus('Đã hoàn tất ghi âm phần trình bày (Monologue). Sẵn sàng chấm điểm AI!');
    try {
      if (speechRecRef.current) {
        speechRecRef.current.stop();
        speechRecRef.current = null;
      }
    } catch {}
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch {}
  };

  const handleEvaluateSpeech = async () => {
    if (isEvaluating || !transcript.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/speaking/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activePrompt,
          transcript,
          outline: outlineNotes,
          durationSeconds: Math.max(60, 300 - speakSeconds)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
        setActivePhase('feedback');
      }
    } catch {} finally {
      setIsEvaluating(false);
    }
  };

  const speakPolishedScript = (textToSpeak: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(textToSpeak);
      utter.lang = 'en-GB';
      utter.rate = 0.96;
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & NEC Prompt Selector */}
      <div className="p-6 rounded-3xl eyecare-card border shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/15 text-amber-900 dark:text-amber-300 text-xs font-extrabold">
              <Mic className="w-3.5 h-3.5" />
              HSGQG SPEAKING STUDIO • NEC PART 4 MONOLOGUE SIMULATOR
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold font-serif">
              Phòng Thi Nói Học Sinh Giỏi Quốc Gia (5 Phút Chuẩn Bị • 5 Phút Độc Thoại)
            </h2>
            <p className="text-xs md:text-sm opacity-75">
              Mô phỏng chính xác cấu trúc thi Nói độc thoại HSGQG (Bảng A): Lập dàn ý với Signposting C2, Ghi âm &amp; Chuyển giọng nói thành văn bản trực tiếp, và Chấm điểm 4 tiêu chí NEC.
            </p>
          </div>

          {/* 3-Phase Step Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'prep', label: 'Phase 1: 5 Phút Chuẩn Bị (Outline)' },
              { id: 'record', label: 'Phase 2: 5 Phút Độc Thoại (Recorder)' },
              { id: 'feedback', label: 'Phase 3: Giám Khảo AI Chấm Điểm' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setActivePhase(st.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  activePhase === st.id
                    ? 'bg-amber-900 text-amber-50 shadow-sm'
                    : 'eyecare-elevated border opacity-85 hover:opacity-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Selector Pills */}
        <div className="pt-3 border-t border-amber-900/10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold opacity-75">Chọn đề Nói chính thức:</span>
            {NEC_SPEAKING_PROMPTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPrompt(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedPromptId === p.id
                    ? 'bg-amber-900 text-amber-50 shadow-sm'
                    : 'eyecare-elevated border hover:opacity-100 opacity-80'
                }`}
              >
                {p.code}: {p.title}
              </button>
            ))}
          </div>

          {/* Active Prompt Box */}
          <div className="p-5 rounded-2xl eyecare-elevated border space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-900 text-amber-50 text-xs font-extrabold cloze-mono-input">
                {activePrompt.code}
              </span>
              <span className="text-xs font-bold opacity-75">
                Thang điểm NEC Speaking: 2.0 / 20.0 điểm toàn bài
              </span>
            </div>
            <p className="passage-prose text-sm md:text-base font-semibold leading-relaxed">
              &ldquo;{activePrompt.question}&rdquo;
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {activePrompt.analyticalAngles.map((ang) => (
                <span
                  key={ang}
                  className="px-2.5 py-1 rounded-lg eyecare-card border text-[11px] font-semibold"
                >
                  💡 {ang}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PHASE 1 & PHASE 2 WORKSPACE ==================== */}
      {(activePhase === 'prep' || activePhase === 'record') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 Cols: Phase 1 — 5-Minute Prep Timer, Bullet-Point Scratchpad & C2 Signposting Bank */}
          <div className="lg:col-span-6 p-6 rounded-3xl eyecare-card border shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-amber-900/10 pb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  PHASE 1 • 5-MINUTE PREPARATION
                </span>
                <h3 className="text-base font-extrabold">
                  Giấy Nháp Dàn Ý &amp; Cụm Từ Chuyển Ý C1/C2 (Signposting)
                </h3>
              </div>

              {/* 5-Minute Prep Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl eyecare-elevated border">
                <Clock className="w-4 h-4 text-amber-800 dark:text-amber-300" />
                <span className="text-sm font-black cloze-mono-input">
                  {formatMmSs(prepSeconds)}
                </span>
                <button
                  type="button"
                  onClick={() => setPrepRunning((r) => !r)}
                  className="px-2 py-1 rounded-lg bg-amber-900 text-amber-50 text-[11px] font-bold cursor-pointer"
                >
                  {prepRunning ? 'Tạm dừng' : 'Bắt đầu 5p'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrepRunning(false);
                    setPrepSeconds(300);
                  }}
                  title="Đặt lại 05:00"
                  className="p-1 rounded-lg hover:bg-amber-900/10 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bullet-Point Outlining Scratchpad */}
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-80 flex items-center justify-between">
                <span>Dàn ý tốc ký (Bullet-Point Scratchpad — giữ nguyên khi bước sang Ghi âm):</span>
                <span className="cloze-mono-input text-[11px]">
                  {outlineNotes.split('\n').filter(Boolean).length} ý chính
                </span>
              </label>
              <textarea
                rows={5}
                value={outlineNotes}
                onChange={(e) => setOutlineNotes(e.target.value)}
                placeholder="Ghi nhanh các luận điểm, dẫn chứng vĩ mô/vi mô và cấu trúc phản biện..."
                className="w-full p-4 rounded-2xl border eyecare-elevated text-xs md:text-sm font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            {/* C1/C2 Signposting Expressions Bank */}
            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Ngân hàng Signposting Expressions C1/C2 (Bấm để chèn vào dàn ý / bài nói):
              </div>

              <div className="space-y-3">
                {SIGNPOSTING_BANK.map((group) => (
                  <div key={group.category} className="p-3.5 rounded-2xl eyecare-elevated border space-y-2">
                    <div className="text-xs font-bold">{group.category}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.phrases.map((phrase) => (
                        <button
                          key={phrase}
                          type="button"
                          onClick={() => insertSignpostingPhrase(phrase)}
                          className="text-left px-2.5 py-1.5 rounded-xl eyecare-card border hover:border-amber-800 text-xs font-medium transition cursor-pointer"
                        >
                          + &ldquo;{phrase}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 6 Cols: Phase 2 — 5-Minute Monologue Recorder & Live Speech-to-Text Transcript */}
          <div className="lg:col-span-6 p-6 rounded-3xl eyecare-card border shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-amber-900/10 pb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  PHASE 2 • 5-MINUTE MONOLOGUE RECORDER
                </span>
                <h3 className="text-base font-extrabold">
                  Thu Âm Bài Nói &amp; Chuyển Thành Văn Bản Trực Tiếp
                </h3>
              </div>

              {/* 5-Minute Speaking Timer */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl eyecare-elevated border">
                <Clock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-sm font-black cloze-mono-input">
                  {formatMmSs(speakSeconds)}
                </span>
              </div>
            </div>

            {/* Recorder Controls */}
            <div className="p-4 rounded-2xl eyecare-elevated border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecordingMonologue}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    Bắt đầu Ghi âm (Start 5-Min Monologue)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecordingMonologue}
                    className="px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-extrabold flex items-center gap-2 shadow-sm animate-pulse cursor-pointer"
                  >
                    <MicOff className="w-4 h-4" />
                    Dừng Ghi âm (Stop Recording)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTranscript(activePrompt.sampleTranscript)}
                  className="px-3 py-2.5 rounded-xl eyecare-card border hover:border-amber-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-amber-800" />
                  Nạp bài nói mẫu C2
                </button>
              </div>

              {recordedAudioUrl && (
                <audio controls src={recordedAudioUrl} className="h-9 max-w-[220px]" />
              )}
            </div>

            {recordingStatus && (
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                🎙️ {recordingStatus}
              </div>
            )}

            {/* Live Transcription / Editable Monologue Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Bản ghi lời nói (Live Speech-to-Text Transcript — có thể chỉnh sửa):</span>
                <span className="cloze-mono-input text-amber-800 dark:text-amber-300">
                  {transcript.trim() ? transcript.trim().split(/\s+/).length : 0} từ
                </span>
              </div>
              <textarea
                rows={8}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Nội dung bài nói của bạn sẽ tự động hiển thị tại đây khi nói vào micro, hoặc bạn có thể nhập/chỉnh sửa trực tiếp..."
                className="w-full p-4 rounded-2xl border eyecare-elevated passage-prose text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>

            {/* Submit to Phase 3 AI Examiner */}
            <button
              type="button"
              disabled={isEvaluating || !transcript.trim()}
              onClick={handleEvaluateSpeech}
              className="w-full py-3.5 px-5 rounded-2xl bg-amber-900 hover:bg-amber-800 disabled:opacity-50 text-amber-50 text-xs md:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isEvaluating
                ? 'Giám khảo AI đang phân tích bài nói...'
                : 'Chấm điểm Bài nói & Nhận Bản Nâng Cấp C2 (Phase 3 AI Examiner)'}
            </button>
          </div>
        </div>
      )}

      {/* ==================== PHASE 3: AI EXAMINER FEEDBACK & C2 POLISHED SCRIPT ==================== */}
      {activePhase === 'feedback' && (
        <div className="space-y-6">
          {!evaluation ? (
            <div className="p-8 rounded-3xl eyecare-card border text-center space-y-4">
              <p className="text-sm font-bold opacity-80">
                Nhấn nút bên dưới để Giám khảo AI chấm điểm bài độc thoại hiện tại của bạn:
              </p>
              <button
                type="button"
                onClick={handleEvaluateSpeech}
                className="px-6 py-3 rounded-2xl bg-amber-900 text-amber-50 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Chấm điểm Bài nói ngay
              </button>
            </div>
          ) : (
            <>
              {/* Score Banner */}
              <div className="p-6 rounded-3xl eyecare-card border-2 border-emerald-600/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                    <Award className="w-4 h-4" />
                    KẾT QUẢ CHẤM THI NÓI HSGQG • {evaluation.cefrBand}
                  </div>
                  <h3 className="text-2xl font-black mt-1">
                    Điểm Quy Đổi: {evaluation.overallScore20} / 20.0 ({evaluation.necScore2} / 2.0 pts NEC)
                  </h3>
                  <p className="text-xs opacity-80">
                    Độ dài: <strong>{evaluation.metrics?.wordCount} từ</strong> • Tốc độ ước tính:{' '}
                    <strong>{evaluation.metrics?.estimatedWpm} WPM</strong> • Signposting C1/C2 phát hiện:{' '}
                    <strong>{evaluation.metrics?.detectedMarkers?.join(', ')}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePhase('record')}
                  className="px-4 py-2.5 rounded-xl eyecare-elevated border text-xs font-extrabold hover:border-amber-800 cursor-pointer shrink-0"
                >
                  ← Quay lại Chỉnh sửa / Ghi âm lại
                </button>
              </div>

              {/* 4 Criteria Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: '1. Argument Depth (Chiều sâu lập luận & Phản biện)',
                    data: evaluation.criteria?.argumentDepth
                  },
                  {
                    title: '2. Discourse Markers (Signposting & Liên kết diễn ngôn)',
                    data: evaluation.criteria?.discourseMarkers
                  },
                  {
                    title: '3. Lexical Sophistication (Từ vựng C1/C2 & Collocations)',
                    data: evaluation.criteria?.lexicalSophistication
                  },
                  {
                    title: '4. Fluency & Academic Register (Độ trôi chảy & Văn phong)',
                    data: evaluation.criteria?.fluencyAndRegister
                  }
                ].map((c) => (
                  <div key={c.title} className="p-5 rounded-2xl eyecare-card border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs md:text-sm font-extrabold">{c.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-900 text-amber-50 text-xs font-black cloze-mono-input">
                        {c.data?.score} / {c.data?.maxScore}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm opacity-85 leading-relaxed">
                      {c.data?.feedbackVi}
                    </p>
                  </div>
                ))}
              </div>

              {/* Spoken Phrase Surgery (B2/C1 -> C2 Oratorical Upgrades) */}
              <div className="p-6 rounded-3xl eyecare-card border space-y-4">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <MessageSquareQuote className="w-5 h-5 text-amber-800" />
                  Nâng Cấp Diễn Ngôn Nói (Spoken Phrase Upgrades: B2/C1 → C2 National Prize)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {(evaluation.phraseUpgrades || []).map((up: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl eyecare-elevated border space-y-1.5">
                      <div className="text-xs line-through opacity-65">
                        ❌ Cách nói thông thường: &ldquo;{up.original}&rdquo;
                      </div>
                      <div className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 font-serif">
                        ✅ Nâng cấp C2 Hùng biện: &ldquo;{up.c2Upgrade}&rdquo;
                      </div>
                      <div className="text-xs opacity-80">💡 {up.reasonVi}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full C2 Polished Monologue Script + 1-Click Save Flashcards */}
              <div className="p-6 rounded-3xl eyecare-card border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/10 pb-3">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      MODEL C2 NATIONAL PRIZE SCRIPT
                    </span>
                    <h3 className="text-base font-extrabold">
                      Bản Diễn Từ C2 Hoàn Chỉnh Dành Cho Đề Này
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakPolishedScript(evaluation.polishedC2Script)}
                    className="px-3.5 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    Nghe phát âm mẫu Anh-Anh (TTS)
                  </button>
                </div>

                <div className="p-5 rounded-2xl eyecare-elevated border passage-prose text-sm md:text-base whitespace-pre-line leading-relaxed">
                  {evaluation.polishedC2Script}
                </div>

                {/* Recommended C2 Speaking Chunks to Save to Flashcards */}
                <div className="pt-2 space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider opacity-75">
                    Cụm từ Hùng biện C2 trích từ bài nói (Lưu 1-Click vào Sổ từ vựng):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(evaluation.recommendedFlashcards || []).map((fc: any) => {
                      const isSaved = Boolean(savedCardTerms[fc.term]);
                      return (
                        <div
                          key={fc.term}
                          className="p-3.5 rounded-2xl eyecare-elevated border flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="text-xs font-extrabold font-serif text-amber-900 dark:text-amber-300">
                              {fc.term}
                            </div>
                            <div className="text-xs opacity-80 mt-0.5">{fc.meaningVi}</div>
                          </div>
                          {onSaveVocab && (
                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() => {
                                setSavedCardTerms((prev) => ({ ...prev, [fc.term]: true }));
                                onSaveVocab({
                                  term: fc.term,
                                  category: fc.category,
                                  definition_en: fc.definitionEn,
                                  definition_vi: fc.meaningVi,
                                  example_sentence: fc.example,
                                  source_exam: `HSGQG Speaking Studio (${activePrompt.code})`
                                });
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-900 text-amber-50 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              {isSaved ? (
                                <>
                                  <Check className="w-3.5 h-3.5" /> Đã lưu
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus className="w-3.5 h-3.5" /> + Add to Flashcards
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
