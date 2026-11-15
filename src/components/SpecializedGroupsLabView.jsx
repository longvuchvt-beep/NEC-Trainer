import React, { useState, useEffect } from 'react';
import {
  Layers, Sparkles, CheckCircle2, RotateCcw, Eye, Database, Code2
} from 'lucide-react';
import QuestionGroupRenderer from '../../components/exam/QuestionGroupRenderer';
import { expandOptionalFragments, gradeQuestion } from '../../lib/grading-engine';

const DEFAULT_SPECIALIZED_GROUPS = [
  {
    id: 'grp-wf-passage',
    groupType: 'WORD_FORMATION_PASSAGE',
    title: 'Part 1: Inline Word Formation Passage ({{questionNumber}} Tokens)',
    instructions: 'Use the word given in capitals at each inline gap to form a word that fits in the space.',
    stimulusTitle: 'The Epistemology of Algorithmic Curation',
    stimulusText: `In contemporary media ecosystems, the {{1}} of algorithmic recommendation engines has fundamentally altered public discourse. Proponents claim these systems democratize access to information; however, empirical studies reveal an {{2}} tendency to amplify partisan outrage. Without {{3}} regulatory transparency, citizens remain vulnerable to {{4}} behavioral manipulation.`,
    questions: [
      {
        id: 'q-wfp-1',
        questionNumber: 1,
        questionType: 'WORD_FORMATION_PASSAGE',
        givenWord: 'UBIQUITOUS',
        correctAnswer: 'ubiquity',
        acceptedAnswers: ['ubiquity', 'ubiquitousness'],
        points: 2,
        grammarRule: 'Adjective -> Abstract Noun ("the + N + of")',
        explanationVi: 'Giữa mạo từ "the" và giới từ "of" cần một danh từ trừu tượng: UBIQUITOUS -> UBIQUITY.',
        explanationEn: 'Preceded by "the" and followed by "of", the slot requires the abstract noun "ubiquity".'
      },
      {
        id: 'q-wfp-2',
        questionNumber: 2,
        questionType: 'WORD_FORMATION_PASSAGE',
        givenWord: 'ALARM',
        correctAnswer: 'alarming',
        acceptedAnswers: ['alarming'],
        points: 2,
        grammarRule: 'Participial Adjective ("an alarming tendency")',
        explanationVi: 'Sau mạo từ "an" và trước danh từ "tendency" cần tính từ chỉ tính chất đáng báo động: ALARMING.',
        explanationEn: 'Requires the participial adjective "alarming" modifying "tendency".'
      },
      {
        id: 'q-wfp-3',
        questionNumber: 3,
        questionType: 'WORD_FORMATION_PASSAGE',
        givenWord: 'COMPROMISE',
        correctAnswer: 'uncompromising',
        acceptedAnswers: ['uncompromising'],
        points: 2,
        grammarRule: 'Negative Participial Adjective ("uncompromising transparency")',
        explanationVi: 'Ngữ cảnh đòi hỏi sự minh bạch kiên quyết, không khoan nhượng: UNCOMPROMISING.',
        explanationEn: 'Requires the negative participial adjective "uncompromising".'
      },
      {
        id: 'q-wfp-4',
        questionNumber: 4,
        questionType: 'WORD_FORMATION_PASSAGE',
        givenWord: 'PERCEIVE',
        correctAnswer: 'imperceptible',
        acceptedAnswers: ['imperceptible'],
        points: 2,
        grammarRule: 'Negative Prefix "im-" + "-ible" ("imperceptible manipulation")',
        explanationVi: 'Sự thao túng hành vi tinh vi khó nhận biết: IMPERCEPTIBLE.',
        explanationEn: 'Derives "imperceptible" modifying "behavioral manipulation".'
      }
    ]
  },
  {
    id: 'grp-gapped-text',
    groupType: 'GAPPED_TEXT',
    title: 'Part 2: Gapped Text — Side-by-Side Passage & Draggable Paragraph Bank (A–E)',
    instructions: 'Drag a paragraph from the Paragraph Bank (A–E) on the right or click to assign it to each gap ({{11}}–{{13}}).',
    stimulusTitle: 'The Rise of Credentialism and Positional Inflation',
    stimulusText: `When sociologist Michael Young coined the term "meritocracy" in 1958, he intended it as a satirical warning rather than an educational ideal. He foresaw a stratified regime in which the ruling class would attribute their privilege entirely to their own innate intelligence. {{11}} Over the subsequent decades, however, policymakers stripped the word of its dystopian irony and embraced standardized testing as the ultimate engine of social mobility. {{12}} Furthermore, modern labor markets suffer from acute "positional inflation": employers continually raise baseline degree requirements for jobs whose cognitive tasks have not changed. {{13}}`,
    sharedOptions: [
      {
        id: 'A',
        text: 'In such a society, those at the bottom would be deprived not only of material wealth, but also of the moral consolation that the system was unfair.'
      },
      {
        id: 'B',
        text: 'Yet empirical data across OECD economies reveals that high-stakes admission tests have instead fueled an arms race of private tutoring that closely tracks household wealth.'
      },
      {
        id: 'C',
        text: 'Consequently, applicants without tertiary credentials are screened out not because they lack competence, but because degrees serve as a rationing filter.'
      },
      {
        id: 'D',
        text: 'By contrast, medieval craft guilds prohibited written examinations altogether in favor of seven-year apprenticeships.'
      },
      {
        id: 'E',
        text: 'Nevertheless, maritime navigation in the sixteenth century relied heavily on celestial astrolabes.'
      }
    ],
    questions: [
      {
        id: 'q-gt-11',
        questionNumber: 11,
        questionType: 'GAPPED_TEXT',
        correctAnswer: 'A',
        acceptedAnswers: ['A'],
        points: 2,
        grammarRule: 'Anaphoric Reference ("In such a society..." -> Young’s stratified regime)',
        explanationVi: 'Đoạn A bắt đầu bằng "In such a society..." nối trực tiếp với mô tả về xã hội phân tầng của Michael Young ở câu liền trước.',
        explanationEn: '"In such a society" refers directly back to the stratified regime envisioned by Young.'
      },
      {
        id: 'q-gt-12',
        questionNumber: 12,
        questionType: 'GAPPED_TEXT',
        correctAnswer: 'B',
        acceptedAnswers: ['B'],
        points: 2,
        grammarRule: 'Contrastive Discourse Link ("Yet empirical data..." vs. policymaker ideal)',
        explanationVi: 'Đoạn B ("Yet empirical data...") phản biện lại kỳ vọng của các nhà hoạch định chính sách ở câu trước.',
        explanationEn: 'Contrasts the optimistic promise of standardized testing with empirical OECD reality.'
      },
      {
        id: 'q-gt-13',
        questionNumber: 13,
        questionType: 'GAPPED_TEXT',
        correctAnswer: 'C',
        acceptedAnswers: ['C'],
        points: 2,
        grammarRule: 'Causal Result ("Consequently, applicants without tertiary credentials...")',
        explanationVi: 'Đoạn C ("Consequently...") chỉ ra hệ quả trực tiếp của hiện tượng "positional inflation" vừa nêu.',
        explanationEn: 'Draws the logical consequence of employers raising baseline degree requirements.'
      }
    ]
  },
  {
    id: 'grp-matching-headings',
    groupType: 'MATCHING_HEADINGS',
    title: 'Part 3: Matching Headings — Dropdown Selector (i–v) Above Each Paragraph',
    instructions: 'Select the most appropriate Roman numeral heading (i–v) from the dropdown above each paragraph.',
    stimulusTitle: 'Linguistic Relativity & Spatial Reckoning',
    stimulusText: `For decades, cognitive psychologists assumed that all human cultures conceptualize time along an ego-relative sagittal axis—envisioning the future ahead of the speaker and the past behind.\n\nFieldwork among the Aymara community of the Andes overturned this universalist assumption: because the past has been visually witnessed, Aymara speakers place the known past in front of their eyes and the unseen future behind their backs.\n\nEven more strikingly, the Kuuk Thaayorre people of northern Australia eschew body-relative terms like "left" and "right" altogether, organizing both spatial navigation and temporal sequences strictly along cardinal directions from east to west.`,
    sharedOptions: [
      { id: 'i', text: 'The orthodox universalist assumption of ego-relative temporal mapping' },
      { id: 'ii', text: 'Evidentiality and the inversion of front-and-back time in Andean Aymara' },
      { id: 'iii', text: 'Cardinal-direction orientation and the absence of ego-relative coordinates' },
      { id: 'iv', text: 'The decline of indigenous languages due to urban migration' },
      { id: 'v', text: 'Computational translation of Indo-European verb tenses' }
    ],
    questions: [
      {
        id: 'q-mh-14',
        questionNumber: 14,
        questionType: 'MATCHING_HEADINGS',
        stem: 'Paragraph A',
        correctAnswer: 'i',
        acceptedAnswers: ['i'],
        points: 2,
        grammarRule: 'Paragraph Gist synthesis (Orthodox universalist assumption)',
        explanationVi: 'Đoạn A giới thiệu giả định phổ quát truyền thống rằng mọi nền văn hóa đều hình dung tương lai ở phía trước và quá khứ ở phía sau -> Heading i.',
        explanationEn: 'Summarizes the traditional universalist assumption in cognitive psychology.'
      },
      {
        id: 'q-mh-15',
        questionNumber: 15,
        questionType: 'MATCHING_HEADINGS',
        stem: 'Paragraph B',
        correctAnswer: 'ii',
        acceptedAnswers: ['ii'],
        points: 2,
        grammarRule: 'Paragraph Gist synthesis (Aymara evidentiality & front/back inversion)',
        explanationVi: 'Đoạn B phân tích cách người Aymara ở dãy Andes đặt quá khứ đã chứng kiến ở phía trước mắt -> Heading ii.',
        explanationEn: 'Captures the Aymara inversion of past/future grounded in visual evidentiality.'
      },
      {
        id: 'q-mh-16',
        questionNumber: 16,
        questionType: 'MATCHING_HEADINGS',
        stem: 'Paragraph C',
        correctAnswer: 'iii',
        acceptedAnswers: ['iii'],
        points: 2,
        grammarRule: 'Paragraph Gist synthesis (Cardinal directions in Kuuk Thaayorre)',
        explanationVi: 'Đoạn C mô tả việc cộng đồng Kuuk Thaayorre định vị không gian - thời gian theo hướng Đông - Tây -> Heading iii.',
        explanationEn: 'Matches cardinal-direction reckoning in Kuuk Thaayorre.'
      }
    ]
  },
  {
    id: 'grp-error-correction',
    groupType: 'ERROR_CORRECTION_PASSAGE',
    title: 'Part 4: Error Correction Passage — Dual Inputs (Error Word → Correction)',
    instructions: 'Identify the erroneous word/phrase in each numbered line and provide its correction. Partial credit (50%) is awarded if you identify the exact error word.',
    stimulusTitle: 'The Myth of Purely Rational Markets',
    stimulusText: `Line 1 (Q8): Scarcely the central bank had announced quantitative tightening when speculative equities plunged.\nLine 2 (Q9): Neither the treasury secretary nor the commercial bankers was prepared for the liquidity freeze.\nLine 3 (Q10): Investors were advised to remain uninterested and objective when auditing their own portfolios.`,
    questions: [
      {
        id: 'q-err-8',
        questionNumber: 8,
        questionType: 'ERROR_CORRECTION',
        stem: 'Line 1: Scarcely the central bank had announced quantitative tightening when speculative equities plunged.',
        correctAnswer: 'the central bank had -> had the central bank',
        acceptedAnswers: ['the central bank had -> had the central bank', 'central bank had -> had the central bank'],
        points: 2,
        grammarRule: 'Negative Adverbial Inversion ("Scarcely + had + S + V3")',
        explanationVi: 'Sau "Scarcely" đứng đầu câu phải đảo trợ động từ "had" lên trước chủ ngữ "the central bank".',
        explanationEn: 'Fronted "Scarcely" requires subject-auxiliary inversion.'
      },
      {
        id: 'q-err-9',
        questionNumber: 9,
        questionType: 'ERROR_CORRECTION',
        stem: 'Line 2: Neither the treasury secretary nor the commercial bankers was prepared for the liquidity freeze.',
        correctAnswer: 'was -> were',
        acceptedAnswers: ['was -> were', 'was prepared -> were prepared'],
        points: 2,
        grammarRule: 'Proximity Concord ("Neither A nor B + V_B")',
        explanationVi: 'Trong cấu trúc "Neither A nor B", động từ chia theo chủ ngữ gần nhất ("the commercial bankers" số nhiều) -> sửa "was" thành "were".',
        explanationEn: 'Verb agrees in number with the closer subject "the commercial bankers" (plural).'
      },
      {
        id: 'q-err-10',
        questionNumber: 10,
        questionType: 'ERROR_CORRECTION',
        stem: 'Line 3: Investors were advised to remain uninterested and objective when auditing their own portfolios.',
        correctAnswer: 'uninterested -> disinterested',
        acceptedAnswers: ['uninterested -> disinterested'],
        points: 2,
        grammarRule: 'Confusable C2 Lexis ("disinterested" vs. "uninterested")',
        explanationVi: '"Uninterested" = thờ ơ; trong khi ngữ cảnh đi cùng "objective" (khách quan, không vụ lợi) đòi hỏi "disinterested".',
        explanationEn: '"Disinterested" means impartial/objective, whereas "uninterested" means bored.'
      }
    ]
  },
  {
    id: 'grp-sentence-transform',
    groupType: 'SENTENCE_TRANSFORM',
    title: 'Part 5: Sentence Transformation (Parenthetical & Slash Expansion Engine)',
    instructions: 'Complete the second sentence using the keyword. Supports optional parenthetical fragments like "(just)" and slash variations like "Under/In".',
    questions: [
      {
        id: 'q-st-17',
        questionNumber: 17,
        questionType: 'SENTENCE_TRANSFORM',
        stem: 'Immediately after I arrived at the summit venue, the opening keynote began. (SOONER)',
        givenWord: 'SOONER',
        promptPrefix: 'No sooner',
        correctAnswer: 'No sooner had I (just) arrived at the summit venue than the opening keynote began.',
        acceptedAnswers: ['No sooner had I (just) arrived (at the summit venue) than the opening keynote began.'],
        points: 2,
        grammarRule: 'Negative Inversion ("No sooner had I (just) arrived ... than ...")',
        explanationVi: 'Hỗ trợ kiểm tra expandOptionalFragments: Chấp nhận cả "No sooner had I arrived..." và "No sooner had I just arrived...".',
        explanationEn: 'Demonstrates expandOptionalFragments() supporting optional parenthetical "(just)" and "(at the summit venue)".'
      },
      {
        id: 'q-st-18',
        questionNumber: 18,
        questionType: 'SENTENCE_TRANSFORM',
        stem: 'Whatever happens, you must never reveal the master password to outsiders. (CIRCUMSTANCES)',
        givenWord: 'CIRCUMSTANCES',
        promptPrefix: 'Under no',
        correctAnswer: 'Under/In no circumstances must/should you (ever) reveal the master password to outsiders.',
        acceptedAnswers: ['Under/In no circumstances must/should/are you (ever) (to) reveal the master password (to outsiders).'],
        points: 2,
        grammarRule: 'Slash & Parenthetical Expansion ("Under/In no circumstances must/should you (ever)...")',
        explanationVi: 'Hỗ trợ đồng thời biến thể dấu gạch chéo (Under/In, must/should) và từ tùy chọn trong ngoặc đơn "(ever)".',
        explanationEn: 'Supports both slash alternatives (Under/In, must/should) and optional parenthetical "(ever)".'
      }
    ]
  }
];

export default function SpecializedGroupsLabView({ onSaveVocab }) {
  const [groups, setGroups] = useState(DEFAULT_SPECIALIZED_GROUPS);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealedQuestions, setRevealedQuestions] = useState({});
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const [patternDemoInput, setPatternDemoInput] = useState('No sooner had I (just) arrived (at the station) than the train left/departed.');

  useEffect(() => {
    fetch('/api/prisma/exams')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const loadedGroups = [];
          (data[0].sections || []).forEach(sec => {
            (sec.questionGroups || []).forEach(g => {
              loadedGroups.push(g);
            });
          });
          if (loadedGroups.length > 0) {
            setGroups(loadedGroups);
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentGroup = groups[activeGroupIdx] || groups[0];
  const expandedDemoList = expandOptionalFragments(patternDemoInput);

  const handleFillSampleCorrectAnswers = () => {
    const next = { ...answers };
    (currentGroup.questions || []).forEach(q => {
      if (q.questionType === 'ERROR_CORRECTION') {
        const parts = q.correctAnswer.split('->').map(s => s.trim());
        next[q.id] = { errorWord: parts[0] || '', correction: parts[1] || '' };
      } else {
        const exp = expandOptionalFragments(q.correctAnswer);
        next[q.id] = exp[0] || q.correctAnswer;
      }
    });
    setAnswers(next);
    setShowAllSolutions(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
            <Database className="w-3.5 h-3.5" />
            4-TIER PRISMA SCHEMA & SPECIALIZED QUESTION GROUP RENDERERS
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">
            Trình Hiển Thị Đa Định Dạng Chuyên Anh & Grading Engine (`lib/grading-engine.ts`)
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Tự động chuyển đổi giao diện theo <code>group.groupType</code>: Inline <code>{'{{questionNumber}}'}</code> Inputs, Gapped Text (Paragraph Bank A–H), Matching Headings (Dropdown i–x) và Error Correction (Dual Input).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleFillSampleCorrectAnswers}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Điền Đáp Án Mẫu & Chấm Thử
          </button>
          <button
            type="button"
            onClick={() => setShowAllSolutions(!showAllSolutions)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Eye className="w-4 h-4" />
            {showAllSolutions ? 'Ẩn Giải Thích' : 'Hiện Toàn Bộ Giải Thích'}
          </button>
        </div>
      </div>

      {/* Group Type Switcher Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {groups.map((g, idx) => (
          <button
            key={g.id || idx}
            type="button"
            onClick={() => {
              setActiveGroupIdx(idx);
              setShowAllSolutions(false);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeGroupIdx === idx
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            [{g.groupType}] {g.title.split(':')[0]}
          </button>
        ))}
      </div>

      {/* Dynamic QuestionGroupRenderer Component */}
      {currentGroup && (
        <QuestionGroupRenderer
          group={currentGroup}
          answers={answers}
          onAnswerChange={(qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }))}
          showSolutions={showAllSolutions}
          revealedQuestions={revealedQuestions}
          onToggleReveal={qId => setRevealedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }))}
          onSaveVocabCard={item => {
            if (onSaveVocab) {
              onSaveVocab({
                term: item.term,
                type: item.category,
                definition_en: item.definitionEn,
                definition_vi: item.definitionVi,
                example: item.exampleSentence || '',
                source_exam: '4-Tier Specialized Exam'
              });
            }
          }}
        />
      )}

      {/* Live Grading Engine Pattern Expansion Inspector */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500">
          <Code2 className="w-4 h-4" />
          Live Inspector: <code>expandOptionalFragments(pattern)</code> in <code>lib/grading-engine.ts</code>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Nhập mẫu đáp án có chứa từ tùy chọn trong ngoặc đơn <code>(optional)</code> và dấu gạch chéo <code>a/b</code> để xem toàn bộ các biến thể đáp án được Grading Engine chấp nhận tự động:
        </p>
        <input
          type="text"
          value={patternDemoInput}
          onChange={e => setPatternDemoInput(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
          {expandedDemoList.map((variant, i) => (
            <div
              key={i}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-mono text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
            >
              <span className="font-bold">#{i + 1}</span>
              <span>{variant}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
