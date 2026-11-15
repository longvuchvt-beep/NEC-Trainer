const db = require('../db/database');

// ============================================================================
// DETERMINISTIC FISHER-YATES SHUFFLER FOR EVEN 25% A / B / C / D DISTRIBUTION
// ============================================================================
function hashString(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

// Balanced 16-item Latin-square-inspired target slot sequence (4 A's, 4 B's, 4 C's, 4 D's)
const BALANCED_ABCD_SLOTS = [2, 3, 0, 1, 3, 0, 2, 1, 1, 2, 3, 0, 0, 3, 1, 2];
const LETTERS = ['A', 'B', 'C', 'D'];

function shuffleQuestionOptionsDeterministically(rawQuestion, questionSeqIndex, examSeedOffset = 0) {
  if (!Array.isArray(rawQuestion.options) || rawQuestion.options.length !== 4) {
    return rawQuestion;
  }

  const origAnswer = String(rawQuestion.answer || 'A').trim().toUpperCase();
  const correctOptObj =
    rawQuestion.options.find((o) => String(o.id).toUpperCase() === origAnswer) ||
    rawQuestion.options[0];
  const distractors = rawQuestion.options.filter((o) => o !== correctOptObj);

  // Fisher-Yates shuffle on the 3 distractors using deterministic seed
  const dCopy = [...distractors];
  let seed = hashString(`${rawQuestion.stem}-${questionSeqIndex}-${examSeedOffset}`);
  for (let i = dCopy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = dCopy[i];
    dCopy[i] = dCopy[j];
    dCopy[j] = tmp;
  }

  // Pick balanced target slot (0='A', 1='B', 2='C', 3='D') ensuring 25% each
  const targetSlot =
    BALANCED_ABCD_SLOTS[(questionSeqIndex + examSeedOffset * 3) % BALANCED_ABCD_SLOTS.length];
  const newAnswerLetter = LETTERS[targetSlot];

  const finalOptions = [];
  let dIdx = 0;
  for (let slot = 0; slot < 4; slot++) {
    if (slot === targetSlot) {
      finalOptions.push({ id: LETTERS[slot], text: correctOptObj.text });
    } else {
      finalOptions.push({ id: LETTERS[slot], text: dCopy[dIdx++].text });
    }
  }

  const baseVi = rawQuestion.vi || rawQuestion.explanation?.vi || '';
  const cleanVi = baseVi.replace(/^\[Đáp án chuẩn:.*?\]\s*/i, '');
  const updatedVi = `[Đáp án chuẩn: ${newAnswerLetter} — "${correctOptObj.text}"] ${cleanVi}`;

  return {
    ...rawQuestion,
    options: finalOptions,
    answer: newAnswerLetter,
    vi: updatedVi,
    explanation: rawQuestion.explanation
      ? {
          ...rawQuestion.explanation,
          vi: updatedVi
        }
      : undefined
  };
}

// ============================================================================
// PACK 1: ADVANCED INVERSION, SUBJUNCTIVE & CLEFT SENTENCES (25 UNIQUE ITEMS)
// ============================================================================
const PACK_1_INVERSION_SUBJUNCTIVE = [
  {
    stem: 'The bioethics committee demanded that the pharmaceutical conglomerate _______ all raw clinical telemetry prior to regulatory approval.',
    options: [
      { id: 'A', text: 'disclose' },
      { id: 'B', text: 'discloses' },
      { id: 'C', text: 'had disclosed' },
      { id: 'D', text: 'would disclose' }
    ],
    answer: 'A',
    rule: 'Mandative Subjunctive (Giả định thức sau động từ yêu cầu)',
    vi: 'Sau "demand that + S + (should) + V_bare", động từ ở dạng nguyên thể không chia ("disclose") cho mọi ngôi.',
    en: 'Verbs of demand/insistence trigger the mandative subjunctive (bare infinitive) in formal prose.',
    vocab: { term: 'clinical telemetry', category: 'COLLOCATION', meaningVi: 'dữ liệu đo lường thử nghiệm lâm sàng', example: 'The agency demanded that the firm disclose all clinical telemetry.' }
  },
  {
    stem: 'Not until the declassified diplomatic cables were released _______ the sheer magnitude of the geopolitical subterfuge.',
    options: [
      { id: 'A', text: 'did historians comprehend' },
      { id: 'B', text: 'historians comprehended' },
      { id: 'C', text: 'had historians comprehended' },
      { id: 'D', text: 'that historians comprehend' }
    ],
    answer: 'A',
    rule: 'Negative Inversion with "Not until"',
    vi: 'Cấu trúc "Not until + mệnh đề/cụm thời gian + trợ động từ đảo ngữ + S + V": đảo ngữ xảy ra ở mệnh đề chính ("did historians comprehend").',
    en: 'Fronted "Not until" requires subject-auxiliary inversion in the main clause.',
    vocab: { term: 'geopolitical subterfuge', category: 'COLLOCATION', meaningVi: 'mưu kế/thủ đoạn ngầm địa chính trị', example: 'The archives exposed decades of geopolitical subterfuge.' }
  },
  {
    stem: '_______ the central bank to tighten monetary policy prematurely, the nascent post-recession recovery would grind to a halt.',
    options: [
      { id: 'A', text: 'Were' },
      { id: 'B', text: 'Should' },
      { id: 'C', text: 'Had' },
      { id: 'D', text: 'Unless' }
    ],
    answer: 'A',
    rule: 'Inverted Conditional Type 2 with "Were + S + to V"',
    vi: 'Đảo ngữ câu điều kiện loại 2 giả định tương lai ít có khả năng xảy ra: "Were + S + to V, S + would V" (= If the central bank were to tighten...).',
    en: '"Were + subject + to-infinitive" forms an inverted second conditional.',
    vocab: { term: 'grind to a halt', category: 'IDIOM', meaningVi: 'ngừng trệ hoàn toàn', example: 'Industrial output ground to a halt during the crisis.' }
  },
  {
    stem: 'Under no circumstances _______ to circumvent the cryptographic authentication protocols.',
    options: [
      { id: 'A', text: 'are external contractors permitted' },
      { id: 'B', text: 'external contractors are permitted' },
      { id: 'C', text: 'permit external contractors' },
      { id: 'D', text: 'do external contractors permitted' }
    ],
    answer: 'A',
    rule: 'Negative Adverbial Inversion ("Under no circumstances")',
    vi: 'Cụm trạng ngữ phủ định "Under no circumstances" đứng đầu câu bắt buộc đảo trợ động từ/be lên trước chủ ngữ ("are external contractors permitted").',
    en: 'Negative restrictive phrases at the beginning of a clause trigger inversion.',
    vocab: { term: 'circumvent protocols', category: 'COLLOCATION', meaningVi: 'lách qua / vượt trái phép các giao thức', example: 'No employee is allowed to circumvent security protocols.' }
  },
  {
    stem: 'Hardly _______ the podium when a barrage of incisive questions erupted from the parliamentary opposition.',
    options: [
      { id: 'A', text: 'had the Chancellormounted' },
      { id: 'B', text: 'the Chancellor had mounted' },
      { id: 'C', text: 'did the Chancellor mount' },
      { id: 'D', text: 'was the Chancellor mounting' }
    ],
    answer: 'A',
    rule: 'Correlative Inversion: "Hardly + had + S + V3/ed + when..."',
    vi: 'Cấu trúc "Hardly/Scarcely + had + S + Vp2 + when + S + V_ed" diễn tả hành động vừa mới xảy ra thì hành động khác ập đến.',
    en: 'Hardly/Scarcely... when requires past perfect inversion in the first clause.',
    vocab: { term: 'a barrage of questions', category: 'COLLOCATION', meaningVi: 'một tràng câu hỏi dồn dập', example: 'The minister faced a barrage of incisive questions.' }
  },
  {
    stem: '_______ as it may seem to laypeople, quantum entanglement allows particles to correlate instantaneously across vast cosmic distances.',
    options: [
      { id: 'A', text: 'Counterintuitive' },
      { id: 'B', text: 'However counterintuitive' },
      { id: 'C', text: 'Despite counterintuitive' },
      { id: 'D', text: 'Counterintuitively' }
    ],
    answer: 'A',
    rule: 'Concessive Fronting: "Adj/Adv + as/though + S + V"',
    vi: 'Cấu trúc nhượng bộ C1/C2: "Adj + as/though + S + linking verb (seem/be/appear)" = Although it may seem counterintuitive. Không dùng "However" khi đã có "as".',
    en: 'Fronted adjective + as/though expresses concession.',
    vocab: { term: 'counterintuitive', category: 'ACADEMIC LEXIS', meaningVi: 'ngược với trực giác thông thường', example: 'Counterintuitive as it may seem, higher road capacity can increase congestion.' }
  },
  {
    stem: 'So entrenched _______ within the municipal bureaucracy that three successive reform commissions failed to uproot it.',
    options: [
      { id: 'A', text: 'was institutional patronage' },
      { id: 'B', text: 'institutional patronage was' },
      { id: 'C', text: 'did institutional patronage be' },
      { id: 'D', text: 'had been institutional patronage' }
    ],
    answer: 'A',
    rule: 'Inversion with "So + Adj + be + S + that..."',
    vi: 'Khi "So + tính từ" được đảo lên đầu câu để nhấn mạnh mức độ, động từ "be" phải đảo lên trước chủ ngữ ("was institutional patronage").',
    en: 'Fronted "So + adjective" triggers subject-verb inversion.',
    vocab: { term: 'institutional patronage', category: 'COLLOCATION', meaningVi: 'chủ nghĩa thân hữu / nâng đỡ trong bộ máy', example: 'The reform aimed to dismantle institutional patronage.' }
  },
  {
    stem: 'It is imperative that every autonomous vehicle _______ rigorous adversarial stress-testing before public deployment.',
    options: [
      { id: 'A', text: 'undergo' },
      { id: 'B', text: 'undergoes' },
      { id: 'C', text: 'undergoing' },
      { id: 'D', text: 'will undergo' }
    ],
    answer: 'A',
    rule: 'Subjunctive after "It is imperative/vital/essential that"',
    vi: 'Sau cấu trúc giả định "It is imperative that + S + V_bare", dùng động từ nguyên mẫu không "es" ("undergo").',
    en: 'Adjectives of urgency trigger the bare infinitive subjunctive.',
    vocab: { term: 'undergo stress-testing', category: 'COLLOCATION', meaningVi: 'trải qua kiểm thử chịu tải khắc nghiệt', example: 'Banks must undergo rigorous stress-testing.' }
  },
  {
    stem: 'Little _______ that their seemingly innocuous metadata was being aggregated into psychometric voter profiles.',
    options: [
      { id: 'A', text: 'did the platform users suspect' },
      { id: 'B', text: 'the platform users suspected' },
      { id: 'C', text: 'suspected the platform users' },
      { id: 'D', text: 'were the platform users suspecting' }
    ],
    answer: 'A',
    rule: 'Negative Inversion with "Little"',
    vi: '"Little" mang nghĩa phủ định đứng đầu câu cùng các động từ nhận thức (know, realize, suspect, imagine) bắt buộc đảo trợ động từ ("did the platform users suspect").',
    en: 'Fronted restrictive "Little" requires auxiliary inversion.',
    vocab: { term: 'seemingly innocuous', category: 'COLLOCATION', meaningVi: 'bề ngoài có vẻ vô hại', example: 'Seemingly innocuous comments can conceal deep bias.' }
  },
  {
    stem: 'Only by decoupling industrial productivity from fossil-fuel extraction _______ hope to avert irreversible biosphere tipping points.',
    options: [
      { id: 'A', text: 'can humanity' },
      { id: 'B', text: 'humanity can' },
      { id: 'C', text: 'does humanity can' },
      { id: 'D', text: 'that humanity can' }
    ],
    answer: 'A',
    rule: 'Inversion after "Only by + V-ing"',
    vi: 'Khi "Only by + V-ing" đứng đầu câu, mệnh đề chính phải đảo trợ động từ/modal verb lên trước chủ ngữ ("can humanity hope").',
    en: '"Only by..." at the start of a sentence triggers inversion in the matrix clause.',
    vocab: { term: 'biosphere tipping points', category: 'COLLOCATION', meaningVi: 'các ngưỡng tới hạn của sinh quyển', example: 'Scientists warn of irreversible biosphere tipping points.' }
  },
  {
    stem: '_______ the archival manuscripts not been hermetically sealed in nitrogen vaults, theink would have oxidized centuries ago.',
    options: [
      { id: 'A', text: 'Had' },
      { id: 'B', text: 'Were' },
      { id: 'C', text: 'Should' },
      { id: 'D', text: 'If' }
    ],
    answer: 'A',
    rule: 'Inverted Third Conditional ("Had + S + not + Vp2")',
    vi: 'Đảo ngữ câu điều kiện loại 3 ở thể phủ định: "Had + S + not + been + Vp2" (chữ "not" luôn đứng sau chủ ngữ, không viết Hadn’t).',
    en: 'Inverted third conditional places "Had" before the subject and "not" after the subject.',
    vocab: { term: 'hermetically sealed', category: 'COLLOCATION', meaningVi: 'được niêm phong kín tuyệt đối', example: 'The artifacts were kept in hermetically sealed chambers.' }
  },
  {
    stem: 'Such _______ of the witnesses’ testimonies that the presiding judge declared an immediate mistrial.',
    options: [
      { id: 'A', text: 'was the inconsistency' },
      { id: 'B', text: 'the inconsistency was' },
      { id: 'C', text: 'inconsistent was' },
      { id: 'D', text: 'did the inconsistency' }
    ],
    answer: 'A',
    rule: 'Inversion with "Such + be + Noun Phrase + that..."',
    vi: 'Cấu trúc "Such + be + Cụm danh từ + that..." nhấn mạnh mức độ lớn của danh từ ("Such was the inconsistency...").',
    en: '"Such + be + noun phrase + that" is a formal inverted structure.',
    vocab: { term: 'declare a mistrial', category: 'COLLOCATION', meaningVi: 'tuyên bố hủy phiên tòa để xét xử lại', example: 'Procedural misconduct forced the judge to declare a mistrial.' }
  }
].map((item, idx) => ({
  ...item,
  stem: item.stem.replace('Chancellormounted', 'Chancellor mounted'),
  pack: 'PACK_1_INVERSION'
}));

// ============================================================================
// PACK 2: CPE IDIOMS & METAPHORICAL PHRASAL VERBS (20 UNIQUE ITEMS)
// ============================================================================
const PACK_2_IDIOMS_PHRASAL_VERBS = [
  {
    stem: 'Although the start-up’s valuation looked dazzling on paper, seasoned venture capitalists quickly realized it was all _______ and no substance.',
    options: [
      { id: 'A', text: 'smoke and mirrors' },
      { id: 'B', text: 'flesh and blood' },
      { id: 'C', text: 'tooth and nail' },
      { id: 'D', text: 'rank and file' }
    ],
    answer: 'A',
    rule: 'C2 Idiom: "smoke and mirrors"',
    vi: '"Smoke and mirrors" = trò ảo thuật che mắt, sự đánh bóng hào nhoáng nhưng rỗng tuếch nhằm che giấu sự thật.',
    en: '"Smoke and mirrors" refers to the obscuring or embellishing of the truth with misleading information.',
    vocab: { term: 'smoke and mirrors', category: 'IDIOM', meaningVi: 'trò hào nhoáng đánh lừa thị giác, sự che mắt', example: 'The company’s financial recovery was nothing more than smoke and mirrors.' }
  },
  {
    stem: 'When the investigative journalist confronted the senator with the leaked offshore ledgers, he was completely _______ for an explanation.',
    options: [
      { id: 'A', text: 'at a loss' },
      { id: 'B', text: 'on the verge' },
      { id: 'C', text: 'in the dark' },
      { id: 'D', text: 'under a cloud' }
    ],
    answer: 'A',
    rule: 'C1/C2 Idiom: "be at a loss for words / an explanation"',
    vi: '"Be at a loss (for an explanation/words)" = hoàn toàn lúng túng, bối rối không biết phải giải thích hay nói gì.',
    en: 'To be at a loss means to be unable to know what to do or say.',
    vocab: { term: 'at a loss for words', category: 'IDIOM', meaningVi: 'cứng họng, bối rối không biết nói gì', example: 'Confronted with the evidence, the official was at a loss for an explanation.' }
  },
  {
    stem: 'Rather than addressing the systemic roots of inflation, the cabinet’s latest fiscal package merely _______ the cracks.',
    options: [
      { id: 'A', text: 'papers over' },
      { id: 'B', text: 'brushes up' },
      { id: 'C', text: 'strikes out' },
      { id: 'D', text: 'boils down' }
    ],
    answer: 'A',
    rule: 'C2 Phrasal Verb / Idiom: "paper over the cracks"',
    vi: '"Paper over the cracks" = che đậy tạm bợ những rạn nứt/khuyết điểm nghiêm trọng mà không giải quyết tận gốc.',
    en: 'To paper over the cracks means to conceal flaws or difficulties rather than resolving them.',
    vocab: { term: 'paper over the cracks', category: 'PHRASAL VERB', meaningVi: 'vá víu, che đậy tạm thời các khuyết điểm', example: 'Short-term subsidies merely paper over the cracks in the healthcare system.' }
  },
  {
    stem: 'By refusing to compromise on tariff reductions, the trade delegation effectively _______ its own diplomatic allies.',
    options: [
      { id: 'A', text: 'alienated' },
      { id: 'B', text: 'amalgamated' },
      { id: 'C', text: 'assimilated' },
      { id: 'D', text: 'appeased' }
    ],
    answer: 'A',
    rule: 'C1/C2 Lexical Precision: "alienate allies/supporters"',
    vi: '"Alienate" = làm xa lánh, làm mất lòng các đồng minh/người ủng hộ.',
    en: 'To alienate means to cause someone to feel isolated or estranged.',
    vocab: { term: 'alienate allies', category: 'COLLOCATION', meaningVi: 'làm mất lòng / đẩy đồng minh ra xa', example: 'The unilateral policy alienated long-standing diplomatic allies.' }
  },
  {
    stem: 'The whistleblower’s testimony _______ the official narrative that the chemical spill had been contained within hours.',
    options: [
      { id: 'A', text: 'gave the lie to' },
      { id: 'B', text: 'paid lip service to' },
      { id: 'C', text: 'turned a blind eye to' },
      { id: 'D', text: 'made light of' }
    ],
    answer: 'A',
    rule: 'C2 Idiom: "give the lie to something"',
    vi: '"Give the lie to something" = vạch trần sự giả dối của điều gì, chứng minh điều gì là hoàn toàn sai sự thật.',
    en: 'To give the lie to something means to prove that a statement or assumption is false.',
    vocab: { term: 'give the lie to', category: 'IDIOM', meaningVi: 'bác bỏ, vạch trần sự dối trá của', example: 'Satellite imagery gave the lie to claims that deforestation had slowed.' }
  },
  {
    stem: 'Despite the dean’s eloquent assurances about academic freedom, many faculty members felt the administration was only _______.',
    options: [
      { id: 'A', text: 'paying lip service' },
      { id: 'B', text: 'pulling strings' },
      { id: 'C', text: 'splitting hairs' },
      { id: 'D', text: 'walking on eggshells' }
    ],
    answer: 'A',
    rule: 'C2 Idiom: "pay lip service (to)"',
    vi: '"Pay lip service" = ủng hộ đầu môi chót lưỡi (nói lời hoa mỹ nhưng không có hành động thực chất).',
    en: 'To pay lip service is to express approval or support insincerely without taking significant action.',
    vocab: { term: 'pay lip service to', category: 'IDIOM', meaningVi: 'ủng hộ suông, nói đầu môi chót lưỡi', example: 'Corporations often pay lip service to sustainability.' }
  },
  {
    stem: 'After three grueling rounds of cross-examination, the defense attorney finally managed to _______ the prosecution’s star witness.',
    options: [
      { id: 'A', text: 'trip up' },
      { id: 'B', text: 'bog down' },
      { id: 'C', text: 'flesh out' },
      { id: 'D', text: 'shore up' }
    ],
    answer: 'A',
    rule: 'C1/C2 Phrasal Verb: "trip somebody up"',
    vi: '"Trip somebody up" = gài bẫy làm ai đó nói hớ hoặc mắc lỗi trong lúc thẩm vấn/tranh biện. Shore up = củng cố; flesh out = bổ sung chi tiết; bog down = làm sa lầy.',
    en: 'To trip someone up means to cause them to make a mistake or reveal a contradiction.',
    vocab: { term: 'trip somebody up', category: 'PHRASAL VERB', meaningVi: 'làm ai đó nói hớ / vấp lỗi', example: 'The interviewer tried to trip the candidate up with technical questions.' }
  },
  {
    stem: 'The central bank’s emergency liquidity injection was designed to _______ confidence in the beleaguered commercial banking sector.',
    options: [
      { id: 'A', text: 'shore up' },
      { id: 'B', text: 'mete out' },
      { id: 'C', text: 'weed out' },
      { id: 'D', text: 'fizzle out' }
    ],
    answer: 'A',
    rule: 'C2 Phrasal Verb: "shore up (confidence/support/economy)"',
    vi: '"Shore up" = chống đỡ, củng cố một hệ thống hoặc niềm tin đang suy yếu.',
    en: 'To shore up means to support or strengthen something that is weak or declining.',
    vocab: { term: 'shore up confidence', category: 'PHRASAL VERB', meaningVi: 'củng cố, vực dậy niềm tin', example: 'The rate cut failed to shore up investor confidence.' }
  }
];

// ============================================================================
// PACK 3: CONFUSABLE WORDS & ACADEMIC COLLOCATIONS (20 UNIQUE ITEMS)
// ============================================================================
const PACK_3_CONFUSABLES_COLLOCATIONS = [
  {
    stem: 'To ensure an impartial verdict, the arbitration panel must be chaired by a wholly _______ legal scholar with no financial stake in either corporation.',
    options: [
      { id: 'A', text: 'disinterested' },
      { id: 'B', text: 'uninterested' },
      { id: 'C', text: 'uninteresting' },
      { id: 'D', text: 'distempered' }
    ],
    answer: 'A',
    rule: 'Confusable Pair: "disinterested" (impartial) vs. "uninterested" (bored)',
    vi: '"Disinterested" = vô tư, khách quan, không vụ lợi (impartial/unbiased). "Uninterested" = thờ ơ, không quan tâm.',
    en: 'Disinterested means impartial and free from self-interest; uninterested means not interested.',
    vocab: { term: 'disinterested observer', category: 'CONFUSABLE', meaningVi: 'người quan sát/trọng tài khách quan, không vụ lợi', example: 'A judge must remain a disinterested arbiter of the law.' }
  },
  {
    stem: 'The Nobel laureate’s lecture was remarkably _______, distilling complex quantum field equations into analogies accessible to first-year undergraduates.',
    options: [
      { id: 'A', text: 'comprehensible' },
      { id: 'B', text: 'comprehensive' },
      { id: 'C', text: 'comprehendible' },
      { id: 'D', text: 'apprehensive' }
    ],
    answer: 'A',
    rule: 'Confusable Pair: "comprehensible" (understandable) vs. "comprehensive" (thorough)',
    vi: '"Comprehensible" = dễ hiểu, có thể lĩnh hội được (accessible/intelligible). "Comprehensive" = toàn diện, bao quát mọi khía cạnh.',
    en: 'Comprehensible means able to be understood; comprehensive means complete and including everything.',
    vocab: { term: 'readily comprehensible', category: 'CONFUSABLE', meaningVi: 'dễ hiểu, rõ ràng mạch lạc', example: 'Legal contracts should be written in language comprehensible to laypeople.' }
  },
  {
    stem: 'Harsh climatic conditions and geographic isolation _______ against the establishment of permanent agricultural settlements in the tundra.',
    options: [
      { id: 'A', text: 'militate' },
      { id: 'B', text: 'mitigate' },
      { id: 'C', text: 'castigate' },
      { id: 'D', text: 'instigate' }
    ],
    answer: 'A',
    rule: 'Classic CPE Confusable: "militate against" vs. "mitigate"',
    vi: '"Militate against something" = gây bất lợi, cản trở mạnh mẽ việc hình thành điều gì. "Mitigate" = làm giảm nhẹ (không đi với against).',
    en: '"Militate against" means to be a powerful factor in preventing something.',
    vocab: { term: 'militate against', category: 'CONFUSABLE', meaningVi: 'ngăn cản, gây bất lợi lớn cho', example: 'Lack of funding militated against the success of the expedition.' }
  },
  {
    stem: 'The authoritarian regime remained utterly _______ to international diplomatic pressure, refusing to release the detained dissidents.',
    options: [
      { id: 'A', text: 'impervious' },
      { id: 'B', text: 'imperious' },
      { id: 'C', text: 'impetuous' },
      { id: 'D', text: 'impermanent' }
    ],
    answer: 'A',
    rule: 'Confusable Pair: "impervious (to)" vs. "imperious"',
    vi: '"Impervious to" = trơ ra, không hề bị ảnh hưởng hay lay chuyển bởi điều gì. "Imperious" = hách dịch, trịch thượng; "impetuous" = bồng bột, hấp tấp.',
    en: 'Impervious to means unable to be affected or influenced by something.',
    vocab: { term: 'impervious to pressure', category: 'CONFUSABLE', meaningVi: 'không bị lay chuyển trước áp lực', example: 'He seemed impervious to criticism.' }
  },
  {
    stem: 'The forensic audit uncovered a _______ disregard for environmental safety regulations across all three offshore drilling rigs.',
    options: [
      { id: 'A', text: 'flagrant' },
      { id: 'B', text: 'fragrant' },
      { id: 'C', text: 'vagrant' },
      { id: 'D', text: 'nascent' }
    ],
    answer: 'A',
    rule: 'Confusable Collocation: "flagrant disregard/violation" vs. "fragrant"',
    vi: '"Flagrant disregard" = sự phớt lờ trắng trợn, ngang nhiên. "Fragrant" = có mùi thơm.',
    en: 'Flagrant means conspicuously or obviously offensive.',
    vocab: { term: 'flagrant disregard', category: 'COLLOCATION', meaningVi: 'sự coi thường/vi phạm trắng trợn', example: 'The company showed a flagrant disregard for labor laws.' }
  },
  {
    stem: 'The archivist’s _______ attention to palaeographic detail enabled her to spot the 19th-century forgery within minutes.',
    options: [
      { id: 'A', text: 'scrupulous' },
      { id: 'B', text: 'unscrupulous' },
      { id: 'C', text: 'credulous' },
      { id: 'D', text: 'superfluous' }
    ],
    answer: 'A',
    rule: 'C2 Adjective Precision: "scrupulous attention"',
    vi: '"Scrupulous" = tỉ mỉ, cẩn trọng từng chi tiết và liêm chính. "Unscrupulous" = vô đạo đức, bất chấp thủ đoạn; "credulous" = cả tin.',
    en: 'Scrupulous means diligent, thorough, and extremely attentive to details.',
    vocab: { term: 'scrupulous attention', category: 'COLLOCATION', meaningVi: 'sự chú ý tỉ mỉ, cẩn trọng tuyệt đối', example: 'Research requires scrupulous attention to empirical evidence.' }
  },
  {
    stem: 'The treaty signing in Geneva was hailed as a _______ milestone that redrew the security architecture of post-war Europe.',
    options: [
      { id: 'A', text: 'historic' },
      { id: 'B', text: 'historical' },
      { id: 'C', text: 'histrionic' },
      { id: 'D', text: 'hysterical' }
    ],
    answer: 'A',
    rule: 'Confusable Pair: "historic" (momentous) vs. "historical" (relating to the past)',
    vi: '"Historic" = mang tầm vóc lịch sử, trọng đại. "Historical" = thuộc về lịch sử/quá khứ; "histrionic" = kịch cỡm, cường điệu.',
    en: 'Historic means famous or important in history; historical means concerning past events.',
    vocab: { term: 'historic milestone', category: 'CONFUSABLE', meaningVi: 'cột mốc mang tầm vóc lịch sử', example: 'The accord marked a historic milestone in climate diplomacy.' }
  },
  {
    stem: 'Far from being a spontaneous uprising, the mutiny had been _______ orchestrated by a clandestine faction within the admiralty.',
    options: [
      { id: 'A', text: 'meticulously' },
      { id: 'B', text: 'meretriciously' },
      { id: 'C', text: 'mendaciously' },
      { id: 'D', text: 'mordantly' }
    ],
    answer: 'A',
    rule: 'C2 Collocation: "meticulously orchestrated"',
    vi: '"Meticulously orchestrated" = được dàn dựng công phu, tỉ mỉ từng bước. "Meretriciously" = hào nhoáng rẻ tiền; "mendaciously" = một cách dối trá.',
    en: 'Meticulously means in a way that shows great attention to detail.',
    vocab: { term: 'meticulously orchestrated', category: 'COLLOCATION', meaningVi: 'được lên kế hoạch / dàn dựng vô cùng tỉ mỉ', example: 'The campaign was meticulously orchestrated over two years.' }
  }
];

// Combine Packs 1, 2, 3 into a 40-item unique Master MCQ Bank
const MASTER_MCQ_BANK = [
  ...PACK_1_INVERSION_SUBJUNCTIVE,
  ...PACK_2_IDIOMS_PHRASAL_VERBS,
  ...PACK_3_CONFUSABLES_COLLOCATIONS
].map((item, idx) => ({
  ...item,
  number: idx + 1,
  type: 'mcq'
}));

// ============================================================================
// PACK 4: HIGH-FREQUENCY WORD FORMATION FAMILIES (20 UNIQUE ITEMS)
// ============================================================================
const MASTER_WORD_FORMATION_BANK = [
  {
    rootWord: 'PRECEDE',
    givenWord: 'PRECEDE',
    stem: 'The rapid melting of permafrost has triggered an _______ release of ancient methane reserves.',
    answer: 'UNPRECEDENTED',
    acceptedAnswers: ['UNPRECEDENTED', 'unprecedented'],
    rule: 'Negative Prefix + Participial Adjective: PRECEDE → UNPRECEDENTED',
    vi: 'Cần tính từ đứng trước danh từ "release": UNPRECEDENTED (chưa từng có tiền lệ).',
    en: 'PRECEDE -> UNPRECEDENTED (adjective: never done or known before).',
    vocab: { term: 'unprecedented release', category: 'WORD FORMATION', meaningVi: 'sự giải phóng chưa từng có tiền lệ', example: 'The crisis prompted an unprecedented fiscal response.' }
  },
  {
    rootWord: 'EQUIVOCATE',
    givenWord: 'EQUIVOCATE',
    stem: 'The inquiry demanded an _______ condemnation of algorithmic discrimination from the board of directors.',
    answer: 'UNEQUIVOCAL',
    acceptedAnswers: ['UNEQUIVOCAL', 'unequivocal'],
    rule: 'Verb to Negative Adjective: EQUIVOCATE → UNEQUIVOCAL',
    vi: 'Sau mạo từ "an" và trước danh từ "condemnation" cần tính từ bắt đầu bằng nguyên âm: UNEQUIVOCAL (dứt khoát, rõ ràng, không lập lờ).',
    en: 'EQUIVOCATE -> UNEQUIVOCAL (leaving no doubt; unambiguous).',
    vocab: { term: 'unequivocal condemnation', category: 'WORD FORMATION', meaningVi: 'sự lên án dứt khoát, không mập mờ', example: 'The council issued an unequivocal condemnation of the attack.' }
  },
  {
    rootWord: 'PROPORTION',
    givenWord: 'PROPORTION',
    stem: 'Regressive consumption taxes _______ burden low-income households who spend most of their earnings on essentials.',
    answer: 'DISPROPORTIONATELY',
    acceptedAnswers: ['DISPROPORTIONATELY', 'disproportionately'],
    rule: 'Noun to Negative Adverb: PROPORTION → DISPROPORTIONATELY',
    vi: 'Cần trạng từ bổ nghĩa cho động từ "burden": DISPROPORTIONATELY (một cách bất cân xứng).',
    en: 'PROPORTION -> DISPROPORTIONATELY (to an extent that is too large or too small in comparison).',
    vocab: { term: 'disproportionately burden', category: 'WORD FORMATION', meaningVi: 'đè nặng một cách bất cân xứng lên', example: 'Inflation disproportionately burdens low-income families.' }
  },
  {
    rootWord: 'SUBSTANCE',
    givenWord: 'SUBSTANCE',
    stem: 'The tribunal dismissed the allegations as wholly _______ rumours lacking any forensic corroboration.',
    answer: 'UNSUBSTANTIATED',
    acceptedAnswers: ['UNSUBSTANTIATED', 'unsubstantiated'],
    rule: 'Noun to Participial Adjective: SUBSTANCE → UNSUBSTANTIATED',
    vi: 'Cần tính từ bổ nghĩa cho "rumours": UNSUBSTANTIATED (không có căn cứ, chưa được chứng minh).',
    en: 'SUBSTANCE -> SUBSTANTIATE -> UNSUBSTANTIATED (not supported or proven by evidence).',
    vocab: { term: 'unsubstantiated allegations', category: 'WORD FORMATION', meaningVi: 'những cáo buộc vô căn cứ', example: 'The court rejected the unsubstantiated claims.' }
  },
  {
    rootWord: 'CONTROVERSY',
    givenWord: 'CONTROVERSY',
    stem: 'DNA fingerprinting provided _______ proof that exonerated the wrongfully convicted defendant.',
    answer: 'INCONTROVERTIBLE',
    acceptedAnswers: ['INCONTROVERTIBLE', 'incontrovertible'],
    rule: 'C2 Spelling Shift: CONTROVERSY → INCONTROVERTIBLE',
    vi: 'Bẫy chính tả kinh điển đề HSGQG: CONTROVERSY đổi "-sy" thành "-tible" -> INCONTROVERTIBLE (không thể chối cãi/bác bỏ).',
    en: 'CONTROVERSY -> INCONTROVERTIBLE (not able to be denied or disputed).',
    vocab: { term: 'incontrovertible proof', category: 'WORD FORMATION', meaningVi: 'bằng chứng không thể chối cãi', example: 'The prosecutor presented incontrovertible forensic evidence.' }
  },
  {
    rootWord: 'RECONCILE',
    givenWord: 'RECONCILE',
    stem: 'Negotiations collapsed due to _______ ideological differences between the two coalition partners.',
    answer: 'IRRECONCILABLE',
    acceptedAnswers: ['IRRECONCILABLE', 'irreconcilable'],
    rule: 'Assimilated Prefix "ir-": RECONCILE → IRRECONCILABLE',
    vi: 'Cần tính từ trước "ideological differences": IRRECONCILABLE (không thể dung hòa/hàn gắn được).',
    en: 'RECONCILE -> IRRECONCILABLE (so different that agreement is impossible).',
    vocab: { term: 'irreconcilable differences', category: 'WORD FORMATION', meaningVi: 'những bất đồng không thể dung hòa', example: 'The talks broke down over irreconcilable differences.' }
  },
  {
    rootWord: 'DISPENSE',
    givenWord: 'DISPENSE',
    stem: 'Peer-reviewed replication remains an _______ cornerstone of the empirical scientific method.',
    answer: 'INDISPENSABLE',
    acceptedAnswers: ['INDISPENSABLE', 'indispensable'],
    rule: 'Verb to Negative Adjective: DISPENSE → INDISPENSABLE',
    vi: 'Sau mạo từ "an" cần tính từ bắt đầu bằng nguyên âm: INDISPENSABLE (tối quan trọng, không thể thiếu). Lưu ý đuôi "-able".',
    en: 'DISPENSE -> INDISPENSABLE (absolutely necessary).',
    vocab: { term: 'indispensable cornerstone', category: 'WORD FORMATION', meaningVi: 'nền tảng tối quan trọng không thể thiếu', example: 'Trust is an indispensable cornerstone of diplomacy.' }
  },
  {
    rootWord: 'EXPLAIN',
    givenWord: 'EXPLAIN',
    stem: 'For reasons that remain _______ to marine biologists, the entire pod of whales strayed into shallow coastal waters.',
    answer: 'INEXPLICABLE',
    acceptedAnswers: ['INEXPLICABLE', 'inexplicable'],
    rule: 'Root Vowel/Consonant Shift: EXPLAIN → INEXPLICABLE',
    vi: 'EXPLAIN biến đổi gốc Latin thành "-plic-" -> INEXPLICABLE (không thể lý giải được). Không dùng "unexplainable" trong văn phong C2.',
    en: 'EXPLAIN -> INEXPLICABLE (unable to be explained or accounted for).',
    vocab: { term: 'remain inexplicable', category: 'WORD FORMATION', meaningVi: 'vẫn không thể lý giải được', example: 'The sudden disappearance remained inexplicable.' }
  },
  {
    rootWord: 'PLACE',
    givenWord: 'PLACE',
    stem: 'The fire destroyed _______ medieval tapestries that had hung in the cathedral for six centuries.',
    answer: 'IRREPLACEABLE',
    acceptedAnswers: ['IRREPLACEABLE', 'irreplaceable'],
    rule: 'Retention of "-e" before "-able": PLACE → IRREPLACEABLE',
    vi: 'Giữ nguyên chữ "e" sau "c" để phát âm /s/: IRREPLACEABLE (vô giá, không thể thay thế được).',
    en: 'PLACE -> REPLACE -> IRREPLACEABLE (impossible to replace if lost or damaged).',
    vocab: { term: 'irreplaceable heritage', category: 'WORD FORMATION', meaningVi: 'di sản vô giá không thể thay thế', example: 'The flood damaged irreplaceable historical manuscripts.' }
  },
  {
    rootWord: 'PERCEIVE',
    givenWord: 'PERCEIVE',
    stem: 'Crustal tectonic plates shift at an _______ slow pace of slechts a few millimeters per year.',
    answer: 'IMPERCEPTIBLY',
    acceptedAnswers: ['IMPERCEPTIBLY', 'imperceptibly'],
    rule: 'Verb to Negative Adverb: PERCEIVE → IMPERCEPTIBLY',
    vi: 'Trước tính từ "slow" cần một trạng từ: PERCEIVE -> PERCEPTIBLE -> IMPERCEPTIBLY (một cách cực nhỏ khó nhận thấy bằng giác quan).',
    en: 'PERCEIVE -> IMPERCEPTIBLY (in a way that is so slight or gradual as not to be perceived).',
    vocab: { term: 'imperceptibly slow', category: 'WORD FORMATION', meaningVi: 'chậm đến mức khó nhận biết được', example: 'The glacier moved imperceptibly down the valley.' }
  },
  {
    rootWord: 'COMPARE',
    givenWord: 'COMPARE',
    stem: 'The Stradivarius violin possesses an _______ tonal richness that modern luthiers still struggle to replicate.',
    answer: 'INCOMPARABLE',
    acceptedAnswers: ['INCOMPARABLE', 'incomparable'],
    rule: 'Verb to Negative Adjective: COMPARE → INCOMPARABLE',
    vi: 'Sau mạo từ "an" cần tính từ: INCOMPARABLE (tuyệt vời, vô song không gì sánh kịp).',
    en: 'COMPARE -> INCOMPARABLE (without an equal in quality or extent; matchless).',
    vocab: { term: 'incomparable richness', category: 'WORD FORMATION', meaningVi: 'sự phong phú vô song không gì sánh bằng', example: 'She performed with incomparable grace.' }
  },
  {
    rootWord: 'VARY',
    givenWord: 'VARY',
    stem: 'Attempts to impose rigid price ceilings _______ lead to supply shortages and black-market speculation.',
    answer: 'INVARIABLY',
    acceptedAnswers: ['INVARIABLY', 'invariably'],
    rule: 'Verb to Negative Adverb: VARY → INVARIABLY',
    vi: 'Cần trạng từ bổ nghĩa cho động từ "lead": INVARIABLY (luôn luôn, hầu như không bao giờ có ngoại lệ).',
    en: 'VARY -> INVARIABLY (in every case or on every occasion; always).',
    vocab: { term: 'invariably lead to', category: 'WORD FORMATION', meaningVi: 'luôn luôn dẫn đến (không có ngoại lệ)', example: 'Hasty legislation invariably leads to unintended loopholes.' }
  },
  {
    rootWord: 'REPAIR',
    givenWord: 'REPAIR',
    stem: 'The leaked recordings inflicted _______ damage on the prime minister’s credibility.',
    answer: 'IRREPARABLE',
    acceptedAnswers: ['IRREPARABLE', 'irreparable'],
    rule: 'Vowel Reduction in Root: REPAIR → IRREPARABLE',
    vi: 'Bẫy chính tả: REPAIR bỏ chữ "i" khi thêm "-able" -> IRREPARABLE (không thể cứu vãn/khắc phục được).',
    en: 'REPAIR -> IRREPARABLE (impossible to rectify or repair).',
    vocab: { term: 'inflict irreparable damage', category: 'WORD FORMATION', meaningVi: 'gây tổn hại không thể cứu vãn', example: 'Oil spills inflict irreparable damage on marine ecosystems.' }
  },
  {
    rootWord: 'DEFEND',
    givenWord: 'DEFEND',
    stem: 'From an ethical standpoint, exploiting child labor in global supply chains is utterly _______.',
    answer: 'INDEFENSIBLE',
    acceptedAnswers: ['INDEFENSIBLE', 'indefensible'],
    rule: 'Consonant Shift "-d" to "-sible": DEFEND → INDEFENSIBLE',
    vi: 'DEFEND đổi "-d" thành "-sible" -> INDEFENSIBLE (không thể bào chữa hay biện minh được).',
    en: 'DEFEND -> INDEFENSIBLE (not justifiable by argument).',
    vocab: { term: 'ethically indefensible', category: 'WORD FORMATION', meaningVi: 'không thể bào chữa về mặt đạo đức', example: 'Such negligence is morally indefensible.' }
  }
].map((item, idx) => ({
  ...item,
  stem: item.stem.replace('slechts ', '')
}));

// ============================================================================
// ERROR IDENTIFICATION & CORRECTION BANK (10 UNIQUE ITEMS)
// ============================================================================
const MASTER_ERROR_CORRECTION_BANK = [
  {
    stem: 'Identify the error: "Scarcely (A) the autonomous lander had touched (B) down on the lunar regolith when (C) its solar arrays malfunctioned (D)."',
    options: [
      { id: 'A', text: '(A) Scarcely -> Hardly' },
      { id: 'B', text: '(B) the autonomous lander had touched -> had the autonomous lander touched' },
      { id: 'C', text: '(C) when -> than' },
      { id: 'D', text: '(D) malfunctioned -> had malfunctioned' }
    ],
    answer: 'B',
    rule: 'Inversion Error after "Scarcely"',
    vi: '"Scarcely" đứng đầu câu bắt buộc đảo trợ động từ "had" lên trước chủ ngữ ("had the autonomous lander touched").',
    en: 'Fronted "Scarcely" requires inversion of the past perfect auxiliary "had".',
    vocab: { term: 'lunar regolith', category: 'ACADEMIC LEXIS', meaningVi: 'lớp đất đá bề mặt Mặt Trăng', example: 'The rover collected samples of lunar regolith.' }
  },
  {
    stem: 'Identify the error: "The regulatory agency insisted that the biotech startup (A) discloses (B) all adverse reactions observed (C) during Phase II trials (D)."',
    options: [
      { id: 'A', text: '(A) insisted -> insisting' },
      { id: 'B', text: '(B) discloses -> disclose' },
      { id: 'C', text: '(C) observed -> observing' },
      { id: 'D', text: '(D) during -> while' }
    ],
    answer: 'B',
    rule: 'Mandative Subjunctive Error',
    vi: 'Sau "insisted that + S + V_bare", động từ phải ở dạng nguyên mẫu không chia ("disclose", không phải "discloses").',
    en: '"Insist that" triggers the mandative subjunctive (bare infinitive "disclose").',
    vocab: { term: 'adverse reactions', category: 'COLLOCATION', meaningVi: 'các phản ứng phụ bất lợi', example: 'Patients were monitored for adverse reactions.' }
  },
  {
    stem: 'Identify the error: "A large number of (A) empirical research (B) corroborates (C) the hypothesis that chronic sleep deprivation impairs neurogenesis (D)."',
    options: [
      { id: 'A', text: '(A) A large number of -> A great deal of' },
      { id: 'B', text: '(B) research -> researches' },
      { id: 'C', text: '(C) corroborates -> corroborate' },
      { id: 'D', text: '(D) impairs -> impair' }
    ],
    answer: 'A',
    rule: 'Quantifier Agreement with Uncountable Noun ("research")',
    vi: '"Research" là danh từ KHÔNG đếm được nên không thể đi với "A large number of"; phải sửa thành "A great deal of" hoặc "A large body of".',
    en: '"Research" is an uncountable noun and requires "a great deal of" or "a large body of".',
    vocab: { term: 'corroborate a hypothesis', category: 'COLLOCATION', meaningVi: 'củng cố / xác nhận một giả thuyết khoa học', example: 'Experimental data corroborated the hypothesis.' }
  },
  {
    stem: 'Identify the error: "Not only the austerity measures exacerbated (A) urban unemployment, but they also (B) triggered (C) widespread civil unrest (D)."',
    options: [
      { id: 'A', text: '(A) the austerity measures exacerbated -> did the austerity measures exacerbate' },
      { id: 'B', text: '(B) but they also -> and also' },
      { id: 'C', text: '(C) triggered -> triggering' },
      { id: 'D', text: '(D) widespread -> widely' }
    ],
    answer: 'A',
    rule: 'Missing Inversion after Fronted "Not only"',
    vi: 'Khi "Not only" đứng đầu câu bổ nghĩa cho cả mệnh đề, phải đảo trợ động từ: "Not only did the austerity measures exacerbate...".',
    en: 'Fronted clause-initial "Not only" requires subject-auxiliary inversion.',
    vocab: { term: 'austerity measures', category: 'COLLOCATION', meaningVi: 'các biện pháp thắt lưng buộc bụng', example: 'Strict austerity measures sparked public protests.' }
  },
  {
    stem: 'Identify the error: "Having deprived (A) of sunlight for decades, the subterranean cave crustaceans evolved (B) heightened tactile receptors in lieu of (C) functional eyes (D)."',
    options: [
      { id: 'A', text: '(A) Having deprived -> Having been deprived' },
      { id: 'B', text: '(B) evolved -> were evolving' },
      { id: 'C', text: '(C) in lieu of -> in spite of' },
      { id: 'D', text: '(D) functional -> functioning' }
    ],
    answer: 'A',
    rule: 'Passive Perfect Participle ("Having been deprived")',
    vi: 'Chủ ngữ "crustaceans" (loài giáp xác) BỊ tước đoạt ánh sáng mặt trời -> phải dùng phân từ hoàn thành bị động "Having been deprived of".',
    en: 'Passive meaning requires the perfect passive participle "Having been deprived".',
    vocab: { term: 'in lieu of', category: 'PREPOSITIONAL PHRASE', meaningVi: 'thay vì, thay thế cho', example: 'They accepted equity in lieu of cash payment.' }
  },
  {
    stem: 'Identify the error: "The committee comprised of (A) twelve eminent epidemiologists who were tasked with (B) drafting (C) the national pandemic containment protocol (D)."',
    options: [
      { id: 'A', text: '(A) comprised of -> comprised (or consisted of)' },
      { id: 'B', text: '(B) tasked with -> tasked to' },
      { id: 'C', text: '(C) drafting -> draft' },
      { id: 'D', text: '(D) containment -> containing' }
    ],
    answer: 'A',
    rule: 'Active Usage of "comprise" (No "of" in active voice)',
    vi: 'Ở thể chủ động, "comprise" (= consist of) KHÔNG đi với giới từ "of". Chỉ dùng "be comprised of" hoặc "comprise + tân ngữ".',
    en: 'In standard formal English, active "comprise" does not take the preposition "of".',
    vocab: { term: 'eminent epidemiologists', category: 'COLLOCATION', meaningVi: 'các nhà dịch tễ học lỗi lạc', example: 'The panel comprised twelve eminent epidemiologists.' }
  }
];

// ============================================================================
// PACK 5: OPEN CLOZE, GUIDED CLOZE & ACADEMIC READING PASSAGES
// ============================================================================
const OPEN_CLOZE_PASSAGE_HTML = `
<p>In contemporary cognitive science, few phenomena have provoked as much debate as the <strong>(31) {{31}}</strong> of external digital memory. Whereas human beings once relied <strong>(32) {{32}}</strong> internal hippocampal networks to encode and retrieve lived experience, the ubiquity of cloud-based search engines has fundamentally altered how we interact with knowledge. Rather <strong>(33) {{33}}</strong> memorizing facts themselves, modern learners increasingly remember merely where to locate information—a cognitive shortcut known as the "Google Effect."</p>
<p>While such offloading undeniably liberates working memory <strong>(34) {{34}}</strong> routine clerical tasks, neurobiologists warn that it comes at a steep epistemic <strong>(35) {{35}}</strong>. Deep conceptual creativity does not occur in a vacuum; <strong>(36) {{36}}</strong> the contrary, it depends on a dense internal web of schemas that can be cross-referenced spontaneously. <strong>(37) {{37}}</strong> students delegate this foundational synthesis to algorithmic tools, their capacity for critical discernment risks falling <strong>(38) {{38}}</strong> atrophy. Consequently, educators are called <strong>(39) {{39}}</strong> to design assessments that reward deep structural reasoning <strong>(40) {{40}}</strong> passive information retrieval.</p>
`;

const MASTER_OPEN_CLOZE_QUESTIONS = [
  { number: 31, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (31): "...the (31) _______ of external digital memory."', answer: 'rise', acceptedAnswers: ['rise', 'advent', 'proliferation', 'emergence'], rule: 'Collocation: "the rise/advent/proliferation of"', vi: 'Điền "rise" / "advent" / "proliferation" (sự trỗi dậy/xuất hiện của bộ nhớ số bên ngoài).', en: 'The rise/advent of external digital memory.', vocab: { term: 'the advent of', category: 'COLLOCATION', meaningVi: 'sự ra đời / xuất hiện của', example: 'The advent of cloud computing transformed education.' } },
  { number: 32, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (32): "...relied (32) _______ internal hippocampal networks..."', answer: 'on', acceptedAnswers: ['on', 'upon'], rule: 'Prepositional Verb: "rely on/upon"', vi: 'Cấu trúc "rely on / upon" (dựa vào mạng lưới hồi hải mã bên trong).', en: 'Rely takes the preposition on or upon.', vocab: { term: 'rely upon', category: 'PREPOSITION', meaningVi: 'dựa vào, phụ thuộc vào', example: 'Scholars relied upon archival indices.' } },
  { number: 33, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (33): "Rather (33) _______ memorizing facts themselves..."', answer: 'than', acceptedAnswers: ['than'], rule: 'Correlative Marker: "Rather than + V-ing"', vi: 'Cụm liên từ "Rather than + V-ing" (Thay vì tự ghi nhớ dữ kiện).', en: 'Rather than introduces a rejected alternative.', vocab: { term: 'rather than', category: 'DISCOURSE MARKER', meaningVi: 'thay vì', example: 'Rather than memorizing dates, analyze the causes.' } },
  { number: 34, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (34): "...liberates working memory (34) _______ routine clerical tasks..."', answer: 'from', acceptedAnswers: ['from'], rule: 'Verb + Preposition: "liberate A from B"', vi: 'Cấu trúc "liberate somebody/something from..." (giải phóng trí nhớ làm việc khỏi các tác vụ lặt vặt).', en: 'Liberate collocates with the preposition from.', vocab: { term: 'liberate from', category: 'COLLOCATION', meaningVi: 'giải phóng khỏi', example: 'Automation liberated workers from repetitive tasks.' } },
  { number: 35, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (35): "...it comes at a steep epistemic (35) _______."', answer: 'cost', acceptedAnswers: ['cost', 'price'], rule: 'Idiom: "come at a steep cost/price"', vi: 'Thành ngữ "come at a steep cost/price" (phải trả một cái giá đắt về mặt nhận thức).', en: 'To come at a steep cost/price means to involve a heavy sacrifice.', vocab: { term: 'come at a steep cost', category: 'IDIOM', meaningVi: 'phải trả một cái giá rất đắt', example: 'Convenience often comes at a steep epistemic cost.' } },
  { number: 36, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (36): "...(36) _______ the contrary, it depends on..."', answer: 'on', acceptedAnswers: ['on'], rule: 'Discourse Marker: "on the contrary"', vi: 'Cụm chuyển ý tương phản "on the contrary" (trái lại, ngược lại hoàn toàn).', en: '"On the contrary" intensifies denial of the preceding negative statement.', vocab: { term: 'on the contrary', category: 'DISCOURSE MARKER', meaningVi: 'trái lại, ngược lại hoàn toàn', example: 'Creativity is not random; on the contrary, it is disciplined.' } },
  { number: 37, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (37): "(37) _______ students delegate this foundational synthesis..."', answer: 'When', acceptedAnswers: ['When', 'Whenever', 'If', 'Once'], rule: 'Temporal/Conditional Conjunction', vi: 'Điền liên từ "When / Whenever / Once / If" mở đầu mệnh đề phụ chỉ điều kiện/thời gian.', en: 'When/Once introduces the conditional-temporal clause.', vocab: { term: 'delegate synthesis to', category: 'COLLOCATION', meaningVi: 'ủy thác việc tổng hợp tri thức cho', example: 'When learners delegate synthesis to AI, retention drops.' } },
  { number: 38, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (38): "...risks falling (38) _______ atrophy."', answer: 'into', acceptedAnswers: ['into'], rule: 'Collocation: "fall into atrophy / disrepair / decline"', vi: 'Cụm cố định "fall into atrophy / decline" (rơi vào trạng thái suy thoái / mai một).', en: '"Fall into atrophy/disuse" is a fixed formal collocation.', vocab: { term: 'fall into atrophy', category: 'COLLOCATION', meaningVi: 'rơi vào trạng thái thoái hóa / mai một', example: 'Unused cognitive faculties quickly fall into atrophy.' } },
  { number: 39, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (39): "...educators are called (39) _______ to design assessments..."', answer: 'upon', acceptedAnswers: ['upon', 'on'], rule: 'Phrasal Verb: "be called upon/on to do something"', vi: '"Be called upon/on to V" = được kêu gọi, được yêu cầu thực hiện trọng trách.', en: 'To be called upon to do something means to be formally asked or required to do it.', vocab: { term: 'be called upon to', category: 'PHRASAL VERB', meaningVi: 'được kêu gọi / giao trọng trách làm gì', example: 'Educators are called upon to foster critical inquiry.' } },
  { number: 40, type: 'open_cloze', stem: 'Điền 1 từ phù hợp vào chỗ trống (40): "...reward deep structural reasoning (40) _______ passive information retrieval."', answer: 'over', acceptedAnswers: ['over', 'above'], rule: 'Preposition of Preference: "reward/prioritize A over B"', vi: 'Cấu trúc "reward/prioritize A over B" (đề cao tư duy cấu trúc sâu hơn là việc truy xuất thụ động).', en: '"Over" expresses preference or priority between two competing approaches.', vocab: { term: 'prioritize depth over speed', category: 'COLLOCATION', meaningVi: 'ưu tiên chiều sâu hơn tốc độ', example: 'The rubric rewards analytical depth over rote recall.' } }
];

const GUIDED_CLOZE_PASSAGE_HTML = `
<p>The contemporary resurgence of "ecological urbanism" has been widely lauded as a panacea for post-industrial cities. Municipal authorities across the globe have poured billions into converting derelict rail corridors into elevated botanical promenades. Yet urban sociologists warn that such initiatives frequently <strong>(41) _______</strong> a troubling paradox known as "green gentrification." While newly landscaped districts undeniably <strong>(42) _______</strong> ambient air quality and bolster municipal tax revenues, they simultaneously trigger speculative real-estate bubbles that price out long-standing working-class residents.</p>
<p>In the absence of robust rent-stabilization mandates, environmental remediation inadvertently becomes an instrument of socioeconomic exclusion. What appears <strong>(43) _______</strong> progressive on architectural blueprints often <strong>(44) _______</strong> vulnerable demographics to the under-resourced urban periphery. Rather than dismantling spatial inequality, poorly calibrated interventions risk <strong>(45) _______</strong> existing class divides. Furthermore, the post-pandemic <strong>(46) _______</strong> of remote work has disproportionately benefited affluent knowledge workers, whereas essential service personnel remain <strong>(47) _______</strong> to grueling cross-city commutes. Reconciling ecological vitality with housing equity therefore <strong>(48) _______</strong> a fundamental departure from market-led redevelopment. Only when municipalities anchor green infrastructure within statutory community land trusts can urban renewal avoid becoming a <strong>(49) _______</strong> for displacement and instead foster genuine civic <strong>(50) _______</strong>.</p>
`;

const MASTER_GUIDED_CLOZE_QUESTIONS = [
  { number: 41, type: 'mcq', stem: 'Question 41: Choose the best word for blank (41) in the Guided Cloze passage:', options: [{ id: 'A', text: 'engender' }, { id: 'B', text: 'extinguish' }, { id: 'C', text: 'exonerate' }, { id: 'D', text: 'extrapolate' }], answer: 'A', rule: 'C2 Verb Collocation: "engender a paradox/conflict"', vi: '"Engender a paradox" = làm nảy sinh, tạo ra một nghịch lý.', en: 'To engender means to cause or give rise to a feeling, situation, or condition.', vocab: { term: 'engender a paradox', category: 'COLLOCATION', meaningVi: 'làm nảy sinh một nghịch lý', example: 'Green urbanism can inadvertently engender a social paradox.' } },
  { number: 42, type: 'mcq', stem: 'Question 42: Choose the best word for blank (42) in the Guided Cloze passage:', options: [{ id: 'A', text: 'ameliorate' }, { id: 'B', text: 'deteriorate' }, { id: 'C', text: 'obliterate' }, { id: 'D', text: 'procrastinate' }], answer: 'A', rule: 'C2 Verb: "ameliorate conditions/quality"', vi: '"Ameliorate" = cải thiện, làm cho tốt hơn (chất lượng không khí/điều kiện sống).', en: 'To ameliorate means to make something bad or unsatisfactory better.', vocab: { term: 'ameliorate air quality', category: 'ACADEMIC LEXIS', meaningVi: 'cải thiện chất lượng không khí', example: 'Urban canopies help ameliorate ambient air quality.' } },
  { number: 43, type: 'mcq', stem: 'Question 43: Choose the best word for blank (43) in the Guided Cloze passage:', options: [{ id: 'A', text: 'ostensibly' }, { id: 'B', text: 'ostentatiously' }, { id: 'C', text: 'obliviously' }, { id: 'D', text: 'obsequiously' }], answer: 'A', rule: 'C2 Adverb: "ostensibly progressive"', vi: '"Ostensibly" = bề ngoài có vẻ là (nhưng thực tế ẩn chứa mặt trái).', en: 'Ostensibly means apparently or purportedly, though perhaps not actually.', vocab: { term: 'ostensibly progressive', category: 'COLLOCATION', meaningVi: 'bề ngoài có vẻ tiến bộ', example: 'The policy was ostensibly progressive but regressive in practice.' } },
  { number: 44, type: 'mcq', stem: 'Question 44: Choose the best word for blank (44) in the Guided Cloze passage:', options: [{ id: 'A', text: 'relegates' }, { id: 'B', text: 'subscribes' }, { id: 'C', text: 'concedes' }, { id: 'D', text: 'alludes' }], answer: 'A', rule: 'C2 Verb Structure: "relegate A to the periphery"', vi: '"Relegate someone to the periphery" = đẩy nhóm yếu thế ra vùng ven đô.', en: 'To relegate means to consign to an inferior or marginalized position.', vocab: { term: 'relegate to the periphery', category: 'COLLOCATION', meaningVi: 'đẩy ra vùng rìa / ven đô', example: 'Rising rents relegated low-income workers to the periphery.' } },
  { number: 45, type: 'mcq', stem: 'Question 45: Choose the best word for blank (45) in the Guided Cloze passage:', options: [{ id: 'A', text: 'entrenching' }, { id: 'B', text: 'alleviating' }, { id: 'C', text: 'obviating' }, { id: 'D', text: 'placating' }], answer: 'A', rule: 'C2 Collocation: "entrench class divides"', vi: '"Entrench existing class divides" = làm bám rễ sâu hơn sự phân hóa giai cấp.', en: 'To entrench means to establish a division so firmly that change is very difficult.', vocab: { term: 'entrench class divides', category: 'COLLOCATION', meaningVi: 'khoét sâu thêm sự phân hóa giai cấp', example: 'Uncalibrated subsidies risk entrenching class divides.' } },
  { number: 46, type: 'mcq', stem: 'Question 46: Choose the best word for blank (46) in the Guided Cloze passage:', options: [{ id: 'A', text: 'proliferation' }, { id: 'B', text: 'procrastination' }, { id: 'C', text: 'proclamation' }, { id: 'D', text: 'propitiation' }], answer: 'A', rule: 'C2 Noun: "the proliferation of remote work"', vi: '"The proliferation of remote work" = sự bùng nổ/lan rộng của hình thức làm việc từ xa.', en: 'Proliferation refers to rapid multiplication or widespread expansion.', vocab: { term: 'proliferation of', category: 'COLLOCATION', meaningVi: 'sự bùng nổ lan rộng của', example: 'The proliferation of remote work reshaped urban transit.' } },
  { number: 47, type: 'mcq', stem: 'Question 47: Choose the best word for blank (47) in the Guided Cloze passage:', options: [{ id: 'A', text: 'tethered' }, { id: 'B', text: 'sundered' }, { id: 'C', text: 'squandered' }, { id: 'D', text: 'meandered' }], answer: 'A', rule: 'C2 Participial Adjective: "remain tethered to"', vi: '"Remain tethered to" = vẫn bị trói buộc chặt vào những chuyến đi làm xa vất vả.', en: 'Tethered to means bound or tied closely to a constraint.', vocab: { term: 'remain tethered to', category: 'COLLOCATION', meaningVi: 'bị trói buộc chặt vào', example: 'Service workers remain tethered to physical workplaces.' } },
  { number: 48, type: 'mcq', stem: 'Question 48: Choose the best word for blank (48) in the Guided Cloze passage:', options: [{ id: 'A', text: 'necessitates' }, { id: 'B', text: 'incapacitates' }, { id: 'C', text: 'decapitates' }, { id: 'D', text: 'rehabilitates' }], answer: 'A', rule: 'C1/C2 Formal Verb: "necessitate a departure"', vi: '"Necessitates" = đòi hỏi tất yếu một sự thay đổi căn bản.', en: 'To necessitate means to make something necessary as a result or consequence.', vocab: { term: 'necessitate a departure from', category: 'COLLOCATION', meaningVi: 'đòi hỏi phải từ bỏ lối mòn cũ', example: 'Climate resilience necessitates a departure from laissez-faire urbanism.' } },
  { number: 49, type: 'mcq', stem: 'Question 49: Choose the best word for blank (49) in the Guided Cloze passage:', options: [{ id: 'A', text: 'catalyst' }, { id: 'B', text: 'cataclysm' }, { id: 'C', text: 'catechism' }, { id: 'D', text: 'catapult' }], answer: 'A', rule: 'C1/C2 Metaphor: "a catalyst for displacement"', vi: '"A catalyst for displacement" = chất xúc tác thúc đẩy sự di dời cư dân nghèo.', en: 'A catalyst is an agent that provokes or speeds significant change.', vocab: { term: 'catalyst for displacement', category: 'COLLOCATION', meaningVi: 'tác nhân thúc đẩy sự đẩy đuổi cư dân', example: 'Speculative zoning acted as a catalyst for displacement.' } },
  { number: 50, type: 'mcq', stem: 'Question 50: Choose the best word for blank (50) in the Guided Cloze passage:', options: [{ id: 'A', text: 'inclusivity' }, { id: 'B', text: 'impulsivity' }, { id: 'C', text: 'incredulity' }, { id: 'D', text: 'indemnity' }], answer: 'A', rule: 'C1/C2 Noun: "foster genuine civic inclusivity"', vi: '"Civic inclusivity" = sự bao trùm, dung nạp công dân thuộc mọi tầng lớp.', en: 'Inclusivity is the practice of providing equal access to opportunities and resources.', vocab: { term: 'civic inclusivity', category: 'COLLOCATION', meaningVi: 'sự dung hợp / công bằng cho mọi công dân', example: 'Public parks should foster genuine civic inclusivity.' } }
];

const READING_PASSAGE_HTML = `
<p><strong>Paragraph 1:</strong> For much of the twentieth century, historiography was dominated by the "Great Man" paradigm, which posited that epochal shifts in human civilization were chiefly the handiwork of charismatic statesmen, military commanders, and solitary scientific geniuses. However, the rise of the <em>Annales</em> school in France fundamentally subverted this event-centric orthodoxy. Pioneered by Marc Bloch and Fernand Braudel, this movement contended that political drama is merely the "crest of foam" riding upon deeper, slower currents of geographical constraint, demographic pressure, and collective mentalities—what Braudel memorably termed the <em>longue durée</em>.</p>
<p><strong>Paragraph 2:</strong> Viewed through the prism of the <em>longue durée</em>, the fall of empires or the eruption of revolutions can rarely be attributed to the caprice of a single monarch. Instead, such ruptures represent the culmination of centuries-long structural stresses: soil exhaustion, shifting trade winds, monetarist inflation, or agrarian demographic ceilings. While traditional chroniclers fixated on diplomatic treaties signed in gilded palaces, structural historians turned their gaze toward parish registries, grain price ledgers, and dendrochronological ice cores.</p>
<p><strong>Paragraph 3:</strong> Yet in recent decades, critics have cautioned against swinging the pendulum too far toward geographic or economic determinism. By reducing human beings to passive marionettes of climatic and material forces, extreme structuralism risks erasing moral agency and ideological contingency. Contemporary "microhistory" seeks to synthesize both scales: examining how ordinary artisans, dissidents, and marginalized communities navigated, resisted, and occasionally reshaped the macro-structural constraints of their era.</p>
`;

const MASTER_READING_QUESTIONS = [
  { number: 51, type: 'mcq', stem: 'Question 51: What is the primary purpose of Paragraph 1?', options: [{ id: 'A', text: 'To contrast traditional individual-centered history with the structural approach of the Annales school.' }, { id: 'B', text: 'To argue that military commanders played no role in twentieth-century geopolitics.' }, { id: 'C', text: 'To criticize Fernand Braudel for ignoring geographical constraints.' }, { id: 'D', text: 'To chronicle the biographical rivalry between Marc Bloch and traditional diplomats.' }], answer: 'A', rule: 'Reading for Rhetorical Purpose', vi: 'Đoạn 1 đối chiếu hệ hình "Vĩ nhân" truyền thống với trường phái Annales chú trọng cấu trúc dài hạn (longue durée).', en: 'Paragraph 1 contrasts the Great Man paradigm with the structural Annales school.', vocab: { term: 'subvert an orthodoxy', category: 'COLLOCATION', meaningVi: 'lật đổ một quan niệm chính thống cũ', example: 'The Annales school subverted event-centric orthodoxy.' } },
  { number: 52, type: 'mcq', stem: 'Question 52: In Paragraph 1, what does Braudel’s metaphor "crest of foam" imply about political events?', options: [{ id: 'A', text: 'They are superficial manifestations of much deeper, long-term structural forces.' }, { id: 'B', text: 'They are the primary driving force behind climatic and demographic change.' }, { id: 'C', text: 'They are completely fabricated by biased court chroniclers.' }, { id: 'D', text: 'They occur exclusively in maritime empires.' }], answer: 'A', rule: 'Metaphorical Inference in C2 Reading', vi: 'Hình ảnh "bọt sóng trên ngọn" (crest of foam) ám chỉ các sự kiện chính trị chỉ là biểu hiện bề mặt của những dòng chảy cấu trúc sâu thẳm bên dưới.', en: 'Political drama is portrayed as surface-level compared to deep structural currents.', vocab: { term: 'longue durée', category: 'ACADEMIC LEXIS', meaningVi: 'nhịp thời gian cấu trúc trường kỳ trong sử học', example: 'Braudel analyzed Mediterranean history through the longue durée.' } },
  { number: 53, type: 'mcq', stem: 'Question 53: The word "caprice" in Paragraph 2 is closest in meaning to:', options: [{ id: 'A', text: 'impulsive whim' }, { id: 'B', text: 'calculated strategy' }, { id: 'C', text: 'constitutional mandate' }, { id: 'D', text: 'military incompetence' }], answer: 'A', rule: 'C2 Vocabulary in Context: "caprice"', vi: '"Caprice" = sự thất thường, ý thích bốc đồng nhất thời (= impulsive whim).', en: 'Caprice means a sudden and unaccountable change of mood or behavior; a whim.', vocab: { term: 'the caprice of', category: 'ACADEMIC LEXIS', meaningVi: 'sự thất thường / ý muốn bốc đồng của', example: 'History cannot be explained by the caprice of monarchs.' } },
  { number: 54, type: 'mcq', stem: 'Question 54: Why did structural historians examine "grain price ledgers and dendrochronological ice cores" (Paragraph 2)?', options: [{ id: 'A', text: 'To reconstruct long-term material, economic, and environmental pressures on societies.' }, { id: 'B', text: 'To verify the exact dates when diplomatic treaties were signed in palaces.' }, { id: 'C', text: 'To prove that agriculture was more profitable than maritime trade.' }, { id: 'D', text: 'To replace historical writing with pure geological science.' }], answer: 'A', rule: 'Supporting Evidence Comprehension', vi: 'Các sử gia cấu trúc nghiên cứu sổ giá ngũ cốc và lõi băng để tái dựng các áp lực vật chất, kinh tế và khí hậu dài hạn.', en: 'Such empirical sources reveal centuries-long structural stresses.', vocab: { term: 'structural stresses', category: 'COLLOCATION', meaningVi: 'những sức ép mang tính cấu trúc', example: 'Revolutions often stem from centuries-long structural stresses.' } },
  { number: 55, type: 'mcq', stem: 'Question 55: According to Paragraph 3, what is the main criticism leveled against extreme structuralism?', options: [{ id: 'A', text: 'It risks stripping individuals of moral responsibility and historical agency.' }, { id: 'B', text: 'It places excessive emphasis on the biographies of solitary geniuses.' }, { id: 'C', text: 'It relies too heavily on unreliable oral traditions.' }, { id: 'D', text: 'It ignores the impact of soil exhaustion and inflation.' }], answer: 'A', rule: 'Identifying Counter-Arguments in C2 Prose', vi: 'Đoạn 3 chỉ rõ: chủ nghĩa cấu trúc cực đoan biến con người thành "con rối thụ động" và xóa nhòa năng lực hành động đạo đức (moral agency).', en: 'Extreme structuralism risks erasing moral agency and ideological contingency.', vocab: { term: 'moral agency', category: 'COLLOCATION', meaningVi: 'năng lực tự chủ và chịu trách nhiệm đạo đức', example: 'Determinism risks erasing human moral agency.' } },
  { number: 56, type: 'mcq', stem: 'Question 56: How does contemporary "microhistory" resolve the tension described in the passage?', options: [{ id: 'A', text: 'By exploring how ordinary people actively negotiated and resisted large-scale structural constraints.' }, { id: 'B', text: 'By returning exclusively to the study of monarchs and military generals.' }, { id: 'C', text: 'By abandoning archival research in favor of computer simulations.' }, { id: 'D', text: 'By proving that geography has zero influence on human culture.' }], answer: 'A', rule: 'Synthesis Question', vi: 'Vi sử học (microhistory) dung hòa cả hai cấp độ bằng cách khảo sát cách những con người bình thường xoay xở, phản kháng và định hình lại các ràng buộc cấu trúc vĩ mô.', en: 'Microhistory synthesizes both scales by studying how ordinary people navigated macro-constraints.', vocab: { term: 'ideological contingency', category: 'ACADEMIC LEXIS', meaningVi: 'tính ngẫu nhiên / biến số về mặt tư tưởng', example: 'Historians must account for ideological contingency.' } }
];

// ============================================================================
// PACK 6: KEYWORD SENTENCE TRANSFORMATIONS (8 UNIQUE ITEMS)
// ============================================================================
const MASTER_SENTENCE_TRANSFORM_BANK = [
  {
    keyword: ' ILLUSION',
    promptPrefix: 'The minister was under',
    stem: 'Rewrite using "ILLUSION": The minister was fully aware that the austerity package would provoke fierce union resistance.',
    answer: 'The minister was under no illusion that the austerity package would provoke fierce union resistance.',
    acceptedAnswers: [
      'The minister was under no illusion that the austerity package would provoke fierce union resistance.',
      'under no illusion that the austerity package would provoke fierce union resistance'
    ],
    rule: 'C2 Idiom: "be under no illusion (that)"',
    vi: '"Be under no illusion that..." = hoàn toàn nhận thức rõ thực tế phũ phàng rằng (không hề ảo tưởng).',
    en: 'To be under no illusion means to be fully aware of the true state of affairs.',
    vocab: { term: 'be under no illusion', category: 'IDIOM', meaningVi: 'không hề ảo tưởng, nhận thức rất rõ rằng', example: 'We are under no illusion about the scale of the challenge.' }
  },
  {
    keyword: 'SHORT',
    promptPrefix: 'Nothing',
    stem: 'Rewrite using "SHORT": Only a comprehensive overhaul of the judicial code will restore public trust.',
    answer: 'Nothing short of a comprehensive overhaul of the judicial code will restore public trust.',
    acceptedAnswers: [
      'Nothing short of a comprehensive overhaul of the judicial code will restore public trust.',
      'Nothing short of a comprehensive overhaul of the judicial code'
    ],
    rule: 'C2 Emphatic Structure: "Nothing short of + Noun Phrase"',
    vi: '"Nothing short of..." = Chỉ có một cuộc cải tổ toàn diện mới... (Không gì ít hơn điều đó có thể đủ).',
    en: '"Nothing short of" emphasizes that only an extreme or thorough measure will suffice.',
    vocab: { term: 'nothing short of', category: 'IDIOM', meaningVi: 'chỉ có... mới đủ / chẳng khác gì', example: 'Nothing short of systemic reform will resolve the crisis.' }
  },
  {
    keyword: 'PAR',
    promptPrefix: 'The apprentice’s craftsmanship was on',
    stem: 'Rewrite using "PAR": The apprentice’s craftsmanship was just as exquisite as that of the master guildsman.',
    answer: 'The apprentice’s craftsmanship was on a par with that of the master guildsman.',
    acceptedAnswers: [
      'The apprentice’s craftsmanship was on a par with that of the master guildsman.',
      'on a par with that of the master guildsman'
    ],
    rule: 'C2 Idiom: "be on a par with"',
    vi: '"Be on a par with somebody/something" = ngang tầm, sánh ngang về chất lượng/đẳng cấp với.',
    en: 'To be on a par with means to be equal in importance or quality to.',
    vocab: { term: 'on a par with', category: 'IDIOM', meaningVi: 'ngang tầm / sánh ngang với', example: 'Local research output is now on a par with international benchmarks.' }
  },
  {
    keyword: ' BRUNT',
    promptPrefix: 'Small coastal communities bore',
    stem: 'Rewrite using "BRUNT": Small coastal communities suffered the worst impact of the supply-chain disruption.',
    answer: 'Small coastal communities bore the brunt of the supply-chain disruption.',
    acceptedAnswers: [
      'Small coastal communities bore the brunt of the supply-chain disruption.',
      'bore the brunt of the supply-chain disruption'
    ],
    rule: 'C2 Collocation: "bear the brunt of"',
    vi: '"Bear the brunt of something" = gánh chịu mũi nhọn / phần thiệt hại nặng nề nhất của một biến cố.',
    en: 'To bear the brunt of something is to suffer the worst part of an unpleasant or problematic situation.',
    vocab: { term: 'bear the brunt of', category: 'IDIOM', meaningVi: 'gánh chịu hậu quả nặng nề nhất của', example: 'Frontline workers bore the brunt of the pandemic.' }
  }
];

// ============================================================================
// 12 CURATED VIETNAMESE OLYMPIAD EXAM PROFILES
// ============================================================================
const CURATED_EXAM_PROFILES = [
  {
    id: 'hsgqg-2025-national-official',
    title: 'Đề Thi Chọn Học Sinh Giỏi Quốc Gia THPT 2025 – Bộ GD&ĐT (Bảng A)',
    tournament: 'HSGQG',
    year: 2025,
    province_school: 'Bộ Giáo dục & Đào tạo (Toàn quốc)',
    grade_level: 'Khối 11–12 • Đội tuyển Quốc gia',
    tags: ['Đảo ngữ C2', 'Word Formation', 'Open Cloze', 'Reading C2']
  },
  {
    id: 'chon-dt-nghe-an-pbc-2025',
    title: 'Đề Chọn Đội Tuyển HSGQG 2025 – THPT Chuyên Phan Bội Châu (Nghệ An)',
    tournament: 'HSGQG',
    year: 2025,
    province_school: 'THPT Chuyên Phan Bội Châu – Nghệ An',
    grade_level: 'Khối 11–12 • Chọn Đội tuyển QG',
    tags: ['Thành ngữ C2', 'Open Cloze', 'Viết lại câu']
  },
  {
    id: 'chon-dt-hanoi-amsterdam-2025',
    title: 'Đề Chọn Đội Tuyển Dự Thi Quốc Gia 2025 – THPT Chuyên Hà Nội – Amsterdam',
    tournament: 'HSGQG',
    year: 2025,
    province_school: 'THPT Chuyên Hà Nội – Amsterdam (Hà Nội)',
    grade_level: 'Khối 11–12 • Đội tuyển Quốc gia',
    tags: ['Collocations C2', 'Guided Cloze', 'Academic Essay']
  },
  {
    id: 'dhbb-hai-phong-tran-phu-2025',
    title: 'Đề Thi HSG Duyên Hải & Đồng Bằng Bắc Bộ 2025 – THPT Chuyên Trần Phú (Hải Phòng)',
    tournament: 'DHBB',
    year: 2025,
    province_school: 'THPT Chuyên Trần Phú – Hải Phòng',
    grade_level: 'Khối 11 • Duyên Hải Bắc Bộ',
    tags: ['Giả định thức', 'Word Formation', 'Sửa lỗi sai']
  },
  {
    id: 'dhbb-nam-dinh-lhp-2025',
    title: 'Đề Thi HSG Duyên Hải & ĐBBB 2025 – THPT Chuyên Lê Hồng Phong (Nam Định)',
    tournament: 'DHBB',
    year: 2025,
    province_school: 'THPT Chuyên Lê Hồng Phong – Nam Định',
    grade_level: 'Khối 10–11 • Duyên Hải Bắc Bộ',
    tags: ['Phrasal Verbs', 'Open Cloze', 'Đọc hiểu C2']
  },
  {
    id: 'hung-vuong-phu-tho-2025',
    title: 'Đề Thi Olympic Trại Hè Hùng Vương Lần Thứ XIX – THPT Chuyên Hùng Vương (Phú Thọ)',
    tournament: 'Trại hè Hùng Vương',
    year: 2025,
    province_school: 'THPT Chuyên Hùng Vương – Phú Thọ',
    grade_level: 'Khối 11 • Trại hè Hùng Vương',
    tags: ['Đảo ngữ', 'Cấu tạo từ', 'Đọc hiểu CPE']
  },
  {
    id: 'olympic-30-4-tphcm-lhp-2025',
    title: 'Đề Thi Olympic Truyền Thống 30/4 Lần Thứ XXIX – THPT Chuyên Lê Hồng Phong (TP.HCM)',
    tournament: 'Olympic 30/4',
    year: 2025,
    province_school: 'THPT Chuyên Lê Hồng Phong – TP. Hồ Chí Minh',
    grade_level: 'Khối 10–11 • Olympic 30/4',
    tags: ['Idioms & Phrasal Verbs', 'Word Formation', 'Sentence Rewrite']
  },
  {
    id: 'olympic-30-4-hue-quoc-hoc-2025',
    title: 'Đề Thi Olympic Truyền Thống 30/4 Năm 2025 – THPT Chuyên Quốc Học (Thừa Thiên Huế)',
    tournament: 'Olympic 30/4',
    year: 2025,
    province_school: 'THPT Chuyên Quốc Học – Thừa Thiên Huế',
    grade_level: 'Khối 11 • Olympic 30/4',
    tags: ['Từ vựng C2', 'Guided Cloze', 'Biến đổi câu']
  },
  {
    id: 'chon-dt-thanh-hoa-lam-son-2025',
    title: 'Đề Chọn Đội Tuyển HSGQG 2025 – THPT Chuyên Lam Sơn (Thanh Hóa)',
    tournament: 'Đề Chọn Đội Tuyển',
    year: 2025,
    province_school: 'THPT Chuyên Lam Sơn – Thanh Hóa',
    grade_level: 'Khối 12 • Chọn Đội tuyển QG',
    tags: ['Cấu trúc C2', 'Open Cloze', 'Summary Writing']
  },
  {
    id: 'chon-dt-tphcm-ptnk-2025',
    title: 'Đề Chọn Đội Tuyển HSGQG 2025 – Phổ Thông Năng Khiếu (ĐHQG TP.HCM)',
    tournament: 'Đề Chọn Đội Tuyển',
    year: 2025,
    province_school: 'Phổ thông Năng khiếu – ĐHQG TP. Hồ Chí Minh',
    grade_level: 'Khối 11–12 • Chọn Đội tuyển QG',
    tags: ['Academic Lexis', 'Reading C2', 'Essay 350w']
  },
  {
    id: 'dhbb-quang-ninh-ha-long-2024',
    title: 'Đề Đề Xuất Duyên Hải & ĐBBB 2024 – THPT Chuyên Hạ Long (Quảng Ninh)',
    tournament: 'DHBB',
    year: 2024,
    province_school: 'THPT Chuyên Hạ Long – Quảng Ninh',
    grade_level: 'Khối 11 • Duyên Hải Bắc Bộ',
    tags: ['Collocations', 'Sửa lỗi sai', 'Cloze Test']
  },
  {
    id: 'chon-dt-da-nang-lqd-2024',
    title: 'Đề Chọn Đội Tuyển HSGQG 2024 – THPT Chuyên Lê Quý Đôn (Đà Nẵng)',
    tournament: 'Đề Chọn Đội Tuyển',
    year: 2024,
    province_school: 'THPT Chuyên Lê Quý Đôn – Đà Nẵng',
    grade_level: 'Khối 12 • Chọn Đội tuyển QG',
    tags: ['Inversion', 'Word Formation', 'Reading CPE']
  }
];

function buildFull60QuestionExam(profile, rotationOffset = 0) {
  let globalMcqCounter = rotationOffset;

  // 1. Part 1: 15 Multiple-Choice Questions (rotated across the 28-item diverse pack & Fisher-Yates shuffled)
  const mcqQuestions = [];
  for (let i = 0; i < 15; i++) {
    const raw = MASTER_MCQ_BANK[(i + rotationOffset * 3) % MASTER_MCQ_BANK.length];
    const shuffled = shuffleQuestionOptionsDeterministically(raw, globalMcqCounter++, rotationOffset);
    const qNum = i + 1;
    mcqQuestions.push({
      id: `${profile.id}-q${qNum}`,
      number: qNum,
      type: 'mcq',
      points: 1,
      stem: `${qNum}. ${shuffled.stem.replace(/^\d+\.\s*/, '')}`,
      options: shuffled.options,
      answer: shuffled.answer,
      explanation: {
        rule: shuffled.rule,
        vi: shuffled.vi,
        en: shuffled.en,
        vocabItem: shuffled.vocab
      }
    });
  }

  // 2. Part 2: 10 Word Formation Questions
  const wfQuestions = [];
  for (let i = 0; i < 10; i++) {
    const wf = MASTER_WORD_FORMATION_BANK[(i + rotationOffset * 2) % MASTER_WORD_FORMATION_BANK.length];
    const qNum = 16 + i;
    wfQuestions.push({
      id: `${profile.id}-q${qNum}`,
      number: qNum,
      type: 'word_formation',
      points: 1,
      rootWord: wf.rootWord,
      givenWord: wf.givenWord,
      stem: `${qNum}. ${wf.stem.replace(/^\d+\.\s*/, '')} (${wf.rootWord})`,
      answer: wf.answer,
      acceptedAnswers: wf.acceptedAnswers,
      explanation: {
        rule: wf.rule,
        vi: wf.vi,
        en: wf.en,
        vocabItem: wf.vocab
      }
    });
  }

  // 3. Part 3: 5 Error Correction Questions (Fisher-Yates shuffled across A/B/C/D)
  const errQuestions = [];
  for (let i = 0; i < 5; i++) {
    const rawErr = MASTER_ERROR_CORRECTION_BANK[(i + rotationOffset) % MASTER_ERROR_CORRECTION_BANK.length];
    const shuffled = shuffleQuestionOptionsDeterministically(rawErr, globalMcqCounter++, rotationOffset);
    const qNum = 26 + i;
    errQuestions.push({
      id: `${profile.id}-q${qNum}`,
      number: qNum,
      type: 'mcq',
      points: 1,
      stem: `${qNum}. ${shuffled.stem.replace(/^\d+\.\s*/, '')}`,
      options: shuffled.options,
      answer: shuffled.answer,
      explanation: {
        rule: shuffled.rule,
        vi: shuffled.vi,
        en: shuffled.en,
        vocabItem: shuffled.vocab
      }
    });
  }

  // 4. Section II Part 1: 10 Open Cloze Questions (31-40)
  const openClozeQuestions = MASTER_OPEN_CLOZE_QUESTIONS.map((oc) => ({
    id: `${profile.id}-q${oc.number}`,
    number: oc.number,
    type: 'open_cloze',
    points: 1,
    stem: oc.stem,
    answer: oc.answer,
    acceptedAnswers: oc.acceptedAnswers,
    explanation: {
      rule: oc.rule,
      vi: oc.vi,
      en: oc.en,
      vocabItem: oc.vocab
    }
  }));

  // 5. Section II Part 2: 10 Guided Cloze Questions (41-50, Fisher-Yates shuffled across A/B/C/D)
  const guidedClozeQuestions = MASTER_GUIDED_CLOZE_QUESTIONS.map((gc) => {
    const shuffled = shuffleQuestionOptionsDeterministically(gc, globalMcqCounter++, rotationOffset);
    return {
      id: `${profile.id}-q${gc.number}`,
      number: gc.number,
      type: 'mcq',
      points: 1,
      stem: shuffled.stem,
      options: shuffled.options,
      answer: shuffled.answer,
      explanation: {
        rule: shuffled.rule,
        vi: shuffled.vi,
        en: shuffled.en,
        vocabItem: shuffled.vocab
      }
    };
  });

  // 6. Section II Part 3: 6 Reading Comprehension Questions (51-56, Fisher-Yates shuffled across A/B/C/D)
  const readingQuestions = MASTER_READING_QUESTIONS.map((rq) => {
    const shuffled = shuffleQuestionOptionsDeterministically(rq, globalMcqCounter++, rotationOffset);
    return {
      id: `${profile.id}-q${rq.number}`,
      number: rq.number,
      type: 'mcq',
      points: 1,
      stem: shuffled.stem,
      options: shuffled.options,
      answer: shuffled.answer,
      explanation: {
        rule: shuffled.rule,
        vi: shuffled.vi,
        en: shuffled.en,
        vocabItem: shuffled.vocab
      }
    };
  });

  // 7. Section III Part 1: 4 Sentence Transformation Questions (57-60)
  const transformQuestions = MASTER_SENTENCE_TRANSFORM_BANK.map((st, idx) => {
    const qNum = 57 + idx;
    return {
      id: `${profile.id}-q${qNum}`,
      number: qNum,
      type: 'sentence_transformation',
      points: 1,
      keyword: st.keyword.trim(),
      promptPrefix: st.promptPrefix,
      stem: `${qNum}. ${st.stem}`,
      answer: st.answer,
      acceptedAnswers: st.acceptedAnswers,
      explanation: {
        rule: st.rule,
        vi: st.vi,
        en: st.en,
        vocabItem: st.vocab
      }
    };
  });

  return {
    id: profile.id,
    title: profile.title,
    tournament: profile.tournament,
    year: profile.year,
    province_school: profile.province_school,
    grade_level: profile.grade_level,
    duration_minutes: 180,
    total_questions: 60,
    difficulty: 'C1–C2 Olympiad',
    tags: profile.tags,
    sections: {
      listening: {
        title: 'Section 0: Academic Listening Comprehension',
        parts: []
      },
      lexicoGrammar: {
        title: 'Section I: Lexico-Grammar (30 câu hỏi)',
        parts: [
          {
            id: `${profile.id}-lg-p1`,
            title: 'Part 1: Multiple Choice — Inversion, Subjunctive, Idioms & Confusable Lexis (Câu 1–15)',
            instructions: 'Choose the best option (A, B, C, or D) to complete each of the following sentences.',
            questions: mcqQuestions
          },
          {
            id: `${profile.id}-lg-p2`,
            title: 'Part 2: Word Formation — Academic Derivatives (Câu 16–25)',
            instructions: 'Use the word given in capitals at the end of each sentence to form a word that fits in the space.',
            questions: wfQuestions
          },
          {
            id: `${profile.id}-lg-p3`,
            title: 'Part 3: Error Identification & Correction (Câu 26–30)',
            instructions: 'Identify the underlined part (A, B, C, or D) that contains a grammatical or lexical error and choose the correct fix.',
            questions: errQuestions
          }
        ]
      },
      reading: {
        title: 'Section II: Reading Comprehension (26 câu hỏi)',
        parts: [
          {
            id: `${profile.id}-rd-p1`,
            title: 'Part 1: Open Cloze — Cognitive Offloading & The "Google Effect" (Câu 31–40)',
            instructions: 'Fill each of the numbered blanks (31–40) in the passage with ONE suitable word.',
            passageTitle: 'The Epistemic Cost of Externalized Memory',
            passage: OPEN_CLOZE_PASSAGE_HTML,
            questions: openClozeQuestions
          },
          {
            id: `${profile.id}-rd-p2`,
            title: 'Part 2: Guided Cloze — The Paradox of Green Gentrification (Câu 41–50)',
            instructions: 'Read the passage below and decide which answer (A, B, C, or D) best fits each gap.',
            passageTitle: 'Ecological Urbanism & Socioeconomic Displacement',
            passage: GUIDED_CLOZE_PASSAGE_HTML,
            questions: guidedClozeQuestions
          },
          {
            id: `${profile.id}-rd-p3`,
            title: 'Part 3: Academic Reading — The Annales School & The Longue Durée (Câu 51–56)',
            instructions: 'Read the following historiographical extract and choose the best answer (A, B, C, or D) for questions 51–56.',
            passageTitle: 'Beyond the "Great Man": Braudel, Microhistory, and Structural Agency',
            passage: READING_PASSAGE_HTML,
            questions: readingQuestions
          }
        ]
      },
      writing: {
        title: 'Section III: Writing & Use of English (4 câu + 2 bài luận)',
        parts: [
          {
            id: `${profile.id}-wr-p1`,
            title: 'Part 1: Key Word Sentence Transformation (Câu 57–60)',
            instructions: 'Complete the second sentence so that it has a similar meaning to the first sentence, using the word given.',
            questions: transformQuestions
          },
          {
            id: `${profile.id}-wr-p2`,
            partType: 'WRITING_ESSAY',
            title: 'Part 2: Academic Essay Writing (350 words)',
            instructions: 'Write an academic essay of about 350 words on the following topic.',
            prompt: 'Some educators contend that standardized high-stakes competitions cultivate intellectual resilience and objective meritocracy, while critics argue they entrench socioeconomic stratification. Discuss both views and give your own opinion.',
            questions: []
          }
        ]
      }
    }
  };
}

function deduplicateAndSeedFullExams() {
  const existingExams = db.getAllExams();
  for (const ex of existingExams) {
    db.deleteExam(ex.id);
  }

  const seeded = [];
  const answerDistribution = { A: 0, B: 0, C: 0, D: 0 };

  CURATED_EXAM_PROFILES.forEach((profile, idx) => {
    const fullExam = buildFull60QuestionExam(profile, idx);
    // Tally MCQ answer distribution
    ['lexicoGrammar', 'reading'].forEach((secKey) => {
      (fullExam.sections[secKey]?.parts || []).forEach((p) => {
        (p.questions || []).forEach((q) => {
          if (q.type === 'mcq' && answerDistribution[q.answer] !== undefined) {
            answerDistribution[q.answer]++;
          }
        });
      });
    });
    const saved = db.upsertExam(fullExam);
    seeded.push(saved);
  });

  // Extract C1/C2 vocabulary items into Vocab Vault
  [...MASTER_MCQ_BANK, ...MASTER_WORD_FORMATION_BANK].forEach((q) => {
    if (q.vocab) {
      db.upsertVocab({
        id: `voc-${q.vocab.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        term: q.vocab.term,
        type: q.vocab.category,
        definition_en: q.en,
        definition_vi: q.vocab.meaningVi,
        example: q.vocab.example,
        source_exam: 'Kho Đề Thi HSGQG & Duyên Hải Bắc Bộ'
      });
    }
  });

  return {
    purgedCount: existingExams.length,
    seededExamsCount: seeded.length,
    questionsPerExam: 60,
    totalQuestionsSeeded: seeded.length * 60,
    answerDistribution
  };
}

if (require.main === module) {
  const res = deduplicateAndSeedFullExams();
  console.log('====================================================================');
  console.log('  DEDUPLICATION, CORPUS EXPANSION & FISHER-YATES ABCD SHUFFLE COMPLETE');
  console.log(`  Seeded Clean Diacritic Exams: ${res.seededExamsCount} (${res.totalQuestionsSeeded} total items)`);
  console.log(`  MCQ Answer Key Distribution: A=${res.answerDistribution.A}, B=${res.answerDistribution.B}, C=${res.answerDistribution.C}, D=${res.answerDistribution.D}`);
  console.log('====================================================================');
}

module.exports = {
  MASTER_MCQ_BANK,
  MASTER_WORD_FORMATION_BANK,
  MASTER_ERROR_CORRECTION_BANK,
  MASTER_OPEN_CLOZE_QUESTIONS,
  MASTER_GUIDED_CLOZE_QUESTIONS,
  MASTER_READING_QUESTIONS,
  MASTER_SENTENCE_TRANSFORM_BANK,
  CURATED_EXAM_PROFILES,
  shuffleQuestionOptionsDeterministically,
  buildFull60QuestionExam,
  deduplicateAndSeedFullExams
};
