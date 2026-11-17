"use client";

import React, { useState, useEffect, memo } from "react";
import { Clock } from "lucide-react";

interface ExamTimerProps {
  initialSeconds: number;
  isRunning: boolean;
  resetSignal?: number;
  timeLeftRef: React.MutableRefObject<number>;
  onExpire?: () => void;
}

function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

/**
 * Isolated Self-Contained Countdown Timer.
 * Its 1-second tick updates ONLY this leaf component and a mutable ref,
 * NEVER triggering a re-render of the parent Exam Workspace or the 50 Question Cards.
 */
function ExamTimerInner({
  initialSeconds,
  isRunning,
  resetSignal = 0,
  timeLeftRef,
  onExpire,
}: ExamTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const start = Math.max(0, Math.floor(initialSeconds || 5400));
    timeLeftRef.current = start;
    return start;
  });

  useEffect(() => {
    const resetVal = Math.max(0, Math.floor(initialSeconds || 5400));
    setSecondsLeft(resetVal);
    timeLeftRef.current = resetVal;
  }, [initialSeconds, resetSignal, timeLeftRef]);

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          timeLeftRef.current = 0;
          if (onExpire) onExpire();
          return 0;
        }
        const next = prev - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning, timeLeftRef, onExpire]);

  const isLowTime = secondsLeft < 300;

  return (
    <div
      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 tabular-nums ${
        isLowTime
          ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300"
          : "bg-amber-50 dark:bg-amber-950/50 border-amber-200/70 dark:border-amber-800 text-amber-800 dark:text-amber-300"
      }`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>{formatTimer(secondsLeft)}</span>
    </div>
  );
}

const ExamTimer = memo(ExamTimerInner);
export default ExamTimer;
