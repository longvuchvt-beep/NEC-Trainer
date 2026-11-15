"use client";

export interface ArcadeReflexQuestion {
  id: string;
  stem: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3; // 0 = A, 1 = B, 2 = C, 3 = D
  correctLetter: "A" | "B" | "C" | "D";
  correctText: string;
  category:
    | "Collocation"
    | "Phrasal Verb"
    | "Idiom"
    | "Preposition"
    | "Confusable Words"
    | "Lexico-Grammar"
    | "Word Formation";
  sourceTag: string;
  targetTerm: string;
  shortTip: string;
  explanationVi: string;
}

interface RawSeedItem {
  stem: string;
  correct: string;
  distractors: [string, string, string];
  category: ArcadeReflexQuestion["category"];
  sourceTag: string;
  targetTerm: string;
  shortTip: string;
}

const INDEX_TO_LETTER: ["A", "B", "C", "D"] = ["A", "B", "C", "D"];

/**
 * Deterministic Fisher-Yates shuffler with Latin-square target slot balancing
 * Guarantees exact 25% distribution across 0 (A), 1 (B), 2 (C), 3 (D)
 */
export function buildBalancedReflexQuestion(
  raw: RawSeedItem,
  index: number,
  idPrefix = "arcade-q"
): ArcadeReflexQuestion {
  // Balanced target slot rotation + prime stride so consecutive questions aren't obvious
  // while every 4-item block contains exactly one A(0), one B(1), one C(2), and one D(3).
  const blockPermutation: [0, 1, 2, 3][] = [
    [0, 2, 1, 3],
    [1, 3, 0, 2],
    [2, 0, 3, 1],
    [3, 1, 2, 0],
  ];
  const blockIdx = Math.floor(index / 4) % blockPermutation.length;
  const targetSlot = blockPermutation[blockIdx][index % 4] as 0 | 1 | 2 | 3;

  // Deterministic Fisher-Yates shuffle on the 3 distractors
  const pool = [...raw.distractors];
  let seed = (index + 1) * 1103515245 + 12345;
  for (let i = pool.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  const options: [string, string, string, string] = ["", "", "", ""];
  let dIdx = 0;
  for (let slot = 0; slot < 4; slot++) {
    if (slot === targetSlot) {
      options[slot] = raw.correct;
    } else {
      options[slot] = pool[dIdx++];
    }
  }

  const letter = INDEX_TO_LETTER[targetSlot];
  return {
    id: `${idPrefix}-${index + 1}`,
    stem: raw.stem,
    options,
    correctIndex: targetSlot,
    correctLetter: letter,
    correctText: raw.correct,
    category: raw.category,
    sourceTag: raw.sourceTag,
    targetTerm: raw.targetTerm,
    shortTip: raw.shortTip,
    explanationVi: `[Đáp án chuẩn: ${letter} — "${raw.correct}"] ${raw.shortTip}`,
  };
}

// ============================================================================
// 160 CURATED HIGH-FREQUENCY C1/C2 REFLEX QUESTIONS
// Sources: HSGQG, DHBB, Trại hè Hùng Vương, Olympic 30/4, Destination C1&C2, CPE
// ============================================================================
const RAW_CURATED_BANK: RawSeedItem[] = [
  // --- 1. CONFUSABLE WORDS & LEXICAL PRECISION (1 - 28) ---
  {
    stem: "The Nobel laureate’s lecture was remarkably _______, distilling complex quantum equations into clear analogies.",
    correct: "comprehensible",
    distractors: ["comprehensive", "comprehendible", "apprehensive"],
    category: "Confusable Words",
    sourceTag: "HSGQG • CPE",
    targetTerm: "comprehensible (adj)",
    shortTip: "Comprehensible = dễ hiểu (clear to understand). Comprehensive = toàn diện. 'Comprehendible' là bẫy từ không chuẩn!",
  },
  {
    stem: "To ensure an impartial verdict, the arbitration panel must be chaired by a wholly _______ legal scholar.",
    correct: "disinterested",
    distractors: ["uninterested", "uninteresting", "distempered"],
    category: "Confusable Words",
    sourceTag: "DHBB • CPE",
    targetTerm: "disinterested (adj)",
    shortTip: "Disinterested = vô tư, khách quan, không vụ lợi (impartial). Uninterested = thờ ơ, không quan tâm.",
  },
  {
    stem: "The remote mountain hamlet remained largely _______ to the geopolitical upheaval sweeping the capital.",
    correct: "impervious",
    distractors: ["imperious", "impetuous", "impertinent"],
    category: "Confusable Words",
    sourceTag: "HSGQG • Olympic 30/4",
    targetTerm: "impervious to (adj)",
    shortTip: "Impervious to = không bị ảnh hưởng/thấm qua. Imperious = hống hách; Impetuous = bốc đồng.",
  },
  {
    stem: "Harsh climatic conditions and geographic isolation _______ against the establishment of permanent settlements.",
    correct: "militate",
    distractors: ["mitigate", "castigate", "instigate"],
    category: "Confusable Words",
    sourceTag: "HSGQG • Destination C1&C2",
    targetTerm: "militate against (v)",
    shortTip: "Militate against = gây bất lợi, ngăn cản. Mitigate = làm dịu nhẹ (ngoại động từ, không đi với against).",
  },
  {
    stem: "The CEO’s apology sounded utterly _______, lacking even a shred of genuine remorse for the data breach.",
    correct: "perfunctory",
    distractors: ["precautionary", "peremptory", "predatory"],
    category: "Confusable Words",
    sourceTag: "DHBB • CPE",
    targetTerm: "perfunctory (adj)",
    shortTip: "Perfunctory = làm qua loa, chiếu lệ cho xong chuyện. Peremptory = độc đoán, bề trên.",
  },
  {
    stem: "The sudden collapse of the regional bank served as a _______ reminder of the fragility of leveraged credit.",
    correct: "salutary",
    distractors: ["sanitary", "solitary", "sedentary"],
    category: "Confusable Words",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "salutary reminder (collocation)",
    shortTip: "Salutary = bổ ích, cảnh tỉnh đáng giá (dù ban đầu gây khó chịu). Sanitary = thuộc vệ sinh.",
  },
  {
    stem: "Her _______ wit and incisive commentary made her the most feared debater in the parliamentary chamber.",
    correct: "mordant",
    distractors: ["morbid", "malleable", "mundane"],
    category: "Confusable Words",
    sourceTag: "Olympic 30/4 • CPE",
    targetTerm: "mordant wit (collocation)",
    shortTip: "Mordant wit = sự sắc sảo, châm biếm sâucay. Morbid = bệnh hoạn, u ám.",
  },
  {
    stem: "The archivist discovered a _______ manuscript whose authorship had been disputed for three centuries.",
    correct: "spurious",
    distractors: ["specious", "sporadic", "soporific"],
    category: "Confusable Words",
    sourceTag: "HSGQG",
    targetTerm: "spurious (adj)",
    shortTip: "Spurious = giả mạo, ngụy tạo (not genuine). Specious = nghe có vẻ đúng nhưng thực ra sai.",
  },
  {
    stem: "Although the defense attorney’s argument sounded plausible at first, closer scrutiny revealed it to be wholly _______.",
    correct: "specious",
    distractors: ["spacious", "auspicious", "capricious"],
    category: "Confusable Words",
    sourceTag: "CPE • DHBB",
    targetTerm: "specious argument (collocation)",
    shortTip: "Specious = ngụy biện, bề ngoài hợp lý nhưng thực chất sai lệch.",
  },
  {
    stem: "The minister’s _______ remarks during the press conference alienated even his staunchest coalition allies.",
    correct: "intemperate",
    distractors: ["intemporal", "intermittent", "intractable"],
    category: "Confusable Words",
    sourceTag: "HSGQG",
    targetTerm: "intemperate remarks (collocation)",
    shortTip: "Intemperate = thiếu kiềm chế, quá khích (lời nói/hành vi).",
  },
  {
    stem: "A _______ reading of the treaty might suggest unilateral withdrawal is legal, yet Clause 9 forbids it.",
    correct: "cursory",
    distractors: ["cursive", "cursed", "curtailing"],
    category: "Confusable Words",
    sourceTag: "Destination C1&C2",
    targetTerm: "a cursory glance/reading",
    shortTip: "Cursory = đọc lướt, xem qua loa vội vàng. Cursive = chữ viết tay nối nét.",
  },
  {
    stem: "The young prodigy displayed a _______ grasp of counterpointlong before entering the conservatory.",
    correct: "precocious",
    distractors: ["precarious", "pretentious", "pernicious"],
    category: "Confusable Words",
    sourceTag: "Olympic 30/4",
    targetTerm: "precocious talent (collocation)",
    shortTip: "Precocious = phát triển/thông minh sớm trước tuổi. Precarious = bấp bênh, nguy hiểm.",
  },
  {
    stem: "Decades of unregulated industrial runoff had a _______ effect on the estuarine ecosystem.",
    correct: "deleterious",
    distractors: ["delirious", "deliberate", "delineated"],
    category: "Confusable Words",
    sourceTag: "HSGQG • CPE",
    targetTerm: "deleterious effect (collocation)",
    shortTip: "Deleterious = có hại nghiêm trọng (harmful/damaging). Delirious = mê sảng, cuồng nhiệt.",
  },
  {
    stem: "The tribunal rejected the witness’s testimony as _______ and completely unrelated to the indictment.",
    correct: "immaterial",
    distractors: ["immature", "immeasurable", "immaculate"],
    category: "Confusable Words",
    sourceTag: "DHBB",
    targetTerm: "immaterial to (adj)",
    shortTip: "Immaterial = không quan trọng, không liên quan (irrelevant) trong ngữ cảnh pháp lý.",
  },
  {
    stem: "Only through _______ archival detective work did the biographer uncover the poet’s wartime correspondence.",
    correct: "assiduous",
    distractors: ["insidious", "invidious", "fastidious"],
    category: "Confusable Words",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "assiduous research (collocation)",
    shortTip: "Assiduous = cần mẫn, siêng năng bền bỉ. Insidious = âm ỉ, nguy hiểm ngầm.",
  },
  {
    stem: "High inflation acts as an _______ tax that quietly erodes household purchasing power month after month.",
    correct: "insidious",
    distractors: ["assiduous", "ingenious", "ingenuous"],
    category: "Confusable Words",
    sourceTag: "HSGQG",
    targetTerm: "insidious threat (collocation)",
    shortTip: "Insidious = tiến triển âm thầm nhưng gây hậu quả nặng nề.",
  },
  {
    stem: "It would be _______ to single out one researcher when the breakthrough was achieved by the entire consortium.",
    correct: "invidious",
    distractors: ["infectious", "indigenous", "industrious"],
    category: "Confusable Words",
    sourceTag: "CPE • Destination C1&C2",
    targetTerm: "invidious distinction/comparison",
    shortTip: "Invidious = gây bất công, dễ gây tị nạnh/mất lòng khi so sánh.",
  },
  {
    stem: "With _______ candor, the child asked the emperor why nobody dared question his advisors.",
    correct: "ingenuous",
    distractors: ["ingenious", "indigent", "indigenous"],
    category: "Confusable Words",
    sourceTag: "Olympic 30/4",
    targetTerm: "ingenuous vs ingenious",
    shortTip: "Ingenuous = ngây thơ, chân thật (innocent/candid). Ingenious = tài tình, sáng tạo.",
  },
  {
    stem: "Engineers devised an _______ passive-cooling mechanism that requires zero external electricity.",
    correct: "ingenious",
    distractors: ["ingenuous", "incongruous", "indignant"],
    category: "Confusable Words",
    sourceTag: "DHBB",
    targetTerm: "ingenious solution (collocation)",
    shortTip: "Ingenious = khéo léo, thông minh, giàu tính sáng tạo.",
  },
  {
    stem: "The minimalist glass pyramid initially looked _______ beside the baroque limestone facade of the palace.",
    correct: "incongruous",
    distractors: ["inconspicuous", "incredulous", "incontinent"],
    category: "Confusable Words",
    sourceTag: "HSGQG",
    targetTerm: "incongruous with (adj)",
    shortTip: "Incongruous = lạc lõng, không ăn nhập với khung cảnh xung quanh.",
  },
  {
    stem: "Far from being ostentatious, the billionaire lived in an _______ townhouse on a quiet cobbled lane.",
    correct: "unassuming",
    distractors: ["unassured", "unashamed", "unavoidable"],
    category: "Confusable Words",
    sourceTag: "CPE",
    targetTerm: "unassuming (adj)",
    shortTip: "Unassuming = khiêm tốn, giản dị, không phô trương.",
  },
  {
    stem: "The committee’s proposal was met with _______ hostility by union delegates who felt betrayed.",
    correct: "unmitigated",
    distractors: ["unmotivated", "unmediated", "unmeasured"],
    category: "Confusable Words",
    sourceTag: "Destination C1&C2",
    targetTerm: "unmitigated disaster/hostility",
    shortTip: "Unmitigated = hoàn toàn, tuyệt đối (thường đi với danh từ tiêu cực: unmitigated disaster).",
  },
  {
    stem: "His explanation was so _______ that even seasoned tax auditors struggled to follow the trail of shell companies.",
    correct: "convoluted",
    distractors: ["convulsed", "convergent", "conversant"],
    category: "Confusable Words",
    sourceTag: "HSGQG",
    targetTerm: "convoluted plot/explanation",
    shortTip: "Convoluted = rắc rối, vòng vo, phức tạp quá mức.",
  },
  {
    stem: "All diplomatic attaches posted to Geneva are expected to be fully _______ with international maritime law.",
    correct: "conversant",
    distractors: ["convergent", "conducive", "commensurate"],
    category: "Confusable Words",
    sourceTag: "DHBB • CPE",
    targetTerm: "conversant with (adj)",
    shortTip: "Be conversant with something = thông thạo, am hiểu tường tận về lĩnh vực gì.",
  },
  {
    stem: "Appointees will receive an executive salary _______ with their qualifications and prior leadership record.",
    correct: "commensurate",
    distractors: ["commiserate", "compassionate", "consumptive"],
    category: "Confusable Words",
    sourceTag: "HSGQG • Destination C1&C2",
    targetTerm: "commensurate with (adj)",
    shortTip: "Commensurate with = tương xứng, tỷ lệ thuận với (năng lực/đóng góp).",
  },
  {
    stem: "Quiet library alcoves and natural daylight are highly _______ to sustained academic concentration.",
    correct: "conducive",
    distractors: ["conductive", "conclusive", "deductive"],
    category: "Confusable Words",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "conducive to (adj)",
    shortTip: "Conducive to = tạo điều kiện thuận lợi cho. Conductive = dẫn điện/nhiệt.",
  },
  {
    stem: "The central bank’s intervention provided only a _______ reprieve before currency speculation resumed.",
    correct: "transitory",
    distractors: ["transitive", "transitional", "translucent"],
    category: "Confusable Words",
    sourceTag: "Olympic 30/4",
    targetTerm: "transitory nature/reprieve",
    shortTip: "Transitory = ngắn ngủi, nhất thời (fleeting/ephemeral).",
  },
  {
    stem: "Critics dismissed the summer blockbuster as _______ entertainment devoid of artistic merit.",
    correct: "ephemeral",
    distractors: ["ethereal", "equitable", "esoteric"],
    category: "Confusable Words",
    sourceTag: "CPE",
    targetTerm: "ephemeral fame/entertainment",
    shortTip: "Ephemeral = sớm nở tối tàn, chóng tàn. Ethereal = thanh tao, siêu phàm.",
  },

  // --- 2. C1/C2 COLLOCATIONS (29 - 56) ---
  {
    stem: "The incoming administration pledged to _______ root-and-branch reforms across the judicial system.",
    correct: "instigate",
    distractors: ["fabricate", "insinuate", "culminate"],
    category: "Collocation",
    sourceTag: "HSGQG • CPE",
    targetTerm: "instigate reforms/an inquiry",
    shortTip: "Instigate reforms/an investigation = khởi xướng, tiến hành cải cách/điều tra chính thức.",
  },
  {
    stem: "Mounting sovereign debt threatens to _______ the fragile economic recovery in the eurozone.",
    correct: "derail",
    distractors: ["detain", "defray", "delude"],
    category: "Collocation",
    sourceTag: "DHBB",
    targetTerm: "derail a recovery/peace talks",
    shortTip: "Derail (peace talks / recovery / plans) = làm trật bánh, phá hỏng tiến trình.",
  },
  {
    stem: "A special endowment fund was established to help _______ the costs of fieldwork in Antarctica.",
    correct: "defray",
    distractors: ["defuse", "deflect", "deface"],
    category: "Collocation",
    sourceTag: "CPE • Destination C1&C2",
    targetTerm: "defray the costs/expenses",
    shortTip: "Defray the costs/expenses = trang trải, thanh toán chi phí (collocation C2 kinh điển).",
  },
  {
    stem: "The mediator worked tirelessly through the night to _______ tensions between the rival factions.",
    correct: "defuse",
    distractors: ["diffuse", "deluge", "deplete"],
    category: "Collocation",
    sourceTag: "HSGQG",
    targetTerm: "defuse tension/a crisis",
    shortTip: "Defuse (tháo ngòi nổ) + tension/crisis = xoa dịu căng thẳng. Diffuse = khuếch tán ánh sáng/khí.",
  },
  {
    stem: "Rather than answering the auditor’s question directly, the CFO attempted to _______ criticism onto external contractors.",
    correct: "deflect",
    distractors: ["inflect", "reflect", "genuflect"],
    category: "Collocation",
    sourceTag: "Olympic 30/4",
    targetTerm: "deflect criticism/attention",
    shortTip: "Deflect criticism/blame = đánh lạc hướng, đẩy sự chỉ trích sang chỗ khác.",
  },
  {
    stem: "The senator’s keynote address _______ a chord with young voters frustrated by housing costs.",
    correct: "struck",
    distractors: ["hit", "touched", "played"],
    category: "Collocation",
    sourceTag: "HSGQG • CPE",
    targetTerm: "strike a chord with",
    shortTip: "Strike a chord with somebody = chạm đúng tâm lý, gây sự đồng cảm sâu sắc.",
  },
  {
    stem: "To remain solvent, the airline had to _______ drastic austerity measures and ground older aircraft.",
    correct: "enact",
    distractors: ["enclose", "entail", "endear"],
    category: "Collocation",
    sourceTag: "DHBB",
    targetTerm: "enact measures/legislation",
    shortTip: "Enact measures/laws = ban hành, thực thi các biện pháp/đạo luật.",
  },
  {
    stem: "The board’s refusal to disclose executive bonuses _______ a shadow over the annual shareholders’ meeting.",
    correct: "cast",
    distractors: ["threw", "shed", "flung"],
    category: "Collocation",
    sourceTag: "Destination C1&C2",
    targetTerm: "cast a shadow/doubt over",
    shortTip: "Cast a shadow/doubt over = phủ bóng đen / dấy lên nghi ngờ về điều gì.",
  },
  {
    stem: "New isotopic evidence has _______ fresh light on how Neolithic monument builders transported megaliths.",
    correct: "shed",
    distractors: ["cast", "shone", "flashed"],
    category: "Collocation",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "shed light on",
    shortTip: "Shed/throw light on = làm sáng tỏ một vấn đề khoa học/lịch sử.",
  },
  {
    stem: "The prime minister sought to _______ fears that emergency tariffs would trigger a trade war.",
    correct: "allay",
    distractors: ["allege", "allocate", "allure"],
    category: "Collocation",
    sourceTag: "HSGQG • CPE",
    targetTerm: "allay fears/suspicions",
    shortTip: "Allay fears/concerns/anxiety = xoa dịu, làm tan biến nỗi lo ngại.",
  },
  {
    stem: "Years of hyperinflation have completely _______ public confidence in fiat currency.",
    correct: "eroded",
    distractors: ["corroded", "evaded", "elided"],
    category: "Collocation",
    sourceTag: "DHBB",
    targetTerm: "erode confidence/trust",
    shortTip: "Erode confidence/living standards = làm xói mòn niềm tin (nghĩa bóng). Corrode = ăn mòn kim loại bằng hóa chất.",
  },
  {
    stem: "The defense counsel tried to _______ the credibility of the prosecution’s star witness.",
    correct: "impugn",
    distractors: ["impute", "impinge", "implore"],
    category: "Collocation",
    sourceTag: "CPE",
    targetTerm: "impugn someone's motives/credibility",
    shortTip: "Impugn (motives/integrity/credibility) = công kích, đặt nghi vấn về sự trung thực/uy tín.",
  },
  {
    stem: "Unchecked urban sprawl continues to _______ upon protected wetlands along the coast.",
    correct: "encroach",
    distractors: ["reproach", "broach", "poach"],
    category: "Collocation",
    sourceTag: "HSGQG",
    targetTerm: "encroach on/upon",
    shortTip: "Encroach on/upon = xâm lấn dần dần (đất đai, quyền riêng tư).",
  },
  {
    stem: "Nobody at the dinner table dared to _______ the sensitive subject of the contested inheritance.",
    correct: "broach",
    distractors: ["breach", "encroach", "reproach"],
    category: "Collocation",
    sourceTag: "Olympic 30/4 • CPE",
    targetTerm: "broach a subject/topic",
    shortTip: "Broach a delicate subject = mở lời, khơi mào một chủ đề nhạy cảm. Breach = vi phạm hợp đồng.",
  },
  {
    stem: "The contractor was sued for _______ of contract after abandoning the bridge project mid-construction.",
    correct: "breach",
    distractors: ["broach", "brink", "brunt"],
    category: "Collocation",
    sourceTag: "Destination C1&C2",
    targetTerm: "breach of contract/trust",
    shortTip: "Breach of contract/confidence = sự vi phạm hợp đồng/tín nhiệm.",
  },
  {
    stem: "Coastal fishing communities bore the _______ of the category-five typhoon.",
    correct: "brunt",
    distractors: ["brink", "breach", "brawn"],
    category: "Collocation",
    sourceTag: "HSGQG",
    targetTerm: "bear the brunt of",
    shortTip: "Bear the brunt of = hứng chịu phần nặng nề nhất của cuộc khủng hoảng/thiên tai.",
  },
  {
    stem: "Despite fierce opposition, the chancellor remained _______ in her commitment to fiscal discipline.",
    correct: "steadfast",
    distractors: ["stagnant", "strident", "stifling"],
    category: "Collocation",
    sourceTag: "DHBB",
    targetTerm: "steadfast commitment/loyalty",
    shortTip: "Steadfast = kiên định, trước sau như một.",
  },
  {
    stem: "The inquiry exposed _______ corruption within the municipal procurement department.",
    correct: "endemic",
    distractors: ["epidemic", "eclectic", "esoteric"],
    category: "Collocation",
    sourceTag: "HSGQG • CPE",
    targetTerm: "endemic corruption/poverty",
    shortTip: "Endemic (poverty/corruption) = ăn sâu bám rễ, tồn tại dai dẳng trong một hệ thống/khu vực.",
  },
  {
    stem: "After three hours of cross-examination, the suspect’s alibi began to _______ at the seams.",
    correct: "unravel",
    distractors: ["unearth", "unleash", "unveil"],
    category: "Collocation",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "unravel (an alibi/mystery)",
    shortTip: "Unravel = bung ra, sụp đổ (kế hoạch/chứng cứ ngoại phạm) hoặc được làm sáng tỏ.",
  },
  {
    stem: "The regime imposed draconian censorship in a futile attempt to _______ political dissent.",
    correct: "stifle",
    distractors: ["stagger", "stipulate", "squander"],
    category: "Collocation",
    sourceTag: "Olympic 30/4",
    targetTerm: "stifle dissent/creativity",
    shortTip: "Stifle (dissent/debate/innovation) = bóp nghẹt, kìm hãm.",
  },
  {
    stem: "Having inherited a vast industrial fortune, the heir proceeded to _______ it on speculative ventures.",
    correct: "squander",
    distractors: ["slander", "meander", "pander"],
    category: "Collocation",
    sourceTag: "Destination C1&C2",
    targetTerm: "squander a fortune/opportunity",
    shortTip: "Squander (money/time/an opportunity) = phung phí, tiêu tán một cách đáng tiếc.",
  },
  {
    stem: "The newspaper refused to _______ to the lowest common denominator with sensationalist gossip.",
    correct: "pander",
    distractors: ["squander", "ponder", "plunder"],
    category: "Collocation",
    sourceTag: "CPE",
    targetTerm: "pander to",
    shortTip: "Pander to = chiều theo thị hiếu thấp kém để lấy lòng.",
  },
  {
    stem: "The treaty explicitly _______ that both signatories must submit to biannual nuclear inspections.",
    correct: "stipulates",
    distractors: ["stimulates", "simulates", "speculates"],
    category: "Collocation",
    sourceTag: "HSGQG",
    targetTerm: "stipulate a condition",
    shortTip: "Stipulate = quy định rõ ràng như một điều kiện bắt buộc trong hợp đồng/hiệp ước.",
  },
  {
    stem: "To break the parliamentary deadlock, both parties agreed to make reciprocal _______.",
    correct: "concessions",
    distractors: ["confessions", "concussions", "conceptions"],
    category: "Collocation",
    sourceTag: "DHBB",
    targetTerm: "make concessions",
    shortTip: "Make concessions = nhượng bộ trong đàm phán.",
  },
  {
    stem: "The central bank governor delivered a _______ assessment of the country’s demographic decline.",
    correct: "sobering",
    distractors: ["sobbing", "soothing", "soaring"],
    category: "Collocation",
    sourceTag: "HSGQG • CPE",
    targetTerm: "sobering thought/assessment",
    shortTip: "Sobering = làm tỉnh ngộ, buộc người ta phải suy nghĩ nghiêm túc.",
  },
  {
    stem: "The playwright’s latest tragedy has garnered _______ acclaim from critics on both sides of the Atlantic.",
    correct: "unanimous",
    distractors: ["anonymous", "magnanimous", "pusillanimous"],
    category: "Collocation",
    sourceTag: "Olympic 30/4",
    targetTerm: "unanimous acclaim/verdict",
    shortTip: "Unanimous = đồng thuận tuyệt đối, nhất trí 100%.",
  },
  {
    stem: "In victory, the champion was remarkably _______, praising her opponent’s tactical brilliance.",
    correct: "magnanimous",
    distractors: ["pusillanimous", "unanimous", "monotonous"],
    category: "Collocation",
    sourceTag: "CPE",
    targetTerm: "magnanimous in victory",
    shortTip: "Magnanimous = hào hiệp, cao thượng (đặc biệt khi chiến thắng). Pusillanimous = nhu nhược, hèn nhát.",
  },
  {
    stem: "The investigation unearthed a _______ of regulatory violations at the chemical plant.",
    correct: "litany",
    distractors: ["liturgy", "lethargy", "lineage"],
    category: "Collocation",
    sourceTag: "HSGQG",
    targetTerm: "a litany of complaints/violations",
    shortTip: "A litany of (complaints/abuses/errors) = một chuỗi dài dằng dặc những sai phạm/than phiền.",
  },

  // --- 3. PHRASAL VERBS C1/C2 (57 - 84) ---
  {
    stem: "When the star soprano developed laryngitis, her understudy had to _______ at two hours’ notice.",
    correct: "step in",
    distractors: ["step down", "step out", "step up"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG • Destination C1&C2",
    targetTerm: "step in (phrasal verb)",
    shortTip: "Step in = đứng ra thay thế hoặc can thiệp giúp đỡ khẩn cấp. Step down = từ chức.",
  },
  {
    stem: "Following the accounting scandal, the chairman was forced to _______ from the board of directors.",
    correct: "step down",
    distractors: ["step in", "step aside", "step back"],
    category: "Phrasal Verb",
    sourceTag: "DHBB",
    targetTerm: "step down (phrasal verb)",
    shortTip: "Step down = từ chức, rời bỏ vị trí quyền lực.",
  },
  {
    stem: "The defense minister refused to _______ on his controversial procurement plan despite public protests.",
    correct: "back down",
    distractors: ["back out", "back up", "back away"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG",
    targetTerm: "back down (phrasal verb)",
    shortTip: "Back down = nhượng bộ, chịu thua trong tranh luận. Back out (of a deal) = rút lui khỏi thỏa thuận.",
  },
  {
    stem: "At the eleventh hour, the private equity consortium decided to _______ of the takeover bid.",
    correct: "pull out",
    distractors: ["pull off", "pull through", "pull over"],
    category: "Phrasal Verb",
    sourceTag: "Olympic 30/4",
    targetTerm: "pull out of (phrasal verb)",
    shortTip: "Pull out (of a deal/agreement) = rút lui khỏi thương vụ.",
  },
  {
    stem: "Against all odds, the underdog quartet managed to _______ a historic victory in the relay final.",
    correct: "pull off",
    distractors: ["pull out", "pull up", "pull down"],
    category: "Phrasal Verb",
    sourceTag: "CPE • Destination C1&C2",
    targetTerm: "pull off (phrasal verb)",
    shortTip: "Pull off = thực hiện thành công một việc cực kỳ khó khăn.",
  },
  {
    stem: "Surgeons remained guardedly optimistic that the mountaineer would _______ after the complex operation.",
    correct: "pull through",
    distractors: ["pull off", "pull round", "pull together"],
    category: "Phrasal Verb",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "pull through (phrasal verb)",
    shortTip: "Pull through = vượt qua cơn nguy kịch, bình phục sau chấn thương/bệnh nặng.",
  },
  {
    stem: "The coalition government is merely trying to _______ the cracks rather than address structural deficits.",
    correct: "paper over",
    distractors: ["smooth out", "cover in", "brush up"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG • CPE",
    targetTerm: "paper over the cracks",
    shortTip: "Paper over the cracks = che đậy tạm bợ những bất đồng/khuyết điểm lớn.",
  },
  {
    stem: "Corporate lobbyists sought to _______ the environmental clauses of the bill before the final vote.",
    correct: "water down",
    distractors: ["boil down", "narrow down", "clamp down"],
    category: "Phrasal Verb",
    sourceTag: "DHBB",
    targetTerm: "water down (phrasal verb)",
    shortTip: "Water down = làm giảm nhẹ, làm mất đi tính sắc bén/hiệu lực của dự luật hoặc bài diễn văn.",
  },
  {
    stem: "Ultimately, the dispute between the two chambers _______ to who controls discretionary budget allocations.",
    correct: "boils down",
    distractors: ["waters down", "simmers down", "breaks down"],
    category: "Phrasal Verb",
    sourceTag: "Destination C1&C2",
    targetTerm: "boil down to (phrasal verb)",
    shortTip: "Boil down to = tựu trung lại là, cốt lõi nằm ở vấn đề gì.",
  },
  {
    stem: "Customs authorities have vowed to _______ on the illicit trafficking of antiquities.",
    correct: "clamp down",
    distractors: ["scale down", "wind down", "jot down"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG",
    targetTerm: "clamp down on (phrasal verb)",
    shortTip: "Clamp down on = trấn áp mạnh tay, siết chặt kiểm soát.",
  },
  {
    stem: "The central bank injected billions in liquidity to _______ the tottering mortgage market.",
    correct: "shore up",
    distractors: ["pile up", "conjure up", "stir up"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG • CPE",
    targetTerm: "shore up (phrasal verb)",
    shortTip: "Shore up = chống đỡ, củng cố một hệ thống/niềm tin đang suy yếu.",
  },
  {
    stem: "The fragrance of pine needles and woodsmoke immediately _______ memories of childhood winters.",
    correct: "conjured up",
    distractors: ["shored up", "bottled up", "brushed up"],
    category: "Phrasal Verb",
    sourceTag: "Olympic 30/4",
    targetTerm: "conjure up (phrasal verb)",
    shortTip: "Conjure up = gợi lên trong tâm trí (hình ảnh, ký ức).",
  },
  {
    stem: "Before relocating to Zurich, the diplomat spent three months _______ on her German.",
    correct: "brushing up",
    distractors: ["polishing off", "touching down", "scraping through"],
    category: "Phrasal Verb",
    sourceTag: "Destination C1&C2",
    targetTerm: "brush up on (phrasal verb)",
    shortTip: "Brush up on = ôn luyện lại kỹ năng/ngoại ngữ đã lâu không dùng.",
  },
  {
    stem: "Having neglected his coursework all semester, he barely managed to _______ the qualifying exam.",
    correct: "scrape through",
    distractors: ["breeze through", "fall through", "see through"],
    category: "Phrasal Verb",
    sourceTag: "DHBB",
    targetTerm: "scrape through (phrasal verb)",
    shortTip: "Scrape through = đậu vớt, vượt qua sát nút đầy chật vật. Breeze through = vượt qua dễ dàng.",
  },
  {
    stem: "The proposed merger _______ when antitrust regulators demanded the divestiture of three subsidiaries.",
    correct: "fell through",
    distractors: ["fell behind", "fell back", "fell out"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG",
    targetTerm: "fall through (phrasal verb)",
    shortTip: "Fall through = thất bại, đổ bể (kế hoạch, thương vụ, hiệp định).",
  },
  {
    stem: "Without an emergency credit line, the family had to _______ their meager life savings.",
    correct: "fall back on",
    distractors: ["fall in with", "fall out with", "fall behind with"],
    category: "Phrasal Verb",
    sourceTag: "CPE",
    targetTerm: "fall back on (phrasal verb)",
    shortTip: "Fall back on = cậy nhờ vào, dùng đến nguồn dự trữ khi gặp khó khăn.",
  },
  {
    stem: "Seasoned investigators were not fooled for a second and immediately _______ the con artist’s ruse.",
    correct: "saw through",
    distractors: ["saw off", "saw out", "saw about"],
    category: "Phrasal Verb",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "see through (phrasal verb)",
    shortTip: "See through (someone/a trick) = nhìn thấu tim đen, nhận ra mánh khóe lừa đảo.",
  },
  {
    stem: "It took the fire brigade six hours to _______ the blaze at the petrochemical depot.",
    correct: "put out",
    distractors: ["put off", "put down", "put across"],
    category: "Phrasal Verb",
    sourceTag: "Olympic 30/4",
    targetTerm: "put out / put across",
    shortTip: "Put out = dập lửa. Put across = truyền đạt ý tưởng mạch lạc.",
  },
  {
    stem: "Despite his brilliant mathematical insights, the professor struggled to _______ his ideas to lay audiences.",
    correct: "put across",
    distractors: ["put aside", "put forward", "put through"],
    category: "Phrasal Verb",
    sourceTag: "Destination C1&C2",
    targetTerm: "put across (phrasal verb)",
    shortTip: "Put across = diễn đạt, truyền tải thông điệp cho người khác hiểu.",
  },
  {
    stem: "The independent commission was _______ to investigate allegations of electoral malpractice.",
    correct: "set up",
    distractors: ["set off", "set back", "set out"],
    category: "Phrasal Verb",
    sourceTag: "DHBB",
    targetTerm: "set up / set back",
    shortTip: "Set up = thành lập. Set back = làm trì hoãn hoặc tiêu tốn (tiền bạc).",
  },
  {
    stem: "Supply-chain bottlenecks have _______ the construction of the high-speed rail link by at least two years.",
    correct: "set back",
    distractors: ["set in", "set aside", "set about"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG",
    targetTerm: "set back (phrasal verb)",
    shortTip: "Set back = làm chậm tiến độ, cản trở.",
  },
  {
    stem: "Travelers must reach the mountain refuge before dusk, as sub-zero blizzards quickly _______.",
    correct: "set in",
    distractors: ["set off", "set out", "set up"],
    category: "Phrasal Verb",
    sourceTag: "CPE",
    targetTerm: "set in (phrasal verb)",
    shortTip: "Set in = bắt đầu kéo đến và kéo dài (mùa mưa, bão tuyết, suy thoái, nhiễm trùng).",
  },
  {
    stem: "The Supreme Court voted to _______ the lower tribunal’s conviction on constitutional grounds.",
    correct: "set aside",
    distractors: ["set in", "set off", "set down"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG • CPE",
    targetTerm: "set aside a verdict",
    shortTip: "Set aside (a ruling/verdict) = hủy bỏ, bác bỏ phán quyết của tòa cấp dưới.",
  },
  {
    stem: "How could a reputable auditing firm simply _______ such glaring discrepancies in the balance sheet?",
    correct: "gloss over",
    distractors: ["mull over", "hand over", "take over"],
    category: "Phrasal Verb",
    sourceTag: "DHBB",
    targetTerm: "gloss over (phrasal verb)",
    shortTip: "Gloss over = lấp liếm, lướt qua nhanh để che giấu sai sót.",
  },
  {
    stem: "The candidate asked for forty-eight hours to _______ the job offer before signing the contract.",
    correct: "mull over",
    distractors: ["gloss over", "tide over", "win over"],
    category: "Phrasal Verb",
    sourceTag: "Destination C1&C2",
    targetTerm: "mull over (phrasal verb)",
    shortTip: "Mull over = suy ngẫm, cân nhắc kỹ lưỡng.",
  },
  {
    stem: "The credit union approved an emergency bridge loan to _______ the cooperative until harvest season.",
    correct: "tide over",
    distractors: ["mull over", "smooth over", "carry over"],
    category: "Phrasal Verb",
    sourceTag: "HSGQG",
    targetTerm: "tide someone over",
    shortTip: "Tide someone over = giúp ai cầm cự qua giai đoạn túng thiếu tạm thời.",
  },
  {
    stem: "The charismatic challenger gradually managed to _______ skeptical voters in the industrial heartland.",
    correct: "win over",
    distractors: ["take over", "blow over", "boil over"],
    category: "Phrasal Verb",
    sourceTag: "Olympic 30/4",
    targetTerm: "win over (phrasal verb)",
    shortTip: "Win over = thuyết phục, chinh phục sự ủng hộ của những người ban đầu phản đối.",
  },
  {
    stem: "Cabinet ministers hoped the diplomatic row would soon _______ without triggering trade sanctions.",
    correct: "blow over",
    distractors: ["boil over", "spill over", "cloud over"],
    category: "Phrasal Verb",
    sourceTag: "CPE",
    targetTerm: "blow over (phrasal verb)",
    shortTip: "Blow over = lắng dịu, qua đi mà không để lại hậu quả nghiêm trọng.",
  },

  // --- 4. C1/C2 IDIOMS (85 - 112) ---
  {
    stem: "The whistleblower’s leaked memos _______ to the ministry’s claim that safety protocols were followed.",
    correct: "gave the lie",
    distractors: ["paid lip service", "turned a blind eye", "made light"],
    category: "Idiom",
    sourceTag: "HSGQG • CPE",
    targetTerm: "give the lie to",
    shortTip: "Give the lie to something = vạch trần sự dối trá, chứng minh điều gì là hoàn toàn sai sự thật.",
  },
  {
    stem: "Many corporations merely _______ to sustainability while continuing to expand fossil-fuel extraction.",
    correct: "pay lip service",
    distractors: ["give the slip", "foot the bill", "call the shots"],
    category: "Idiom",
    sourceTag: "DHBB • Destination C1&C2",
    targetTerm: "pay lip service to",
    shortTip: "Pay lip service to = ủng hộ đầu môi chót lưỡi nhưng không hành động thực chất.",
  },
  {
    stem: "The startup’s flashy quarterly presentation was dismissed by analysts as nothing more than _______.",
    correct: "smoke and mirrors",
    distractors: ["tooth and nail", "flesh and blood", "pins and needles"],
    category: "Idiom",
    sourceTag: "HSGQG",
    targetTerm: "smoke and mirrors",
    shortTip: "Smoke and mirrors = trò ảo thuật che mắt, sự đánh bóng số liệu để che giấu thực tế.",
  },
  {
    stem: "Local residents fought _______ to prevent the ancient woodland from being rezoned for warehouses.",
    correct: "tooth and nail",
    distractors: ["heart and soul", "neck and neck", "high and low"],
    category: "Idiom",
    sourceTag: "Olympic 30/4",
    targetTerm: "fight tooth and nail",
    shortTip: "Fight tooth and nail = chiến đấu quyết liệt bằng mọi giá.",
  },
  {
    stem: "With two laps remaining, the Kenyan and Ethiopian marathoners were running _______.",
    correct: "neck and neck",
    distractors: ["hand in glove", "eye to eye", "head over heels"],
    category: "Idiom",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "neck and neck",
    shortTip: "Neck and neck = bám đuổi sát nút, ngang tài ngang sức trong cuộc đua.",
  },
  {
    stem: "Forensic accountants discovered that the customs officials had been working _______ with the smugglers.",
    correct: "hand in glove",
    distractors: ["arm in arm", "tongue in cheek", "cap in hand"],
    category: "Idiom",
    sourceTag: "HSGQG • CPE",
    targetTerm: "work hand in glove with",
    shortTip: "Hand in glove with = cấu kết chặt chẽ với nhau (thường dùng cho âm mưu/phi pháp).",
  },
  {
    stem: "After burning through its venture capital, the firm had to go _______ to the state bailout fund.",
    correct: "cap in hand",
    distractors: ["hand in glove", "hat in ring", "foot in mouth"],
    category: "Idiom",
    sourceTag: "CPE",
    targetTerm: "go cap in hand",
    shortTip: "Go cap in hand (to somebody) = hạ mình đến xin tiền hoặc cầu cạnh sự giúp đỡ.",
  },
  {
    stem: "The columnist’s essay was written strictly _______, yet several readers took the satire literally.",
    correct: "tongue in cheek",
    distractors: ["hand in glove", "tooth and nail", "word for word"],
    category: "Idiom",
    sourceTag: "Destination C1&C2",
    targetTerm: "tongue in cheek",
    shortTip: "Tongue in cheek = nói/viết với giọng điệu mỉa mai, đùa cợt châm biếm.",
  },
  {
    stem: "By criticizing the host nation’s cuisine at the banquet, the envoy really put his _______ in it.",
    correct: "foot",
    distractors: ["hand", "thumb", "finger"],
    category: "Idiom",
    sourceTag: "DHBB",
    targetTerm: "put one's foot in it",
    shortTip: "Put one's foot in it = lỡ lời, nói điều vô duyên gây ngượng ngùng.",
  },
  {
    stem: "When the keynote speaker canceled ten minutes before the gala, the organizer had to play it _______.",
    correct: "by ear",
    distractors: ["by heart", "by sight", "by hand"],
    category: "Idiom",
    sourceTag: "Olympic 30/4",
    targetTerm: "play it by ear",
    shortTip: "Play it by ear = ứng biến linh hoạt tùy theo tình hình thực tế.",
  },
  {
    stem: "The veteran detective smelled a _______ the moment the suspect produced three identical receipts.",
    correct: "rat",
    distractors: ["fox", "snake", "mole"],
    category: "Idiom",
    sourceTag: "HSGQG",
    targetTerm: "smell a rat",
    shortTip: "Smell a rat = đánh hơi thấy có điều mờ ám, gian dối.",
  },
  {
    stem: "Publishing those unverified wiretaps would open a _______ that the legal department cannot contain.",
    correct: "can of worms",
    distractors: ["nest of vipers", "pack of lies", "kettle of fish"],
    category: "Idiom",
    sourceTag: "CPE",
    targetTerm: "open a can of worms",
    shortTip: "Open a can of worms = khơi ra một mớ rắc rối dây chuyền phức tạp.",
  },
  {
    stem: "Managing a domestic retail branch is one thing; leading a cross-border merger is a whole different _______.",
    correct: "kettle of fish",
    distractors: ["can of worms", "drop in the ocean", "storm in a teacup"],
    category: "Idiom",
    sourceTag: "Destination C1&C2",
    targetTerm: "a different kettle of fish",
    shortTip: "A different kettle of fish = một chuyện/vấn đề hoàn toàn khác biệt.",
  },
  {
    stem: "The five-million-dollar grant is merely a _______ compared with the billions needed for grid modernization.",
    correct: "drop in the ocean",
    distractors: ["flash in the pan", "bolt from the blue", "blessing in disguise"],
    category: "Idiom",
    sourceTag: "DHBB",
    targetTerm: "a drop in the ocean",
    shortTip: "A drop in the ocean = muối bỏ bể, quá nhỏ bé so với nhu cầu thực tế.",
  },
  {
    stem: "Critics predicted the band’s debut hit would be a _______, yet they topped the charts for a decade.",
    correct: "flash in the pan",
    distractors: ["bolt from the blue", "thorn in the flesh", "shot in the dark"],
    category: "Idiom",
    sourceTag: "HSGQG",
    targetTerm: "a flash in the pan",
    shortTip: "A flash in the pan = thành công nhất thời, chỉ lóe lên một lần rồi tắt.",
  },
  {
    stem: "The rector’s sudden resignation arrived like a _______ on the first morning of the autumn term.",
    correct: "bolt from the blue",
    distractors: ["flash in the pan", "storm in a teacup", "pie in the sky"],
    category: "Idiom",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "a bolt from the blue",
    shortTip: "A bolt from the blue = tiếng sét giữa trời quang, tin tức hoàn toàn bất ngờ.",
  },
  {
    stem: "Without concrete funding mechanisms, the manifesto’s promise of free transit remains _______.",
    correct: "pie in the sky",
    distractors: ["salt of the earth", "icing on the cake", "food for thought"],
    category: "Idiom",
    sourceTag: "CPE • Olympic 30/4",
    targetTerm: "pie in the sky",
    shortTip: "Pie in the sky = bánh vẽ, viển vông, không thể thực hiện được.",
  },
  {
    stem: "Being passed over for the provincial post proved a _______, as it freed her to accept the Oxford fellowship.",
    correct: "blessing in disguise",
    distractors: ["bone of contention", "feather in her cap", "chip on her shoulder"],
    category: "Idiom",
    sourceTag: "Destination C1&C2",
    targetTerm: "a blessing in disguise",
    shortTip: "A blessing in disguise = trong cái rủi có cái may.",
  },
  {
    stem: "Water-sharing rights along the river basin have remained a bitter _______ between the two states.",
    correct: "bone of contention",
    distractors: ["stroke of luck", "grain of salt", "sigh of relief"],
    category: "Idiom",
    sourceTag: "HSGQG",
    targetTerm: "a bone of contention",
    shortTip: "A bone of contention = tâm điểm của sự tranh chấp kéo dài.",
  },
  {
    stem: "Winning the Palme d’Or at twenty-nine was an extraordinary _______ for the independent director.",
    correct: "feather in her cap",
    distractors: ["chip on her shoulder", "thorn in her side", "bee in her bonnet"],
    category: "Idiom",
    sourceTag: "DHBB",
    targetTerm: "a feather in one's cap",
    shortTip: "A feather in one's cap = một thành tựu đáng tự hào.",
  },
  {
    stem: "One should take uncorroborated memoirs from retired intelligence officers with a _______.",
    correct: "pinch of salt",
    distractors: ["drop of water", "slice of cake", "piece of mind"],
    category: "Idiom",
    sourceTag: "CPE",
    targetTerm: "take something with a pinch/grain of salt",
    shortTip: "Take with a pinch/grain of salt = nghe/đọc với thái độ bán tín bán nghi, có chọn lọc.",
  },
  {
    stem: "Instead of addressing the liquidity crisis, the board spent an hour _______ over office stationery.",
    correct: "splitting hairs",
    distractors: ["pulling strings", "cutting corners", "burning bridges"],
    category: "Idiom",
    sourceTag: "HSGQG • Destination C1&C2",
    targetTerm: "split hairs",
    shortTip: "Split hairs = chẻ sợi tóc làm tư, tranh cãi vụn vặt những chi tiết tiểu tiết.",
  },
  {
    stem: "The inquiry revealed that the developer had _______ on fire-safety insulation to save money.",
    correct: "cut corners",
    distractors: ["split hairs", "crossed swords", "minced words"],
    category: "Idiom",
    sourceTag: "Olympic 30/4",
    targetTerm: "cut corners",
    shortTip: "Cut corners = làm ẩu, cắt xén quy trình để tiết kiệm chi phí/thời gian.",
  },
  {
    stem: "Never one to _______, the auditor told the trustees flatly that the foundation was insolvent.",
    correct: "mince words",
    distractors: ["split hairs", "spill beans", "bite bullets"],
    category: "Idiom",
    sourceTag: "HSGQG",
    targetTerm: "not mince (one's) words",
    shortTip: "Not mince words = nói thẳng thắn, không vòng vo né tránh.",
  },
  {
    stem: "With inflation spiralling, the treasury had no alternative but to _______ and raise interest rates.",
    correct: "bite the bullet",
    distractors: ["jump the gun", "miss the boat", "spill the beans"],
    category: "Idiom",
    sourceTag: "DHBB",
    targetTerm: "bite the bullet",
    shortTip: "Bite the bullet = cắn răng chấp nhận đối mặt và giải quyết việc khó khăn.",
  },
  {
    stem: "By announcing the winner before the ballots were certified, the broadcaster clearly _______.",
    correct: "jumped the gun",
    distractors: ["bit the bullet", "missed the boat", "buried the hatchet"],
    category: "Idiom",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "jump the gun",
    shortTip: "Jump the gun = cầm đèn chạy trước ô tô, hành động quá sớm khi chưa đến lúc.",
  },
  {
    stem: "After decades of bitter rivalry, the two literary lions finally agreed to _______ at the symposium.",
    correct: "bury the hatchet",
    distractors: ["burn the midnight oil", "turn the tables", "kick the bucket"],
    category: "Idiom",
    sourceTag: "Destination C1&C2",
    targetTerm: "bury the hatchet",
    shortTip: "Bury the hatchet = giảng hòa, xóa bỏ thù hận cũ.",
  },
  {
    stem: "A brilliant counter-attack in the final quarter allowed the visiting team to _______ on the defending champions.",
    correct: "turn the tables",
    distractors: ["turn a blind eye", "turn over a new leaf", "turn the other cheek"],
    category: "Idiom",
    sourceTag: "CPE",
    targetTerm: "turn the tables on",
    shortTip: "Turn the tables on somebody = lật ngược thế cờ, chuyển bại thành thắng.",
  },

  // --- 5. DEPENDENT PREPOSITIONS C1/C2 (113 - 132) ---
  {
    stem: "The diplomat’s memoirs are thoroughly imbued _______ a sense of nostalgic melancholy.",
    correct: "with",
    distractors: ["by", "in", "from"],
    category: "Preposition",
    sourceTag: "HSGQG • CPE",
    targetTerm: "imbued with",
    shortTip: "Be imbued with (a feeling/quality) = thấm đẫm, tràn ngập một cảm xúc/tinh thần.",
  },
  {
    stem: "Under the constitution, no citizen may be deprived _______ liberty without due process of law.",
    correct: "of",
    distractors: ["from", "out", "by"],
    category: "Preposition",
    sourceTag: "DHBB",
    targetTerm: "deprive somebody of something",
    shortTip: "Deprive somebody OF something = tước đoạt của ai cái gì.",
  },
  {
    stem: "Any behavior that detracts _______ the solemnity of the memorial service will not be tolerated.",
    correct: "from",
    distractors: ["of", "against", "toward"],
    category: "Preposition",
    sourceTag: "HSGQG",
    targetTerm: "detract from",
    shortTip: "Detract FROM = làm giảm giá trị, làm lu mờ vẻ đẹp/sự trang nghiêm.",
  },
  {
    stem: "Senior civil servants must refrain _______ making partisan endorsements during an election campaign.",
    correct: "from",
    distractors: ["against", "of", "to"],
    category: "Preposition",
    sourceTag: "Olympic 30/4",
    targetTerm: "refrain from",
    shortTip: "Refrain FROM doing something = kiềm chế không làm việc gì.",
  },
  {
    stem: "The board’s hasty restructuring is fraught _______ legal and operational risks.",
    correct: "with",
    distractors: ["by", "of", "in"],
    category: "Preposition",
    sourceTag: "CPE • Destination C1&C2",
    targetTerm: "fraught with danger/risk",
    shortTip: "Fraught WITH (danger/difficulty/risk) = đầy rẫy những rủi ro/hiểm nguy.",
  },
  {
    stem: "In accordance with diplomatic protocol, the ambassador is immune _______ prosecution in host courts.",
    correct: "from",
    distractors: ["with", "by", "over"],
    category: "Preposition",
    sourceTag: "HSGQG",
    targetTerm: "immune from prosecution / immune to disease",
    shortTip: "Immune FROM prosecution/taxation (miễn trừ pháp lý); Immune TO a disease (miễn dịch bệnh lý).",
  },
  {
    stem: "All personnel entering the cleanroom must strictly adhere _______ decontamination procedures.",
    correct: "to",
    distractors: ["with", "on", "by"],
    category: "Preposition",
    sourceTag: "DHBB",
    targetTerm: "adhere to",
    shortTip: "Adhere TO / Comply WITH / Abide BY = tuân thủ nghiêm ngặt quy định.",
  },
  {
    stem: "Failure to comply _______ international safety standards will result in the immediate revocation of the license.",
    correct: "with",
    distractors: ["to", "by", "on"],
    category: "Preposition",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "comply with",
    shortTip: "Comply WITH (rules/standards/regulations) = tuân thủ.",
  },
  {
    stem: "Both member states pledged to abide _______ the ruling of the International Court of Justice.",
    correct: "by",
    distractors: ["to", "with", "in"],
    category: "Preposition",
    sourceTag: "Destination C1&C2",
    targetTerm: "abide by",
    shortTip: "Abide BY a decision/ruling = chấp hành, tuân theo phán quyết.",
  },
  {
    stem: "His penchant _______ esoteric seventeenth-century poetry set him apart from his contemporaries.",
    correct: "for",
    distractors: ["to", "with", "in"],
    category: "Preposition",
    sourceTag: "HSGQG • CPE",
    targetTerm: "a penchant for",
    shortTip: "Have a penchant FOR something = có thiên hướng yêu thích đặc biệt cái gì.",
  },
  {
    stem: "The prime minister expressed grave misgivings _______ the feasibility of the proposed customs union.",
    correct: "about",
    distractors: ["toward", "against", "with"],
    category: "Preposition",
    sourceTag: "CPE",
    targetTerm: "misgivings about",
    shortTip: "Have misgivings ABOUT = có những mối nghi ngại, băn khoăn sâu sắc về.",
  },
  {
    stem: "Many coastal cities are increasingly susceptible _______ storm surges caused by rising sea levels.",
    correct: "to",
    distractors: ["with", "of", "for"],
    category: "Preposition",
    sourceTag: "Olympic 30/4",
    targetTerm: "susceptible to",
    shortTip: "Susceptible TO / Prone TO / Vulnerable TO = dễ bị tổn thương/ảnh hưởng bởi.",
  },
  {
    stem: "The treatise is completely devoid _______ empirical evidence to substantiate its sweeping claims.",
    correct: "of",
    distractors: ["from", "with", "in"],
    category: "Preposition",
    sourceTag: "HSGQG",
    targetTerm: "devoid of",
    shortTip: "Devoid OF = hoàn toàn trống rỗng, không có lấy một chút gì.",
  },
  {
    stem: "Such high-handed tactics are utterly alien _______ the collaborative ethos of our research institute.",
    correct: "to",
    distractors: ["from", "with", "against"],
    category: "Preposition",
    sourceTag: "DHBB",
    targetTerm: "alien to",
    shortTip: "Alien TO = xa lạ, trái ngược hoàn toàn với bản chất/tinh thần của ai/cái gì.",
  },
  {
    stem: "The choreographer’s latest work is deeply indebted _______ traditional Javanese shadow puppetry.",
    correct: "to",
    distractors: ["with", "for", "by"],
    category: "Preposition",
    sourceTag: "CPE",
    targetTerm: "indebted to",
    shortTip: "Be indebted TO = mang ơn hoặc chịu ảnh hưởng lớn từ.",
  },
  {
    stem: "A central banker must remain oblivious _______ short-term partisan clamor when setting monetary policy.",
    correct: "to",
    distractors: ["from", "with", "by"],
    category: "Preposition",
    sourceTag: "Destination C1&C2",
    targetTerm: "oblivious to/of",
    shortTip: "Oblivious TO = không bận tâm, không để ý tới.",
  },
  {
    stem: "The magistrate’s decision was predicated _______ the assumption that the defendant would surrender his passport.",
    correct: "on",
    distractors: ["to", "with", "from"],
    category: "Preposition",
    sourceTag: "HSGQG • CPE",
    targetTerm: "predicated on/upon",
    shortTip: "Be predicated ON/UPON = được đặt nền tảng/dựa trên giả định nào.",
  },
  {
    stem: "In his youth, the novelist was infatuated _______ the avant-garde manifestos of Paris.",
    correct: "with",
    distractors: ["by", "to", "in"],
    category: "Preposition",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "infatuated with",
    shortTip: "Infatuated WITH = say mê cuồng nhiệt (nhưng thường ngắn ngủi).",
  },
  {
    stem: "Any breach of confidentiality is tantamount _______ gross professional misconduct.",
    correct: "to",
    distractors: ["with", "as", "for"],
    category: "Preposition",
    sourceTag: "HSGQG • Destination C1&C2",
    targetTerm: "tantamount to",
    shortTip: "Tantamount TO + Noun/V-ing = tương đương với, chẳng khác nào.",
  },
  {
    stem: "The prosecutor’s cross-examination verged _______ harassment, prompting the judge to intervene.",
    correct: "on",
    distractors: ["to", "into", "with"],
    category: "Preposition",
    sourceTag: "CPE",
    targetTerm: "verge on / border on",
    shortTip: "Verge ON / Border ON = gần như chạm tới mức, xấp xỉ trở thành.",
  },

  // --- 6. ADVANCED LEXICO-GRAMMAR: INVERSION, SUBJUNCTIVE, CLAUSES (133 - 146) ---
  {
    stem: "Not until the declassified diplomatic cables were released _______ the sheer scale of the cover-up.",
    correct: "did historians comprehend",
    distractors: [
      "historians comprehended",
      "had historians comprehended",
      "that historians comprehend",
    ],
    category: "Lexico-Grammar",
    sourceTag: "HSGQG • CPE",
    targetTerm: "Not until + clause + Inversion",
    shortTip: "Not until + mệnh đề phụ + Đảo ngữ ở mệnh đề chính (did + S + V_bare).",
  },
  {
    stem: "Little _______ that the seemingly innocuous software update contained a zero-day exploit.",
    correct: "did the engineers suspect",
    distractors: [
      "the engineers suspected",
      "suspected the engineers",
      "were the engineers suspecting",
    ],
    category: "Lexico-Grammar",
    sourceTag: "DHBB",
    targetTerm: "Little + Auxiliary + S + V",
    shortTip: "Trạng từ phủ định 'Little' đứng đầu câu -> Đảo ngữ trợ động từ: Little did S + V_bare.",
  },
  {
    stem: "Under no circumstances _______ unattended in the high-containment laboratory.",
    correct: "should biological samples be left",
    distractors: [
      "biological samples should be left",
      "should be left biological samples",
      "are biological samples leaving",
    ],
    category: "Lexico-Grammar",
    sourceTag: "Olympic 30/4",
    targetTerm: "Under no circumstances + Inversion",
    shortTip: "Cụm giới từ phủ định đứng đầu câu bắt buộc đảo ngữ trợ động từ trước chủ ngữ.",
  },
  {
    stem: "Scarcely _______ the podium when the auditorium erupted into a standing ovation.",
    correct: "had the laureate reached",
    distractors: [
      "the laureate had reached",
      "did the laureate reach",
      "was the laureate reaching",
    ],
    category: "Lexico-Grammar",
    sourceTag: "HSGQG",
    targetTerm: "Scarcely/Hardly ... when",
    shortTip: "Scarcely/Hardly + had + S + V3/ed + when + S + V2/ed (Vừa mới... thì...).",
  },
  {
    stem: "No sooner _______ the ceasefire agreement than skirmishes resumed along the frontier.",
    correct: "had the envoys signed",
    distractors: [
      "did the envoys sign",
      "the envoys had signed",
      "had signed the envoys",
    ],
    category: "Lexico-Grammar",
    sourceTag: "Destination C1&C2",
    targetTerm: "No sooner ... than",
    shortTip: "No sooner + had + S + V3/ed + than + S + V2/ed.",
  },
  {
    stem: "_______ for the tugboat captain’s split-second maneuver, the tanker would have collided with the pier.",
    correct: "Had it not been",
    distractors: ["Were it not", "If it was not", "Should it not be"],
    category: "Lexico-Grammar",
    sourceTag: "HSGQG • CPE",
    targetTerm: "Had it not been for (Type 3 Inversion)",
    shortTip: "Đảo ngữ điều kiện loại 3 quá khứ: Had it not been for + Noun = But for + Noun.",
  },
  {
    stem: "_______ any unforeseen regulatory hurdles arise, the acquisition will close in the third quarter.",
    correct: "Should",
    distractors: ["Were", "Had", "Unless"],
    category: "Lexico-Grammar",
    sourceTag: "DHBB",
    targetTerm: "Should + S + V_bare (Type 1 Inversion)",
    shortTip: "Đảo ngữ câu điều kiện loại 1: Should + S + V_bare (không chia -s/es ở động từ arise!).",
  },
  {
    stem: "_______ the central bank to abandon its inflation target, bond yields would spike immediately.",
    correct: "Were",
    distractors: ["Should", "Had", "If"],
    category: "Lexico-Grammar",
    sourceTag: "CPE",
    targetTerm: "Were + S + to V (Type 2 Inversion)",
    shortTip: "Đảo ngữ câu điều kiện loại 2 với động từ thường: Were + S + to V_bare.",
  },
  {
    stem: "Exhausted _______ after the thirty-six-hour expedition, the glaciologists immediately cataloged their ice cores.",
    correct: "though they were",
    distractors: [
      "although they were",
      "despite they were",
      "however they were",
    ],
    category: "Lexico-Grammar",
    sourceTag: "HSGQG",
    targetTerm: "Adj + as/though + S + V",
    shortTip: "Cấu trúc nhượng bộ đảo tính từ lên đầu: Adj/Adv + as/though + S + be/V ('although' không đảo tính từ lên trước!).",
  },
  {
    stem: "Try _______ might, the cryptographer could not decipher the final page of the cipher.",
    correct: "as she",
    distractors: ["though her", "however she", "although she"],
    category: "Lexico-Grammar",
    sourceTag: "Olympic 30/4 • CPE",
    targetTerm: "Try as one might",
    shortTip: "Cấu trúc cố định C1/C2: Try as + S + might/may (Dù có cố gắng đến mấy).",
  },
  {
    stem: "The ethics charter requires that every committee member _______ any potential conflict of interest forthwith.",
    correct: "disclose",
    distractors: ["discloses", "disclosed", "is disclosing"],
    category: "Lexico-Grammar",
    sourceTag: "Trại hè Hùng Vương",
    targetTerm: "Mandative Subjunctive (that + S + V_bare)",
    shortTip: " Bàng thái cách (Subjunctive) sau require/stipulate/insist/imperative that + S + V_nguyên thể.",
  },
  {
    stem: "It is high time the municipality _______ its Victorian-era water mains instead of patching leaks.",
    correct: "overhauled",
    distractors: ["overhauls", "has overhauled", "will overhaul"],
    category: "Lexico-Grammar",
    sourceTag: "Destination C1&C2",
    targetTerm: "It is high time + S + V_past",
    shortTip: "It is (high/about) time + S + V2/ed (Quá khứ giả định chỉ việc đáng lẽ phải làm ngay).",
  },
  {
    stem: "So intricate _______ that master weavers needed eight months to complete a single tapestry.",
    correct: "was the pattern",
    distractors: [
      "the pattern was",
      "did the pattern be",
      "had the pattern",
    ],
    category: "Lexico-Grammar",
    sourceTag: "DHBB",
    targetTerm: "So + Adj + be + S + that...",
    shortTip: "Đảo ngữ với So + Adj đứng đầu câu: So + Adj + be + S + that-clause.",
  },
  {
    stem: "_______ the torrential monsoon rains, the archaeological excavation proceeded ahead of schedule.",
    correct: "Notwithstanding",
    distractors: ["Albeit", "Whereas", "Whereby"],
    category: "Lexico-Grammar",
    sourceTag: "HSGQG • CPE",
    targetTerm: "Notwithstanding + Noun Phrase",
    shortTip: "Notwithstanding (+ cụm danh từ) = Bất chấp (trang trọng hơn Despite). Albeit đi với Adj/Adv/cụm giới từ ngắn.",
  },

  // --- 7. WORD FORMATION REFLEX ITEMS (147 - 160) ---
  {
    stem: "[WORD FORM: PRECEDE] The pandemic triggered an _______ disruption to global maritime logistics.",
    correct: "unprecedented",
    distractors: ["unprecedenting", "precedential", "inprecedented"],
    category: "Word Formation",
    sourceTag: "HSGQG • Word Form",
    targetTerm: "PRECEDE -> unprecedented (adj)",
    shortTip: "PRECEDE -> unprecedented (chưa từng có tiền lệ). Lưu ý tiền tố UN- và hậu tố -ED.",
  },
  {
    stem: "[WORD FORM: RECONCILE] Talks collapsed due to _______ philosophical differences between the two founders.",
    correct: "irreconcilable",
    distractors: ["unreconcilable", "irreconciliable", "nonreconcilable"],
    category: "Word Formation",
    sourceTag: "DHBB • Word Form",
    targetTerm: "RECONCILE -> irreconcilable (adj)",
    shortTip: "RECONCILE -> irreconcilable (không thể dung hòa). Lưu ý bỏ 'e' trước '-able' và tiền tố IR-.",
  },
  {
    stem: "[WORD FORM: CONTROVERSY] The supreme court nominee’s _______ academic record won bipartisan praise.",
    correct: "uncontroversial",
    distractors: ["incontroversial", "discontroversial", "noncontroversy"],
    category: "Word Formation",
    sourceTag: "Olympic 30/4 • Word Form",
    targetTerm: "CONTROVERSY -> uncontroversial (adj)",
    shortTip: "CONTROVERSY -> controversial -> uncontroversial (không gây tranh cãi).",
  },
  {
    stem: "[WORD FORM: PROPORTION] Low-income households are _______ affected by regressive consumption taxes.",
    correct: "disproportionately",
    distractors: ["unproportionately", "inproportionately", "misproportionally"],
    category: "Word Formation",
    sourceTag: "HSGQG • Word Form",
    targetTerm: "PROPORTION -> disproportionately (adv)",
    shortTip: "PROPORTION -> disproportionate -> disproportionately (một cách bất cân xứng).",
  },
  {
    stem: "[WORD FORM: EQUIVOCATE] The prime minister issued an _______ condemnation of the cyberattack.",
    correct: "unequivocal",
    distractors: ["inequivocal", "disequivocal", "equivocative"],
    category: "Word Formation",
    sourceTag: "CPE • Word Form",
    targetTerm: "EQUIVOCATE -> unequivocal (adj)",
    shortTip: "Unequivocal = dứt khoát, rõ ràng, không chút mập mờ.",
  },
  {
    stem: "[WORD FORM: DISPENSE] High-precision lithography machines have become _______ to modern chip fabrication.",
    correct: "indispensable",
    distractors: ["undispensable", "indispensible", "dispensatory"],
    category: "Word Formation",
    sourceTag: "Destination C1&C2 • Word Form",
    targetTerm: "DISPENSE -> indispensable (adj)",
    shortTip: "Indispensable = không thể thiếu được (lưu ý chính tả đuôi -ABLE, không phải -ible!).",
  },
  {
    stem: "[WORD FORM: DENY] The documentary presents _______ proof of glacial retreat across the Andes.",
    correct: "undeniable",
    distractors: ["indeniable", "undenyable", "non-deniable"],
    category: "Word Formation",
    sourceTag: "Trại hè Hùng Vương • Word Form",
    targetTerm: "DENY -> undeniable (adj)",
    shortTip: "DENY -> undeniable (không thể chối cãi; đổi 'y' thành 'i' + able).",
  },
  {
    stem: "[WORD FORM: REPLACE] The fire destroyed _______ fourteenth-century illuminated manuscripts.",
    correct: "irreplaceable",
    distractors: ["irreplacable", "unreplaceable", "inreplaceable"],
    category: "Word Formation",
    sourceTag: "HSGQG • Word Form",
    targetTerm: "REPLACE -> irreplaceable (adj)",
    shortTip: "Irreplaceable = không thể thay thế (giữ nguyên chữ 'e' sau 'c' để giữ âm /s/: irreplace-able!).",
  },
  {
    stem: "[WORD FORM: NOTICE] Thanks to acoustic panelling, traffic noise inside the concert hall is virtually _______.",
    correct: "imperceptible",
    distractors: ["unnoticeable", "innoticeable", "noticeless"],
    category: "Word Formation",
    sourceTag: "CPE • Word Form",
    targetTerm: "NOTICE -> unnoticeable / PERCEIVE -> imperceptible",
    shortTip: "Imperceptible / Unnoticeable = hầu như không thể nhận thấy bằng giác quan.",
  },
  {
    stem: "[WORD FORM: EXPLAIN] For reasons that remain _______, the lighthouse beacon went dark at midnight.",
    correct: "inexplicable",
    distractors: ["unexplainable", "inexplainable", "explicative"],
    category: "Word Formation",
    sourceTag: "HSGQG • Word Form",
    targetTerm: "EXPLAIN -> inexplicable (adj)",
    shortTip: "EXPLAIN -> inexplicable (không thể lý giải được — biến đổi gốc từ chuẩn C1/C2!).",
  },
  {
    stem: "[WORD FORM: COMPARE] Callas possessed an _______ dramatic intensity that defined twentieth-century opera.",
    correct: "incomparable",
    distractors: ["uncomparable", "noncomparable", "incomparible"],
    category: "Word Formation",
    sourceTag: "DHBB • Word Form",
    targetTerm: "COMPARE -> incomparable (adj)",
    shortTip: "COMPARE -> incomparable (vô song, không gì sánh kịp — trọng âm rơi vào âm tiết thứ 2: in'comparable).",
  },
  {
    stem: "[WORD FORM: REVOKE] Once signed before a notary, the deed of gift becomes legally _______.",
    correct: "irrevocable",
    distractors: ["irrevokable", "unrevocable", "inrevocable"],
    category: "Word Formation",
    sourceTag: "CPE • Word Form",
    targetTerm: "REVOKE -> irrevocable (adj)",
    shortTip: "REVOKE -> irrevocable (không thể thu hồi/hủy bỏ — đổi 'ke' thành 'c' + able!).",
  },
  {
    stem: "[WORD FORM: BREAK] Epidemiologists traced the _______ to a contaminated water reservoir.",
    correct: "outbreak",
    distractors: ["breakout", "breakage", "breakdown"],
    category: "Word Formation",
    sourceTag: "Olympic 30/4 • Word Form",
    targetTerm: "BREAK -> outbreak (noun)",
    shortTip: "Outbreak = sự bùng phát (dịch bệnh, chiến tranh). Breakout = vụ vượt ngục.",
  },
  {
    stem: "[WORD FORM: COME] Despite his tactical brilliance, impatience remained the general’s greatest _______.",
    correct: "shortcoming",
    distractors: ["downcoming", "outcoming", "incoming"],
    category: "Word Formation",
    sourceTag: "Destination C1&C2 • Word Form",
    targetTerm: "COME -> shortcoming (noun)",
    shortTip: "Shortcoming = khuyết điểm, nhược điểm cá nhân.",
  },
];

/**
 * Helper to categorize an exam question based on its stem/hint/part title
 */
function inferQuestionCategory(
  stem: string,
  partTitle = "",
  explanation = ""
): ArcadeReflexQuestion["category"] {
  const combined = `${stem} ${partTitle} ${explanation}`.toLowerCase();
  if (combined.includes("word form") || combined.includes("gốc từ")) {
    return "Word Formation";
  }
  if (
    combined.includes("phrasal verb") ||
    /\b(step|pull|back|paper|water|boil|clamp|shore|conjure|brush|scrape|fall|put|set|gloss|mull|tide|win|blow)\s+(in|out|up|down|off|over|through|aside|back)\b/i.test(
      combined
    )
  ) {
    return "Phrasal Verb";
  }
  if (combined.includes("idiom") || combined.includes("thành ngữ")) {
    return "Idiom";
  }
  if (combined.includes("giới từ") || combined.includes("preposition")) {
    return "Preposition";
  }
  if (
    combined.includes("Not until") ||
    combined.includes("No sooner") ||
    combined.includes("Scarcely") ||
    combined.includes("đảo ngữ") ||
    combined.includes("subjunctive")
  ) {
    return "Lexico-Grammar";
  }
  if (combined.includes("collocation")) {
    return "Collocation";
  }
  return "Confusable Words";
}

/**
 * Extract short micro-questions from the live Exam database AND merge with our
 * 160-item C1/C2 curated bank. Applies balanced Fisher-Yates shuffling so that
 * correctIndex is evenly distributed across 0 (A), 1 (B), 2 (C), and 3 (D).
 */
export function extractMicroQuestionsFromExams(
  exams: any[] = [],
  categoryFilter: string = "ALL"
): ArcadeReflexQuestion[] {
  const rawPool: RawSeedItem[] = [...RAW_CURATED_BANK];
  const seenStems = new Set<string>(
    RAW_CURATED_BANK.map((q) =>
      q.stem.replace(/^\d+\.\s*/, "").trim().toLowerCase()
    )
  );

  // Pull short Lexico-Grammar & Word Formation items from all loaded exams
  if (Array.isArray(exams)) {
    for (const exam of exams) {
      const tournament = exam?.tournament || "HSGQG";
      const lexicoParts = exam?.sections?.lexicoGrammar?.parts || [];
      for (const part of lexicoParts) {
        const partTitle = part?.title || part?.partTitle || "Lexico-Grammar";
        const questions = part?.questions || [];
        for (const q of questions) {
          const cleanStem = String(q?.stem || "")
            .replace(/^\d+\.\s*/, "")
            .trim();
          // Skip overly long reading-style stems for fast reflex arcade play
          if (!cleanStem || cleanStem.length > 235) continue;
          const normKey = cleanStem.toLowerCase();
          if (seenStems.has(normKey)) continue;

          if (Array.isArray(q.options) && q.options.length === 4) {
            const ansLetter = String(q.answer || "A")
              .trim()
              .toUpperCase();
            const correctOpt =
              q.options.find(
                (o: any) => String(o.id).toUpperCase() === ansLetter
              ) || q.options[0];
            const distractorOpts = q.options.filter(
              (o: any) => o !== correctOpt
            );
            if (correctOpt && distractorOpts.length === 3) {
              seenStems.add(normKey);
              const correctText = String(correctOpt.text || "").trim();
              const rawTip = String(
                q.hint || q.explanationVi || "Cấu trúc từ vựng — ngữ pháp C1/C2 trọng tâm."
              )
                .replace(/^\[Đáp án chuẩn:[^\]]+\]\s*/i, "")
                .trim();

              rawPool.push({
                stem: cleanStem,
                correct: correctText,
                distractors: [
                  String(distractorOpts[0].text || "").trim(),
                  String(distractorOpts[1].text || "").trim(),
                  String(distractorOpts[2].text || "").trim(),
                ],
                category: inferQuestionCategory(cleanStem, partTitle, rawTip),
                sourceTag: `${tournament} • ${exam?.province || "Chuyên Anh"}`,
                targetTerm: `${correctText} (${partTitle})`,
                shortTip: rawTip.slice(0, 175),
              });
            }
          }
        }
      }
    }
  }

  // Filter by category if requested
  const filteredRaw =
    categoryFilter && categoryFilter !== "ALL"
      ? rawPool.filter((item) => item.category === categoryFilter)
      : rawPool;

  // Build balanced reflex questions with exact 25% A / 25% B / 25% C / 25% D distribution
  return filteredRaw.map((raw, idx) =>
    buildBalancedReflexQuestion(raw, idx, "c1c2-reflex")
  );
}

/**
 * Compute answer distribution across 0 (A), 1 (B), 2 (C), 3 (D) for verification badges
 */
export function getAnswerDistributionStats(questions: ArcadeReflexQuestion[]) {
  const counts = { A: 0, B: 0, C: 0, D: 0, total: questions.length };
  for (const q of questions) {
    counts[q.correctLetter] = (counts[q.correctLetter] || 0) + 1;
  }
  return counts;
}

export const extractReflexMicroQuestions = extractMicroQuestionsFromExams;
