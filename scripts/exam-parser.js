const cheerio = require('cheerio');

/**
 * C1/C2 Linguistic Knowledge Base for Automatic Explanation Synthesis
 * Used when raw exam files only contain an Answer Key (Đáp án) without detailed explanations.
 */
const C2_LINGUISTIC_KNOWLEDGE_BASE = {
  // Idioms & Collocations
  'heart': {
    rule: 'C1/C2 Idiom ("have a heart of gold")',
    vi: 'Thành ngữ "have a heart of gold" (có tấm lòng nhân hậu, tốt bụng) tạo sự tương phản ngữ nghĩa hoàn hảo với vẻ ngoài cộc cằn/nghiêm nghị.',
    en: '"Have a heart of gold" is an idiomatic expression meaning to have a genuinely kind and generous nature beneath an austere exterior.'
  },
  'shoestring': {
    rule: 'C1/C2 Financial Idiom ("on a shoestring")',
    vi: 'Thành ngữ "on a shoestring (budget)" = sống hoặc vận hành công việc với ngân sách vô cùng eo hẹp, ít ỏi.',
    en: '"On a shoestring" means using very little money or operating on an extremely tight budget.'
  },
  'wrong-footed': {
    rule: 'C2 Compound Verb ("wrong-foot somebody")',
    vi: 'Động từ "wrong-foot (sb)" = làm đối phương bất ngờ, trở tay không kịp và rơi vào thế bị động lúng túng.',
    en: '"To wrong-foot someone" means to catch them off guard or place them in an awkward, defensive position.'
  },
  'tooth': {
    rule: 'C2 Idiom ("fight tooth and nail")',
    vi: 'Thành ngữ "fight tooth and nail" = chiến đấu/bảo vệ quyết liệt bằng mọi giá.',
    en: '"Tooth and nail" means engaging in fierce, relentless struggle using every available resource.'
  },
  'grain': {
    rule: 'C2 Idiom ("go against the grain" / "take with a grain of salt")',
    vi: 'Thành ngữ "go against the grain" = trái với bản chất/nguyên tắc tự nhiên; hoặc "take sth with a grain/pinch of salt" = bán tín bán nghi, tiếp nhận một cách dè dặt.',
    en: 'Tests fixed idiomatic collocation with "grain" in formal/academic contexts.'
  },
  'par': {
    rule: 'C2 Idiom ("below par / up to par / on a par with")',
    vi: 'Cụm "on a par with" (ngang tầm với) hoặc "below par" (dưới mức tiêu chuẩn/sức khỏe kém) là cấu trúc C1/C2 rất phổ biến trong đề HSGQG & Olympic 30/4.',
    en: 'Idiomatic prepositional phrase indicating equivalence in quality or standard ("on a par with").'
  },
  'chords': {
    rule: 'C1/C2 Idiom ("strike a chord")',
    vi: 'Thành ngữ "strike a chord (with sb)" = chạm đến trái tim, tạo sự đồng cảm sâu sắc với người nghe.',
    en: '"Strike a chord" means to evoke a strong emotional response or resonance.'
  },
  'chord': {
    rule: 'C1/C2 Idiom ("strike a chord")',
    vi: 'Thành ngữ "strike a chord (with sb)" = khơi dậy sự đồng cảm sâu sắc.',
    en: '"Strike a chord" means to resonate emotionally or intellectually with an audience.'
  },
  'umbra': {
    rule: 'C2 Collocation ("take umbrage at")',
    vi: 'Cụm cố định "take umbrage at sth" = cảm thấy bị xúc phạm, phật ý nặng nề trước lời nói/hành động nào đó.',
    en: '"To take umbrage at" means to take offense or feel resentment promptly.'
  },
  'umbrage': {
    rule: 'C2 Collocation ("take umbrage at")',
    vi: 'Cụm cố định "take umbrage at sth" = cảm thấy bị xúc phạm, tự ái, phật lòng.',
    en: '"Take umbrage at" is a high-register C2 idiom meaning to feel offended or annoyed.'
  },
  'watershed': {
    rule: 'C1/C2 Metaphorical Collocation ("watershed moment / event")',
    vi: '"A watershed moment/year/event" = bước ngoặt lịch sử, cột mốc làm thay đổi hoàn toàn cục diện.',
    en: 'A critical turning point after which a situation or domain is permanently transformed.'
  },
  'lip': {
    rule: 'C1/C2 Idiom ("pay lip service to")',
    vi: 'Thành ngữ "pay lip service to sth" = chỉ ủng hộ/hứa hẹn đầu môi chót lưỡi chứ không hành động thực chất.',
    en: '"Pay lip service to" means to express approval or support insincerely without taking action.'
  },
  'cast': {
    rule: 'C1/C2 Collocation ("cast doubt on / cast aspersions on")',
    vi: 'Collocation "cast doubt on" (dấy lên nghi ngờ) hoặc "cast aspersions on" (buông lời gièm pha, bôi nhọ uy tín).',
    en: 'High-frequency C2 verb-noun collocation using "cast".'
  },
  'aspersions': {
    rule: 'C2 Idiomatic Collocation ("cast aspersions on")',
    vi: 'Cụm cố định "cast aspersions on sb/sth" = gièm pha, vu khống, hạ thấp danh dự của ai.',
    en: '"To cast aspersions on" means to attack or question someone’s integrity or reputation.'
  },
  'reconcile': {
    rule: 'C1/C2 Verb Pattern ("reconcile oneself to / reconcile A with B")',
    vi: 'Cấu trúc "reconcile A with B" (dung hòa hai yếu tố mâu thuẫn) hoặc "reconcile oneself to sth" (chấp nhận một thực tế khó khăn).',
    en: 'Requires reconciling two seemingly incompatible concepts or accepting an unwelcome truth.'
  }
};

/**
 * Automatically finds the best matching sentence in a passage/transcript for a question stem + answer.
 */
function findBestEvidenceSentence(textBlock = '', stem = '', answer = '') {
  if (!textBlock || !textBlock.trim()) return '';
  const cleanPassage = textBlock.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = cleanPassage.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 15);
  if (sentences.length === 0) return '';

  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'with', 'from', 'this', 'what', 'which', 'when', 'where',
    'according', 'passage', 'author', 'speaker', 'does', 'not', 'are', 'was', 'were', 'have', 'has'
  ]);
  const keywords = `${stem} ${answer}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));

  let bestSent = sentences[0];
  let bestScore = -1;

  for (const sent of sentences) {
    const lowerSent = sent.toLowerCase();
    let score = 0;
    if (answer && answer.length > 3 && lowerSent.includes(answer.toLowerCase())) {
      score += 5;
    }
    for (const kw of keywords) {
      if (lowerSent.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestSent = sent;
    }
  }
  return bestSent;
}

/**
 * Synthesizes a rich C1/C2 bilingual explanation when only an Answer Key is provided.
 */
function synthesizeDeepExplanation({ qType, stem, options = [], answer, rootWord, keyword, tournament = 'HSGQG', manualExplanation = '' }) {
  const ansText = String(answer || '').trim();
  const chosenOpt = options.find(o => String(o.id).toUpperCase() === ansText.toUpperCase());
  const lexicalTarget = chosenOpt ? chosenOpt.text.trim() : ansText;
  const lowerTarget = lexicalTarget.toLowerCase();

  // Check if our C2 knowledge base has a specific entry for the target word or stem
  let kbMatch = C2_LINGUISTIC_KNOWLEDGE_BASE[lowerTarget];
  if (!kbMatch) {
    for (const [k, val] of Object.entries(C2_LINGUISTIC_KNOWLEDGE_BASE)) {
      if (lowerTarget.includes(k) || stem.toLowerCase().includes(k)) {
        kbMatch = val;
        break;
      }
    }
  }

  // Synthesize rule & explanations based on syntactic cues in the stem
  let rule = kbMatch?.rule || 'C1/C2 Lexico-Grammar & Collocation Precision';
  let vi = manualExplanation || kbMatch?.vi || '';
  let en = kbMatch?.en || '';

  if (qType === 'mcq') {
    if (/\b(No sooner|Hardly|Scarcely|Barely|Seldom|Rarely|Never before|Little did|Not only|Not until|Only after|Only by|Under no circumstances)\b/i.test(stem + ' ' + lexicalTarget)) {
      rule = 'Negative / Restrictive Adverbial Inversion (Đảo ngữ C1/C2)';
      if (!vi) vi = `Đáp án đúng là ${ansText} ("${lexicalTarget}"). Câu kiểm tra cấu trúc Đảo ngữ với trạng từ phủ định/hạn chế đứng đầu câu (Negative/Restrictive Inversion): Trợ động từ phải đảo lên trước Chủ ngữ.`;
      if (!en) en = `Option ${ansText} ("${lexicalTarget}") satisfies the subject-auxiliary inversion triggered by the fronted negative/restrictive expression.`;
    } else if (/\b(lest|insist that|imperative that|essential that|vital that|demand that|recommend that)\b/i.test(stem + ' ' + lexicalTarget)) {
      rule = 'Mandative Subjunctive Mood (Bàng thái cách C2)';
      if (!vi) vi = `Đáp án đúng là ${ansText} ("${lexicalTarget}"). Cấu trúc Bàng thái cách (Subjunctive Mood) sau các động từ/tính từ mang tính đề xuất, bắt buộc hoặc liên từ "lest" đòi hỏi động từ nguyên thể không chia (bare infinitive).`;
      if (!en) en = `Option ${ansText} ("${lexicalTarget}") correctly employs the mandative subjunctive mood required in formal C2 register.`;
    } else if (/\b(Had it not|Were it not|But for|Should you|Were he|Had the)\b/i.test(stem + ' ' + lexicalTarget)) {
      rule = 'Inverted Conditional Clause (Đảo ngữ Câu điều kiện)';
      if (!vi) vi = `Đáp án đúng là ${ansText} ("${lexicalTarget}"). Cấu trúc đảo ngữ câu điều kiện nâng cao giúp lược bỏ "if" và nhấn mạnh giả thiết trong văn phong học thuật.`;
      if (!en) en = `Option ${ansText} ("${lexicalTarget}") forms a grammatically sound inverted conditional structure.`;
    } else {
      if (!vi) vi = `Đáp án đúng là ${ansText} ("${lexicalTarget}"). Trong ngữ cảnh học thuật C1/C2 của đề thi ${tournament}, "${lexicalTarget}" là phương án duy nhất kết hợp chuẩn xác về mặt Collocation (kết hợp từ) và sắc thái nghĩa (register).`;
      if (!en) en = `Option ${ansText} ("${lexicalTarget}") is the only choice that satisfies both the collocational constraints and C1/C2 register of the sentence.`;
    }

    const optionAnalysis = {};
    options.forEach(opt => {
      if (String(opt.id).toUpperCase() === ansText.toUpperCase()) {
        optionAnalysis[opt.id] = `Correct: "${opt.text}" fits the exact syntactic, idiomatic, and collocational context of the sentence.`;
      } else {
        optionAnalysis[opt.id] = `Distractor: "${opt.text}" creates a collocational mismatch or fails to convey the required C1/C2 nuance in this context.`;
      }
    });

    return {
      rule,
      vi,
      en,
      optionAnalysis,
      vocabItem: {
        term: lexicalTarget,
        type: rule.includes('Idiom') ? 'C2 Idiom' : 'C1/C2 Collocation / Structure',
        phonetic: '',
        definition_en: en,
        definition_vi: vi,
        example: stem.replace(/_{2,}|\.{3,}/g, lexicalTarget)
      }
    };
  }

  if (qType === 'word_formation') {
    const prefixHasNeg = /^(un|in|im|ir|il|dis|mis|non|mal)/i.test(ansText);
    const isAdv = /ly$/i.test(ansText);
    const isNoun = /(tion|sion|ment|ness|ity|ism|ery|ance|ence|ship|cy)$/i.test(ansText);
    rule = `Morphological Derivation from "${rootWord}" (${prefixHasNeg ? 'Negative Prefix + ' : ''}${isAdv ? 'Adverb' : isNoun ? 'Abstract Noun' : 'Derived Form'})`;
    if (!vi) {
      vi = `Từ gốc "${rootWord}" cần biến đổi hình thái thành "${ansText}" (${prefixHasNeg ? 'mang tiền tố phủ định/ngược nghĩa, ' : ''}${isAdv ? 'đóng vai trò trạng từ bổ nghĩa' : isNoun ? 'đóng vai trò danh từ trừu tượng' : 'đóng vai trò tính từ/động từ học thuật'}) để khớp với cấu trúc ngữ pháp và mạch nghĩa của câu.`;
    }
    if (!en) {
      en = `Derive "${ansText}" from root "${rootWord}" to satisfy both the syntactic slot and semantic polarity of the clause.`;
    }
    return {
      rule,
      vi,
      en,
      vocabItem: {
        term: `${ansText} (< ${rootWord})`,
        type: 'Word Formation',
        phonetic: '',
        definition_en: `C1/C2 morphological derivative of ${rootWord}: "${ansText}".`,
        definition_vi: `Từ phái sinh C1/C2 của ${rootWord}: "${ansText}".`,
        example: stem.replace(/_{2,}/g, ansText)
      }
    };
  }

  if (qType === 'error_identification') {
    rule = 'C1/C2 Error Identification (Syntactic Concord, Parallelism & Confusable Lexis)';
    if (!vi) {
      vi = `Lỗi sai và phần sửa chuẩn là: "${ansText}". Câu kiểm tra sự hòa hợp chủ ngữ - vị ngữ, cấu trúc song song hoặc cặp từ dễ gây nhầm lẫn (confusable words) trong đề thi ${tournament}.`;
    }
    if (!en) {
      en = `Identify and correct the erroneous segment using "${ansText}" to restore grammatical and lexical precision.`;
    }
    return { rule, vi, en };
  }

  if (qType === 'open_cloze') {
    rule = `Open Cloze Structural & Idiomatic Filler ("${ansText}")`;
    if (!vi) {
      vi = `Từ cần điền vào chỗ trống là "${ansText}". Đây là từ chức năng / thành phần cố định trong cụm liên từ, đại từ quan hệ hoặc giới từ học thuật C1/C2 nối mạch đoạn văn.`;
    }
    if (!en) {
      en = `"${ansText}" is required to complete the grammatical collocation and discourse cohesion of the passage.`;
    }
    return { rule, vi, en };
  }

  if (qType === 'sentence_transformation') {
    rule = keyword ? `C1/C2 Keyword Transformation (${keyword})` : 'Structural & Idiomatic Sentence Transformation';
    if (!vi) {
      vi = `Câu viết lại chuẩn C1/C2${keyword ? ` sử dụng từ khóa "${keyword}"` : ''}: "${ansText}". Cấu trúc đảm bảo giữ nguyên 100% sắc thái nghĩa của câu gốc bằng văn phong trang trọng.`;
    }
    if (!en) {
      en = `Maintains strict semantic equivalence with the source sentence using the C1/C2 structure "${ansText}".`;
    }
    return {
      rule,
      vi,
      en,
      vocabItem: keyword ? {
        term: `${keyword} — ${ansText.slice(0, 55)}...`,
        type: 'Sentence Transformation Pattern',
        definition_en: `Transformation structure using ${keyword}.`,
        definition_vi: `Cấu trúc viết lại câu nâng cao với từ khóa ${keyword}.`,
        example: ansText
      } : undefined
    };
  }

  return {
    rule: 'Reading / Listening Comprehension & Paraphrase Mapping',
    vi: vi || `Đáp án chính xác là "${ansText}". Thông tin trong câu hỏi được paraphrase trực tiếp từ dẫn chứng trong bài đọc/nghe.`,
    en: en || `The correct answer "${ansText}" is directly supported by the paraphrased evidence in the text.`
  };
}

function detectMetadata(rawText, overrides = {}) {
  const upper = rawText.toUpperCase();
  let tournament = overrides.tournament || '';
  if (!tournament) {
    if (upper.includes('DUYÊN HẢI') || upper.includes('DHBB') || upper.includes('ĐỒNG BẰNG BẮC BỘ')) {
      tournament = 'DHBB';
    } else if (upper.includes('HÙNG VƯƠNG') || upper.includes('SUMMER CAMP')) {
      tournament = 'Trại hè Hùng Vương';
    } else if (upper.includes('30/4') || upper.includes('30 THÁNG 4') || upper.includes('APRIL 30') || upper.includes('30-4')) {
      tournament = 'Olympic 30/4';
    } else if (upper.includes('CHỌN ĐỘI TUYỂN') || upper.includes('PROVINCIAL')) {
      tournament = 'Đề Chọn Đội Tuyển';
    } else {
      tournament = 'HSGQG';
    }
  }

  const yearMatch = rawText.match(/\b(201[5-9]|202[0-6])\b/);
  const year = overrides.year ? Number(overrides.year) : (yearMatch ? Number(yearMatch[1]) : 2025);

  let province_school = overrides.province_school || '';
  if (!province_school) {
    const schoolMatch = rawText.match(/(?:THPT Chuyên|Trường THPT Chuyên|Sở GD&ĐT)\s+([^\n\r\-–()]+)/i);
    if (schoolMatch) {
      province_school = `THPT Chuyên ${schoolMatch[1].trim()}`;
    } else if (tournament === 'HSGQG') {
      province_school = 'Bộ Giáo dục và Đào tạo (MOET)';
    } else if (tournament === 'Olympic 30/4') {
      province_school = 'THPT Chuyên Lê Hồng Phong TP.HCM';
    } else if (tournament === 'DHBB') {
      province_school = 'Hội các trường THPT Chuyên vùng DH&ĐBBB';
    } else {
      province_school = 'THPT Chuyên Quốc Gia';
    }
  }

  const timeMatch = rawText.match(/(\d{2,3})\s*(?:phút|minutes|mins)/i);
  const duration_minutes = overrides.duration_minutes
    ? Number(overrides.duration_minutes)
    : (timeMatch ? Number(timeMatch[1]) : 180);

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const titleLine = lines.find(l => l.length > 10 && !l.startsWith('Audio:') && !l.startsWith('SECTION')) || `${tournament} Official Practice Test ${year}`;
  const title = overrides.title || (titleLine.length < 120 ? titleLine : `${tournament} ${year} — ${province_school}`);

  return {
    title,
    tournament,
    year,
    province_school,
    grade_level: overrides.grade_level || 'Chuyên 11-12',
    duration_minutes,
    difficulty: overrides.difficulty || 'C1-C2'
  };
}

/**
 * Full Multi-Section Exam Parser & C1/C2 Explanation Synthesizer
 */
function parseRawTextToExam(rawText, overrides = {}) {
  const cleanText = (rawText || '').replace(/\r\n/g, '\n').trim();
  const meta = detectMetadata(cleanText, overrides);

  const examId = overrides.id || `ingested-${meta.tournament.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 5)}`;

  // 1. Extract Answer Keys & Optional Explanations from bottom Answer Key block
  // Supports: "Key #1: A", "Key #L1: metabolic constraints", "1. A", "L1. metabolic constraints"
  const answerMap = {};
  const explanationMap = {};

  const keyRegex = /(?:Answer|Key|Đáp án)\s*(?:for\s*)?#?([A-Za-z0-9_-]+)\s*[:=-]\s*([^\n|]+)(?:\|\s*(?:Explanation|Giải thích)\s*[:=-]\s*([^\n]+))?/gi;
  let km;
  while ((km = keyRegex.exec(cleanText)) !== null) {
    const qKey = km[1].trim().toUpperCase();
    answerMap[qKey] = km[2].trim();
    if (km[3]) explanationMap[qKey] = km[3].trim();
  }

  // Also parse compact Answer Key tables like "1. A | 2. B | 3. C" or "L1: text" inside an ANSWER KEY section
  const keySectionMatch = cleanText.match(/(?:ANSWER KEY|ĐÁP ÁN|KEY AND EXPLANATION)[\s\S]*$/i);
  if (keySectionMatch) {
    const keyBlock = keySectionMatch[0];
    const bareKeyRegex = /(?:^|\n|\|)\s*([A-Z]{0,3}\d{1,2})\s*[.:=-]\s*([^\n|]+)/g;
    let bkm;
    while ((bkm = bareKeyRegex.exec(keyBlock)) !== null) {
      const kId = bkm[1].trim().toUpperCase();
      const kVal = bkm[2].trim();
      if (!answerMap[kId]) {
        answerMap[kId] = kVal;
      }
    }
  }

  // Remove the ANSWER KEY block from the body before scanning questions so key lines aren't misread
  const bodyWithoutKey = cleanText.replace(/\n\s*(?:===+\s*)?(?:ANSWER KEY|ĐÁP ÁN CHÍNH THỨC|BẢNG ĐÁP ÁN)[\s\S]*$/i, '');

  // 2. Extract LISTENING Section (Audio Link + Transcript + Listening Questions L1, L2...)
  const audioUrlMatch = bodyWithoutKey.match(/(?:Audio(?:\s*URL|\s*Link)?)\s*:\s*(\S+)/i);
  const extractedAudioUrl = audioUrlMatch ? audioUrlMatch[1].trim() : '';

  const transcriptMatch = bodyWithoutKey.match(/Transcript\s*:\s*([\s\S]+?)(?=\n\s*(?:L\d+[.)]|Question|SECTION|II\.|PART|Reading|Lexico))/i);
  const extractedTranscript = transcriptMatch
    ? transcriptMatch[1].trim()
    : `Professor: Welcome to today's advanced seminar on Cognitive Epistemology and Linguistic Determinism. While popular psychology often peddles a simplistic view of neural adaptation, empirical neurobiology reveals that adult cortical reorganization is governed by stringent metabolic constraints. Specifically, synaptic pruning during late adolescence consolidates high-efficiency pathways while discarding redundant neural circuitry.`;

  const listeningQuestions = [];
  const listNoteRegex = /(?:^|\n)\s*L(\d{1,2})[.)]\s*([^\n]+)/g;
  let lm;
  while ((lm = listNoteRegex.exec(bodyWithoutKey)) !== null) {
    const lNum = lm[1];
    const stem = lm[2].trim();
    const keyId = `L${lNum}`;
    const ans = answerMap[keyId] || answerMap[lNum] || 'metabolic constraints';
    const evidenceQuote = findBestEvidenceSentence(extractedTranscript, stem, ans);
    const explanation = synthesizeDeepExplanation({
      qType: 'note_completion',
      stem,
      answer: ans,
      tournament: meta.tournament,
      manualExplanation: explanationMap[keyId] || explanationMap[lNum]
    });

    listeningQuestions.push({
      id: `${examId}-l${lNum}`,
      number: Number(lNum),
      type: 'note_completion',
      maxWords: 3,
      stem,
      answer: ans,
      acceptedAnswers: [ans.toLowerCase()],
      evidenceQuote,
      points: 2,
      explanation
    });
  }

  if (listeningQuestions.length === 0) {
    const defaultAns = 'metabolic constraints';
    listeningQuestions.push({
      id: `${examId}-l1`,
      number: 1,
      type: 'note_completion',
      maxWords: 3,
      stem: 'Adult cortical reorganization is regulated by strict _______.',
      answer: defaultAns,
      acceptedAnswers: ['metabolic constraints', 'stringent metabolic constraints'],
      evidenceQuote: findBestEvidenceSentence(extractedTranscript, 'Adult cortical reorganization', defaultAns),
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'note_completion',
        stem: 'Adult cortical reorganization is regulated by strict _______.',
        answer: defaultAns,
        tournament: meta.tournament
      })
    });
  }

  // 3. Extract LEXICO-GRAMMAR:
  // 3a. Multiple Choice (MCQs)
  const mcqQuestions = [];
  const mcqBlockRegex = /(?:^|\n)\s*(?:Question\s*|Q)?(\d{1,2})[.)]\s+([^\n]+)\n\s*A[.)]\s*([^\n\t]+?)(?:\s+B[.)]\s*|\n\s*B[.)]\s*)([^\n\t]+?)(?:\s+C[.)]\s*|\n\s*C[.)]\s*)([^\n\t]+?)(?:\s+D[.)]\s*|\n\s*D[.)]\s*)([^\n]+)/gi;
  let m;
  while ((m = mcqBlockRegex.exec(bodyWithoutKey)) !== null) {
    const num = m[1];
    const stem = m[2].trim();
    const optA = m[3].trim();
    const optB = m[4].trim();
    const optC = m[5].trim();
    const optD = m[6].trim();
    const rawAns = (answerMap[`Q${num}`] || answerMap[num] || 'A').toUpperCase();
    const ansLetter = ['A', 'B', 'C', 'D'].includes(rawAns[0]) ? rawAns[0] : 'A';
    const options = [
      { id: 'A', text: optA },
      { id: 'B', text: optB },
      { id: 'C', text: optC },
      { id: 'D', text: optD }
    ];

    const explanation = synthesizeDeepExplanation({
      qType: 'mcq',
      stem,
      options,
      answer: ansLetter,
      tournament: meta.tournament,
      manualExplanation: explanationMap[`Q${num}`] || explanationMap[num]
    });

    mcqQuestions.push({
      id: `${examId}-mcq-${num}`,
      number: Number(num),
      type: 'mcq',
      stem,
      options,
      answer: ansLetter,
      points: 1,
      explanation
    });
  }

  // 3b. Word Formation (WF1, WF2...)
  const wfQuestions = [];
  const wfRegex = /(?:^|\n)\s*(?:WF|WordForm)\s*(\d{1,2})[.)]\s*([^\n(]+?)\(\s*([A-Z]{3,20})\s*\)([^\n]*)/gi;
  let wfMatch;
  while ((wfMatch = wfRegex.exec(bodyWithoutKey)) !== null) {
    const num = wfMatch[1];
    const before = wfMatch[2].trim();
    const rootWord = wfMatch[3].trim().toUpperCase();
    let after = wfMatch[4].trim();

    let inlineAns = '';
    after = after.replace(/(?:->|=>|Answer:|Key:)\s*([a-zA-Z\-]+)/i, (_, a) => {
      inlineAns = a.trim();
      return '';
    }).trim();

    const keyId = `WF${num}`;
    const finalAns = (inlineAns || answerMap[keyId] || answerMap[num] || rootWord.toLowerCase()).trim();
    const fullStem = `${before} (${rootWord}) ${after}`.trim();

    wfQuestions.push({
      id: `${examId}-wf-${num}`,
      number: 20 + Number(num),
      type: 'word_formation',
      stem: fullStem,
      rootWord,
      answer: finalAns.toLowerCase(),
      acceptedAnswers: [finalAns.toLowerCase()],
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'word_formation',
        stem: fullStem,
        answer: finalAns.toLowerCase(),
        rootWord,
        tournament: meta.tournament,
        manualExplanation: explanationMap[keyId]
      })
    });
  }

  // 3c. Error Identification (ERR1, ERR2...)
  const errQuestions = [];
  const errRegex = /(?:^|\n)\s*(?:ERR|Error)\s*(\d{1,2})[.)]\s*([^\n]+)/gi;
  let erm;
  while ((erm = errRegex.exec(bodyWithoutKey)) !== null) {
    const num = erm[1];
    const stem = erm[2].trim();
    const keyId = `ERR${num}`;
    const ans = (answerMap[keyId] || 'A').trim();
    const accepted = [ans.toLowerCase()];
    if (ans.includes('->')) {
      const parts = ans.split('->').map(s => s.trim().toLowerCase());
      accepted.push(parts[0], parts[1], `${parts[0]} -> ${parts[1]}`);
    }

    errQuestions.push({
      id: `${examId}-err-${num}`,
      number: 30 + Number(num),
      type: 'word_formation',
      rootWord: 'ERROR CORRECTION',
      stem: `[Error Identification] Identify the erroneous word/phrase and provide the correction (format: wrong -> right): ${stem}`,
      answer: ans,
      acceptedAnswers: accepted,
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'error_identification',
        stem,
        answer: ans,
        tournament: meta.tournament,
        manualExplanation: explanationMap[keyId]
      })
    });
  }

  // 3d. Open Cloze Passage & Questions (OC1, OC2... or [[OC1]])
  const openClozeMatch = bodyWithoutKey.match(/OPEN CLOZE PASSAGE\s*:\s*([\s\S]+?)(?=\n\s*(?:SECTION|III\.|READING PASSAGE|ST\d|WRITING|$))/i);
  let openClozePart = null;
  if (openClozeMatch) {
    let rawCloze = openClozeMatch[1].trim();
    const ocQuestions = [];
    // Normalize (OC1) or [[OC1]] or (1) ___ into [[41]], [[42]]...
    let blankIdx = 0;
    const normalizedPassage = rawCloze.replace(/\[\[(?:OC)?(\d+)\]\]|\((?:OC)?(\d+)\)\s*_{2,}/gi, (full, g1, g2) => {
      blankIdx++;
      const origNum = g1 || g2 || blankIdx;
      const displayNum = 40 + Number(origNum);
      const keyId = `OC${origNum}`;
      const ans = (answerMap[keyId] || answerMap[origNum] || 'but').trim();
      ocQuestions.push({
        id: `${examId}-oc-${origNum}`,
        number: displayNum,
        blankNumber: displayNum,
        type: 'open_cloze',
        stem: `Open Cloze Blank (${displayNum})`,
        answer: ans,
        acceptedAnswers: ans.split('/').map(s => s.trim().toLowerCase()),
        evidenceQuote: `[[${displayNum}]]`,
        points: 2,
        explanation: synthesizeDeepExplanation({
          qType: 'open_cloze',
          stem: `Open Cloze Blank (${displayNum})`,
          answer: ans,
          tournament: meta.tournament,
          manualExplanation: explanationMap[keyId]
        })
      });
      return `[[${displayNum}]]`;
    });

    if (ocQuestions.length > 0) {
      openClozePart = {
        id: `${examId}-read-oc`,
        title: 'Part 1: Open Cloze (Structural & Collocational Gap-Fill)',
        instructions: 'Fill each numbered blank in the passage with ONE suitable word.',
        passageTitle: 'Academic Open Cloze Extract',
        passage: normalizedPassage,
        questions: ocQuestions
      };
    }
  }

  // 4. Extract READING Passage + Questions (R1, R2...)
  const readingPassageMatch = bodyWithoutKey.match(/READING PASSAGE\s*:\s*([\s\S]+?)(?=\n\s*(?:R\d+[.)]|SECTION|IV\.|ST\d|WRITING|$))/i);
  const extractedReadingPassage = readingPassageMatch
    ? readingPassageMatch[1]
        .trim()
        .split(/\n{2,}/)
        .map((p, i) => `<p id="p${i + 1}">${p.trim()}</p>`)
        .join('\n')
    : `<p id="p1">In the contemporary technocratic landscape, predictive algorithms have transitioned from auxiliary decision-support tools to de facto arbiters of public policy. Proponents frequently extol algorithmic governance for its ostensible impartiality, positing that mathematical models purge administrative adjudication of human caprice and cognitive bias. Yet this techno-optimistic narrative obscures a profound epistemological fallacy: algorithms do not inhabit a normative vacuum; rather, they institutionalize the historical contingencies embedded within their training corpora.</p>`;

  const readingQuestions = [];
  const readTfngRegex = /(?:^|\n)\s*R(\d{1,2})[.)]\s*\[?(TRUE\/FALSE\/NOT GIVEN|TFNG)\]?\s*([^\n]+)/gi;
  let rtm;
  while ((rtm = readTfngRegex.exec(bodyWithoutKey)) !== null) {
    const rNum = rtm[1];
    const stem = rtm[3].trim();
    const keyId = `R${rNum}`;
    const ans = (answerMap[keyId] || 'TRUE').toUpperCase();
    const evidenceQuote = findBestEvidenceSentence(extractedReadingPassage, stem, '');

    readingQuestions.push({
      id: `${examId}-r-${rNum}`,
      number: 50 + Number(rNum),
      type: 'tfng',
      stem,
      options: [
        { id: 'TRUE', text: 'TRUE' },
        { id: 'FALSE', text: 'FALSE' },
        { id: 'NOT GIVEN', text: 'NOT GIVEN' }
      ],
      answer: ['TRUE', 'FALSE', 'NOT GIVEN'].includes(ans) ? ans : 'TRUE',
      evidenceQuote,
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'tfng',
        stem,
        answer: ans,
        tournament: meta.tournament,
        manualExplanation: explanationMap[keyId]
      })
    });
  }

  // Also parse Reading MCQs (R2. Question...\n A. ... B. ... C. ... D. ...)
  const readMcqRegex = /(?:^|\n)\s*R(\d{1,2})[.)]\s+([^\n\[]+)\n\s*A[.)]\s*([^\n]+)\n\s*B[.)]\s*([^\n]+)\n\s*C[.)]\s*([^\n]+)\n\s*D[.)]\s*([^\n]+)/gi;
  let rmm;
  while ((rmm = readMcqRegex.exec(bodyWithoutKey)) !== null) {
    const rNum = rmm[1];
    const stem = rmm[2].trim();
    const options = [
      { id: 'A', text: rmm[3].trim() },
      { id: 'B', text: rmm[4].trim() },
      { id: 'C', text: rmm[5].trim() },
      { id: 'D', text: rmm[6].trim() }
    ];
    const keyId = `R${rNum}`;
    const ans = (answerMap[keyId] || 'A').toUpperCase()[0];
    const chosenOpt = options.find(o => o.id === ans) || options[0];
    const evidenceQuote = findBestEvidenceSentence(extractedReadingPassage, stem, chosenOpt.text);

    readingQuestions.push({
      id: `${examId}-rmcq-${rNum}`,
      number: 50 + Number(rNum),
      type: 'mcq',
      stem,
      options,
      answer: ans,
      evidenceQuote,
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'mcq',
        stem,
        options,
        answer: ans,
        tournament: meta.tournament,
        manualExplanation: explanationMap[keyId]
      })
    });
  }

  if (readingQuestions.length === 0) {
    readingQuestions.push({
      id: `${examId}-r-default`,
      number: 51,
      type: 'tfng',
      stem: 'Advocates of algorithmic governance argue that mathematical models eliminate human subjectivity from administrative decisions.',
      options: [
        { id: 'TRUE', text: 'TRUE' },
        { id: 'FALSE', text: 'FALSE' },
        { id: 'NOT GIVEN', text: 'NOT GIVEN' }
      ],
      answer: 'TRUE',
      evidenceQuote: findBestEvidenceSentence(extractedReadingPassage, 'mathematical models eliminate human subjectivity', ''),
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'tfng',
        stem: 'Advocates of algorithmic governance argue that mathematical models eliminate human subjectivity from administrative decisions.',
        answer: 'TRUE',
        tournament: meta.tournament
      })
    });
  }

  // 5. Extract WRITING: Sentence Transformations (ST1, ST2...) + Summary / Chart / Essay Prompts
  const stQuestions = [];
  const stRegex = /(?:^|\n)\s*(?:ST|Transform|Rewrite)\s*(\d{1,2})[.)]\s*([^\n]+)\n\s*(?:->|=>|Rewrite:)\s*([^\n]+)/gi;
  let stMatch;
  while ((stMatch = stRegex.exec(bodyWithoutKey)) !== null) {
    const num = stMatch[1];
    const sourceLine = stMatch[2].trim();
    const targetLine = stMatch[3].trim();
    const kwMatch = sourceLine.match(/\(([A-Z\s]{2,20})\)\s*$/);
    const keyword = kwMatch ? kwMatch[1].trim() : '';
    const cleanSource = sourceLine.replace(/\([A-Z\s]{2,20}\)\s*$/, '').trim();

    const parts = targetLine.split(/\|/);
    const promptPrefix = parts[0].replace(/_{2,}.*$/, '').trim();
    const keyId = `ST${num}`;
    const ansText = (parts[1] || answerMap[keyId] || targetLine).replace(/^(?:Answer|Key)\s*:\s*/i, '').trim();

    stQuestions.push({
      id: `${examId}-st-${num}`,
      number: 60 + Number(num),
      type: 'sentence_transformation',
      stem: cleanSource,
      keyword,
      promptPrefix,
      answer: ansText,
      acceptedAnswers: [ansText],
      points: 2,
      explanation: synthesizeDeepExplanation({
        qType: 'sentence_transformation',
        stem: cleanSource,
        answer: ansText,
        keyword,
        tournament: meta.tournament,
        manualExplanation: explanationMap[keyId]
      })
    });
  }

  const summaryPromptMatch = bodyWithoutKey.match(/WRITING SUMMARY\s*:\s*([^\n]+)/i);
  const chartPromptMatch = bodyWithoutKey.match(/WRITING CHART\s*:\s*([^\n]+)/i);
  const essayPromptMatch = bodyWithoutKey.match(/WRITING ESSAY\s*:\s*([^\n]+)/i);

  const writingParts = [];
  if (stQuestions.length > 0) {
    writingParts.push({
      id: `${examId}-wrt-st`,
      title: 'Part 0: Sentence Transformation (Viết lại câu C1/C2)',
      instructions: 'Finish each of the following sentences in such a way that it means exactly the same as the sentence printed before it.',
      questions: stQuestions
    });
  }
  if (summaryPromptMatch) {
    writingParts.push({
      id: `${examId}-wrt-sum`,
      partType: 'summary',
      title: 'Part 1: Summary Writing (100–120 words)',
      instructions: 'Summarize the core arguments of the academic passage in 100–120 words.',
      sourcePassage: extractedReadingPassage.replace(/<[^>]+>/g, ' ').trim(),
      prompt: summaryPromptMatch[1].trim(),
      minWords: 100,
      maxWords: 120,
      points: 15
    });
  }
  if (chartPromptMatch) {
    writingParts.push({
      id: `${examId}-wrt-chart`,
      partType: 'chart',
      title: 'Part 2: Data & Chart Description (150 words)',
      instructions: 'Summarize the main features of the dataset and make comparisons where relevant.',
      prompt: chartPromptMatch[1].trim(),
      minWords: 135,
      maxWords: 175,
      points: 15
    });
  }
  writingParts.push({
    id: `${examId}-wrt-essay`,
    partType: 'essay',
    title: 'Part 3: Academic Essay Writing (350 words)',
    instructions: 'Write an academic essay of about 350 words on the following topic:',
    prompt: essayPromptMatch
      ? essayPromptMatch[1].trim()
      : 'Some educators argue that specialized gifted education (trường chuyên lớp chọn) fosters elitism, while others contend it is indispensable for cultivating national intellectual capital. Discuss both views and give your own opinion.',
    minWords: 300,
    maxWords: 400,
    points: 30
  });

  const lexParts = [];
  if (mcqQuestions.length > 0) {
    lexParts.push({
      id: `${examId}-lex-p1`,
      title: 'Part 1: Multiple Choice (Grammar, Idioms, Phrasal Verbs & Collocations)',
      instructions: 'Choose the best option (A, B, C, or D) to complete each sentence.',
      questions: mcqQuestions
    });
  }
  if (wfQuestions.length > 0) {
    lexParts.push({
      id: `${examId}-lex-p2`,
      title: 'Part 2: Word Formation (Morphological Derivation)',
      instructions: 'Use the correct form of the word given in brackets to complete each sentence.',
      questions: wfQuestions
    });
  }
  if (errQuestions.length > 0) {
    lexParts.push({
      id: `${examId}-lex-p3`,
      title: 'Part 3: Error Identification & Correction',
      instructions: 'Identify the erroneous segment in each sentence and supply its correction.',
      questions: errQuestions
    });
  }

  const readingParts = [];
  if (openClozePart) readingParts.push(openClozePart);
  readingParts.push({
    id: `${examId}-read-main`,
    title: openClozePart ? 'Part 2: Academic Reading Comprehension' : 'Part 1: Academic Reading Comprehension',
    instructions: 'Read the passage carefully and answer the questions that follow.',
    passageTitle: 'Critical Academic Discourse Analysis',
    passage: extractedReadingPassage,
    questions: readingQuestions
  });

  return {
    id: examId,
    title: meta.title,
    tournament: meta.tournament,
    year: meta.year,
    province_school: meta.province_school,
    grade_level: meta.grade_level,
    duration_minutes: meta.duration_minutes,
    difficulty: meta.difficulty,
    tags: ['Ingested', meta.tournament, `${meta.year}`, 'Auto-Explained C1/C2'],
    sections: {
      listening: {
        title: 'I. LISTENING (50 points)',
        parts: [
          {
            id: `${examId}-list-p1`,
            title: 'Part 1: Academic Lecture & Note Completion',
            instructions: 'Listen to the academic recording and complete the tasks below. Write NO MORE THAN THREE WORDS for each blank.',
            audioUrl: extractedAudioUrl,
            transcript: extractedTranscript,
            questions: listeningQuestions
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: lexParts
      },
      reading: {
        title: 'III. READING COMPREHENSION (50 points)',
        parts: readingParts
      },
      writing: {
        title: 'IV. WRITING & SENTENCE TRANSFORMATION (60 points)',
        parts: writingParts
      }
    }
  };
}

function extractTextFromHtml(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, noscript').remove();
  const title = $('title').text().trim() || $('h1').first().text().trim();
  const bodyText = $('article, main, .content, .post-content, body').first().text();
  return `${title}\n\n${bodyText.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()}`;
}

const SAMPLE_IMPORT_TEMPLATES = {
  hsgqg: `KỲ THI CHỌN HỌC SINH GIỎI QUỐC GIA THPT NĂM 2025
Bộ Giáo dục và Đào tạo - Môn: TIẾNG ANH - Thời gian: 180 phút

Audio URL: https://cdn.v-engolympiad.edu.vn/audio/hsgqg-2025-neurobiology.mp3
Transcript: Welcome to today's symposium on Cognitive Plasticity and Epistemic Resilience. Empirical neurobiology reveals that adult cortical reorganization is governed by stringent metabolic constraints. Specifically, synaptic pruning during late adolescence consolidates high-efficiency pathways while discarding redundant neural circuitry.

L1. Adult cortical reorganization is regulated by strict _______.
L2. During late adolescence, synaptic pruning eliminates _______.

1. Beneath his gruff exterior, the veteran coach had a _______ of gold and quietly funded scholarships for underprivileged athletes.
A. heart
B. soul
C. mind
D. spirit

2. No sooner had the central bank announced quantitative tightening _______ speculative tech equities plunged into a tailspin.
A. when
B. than
C. that
D. as

3. The investigative journalist refused to reveal her confidential source, _______ she be held in contempt of court.
A. lest
B. albeit
C. for
D. notwithstanding

WF1. The senator's speech was dismissed by political analysts as mere _______ designed to appease populist sentiment. (DEMAGOGUE)
WF2. Without stringent regulatory oversight, such financial derivatives remain _______ volatile. (INHERENT)

ERR1. Scarcely the minister had finished his keynote address when angry protesters stormed the podium.

OPEN CLOZE PASSAGE:
Throughout much of human history, solitude was neither a luxury [[OC1]] an eccentricity. Today, however, the ubiquity of networked devices has all [[OC2]] eradicated the interstitial silences of daily life.

READING PASSAGE:
In the contemporary technocratic landscape, predictive algorithms have transitioned from auxiliary decision-support tools to de facto arbiters of public policy. Proponents frequently extol algorithmic governance for its ostensible impartiality, positing that mathematical models purge administrative adjudication of human caprice and cognitive bias. Yet this techno-optimistic narrative obscures a profound epistemological fallacy.

R1. [TFNG] Advocates of algorithmic governance argue that mathematical models eliminate human subjectivity from administrative decisions.

ST1. The director only realized how perilous the expedition was after the supply vessel became trapped in pack ice. (DID)
-> Only after the supply vessel became trapped in pack ice

=== ANSWER KEY (CHỈ CÓ ĐÁP ÁN - HỆ THỐNG TỰ SINH GIẢI THÍCH C1/C2) ===
L1: metabolic constraints
L2: redundant neural circuitry
1: A
2: B
3: A
WF1: demagoguery
WF2: inherently
ERR1: the minister had -> had the minister
OC1: nor
OC2: but
R1: TRUE
ST1: Only after the supply vessel became trapped in pack ice did the director realize how perilous the expedition was.`,

  olympic304: `KỲ THI OLYMPIC TRUYỀN THỐNG 30/4 LẦN THỨ XXIX NĂM 2025
Trường THPT Chuyên Lê Hồng Phong TP.HCM - Thời gian: 180 phút

1. Having squandered his inheritance on reckless ventures, the young heir was reduced to living on a _______.
A. shoestring
B. tightrope
C. hairline
D. thread

2. The defense attorney's cross-examination completely _______ the prosecution's star witness, exposing glaring contradictions in his testimony.
A. wrong-footed
B. cold-shouldered
C. short-changed
D. strong-armed

WF1. Her _______ commitment to archival accuracy earned her the prestigious historiography medal. (WAVERING)
WF2. The treaty was rendered _______ by the sudden outbreak of border skirmishes. (NULL)

ST1. He was so utterly absorbed in deciphering the medieval manuscript that he forgot to eat dinner. (ENGROSSED)
-> So engrossed was he in

=== ANSWER KEY ===
1: A
2: A
WF1: unwavering
WF2: nullified
ST1: So engrossed was he in deciphering the medieval manuscript that he forgot to eat dinner.`
};

module.exports = {
  detectMetadata,
  parseRawTextToExam,
  extractTextFromHtml,
  synthesizeDeepExplanation,
  findBestEvidenceSentence,
  SAMPLE_IMPORT_TEMPLATES
};
