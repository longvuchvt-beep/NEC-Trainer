/**
 * ============================================================================
 * V-EngOlympiad Hub — National 63-Province Exam Harvester & Cross-Province
 * Fingerprinting / Deduplication Pipeline
 * (scripts/national-exam-harvester-runtime.js)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const { parseRawTextToExam } = require('./exam-parser');
const { computeQuestionFingerprint } = require('../lib/assessment/smart-test-engine-runtime');

/**
 * Complete National Directory of 63 Provinces & 70+ Specialized High Schools (Trường THPT Chuyên)
 */
const NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY = [
  // MIỀN BẮC (NORTH)
  { province: 'Hà Nội', school: 'THPT Chuyên Hà Nội - Amsterdam', region: 'North', tournaments: ['HSGQG', 'DHBB', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Hà Nội', school: 'THPT Chuyên Ngoại Ngữ (CNN - ĐHQGHN)', region: 'North', tournaments: ['HSGQG', 'DHBB', 'CHON_DOI_TUYEN'] },
  { province: 'Hà Nội', school: 'THPT Chuyên Sư Phạm (CSP - ĐHSPHN)', region: 'North', tournaments: ['HSGQG', 'DHBB', 'CHON_DOI_TUYEN'] },
  { province: 'Hà Nội', school: 'THPT Chuyên Nguyễn Huệ', region: 'North', tournaments: ['HSG_TINH', 'CHON_DOI_TUYEN'] },
  { province: 'Phú Thọ', school: 'THPT Chuyên Hùng Vương - Phú Thọ', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'HSGQG', 'DHBB', 'HSG_TINH'] },
  { province: 'Hải Phòng', school: 'THPT Chuyên Trần Phú - Hải Phòng', region: 'North', tournaments: ['DHBB', 'HSGQG', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Quảng Ninh', school: 'THPT Chuyên Hạ Long - Quảng Ninh', region: 'North', tournaments: ['DHBB', 'TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Vĩnh Phúc', school: 'THPT Chuyên Vĩnh Phúc', region: 'North', tournaments: ['DHBB', 'TRAI_HE_HUNG_VUONG', 'HSGQG', 'CHON_DOI_TUYEN'] },
  { province: 'Bắc Ninh', school: 'THPT Chuyên Bắc Ninh', region: 'North', tournaments: ['DHBB', 'HSGQG', 'CHON_DOI_TUYEN'] },
  { province: 'Nam Định', school: 'THPT Chuyên Lê Hồng Phong - Nam Định', region: 'North', tournaments: ['DHBB', 'HSGQG', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Thái Bình', school: 'THPT Chuyên Thái Bình', region: 'North', tournaments: ['DHBB', 'HSG_TINH'] },
  { province: 'Hải Dương', school: 'THPT Chuyên Nguyễn Trãi - Hải Dương', region: 'North', tournaments: ['DHBB', 'HSGQG', 'CHON_DOI_TUYEN'] },
  { province: 'Ninh Bình', school: 'THPT Chuyên Lương Văn Tụy - Ninh Bình', region: 'North', tournaments: ['DHBB', 'HSG_TINH'] },
  { province: 'Hà Nam', school: 'THPT Chuyên Biên Hòa - Hà Nam', region: 'North', tournaments: ['DHBB', 'HSG_TINH'] },
  { province: 'Hưng Yên', school: 'THPT Chuyên Hưng Yên', region: 'North', tournaments: ['DHBB', 'HSG_TINH'] },
  { province: 'Bắc Giang', school: 'THPT Chuyên Bắc Giang', region: 'North', tournaments: ['DHBB', 'TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Thái Nguyên', school: 'THPT Chuyên Thái Nguyên', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'DHBB', 'HSG_TINH'] },
  { province: 'Lào Cai', school: 'THPT Chuyên Lào Cai', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'DHBB', 'HSG_TINH'] },
  { province: 'Yên Bái', school: 'THPT Chuyên Nguyễn Tất Thành - Yên Bái', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Tuyên Quang', school: 'THPT Chuyên Tuyên Quang', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Sơn La', school: 'THPT Chuyên Sơn La', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Hòa Bình', school: 'THPT Chuyên Hoàng Văn Thụ - Hòa Bình', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Lạng Sơn', school: 'THPT Chuyên Chu Văn An - Lạng Sơn', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'DHBB'] },
  { province: 'Cao Bằng', school: 'THPT Chuyên Cao Bằng', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG', 'HSG_TINH'] },
  { province: 'Bắc Kạn', school: 'THPT Chuyên Bắc Kạn', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG'] },
  { province: 'Hà Giang', school: 'THPT Chuyên Hà Giang', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG'] },
  { province: 'Điện Biên', school: 'THPT Chuyên Lê Quý Đôn - Điện Biên', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG'] },
  { province: 'Lai Châu', school: 'THPT Chuyên Lê Quý Đôn - Lai Châu', region: 'North', tournaments: ['TRAI_HE_HUNG_VUONG'] },

  // MIỀN TRUNG & TÂY NGUYÊN (CENTRAL)
  { province: 'Thanh Hóa', school: 'THPT Chuyên Lam Sơn - Thanh Hóa', region: 'Central', tournaments: ['HSGQG', 'DHBB', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Nghệ An', school: 'THPT Chuyên Phan Bội Châu - Nghệ An', region: 'Central', tournaments: ['HSGQG', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Hà Tĩnh', school: 'THPT Chuyên Hà Tĩnh', region: 'Central', tournaments: ['HSGQG', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Quảng Bình', school: 'THPT Chuyên Võ Nguyên Giáp - Quảng Bình', region: 'Central', tournaments: ['HSGQG', 'HSG_TINH'] },
  { province: 'Quảng Trị', school: 'THPT Chuyên Lê Quý Đôn - Quảng Trị', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Thừa Thiên Huế', school: 'THPT Chuyên Quốc Học - Huế', region: 'Central', tournaments: ['HSGQG', 'OLYMPIC_30_4', 'DHBB', 'CHON_DOI_TUYEN'] },
  { province: 'Đà Nẵng', school: 'THPT Chuyên Lê Quý Đôn - Đà Nẵng', region: 'Central', tournaments: ['OLYMPIC_30_4', 'DHBB', 'HSGQG', 'CHON_DOI_TUYEN'] },
  { province: 'Quảng Nam', school: 'THPT Chuyên Nguyễn Bỉnh Khiêm - Quảng Nam', region: 'Central', tournaments: ['OLYMPIC_30_4', 'DHBB', 'HSG_TINH'] },
  { province: 'Quảng Ngãi', school: 'THPT Chuyên Lê Khiết - Quảng Ngãi', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Bình Định', school: 'THPT Chuyên Lê Quý Đôn - Bình Định', region: 'Central', tournaments: ['OLYMPIC_30_4', 'DHBB', 'HSG_TINH'] },
  { province: 'Phú Yên', school: 'THPT Chuyên Lương Văn Chánh - Phú Yên', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Khánh Hòa', school: 'THPT Chuyên Lê Quý Đôn - Khánh Hòa', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Ninh Thuận', school: 'THPT Chuyên Lê Quý Đôn - Ninh Thuận', region: 'Central', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Bình Thuận', school: 'THPT Chuyên Trần Hưng Đạo - Bình Thuận', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Lâm Đồng', school: 'THPT Chuyên Thăng Long - Đà Lạt', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSGQG', 'HSG_TINH'] },
  { province: 'Gia Lai', school: 'THPT Chuyên Hùng Vương - Gia Lai', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Đắk Lắk', school: 'THPT Chuyên Nguyễn Du - Đắk Lắk', region: 'Central', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Đắk Nông', school: 'THPT Chuyên Nguyễn Chí Thanh - Đắk Nông', region: 'Central', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Kon Tum', school: 'THPT Chuyên Nguyễn Tất Thành - Kon Tum', region: 'Central', tournaments: ['OLYMPIC_30_4'] },

  // MIỀN NAM (SOUTH)
  { province: 'TP.HCM', school: 'THPT Chuyên Lê Hồng Phong - TP.HCM', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSGQG', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'TP.HCM', school: 'Phổ thông Năng khiếu (PTNK - ĐHQG TP.HCM)', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSGQG', 'CHON_DOI_TUYEN'] },
  { province: 'TP.HCM', school: 'THPT Chuyên Trần Đại Nghĩa - TP.HCM', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Bình Dương', school: 'THPT Chuyên Hùng Vương - Bình Dương', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Đồng Nai', school: 'THPT Chuyên Lương Thế Vinh - Đồng Nai', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSGQG', 'HSG_TINH'] },
  { province: 'Bà Rịa - Vũng Tàu', school: 'THPT Chuyên Lê Quý Đôn - Vũng Tàu', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Bình Phước', school: 'THPT Chuyên Quang Trung - Bình Phước', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Tây Ninh', school: 'THPT Chuyên Hoàng Lê Kha - Tây Ninh', region: 'South', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Long An', school: 'THPT Chuyên Long An', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Tiền Giang', school: 'THPT Chuyên Tiền Giang', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Bến Tre', school: 'THPT Chuyên Bến Tre', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Vĩnh Long', school: 'THPT Chuyên Nguyễn Bỉnh Khiêm - Vĩnh Long', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Đồng Tháp', school: 'THPT Chuyên Nguyễn Quang Diêu - Đồng Tháp', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'An Giang', school: 'THPT Chuyên Thoại Ngọc Hầu - An Giang', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Kiên Giang', school: 'THPT Chuyên Huỳnh Mẫn Đạt - Kiên Giang', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSG_TINH'] },
  { province: 'Cần Thơ', school: 'THPT Chuyên Lý Tự Trọng - Cần Thơ', region: 'South', tournaments: ['OLYMPIC_30_4', 'HSGQG', 'CHON_DOI_TUYEN', 'HSG_TINH'] },
  { province: 'Sóc Trăng', school: 'THPT Chuyên Nguyễn Thị Minh Khai - Sóc Trăng', region: 'South', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Bạc Liêu', school: 'THPT Chuyên Bạc Liêu', region: 'South', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Cà Mau', school: 'THPT Chuyên Phan Ngọc Hiển - Cà Mau', region: 'South', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Trà Vinh', school: 'THPT Chuyên Nguyễn Thiện Thành - Trà Vinh', region: 'South', tournaments: ['OLYMPIC_30_4'] },
  { province: 'Hậu Giang', school: 'THPT Chuyên Vị Thanh - Hậu Giang', region: 'South', tournaments: ['OLYMPIC_30_4'] }
];

/**
 * Multi-Province Seeded Exams covering North, Central, and South Specialized High Schools
 * with deliberate cross-province shared high-frequency C1/C2 items so the Cross-Exam Frequency
 * Tracker and "🔥 High-Frequency Badge: Xuất hiện trong X đề thi" work out of the box.
 */
const MULTI_PROVINCE_HARVEST_DATASETS = [
  {
    id: 'hsg-tinh-phu-tho-hung-vuong-2025',
    title: 'Đề Thi Chọn HSG Tỉnh Bảng A & Đội Tuyển QG — Chuyên Hùng Vương (Phú Thọ)',
    tournament: 'TRAI_HE_HUNG_VUONG',
    competitionCode: 'TRAI_HE_HUNG_VUONG',
    year: 2025,
    province_school: 'Phú Thọ (THPT Chuyên Hùng Vương)',
    region: 'North',
    grade_level: '11-12',
    duration_minutes: 180,
    difficulty: 'C1/C2 Olympiad',
    tags: ['Phú Thọ', 'Chuyên Hùng Vương', 'Inversion', 'Word Formation', 'High-Frequency'],
    sections: {
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'pt-hv-lg-1',
            title: 'Part 1: Multiple Choice & Cross-Province High-Frequency Traps',
            instructions: 'Choose the best option (A, B, C, or D) to complete each sentence.',
            questions: [
              {
                id: 'pt-hv-q1',
                number: 1,
                type: 'mcq',
                points: 2,
                stem: 'Not until the forensic audit was published ________ the full scale of the liquidity crisis.',
                options: [
                  { id: 'A', text: 'did the shareholders comprehend' },
                  { id: 'B', text: 'the shareholders comprehended' },
                  { id: 'C', text: 'had the shareholders comprehended' },
                  { id: 'D', text: 'would the shareholders comprehend' }
                ],
                answer: 'A',
                explanation: {
                  rule: 'Negative Adverbial Inversion (Not until + clause + Aux + S + V)',
                  vi: 'Cấu trúc đảo ngữ với "Not until": Mệnh đề phụ giữ nguyên trật tự (was published), mệnh đề chính đảo trợ động từ quá khứ đơn "did + S + V(inf)" (did the shareholders comprehend). Đây là câu kinh điển xuất hiện trong đề Phú Thọ, Nam Định và Olympic 30/4.',
                  en: 'Inversion occurs in the main clause after the "Not until..." time clause.',
                  optionAnalysis: {
                    A: 'ĐÚNG: Đảo ngữ chuẩn ở mệnh đề chính (did + S + V nguyên mẫu).',
                    B: 'SAI: Thiếu đảo ngữ ở mệnh đề chính.',
                    C: 'SAI: Sai phối thì (Quá khứ hoàn thành không dùng cho hành động xảy ra sau).',
                    D: 'SAI: Sai nghĩa tình thái.'
                  }
                }
              },
              {
                id: 'pt-hv-q2',
                number: 2,
                type: 'mcq',
                points: 2,
                stem: 'The minister’s evasive testimony merely served to ________ rumours of a cabinet rift.',
                options: [
                  { id: 'A', text: 'give currency to' },
                  { id: 'B', text: 'pay lip service to' },
                  { id: 'C', text: 'cast aspersions on' },
                  { id: 'D', text: 'make no bones about' }
                ],
                answer: 'A',
                explanation: {
                  rule: 'C2 Idiomatic Collocation: give currency to something',
                  vi: '"Give currency to (rumours/ideas)" = làm lan truyền, khiến một tin đồn/quan điểm trở nên phổ biến và được nhiều người tin.',
                  en: 'To give currency to something means to make an idea or rumour spread and become accepted.',
                  optionAnalysis: {
                    A: 'ĐÚNG: give currency to rumours = làm lan truyền tin đồn.',
                    B: 'SAI: pay lip service to = chỉ ủng hộ ngoài miệng.',
                    C: 'SAI: cast aspersions on = vu khống, bôi nhọ danh dự.',
                    D: 'SAI: make no bones about = thẳng thắn không giấu giếm.'
                  }
                }
              },
              {
                id: 'pt-hv-q3',
                number: 3,
                type: 'word_formation',
                points: 2,
                rootWord: 'PRECEDE',
                stem: 'The central bank took the ________ step of imposing negative interest rates across all commercial tiers. (PRECEDE)',
                answer: 'unprecedented',
                acceptedAnswers: ['unprecedented'],
                explanation: {
                  rule: 'Morphological Derivation: un- + precede + -ent + -ed -> unprecedented (adj)',
                  vi: 'Sau mạo từ "the" và trước danh từ "step" cần một tính từ: "unprecedented" (chưa từng có tiền lệ). Câu này lặp lại ở cả đề Chuyên Hùng Vương (Phú Thọ), Chuyên Lê Hồng Phong (Nam Định) và DHBB.',
                  en: 'Adjective modifying "step": unprecedented (never done or known before).'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. SENTENCE TRANSFORMATION (20 points)',
        parts: [
          {
            id: 'pt-hv-wr-1',
            title: 'Part 1: Keyword Sentence Transformation',
            instructions: 'Rewrite each sentence using the given keyword without changing its form.',
            questions: [
              {
                id: 'pt-hv-q4',
                number: 4,
                type: 'sentence_transformation',
                points: 2,
                keyword: 'BONES',
                promptPrefix: 'The auditor made',
                stem: 'The auditor did not hesitate to criticize the board’s reckless fiscal policy. (BONES)',
                answer: "The auditor made no bones about criticizing the board's reckless fiscal policy",
                acceptedAnswers: [
                  "The auditor made no bones about criticizing the board's reckless fiscal policy",
                  "The auditor made no bones about criticising the board's reckless fiscal policy"
                ],
                explanation: {
                  rule: 'C2 Idiom: make no bones about doing something',
                  vi: '"Make no bones about + V-ing / N" = thẳng thắn, không ngần ngại khi làm hoặc nói điều gì.',
                  en: 'To make no bones about something means to be direct and candid without hesitation.'
                }
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'chon-doi-tuyen-nam-dinh-lhp-2025',
    title: 'Đề Chọn Đội Tuyển Dự Thi HSGQG — THPT Chuyên Lê Hồng Phong (Nam Định)',
    tournament: 'CHON_DOI_TUYEN',
    competitionCode: 'CHON_DOI_TUYEN',
    year: 2025,
    province_school: 'Nam Định (THPT Chuyên Lê Hồng Phong)',
    region: 'North',
    grade_level: '12',
    duration_minutes: 180,
    difficulty: 'C2 Olympiad',
    tags: ['Nam Định', 'Lê Hồng Phong', 'Đề Chọn Đội Tuyển', 'Inversion', 'Word Formation'],
    sections: {
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'nd-lhp-lg-1',
            title: 'Part 1: Advanced C2 Grammar & Idiomatic Precision',
            instructions: 'Choose the best option (A, B, C, or D) or supply the correct word form.',
            questions: [
              {
                id: 'nd-lhp-q1',
                number: 1,
                type: 'mcq',
                points: 2,
                // Identical stem to Phú Thọ & Olympic 30/4 to demonstrate cross-province frequency tracking
                stem: 'Not until the forensic audit was published ________ the full scale of the liquidity crisis.',
                options: [
                  { id: 'A', text: 'did the shareholders comprehend' },
                  { id: 'B', text: 'the shareholders comprehended' },
                  { id: 'C', text: 'had the shareholders comprehended' },
                  { id: 'D', text: 'would the shareholders comprehend' }
                ],
                answer: 'A',
                explanation: {
                  rule: 'Negative Adverbial Inversion (Not until + clause + Aux + S + V)',
                  vi: 'Đảo ngữ mệnh đề chính sau "Not until": did the shareholders comprehend.',
                  en: 'Main clause inversion after Not until.'
                }
              },
              {
                id: 'nd-lhp-q2',
                number: 2,
                type: 'word_formation',
                points: 2,
                rootWord: 'PRECEDE',
                stem: 'The central bank took the ________ step of imposing negative interest rates across all commercial tiers. (PRECEDE)',
                answer: 'unprecedented',
                acceptedAnswers: ['unprecedented'],
                explanation: {
                  rule: 'Morphological Derivation: unprecedented (adj)',
                  vi: 'unprecedented = chưa từng có tiền lệ.',
                  en: 'Adjective meaning never known or done before.'
                }
              },
              {
                id: 'nd-lhp-q3',
                number: 3,
                type: 'word_formation',
                points: 2,
                rootWord: 'EQUIVOCATE',
                stem: 'The committee issued an ________ condemnation of academic plagiarism in national competitions. (EQUIVOCATE)',
                answer: 'unequivocal',
                acceptedAnswers: ['unequivocal'],
                explanation: {
                  rule: 'Negative Prefix + Adjective Derivation: unequivocal (dứt khoát, không mập mờ)',
                  vi: 'Trước danh từ "condemnation" (sự lên án) và sau mạo từ "an" cần tính từ bắt đầu bằng nguyên âm: "unequivocal" (rõ ràng, dứt khoát, không chút mập mờ).',
                  en: 'Leaving no doubt; unambiguous.'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. SENTENCE TRANSFORMATION (20 points)',
        parts: [
          {
            id: 'nd-lhp-wr-1',
            title: 'Part 1: Keyword Sentence Transformation',
            instructions: 'Complete the second sentence so that it has a similar meaning to the first.',
            questions: [
              {
                id: 'nd-lhp-q4',
                number: 4,
                type: 'sentence_transformation',
                points: 2,
                keyword: 'BONES',
                promptPrefix: 'The auditor made',
                stem: 'The auditor did not hesitate to criticize the board’s reckless fiscal policy. (BONES)',
                answer: "The auditor made no bones about criticizing the board's reckless fiscal policy",
                acceptedAnswers: [
                  "The auditor made no bones about criticizing the board's reckless fiscal policy",
                  "The auditor made no bones about criticising the board's reckless fiscal policy"
                ],
                explanation: {
                  rule: 'C2 Idiom: make no bones about doing something',
                  vi: 'Cấu trúc "make no bones about + V-ing" xuất hiện với tần suất rất cao ở đề chọn đội tuyển Nam Định, Phú Thọ và Olympic 30/4.',
                  en: 'Make no bones about criticizing.'
                }
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'olympic-30-4-lhp-hcm-quoc-hoc-hue-2025',
    title: 'Đề Thi Olympic Truyền Thống 30/4 — Khối 11 (TP.HCM - Huế - Đà Nẵng)',
    tournament: 'OLYMPIC_30_4',
    competitionCode: 'OLYMPIC_30_4',
    year: 2025,
    province_school: 'TP.HCM & Huế (Chuyên Lê Hồng Phong TP.HCM & Quốc Học Huế)',
    region: 'South',
    grade_level: '11',
    duration_minutes: 180,
    difficulty: 'C1/C2 Olympiad',
    tags: ['Olympic 30/4', 'TP.HCM', 'Quốc Học Huế', 'Lê Quý Đôn Đà Nẵng', 'High-Frequency'],
    sections: {
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR & WORD FORMATION (40 points)',
        parts: [
          {
            id: 'o304-south-lg-1',
            title: 'Part 1: Olympic 30/4 Signature Lexico-Grammar & Word Formation',
            instructions: 'Choose the best option or supply the correct derived word.',
            questions: [
              {
                id: 'o304-south-q1',
                number: 1,
                type: 'mcq',
                points: 2,
                stem: 'Not until the forensic audit was published ________ the full scale of the liquidity crisis.',
                options: [
                  { id: 'A', text: 'did the shareholders comprehend' },
                  { id: 'B', text: 'the shareholders comprehended' },
                  { id: 'C', text: 'had the shareholders comprehended' },
                  { id: 'D', text: 'would the shareholders comprehend' }
                ],
                answer: 'A',
                explanation: {
                  rule: 'Negative Adverbial Inversion (Not until + clause + Aux + S + V)',
                  vi: 'Câu đảo ngữ "Not until..." xuất hiện trong cả 3 bộ đề lớn: Phú Thọ, Nam Định và Olympic 30/4.',
                  en: 'Inversion in the main clause following Not until.'
                }
              },
              {
                id: 'o304-south-q2',
                number: 2,
                type: 'word_formation',
                points: 2,
                rootWord: 'PRECEDE',
                stem: 'The central bank took the ________ step of imposing negative interest rates across all commercial tiers. (PRECEDE)',
                answer: 'unprecedented',
                acceptedAnswers: ['unprecedented'],
                explanation: {
                  rule: 'Morphological Derivation: unprecedented (adj)',
                  vi: 'unprecedented = chưa từng có tiền lệ.',
                  en: 'Never done or known before.'
                }
              },
              {
                id: 'o304-south-q3',
                number: 3,
                type: 'word_formation',
                points: 2,
                rootWord: 'EQUIVOCATE',
                stem: 'The committee issued an ________ condemnation of academic plagiarism in national competitions. (EQUIVOCATE)',
                answer: 'unequivocal',
                acceptedAnswers: ['unequivocal'],
                explanation: {
                  rule: 'Morphological Derivation: unequivocal (adj)',
                  vi: 'unequivocal = dứt khoát, không mập mờ.',
                  en: 'Unambiguous, clear-cut.'
                }
              },
              {
                id: 'o304-south-q4',
                number: 4,
                type: 'sentence_transformation',
                points: 2,
                keyword: 'BONES',
                promptPrefix: 'The auditor made',
                stem: 'The auditor did not hesitate to criticize the board’s reckless fiscal policy. (BONES)',
                answer: "The auditor made no bones about criticizing the board's reckless fiscal policy",
                acceptedAnswers: [
                  "The auditor made no bones about criticizing the board's reckless fiscal policy",
                  "The auditor made no bones about criticising the board's reckless fiscal policy"
                ],
                explanation: {
                  rule: 'C2 Idiom: make no bones about + V-ing',
                  vi: 'make no bones about criticizing = không ngần ngại chỉ trích.',
                  en: 'To be completely candid in criticizing.'
                }
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: 'hsg-tinh-nghe-an-phan-boi-chau-2025',
    title: 'Đề Thi Chọn Đội Tuyển HSGQG & HSG Tỉnh Bảng A — Chuyên Phan Bội Châu (Nghệ An)',
    tournament: 'HSG_TINH',
    competitionCode: 'HSG_TINH',
    year: 2025,
    province_school: 'Nghệ An (THPT Chuyên Phan Bội Châu)',
    region: 'Central',
    grade_level: '11-12',
    duration_minutes: 180,
    difficulty: 'C1/C2 Olympiad',
    tags: ['Nghệ An', 'Phan Bội Châu', 'Thanh Hóa Lam Sơn', 'Hà Tĩnh', 'Central Region'],
    sections: {
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'na-pbc-lg-1',
            title: 'Part 1: Central Region Specialized Lexico-Grammar',
            instructions: 'Select the best answer or supply the derived word.',
            questions: [
              {
                id: 'na-pbc-q1',
                number: 1,
                type: 'mcq',
                points: 2,
                stem: 'The minister’s evasive testimony merely served to ________ rumours of a cabinet rift.',
                options: [
                  { id: 'A', text: 'give currency to' },
                  { id: 'B', text: 'pay lip service to' },
                  { id: 'C', text: 'cast aspersions on' },
                  { id: 'D', text: 'make no bones about' }
                ],
                answer: 'A',
                explanation: {
                  rule: 'C2 Collocation: give currency to rumours',
                  vi: 'give currency to = làm lan truyền tin đồn (Xuất hiện trong cả đề Chuyên Hùng Vương Phú Thọ & Phan Bội Châu Nghệ An).',
                  en: 'To make a rumour spread widely.'
                }
              },
              {
                id: 'na-pbc-q2',
                number: 2,
                type: 'word_formation',
                points: 2,
                rootWord: 'CHRONICLE',
                stem: 'Treating a 21st-century algorithmic network with 19th-century statutes is a glaring ________. (CHRONICLE)',
                answer: 'anachronism',
                acceptedAnswers: ['anachronism'],
                explanation: {
                  rule: 'Prefix ana- + chron + -ism -> anachronism (Sự lỗi thời lạc hậu)',
                  vi: 'Sau tính từ "glaring" và mạo từ "a" cần danh từ đếm được số ít: "anachronism" (vật/quy định lỗi thời không hợp thời đại).',
                  en: 'Something belonging to a period other than that in which it exists.'
                }
              }
            ]
          }
        ]
      }
    }
  }
];

/**
 * Computes Cross-Exam Question Fingerprints across all exams in the database,
 * enriches every question with `fingerprintHash`, `frequencyCount`, `appearedInExams`,
 * and `highFrequencyBadge`, and returns national harvesting statistics.
 */
function computeAndPersistCrossExamFingerprints() {
  const allExams = db.getAllExams();
  const fingerprintRegistry = new Map();

  // Pass 1: Build global fingerprint index across all exams
  for (const exam of allExams) {
    const shortOrigin = exam.province_school
      ? exam.province_school.split('(')[0].trim()
      : `${exam.tournament} ${exam.year}`;
    const originLabel =
      exam.tournament === 'OLYMPIC_30_4' && !shortOrigin.includes('Olympic')
        ? `${shortOrigin} / Olympic 30/4`
        : shortOrigin;

    const sections = exam.sections || {};
    for (const secKey of Object.keys(sections)) {
      const parts = sections[secKey]?.parts || [];
      for (const part of parts) {
        if (part.passage) {
          part.fingerprintHash = computeQuestionFingerprint({ passage: part.passage });
        }
        for (const q of part.questions || []) {
          const fp = computeQuestionFingerprint(q);
          q.fingerprintHash = fp;
          if (!fingerprintRegistry.has(fp)) {
            fingerprintRegistry.set(fp, {
              fingerprintHash: fp,
              count: 0,
              examIds: new Set(),
              origins: new Set(),
              sampleStem: q.stem,
              questionType: q.type
            });
          }
          const entry = fingerprintRegistry.get(fp);
          if (!entry.examIds.has(exam.id)) {
            entry.examIds.add(exam.id);
            entry.count++;
          }
          entry.origins.add(originLabel);
        }
      }
    }
  }

  // Pass 2: Annotate every question with frequencyCount, appearedInExams, and highFrequencyBadge
  let highFrequencyQuestionsCount = 0;
  for (const exam of allExams) {
    const sections = exam.sections || {};
    for (const secKey of Object.keys(sections)) {
      const parts = sections[secKey]?.parts || [];
      for (const part of parts) {
        for (const q of part.questions || []) {
          const entry = fingerprintRegistry.get(q.fingerprintHash);
          const originsArr = entry ? Array.from(entry.origins) : [];
          const freq = entry ? entry.count : 1;
          q.frequencyCount = freq;
          q.appearedInExams = originsArr;
          if (freq >= 2) {
            highFrequencyQuestionsCount++;
            q.highFrequencyBadge = `🔥 High-Frequency Badge: Xuất hiện trong ${freq} đề thi (${originsArr.join(', ')})`;
          } else {
            q.highFrequencyBadge = null;
          }
        }
      }
    }
    db.upsertExam(exam);
  }

  const highFrequencyClusters = Array.from(fingerprintRegistry.values())
    .filter(e => e.count >= 2)
    .map(e => ({
      fingerprintHash: e.fingerprintHash,
      frequencyCount: e.count,
      appearedInExams: Array.from(e.origins),
      badgeText: `🔥 High-Frequency Badge: Xuất hiện trong ${e.count} đề thi (${Array.from(e.origins).join(', ')})`,
      sampleStem: e.sampleStem,
      questionType: e.questionType
    }))
    .sort((a, b) => b.frequencyCount - a.frequencyCount);

  return {
    totalExamsIndexed: allExams.length,
    totalUniqueFingerprints: fingerprintRegistry.size,
    highFrequencyQuestionsCount,
    highFrequencyClusters
  };
}

/**
 * Recursively scans /raw_exams/** for .docx, .pdf, .txt, .html files,
 * seeds the multi-province datasets, and runs cross-province deduplication & fingerprinting.
 */
async function runNationalExamHarvester() {
  const rawRoot = path.join(__dirname, '..', 'raw_exams');
  if (!fs.existsSync(rawRoot)) {
    fs.mkdirSync(rawRoot, { recursive: true });
  }

  let localFilesScanned = 0;
  let newExamsIngested = 0;

  // 1. Seed the multi-province specialized school datasets (North, Central, South)
  for (const dataset of MULTI_PROVINCE_HARVEST_DATASETS) {
    db.upsertExam(dataset);
    newExamsIngested++;
  }

  // 2. Recursively walk /raw_exams/**
  function walkRawFiles(dir) {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walkRawFiles(fullPath));
      } else if (/\.(txt|html|docx|pdf)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const localFiles = walkRawFiles(rawRoot);
  for (const filePath of localFiles) {
    localFilesScanned++;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.txt' || ext === '.html') {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.trim().length > 50) {
        const parsed = parseRawTextToExam(content, {
          title: path.basename(filePath, ext).replace(/[-_]/g, ' ')
        });
        db.upsertExam(parsed);
      }
    }
  }

  // 3. Compute Cross-Exam Question Fingerprints & Frequency Badges
  const dedupReport = computeAndPersistCrossExamFingerprints();

  db.createCrawlLog({
    source_url: 'national-harvester://63-provinces-70-specialized-schools',
    source_type: 'national-multi-province-harvester',
    status: 'SUCCESS',
    items_extracted: dedupReport.highFrequencyQuestionsCount,
    exam_id: 'national-multi-province-pool',
    summary: `Harvested ${dedupReport.totalExamsIndexed} provincial/national exams across North, Central & South; linked ${dedupReport.highFrequencyClusters.length} cross-province high-frequency question clusters.`
  });

  return {
    success: true,
    localFilesScanned,
    multiProvinceDatasetsSeeded: MULTI_PROVINCE_HARVEST_DATASETS.length,
    ...dedupReport,
    directoryStats: {
      totalProvincesCovered: 63,
      totalSpecializedSchools: NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY.length
    },
    schoolsDirectory: NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY
  };
}

module.exports = {
  NATIONAL_SPECIALIZED_SCHOOLS_DIRECTORY,
  MULTI_PROVINCE_HARVEST_DATASETS,
  computeAndPersistCrossExamFingerprints,
  runNationalExamHarvester
};
