// C1/C2 Lexical Mastery Studio — curated datasets (5-layer lexical matrix)

export type DeckId =
  | "mistakes"
  | "core"
  | "wordform"
  | "confusable"
  | "academic"
  | "custom";

export type RegisterTag =
  | "Formal"
  | "Academic C2"
  | "Idiom"
  | "Literary"
  | "Pejorative"
  | "Neutral"
  | "Phrasal Verb"
  | "Informal";

export interface WordFamily {
  noun?: string;
  verb?: string;
  adj?: string;
  neg?: string;
  adv?: string;
}

export interface LexicalEntry {
  id: string;
  deck: DeckId;
  word: string;
  ipa: string;
  register: RegisterTag;
  meaningVi: string;
  definitionEn: string;
  family: WordFamily;
  collocations: string[];
  etymology: string;
  trap: string;
  example: string;
  sourceTag?: string;
}

type Raw = [
  string, // word
  string, // ipa
  RegisterTag,
  string, // meaningVi
  string, // definitionEn
  WordFamily,
  string[], // collocations
  string, // etymology
  string, // trap
  string // example
];

function build(deck: DeckId, rows: Raw[]): LexicalEntry[] {
  return rows.map((r, i) => ({
    id: `${deck}-${i + 1}`,
    deck,
    word: r[0],
    ipa: r[1],
    register: r[2],
    meaningVi: r[3],
    definitionEn: r[4],
    family: r[5],
    collocations: r[6],
    etymology: r[7],
    trap: r[8],
    example: r[9],
  }));
}

// ---------------------------------------------------------------------------
// DECK 2 — DESTINATION C1 & C2 CORE (Phrasal verbs, idioms, prepositional phrases)
// ---------------------------------------------------------------------------
const CORE: Raw[] = [
  ["bring about", "/brɪŋ əˈbaʊt/", "Phrasal Verb", "gây ra, mang lại (thay đổi)", "to cause something to happen", { noun: "—", verb: "bring about" }, ["bring about a change / reform", "bring about the downfall of + N"], "bring (mang) + about (xung quanh, xảy ra) → làm cho sự việc xuất hiện.", "Khác 'bring up' (nuôi dạy / nêu vấn đề) và 'bring round' (thuyết phục / làm tỉnh lại).", "The new legislation brought about sweeping reforms in public healthcare."],
  ["come up against", "/kʌm ʌp əˈɡenst/", "Phrasal Verb", "đối mặt với (khó khăn, phản đối)", "to have to deal with a problem or opposition", {}, ["come up against fierce opposition", "come up against bureaucratic obstacles"], "Ba thành tố: come + up (tiến tới) + against (chống lại) → va phải chướng ngại.", "Khác 'come up with' (nghĩ ra ý tưởng) và 'come down with' (mắc bệnh nhẹ).", "Reformers invariably come up against entrenched vested interests."],
  ["fall through", "/fɔːl θruː/", "Phrasal Verb", "thất bại, đổ bể (kế hoạch)", "to fail to happen or be completed", {}, ["the deal / plan fell through", "negotiations fell through at the last minute"], "fall (rơi) + through (xuyên qua) → kế hoạch rơi lọt qua kẽ hở, không thành.", "Không dùng bị động; 'fall behind' = tụt hậu, 'fall out with' = bất hòa.", "The merger fell through when regulators raised antitrust concerns."],
  ["get round to", "/ɡet raʊnd tuː/", "Phrasal Verb", "rốt cuộc cũng làm (việc trì hoãn)", "to finally do something after a delay", {}, ["get round to + V-ing", "never get round to replying"], "get round (đi vòng) + to → cuối cùng vòng tới việc đó.", "Theo sau là V-ing (to là giới từ): 'get round to doing', KHÔNG phải 'to do'.", "I finally got round to reading the report you sent last month."],
  ["live up to", "/lɪv ʌp tuː/", "Phrasal Verb", "đáp ứng, xứng với (kỳ vọng)", "to be as good as expected", {}, ["live up to expectations / one's reputation", "fail to live up to the hype"], "live (sống) + up to (đạt tới mức) → sống ngang tầm kỳ vọng.", "Khác 'live down' (khiến người ta quên đi lỗi lầm) và 'live on' (sống nhờ vào).", "The sequel failed to live up to the critical acclaim of the original."],
  ["put forward", "/pʊt ˈfɔːwəd/", "Phrasal Verb", "đề xuất, đưa ra (ý kiến)", "to propose a plan or idea for consideration", {}, ["put forward a proposal / theory", "put forward a compelling argument"], "put (đặt) + forward (phía trước) → đặt ý tưởng ra trước mọi người.", "Khác 'put off' (hoãn), 'put across' (truyền đạt rõ), 'put up with' (chịu đựng).", "Several economists put forward a radical alternative to austerity."],
  ["stem from", "/stem frəm/", "Phrasal Verb", "bắt nguồn từ", "to originate from or be caused by", { noun: "stem" }, ["stem from a deep-seated fear", "problems stemming from neglect"], "stem = thân cây → mọc ra từ gốc nào đó.", "Không dùng tiếp diễn/bị động khi chỉ nguyên nhân; khác 'stem the flow' (ngăn chặn dòng chảy).", "Much of the unrest stems from chronic youth unemployment."],
  ["account for", "/əˈkaʊnt fɔː/", "Phrasal Verb", "chiếm (tỉ lệ); giải thích cho", "to form a proportion of; to explain", { noun: "account", adj: "accountable", neg: "unaccountable", adv: "unaccountably" }, ["account for 40% of emissions", "account for the discrepancy"], "ad- (tới) + computare (tính toán) → tính vào phần của.", "Bẫy giới từ: 'account FOR', không phải 'account to/of' trong nghĩa này.", "Fossil fuels still account for the lion's share of global energy supply."],
  ["play down", "/pleɪ daʊn/", "Phrasal Verb", "giảm nhẹ, xem nhẹ tầm quan trọng", "to make something seem less important", {}, ["play down the risks / significance", "officials played down fears of"], "play (diễn) + down (xuống) → diễn tả cho nhỏ đi.", "Trái nghĩa 'play up' (cường điệu); khác 'downplay' (đồng nghĩa, một từ).", "The minister sought to play down the severity of the crisis."],
  ["cut corners", "/kʌt ˈkɔːnəz/", "Idiom", "làm ẩu, đốt cháy giai đoạn", "to do something cheaply or carelessly", {}, ["cut corners on safety", "be tempted to cut corners"], "Hình ảnh cắt góc đường để đi tắt → bỏ qua bước cần thiết.", "Khác 'turn the corner' (vượt qua giai đoạn khó khăn).", "The contractor was accused of cutting corners on fire safety."],
  ["a blessing in disguise", "/ə ˈblesɪŋ ɪn dɪsˈɡaɪz/", "Idiom", "trong cái rủi có cái may", "something that seems bad but has good results", {}, ["prove (to be) a blessing in disguise"], "disguise = cải trang → phước lành đội lốt tai họa.", "Đi với 'prove' hoặc 'turn out to be', không đi với 'make'.", "Losing that job proved a blessing in disguise."],
  ["the tip of the iceberg", "/ðə tɪp əv ði ˈaɪsbɜːɡ/", "Idiom", "phần nổi của tảng băng", "a small visible part of a much larger problem", {}, ["merely / only the tip of the iceberg"], "Ẩn dụ tảng băng: 90% nằm dưới mặt nước.", "Không dùng 'top of the iceberg'.", "Reported cases are merely the tip of the iceberg."],
  ["pay lip service to", "/peɪ lɪp ˈsɜːvɪs tuː/", "Idiom", "nói suông, ủng hộ ngoài miệng", "to express support without acting on it", {}, ["pay lip service to equality / reform"], "lip (môi) + service (phục vụ) → chỉ phục vụ bằng môi.", "Động từ cố định là 'pay', KHÔNG phải 'give/do lip service'.", "Many firms pay lip service to sustainability while expanding drilling."],
  ["on the verge of", "/ɒn ðə vɜːdʒ əv/", "Formal", "trên bờ vực, sắp sửa", "very near to doing or experiencing something", {}, ["on the verge of collapse / extinction / tears"], "Latin virga (cây gậy, ranh giới) → đứng sát mép.", "Đồng nghĩa 'on the brink of'; giới từ cố định là 'on', không phải 'in/at'.", "The species is on the verge of extinction."],
  ["in the wake of", "/ɪn ðə weɪk əv/", "Formal", "ngay sau, do hậu quả của", "following, often as a consequence of", {}, ["in the wake of the scandal / pandemic"], "wake = vệt sóng sau đuôi tàu → những gì kéo theo sau.", "Không nhầm với 'awake'; giới từ cố định 'in'.", "In the wake of the scandal, the CEO resigned."],
  ["at odds with", "/æt ɒdz wɪð/", "Formal", "mâu thuẫn, trái ngược với", "in disagreement or conflict with", {}, ["be at odds with the evidence", "find oneself at odds with colleagues"], "odds = sự chênh lệch → ở thế lệch nhau.", "Giới từ: at odds WITH (không phải 'to').", "His public statements are at odds with his voting record."],
  ["by virtue of", "/baɪ ˈvɜːtʃuː əv/", "Formal", "nhờ vào, bởi vì", "because of; as a result of", {}, ["by virtue of his position / seniority"], "virtus (Latin: phẩm chất, năng lực) → nhờ phẩm chất đó.", "Không nhầm 'in virtue of' (cổ) hay 'by means of' (bằng phương tiện).", "She was granted citizenship by virtue of her marriage."],
  ["in lieu of", "/ɪn ljuː əv/", "Formal", "thay cho", "instead of", {}, ["in lieu of payment / flowers"], "Pháp cổ lieu = chỗ, vị trí → ở vị trí của.", "Phát âm /ljuː/; đừng viết 'in loo of'.", "Staff received extra leave in lieu of overtime pay."],
  ["turn a blind eye to", "/tɜːn ə blaɪnd aɪ tuː/", "Idiom", "làm ngơ, nhắm mắt cho qua", "to pretend not to notice", {}, ["turn a blind eye to corruption / abuses"], "Tích Nelson đặt ống nhòm vào mắt mù để lờ mệnh lệnh.", "Giới từ: TO; khác 'see eye to eye' (đồng quan điểm).", "Authorities turned a blind eye to illegal logging."],
  ["get to grips with", "/ɡet tə ɡrɪps wɪð/", "Idiom", "nắm bắt, xử lý nghiêm túc", "to begin to understand and deal with", {}, ["get to grips with the problem / new software"], "grip = nắm chặt → nắm chặt được vấn đề.", "Luôn số nhiều 'grips'; khác 'come to terms with' (chấp nhận).", "The government has yet to get to grips with inflation."],
  ["take something in one's stride", "/teɪk ɪn wʌnz straɪd/", "Idiom", "bình thản đối mặt", "to deal calmly with something difficult", {}, ["take criticism / setbacks in one's stride"], "stride = sải bước → không phá vỡ nhịp bước.", "Không dùng 'take in one's step'.", "She took the sudden promotion in her stride."],
  ["be left to one's own devices", "/left tə wʌnz əʊn dɪˈvaɪsɪz/", "Idiom", "để mặc tự xoay xở", "to be allowed to do what one wants unsupervised", {}, ["children left to their own devices"], "device (Latin dividere) = ý định riêng → để theo ý mình.", "Luôn số nhiều 'devices'.", "Left to their own devices, the pupils devised ingenious experiments."],
];

// ---------------------------------------------------------------------------
// DECK 3 — HỌ TỪ WORD FORMATION (Top derivative roots)
// ---------------------------------------------------------------------------
const WORDFORM: Raw[] = [
  ["PRECEDE", "/prɪˈsiːd/", "Formal", "đi trước, xảy ra trước", "to come before in time or order", { noun: "precedent / precedence", verb: "precede", adj: "unprecedented / preceding", neg: "unprecedented", adv: "unprecedentedly" }, ["an unprecedented scale / surge", "set a precedent for", "take precedence over"], "pre- (trước) + cedere (đi) → đi trước.", "precedent (tiền lệ) ≠ president; 'unprecedented' mang nghĩa phủ định của tiền lệ.", "The pandemic triggered an unprecedented surge in remote work."],
  ["RECONCILE", "/ˈrekənsaɪl/", "Formal", "hòa giải, dung hòa", "to make two things compatible", { noun: "reconciliation", verb: "reconcile", adj: "reconcilable", neg: "irreconcilable", adv: "irreconcilably" }, ["irreconcilable differences", "reconcile A with B", "seek reconciliation"], "re- (lại) + conciliare (kết nối) → gắn lại với nhau.", "Phủ định dùng ir- (trước r): irreconcilable, KHÔNG phải unreconcilable.", "The couple cited irreconcilable differences."],
  ["COMPETE", "/kəmˈpiːt/", "Neutral", "cạnh tranh", "to try to win against others", { noun: "competition / competitor / competitiveness", verb: "compete", adj: "competitive", neg: "uncompetitive", adv: "competitively" }, ["fiercely competitive", "competitively priced", "compete for market share"], "com- (cùng) + petere (tìm kiếm) → cùng theo đuổi.", "competent (có năng lực) là họ khác; 'competitive edge' ≠ 'competent edge'.", "Domestic firms became uncompetitive after tariffs were lifted."],
  ["COMPREHEND", "/ˌkɒmprɪˈhend/", "Formal", "hiểu, lĩnh hội", "to understand fully", { noun: "comprehension", verb: "comprehend", adj: "comprehensible / comprehensive", neg: "incomprehensible", adv: "incomprehensibly" }, ["utterly incomprehensible", "a comprehensive overhaul"], "com- (toàn bộ) + prehendere (nắm) → nắm toàn bộ.", "comprehensible = dễ hiểu; comprehensive = toàn diện.", "The jargon rendered the contract incomprehensible to laymen."],
  ["SUSTAIN", "/səˈsteɪn/", "Academic C2", "duy trì, chống đỡ", "to maintain over time", { noun: "sustainability / sustenance", verb: "sustain", adj: "sustainable / sustained", neg: "unsustainable", adv: "sustainably" }, ["unsustainable levels of debt", "sustained growth", "sustainable development"], "sub- (dưới) + tenere (giữ) → giữ từ bên dưới.", "sustenance (đồ ăn nuôi sống) khác sustainability (tính bền vững).", "Current consumption patterns are environmentally unsustainable."],
  ["RESPECT", "/rɪˈspekt/", "Neutral", "tôn trọng", "admiration; to admire", { noun: "respect / respectability", verb: "respect", adj: "respectful / respectable / respective", neg: "disrespectful", adv: "respectively" }, ["respectively (theo thứ tự)", "a respectable salary", "respectful of tradition"], "re- (lại) + specere (nhìn) → nhìn lại với sự trân trọng.", "respectful (tỏ ra tôn trọng) ≠ respectable (đáng kính, khá) ≠ respective (tương ứng).", "The first and second prizes went to Lan and Minh respectively."],
  ["DISPUTE", "/dɪˈspjuːt/", "Formal", "tranh chấp, bác bỏ", "to argue about; to question truth", { noun: "dispute / disputation", verb: "dispute", adj: "disputable / disputed", neg: "indisputable", adv: "indisputably" }, ["indisputable evidence", "a territorial dispute", "beyond dispute"], "dis- (tách) + putare (suy tính) → tính toán khác nhau.", "Phủ định là in- (indisputable), không phải undisputable (dù 'undisputed' tồn tại với nghĩa 'không bị tranh cãi').", "She is indisputably the finest pianist of her generation."],
  ["ACCESS", "/ˈækses/", "Neutral", "tiếp cận", "the means to reach or use", { noun: "access / accessibility", verb: "access", adj: "accessible", neg: "inaccessible", adv: "accessibly" }, ["inaccessible terrain", "gain access to", "improve accessibility"], "ad- (tới) + cedere (đi) → đi tới gần.", "access + to + N (danh từ); 'access the data' (động từ) không có 'to'.", "The village remains inaccessible during the monsoon."],
  ["PREDICT", "/prɪˈdɪkt/", "Neutral", "dự đoán", "to say what will happen", { noun: "prediction / predictability", verb: "predict", adj: "predictable", neg: "unpredictable", adv: "predictably / unpredictably" }, ["notoriously unpredictable", "predictably, the plan failed"], "pre- (trước) + dicere (nói) → nói trước.", "Trạng từ đầu câu 'Predictably,' bình luận cả câu.", "Markets are notoriously unpredictable in an election year."],
  ["CONTROVERSY", "/ˈkɒntrəvɜːsi/", "Academic C2", "sự tranh cãi", "public disagreement", { noun: "controversy", adj: "controversial", neg: "uncontroversial", adv: "controversially" }, ["spark / stir controversy", "highly controversial"], "contra (ngược) + vertere (xoay) → quay ngược nhau.", "Trọng âm BrE: CONtroversy hoặc conTROversy; tính từ controVERsial.", "The decision was, controversially, made behind closed doors."],
  ["VULNERABLE", "/ˈvʌlnərəbl/", "Formal", "dễ bị tổn thương", "easily harmed", { noun: "vulnerability", adj: "vulnerable", neg: "invulnerable", adv: "vulnerably" }, ["vulnerable to attack", "expose one's vulnerability"], "vulnus (Latin: vết thương) + -able → có thể bị thương.", "invulnerable (bất khả xâm phạm) — đừng viết unvulnerable.", "Coastal cities are particularly vulnerable to rising sea levels."],
  ["EFFICIENT", "/ɪˈfɪʃnt/", "Neutral", "hiệu quả (ít lãng phí)", "achieving results with little waste", { noun: "efficiency / inefficiency", adj: "efficient", neg: "inefficient", adv: "efficiently" }, ["energy-efficient", "streamline for efficiency"], "ex- (ra) + facere (làm) → làm ra kết quả.", "efficient (ít lãng phí) ≠ effective (đạt mục tiêu) ≠ efficacious (hữu hiệu – thuốc).", "Bureaucratic inefficiency delayed the project by years."],
  ["LEGITIMATE", "/lɪˈdʒɪtɪmət/", "Formal", "hợp pháp, chính đáng", "allowed by law; reasonable", { noun: "legitimacy", verb: "legitimize", adj: "legitimate", neg: "illegitimate", adv: "legitimately" }, ["a legitimate concern", "undermine the legitimacy of"], "lex/legis (Latin: luật) → hợp với luật.", "Phủ định il- trước l: illegitimate.", "Critics questioned the legitimacy of the referendum."],
  ["RESPONSIBLE", "/rɪˈspɒnsəbl/", "Neutral", "chịu trách nhiệm", "having a duty to deal with", { noun: "responsibility", adj: "responsible / responsive", neg: "irresponsible", adv: "responsibly / irresponsibly" }, ["fiscally irresponsible", "take responsibility for"], "respondere (đáp lại) → có nghĩa vụ đáp lại.", "responsive (phản hồi nhanh) ≠ responsible.", "It would be irresponsible to ignore the warnings."],
  ["DESCRIBE", "/dɪˈskraɪb/", "Neutral", "mô tả", "to give an account of", { noun: "description", verb: "describe", adj: "descriptive / describable", neg: "indescribable", adv: "indescribably" }, ["indescribably beautiful", "beggar description"], "de- (xuống) + scribere (viết) → viết ra.", "Thành ngữ 'beggar description' = không tả xiết.", "The devastation was indescribable."],
  ["SIGNIFY", "/ˈsɪɡnɪfaɪ/", "Formal", "biểu thị", "to be a sign of", { noun: "significance / signification", verb: "signify", adj: "significant", neg: "insignificant", adv: "significantly" }, ["statistically significant", "pale into insignificance"], "signum (dấu hiệu) + facere (làm).", "Thành ngữ 'pale into insignificance' = trở nên nhỏ bé khi so sánh.", "Our problems pale into insignificance beside theirs."],
  ["SUFFICE", "/səˈfaɪs/", "Formal", "đủ", "to be enough", { noun: "sufficiency / insufficiency", verb: "suffice", adj: "sufficient", neg: "insufficient", adv: "sufficiently" }, ["suffice it to say", "insufficient evidence"], "sub- (dưới) + facere → làm đủ nền tảng.", "'Suffice it to say' là cấu trúc giả định cố định.", "The case collapsed owing to insufficient evidence."],
  ["ADVANTAGE", "/ədˈvɑːntɪdʒ/", "Neutral", "lợi thế", "a favourable condition", { noun: "advantage / disadvantage", adj: "advantageous / disadvantaged", neg: "disadvantageous", adv: "advantageously" }, ["socially disadvantaged", "mutually advantageous"], "Pháp cổ avant (phía trước) → ở vị trí phía trước.", "disadvantaged (bị thiệt thòi – người) ≠ disadvantageous (bất lợi – điều kiện).", "Scholarships target students from disadvantaged backgrounds."],
  ["FORESEE", "/fɔːˈsiː/", "Formal", "thấy trước", "to predict", { noun: "foresight", verb: "foresee", adj: "foreseeable", neg: "unforeseen / unforeseeable", adv: "—" }, ["for the foreseeable future", "unforeseen circumstances"], "fore- (trước) + see.", "unforeseen (không lường trước được – đã xảy ra) vs unforeseeable (không thể lường).", "Due to unforeseen circumstances, the concert was cancelled."],
  ["CAPABLE", "/ˈkeɪpəbl/", "Neutral", "có khả năng", "able to do something", { noun: "capability / capacity", verb: "incapacitate", adj: "capable", neg: "incapable", adv: "capably" }, ["incapable of + V-ing", "nuclear capability"], "capere (Latin: nắm, chứa) → chứa được.", "capable OF + V-ing (không dùng 'to V').", "The regime seems incapable of reform."],
];

// ---------------------------------------------------------------------------
// DECK 4 — CẶP TỪ DỄ NHẦM (Confusable words radar)
// ---------------------------------------------------------------------------
const CONFUSABLE: Raw[] = [
  ["disinterested", "/dɪsˈɪntrəstɪd/", "Formal", "vô tư, khách quan", "impartial; not influenced by personal gain", { noun: "disinterest", adj: "disinterested", adv: "disinterestedly" }, ["a disinterested observer / party"], "dis- (tách khỏi) + interest (lợi ích) → không vướng lợi ích.", "uninterested = thờ ơ, không quan tâm. Trọng tài phải 'disinterested', không 'uninterested'.", "Disputes should be settled by a disinterested arbiter."],
  ["comprehensible", "/ˌkɒmprɪˈhensəbl/", "Formal", "có thể hiểu được", "able to be understood", { noun: "comprehensibility", adj: "comprehensible", neg: "incomprehensible" }, ["readily comprehensible to"], "-ible = có thể → có thể nắm bắt.", "comprehensive = bao quát, toàn diện (a comprehensive survey).", "The lecture was comprehensible even to first-year students."],
  ["impervious", "/ɪmˈpɜːviəs/", "Academic C2", "không bị ảnh hưởng, không thấm", "unable to be affected by; not allowing fluid through", { adj: "impervious", noun: "imperviousness" }, ["remain impervious to criticism / pressure"], "in- (không) + per (xuyên) + via (đường) → không có đường xuyên qua.", "imperious = hống hách; impetuous = bốc đồng; impervious = trơ trước tác động.", "The minister remained impervious to public outcry."],
  ["imperious", "/ɪmˈpɪəriəs/", "Pejorative", "hống hách, độc đoán", "arrogant and domineering", { adj: "imperious", adv: "imperiously" }, ["an imperious manner / tone"], "imperium (Latin: quyền lực tối cao) → ra vẻ đế vương.", "Đừng nhầm với impervious (trơ) hay imperial (thuộc đế quốc).", "She dismissed the waiter with an imperious wave."],
  ["impetuous", "/ɪmˈpetʃuəs/", "Formal", "hấp tấp, bốc đồng", "acting quickly without thought", { noun: "impetuosity", adj: "impetuous", adv: "impetuously" }, ["an impetuous decision / youth"], "impetus (đà, lực đẩy) → bị đà cuốn đi.", "impetuous ≠ impetus (danh từ: động lực).", "His impetuous resignation cost him his pension."],
  ["classic", "/ˈklæsɪk/", "Neutral", "kinh điển, điển hình", "judged over time to be of the highest quality; typical", { adj: "classic" }, ["a classic example of", "a classic novel"], "classicus (Latin: hạng nhất).", "classical = thuộc cổ điển (âm nhạc cổ điển, Hy-La): classical music, classical antiquity.", "It was a classic case of mismanagement."],
  ["continual", "/kənˈtɪnjuəl/", "Neutral", "liên miên (lặp đi lặp lại có ngắt quãng)", "repeated frequently", { adj: "continual", adv: "continually" }, ["continual interruptions / complaints"], "continuus (liền mạch) + -al.", "continuous = liên tục không ngắt (continuous rainfall for 48 hours).", "Continual interruptions made concentration impossible."],
  ["ingenious", "/ɪnˈdʒiːniəs/", "Formal", "khéo léo, tài tình", "clever, original and inventive", { noun: "ingenuity", adj: "ingenious", adv: "ingeniously" }, ["an ingenious device / solution"], "ingenium (Latin: tài năng bẩm sinh).", "ingenuous = ngây thơ, chân thật; danh từ của ingenious là 'ingenuity' (bẫy kép!).", "Engineers devised an ingenious method of desalination."],
  ["ingenuous", "/ɪnˈdʒenjuəs/", "Literary", "ngây thơ, thật thà", "innocent and unsuspecting", { noun: "ingenuousness", adj: "ingenuous", neg: "disingenuous" }, ["disingenuous claims (giả vờ thành thật)"], "ingenuus (Latin: sinh ra tự do, chân thật).", "disingenuous = không thành thật, giả vờ ngây thơ — rất hay ra đề.", "It would be disingenuous to claim the policy had no costs."],
  ["mitigate", "/ˈmɪtɪɡeɪt/", "Academic C2", "giảm nhẹ", "to make less severe", { noun: "mitigation", verb: "mitigate", adj: "mitigating", neg: "unmitigated" }, ["mitigate the effects / risks of", "mitigating circumstances", "an unmitigated disaster"], "mitis (Latin: mềm) → làm mềm đi.", "militate against = cản trở, gây bất lợi cho (không có tân ngữ trực tiếp).", "Planting mangroves can mitigate coastal erosion."],
  ["militate", "/ˈmɪlɪteɪt/", "Formal", "gây trở ngại (cho)", "to be a powerful factor against", { verb: "militate" }, ["militate against success / change"], "miles (Latin: binh lính) → chiến đấu chống lại.", "Luôn đi với 'against'; đừng nhầm với mitigate (giảm nhẹ + tân ngữ).", "High costs militate against widespread adoption."],
  ["affect", "/əˈfekt/", "Neutral", "ảnh hưởng (động từ)", "to have an influence on", { noun: "affection (khác nghĩa)", verb: "affect", adj: "affected" }, ["adversely affect", "be deeply affected by"], "ad- + facere → tác động vào.", "effect thường là danh từ (have an effect on); 'to effect change' = tạo ra thay đổi.", "Drought adversely affected crop yields."],
  ["economic", "/ˌiːkəˈnɒmɪk/", "Academic C2", "thuộc kinh tế", "relating to the economy", { noun: "economy / economics", adj: "economic", adv: "economically" }, ["economic growth / downturn"], "oikos (nhà) + nomos (quy tắc).", "economical = tiết kiệm (an economical car).", "The region suffered a severe economic downturn."],
  ["historic", "/hɪˈstɒrɪk/", "Formal", "mang tính lịch sử, trọng đại", "famous or important in history", { adj: "historic" }, ["a historic victory / agreement"], "historia (Hy Lạp: tìm hiểu).", "historical = thuộc về lịch sử, liên quan quá khứ (historical documents).", "The treaty marked a historic turning point."],
  ["eminent", "/ˈemɪnənt/", "Formal", "lỗi lạc", "famous and respected", { noun: "eminence", adj: "eminent", adv: "eminently" }, ["an eminent scholar", "eminently suitable"], "eminere (nhô lên).", "imminent = sắp xảy ra; immanent = nội tại.", "An eminent physicist chaired the inquiry."],
  ["credible", "/ˈkredəbl/", "Formal", "đáng tin", "able to be believed", { noun: "credibility", adj: "credible", neg: "incredible" }, ["a credible threat / witness"], "credere (tin).", "credulous = cả tin, dễ bị lừa; creditable = đáng khen.", "There is no credible evidence of fraud."],
  ["prescribe", "/prɪˈskraɪb/", "Formal", "kê đơn; quy định", "to recommend a medicine; to state officially", { noun: "prescription", adj: "prescriptive" }, ["prescribe medication", "prescribed by law"], "pre- (trước) + scribere (viết).", "proscribe = cấm (forbid) — trái nghĩa gần như hoàn toàn!", "The regime proscribed all opposition parties."],
  ["complement", "/ˈkɒmplɪment/", "Neutral", "bổ sung (cho hoàn thiện)", "to complete or enhance", { adj: "complementary" }, ["complement each other perfectly"], "complere (làm đầy).", "compliment = lời khen; complimentary = miễn phí / khen ngợi.", "The wine perfectly complements the dish."],
];

// ---------------------------------------------------------------------------
// DECK 5 — ACADEMIC & NOMINALIZATION FOR WRITING
// ---------------------------------------------------------------------------
const ACADEMIC: Raw[] = [
  ["exacerbate", "/ɪɡˈzæsəbeɪt/", "Academic C2", "làm trầm trọng thêm", "to make a problem worse", { noun: "exacerbation", verb: "exacerbate" }, ["exacerbate inequality / tensions"], "ex- (hoàn toàn) + acerbus (chua chát).", "Không dùng cho tình huống tích cực; trái nghĩa: alleviate / mitigate.", "Rising rents exacerbate existing inequalities."],
  ["alleviate", "/əˈliːvieɪt/", "Academic C2", "xoa dịu, giảm bớt", "to make suffering less severe", { noun: "alleviation", verb: "alleviate" }, ["alleviate poverty / congestion"], "ad- + levis (nhẹ) → làm nhẹ đi.", "alleviate (giảm triệu chứng) ≠ eradicate (xóa sổ hoàn toàn).", "Microfinance helped alleviate rural poverty."],
  ["underpin", "/ˌʌndəˈpɪn/", "Academic C2", "làm nền tảng cho", "to support or form the basis of", { verb: "underpin", noun: "underpinning" }, ["the principles that underpin", "theoretical underpinnings"], "under + pin (chốt) → chốt đỡ phía dưới.", "Không nhầm 'undermine' (làm suy yếu).", "Trust underpins every functioning democracy."],
  ["undermine", "/ˌʌndəˈmaɪn/", "Formal", "làm suy yếu ngầm", "to weaken gradually", { verb: "undermine" }, ["undermine confidence / authority"], "under + mine (đào hầm) → đào dưới chân tường.", "Trái nghĩa underpin / bolster.", "Misinformation undermines public confidence in vaccines."],
  ["proliferation", "/prəˌlɪfəˈreɪʃn/", "Academic C2", "sự gia tăng nhanh", "rapid increase in number", { noun: "proliferation", verb: "proliferate" }, ["the proliferation of social media / nuclear weapons"], "proles (con cháu) + ferre (mang) → sinh sôi.", "Danh từ hóa: 'Social media has proliferated' → 'The proliferation of social media...'", "The proliferation of smartphones has reshaped childhood."],
  ["a growing body of evidence", "/ˈbɒdi əv ˈevɪdəns/", "Academic C2", "ngày càng nhiều bằng chứng", "an increasing amount of research", {}, ["a growing body of evidence suggests that"], "body = khối, tập hợp.", "Không dùng 'a big amount of evidences' (evidence không đếm được).", "A growing body of evidence suggests that sleep affects memory."],
  ["arguably", "/ˈɑːɡjuəbli/", "Academic C2", "có thể cho rằng", "it may be argued that", { adj: "arguable", adv: "arguably" }, ["arguably the most influential"], "Hedging device: giảm độ khẳng định tuyệt đối.", "Khác 'undoubtedly' (khẳng định mạnh).", "This is arguably the most pressing issue of our time."],
  ["tend to", "/tend tə/", "Academic C2", "có xu hướng", "to be likely to", { noun: "tendency" }, ["tend to + V", "there is a tendency for + N + to V"], "Hedging: tránh khái quát tuyệt đối.", "Danh từ hóa: 'Young people tend to...' → 'There is a marked tendency among young people to...'", "Urban residents tend to have smaller families."],
  ["give rise to", "/ɡɪv raɪz tuː/", "Academic C2", "dẫn tới, làm nảy sinh", "to cause", {}, ["give rise to concerns / speculation"], "rise (sự nổi lên) → làm cho trồi lên.", "Theo sau là N/V-ing (to là giới từ).", "Automation has given rise to fears of mass unemployment."],
  ["detrimental", "/ˌdetrɪˈmentl/", "Formal", "có hại", "tending to cause harm", { noun: "detriment", adj: "detrimental", adv: "detrimentally" }, ["detrimental to health", "to the detriment of"], "deterere (mài mòn).", "Giới từ: detrimental TO.", "Excessive screen time is detrimental to adolescent wellbeing."],
  ["far-reaching", "/ˌfɑː ˈriːtʃɪŋ/", "Formal", "sâu rộng", "having wide-ranging effects", {}, ["far-reaching consequences / implications"], "Ghép far + reaching.", "Đồng nghĩa: sweeping, profound; không dùng 'far-reached'.", "The ruling will have far-reaching implications."],
  ["pose a threat to", "/pəʊz ə θret tuː/", "Academic C2", "gây mối đe dọa cho", "to present a danger to", {}, ["pose a serious / existential threat to"], "pose (Pháp: đặt ra).", "Động từ chuẩn 'pose', không 'make a threat to'.", "Invasive species pose a serious threat to biodiversity."],
  ["implementation", "/ˌɪmplɪmenˈteɪʃn/", "Academic C2", "sự thực thi", "the process of putting a plan into effect", { noun: "implementation", verb: "implement" }, ["rigorous implementation of policy"], "implere (làm đầy, hoàn thành).", "Danh từ hóa: 'If the government implements...' → 'Effective implementation of...'", "Rigorous implementation is as vital as sound policy design."],
  ["a paradigm shift", "/ə ˈpærədaɪm ʃɪft/", "Academic C2", "sự thay đổi mô hình tư duy", "a fundamental change in approach", {}, ["represent / herald a paradigm shift"], "paradeigma (Hy Lạp: mẫu hình) — Thomas Kuhn.", "Đừng dùng cho thay đổi nhỏ.", "Renewables herald a paradigm shift in energy policy."],
  ["it is widely acknowledged that", "/ɪt ɪz ˈwaɪdli əkˈnɒlɪdʒd ðæt/", "Academic C2", "người ta thừa nhận rộng rãi rằng", "many people accept that", {}, ["it is widely acknowledged / held / believed that"], "Câu bị động khách quan hóa.", "Tránh 'Everybody knows that' (khẩu ngữ).", "It is widely acknowledged that education drives social mobility."],
  ["contend", "/kənˈtend/", "Academic C2", "cho rằng, khẳng định", "to assert as a position in an argument", { noun: "contention", adj: "contentious" }, ["critics contend that", "a contentious issue", "a bone of contention"], "con- + tendere (vươn tới) → vươn lý lẽ.", "contend with = vật lộn với (khó khăn).", "Opponents contend that the tax is regressive."],
  ["curtail", "/kɜːˈteɪl/", "Formal", "cắt giảm, hạn chế", "to reduce or restrict", { noun: "curtailment" }, ["curtail spending / freedoms"], "Pháp cổ courtault (con ngựa cụt đuôi).", "Thường dùng cho quyền lợi/chi tiêu, trang trọng hơn 'cut'.", "Emergency laws curtailed civil liberties."],
  ["bolster", "/ˈbəʊlstə(r)/", "Formal", "củng cố", "to support or strengthen", { verb: "bolster" }, ["bolster confidence / the economy"], "bolster = gối ôm dài → đỡ lên.", "Trái nghĩa undermine.", "The stimulus package bolstered consumer confidence."],
  ["inextricably linked", "/ˌɪnɪkˈstrɪkəbli lɪŋkt/", "Academic C2", "gắn bó mật thiết, không thể tách rời", "impossible to separate", { adj: "inextricable", adv: "inextricably" }, ["inextricably linked / bound up with"], "in- (không) + ex- (ra) + tricae (rối) → không gỡ ra được.", "Collocation cố định 'inextricably linked', không 'inseparably linked' (ít tự nhiên hơn).", "Poverty and poor health are inextricably linked."],
  ["foster", "/ˈfɒstə(r)/", "Formal", "thúc đẩy, nuôi dưỡng", "to encourage development", { verb: "foster" }, ["foster innovation / a sense of belonging"], "Old English fōstrian (nuôi dưỡng).", "foster (khuyến khích phát triển) — khác 'fester' (mưng mủ, âm ỉ xấu đi).", "Schools should foster critical thinking."],
];

export const PREBUILT_ENTRIES: LexicalEntry[] = [
  ...build("core", CORE),
  ...build("wordform", WORDFORM),
  ...build("confusable", CONFUSABLE),
  ...build("academic", ACADEMIC),
];

export const DECK_DEFINITIONS: Array<{ id: DeckId; label: string; short: string; description: string }> = [
  { id: "mistakes", label: "Sổ Từ Sai", short: "Từ sai", description: "Tự động lưu khi làm sai trong Đề thi và Game 3D" },
  { id: "core", label: "Destination C1 & C2", short: "C1/C2 Core", description: "Cụm động từ, thành ngữ, cụm giới từ tần suất cao" },
  { id: "wordform", label: "Họ Từ Word Formation", short: "Họ từ", description: "Gốc từ phái sinh thường gặp trong HSGQG, DHBB, Olympic 30/4" },
  { id: "confusable", label: "Cặp Từ Dễ Nhầm", short: "Dễ nhầm", description: "Các cặp bẫy kinh điển C1/C2" },
  { id: "academic", label: "Học Thuật Cho Writing", short: "Học thuật", description: "Động từ trang trọng, hedging, danh từ hóa" },
  { id: "custom", label: "Bộ Từ Của Tôi", short: "Của tôi", description: "Từ bạn tự thêm hoặc nhập hàng loạt" },
];

// ---------------------------------------------------------------------------
// MODE 2 — WORD FORMATION LAB
// ---------------------------------------------------------------------------
export interface WordFormationItem {
  id: string;
  sentence: string; // contains _____
  root: string;
  answers: string[];
  slot: "Noun" | "Adj" | "Adv" | "Verb";
  polarity: "POSITIVE" | "NEGATIVE";
  explanation: string;
}

export const WORD_FORMATION_LAB: WordFormationItem[] = [
  { id: "wf1", sentence: "The pandemic caused an _____ disruption to global supply chains.", root: "PRECEDE", answers: ["unprecedented"], slot: "Adj", polarity: "NEGATIVE", explanation: "Mạo từ 'an' + _____ + danh từ 'disruption' → cần Tính từ; nghĩa 'chưa từng có' → un- + precedent + -ed." },
  { id: "wf2", sentence: "After years of bitter feuding, the brothers' differences proved _____.", root: "RECONCILE", answers: ["irreconcilable"], slot: "Adj", polarity: "NEGATIVE", explanation: "Sau 'proved' cần Tính từ; 'bitter feuding' gợi nghĩa phủ định → ir- (trước r) + reconcil + -able." },
  { id: "wf3", sentence: "Local manufacturers have become increasingly _____ in the face of cheap imports.", root: "COMPETE", answers: ["uncompetitive"], slot: "Adj", polarity: "NEGATIVE", explanation: "'become increasingly' + Tính từ; 'in the face of cheap imports' → mất sức cạnh tranh → un- + competitive." },
  { id: "wf4", sentence: "The witness's account was so muddled as to be virtually _____.", root: "COMPREHEND", answers: ["incomprehensible"], slot: "Adj", polarity: "NEGATIVE", explanation: "'muddled' (rối rắm) → không thể hiểu → in- + comprehens + -ible." },
  { id: "wf5", sentence: "Current levels of public borrowing are simply _____ in the long term.", root: "SUSTAIN", answers: ["unsustainable"], slot: "Adj", polarity: "NEGATIVE", explanation: "'are simply' + Tính từ; ngữ cảnh cảnh báo → un- + sustain + -able." },
  { id: "wf6", sentence: "Gold and silver medals went to Kenya and Ethiopia _____.", root: "RESPECT", answers: ["respectively"], slot: "Adv", polarity: "POSITIVE", explanation: "Cuối câu bổ nghĩa cho cả mệnh đề, nghĩa 'theo thứ tự tương ứng' → Trạng từ respectively." },
  { id: "wf7", sentence: "She is _____ the most gifted mathematician of her generation.", root: "DISPUTE", answers: ["indisputably"], slot: "Adv", polarity: "NEGATIVE", explanation: "Trước cụm 'the most gifted' cần Trạng từ nhấn mạnh → in- + disput + -ably." },
  { id: "wf8", sentence: "Many mountain villages remain _____ by road during the rainy season.", root: "ACCESS", answers: ["inaccessible"], slot: "Adj", polarity: "NEGATIVE", explanation: "'remain' + Tính từ; mùa mưa cản trở → in- + access + -ible." },
  { id: "wf9", sentence: "_____, the talks collapsed amid mutual recriminations.", root: "PREDICT", answers: ["predictably"], slot: "Adv", polarity: "POSITIVE", explanation: "Trạng từ bình luận đầu câu (sentence adverb) + dấu phẩy → predictably." },
  { id: "wf10", sentence: "The bill was passed, rather _____, without any parliamentary debate.", root: "CONTROVERSY", answers: ["controversially"], slot: "Adv", polarity: "POSITIVE", explanation: "'rather' + Trạng từ bổ nghĩa cho cả hành động 'was passed' → controversially." },
  { id: "wf11", sentence: "The elderly are particularly at risk owing to their physical _____.", root: "VULNERABLE", answers: ["vulnerability"], slot: "Noun", polarity: "POSITIVE", explanation: "Sau tính từ sở hữu + tính từ 'their physical' cần Danh từ → vulnerability." },
  { id: "wf12", sentence: "Chronic bureaucratic _____ has delayed the railway project by a decade.", root: "EFFICIENT", answers: ["inefficiency"], slot: "Noun", polarity: "NEGATIVE", explanation: "Tính từ 'bureaucratic' + _____ + động từ 'has delayed' → Danh từ chủ ngữ, nghĩa tiêu cực → inefficiency." },
  { id: "wf13", sentence: "The opposition questioned the _____ of the snap election.", root: "LEGITIMATE", answers: ["legitimacy"], slot: "Noun", polarity: "POSITIVE", explanation: "'the _____ of' → Danh từ: legitimacy (tính chính danh)." },
  { id: "wf14", sentence: "Slashing the education budget now would be fiscally _____.", root: "RESPONSIBLE", answers: ["irresponsible"], slot: "Adj", polarity: "NEGATIVE", explanation: "Trạng từ 'fiscally' bổ nghĩa cho Tính từ; 'slashing' gợi phê phán → ir- + responsible." },
  { id: "wf15", sentence: "The view from the summit was _____ beautiful.", root: "DESCRIBE", answers: ["indescribably"], slot: "Adv", polarity: "NEGATIVE", explanation: "Trạng từ bổ nghĩa tính từ 'beautiful' → in- + describ + -ably." },
  { id: "wf16", sentence: "Our domestic squabbles pale into _____ beside the refugee crisis.", root: "SIGNIFY", answers: ["insignificance"], slot: "Noun", polarity: "NEGATIVE", explanation: "Thành ngữ cố định 'pale into insignificance' → Danh từ phủ định." },
  { id: "wf17", sentence: "The charges were dropped due to _____ evidence.", root: "SUFFICE", answers: ["insufficient"], slot: "Adj", polarity: "NEGATIVE", explanation: "_____ + danh từ 'evidence' → Tính từ; lý do hủy án → insufficient." },
  { id: "wf18", sentence: "Bursaries are reserved for students from socially _____ backgrounds.", root: "ADVANTAGE", answers: ["disadvantaged"], slot: "Adj", polarity: "NEGATIVE", explanation: "Tính từ chỉ người/hoàn cảnh bị thiệt thòi → disadvantaged (không phải disadvantageous)." },
  { id: "wf19", sentence: "Owing to _____ circumstances, the ceremony has been postponed.", root: "FORESEE", answers: ["unforeseen"], slot: "Adj", polarity: "NEGATIVE", explanation: "Collocation cố định 'unforeseen circumstances'." },
  { id: "wf20", sentence: "The committee seems utterly _____ of reaching a consensus.", root: "CAPABLE", answers: ["incapable"], slot: "Adj", polarity: "NEGATIVE", explanation: "'utterly' + Tính từ + 'of' → incapable of + V-ing." },
  { id: "wf21", sentence: "The new policy has been _____ welcomed by small businesses.", root: "ENTHUSIASM", answers: ["enthusiastically"], slot: "Adv", polarity: "POSITIVE", explanation: "Giữa 'has been' và V3 'welcomed' cần Trạng từ cách thức → enthusiastically." },
  { id: "wf22", sentence: "Her _____ of the facts led to a costly misjudgement.", root: "INTERPRET", answers: ["misinterpretation"], slot: "Noun", polarity: "NEGATIVE", explanation: "'Her _____ of' → Danh từ; hậu quả 'misjudgement' → tiền tố mis- (sai)." },
];

// ---------------------------------------------------------------------------
// MODE 3 — COLLOCATION & PREPOSITION SNAP
// ---------------------------------------------------------------------------
export interface PrepSnapItem {
  id: string;
  before: string;
  after: string;
  answer: string;
  options: [string, string, string, string];
  rule: string;
}

export const PREP_SNAP_ITEMS: PrepSnapItem[] = [
  { id: "ps1", before: "The witness remained impervious", after: "intimidation.", answer: "to", options: ["to", "with", "from", "at"], rule: "impervious TO + N" },
  { id: "ps2", before: "The storm wreaked havoc", after: "the coastal infrastructure.", answer: "on", options: ["in", "on", "to", "over"], rule: "wreak havoc ON + N" },
  { id: "ps3", before: "His testimony is at odds", after: "the forensic evidence.", answer: "with", options: ["to", "against", "with", "from"], rule: "at odds WITH" },
  { id: "ps4", before: "The species is", after: "the verge of extinction.", answer: "on", options: ["in", "at", "on", "by"], rule: "ON the verge of" },
  { id: "ps5", before: "She was promoted by virtue", after: "her outstanding results.", answer: "of", options: ["for", "of", "from", "by"], rule: "by virtue OF" },
  { id: "ps6", before: "The reforms were implemented in the wake", after: "the scandal.", answer: "of", options: ["after", "from", "of", "on"], rule: "in the wake OF" },
  { id: "ps7", before: "Smoking is detrimental", after: "your health.", answer: "to", options: ["for", "to", "with", "on"], rule: "detrimental TO" },
  { id: "ps8", before: "High costs militate", after: "widespread adoption.", answer: "against", options: ["against", "towards", "over", "with"], rule: "militate AGAINST" },
  { id: "ps9", before: "The film failed to live up", after: "the hype.", answer: "to", options: ["for", "with", "to", "into"], rule: "live up TO" },
  { id: "ps10", before: "Much of the violence stems", after: "economic despair.", answer: "from", options: ["of", "out", "from", "off"], rule: "stem FROM" },
  { id: "ps11", before: "The government has yet to get to grips", after: "inflation.", answer: "with", options: ["on", "with", "over", "about"], rule: "get to grips WITH" },
  { id: "ps12", before: "Poverty is inextricably bound up", after: "poor health outcomes.", answer: "with", options: ["to", "with", "in", "by"], rule: "bound up WITH" },
  { id: "ps13", before: "Officials turned a blind eye", after: "the abuses.", answer: "to", options: ["on", "at", "over", "to"], rule: "turn a blind eye TO" },
  { id: "ps14", before: "The company was found to be in breach", after: "its contract.", answer: "of", options: ["with", "of", "to", "against"], rule: "in breach OF" },
  { id: "ps15", before: "Attendance is mandatory, regardless", after: "seniority.", answer: "of", options: ["to", "for", "of", "about"], rule: "regardless OF" },
  { id: "ps16", before: "She has a flair", after: "languages.", answer: "for", options: ["in", "of", "for", "with"], rule: "a flair FOR" },
  { id: "ps17", before: "The minister came", after: "fire for his remarks.", answer: "under", options: ["into", "under", "in", "on"], rule: "come UNDER fire" },
  { id: "ps18", before: "These measures are", after: "odds with our values.", answer: "at", options: ["in", "on", "at", "by"], rule: "AT odds with" },
  { id: "ps19", before: "The decision was made", after: "the expense of local residents.", answer: "at", options: ["on", "by", "at", "for"], rule: "AT the expense of" },
  { id: "ps20", before: "Staff were given extra leave in lieu", after: "overtime pay.", answer: "of", options: ["for", "of", "to", "with"], rule: "in lieu OF" },
  { id: "ps21", before: "The scheme is", after: "the pipeline and will launch next year.", answer: "in", options: ["on", "in", "at", "under"], rule: "IN the pipeline" },
  { id: "ps22", before: "He was acquitted", after: "all charges.", answer: "of", options: ["from", "of", "for", "off"], rule: "acquit sb OF" },
  { id: "ps23", before: "The new law has been", after: "force since January.", answer: "in", options: ["at", "on", "in", "under"], rule: "IN force" },
  { id: "ps24", before: "She is adept", after: "defusing tense negotiations.", answer: "at", options: ["in", "on", "with", "at"], rule: "adept AT + V-ing" },
];

// ---------------------------------------------------------------------------
// MODE 5 — ROOT & AFFIX DECODER (40 roots + prefixes + suffixes)
// ---------------------------------------------------------------------------
export interface RootEntry {
  root: string;
  origin: "Latin" | "Greek" | "Prefix" | "Suffix";
  meaning: string;
  words: string[];
}

export const ROOTS_40: RootEntry[] = [
  { root: "bene-", origin: "Latin", meaning: "tốt, lành", words: ["benevolent", "benefactor", "beneficiary", "benign", "benediction"] },
  { root: "mal-", origin: "Prefix", meaning: "xấu, tồi", words: ["malevolent", "malfunction", "malnutrition", "malicious", "malpractice", "maladroit"] },
  { root: "chron", origin: "Greek", meaning: "thời gian", words: ["chronic", "chronology", "anachronism", "synchronize", "chronicle"] },
  { root: "dict", origin: "Latin", meaning: "nói", words: ["contradict", "predict", "verdict", "dictate", "indict", "jurisdiction"] },
  { root: "duc / duct", origin: "Latin", meaning: "dẫn dắt", words: ["deduce", "induce", "conducive", "abduct", "induction", "viaduct"] },
  { root: "fid", origin: "Latin", meaning: "niềm tin", words: ["confide", "fidelity", "infidel", "diffident", "bona fide"] },
  { root: "graph / gram", origin: "Greek", meaning: "viết", words: ["autograph", "epigram", "graphic", "calligraphy", "demographic"] },
  { root: "loqu / locut", origin: "Latin", meaning: "nói", words: ["eloquent", "loquacious", "soliloquy", "circumlocution", "colloquial"] },
  { root: "luc / lum", origin: "Latin", meaning: "ánh sáng", words: ["lucid", "elucidate", "translucent", "luminous", "illuminate"] },
  { root: "mit / miss", origin: "Latin", meaning: "gửi", words: ["transmit", "intermittent", "remission", "emissary", "manumit"] },
  { root: "path", origin: "Greek", meaning: "cảm xúc, bệnh", words: ["apathy", "empathy", "pathology", "antipathy", "sociopath"] },
  { root: "port", origin: "Latin", meaning: "mang", words: ["portable", "deport", "importune", "comport", "rapport"] },
  { root: "scrib / script", origin: "Latin", meaning: "viết", words: ["proscribe", "prescribe", "circumscribe", "conscript", "nondescript"] },
  { root: "spec / spic", origin: "Latin", meaning: "nhìn", words: ["conspicuous", "perspicacious", "introspection", "specious", "auspicious"] },
  { root: "ten / tain", origin: "Latin", meaning: "giữ", words: ["tenacious", "tenable", "untenable", "sustain", "abstain", "tenure"] },
  { root: "vert / vers", origin: "Latin", meaning: "xoay", words: ["controversy", "avert", "subvert", "versatile", "introvert", "adversity"] },
  { root: "vid / vis", origin: "Latin", meaning: "thấy", words: ["evident", "provident", "visionary", "improvise", "envisage"] },
  { root: "voc / vok", origin: "Latin", meaning: "gọi", words: ["evoke", "provoke", "revoke", "equivocal", "vociferous", "irrevocable"] },
  { root: "vol", origin: "Latin", meaning: "ý chí", words: ["volition", "benevolent", "malevolent", "voluntary"] },
  { root: "cred", origin: "Latin", meaning: "tin", words: ["credible", "credulous", "incredulous", "credence", "accredit"] },
  { root: "ject", origin: "Latin", meaning: "ném", words: ["eject", "conjecture", "dejected", "trajectory", "interject"] },
  { root: "plac", origin: "Latin", meaning: "làm hài lòng", words: ["placate", "complacent", "implacable", "placid"] },
  { root: "pug / pugn", origin: "Latin", meaning: "đánh nhau", words: ["pugnacious", "repugnant", "impugn", "pugilist"] },
  { root: "sequ / secu", origin: "Latin", meaning: "theo sau", words: ["consequence", "obsequious", "sequel", "non sequitur", "inconsequential"] },
  { root: "anthrop", origin: "Greek", meaning: "con người", words: ["philanthropy", "misanthrope", "anthropology", "anthropomorphic"] },
  { root: "morph", origin: "Greek", meaning: "hình dạng", words: ["metamorphosis", "amorphous", "polymorphic", "morphology"] },
  { root: "pan", origin: "Greek", meaning: "tất cả", words: ["panacea", "pandemic", "panorama", "pantheon", "pandemonium"] },
  { root: "phil", origin: "Greek", meaning: "yêu", words: ["philanthropist", "bibliophile", "philosophy", "Anglophile"] },
  { root: "un-", origin: "Prefix", meaning: "không (gốc Anh)", words: ["unprecedented", "unwarranted", "unscathed", "unassailable", "unforeseen"] },
  { root: "in- / im- / il- / ir-", origin: "Prefix", meaning: "không (đồng hóa âm: im- trước b/m/p, il- trước l, ir- trước r)", words: ["indelible", "impeccable", "illicit", "irrevocable", "inexorable", "impartial"] },
  { root: "dis-", origin: "Prefix", meaning: "không, tách rời", words: ["disingenuous", "disparate", "discredit", "dissent", "disinterested"] },
  { root: "mis-", origin: "Prefix", meaning: "sai", words: ["misconception", "misnomer", "misgiving", "misappropriate", "misinterpret"] },
  { root: "pseudo-", origin: "Prefix", meaning: "giả", words: ["pseudonym", "pseudoscience", "pseudo-intellectual"] },
  { root: "counter-", origin: "Prefix", meaning: "chống lại, ngược", words: ["counterproductive", "counterintuitive", "counterfeit", "counterbalance", "counterpart"] },
  { root: "circum-", origin: "Prefix", meaning: "vòng quanh", words: ["circumvent", "circumspect", "circumlocution", "circumscribe"] },
  { root: "-ous / -ious", origin: "Suffix", meaning: "đầy, có tính chất (tạo Adj)", words: ["tenacious", "contentious", "ostentatious", "fastidious", "gregarious"] },
  { root: "-ity / -ty", origin: "Suffix", meaning: "tính chất (tạo Noun)", words: ["ingenuity", "brevity", "veracity", "anonymity", "legitimacy"] },
  { root: "-ize / -ise", origin: "Suffix", meaning: "làm cho (tạo Verb)", words: ["jeopardize", "marginalize", "legitimize", "galvanize", "scrutinize"] },
  { root: "-able / -ible", origin: "Suffix", meaning: "có thể (tạo Adj)", words: ["indispensable", "tenable", "feasible", "irreconcilable", "inexplicable"] },
  { root: "-ment / -tion", origin: "Suffix", meaning: "hành động, kết quả (tạo Noun)", words: ["curtailment", "proliferation", "exacerbation", "implementation", "alleviation"] },
];
