import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Sparkles, Highlighter,
  BookmarkPlus, Check, GripVertical, ArrowRight, Eye, HelpCircle, Layers
} from 'lucide-react';
import {
  gradeQuestion,
  GradableQuestion,
  ErrorCorrectionInput,
  GradeResult
} from '../../lib/grading-engine';

export interface QuestionItem extends GradableQuestion {
  id: string;
  questionNumber: number;
  questionType: string;
  stem?: string | null;
  givenWord?: string | null;
  promptPrefix?: string | null;
  promptSuffix?: string | null;
  maxWords?: number | null;
  optionsJson?: string | null;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: string;
  acceptedAnswersJson?: string | null;
  acceptedAnswers?: string[];
  points?: number;
  grammarRule?: string | null;
  explanationVi?: string | null;
  explanationEn?: string | null;
  distractorAnalysisJson?: string | null;
  explanationJson?: string | null;
  topicTagsJson?: string | null;
  evidenceQuote?: string | null;
}

export interface QuestionGroupData {
  id: string;
  groupType:
    | 'OPEN_CLOZE'
    | 'WORD_FORMATION_PASSAGE'
    | 'WORD_FORMATION_SENTENCE'
    | 'GAPPED_TEXT'
    | 'MATCHING_HEADINGS'
    | 'ERROR_CORRECTION_PASSAGE'
    | 'SENTENCE_TRANSFORM'
    | 'MCQ_GRAMMAR'
    | 'GUIDED_CLOZE'
    | 'TFNG_READING'
    | 'LISTENING_NOTE_COMPLETION'
    | string;
  title: string;
  instructions: string;
  stimulusTitle?: string | null;
  stimulusText?: string | null;
  sharedOptionsJson?: string | null;
  sharedOptions?: Array<{ id: string; text: string }>;
  questions: QuestionItem[];
}

export interface QuestionGroupRendererProps {
  group: QuestionGroupData;
  answers: Record<string, any>;
  onAnswerChange: (questionId: string, value: any) => void;
  showSolutions?: boolean;
  revealedQuestions?: Record<string, boolean>;
  onToggleReveal?: (questionId: string) => void;
  onHighlightEvidence?: (quote: string) => void;
  onSaveVocabCard?: (item: {
    term: string;
    category: string;
    definitionEn: string;
    definitionVi: string;
    exampleSentence?: string;
  }) => void;
  readOnly?: boolean;
}

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const QuestionGroupRenderer: React.FC<QuestionGroupRendererProps> = ({
  group,
  answers,
  onAnswerChange,
  showSolutions = false,
  revealedQuestions = {},
  onToggleReveal,
  onHighlightEvidence,
  onSaveVocabCard,
  readOnly = false
}) => {
  const [selectedGapQuestionId, setSelectedGapQuestionId] = useState<string | null>(
    group.questions[0]?.id || null
  );
  const [draggedParagraphId, setDraggedParagraphId] = useState<string | null>(null);
  const [savedVocabMap, setSavedVocabMap] = useState<Record<string, boolean>>({});

  // Map questions by questionNumber for instant {{questionNumber}} token lookup
  const questionByNumber = useMemo(() => {
    const map = new Map<number, QuestionItem>();
    (group.questions || []).forEach(q => {
      map.set(Number(q.questionNumber), q);
    });
    return map;
  }, [group.questions]);

  // Parse sharedOptions (Paragraph Bank A-H for GAPPED_TEXT or Headings i-x for MATCHING_HEADINGS)
  const sharedOptions = useMemo<Array<{ id: string; text: string }>>(() => {
    if (Array.isArray(group.sharedOptions) && group.sharedOptions.length > 0) {
      return group.sharedOptions;
    }
    return parseJsonSafe<Array<{ id: string; text: string }>>(group.sharedOptionsJson, []);
  }, [group.sharedOptions, group.sharedOptionsJson]);

  const isQuestionRevealed = (qId: string) => Boolean(showSolutions || revealedQuestions[qId]);

  const evaluateItem = (q: QuestionItem): GradeResult => {
    const acceptedList =
      q.acceptedAnswers ||
      parseJsonSafe<string[]>(q.acceptedAnswersJson, [q.correctAnswer]);
    return gradeQuestion(
      {
        ...q,
        acceptedAnswers: acceptedList
      },
      answers[q.id]
    );
  };

  // Render Deep Explanation Drawer for any question
  const renderExplanationBlock = (q: QuestionItem, grade: GradeResult) => {
    if (!isQuestionRevealed(q.id)) return null;
    const parsedExpJson = parseJsonSafe<any>(q.explanationJson, null);
    const distractorMap =
      parsedExpJson?.optionBreakdown ||
      parseJsonSafe<Record<string, string>>(q.distractorAnalysisJson, {});

    const grammarPoint = parsedExpJson?.grammarOrLexicalPoint || q.grammarRule || '';
    const detailedVi = parsedExpJson?.detailedAnalysisVi || q.explanationVi || '';
    const evidenceQuote = parsedExpJson?.evidenceQuote || q.evidenceQuote || '';
    const anchorId = parsedExpJson?.evidenceAnchorId || `ev-q${q.questionNumber}`;
    const extractedVocab: Array<{
      term: string;
      type: string;
      meaningVi: string;
      example: string;
    }> = Array.isArray(parsedExpJson?.extractedVocab) && parsedExpJson.extractedVocab.length > 0
      ? parsedExpJson.extractedVocab
      : [
          {
            term: q.givenWord ? `${q.correctAnswer} (< ${q.givenWord})` : q.correctAnswer,
            type: group.groupType,
            meaningVi: detailedVi || `Cấu trúc C1/C2 trọng tâm câu #${q.questionNumber}`,
            example: q.stem || `Tested in Question #${q.questionNumber}`
          }
        ];

    return (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs md:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {grade.isCorrect ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : grade.isPartial ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {grade.diagnosticMessage}
            </span>
          </div>
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            Key: {q.correctAnswer} ({grade.awardedPoints}/{grade.maxPoints} pts)
          </span>
        </div>

        {grammarPoint && (
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            Rule: {grammarPoint}
          </div>
        )}

        {detailedVi && (
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">Giải thích (VI):</strong> {detailedVi}
          </p>
        )}
        {q.explanationEn && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Linguistic Note (EN):</strong> {q.explanationEn}
          </p>
        )}

        {Object.keys(distractorMap).length > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
            {Object.entries(distractorMap).map(([optKey, note]) => (
              <div key={optKey} className="text-xs flex items-start gap-2">
                <span className={`font-mono font-bold px-1.5 py-0.2 rounded ${
                  optKey === q.correctAnswer
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {optKey}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{String(note)}</span>
              </div>
            ))}
          </div>
        )}

        {evidenceQuote && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs italic text-amber-900 dark:text-amber-200">
              <strong className="font-mono not-italic mr-1">#{anchorId}:</strong> "{evidenceQuote}"
            </span>
            <button
              type="button"
              onClick={() => {
                document.querySelectorAll('.evidence-anchor-active').forEach(el =>
                  el.classList.remove('evidence-anchor-active')
                );
                const el = document.getElementById(anchorId);
                if (el) {
                  el.classList.add('evidence-anchor-active');
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (onHighlightEvidence) onHighlightEvidence(evidenceQuote);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition"
            >
              🔍 Jump to Evidence
            </button>
          </div>
        )}

        {onSaveVocabCard && extractedVocab.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {extractedVocab.map((vItem, idx) => {
              const saveKey = `${q.id}-v-${idx}`;
              const isSaved = Boolean(savedVocabMap[saveKey]);
              return (
                <div
                  key={saveKey}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap"
                >
                  <div className="text-xs">
                    <strong className="text-indigo-600 dark:text-indigo-400">{vItem.term}</strong>{' '}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-500">
                      {vItem.type}
                    </span>{' '}
                    <span className="text-slate-600 dark:text-slate-300">— {vItem.meaningVi}</span>
                  </div>
                  <button
                    type="button"
                    disabled={isSaved}
                    onClick={() => {
                      setSavedVocabMap(prev => ({ ...prev, [saveKey]: true }));
                      onSaveVocabCard({
                        term: vItem.term,
                        category: vItem.type || group.groupType,
                        definitionEn: vItem.example || `C1/C2 structure tested in Question #${q.questionNumber}`,
                        definitionVi: vItem.meaningVi,
                        exampleSentence: vItem.example
                      });
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                    {isSaved ? 'Saved to Vocab Vault' : '+ Save to Vocab Vault'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // LAYOUT 1: GAPPED_TEXT (Side-by-Side Passage + Draggable/Selectable Paragraph Bank A-H)
  // ============================================================================
  if (group.groupType === 'GAPPED_TEXT') {
    const rawStimulus = group.stimulusText || '';
    const tokens = rawStimulus.split(/(\{\{\d+\}\}|\[\[\d+\]\])/g);

    // Track which paragraph letters (A-H) are currently used
    const usedLetters = new Map<string, number>();
    group.questions.forEach(q => {
      const val = String(answers[q.id] || '').trim().toUpperCase();
      if (val) usedLetters.set(val, q.questionNumber);
    });

    const assignParagraphToGap = (questionId: string, letter: string) => {
      if (readOnly) return;
      onAnswerChange(questionId, letter);
    };

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              GAPPED TEXT • PARAGRAPH INSERTION (A–H)
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{group.title}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">{group.instructions}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Cols: Passage with Interactive {{questionNumber}} Drop Slots */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            {group.stimulusTitle && (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                {group.stimulusTitle}
              </h3>
            )}

            <div className="passage-prose text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200 space-y-3">
              {tokens.map((seg, idx) => {
                const match = seg.match(/^(?:\{\{(\d+)\}\}|\[\[(\d+)\]\])$/);
                if (!match) {
                  return <span key={idx}>{seg}</span>;
                }
                const qNum = Number(match[1] || match[2]);
                const q = questionByNumber.get(qNum);
                if (!q) return <span key={idx}>{seg}</span>;

                const currentLetter = String(answers[q.id] || '').trim().toUpperCase();
                const matchedOption = sharedOptions.find(o => o.id.toUpperCase() === currentLetter);
                const isSelectedSlot = selectedGapQuestionId === q.id;
                const revealed = isQuestionRevealed(q.id);
                const grade = evaluateItem(q);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedGapQuestionId(q.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const droppedLetter = e.dataTransfer.getData('text/plain') || draggedParagraphId;
                      if (droppedLetter) {
                        assignParagraphToGap(q.id, droppedLetter);
                      }
                    }}
                    className={`my-3 p-3.5 rounded-xl border-2 transition cursor-pointer font-sans ${
                      revealed
                        ? grade.isCorrect
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-rose-500 bg-rose-500/10'
                        : isSelectedSlot
                        ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20'
                        : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/70 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <Layers className="w-3.5 h-3.5" />
                        GAP #{qNum} {isSelectedSlot && !readOnly ? '(Active Slot — Click or Drag Paragraph A–H)' : ''}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <select
                          disabled={readOnly}
                          value={currentLetter}
                          onChange={e => assignParagraphToGap(q.id, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="">-- Select A–H --</option>
                          {sharedOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              Paragraph {opt.id}
                            </option>
                          ))}
                        </select>

                        {onToggleReveal && !showSolutions && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onToggleReveal(q.id);
                            }}
                            className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {matchedOption ? (
                      <div className="text-xs md:text-sm text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <strong className="text-indigo-500 font-mono mr-1.5">[{matchedOption.id}]</strong>
                        {matchedOption.text}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        Kéo thả đoạn văn (A–H) từ cột bên phải vào đây hoặc chọn từ danh sách...
                      </div>
                    )}

                    {renderExplanationBlock(q, grade)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Cols: Draggable & Clickable Paragraph Bank (A-H) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 h-fit sticky top-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-500">
                Paragraph Bank (A–H) — Drag or Click to Insert
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {sharedOptions.length} paragraphs
              </span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {sharedOptions.map(opt => {
                const assignedGapNum = usedLetters.get(opt.id.toUpperCase());
                return (
                  <div
                    key={opt.id}
                    draggable={!readOnly}
                    onDragStart={e => {
                      setDraggedParagraphId(opt.id);
                      e.dataTransfer.setData('text/plain', opt.id);
                    }}
                    onClick={() => {
                      if (selectedGapQuestionId && !readOnly) {
                        assignParagraphToGap(selectedGapQuestionId, opt.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-xs md:text-sm cursor-grab active:cursor-grabbing transition ${
                      assignedGapNum
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                        Paragraph {opt.id}
                      </span>
                      {assignedGapNum && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-600 text-white">
                          Assigned → Gap #{assignedGapNum}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{opt.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 2: MATCHING_HEADINGS (Heading Selector Dropdown i-x Above Each Paragraph)
  // ============================================================================
  if (group.groupType === 'MATCHING_HEADINGS') {
    const rawStimulus = group.stimulusText || '';
    // Split stimulus into paragraphs by double newline or <p> tags
    const paragraphs = rawStimulus
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .split(/\n{2,}/)
      .map(p => p.trim())
      .filter(Boolean);

    return (
      <div className="space-y-5">
        {/* Heading Bank Box (i - x) */}
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              LIST OF HEADINGS (i–x) • {group.title}
            </span>
            <span className="text-xs text-slate-400">{group.instructions}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sharedOptions.map(h => (
              <div
                key={h.id}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-2"
              >
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 min-w-[28px]">
                  {h.id}.
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{h.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Paragraphs with Heading Selector Dropdown Above Each Paragraph */}
        <div className="space-y-4">
          {group.questions.map((q, idx) => {
            const paraText = paragraphs[idx] || q.stem || '';
            const selectedHeading = String(answers[q.id] || '');
            const revealed = isQuestionRevealed(q.id);
            const grade = evaluateItem(q);

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition ${
                  revealed
                    ? grade.isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-rose-500/50 bg-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Heading Dropdown Bar Above Paragraph */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold">
                      Q{q.questionNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Select Heading for Paragraph {String.fromCharCode(65 + idx)}:
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      disabled={readOnly}
                      value={selectedHeading}
                      onChange={e => onAnswerChange(q.id, e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Heading (i–x) --</option>
                      {sharedOptions.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.id}. {h.text}
                        </option>
                      ))}
                    </select>

                    {onToggleReveal && !showSolutions && (
                      <button
                        type="button"
                        onClick={() => onToggleReveal(q.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                      >
                        Check
                      </button>
                    )}
                  </div>
                </div>

                {/* Paragraph Content */}
                <p className="passage-prose text-sm md:text-base text-slate-800 dark:text-slate-200 leading-relaxed">
                  {paraText.replace(/^\{\{\d+\}\}\s*/, '')}
                </p>

                {renderExplanationBlock(q, grade)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 3: ERROR_CORRECTION_PASSAGE (Dual Inputs: Error Word -> Correction)
  // ============================================================================
  if (group.groupType === 'ERROR_CORRECTION_PASSAGE') {
    return (
      <div className="space-y-5">
        {group.stimulusText && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-500">
              ERROR IDENTIFICATION & CORRECTION PASSAGE • {group.stimulusTitle || group.title}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{group.instructions}</p>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 passage-prose text-sm md:text-base text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {group.stimulusText}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3.5">
          {group.questions.map(q => {
            const rawVal = answers[q.id];
            let errWord = '';
            let corrWord = '';

            if (rawVal && typeof rawVal === 'object') {
              errWord = rawVal.errorWord || '';
              corrWord = rawVal.correction || '';
            } else if (typeof rawVal === 'string' && rawVal.includes('->')) {
              const parts = rawVal.split('->');
              errWord = (parts[0] || '').trim();
              corrWord = (parts[1] || '').trim();
            } else if (typeof rawVal === 'string') {
              errWord = rawVal;
            }

            const revealed = isQuestionRevealed(q.id);
            const grade = evaluateItem(q);

            const updateDual = (newErr: string, newCorr: string) => {
              const payload: ErrorCorrectionInput = {
                errorWord: newErr,
                correction: newCorr
              };
              onAnswerChange(q.id, payload);
            };

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition ${
                  revealed
                    ? grade.isCorrect
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : grade.isPartial
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-rose-500/50 bg-rose-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono text-xs font-bold shrink-0">
                      Q{q.questionNumber}
                    </span>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {q.stem || `Identify the error and supply the correction for Item #${q.questionNumber}`}
                    </p>
                  </div>

                  {/* Dual Input Boxes: Error Word -> Correction */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                    <input
                      type="text"
                      disabled={readOnly}
                      value={errWord}
                      onChange={e => updateDual(e.target.value, corrWord)}
                      placeholder="Error Word (Từ sai)..."
                      className="w-40 px-3 py-1.5 rounded-xl bg-rose-500/5 border border-rose-500/30 text-xs md:text-sm font-mono font-semibold text-rose-600 dark:text-rose-300 focus:outline-none focus:border-rose-500"
                    />
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      disabled={readOnly}
                      value={corrWord}
                      onChange={e => updateDual(errWord, e.target.value)}
                      placeholder="Correction (Sửa thành)..."
                      className="w-40 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-xs md:text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />

                    {onToggleReveal && !showSolutions && (
                      <button
                        type="button"
                        onClick={() => onToggleReveal(q.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
                      >
                        Check
                      </button>
                    )}
                  </div>
                </div>

                {renderExplanationBlock(q, grade)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 4: INLINE {{questionNumber}} PASSAGE RENDERER
  // (Automatically activated whenever stimulusText contains {{questionNumber}} or [[questionNumber]],
  //  e.g., OPEN_CLOZE and WORD_FORMATION_PASSAGE)
  // ============================================================================
  const hasInlineTokens = Boolean(
    group.stimulusText && (/\{\{\d+\}\}/.test(group.stimulusText) || /\[\[\d+\]\]/.test(group.stimulusText))
  );

  if (
    hasInlineTokens ||
    group.groupType === 'OPEN_CLOZE' ||
    group.groupType === 'WORD_FORMATION_PASSAGE'
  ) {
    const rawStimulus = group.stimulusText || '';
    const segments = rawStimulus.split(/(\{\{\d+\}\}|\[\[\d+\]\])/g);

    return (
      <div className="space-y-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              {group.groupType === 'WORD_FORMATION_PASSAGE'
                ? 'WORD FORMATION PASSAGE (INLINE MORPHOLOGICAL DERIVATION)'
                : 'INLINE OPEN CLOZE PASSAGE (ONE WORD PER GAP)'}
            </span>
            <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {group.stimulusTitle || group.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{group.instructions}</p>
          </div>

          <div className="passage-prose text-base leading-[2.35] eyecare-card">
            {segments.map((seg, idx) => {
              const m = seg.match(/^(?:\{\{(\d+)\}\}|\[\[(\d+)\]\])$/);
              if (!m) {
                return <span key={idx}>{seg}</span>;
              }
              const qNum = Number(m[1] || m[2]);
              const q = questionByNumber.get(qNum);
              if (!q) return <span key={idx}>{seg}</span>;

              const val = String(answers[q.id] || '');
              const revealed = isQuestionRevealed(q.id);
              const grade = evaluateItem(q);

              return (
                <span key={idx} className="relative inline-flex flex-col items-start mx-1.5 my-1 align-middle">
                  {/* Floating badge with Root Word (e.g., 31. PRECEDE) right above each input */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-t-md text-[10px] cloze-mono-input font-bold tracking-wide border border-b-0 ${
                      q.givenWord
                        ? 'bg-amber-800 text-amber-50 border-amber-900'
                        : 'bg-slate-700 text-white border-slate-800'
                    }`}
                  >
                    <span>{qNum}.</span>
                    {q.givenWord && <span>{q.givenWord}</span>}
                  </span>

                  <span className="inline-flex items-center">
                    <input
                      id={`qgr-blank-${qNum}`}
                      type="text"
                      disabled={readOnly}
                      value={val}
                      onChange={e => onAnswerChange(q.id, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (onToggleReveal && !revealedQuestions[q.id]) {
                            onToggleReveal(q.id);
                          }
                          const nextEl = document.getElementById(`qgr-blank-${qNum + 1}`) as HTMLInputElement | null;
                          if (nextEl) {
                            nextEl.focus();
                            nextEl.select();
                          }
                        }
                      }}
                      placeholder={q.givenWord ? `${q.givenWord} →` : `(${qNum})`}
                      className={`w-36 px-2.5 py-1 text-xs sm:text-sm cloze-mono-input font-semibold rounded-b-lg rounded-tr-lg border focus:outline-none focus:ring-2 transition ${
                        revealed
                          ? grade.isCorrect
                            ? 'border-emerald-600 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 focus:ring-emerald-500'
                            : 'border-rose-600 bg-rose-500/20 text-rose-800 dark:text-rose-200 focus:ring-rose-500'
                          : 'eyecare-card border-amber-800/40 focus:border-amber-700 focus:ring-amber-600/30'
                      }`}
                    />
                    {revealed && !grade.isCorrect && (
                      <span className="ml-1.5 px-2 py-0.5 text-xs cloze-mono-input font-bold bg-emerald-600 text-white rounded-md">
                        ✓ {q.correctAnswer}
                      </span>
                    )}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Individual Question Breakdown Cards for Explanation Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {group.questions.map(q => {
            const grade = evaluateItem(q);
            return (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-500">
                    Blank #{q.questionNumber} {q.givenWord ? `(${q.givenWord})` : ''}
                  </span>
                  {onToggleReveal && !showSolutions && (
                    <button
                      type="button"
                      onClick={() => onToggleReveal(q.id)}
                      className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {revealedQuestions[q.id] ? 'Ẩn giải thích' : 'Chữa chi tiết'}
                    </button>
                  )}
                </div>
                {renderExplanationBlock(q, grade)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // LAYOUT 5: STANDARD / SENTENCE_TRANSFORM / MCQ / WORD_FORMATION_SENTENCE
  // ============================================================================
  return (
    <div className="space-y-4">
      {group.questions.map(q => {
        const val = String(answers[q.id] || '');
        const revealed = isQuestionRevealed(q.id);
        const grade = evaluateItem(q);
        const opts = q.options || parseJsonSafe<Array<{ id: string; text: string }>>(q.optionsJson, []);

        return (
          <div
            key={q.id}
            className={`p-5 rounded-2xl border transition ${
              revealed
                ? grade.isCorrect
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-rose-500/50 bg-rose-500/5'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold">
                  Q{q.questionNumber}
                </span>
                {q.givenWord && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 font-mono text-xs font-bold">
                    {q.questionType === 'SENTENCE_TRANSFORM' ? `KEYWORD: ${q.givenWord}` : `ROOT: ${q.givenWord}`}
                  </span>
                )}
              </div>

              {onToggleReveal && !showSolutions && (
                <button
                  type="button"
                  onClick={() => onToggleReveal(q.id)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {revealedQuestions[q.id] ? 'Ẩn giải thích' : 'Chữa chi tiết'}
                </button>
              )}
            </div>

            {q.stem && (
              <p className="text-sm md:text-base font-medium text-slate-900 dark:text-slate-100 mb-3 leading-relaxed">
                {q.stem}
              </p>
            )}

            {opts.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {opts.map(opt => {
                  const selected = val.toUpperCase() === opt.id.toUpperCase();
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={readOnly}
                      onClick={() => onAnswerChange(q.id, opt.id)}
                      className={`text-left px-3.5 py-2.5 rounded-xl border text-xs md:text-sm flex items-start gap-2.5 transition ${
                        selected
                          ? 'border-indigo-500 bg-indigo-500/15 font-semibold text-indigo-900 dark:text-indigo-100'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
                      }`}
                    >
                      <span className="font-mono font-bold text-indigo-500">{opt.id}.</span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {q.promptPrefix && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Prompt starter: <strong className="text-slate-800 dark:text-slate-200">"{q.promptPrefix}..."</strong>
                  </div>
                )}
                <input
                  type="text"
                  disabled={readOnly}
                  value={val}
                  onChange={e => onAnswerChange(q.id, e.target.value)}
                  placeholder={q.promptPrefix ? `${q.promptPrefix} ...` : 'Type your answer...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {renderExplanationBlock(q, grade)}
          </div>
        );
      })}
    </div>
  );
};

export default QuestionGroupRenderer;
