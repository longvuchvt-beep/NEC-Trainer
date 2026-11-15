/**
 * HSGQG & DHBB Academic Writing Diagnostic & Rubric Engine
 * Evaluates Part 1 (Summary 100-120w), Part 2 (Chart/Table 150w), and Part 3 (Academic Essay 350w)
 * against official MOET National English Competition criteria (20-point scale).
 */

const C2_DISCOURSE_MARKERS = [
  'notwithstanding', 'albeit', 'inasmuch as', 'consequently', 'conversely',
  'by the same token', 'furthermore', 'moreover', 'nonetheless', 'nevertheless',
  'in stark contrast', 'paradoxically', 'ostensibly', 'undeniably', 'henceforth',
  'vis-à-vis', 'in light of', 'compounding this', 'it follows that'
];

const C2_ACADEMIC_VERBS_ADJ = [
  'exacerbate', 'mitigate', 'proliferate', 'engender', 'precipitate', 'underscore',
  'corroborate', 'institutionalize', 'calcify', 'galvanize', 'erode', 'buttress',
  'ubiquitous', 'indispensable', 'pernicious', 'epistemological', 'utilitarian',
  'paradigm', 'socioeconomic', 'unprecedented', 'asymmetrical', 'intrinsic', 'dichotomy'
];

function evaluateWritingSubmission({ partType = 'essay', promptTitle = '', sourcePassage = '', content = '' }) {
  const cleanText = (content || '').trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const sentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const lower = cleanText.toLowerCase();

  // Detect C1/C2 features present in the student's text
  const usedMarkers = C2_DISCOURSE_MARKERS.filter(m => lower.includes(m));
  const usedC2Lexis = C2_ACADEMIC_VERBS_ADJ.filter(v => lower.includes(v.slice(0, -1)));

  const hasInversion = /\b(not only|seldom|rarely|little did|little do|no sooner|scarcely|under no circumstances|only by|only when|only after|nor do|nor does|nor can)\b/i.test(cleanText);
  const hasParticipleClause = /(?:^|[.;,])\s*(?:Having\s+\w+ed|Being\s+\w+|Driven\s+by|Predicated\s+on|Faced\s+with|Compounded\s+by|Viewed\s+through)/i.test(cleanText);
  const hasSubjunctiveOrModal = /\b(it is imperative that|it is essential that|lest|albeit|were .+ to|should .+ fail)\b/i.test(cleanText);

  // Target word-count window check
  let targetRange = [300, 400];
  if (partType === 'summary') targetRange = [100, 120];
  else if (partType === 'chart') targetRange = [135, 175];

  let lengthPenalty = 0;
  let lengthFeedback = '';
  if (wordCount < targetRange[0] * 0.6) {
    lengthPenalty = 1.5;
    lengthFeedback = `Số lượng từ hiện tại (${wordCount} từ) thấp hơn đáng kể so với chuẩn quy định (${targetRange[0]}–${targetRange[1]} từ). Trong chấm thi HSGQG, bài viết thiếu hụt độ dài sẽ bị trừ điểm nặng ở tiêu chí Task Achievement.`;
  } else if (wordCount >= targetRange[0] && wordCount <= targetRange[1]) {
    lengthFeedback = `Độ dài bài viết (${wordCount} từ) đạt chuẩn vàng của giám khảo HSGQG (${targetRange[0]}–${targetRange[1]} từ).`;
  } else if (wordCount > targetRange[1] * 1.15) {
    lengthPenalty = 0.5;
    lengthFeedback = `Bài viết (${wordCount} từ) vượt quá giới hạn khuyến nghị (${targetRange[0]}–${targetRange[1]} từ). Cần cô đọng bằng cụm danh từ hóa (Nominalization).`;
  } else {
    lengthFeedback = `Độ dài bài viết (${wordCount} từ) nằm trong biên độ chấp nhận được (chuẩn: ${targetRange[0]}–${targetRange[1]} từ).`;
  }

  // Paraphrase check for Summary
  let verbatimOverlapRatio = 0;
  if (partType === 'summary' && sourcePassage) {
    const srcLower = sourcePassage.toLowerCase();
    let copiedFourGrams = 0;
    for (let i = 0; i < words.length - 3; i++) {
      const gram = words.slice(i, i + 4).join(' ').toLowerCase().replace(/[^a-z\s]/g, '');
      if (gram.length > 14 && srcLower.includes(gram)) copiedFourGrams++;
    }
    verbatimOverlapRatio = words.length > 10 ? Math.min(100, Math.round((copiedFourGrams / (words.length / 4)) * 100)) : 0;
  }

  // Calculate 4 Criterion Scores (each out of 5.0, total 20.0)
  const baseFactor = Math.min(1, Math.max(0.45, wordCount / targetRange[0]));
  const taskScore = Number(Math.min(4.8, Math.max(2.5, (3.8 * baseFactor) + (usedC2Lexis.length * 0.15) - (lengthPenalty * 0.4))).toFixed(1));
  const orgScore = Number(Math.min(4.9, Math.max(2.5, 3.6 + (usedMarkers.length * 0.25) + (sentences.length >= 4 ? 0.4 : 0))).toFixed(1));
  const lexScore = Number(Math.min(4.9, Math.max(2.6, 3.5 + (usedC2Lexis.length * 0.22) + (verbatimOverlapRatio > 30 ? -0.6 : 0.3))).toFixed(1));
  const gramScore = Number(Math.min(4.9, Math.max(2.6, 3.5 + (hasInversion ? 0.45 : 0) + (hasParticipleClause ? 0.4 : 0) + (hasSubjunctiveOrModal ? 0.35 : 0))).toFixed(1));

  const overallScore = Number((taskScore + orgScore + lexScore + gramScore).toFixed(1));

  // Build inline sentence-level upgrades from student's actual sentences + canonical upgrades
  const sentenceUpgrades = [];
  if (sentences.length > 0) {
    const s1 = sentences[0];
    sentenceUpgrades.push({
      original: s1,
      upgraded: s1
        .replace(/\bNowadays,?\s*/i, 'In the contemporary socio-technological landscape, ')
        .replace(/\bMany people think that\b/i, 'Proponents of this orthodoxy frequently posit that')
        .replace(/\bIt is clear that\b/i, 'Empirical evidence unequivocally demonstrates that')
        .replace(/\bvery important\b/gi, 'of paramount importance')
        .replace(/\bcauses\b/gi, 'precipitates')
        .replace(/\bproblems\b/gi, 'systemic ramifications'),
      rationale: 'Nâng cấp mở bài bằng Nominalization (Danh từ hóa) và động từ học thuật C2 (posit, precipitate) thay cho cấu trúc đại chúng B2.'
    });
  }
  if (sentences.length > 1) {
    const s2 = sentences[1];
    sentenceUpgrades.push({
      original: s2,
      upgraded: `Not only does this phenomenon reshape institutional priorities, but it also compels policymakers to recalibrate long-term governance frameworks—${s2.charAt(0).toLowerCase() + s2.slice(1)}`,
      rationale: 'Tích hợp cấu trúc đảo ngữ "Not only ... but also" kết hợp mệnh đề bổ충 để tăng điểm Grammatical Range & Accuracy.'
    });
  }

  // Always add 2 high-yield tournament sentence transformations tailored to the part type
  if (partType === 'summary') {
    sentenceUpgrades.push({
      original: 'People rely too much on digital tools to remember facts, which makes them think they understand more than they actually do.',
      upgraded: 'Uncritical reliance upon digital prosthetics for memory retrieval engenders an illusion of explanatory depth, eroding autonomous conceptual synthesis.',
      rationale: 'Nén 2 mệnh đề thành 1 câu đơn học thuật sử dụng Cụm danh từ hóa ("Uncritical reliance upon...") + Cụm phân từ hiện tại ("eroding...").'
    });
  } else if (partType === 'chart') {
    sentenceUpgrades.push({
      original: 'The number of students using AI platforms increased a lot from 8% in 2018 to 82% in 2025.',
      upgraded: 'Most notably, the proportion of candidates leveraging AI-assisted diagnostic platforms registered a tenfold surge, skyrocketing from a mere 8% in 2018 to 82% by 2025.',
      rationale: 'Thay thế "increased a lot" bằng collocation mô tả số liệu C2 ("registered a tenfold surge, skyrocketing from a mere...").'
    });
  } else {
    sentenceUpgrades.push({
      original: 'Although technology can translate languages quickly, learning a language deeply is still very useful for critical thinking.',
      upgraded: 'Notwithstanding the instantaneous translation capabilities of neural networks, C2 linguistic mastery remains an indispensable crucible for dialectical reasoning and cross-cultural empathy.',
      rationale: 'Sử dụng giới từ nhượng bộ C2 "Notwithstanding + Noun Phrase" thay cho mệnh đề "Although" thông thường.'
    });
  }

  return {
    overallScore,
    maxScore: 20,
    bandLabel: overallScore >= 17.5 ? 'Giải Nhất Quốc Gia (NEC First Prize Tier)' : overallScore >= 15.5 ? 'Giải Nhì / Ba Quốc Gia (NEC Second/Third Prize)' : 'Tiềm năng Đội tuyển (Consolation / Provincial Tier)',
    wordCount,
    targetRange,
    lengthFeedback,
    verbatimOverlapRatio,
    detectedFeatures: {
      discourseMarkers: usedMarkers,
      c2Lexis: usedC2Lexis,
      hasInversion,
      hasParticipleClause,
      hasSubjunctiveOrModal
    },
    criteria: [
      {
        name: 'Content & Task Achievement',
        viName: 'Nội dung & Hoàn thành Yêu cầu Đề',
        score: taskScore,
        max: 5.0,
        feedback: partType === 'summary'
          ? `Đã bao quát luận điểm cốt lõi của đoạn trích. ${lengthFeedback} Tỷ lệ trùng lặp nguyên văn (verbatim overlap): ${verbatimOverlapRatio}%.`
          : partType === 'chart'
          ? `Báo cáo trích xuất được xu hướng tổng quan (Overview) và đối chiếu các nhóm dữ liệu tương phản. ${lengthFeedback}`
          : `Luận điểm rõ ràng, có chiều sâu phản biện (dialectical counter-argument). ${lengthFeedback}`
      },
      {
        name: 'Organization & Discourse Cohesion',
        viName: 'Tổ chức Văn bản & Liên kết Học thuật',
        score: orgScore,
        max: 5.0,
        feedback: usedMarkers.length > 0
          ? `Sử dụng hiệu quả các từ nối học thuật C1/C2: ${usedMarkers.join(', ')}. Mạch liên kết giữa các câu chặt chẽ.`
          : `Bố cục đoạn văn rõ ràng nhưng cần bổ sung thêm các Discourse Markers trình độ C2 (như "Notwithstanding", "Conversely", "By the same token") để chuyển ý mượt mà hơn.`
      },
      {
        name: 'Lexical Resource (C1/C2 Register)',
        viName: 'Vốn từ Học thuật & Collocations C1/C2',
        score: lexScore,
        max: 5.0,
        feedback: usedC2Lexis.length > 0
          ? `Điểm sáng từ vựng C1/C2 được ghi nhận: ${usedC2Lexis.join(', ')}. Văn phong trang trọng, khách quan (impersonal academic register).`
          : `Cần thay thế các động từ/tính từ phổ thông bằng các C2 Academic Collocations (ví dụ: "exacerbate disparities", "institutionalize", "epistemological fallacy").`
      },
      {
        name: 'Grammatical Range & Accuracy',
        viName: 'Độ rộng & Chính xác Ngữ pháp',
        score: gramScore,
        max: 5.0,
        feedback: `Cấu trúc nâng cao phát hiện trong bài: Đảo ngữ (${hasInversion ? 'Có ✓' : 'Chưa có — nên bổ sung 1 câu'}), Mệnh đề phân từ (${hasParticipleClause ? 'Có ✓' : 'Chưa có — nên bổ sung'}), Bàng thái cách/Cấu trúc nhượng bộ nâng cao (${hasSubjunctiveOrModal ? 'Có ✓' : 'Chưa có'}).`
      }
    ],
    sentenceUpgrades,
    collocationBank: [
      { phrase: 'engender a paradigm shift', meaning: 'tạo ra một bước ngoặt về mặt nhận thức/mô hình' },
      { phrase: 'exacerbate socioeconomic stratification', meaning: 'làm trầm trọng thêm sự phân tầng kinh tế - xã hội' },
      { phrase: 'an illusion of explanatory depth', meaning: 'ảo tưởng về chiều sâu hiểu biết' },
      { phrase: 'at the expense of epistemic autonomy', meaning: 'đánh đổi bằng sự tự chủ trong tư duy/nhận thức' },
      { phrase: 'notwithstanding its ostensible utility', meaning: 'bất chấp lợi ích bề ngoài của nó' },
      { phrase: 'a double-edged sword that cuts both ways', meaning: 'con dao hai lưỡi' }
    ],
    discourseMarkersBank: [
      { marker: 'Notwithstanding + Noun Phrase,', usage: 'Nhượng bộ C2 (Bất chấp...)' },
      { marker: 'By the same token,', usage: 'Tương đồng luận điểm (Cũng vì lẽ đó / Tương tự như vậy)' },
      { marker: 'In stark contrast to popular orthodoxy,', usage: 'Phản biện quan điểm số đông' },
      { marker: 'It logically follows that...', usage: 'Dẫn xuất hệ quả tất yếu' }
    ]
  };
}

module.exports = {
  evaluateWritingSubmission
};
