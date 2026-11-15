'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload, Globe, FileText, Sparkles, CheckCircle2, Play, Database,
  RefreshCw, FolderUp, Terminal, ArrowRight, Loader2
} from 'lucide-react';

export default function SmartImporterView({ exams = [], crawlLogs = [], onExamImported, onOpenExam }) {
  const [importTab, setImportTab] = useState('raw'); // 'raw' | 'file' | 'crawler'
  const [templates, setTemplates] = useState({});
  const [archiveFeeds, setArchiveFeeds] = useState([]);
  const [rawText, setRawText] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [metaOverrides, setMetaOverrides] = useState({
    title: '',
    tournament: '',
    year: 2025,
    province_school: ''
  });
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Gemini C1/C2 Auto-Explanation Engine state
  const [selectedExamIdForAi, setSelectedExamIdForAi] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiProgressSteps, setAiProgressSteps] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);

  useEffect(() => {
    fetch('/api/ingest/templates')
      .then(r => r.json())
      .then(data => {
        setTemplates(data.templates || {});
        setArchiveFeeds(data.archiveFeeds || []);
        if (data.templates?.hsgqg) {
          setRawText(data.templates.hsgqg);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedExamIdForAi && exams.length > 0) {
      setSelectedExamIdForAi(exams[0].id);
    }
  }, [exams, selectedExamIdForAi]);

  const handleGenerateAiExplanations = async (targetExamId) => {
    const idToRun = targetExamId || selectedExamIdForAi || importResult?.id;
    if (!idToRun) return;

    setGeneratingAi(true);
    setAiSummary(null);
    setAiProgressSteps([
      { sectionTitle: 'I. LISTENING', status: 'processing', detail: 'Analyzing transcript & injecting #ev-q{n} anchors...' },
      { sectionTitle: 'II. LEXICO-GRAMMAR', status: 'pending', detail: 'Queued (batches of <= 12 questions)...' },
      { sectionTitle: 'III. READING COMPREHENSION', status: 'pending', detail: 'Queued for evidence quote anchoring...' },
      { sectionTitle: 'IV. WRITING & TRANSFORMATION', status: 'pending', detail: 'Queued for C1/C2 structural breakdown...' }
    ]);

    try {
      setTimeout(() => {
        setAiProgressSteps(prev =>
          prev.map((s, i) =>
            i === 0
              ? { ...s, status: 'done', detail: 'Completed transcript evidence anchoring' }
              : i === 1
              ? { ...s, status: 'processing', detail: 'Generating optionBreakdown & C2 collocation traps...' }
              : s
          )
        );
      }, 250);

      const res = await fetch(`/api/exams/${idToRun}/generate-explanations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saveVocabToVault: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate AI explanations');

      const completedSteps = (data.sectionProgress || []).map(sp => ({
        sectionTitle: `${sp.sectionTitle} — ${sp.groupTitle}`,
        status: 'done',
        detail: `${sp.questionsProcessed} questions analyzed • ${sp.anchorsInjected} #ev-q{n} anchors injected`
      }));

      setAiProgressSteps(
        completedSteps.length > 0
          ? completedSteps
          : [
              { sectionTitle: 'All Exam Sections', status: 'done', detail: `${data.totalQuestionsUpdated} questions updated` }
            ]
      );
      setAiSummary(data);
      if (data.exam) setImportResult(data.exam);
      if (onExamImported) onExamImported();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleIngestRawText = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          metadata: {
            title: metaOverrides.title || undefined,
            tournament: metaOverrides.tournament || undefined,
            year: metaOverrides.year || undefined,
            province_school: metaOverrides.province_school || undefined
          },
          saveToDb: true
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse text');
      setImportResult(data.exam);
      setSelectedExamIdForAi(data.exam.id);
      if (onExamImported) onExamImported();
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metaOverrides.title) formData.append('title', metaOverrides.title);
      if (metaOverrides.tournament) formData.append('tournament', metaOverrides.tournament);
      formData.append('saveToDb', 'true');

      const res = await fetch('/api/ingest/file', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'File upload failed');
      setImportResult(data.exam);
      setSelectedExamIdForAi(data.exam.id);
      if (onExamImported) onExamImported();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCrawler = async (urlToCrawl = 'BATCH_ALL') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToCrawl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Crawl failed');
      if (data.results?.length > 0) {
        setImportResult(data.results[0].exam);
        setSelectedExamIdForAi(data.results[0].exam.id);
      }
      if (onExamImported) onExamImported();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
            <Database className="w-3.5 h-3.5" />
            MODULE 1 • AUTONOMOUS DATA INGESTION & GEMINI C1/C2 EXPLANATION ENGINE
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Trình Nhập Đề Thông Minh (.DOCX / .PDF) & Tự Động Chữa Chi Tiết C1/C2 (AI)
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Bóc tách đề thi tự động, gắn thẻ neo dẫn chứng <code>#ev-q{'{number}'}</code> vào đoạn văn và sinh giải thích chuyên sâu HSGQG/DHBB theo lô 12 câu hỏi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'raw', label: '1. Dán Văn Bản Đề Thi (Raw Text)', icon: FileText },
            { id: 'file', label: '2. Tải File (.DOCX / .PDF / .JSON)', icon: FolderUp },
            { id: 'crawler', label: '3. Web Crawler & Kho Đề Mở', icon: Globe }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setImportTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  importTab === t.id
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-emerald-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GEMINI C1/C2 AUTO-EXPLANATION GENERATOR & PROGRESS PANEL */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Gemini C1/C2 Auto-Explanation Engine & Evidence Anchoring (Batch &le; 12 Questions)
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn bất kỳ đề thi nào để chạy phân tích cấu trúc ngữ pháp C1/C2, giải thích 4 đáp án A/B/C/D, trích xuất <code>extractedVocab</code> và tự động chèn thẻ neo <code>&lt;span id="ev-q{'{n}'}" class="evidence-anchor"&gt;</code>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <select
              value={selectedExamIdForAi}
              onChange={e => setSelectedExamIdForAi(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-xs"
            >
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  [{ex.tournament} {ex.year}] {ex.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={generatingAi}
              onClick={() => handleGenerateAiExplanations(selectedExamIdForAi)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition shrink-0"
            >
              {generatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              ✨ Generate C1/C2 Explanations (AI)
            </button>
          </div>
        </div>

        {/* Section-by-Section Progress Indicator */}
        {aiProgressSteps.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {aiProgressSteps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    step.status === 'done'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : step.status === 'processing'
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 animate-pulse'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold">{step.sectionTitle}</div>
                    <div className="text-[11px] opacity-85">{step.detail}</div>
                  </div>
                  <span className="font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    {step.status}
                  </span>
                </div>
              ))}
            </div>

            {aiSummary && (
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                  ✓ Hoàn tất phân tích bằng <code>{aiSummary.modelUsed}</code>: Đã cập nhật <strong>{aiSummary.totalQuestionsUpdated} câu hỏi</strong>, gắn <strong>{aiSummary.totalAnchorsInjected} thẻ neo dẫn chứng (#ev-q)</strong> và trích xuất <strong>+{aiSummary.totalVocabSaved} mục từ vựng C1/C2</strong> vào Sổ tay SRS!
                </span>
                {aiSummary.exam && onOpenExam && (
                  <button
                    type="button"
                    onClick={() => onOpenExam(aiSummary.exam, 'practice')}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold"
                  >
                    Mở Xem Giải Thích & Jump to Evidence →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-semibold">
          Lỗi phân tích: {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Active Ingestion Tool */}
        <div className="lg:col-span-7 space-y-4">
          {importTab === 'raw' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  Dán nội dung đề thi thô (Tự động nhận diện MCQ, Word Form, Rewrite & Key)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => templates.hsgqg && setRawText(templates.hsgqg)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-xs font-semibold"
                  >
                    Mẫu Đề HSGQG 2025
                  </button>
                  <button
                    type="button"
                    onClick={() => templates.olympic304 && setRawText(templates.olympic304)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 text-xs font-semibold"
                  >
                    Mẫu Đề Olympic 30/4
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Tên đề (Để trống = Tự nhận diện)"
                  value={metaOverrides.title}
                  onChange={e => setMetaOverrides(p => ({ ...p, title: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
                <select
                  value={metaOverrides.tournament}
                  onChange={e => setMetaOverrides(p => ({ ...p, tournament: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <option value="">Tự động nhận diện Kỳ thi</option>
                  <option value="HSGQG">HSGQG (National NEC)</option>
                  <option value="DHBB">DHBB (Duyên hải & ĐBBB)</option>
                  <option value="Trại hè Hùng Vương">Trại hè Hùng Vương</option>
                  <option value="Olympic 30/4">Olympic 30/4</option>
                  <option value="Đề Chọn Đội Tuyển">Đề Chọn Đội Tuyển</option>
                </select>
                <input
                  type="text"
                  placeholder="Trường / Tỉnh (Tùy chọn)"
                  value={metaOverrides.province_school}
                  onChange={e => setMetaOverrides(p => ({ ...p, province_school: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <textarea
                rows={12}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Dán nội dung đề thi vào đây..."
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />

              <button
                type="button"
                disabled={loading}
                onClick={handleIngestRawText}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Sparkles className="w-4 h-4" />
                {loading ? 'Đang bóc tách cấu trúc đề...' : 'Phân tích & Lưu Đề Thi vào Cơ sở dữ liệu'}
              </button>
            </div>
          )}

          {importTab === 'file' && (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-500/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center mx-auto">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tải lên File Đề Thi (.DOCX, .PDF, .TXT, hoặc .JSON)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Sử dụng bộ giải mã Mammoth (cho Word .docx) và PDF-Parse (cho .pdf) kết hợp bộ trích xuất cấu trúc C1/C2 tự động.
                </p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-bold shadow-lg transition">
                <FolderUp className="w-4 h-4" />
                Chọn File từ Máy tính để Bóc tách
                <input type="file" accept=".docx,.pdf,.txt,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {importTab === 'crawler' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Thu thập từ URL trang web giáo dục bất kỳ (Cheerio HTML Scraper)
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    placeholder="https://... (Nhập URL trang chứa đề thi Tiếng Anh)"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  />
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => customUrl.trim() && handleTriggerCrawler(customUrl.trim())}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    Crawl URL
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Kho Lưu Trữ Đề Đề Xuất Mở (Configured Olympiad Feeds)
                  </h3>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleTriggerCrawler('BULK_ALL')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Quét /raw_exams & Chạy Batch Crawler
                  </button>
                </div>

                {archiveFeeds.map(feed => (
                  <div
                    key={feed.url}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500">
                        {feed.tournament} {feed.year}
                      </span>
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">{feed.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">{feed.url}</div>
                    </div>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleTriggerCrawler(feed.url)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
                    >
                      Crawl & Nạp
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Live Extraction Preview & Crawl Logs */}
        <div className="lg:col-span-5 space-y-4">
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  ĐÃ BÓC TÁCH & LƯU VÀO DATABASE THÀNH CÔNG!
                </span>
                <span className="text-xs font-mono text-slate-400">{importResult.id}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">{importResult.title}</h4>
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div>• Kỳ thi: <strong>{importResult.tournament} ({importResult.year})</strong></div>
                <div>• Đơn vị: <strong>{importResult.province_school}</strong></div>
                <div>• Tổng số câu hỏi chuẩn hóa: <strong>{importResult.total_questions} câu</strong></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={generatingAi}
                  onClick={() => handleGenerateAiExplanations(importResult.id)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                >
                  ✨ Generate C1/C2 Explanations (AI)
                </button>
                {onOpenExam && (
                  <button
                    type="button"
                    onClick={() => onOpenExam(importResult, 'practice')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition"
                  >
                    Mở Làm Đề Ngay <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pipeline Activity Log */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Terminal className="w-4 h-4 text-indigo-500" />
              Nhật ký Pipeline Thu thập & Nhập dữ liệu (Ingestion Logs):
            </div>
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {crawlLogs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-500">[{log.status}] {log.source_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-medium">{log.summary}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{log.source_url}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
