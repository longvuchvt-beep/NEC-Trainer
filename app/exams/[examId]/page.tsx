'use client';

import React, { useState, useEffect } from 'react';
import QuizletStudySetView from '../../../components/exam/QuizletStudySetView';

export default function ExamStudyPage({ params }: { params?: { examId?: string } }) {
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idFromUrl =
      params?.examId ||
      (typeof window !== 'undefined'
        ? decodeURIComponent(window.location.pathname.replace(/^\/exams\//, ''))
        : '');

    if (!idFromUrl) {
      setLoading(false);
      return;
    }

    fetch(`/api/exams/${encodeURIComponent(idFromUrl)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setExam(data);
      })
      .finally(() => setLoading(false));
  }, [params?.examId]);

  if (loading) {
    return (
      <div className="min-h-screen eyecare-canvas flex items-center justify-center p-8 text-sm font-bold">
        Đang tải học phần C1/C2...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen eyecare-canvas flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-sm font-bold">Không tìm thấy bộ đề này.</p>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          className="px-4 py-2 rounded-xl bg-amber-900 text-amber-50 text-xs font-extrabold"
        >
          Quay lại Thư viện Đề
        </button>
      </div>
    );
  }

  return (
    <QuizletStudySetView
      exam={exam}
      initialMode="learn"
      onClose={() => {
        if (typeof window !== 'undefined') window.location.href = '/';
      }}
      onExamUpdated={(updated) => setExam(updated)}
    />
  );
}
