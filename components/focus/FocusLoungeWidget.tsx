'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Palette,
  Type,
  Flame,
  Zap,
  CloudRain,
  Music,
  Wind,
  Timer
} from 'lucide-react';

export type EyeCareTheme = 'warm-paper' | 'forest-matcha' | 'midnight-slate' | 'oxford-sepia';
export type FontScaleLevel = 'A' | 'A+' | 'A++';
export type AmbientSoundMode = 'OFF' | 'RAIN' | 'LOFI' | 'WHITENOISE';

export const EYE_CARE_THEMES: Array<{
  id: EyeCareTheme;
  label: string;
  swatchBg: string;
  swatchText: string;
  accentDot: string;
  desc: string;
}> = [
  {
    id: 'warm-paper',
    label: 'Warm Paper',
    swatchBg: '#FAF7F2',
    swatchText: '#1E293B',
    accentDot: '#B45309',
    desc: 'Giấy kem Cambridge dịu mắt (Mặc định)'
  },
  {
    id: 'forest-matcha',
    label: 'Forest Matcha',
    swatchBg: '#EBF3F0',
    swatchText: '#133A36',
    accentDot: '#0F766E',
    desc: 'Xanh trà Matcha tập trung ban ngày'
  },
  {
    id: 'midnight-slate',
    label: 'Midnight Slate',
    swatchBg: '#0F172A',
    swatchText: '#F1F5F9',
    accentDot: '#6366F1',
    desc: 'Đêm xanh đen chống mỏi mắt'
  },
  {
    id: 'oxford-sepia',
    label: 'Oxford Sepia',
    swatchBg: '#F4ECD8',
    swatchText: '#2D241E',
    accentDot: '#92400E',
    desc: 'Thư viện cổ điển ấm áp'
  }
];

interface FocusLoungeWidgetProps {
  theme: EyeCareTheme;
  onThemeChange: (nextTheme: EyeCareTheme) => void;
  fontScale: FontScaleLevel;
  onFontScaleChange: (nextScale: FontScaleLevel) => void;
  comboStreak?: number;
  lexicalXp?: number;
  compact?: boolean;
}

export default function FocusLoungeWidget({
  theme,
  onThemeChange,
  fontScale,
  onFontScaleChange,
  comboStreak = 0,
  lexicalXp = 0,
  compact = false
}: FocusLoungeWidgetProps) {
  // Pomodoro state (25m or 50m Focus)
  const [pomoModeMinutes, setPomoModeMinutes] = useState<25 | 50>(25);
  const [pomoSecondsLeft, setPomoSecondsLeft] = useState<number>(25 * 60);
  const [pomoRunning, setPomoRunning] = useState<boolean>(false);

  // Ambient Sound Generator state (Oxford Library Rain, Lo-fi Study Beats, White Noise)
  const [ambientMode, setAmbientMode] = useState<AmbientSoundMode>('OFF');
  const [volume, setVolume] = useState<number>(0.35);
  const [showLoungeDropdown, setShowLoungeDropdown] = useState<boolean>(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Pomodoro countdown effect
  useEffect(() => {
    if (!pomoRunning) return;
    const interval = setInterval(() => {
      setPomoSecondsLeft((prev) => {
        if (prev <= 1) {
          setPomoRunning(false);
          return pomoModeMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomoRunning, pomoModeMinutes]);

  const switchPomoPreset = (mins: 25 | 50) => {
    setPomoModeMinutes(mins);
    setPomoRunning(false);
    setPomoSecondsLeft(mins * 60);
  };

  const formatPomo = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Stop any active procedural Web Audio graph
  const stopAudioGraph = () => {
    if (cleanupRef.current) {
      try {
        cleanupRef.current();
      } catch {}
      cleanupRef.current = null;
    }
  };

  // Synthesize authentic Ambient Soundscapes via Web Audio API
  const startAmbientSound = (mode: AmbientSoundMode) => {
    stopAudioGraph();
    if (mode === 'OFF') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (mode === 'RAIN' || mode === 'WHITENOISE') {
        // Generate 3-second looping pink/brown filtered noise buffer
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = mode === 'RAIN' ? 'bandpass' : 'lowpass';
        filter.frequency.value = mode === 'RAIN' ? 950 : 620;
        filter.Q.value = mode === 'RAIN' ? 0.7 : 0.4;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start(0);

        cleanupRef.current = () => {
          whiteNoise.stop();
          whiteNoise.disconnect();
          filter.disconnect();
          masterGain.disconnect();
        };
      } else if (mode === 'LOFI') {
        // Warm Lo-fi Rhodes / Pad chord progression with soft vinyl crackle
        const chordFreqs = [
          [261.63, 329.63, 392.0, 493.88], // Cmaj7
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [174.61, 220.0, 261.63, 349.23], // Fmaj7
          [196.0, 246.94, 293.66, 349.23]  // G7
        ];
        let chordIdx = 0;
        let activeOscs: OscillatorNode[] = [];

        const playChord = () => {
          activeOscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
          activeOscs = [];

          const freqs = chordFreqs[chordIdx % chordFreqs.length];
          chordIdx++;

          const chordGain = ctx.createGain();
          chordGain.gain.setValueAtTime(0.01, ctx.currentTime);
          chordGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.8);
          chordGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 3.8);
          chordGain.connect(masterGain);

          freqs.forEach((f) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            osc.connect(chordGain);
            osc.start();
            activeOscs.push(osc);
          });
        };

        playChord();
        const chordTimer = setInterval(playChord, 4000);

        cleanupRef.current = () => {
          clearInterval(chordTimer);
          activeOscs.forEach((o) => {
            try {
              o.stop();
              o.disconnect();
            } catch {}
          });
          masterGain.disconnect();
        };
      }
    } catch {}
  };

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopAudioGraph();
    };
  }, []);

  const handleSelectAmbient = (nextMode: AmbientSoundMode) => {
    const target = ambientMode === nextMode ? 'OFF' : nextMode;
    setAmbientMode(target);
    startAmbientSound(target);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 relative">
      {/* 1. LIVE COMBO STREAK & LEXICAL XP BADGE */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm eyecare-card"
        title="Chuỗi trả lời đúng liên tiếp (Combo Streak) & Điểm kinh nghiệm từ vựng C1/C2 (Lexical XP)"
      >
        <span
          className={`inline-flex items-center gap-1 ${
            comboStreak >= 3 ? 'text-orange-600 dark:text-amber-400 animate-pulse' : 'opacity-80'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20" />
          <span className="cloze-mono-input">
            {comboStreak > 0 ? `${comboStreak}x C2 Streak!` : '0x Streak'}
          </span>
        </span>
        <span className="opacity-30">|</span>
        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/30" />
          <span className="cloze-mono-input">{lexicalXp} XP</span>
        </span>
      </div>

      {/* 2. BUILT-IN FOCUS LOUNGE WIDGET (POMODORO + AMBIENT SOUND) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowLoungeDropdown((v) => !v);
            setShowThemeDropdown(false);
          }}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition shadow-sm ${
            pomoRunning || ambientMode !== 'OFF'
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'eyecare-card hover:opacity-90'
          }`}
          title="Mở Focus Lounge: Đồng hồ Pomodoro (25p/50p) & Âm thanh nền Oxford Library Rain / Lo-fi"
        >
          <Timer className="w-3.5 h-3.5" />
          <span className="cloze-mono-input">{formatPomo(pomoSecondsLeft)}</span>
          {ambientMode !== 'OFF' && (
            <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">
              {ambientMode === 'RAIN' && '🌧️ Rain'}
              {ambientMode === 'LOFI' && '🎵 Lo-fi'}
              {ambientMode === 'WHITENOISE' && '🌊 Focus'}
            </span>
          )}
        </button>

        {showLoungeDropdown && (
          <div className="absolute right-0 mt-2 w-80 rounded-2xl border p-4 shadow-2xl z-50 eyecare-card space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-300/50 dark:border-slate-700">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Focus Lounge &amp; Flow State
                </div>
                <p className="text-[11px] opacity-70">
                  Đồng hồ Pomodoro &amp; Âm thanh thư viện Oxford
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoungeDropdown(false)}
                className="text-xs font-bold opacity-60 hover:opacity-100"
              >
                Đóng ✕
              </button>
            </div>

            {/* Pomodoro Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Chế độ Pomodoro:</span>
                <div className="flex items-center gap-1">
                  {([25, 50] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => switchPomoPreset(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                        pomoModeMinutes === m
                          ? 'bg-amber-800 text-amber-50 border-amber-900'
                          : 'eyecare-elevated'
                      }`}
                    >
                      {m}m Focus
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl eyecare-elevated border flex items-center justify-between">
                <div className="text-2xl font-black cloze-mono-input tracking-tight">
                  {formatPomo(pomoSecondsLeft)}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPomoRunning((r) => !r)}
                    className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-50 text-xs font-bold flex items-center gap-1"
                  >
                    {pomoRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {pomoRunning ? 'Tạm dừng' : 'Bắt đầu'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPomoRunning(false);
                      setPomoSecondsLeft(pomoModeMinutes * 60);
                    }}
                    className="p-1.5 rounded-xl border eyecare-card hover:opacity-80"
                    title="Reset Pomodoro"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Ambient Soundscape Section */}
            <div className="space-y-2 pt-2 border-t border-slate-300/40 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Ambient Sound (Tập trung sâu):</span>
                {ambientMode !== 'OFF' && (
                  <button
                    type="button"
                    onClick={() => handleSelectAmbient('OFF')}
                    className="text-[11px] text-rose-600 font-semibold flex items-center gap-1"
                  >
                    <VolumeX className="w-3 h-3" /> Tắt âm
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectAmbient('RAIN')}
                  className={`p-2 rounded-xl border text-center transition ${
                    ambientMode === 'RAIN'
                      ? 'bg-emerald-800 text-white border-emerald-900 font-bold'
                      : 'eyecare-elevated hover:opacity-90'
                  }`}
                >
                  <CloudRain className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[11px] leading-tight">Oxford Rain</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAmbient('LOFI')}
                  className={`p-2 rounded-xl border text-center transition ${
                    ambientMode === 'LOFI'
                      ? 'bg-emerald-800 text-white border-emerald-900 font-bold'
                      : 'eyecare-elevated hover:opacity-90'
                  }`}
                >
                  <Music className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[11px] leading-tight">Lo-fi Chords</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAmbient('WHITENOISE')}
                  className={`p-2 rounded-xl border text-center transition ${
                    ambientMode === 'WHITENOISE'
                      ? 'bg-emerald-800 text-white border-emerald-900 font-bold'
                      : 'eyecare-elevated hover:opacity-90'
                  }`}
                >
                  <Wind className="w-4 h-4 mx-auto mb-1" />
                  <div className="text-[11px] leading-tight">Warm Noise</div>
                </button>
              </div>

              {ambientMode !== 'OFF' && (
                <div className="flex items-center gap-2 pt-1">
                  <Volume2 className="w-3.5 h-3.5 opacity-70" />
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full accent-amber-800"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. FONT SIZE SCALING (A, A+, A++) */}
      <div
        className="flex items-center rounded-xl border p-0.5 eyecare-card shadow-sm"
        title="Tùy chỉnh cỡ chữ bài đọc & câu hỏi (A / A+ / A++)"
      >
        {(['A', 'A+', 'A++'] as FontScaleLevel[]).map((sc) => (
          <button
            key={sc}
            type="button"
            onClick={() => onFontScaleChange(sc)}
            className={`px-2 py-1 rounded-lg text-xs font-extrabold transition ${
              fontScale === sc
                ? 'bg-amber-900 text-amber-50 shadow-sm'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            {sc}
          </button>
        ))}
      </div>

      {/* 4. 1-CLICK EYE-CARE THEME SWITCHER */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowThemeDropdown((v) => !v);
            setShowLoungeDropdown(false);
          }}
          className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 eyecare-card shadow-sm hover:opacity-90"
          title="Chọn giao diện bảo vệ mắt (Warm Paper / Forest Matcha / Midnight Slate / Oxford Sepia)"
        >
          <Palette className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          {!compact && (
            <span>
              {EYE_CARE_THEMES.find((t) => t.id === theme)?.label || 'Warm Paper'}
            </span>
          )}
        </button>

        {showThemeDropdown && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border p-3 shadow-2xl z-50 eyecare-card space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider px-1">
              Giao diện Bảo vệ mắt (180p)
            </div>
            {EYE_CARE_THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onThemeChange(t.id);
                    setShowThemeDropdown(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition ${
                    active ? 'ring-2 ring-amber-700 border-amber-700' : 'border-transparent hover:opacity-90'
                  }`}
                  style={{ backgroundColor: t.swatchBg, color: t.swatchText }}
                >
                  <div>
                    <div className="text-xs font-extrabold flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: t.accentDot }}
                      />
                      {t.label}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">{t.desc}</div>
                  </div>
                  {active && <span className="text-xs font-black">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
