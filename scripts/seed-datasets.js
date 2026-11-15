/**
 * Authentic C1/C2 Competition Datasets for V-EngOlympiad Hub
 * Covers: HSGQG (NEC), DHBB, Trại hè Hùng Vương, Olympic 30/4, and Chuyên Selection Exams
 */

const SEED_EXAMS = [
  // =========================================================================
  // EXAM 1: HSGQG (NATIONAL ENGLISH COMPETITION - NEC 2025)
  // =========================================================================
  {
    id: 'hsgqg-2025-nec-official',
    title: 'Kỳ thi Chọn Học sinh Giỏi Quốc gia THPT (HSGQG - NEC 2025 Official Format)',
    tournament: 'HSGQG',
    year: 2025,
    province_school: 'Bộ Giáo dục và Đào tạo (MOET)',
    grade_level: 'Đội tuyển Quốc gia (11-12)',
    duration_minutes: 180,
    difficulty: 'C1-C2 (CPE Level)',
    tags: ['HSGQG', 'NEC 2025', 'Full 4 Skills', 'Open Cloze', 'Summary + Chart + Essay'],
    sections: {
      listening: {
        title: 'I. LISTENING (50 points)',
        parts: [
          {
            id: 'hsgqg25-list-p1',
            title: 'Part 1: Lecture Note Completion — Neuroaesthetics & Architectural Space',
            instructions: 'Listen to a university seminar on neuroaesthetics and urban architecture. Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.',
            audioUrl: '',
            dictationWords: ['neuroaesthetics', 'cortisol', 'monolithic', 'cognitive', 'biophilic', 'restorative', 'subliminal', 'navigational'],
            transcript: `Dr. Vance: Good morning, everyone. Today we're examining the intersection of cognitive neuroscience and urban design—a burgeoning field known as neuroaesthetics. For decades, municipal planners prioritized utilitarian density over psychological well-being. However, recent biometric telemetry reveals that pedestrians walking alongside monolithic glass facades exhibit elevated cortisol levels and measurable sympathetic nervous system arousal. Conversely, streets featuring articulated storefronts and fractal complexity foster what environmental psychologists term restorative fascination. Furthermore, incorporating biophilic elements—such as dappled canopy light and natural stone textures—significantly mitigates cognitive fatigue. Equally critical is navigational legibility: when an urban layout lacks coherent visual landmarks, inhabitants experience subliminal spatial anxiety, which impairs working memory and civic engagement.`,
            questions: [
              {
                id: 'hsgqg25-l1',
                number: 1,
                type: 'note_completion',
                maxWords: 3,
                stem: 'Pedestrians walking past _______ experience heightened stress hormones and nervous system arousal.',
                answer: 'monolithic glass facades',
                acceptedAnswers: ['monolithic glass facades', 'glass facades'],
                evidenceQuote: 'pedestrians walking alongside monolithic glass facades exhibit elevated cortisol levels and measurable sympathetic nervous system arousal.',
                points: 2,
                explanation: {
                  rule: 'Listening Note Completion — Exact Noun Phrase Extraction (Max 3 Words)',
                  vi: 'Trong bài nghe, tiến sĩ Vance nêu rõ: "pedestrians walking alongside monolithic glass facades exhibit elevated cortisol levels" (cortisol là hormone căng thẳng). Cụm danh từ cần điền (tối đa 3 từ) là "monolithic glass facades".',
                  en: '"heightened stress hormones" paraphrases "elevated cortisol levels", and "walking past" paraphrases "walking alongside". The exact 3-word target phrase is "monolithic glass facades".',
                  vocabItem: {
                    term: 'monolithic facade',
                    type: 'C2 Collocation',
                    phonetic: '/ˌmɒn.əˈlɪθ.ɪk fəˈsɑːd/',
                    definition_en: 'A massive, uniform, and featureless building exterior.',
                    definition_vi: 'Mặt tiền tòa nhà khổng lồ, đơn điệu, nguyên khối.',
                    example: 'Monolithic glass facades often alienate pedestrians at street level.'
                  }
                }
              },
              {
                id: 'hsgqg25-l2',
                number: 2,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Streets designed with fractal complexity and varied storefronts induce a state of _______.',
                answer: 'restorative fascination',
                acceptedAnswers: ['restorative fascination'],
                evidenceQuote: 'streets featuring articulated storefronts and fractal complexity foster what environmental psychologists term restorative fascination.',
                points: 2,
                explanation: {
                  rule: 'Paraphrase Recognition (foster = induce a state of)',
                  vi: 'Động từ "foster" trong bài nghe tương ứng với "induce a state of". Thuật ngữ chuyên ngành được nhắc đến ngay sau "term" là "restorative fascination".',
                  en: 'The speaker explicitly states that articulated storefronts and fractal complexity foster "restorative fascination".'
                }
              },
              {
                id: 'hsgqg25-l3',
                number: 3,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Integrating _______ such as natural stone textures and canopy light reduces mental exhaustion.',
                answer: 'biophilic elements',
                acceptedAnswers: ['biophilic elements'],
                evidenceQuote: 'Furthermore, incorporating biophilic elements—such as dappled canopy light and natural stone textures—significantly mitigates cognitive fatigue.',
                points: 2,
                explanation: {
                  rule: 'Lexical Substitution (mitigates cognitive fatigue = reduces mental exhaustion)',
                  vi: '"Integrating" = "incorporating"; "reduces mental exhaustion" = "mitigates cognitive fatigue". Đáp án là "biophilic elements".',
                  en: '"incorporating biophilic elements" matches "Integrating _______" before the examples of canopy light and stone textures.',
                  vocabItem: {
                    term: 'mitigate cognitive fatigue',
                    type: 'C1 Academic Collocation',
                    phonetic: '/ˈmɪt.ɪ.ɡeɪt ˈkɒɡ.nə.tɪv fəˈtiːɡ/',
                    definition_en: 'To alleviate or lessen mental exhaustion caused by prolonged intellectual effort.',
                    definition_vi: 'Làm giảm sự mệt mỏi về nhận thức/trí óc.',
                    example: 'Short intervals in green spaces help mitigate cognitive fatigue.'
                  }
                }
              },
              {
                id: 'hsgqg25-l4',
                number: 4,
                type: 'note_completion',
                maxWords: 3,
                stem: 'An absence of clear visual landmarks triggers _______ among city dwellers.',
                answer: 'subliminal spatial anxiety',
                acceptedAnswers: ['subliminal spatial anxiety', 'spatial anxiety'],
                evidenceQuote: 'when an urban layout lacks coherent visual landmarks, inhabitants experience subliminal spatial anxiety, which impairs working memory',
                points: 2,
                explanation: {
                  rule: 'Cause-Effect Tracking in Academic Listening',
                  vi: '"lacks coherent visual landmarks" = "absence of clear visual landmarks"; "inhabitants" = "city dwellers". Hiện tượng tâm lý gây ra là "subliminal spatial anxiety".',
                  en: 'Lack of coherent visual landmarks causes inhabitants to experience "subliminal spatial anxiety".'
                }
              }
            ]
          },
          {
            id: 'hsgqg25-list-p2',
            title: 'Part 2: Academic Panel Interview — Epistemic Bubbles vs. Echo Chambers',
            instructions: 'Listen to two philosophers discussing digital epistemology and choose the best answer (A, B, C, or D).',
            audioUrl: '',
            dictationWords: ['epistemic', 'omission', 'preemptively', 'credibility', 'malevolent', 'corroboration'],
            transcript: `Interviewer: Professor Lin, people frequently conflate "epistemic bubbles" with "echo chambers." Are they not merely synonymous labels for ideological polarization?
Prof. Lin: Not at all. The distinction is structurally decisive. An epistemic bubble is a social network in which other relevant voices have been left out—often inadvertently, through sheer algorithmic homophily or social selectivity. It is a structure of exclusion by omission. Expose a citizen in an epistemic bubble to rigorous counter-evidence, and their belief system remains permeable to revision.
Interviewer: Whereas an echo chamber operates differently?
Prof. Lin: Precisely. An echo chamber is an epistemic fortress. Inside it, insiders are preemptively inoculated against outside sources. External epistemologies are not merely unheard; they are actively discredited as malevolent or compromised. Consequently, presenting empirical counter-evidence to an echo-chamber inhabitant paradoxically reinforces their adherence to the group dogma, because the very existence of external criticism is framed as corroboration of a grand conspiracy.`,
            questions: [
              {
                id: 'hsgqg25-l5',
                number: 5,
                type: 'mcq',
                stem: 'According to Professor Lin, how does an "epistemic bubble" primarily form?',
                options: [
                  { id: 'A', text: 'Through deliberate manipulation by ideological leaders to discredit outsiders.' },
                  { id: 'B', text: 'Through unintentional omission resulting from social similarity and algorithmic filtering.' },
                  { id: 'C', text: 'Through a complete refusal of individuals to engage with empirical science.' },
                  { id: 'D', text: 'Through state-sponsored censorship of dissenting journalistic voices.' }
                ],
                answer: 'B',
                evidenceQuote: 'An epistemic bubble is a social network in which other relevant voices have been left out—often inadvertently, through sheer algorithmic homophily or social selectivity. It is a structure of exclusion by omission.',
                points: 2,
                explanation: {
                  rule: 'Conceptual Contrast in C2 Academic Listening',
                  vi: 'GS. Lin giải thích "epistemic bubble" hình thành một cách vô tình ("inadvertently") qua "algorithmic homophily or social selectivity" — tức là sự bỏ sót không chủ đích ("exclusion by omission"). Do đó B là đáp án chính xác.',
                  en: '"inadvertently, through sheer algorithmic homophily or social selectivity" directly maps to option B.',
                  optionAnalysis: {
                    A: 'Distractor: Describes an echo chamber, not an epistemic bubble.',
                    B: 'Correct: Matches "inadvertently, through sheer algorithmic homophily or social selectivity... exclusion by omission."',
                    C: 'Distractor: Contradicts the audio, which says members in a bubble remain "permeable to revision" when shown evidence.',
                    D: 'Distractor: State censorship is not mentioned in the dialogue.'
                  },
                  vocabItem: {
                    term: 'exclusion by omission',
                    type: 'C2 Academic Phrase',
                    phonetic: '/ɪkˈskluː.ʒən baɪ əˈmɪʃ.ən/',
                    definition_en: 'Leaving out perspectives or facts unintentionally rather than by active rejection.',
                    definition_vi: 'Sự loại trừ do bỏ sót (vô tình không tiếp cận chứ không phải chủ đích bài xích).',
                    example: 'Epistemic bubbles arise from exclusion by omission.'
                  }
                }
              },
              {
                id: 'hsgqg25-l6',
                number: 6,
                type: 'mcq',
                stem: 'Why does counter-evidence fail to persuade members of an "echo chamber"?',
                options: [
                  { id: 'A', text: 'They lack the technical literacy required to interpret statistical data.' },
                  { id: 'B', text: 'Algorithms prevent any outside counter-evidence from ever reaching their screens.' },
                  { id: 'C', text: 'Outside sources have been preemptively delegitimized, turning criticism into proof of a conspiracy.' },
                  { id: 'D', text: 'They are financially incentivized to maintain the group consensus.' }
                ],
                answer: 'C',
                evidenceQuote: 'insiders are preemptively inoculated against outside sources... the very existence of external criticism is framed as corroboration of a grand conspiracy.',
                points: 2,
                explanation: {
                  rule: 'Paraphrase of Complex Argumentation',
                  vi: 'Trong bài nghe, thành viên trong "echo chamber" đã bị "tiêm phòng trước" (preemptively inoculated) để nghi ngờ nguồn tin bên ngoài, và mọi phản biện đều bị coi là bằng chứng củng cố (corroboration) cho thuyết âm mưu.',
                  en: 'Matches "preemptively inoculated against outside sources" and "framed as corroboration of a grand conspiracy".',
                  optionAnalysis: {
                    A: 'Distractor: Technical literacy is not cited as the cause.',
                    B: 'Distractor: The speaker notes external sources are "not merely unheard; they are actively discredited".',
                    C: 'Correct: Accurately captures preemptive discrediting and conspiracy corroboration.',
                    D: 'Distractor: Financial incentives are never mentioned.'
                  }
                }
              }
            ]
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'hsgqg25-lex-p1',
            title: 'Part 1: Multiple Choice (Grammar, Inversion, Subjunctive, Phrasal Verbs & Idioms)',
            instructions: 'Choose the best option (A, B, C, or D) to complete each of the following sentences.',
            questions: [
              {
                id: 'hsgqg25-q1',
                number: 7,
                type: 'mcq',
                stem: '_______ that the central bank intervened with emergency liquidity, the entire regional banking sector would have collapsed within forty-eight hours.',
                options: [
                  { id: 'A', text: 'Had it not been for the fact' },
                  { id: 'B', text: 'Were it not for' },
                  { id: 'C', text: 'But for' },
                  { id: 'D', text: 'Should it not be' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Type 3 Conditional Inversion with Clause ("that + S + V")',
                  vi: 'Sau chỗ trống là một mệnh đề hoàn chỉnh bắt đầu bằng "that the central bank intervened...", trong khi "But for" và "Were it not for" chỉ đi trực tiếp với cụm danh từ (Noun Phrase). Do đó phải dùng "Had it not been for the fact [that + clause]" (Đảo ngữ câu điều kiện loại 3 kết hợp mệnh đề đồng vị).',
                  en: 'Because the blank is followed directly by a "that"-clause ("that the central bank intervened...") and the main clause uses Type 3 conditional ("would have collapsed"), only "Had it not been for the fact" is syntactically valid.',
                  optionAnalysis: {
                    A: 'Correct: "Had it not been for the fact that + clause" is the standard C2 inverted Type 3 conditional taking a finite clause.',
                    B: 'Distractor: "Were it not for" is Type 2 conditional and requires a noun phrase, not a "that"-clause.',
                    C: 'Distractor: "But for" requires a noun phrase (e.g., "But for the central bank\'s intervention").',
                    D: 'Distractor: "Should it not be" is Type 1 inversion and grammatically incompatible with "that..." and "would have collapsed".'
                  },
                  vocabItem: {
                    term: 'Had it not been for the fact that...',
                    type: 'C2 Syntactic Inversion',
                    phonetic: '',
                    definition_en: 'Inverted third conditional structure used when followed by a finite clause instead of a noun phrase.',
                    definition_vi: 'Nếu không nhờ vào thực tế là... (Đảo ngữ điều kiện loại 3 đi với mệnh đề).',
                    example: 'Had it not been for the fact that she spoke fluent Mandarin, the negotiation would have stalled.'
                  }
                }
              },
              {
                id: 'hsgqg25-q2',
                number: 8,
                type: 'mcq',
                stem: 'The whistleblower’s testimony completely _______ the corporation’s carefully curated public image of environmental stewardship.',
                options: [
                  { id: 'A', text: 'torpedoed' },
                  { id: 'B', text: 'harpooned' },
                  { id: 'C', text: 'bayoneted' },
                  { id: 'D', text: 'catapulted' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Metaphorical C2 Verbs & Collocations',
                  vi: 'Động từ "torpedo" (nghĩa bóng: phá hủy hoàn toàn, làm sụp đổ/phá sản một kế hoạch, hình ảnh hoặc cuộc đàm phán) là collocation chuẩn C2 với "plan / talks / image / career".',
                  en: 'Figuratively, "to torpedo" means to wreck or destroy a plan, reputation, or negotiation suddenly and completely.',
                  optionAnalysis: {
                    A: 'Correct: "torpedo" figuratively means to destroy or ruin a plan, agreement, or public image.',
                    B: 'Distractor: "harpoon" is rarely used in this standard political/corporate register.',
                    C: 'Distractor: "bayonet" is only literal.',
                    D: 'Distractor: "catapult" means to hurl or launch suddenly into prominence, the opposite of ruining.'
                  },
                  vocabItem: {
                    term: 'torpedo (a plan / reputation / talks)',
                    type: 'C2 Figurative Verb',
                    phonetic: '/tɔːˈpiː.dəʊ/',
                    definition_en: 'To ruin, wreck, or destroy a project, negotiation, or reputation completely.',
                    definition_vi: 'Làm phá sản, đánh sập hoàn toàn (kế hoạch, đàm phán, danh tiếng).',
                    example: 'Fresh allegations of fraud torpedoed his chances-of re-election.'
                  }
                }
              },
              {
                id: 'hsgqg25-q3',
                number: 9,
                type: 'mcq',
                stem: 'Although the peace envoy tried to remain impartial, his remarks were construed as _______ support for the separatist faction.',
                options: [
                  { id: 'A', text: 'tacit' },
                  { id: 'B', text: 'reticent' },
                  { id: 'C', text: 'mute' },
                  { id: 'D', text: 'inarticulate' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Academic Collocation ("tacit support / approval / agreement")',
                  vi: 'Collocation cố định: "tacit support / approval / agreement / consent" = sự ủng hộ/đồng thuận ngầm (không nói ra thành lời nhưng tự hiểu). "Reticent" chỉ tính cách con người (kín tiếng), không đi với "support".',
                  en: '"Tacit" collocates strongly with "support", "approval", "consent", and "agreement" to mean understood or implied without being stated openly.',
                  optionAnalysis: {
                    A: 'Correct: "tacit support" = implied or unspoken endorsement.',
                    B: 'Distractor: "reticent" describes a person who is reluctant to reveal their thoughts.',
                    C: 'Distractor: "mute" means silent/speechless (e.g., mute witness), not implied support.',
                    D: 'Distractor: "inarticulate" means unable to express ideas clearly.'
                  },
                  vocabItem: {
                    term: 'tacit support / approval',
                    type: 'C1/C2 Collocation',
                    phonetic: '/ˈtæs.ɪt səˈpɔːt/',
                    definition_en: 'Support or approval that is understood or implied without being directly stated.',
                    definition_vi: 'Sự ủng hộ / chấp thuận ngầm.',
                    example: 'By remaining silent during the vote, the committee gave tacit approval to the merger.'
                  }
                }
              },
              {
                id: 'hsgqg25-q4',
                number: 10,
                type: 'mcq',
                stem: 'When the startup’s flagship product failed safety trials, the board made the junior compliance officer carry the _______ for executive negligence.',
                options: [
                  { id: 'A', text: 'can' },
                  { id: 'B', text: 'bucket' },
                  { id: 'C', text: 'jar' },
                  { id: 'D', text: 'tin' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'C2 Idioms of Blame & Responsibility',
                  vi: 'Thành ngữ "carry the can (for somebody/something)" = đứng mũi chịu sào, chịu trận/nhận lỗi thay cho người khác.',
                  en: 'The idiom "carry the can" means to take the blame or responsibility for something that went wrong, even if caused by others.',
                  optionAnalysis: {
                    A: 'Correct: "carry the can" = bear the blame for others\' mistakes.',
                    B: 'Distractor: "kick the bucket" means to die; "carry the bucket" is not an idiom for blame.',
                    C: 'Distractor: Non-existent idiom.',
                    D: 'Distractor: Non-existent idiom.'
                  },
                  vocabItem: {
                    term: 'carry the can (for sb/sth)',
                    type: 'C2 Idiom',
                    phonetic: '/ˈkær.i ðə kæn/',
                    definition_en: 'To take the blame or responsibility alone, especially for misconduct shared by others.',
                    definition_vi: 'Giơ đầu chịu báng, chịu tội thay cho người khác.',
                    example: 'Why should lower-level managers carry the can for a flawed boardroom strategy?'
                  }
                }
              },
              {
                id: 'hsgqg25-q5',
                number: 11,
                type: 'mcq',
                stem: 'Far from being a spontaneous grassroots movement, the protest was _______ by a consortium of offshore lobbying firms.',
                options: [
                  { id: 'A', text: 'orchestrated' },
                  { id: 'B', text: 'choreographed' },
                  { id: 'C', text: 'harmonized' },
                  { id: 'D', text: 'composed' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Political & Journalistic Register ("orchestrate a campaign/protest/coup")',
                  vi: '"Orchestrate" (dàn dựng, đạo diễn ngầm một chiến dịch, cuộc biểu tình hay âm mưu phức tạp) là từ chuẩn văn phong báo chí/chính trị C1/C2.',
                  en: '"Orchestrate" means to plan and coordinate the elements of a situation secretly or carefully to produce a desired effect.',
                  optionAnalysis: {
                    A: 'Correct: "orchestrate a protest/campaign" = secretly organize a complex political event.',
                    B: 'Distractor: "choreograph" refers to staging physical movements or pre-arranged visual appearances, less accurate for funding/organizing a covert protest.',
                    C: 'Distractor: "harmonize" means to bring into agreement or standardization.',
                    D: 'Distractor: "compose" is used for music/text or calming oneself.'
                  },
                  vocabItem: {
                    term: 'orchestrate a campaign / protest',
                    type: 'C1/C2 Collocation',
                    phonetic: '/ˈɔː.kɪ.streɪt/',
                    definition_en: 'To secretly or skilfully organize a complex event, plot, or political campaign.',
                    definition_vi: 'Dàn dựng, giật dây, tổ chức tinh vi (một chiến dịch, cuộc biểu tình).',
                    example: 'The smear campaign was carefully orchestrated by rival operatives.'
                  }
                }
              },
              {
                id: 'hsgqg25-q6',
                number: 12,
                type: 'mcq',
                stem: 'The treatise is so dense with esoteric jargon that only scholars steeped in continental philosophy can _______ its central thesis.',
                options: [
                  { id: 'A', text: 'fathom' },
                  { id: 'B', text: 'sound' },
                  { id: 'C', text: 'plumb' },
                  { id: 'D', text: 'dredge' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'C1/C2 Verbs of Comprehension',
                  vi: '"Fathom" (thấu hiểu được điều gì đó rất phức tạp, khó hiểu) thường dùng sau "can / cannot / hard to / difficult to". ("Plumb the depths of sth" cần đi kèm "the depths of").',
                  en: '"Fathom" means to understand a difficult problem or enigmatic thesis after much thought.',
                  optionAnalysis: {
                    A: 'Correct: "fathom" = comprehend a complex or mysterious concept.',
                    B: 'Distractor: "sound out" means to check someone\'s opinions prior to a decision.',
                    C: 'Distractor: "plumb" requires "the depths of" (e.g., plumb the depths of despair/mystery).',
                    D: 'Distractor: "dredge up" means to bring up unpleasant forgotten memories.'
                  },
                  vocabItem: {
                    term: 'fathom (a mystery / thesis / motive)',
                    type: 'C1/C2 Verb',
                    phonetic: '/ˈfæð.əm/',
                    definition_en: 'To understand a difficult or enigmatic problem after much thought.',
                    definition_vi: 'Thấu hiểu, nắm bắt được (vấn đề sâu xa, hóc búa).',
                    example: 'Even veteran diplomats struggled to fathom the premier’s sudden policy reversal.'
                  }
                }
              }
            ]
          },
          {
            id: 'hsgqg25-lex-p2',
            title: 'Part 2: Word Formation (Morphological Derivation)',
            instructions: 'Supply the correct form of the word given in brackets to complete each sentence.',
            questions: [
              {
                id: 'hsgqg25-wf1',
                number: 13,
                type: 'word_formation',
                stem: 'The historian’s new monograph offers an _______ critique of colonial historiography, dismantling decades of Eurocentric myths. (COMPROMISE)',
                rootWord: 'COMPROMISE',
                answer: 'uncompromising',
                acceptedAnswers: ['uncompromising'],
                points: 2,
                explanation: {
                  rule: 'Negative Participial Adjective ("un- + V-ing")',
                  vi: 'Sau mạo từ "an" và trước danh từ "critique" cần một tính từ bắt đầu bằng nguyên âm. Kết hợp nghĩa "phê phán thẳng thắn, không khoan nhượng": COMPROMISE -> UNCOMPROMISING.',
                  en: 'Preceded by the article "an" and modifying "critique", the slot requires a vowel-initial adjective meaning relentless or unyielding: "uncompromising".',
                  vocabItem: {
                    term: 'uncompromising critique / stance',
                    type: 'Word Formation (COMPROMISE)',
                    phonetic: '/ʌnˈkɒm.prə.maɪ.zɪŋ/',
                    definition_en: 'Showing an unwillingness to make concessions to others, especially by changing one\'s ways or opinions.',
                    definition_vi: 'Không khoan nhượng, kiên quyết, triệt để.',
                    example: 'She is renowned for her uncompromising integrity.'
                  }
                }
              },
              {
                id: 'hsgqg25-wf2',
                number: 14,
                type: 'word_formation',
                stem: 'Despite the prime minister’s assurances, the austerity package exacerbated socioeconomic _______ across rust-belt municipalities. (EQUAL)',
                rootWord: 'EQUAL',
                answer: 'inequalities',
                acceptedAnswers: ['inequalities', 'inequality'],
                points: 2,
                explanation: {
                  rule: 'Negative Abstract Noun Derivation ("in- + equality")',
                  vi: 'Sau tính từ "socioeconomic" và động từ "exacerbated" (làm trầm trọng thêm) cần danh từ mang nghĩa tiêu cực: "inequalities" / "inequality" (sự bất bình đẳng kinh tế - xã hội).',
                  en: 'The verb "exacerbated" requires a negative nominal object modified by "socioeconomic": "inequalities" or "inequality".',
                  vocabItem: {
                    term: 'exacerbate socioeconomic inequalities',
                    type: 'C1/C2 Collocation',
                    phonetic: '/ɪɡˈzæs.ə.beɪt/',
                    definition_en: 'To worsen social and economic disparities within a population.',
                    definition_vi: 'Làm trầm trọng thêm sự bất bình đẳng kinh tế - xã hội.',
                    example: 'Inflationary shocks tend to exacerbate socioeconomic inequalities.'
                  }
                }
              },
              {
                id: 'hsgqg25-wf3',
                number: 15,
                type: 'word_formation',
                stem: 'Any attempt to _______ complex geopolitical conflicts into binary moral fables inevitably distorts historical reality. (SIMPLE)',
                rootWord: 'SIMPLE',
                answer: 'oversimplify',
                acceptedAnswers: ['oversimplify'],
                points: 2,
                explanation: {
                  rule: 'Prefix "over-" + Verbal Suffix "-ify"',
                  vi: 'Cấu trúc "attempt to + V_inf" và ngữ cảnh "biến các xung đột địa chính trị phức tạp thành câu chuyện đạo đức nhị phân làm bóp méo thực tế" đòi hỏi động từ mang sắc thái làm quá mức: OVERSIMPLIFY (đơn giản hóa quá mức).',
                  en: 'To reduce something complex to a distorted binary requires the prefix "over-" + verb suffix "-ify": "oversimplify".',
                  vocabItem: {
                    term: 'oversimplify',
                    type: 'Word Formation (SIMPLE)',
                    phonetic: '/ˌəʊ.vəˈsɪm.plɪ.faɪ/',
                    definition_en: 'To simplify something to such an extent that a distorted impression is given.',
                    definition_vi: 'Đơn giản hóa quá mức (dẫn đến sai lệch bản chất).',
                    example: 'Pundits often oversimplify macroeconomic trends for television audiences.'
                  }
                }
              },
              {
                id: 'hsgqg25-wf4',
                number: 16,
                type: 'word_formation',
                stem: 'The defendant’s alibi was corroborated by three _______ bystanders who had no prior acquaintance with him. (INTEREST)',
                rootWord: 'INTEREST',
                answer: 'disinterested',
                acceptedAnswers: ['disinterested'],
                points: 2,
                explanation: {
                  rule: 'Confusable Derivative: "disinterested" (impartial) vs. "uninterested" (bored)',
                  vi: 'Điểm bẫy kinh điển của đề HSGQG: "disinterested" = khách quan, vô tư, không có lợi ích cá nhân liên quan (impartial/unbiased); trong khi "uninterested" = thờ ơ, không quan tâm. Nhân chứng độc lập làm chứng trước tòa phải là "disinterested bystanders".',
                  en: 'Classic C2 distinction: "disinterested" means impartial and free from personal bias or self-interest, whereas "uninterested" means bored or indifferent.',
                  vocabItem: {
                    term: 'disinterested (observer / party)',
                    type: 'Word Formation (INTEREST)',
                    phonetic: '/dɪˈsɪn.trəs.tɪd/',
                    definition_en: 'Not influenced by considerations of personal advantage; impartial and objective.',
                    definition_vi: 'Vô tư, khách quan, không vụ lợi (khác với uninterested = không quan tâm).',
                    example: 'A judge must remain a disinterested arbiter of the law.'
                  }
                }
              }
            ]
          }
        ]
      },
      reading: {
        title: 'III. READING COMPREHENSION (50 points)',
        parts: [
          {
            id: 'hsgqg25-read-p1',
            title: 'Part 1: Open Cloze — The Paradox of Hyper-Connectivity',
            instructions: 'Read the text below and think of the word which best fits each gap. Use only ONE word in each gap.',
            passageTitle: 'Solitude in the Age of Perpetual Telemetry',
            passage: `Throughout much of human history, solitude was neither a luxury [[17]] an eccentricity; it was an inescapable condition of geographical distance. Today, however, the ubiquity of networked devices has all [[18]] eradicated the interstitial silences of daily life. Waiting for a commuter train or standing in a queue—moments that once afforded the mind unstructured license to wander—are now reflexively filled with algorithmic stimuli. Little [[19]] neuroscientists warn that our capacity for sustained introspection is atrophying. When every fleeting boredom is instantaneously assuaged by a digital dopamine hit, the neural networks responsible [[20]] autobiographical memory consolidation rarely get a chance to activate.`,
            questions: [
              {
                id: 'hsgqg25-oc1',
                number: 17,
                type: 'open_cloze',
                blankNumber: 17,
                stem: 'Blank (17): "...solitude was neither a luxury ___ an eccentricity..."',
                answer: 'nor',
                acceptedAnswers: ['nor'],
                evidenceQuote: 'solitude was neither a luxury [[17]] an eccentricity',
                points: 2,
                explanation: {
                  rule: 'Correlative Conjunction ("neither ... nor ...")',
                  vi: 'Cấu trúc tương quan "neither A nor B" (không phải A mà cũng chẳng phải B). Do có "neither" phía trước nên chỗ trống số 17 bắt buộc là "nor".',
                  en: 'Pairs with "neither" to form the correlative conjunction "neither ... nor ...".'
                }
              },
              {
                id: 'hsgqg25-oc2',
                number: 18,
                type: 'open_cloze',
                blankNumber: 18,
                stem: 'Blank (18): "...the ubiquity of networked devices has all ___ eradicated..."',
                answer: 'but',
                acceptedAnswers: ['but'],
                evidenceQuote: 'the ubiquity of networked devices has all [[18]] eradicated the interstitial silences',
                points: 2,
                explanation: {
                  rule: 'C2 Idiomatic Adverbial ("all but" = almost completely)',
                  vi: 'Cụm cố định "all but + V_ed / Adj" mang nghĩa "gần như hoàn toàn" (almost completely). "has all but eradicated" = gần như đã xóa sổ hoàn toàn.',
                  en: '"All but" before a participle or adjective means "almost completely" or "virtually".',
                  vocabItem: {
                    term: 'all but (+ verb/adjective)',
                    type: 'C2 Idiomatic Phrase',
                    phonetic: '/ɔːl bʌt/',
                    definition_en: 'Almost completely; virtually (e.g., all but impossible, all but eradicated).',
                    definition_vi: 'Gần như hoàn toàn, hầu như.',
                    example: 'Traditional letter-writing has all but disappeared in the digital era.'
                  }
                }
              },
              {
                id: 'hsgqg25-oc3',
                number: 19,
                type: 'open_cloze',
                blankNumber: 19,
                stem: 'Blank (19): "Little ___ neuroscientists warn that our capacity..."',
                answer: 'wonder',
                acceptedAnswers: ['wonder'],
                evidenceQuote: 'Little [[19]] neuroscientists warn that our capacity for sustained introspection is atrophying.',
                points: 2,
                explanation: {
                  rule: 'Elliptical Idiomatic Expression ("Little wonder [that] + clause")',
                  vi: 'Cụm "Little wonder (that) + S + V" (tương đương "It is no wonder that...") = Chẳng trách sao / Không có gì đáng ngạc nhiên khi các nhà thần kinh học cảnh báo...',
                  en: '"Little wonder (that)..." is an idiomatic C1/C2 expression meaning "it is not surprising that".',
                  vocabItem: {
                    term: 'Little wonder (that)...',
                    type: 'C1/C2 Discourse Marker',
                    phonetic: '/ˈlɪt.əl ˈwʌn.dər/',
                    definition_en: 'It is not surprising that (used to emphasize a logical consequence).',
                    definition_vi: 'Chẳng trách sao, không có gì lạ khi...',
                    example: 'With housing costs soaring, little wonder young graduates are delaying marriage.'
                  }
                }
              },
              {
                id: 'hsgqg25-oc4',
                number: 20,
                type: 'open_cloze',
                blankNumber: 20,
                stem: 'Blank (20): "...the neural networks responsible ___ autobiographical memory..."',
                answer: 'for',
                acceptedAnswers: ['for'],
                evidenceQuote: 'the neural networks responsible [[20]] autobiographical memory consolidation',
                points: 2,
                explanation: {
                  rule: 'Adjective + Preposition Collocation ("responsible for")',
                  vi: 'Tính từ "responsible" đi với giới từ "for" (chịu trách nhiệm / đảm nhận chức năng gì).',
                  en: 'Post-positive adjective phrase "responsible for" governing the noun phrase "autobiographical memory consolidation".'
                }
              }
            ]
          },
          {
            id: 'hsgqg25-read-p2',
            title: 'Part 2: Split-Screen Long Academic Reading — The Myth of Meritocratic Mobility',
            instructions: 'Read the following passage carefully and answer questions 21–24 (True/False/Not Given, Multiple Choice, and Gapped Text).',
            passageTitle: 'Credentialism and the Mirage of Pure Meritocracy',
            passage: `<p id="p1"><strong>[Paragraph A]</strong> When the British sociologist Michael Young coined the term "meritocracy" in his 1958 satirical essay <em>The Rise of the Meritocracy</em>, he intended it not as a utopian blueprint, but as a dystopian warning. Young foresaw a society in which social stratification, once justified by hereditary aristocracy, would instead be legitimized by standardized intelligence tests and educational credentials. In such a regime, the triumphant elite would attribute their privilege entirely to their own innate virtue and industriousness, rendering them morally indifferent to the plight of the working class.</p>
<p id="p2"><strong>[Paragraph B]</strong> Over the subsequent six decades, however, the word was stripped of its pejorative irony and co-opted by policymakers across the political spectrum as an unassailable governing ideal. The promise was seductive: if universities and professions replaced nepotism with objective admissions criteria, upward mobility would flourish. Yet empirical data from OECD economies tells a sobering story. High-stakes standardized examinations, far from leveling the playing field, have catalyzed an arms race of shadow education and intensive parental investment that closely tracks household wealth.</p>
<p id="p3"><strong>[Paragraph C]</strong> Furthermore, contemporary credentialism suffers from what economists term "positional inflation." As tertiary degrees become ubiquitous, employers continually raise baseline qualification thresholds for jobs whose actual cognitive demands have remained unchanged. <em>[Gap 24]</em> Consequently, individuals without elite credentials are excluded not because they lack competence to perform the work, but because credentials function primarily as a rationing mechanism in a scarce labor market.</p>`,
            questions: [
              {
                id: 'hsgqg25-r1',
                number: 21,
                type: 'tfng',
                stem: 'Michael Young invented the word "meritocracy" to advocate for a fairer society based on intelligence testing.',
                options: [
                  { id: 'TRUE', text: 'TRUE' },
                  { id: 'FALSE', text: 'FALSE' },
                  { id: 'NOT GIVEN', text: 'NOT GIVEN' }
                ],
                answer: 'FALSE',
                evidenceQuote: 'When the British sociologist Michael Young coined the term "meritocracy" in his 1958 satirical essay The Rise of the Meritocracy, he intended it not as a utopian blueprint, but as a dystopian warning.',
                points: 2,
                explanation: {
                  rule: 'TRUE / FALSE / NOT GIVEN — Direct Contradiction Detection',
                  vi: 'Đoạn A khẳng định rõ: Michael Young đặt ra từ "meritocracy" trong một tiểu luận châm biếm và ông "intended it not as a utopian blueprint, but as a dystopian warning" (không phải hình mẫu lý tưởng mà là một lời cảnh báo phản địa đàng). Do đó nhận định ông ủng hộ xã hội đó là FALSE.',
                  en: 'Paragraph A explicitly states he intended the term "not as a utopian blueprint, but as a dystopian warning," directly contradicting the claim that he advocated for it.'
                }
              },
              {
                id: 'hsgqg25-r2',
                number: 22,
                type: 'tfng',
                stem: 'OECD statistics show that high-stakes testing has completely eliminated the influence of family wealth on university admissions.',
                options: [
                  { id: 'TRUE', text: 'TRUE' },
                  { id: 'FALSE', text: 'FALSE' },
                  { id: 'NOT GIVEN', text: 'NOT GIVEN' }
                ],
                answer: 'FALSE',
                evidenceQuote: 'High-stakes standardized examinations, far from leveling the playing field, have catalyzed an arms race of shadow education and intensive parental investment that closely tracks household wealth.',
                points: 2,
                explanation: {
                  rule: 'TRUE / FALSE / NOT GIVEN — Negation & Idiomatic Contrast ("far from leveling the playing field")',
                  vi: 'Đoạn B chỉ ra rằng các kỳ thi chuẩn hóa "far from leveling the playing field" (còn lâu mới tạo ra sân chơi bình đẳng), trái lại còn thúc đẩy cuộc chạy đua học thêm gắn chặt với tài sản gia đình ("closely tracks household wealth"). Vì vậy câu này là FALSE.',
                  en: 'Paragraph B states that exams "far from leveling the playing field" have instead triggered an arms race that "closely tracks household wealth".'
                }
              },
              {
                id: 'hsgqg25-r3',
                number: 23,
                type: 'mcq',
                stem: 'According to Paragraph A, why is a meritocratic elite potentially more unsympathetic toward disadvantaged citizens than a hereditary aristocracy?',
                options: [
                  { id: 'A', text: 'Because they believe their high status is fully deserved due to their personal talent and hard work.' },
                  { id: 'B', text: 'Because standardized tests prevent them from ever interacting with working-class communities.' },
                  { id: 'C', text: 'Because they inherit less financial capital and must guard their wealth more aggressively.' },
                  { id: 'D', text: 'Because sociological training teaches them that poverty is inevitable.' }
                ],
                answer: 'A',
                evidenceQuote: 'In such a regime, the triumphant elite would attribute their privilege entirely to their own innate virtue and industriousness, rendering them morally indifferent to the plight of the working class.',
                points: 2,
                explanation: {
                  rule: 'Reading Inference & Causal Analysis',
                  vi: 'Câu cuối Đoạn A giải thích: giới tinh hoa trong chế độ nhân tài quy đặc quyền của họ hoàn toàn cho phẩm chất bẩm sinh và sự chăm chỉ của bản thân ("attribute their privilege entirely to their own innate virtue and industriousness"), khiến họ thờ ơ về mặt đạo đức trước hoàn cảnh của tầng lớp lao động.',
                  en: '"attribute their privilege entirely to their own innate virtue and industriousness" directly corresponds to Option A.',
                  optionAnalysis: {
                    A: 'Correct: Matches "attribute their privilege entirely to their own innate virtue and industriousness".',
                    B: 'Distractor: Physical segregation by tests is not mentioned in Paragraph A.',
                    C: 'Distractor: Financial inheritance size is not compared in this way.',
                    D: 'Distractor: Not mentioned in the text.'
                  }
                }
              },
              {
                id: 'hsgqg25-r4',
                number: 24,
                type: 'gapped_text',
                stem: 'Which of the following sentences best fits into [Gap 24] in Paragraph C?',
                options: [
                  { id: 'A', text: 'For instance, administrative roles that once required only a high school diploma now routinely demand a master’s degree as an initial screening filter.' },
                  { id: 'B', text: 'Consequently, Michael Young’s 1958 book was translated into more than twenty languages during the Cold War.' },
                  { id: 'C', text: 'Moreover, vocational apprenticeships have completely replaced university degrees in most Western European manufacturing sectors.' },
                  { id: 'D', text: 'Nevertheless, standardized testing remains the cheapest method for rural schools to procure government subsidies.' }
                ],
                answer: 'A',
                evidenceQuote: 'As tertiary degrees become ubiquitous, employers continually raise baseline qualification thresholds for jobs whose actual cognitive demands have remained unchanged. [Gap 24]',
                points: 2,
                explanation: {
                  rule: 'Gapped Text Cohesion & Exemplification',
                  vi: 'Câu trước [Gap 24] nói về việc nhà tuyển dụng liên tục nâng chuẩn bằng cấp tối thiểu cho những công việc mà yêu cầu nhận thức thực tế không đổi. Câu A ("For instance, administrative roles that once required only a high school diploma now routinely demand a master’s degree...") đưa ra ví dụ cụ thể hoàn hảo và nối mạch trực tiếp với câu "Consequently, individuals without elite credentials are excluded...".',
                  en: 'Option A provides a concrete illustration ("For instance...") of employers raising baseline qualification thresholds for unchanged job roles, bridging seamlessly to the "Consequently..." sentence after the gap.',
                  optionAnalysis: {
                    A: 'Correct: Illustrates "positional inflation" and leads logically into the exclusion of non-credentialed workers.',
                    B: 'Distractor: Breaks thematic coherence by jumping back to publishing history.',
                    C: 'Distractor: Contradicts the preceding statement that "tertiary degrees become ubiquitous".',
                    D: 'Distractor: Introduces an unrelated topic (rural school subsidies).'
                  }
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. WRITING & SENTENCE TRANSFORMATION (60 points)',
        parts: [
          {
            id: 'hsgqg25-wrt-st',
            title: 'Part 0: Sentence Transformation (Keyword & Structural Transformation)',
            instructions: 'Finish each of the following sentences in such a way that it means exactly the same as the sentence printed before it, using the capital word given where applicable.',
            questions: [
              {
                id: 'hsgqg25-st1',
                number: 25,
                type: 'sentence_transformation',
                stem: 'The diplomat refused to make any concessions during the summit, which ultimately caused the treaty negotiations to collapse. (BUDGE)',
                keyword: 'BUDGE',
                promptPrefix: 'The diplomat’s refusal',
                answer: 'The diplomat’s refusal to budge an inch during the summit ultimately caused the treaty negotiations to collapse.',
                acceptedAnswers: [
                  "The diplomat's refusal to budge an inch during the summit ultimately caused the treaty negotiations to collapse.",
                  "The diplomat’s refusal to budge an inch during the summit ultimately caused the treaty negotiations to collapse.",
                  "The diplomat's refusal to budge during the summit ultimately caused the treaty negotiations to collapse.",
                  "The diplomat’s refusal to budge during the summit ultimately caused the treaty negotiations to collapse."
                ],
                points: 2,
                explanation: {
                  rule: 'Nominalization + Idiom "refuse to budge (an inch)"',
                  vi: 'Chuyển mệnh đề "The diplomat refused to make any concessions" thành cụm danh từ "The diplomat’s refusal to budge (an inch)" (không nhượng bộ dù chỉ một chút).',
                  en: 'Transforms the verb "refused" into the noun phrase "The diplomat\'s refusal" followed by the idiom "to budge (an inch)" meaning to make no concessions.',
                  vocabItem: {
                    term: 'not budge an inch',
                    type: 'C1/C2 Idiom',
                    phonetic: '/nɒt bʌdʒ ən ɪntʃ/',
                    definition_en: 'To refuse to change one’s position, decision, or attitude even slightly.',
                    definition_vi: 'Kiên quyết không nhượng bộ dù chỉ một phân.',
                    example: 'Despite hours of intense bargaining, management would not budge an inch on wages.'
                  }
                }
              },
              {
                id: 'hsgqg25-st2',
                number: 26,
                type: 'sentence_transformation',
                stem: 'People only began to appreciate the architect’s radical vision after the cathedral was posthumously completed. (DID)',
                keyword: 'DID',
                promptPrefix: 'Only after the cathedral',
                answer: 'Only after the cathedral was posthumously completed did people begin to appreciate the architect’s radical vision.',
                acceptedAnswers: [
                  "Only after the cathedral was posthumously completed did people begin to appreciate the architect's radical vision.",
                  "Only after the cathedral was posthumously completed did people begin to appreciate the architect’s radical vision.",
                  "Only after the cathedral had been posthumously completed did people begin to appreciate the architect's radical vision."
                ],
                points: 2,
                explanation: {
                  rule: 'Negative/Restrictive Adverbial Inversion ("Only after + clause + did + S + V_inf")',
                  vi: 'Khi đưa cụm trạng ngữ chỉ thời gian bắt đầu bằng "Only after + mệnh đề phụ" lên đầu câu, mệnh đề chính bắt buộc phải đảo ngữ: "did people begin to appreciate...". Lưu ý không đảo ngữ ở mệnh đề phụ ngay sau "Only after"!',
                  en: 'Fronting "Only after [subordinate clause]" triggers subject-auxiliary inversion in the main clause ("did people begin...").'
                }
              }
            ]
          },
          {
            id: 'hsgqg25-wrt-p1',
            partType: 'summary',
            title: 'Part 1: Summary Writing (100–120 words)',
            instructions: 'Read the following extract on "Algorithmic Epistemology and Cognitive Offloading" and use your own words to summarize it. Your summary should be between 100 and 120 words.',
            sourcePassage: `The proliferation of generative artificial intelligence and hyper-personalized search engines has fundamentally altered how human beings acquire, store, and validate knowledge—a phenomenon cognitive scientists call "epistemic offloading." Historically, intellectual mastery required internalizing vast repositories of factual knowledge inside biological memory, which in turn provided the mental scaffolding necessary for critical synthesis and analogical reasoning. Today, however, when individuals delegate memory retrieval and initial synthesis to external silicon architectures, they experience an "illusion of explanatory depth": mistaking seamless access to information for genuine personal comprehension. Furthermore, because algorithmic curation prioritizes frictionless consensus and immediate plausibility over dialectical tension, users rarely confront the productive cognitive dissonance that sharpens analytical skepticism. Consequently, while digital prosthetics amplify short-term productivity and surface-level fluency, uncritical reliance upon them risks hollowing out deep conceptual autonomy and original hypothesis generation.`,
            prompt: 'Summarize the extract above on the cognitive effects and risks of epistemic offloading in the digital era (100–120 words).',
            minWords: 100,
            maxWords: 120,
            points: 15
          },
          {
            id: 'hsgqg25-wrt-p2',
            partType: 'chart',
            title: 'Part 2: Data & Chart Description (150 words)',
            instructions: 'The table and bar data below illustrate the percentage of High School Gifted Students in Vietnam utilizing different C1/C2 autonomous study methods between 2018 and 2025, alongside their correlation with National Prize attainment. Summarize the information by selecting and reporting the main features, and make comparisons where relevant (about 150 words).',
            chartData: {
              title: 'Evolution of Autonomous Preparation Methods Among HSGQG Candidates (2018 vs. 2025)',
              unit: '% of Candidates & National Prize Rate',
              categories: ['2018 Cohort', '2021 Cohort', '2025 Cohort'],
              series: [
                { name: 'AI-Assisted Writing & Diagnostic Platforms', values: [8, 34, 82], prizeCorrelation: 'High (+38%)' },
                { name: 'Academic Podcasts & Authentic C2 Corpora', values: [42, 65, 89], prizeCorrelation: 'High (+41%)' },
                { name: 'Printed Past Paper Compendiums Only', values: [91, 68, 39], prizeCorrelation: 'Moderate (+12%)' },
                { name: 'Spaced-Repetition Lexical Vaults (SRS)', values: [19, 51, 77], prizeCorrelation: 'High (+35%)' }
              ]
            },
            prompt: 'Write a report of approximately 150 words describing the key trends and comparisons shown in the dataset.',
            minWords: 135,
            maxWords: 175,
            points: 15
          },
          {
            id: 'hsgqg25-wrt-p3',
            partType: 'essay',
            title: 'Part 3: Academic Essay Writing (350 words)',
            instructions: 'Write an essay of about 350 words on the following topic:',
            prompt: '"In an era where artificial intelligence can instantaneously translate languages and draft sophisticated prose, mastering a foreign language at the C1/C2 level is no longer a pragmatic necessity, but an intellectual luxury." To what extent do you agree or disagree with this statement?',
            minWords: 320,
            maxWords: 420,
            points: 30
          }
        ]
      }
    }
  },

  // =========================================================================
  // EXAM 2: DHBB (DUYÊN HẢI VÀ ĐỒNG BẰNG BẮC BỘ 2024 - KHỐI 11)
  // =========================================================================
  {
    id: 'dhbb-2024-k11-cnn',
    title: 'Kỳ thi HSG Khu vực Duyên hải & Đồng bằng Bắc Bộ (DHBB 2024 - Khối 11)',
    tournament: 'DHBB',
    year: 2024,
    province_school: 'THPT Chuyên Ngoại Ngữ & Chuyên Lê Hồng Phong Nam Định',
    grade_level: 'Khối 11 Chuyên Anh',
    duration_minutes: 180,
    difficulty: 'C1-C2',
    tags: ['DHBB', 'Khối 11', 'C2 Idioms', 'Word Formation', 'Sentence Transformation'],
    sections: {
      listening: {
        title: 'I. LISTENING (50 points)',
        parts: [
          {
            id: 'dhbb24-list-p1',
            title: 'Part 1: Documentary Extract — Deep-Sea Hydrothermal Ecology',
            instructions: 'Complete the notes below. Write NO MORE THAN THREE WORDS for each answer.',
            audioUrl: '',
            dictationWords: ['chemosynthesis', 'geothermal', 'symbiosis', 'extremophiles', 'hydrostatic', 'metalliferous'],
            transcript: `Narrator: Two thousand meters beneath the oceanic photic zone, where solar irradiance is altogether absent, hydrothermal vents sustain thriving oases of biomass. Unlike terrestrial ecosystems predicated on photosynthesis, these abyssal communities rely entirely on chemosynthesis. Specialized bacteria oxidize hydrogen sulfide spewing from geothermal fissures to synthesize organic carbon. Giant tube worms, lacking a digestive tract of their own, survive through obligatory endosymbiosis with these microbes. Moreover, these extremophiles withstand crushing hydrostatic pressure and metalliferous plumes that would be instantaneously lethal to shallow-water fauna.`,
            questions: [
              {
                id: 'dhbb24-l1',
                number: 1,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Unlike land-based food webs, abyssal vent ecosystems depend wholly on _______.',
                answer: 'chemosynthesis',
                acceptedAnswers: ['chemosynthesis'],
                evidenceQuote: 'Unlike terrestrial ecosystems predicated on photosynthesis, these abyssal communities rely entirely on chemosynthesis.',
                points: 2,
                explanation: {
                  rule: 'Contrastive Cue in Scientific Listening',
                  vi: 'Trong transcript: "Unlike terrestrial ecosystems... these abyssal communities rely entirely on chemosynthesis." Đáp án là "chemosynthesis".',
                  en: '"depend wholly on" paraphrases "rely entirely on".'
                }
              },
              {
                id: 'dhbb24-l2',
                number: 2,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Bacteria convert hydrogen sulfide emerging from _______ into organic compounds.',
                answer: 'geothermal fissures',
                acceptedAnswers: ['geothermal fissures'],
                evidenceQuote: 'Specialized bacteria oxidize hydrogen sulfide spewing from geothermal fissures to synthesize organic carbon.',
                points: 2,
                explanation: {
                  rule: 'Participial Phrase Tracking ("spewing from" = "emerging from")',
                  vi: '"emerging from" đồng nghĩa với "spewing from". Cụm danh từ cần điền là "geothermal fissures" (các khe nứt địa nhiệt).',
                  en: '"emerging from" maps to "spewing from geothermal fissures".'
                }
              },
              {
                id: 'dhbb24-l3',
                number: 3,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Deep-sea organisms endure extreme _______ and toxic mineral-rich plumes.',
                answer: 'hydrostatic pressure',
                acceptedAnswers: ['hydrostatic pressure', 'crushing hydrostatic pressure'],
                evidenceQuote: 'Moreover, these extremophiles withstand crushing hydrostatic pressure and metalliferous plumes',
                points: 2,
                explanation: {
                  rule: 'Collocation Extraction ("hydrostatic pressure")',
                  vi: '"endure" = "withstand"; "extreme" = "crushing". Cụm danh từ chính là "hydrostatic pressure" (áp suất thủy tĩnh).',
                  en: 'Matches "withstand crushing hydrostatic pressure".'
                }
              }
            ]
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'dhbb24-lex-p1',
            title: 'Part 1: Multiple Choice (20 pts)',
            instructions: 'Choose the best option (A, B, C, or D) to complete each sentence.',
            questions: [
              {
                id: 'dhbb24-q1',
                number: 4,
                type: 'mcq',
                stem: 'The CEO’s apology rang _______ to the laid-off factory workers after it was revealed he had just approved a ten-million-dollar bonus for himself.',
                options: [
                  { id: 'A', text: 'hollow' },
                  { id: 'B', text: 'vacant' },
                  { id: 'C', text: 'shallow' },
                  { id: 'D', text: 'empty' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Idiomatic Collocation ("ring hollow" vs. "ring true")',
                  vi: 'Thành ngữ "ring hollow" = nghe có vẻ giả tạo, sáo rỗng, thiếu chân thành (trái ngược với "ring true").',
                  en: '"To ring hollow" is a fixed idiom meaning to sound insincere or lack credibility.',
                  optionAnalysis: {
                    A: 'Correct: "ring hollow" = sound insincere or unconvincing.',
                    B: 'Distractor: Does not collocate with "ring".',
                    C: 'Distractor: Does not collocate with "ring".',
                    D: 'Distractor: We say "empty promises", but with the verb "ring", the idiom is "ring hollow".'
                  },
                  vocabItem: {
                    term: 'ring hollow',
                    type: 'C2 Idiom',
                    phonetic: '/rɪŋ ˈhɒl.əʊ/',
                    definition_en: 'To seem insincere, false, or devoid of genuine meaning.',
                    definition_vi: 'Nghe giả tạo, sáo rỗng, không chân thành.',
                    example: 'Pledges of fiscal restraint rang hollow amid lavish ministerial spending.'
                  }
                }
              },
              {
                id: 'dhbb24-q2',
                number: 5,
                type: 'mcq',
                stem: 'So _______ was the conductor’s interpretation of Mahler’s Ninth Symphony that the audience remained in stunned silence for a full minute.',
                options: [
                  { id: 'A', text: 'spellbinding' },
                  { id: 'B', text: 'crestfallen' },
                  { id: 'C', text: 'lackadaisical' },
                  { id: 'D', text: 'pedestrian' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Inversion with "So + Adj + be + S + that..." & Aesthetic Vocabulary',
                  vi: '"Spellbinding" (mê hoặc, cuốn hút đến mức làm khán giả lặng đi) phù hợp với hệ quả "remained in stunned silence". Các từ còn lại: crestfallen (ủ rũ, thất vọng), lackadaisical (hời hợt, uể oải), pedestrian (tầm thường, tẻ nhạt).',
                  en: '"Spellbinding" means holding one\'s attention completely as though by magic.',
                  optionAnalysis: {
                    A: 'Correct: "spellbinding" = entrancing, mesmerizing.',
                    B: 'Distractor: "crestfallen" = sad and disappointed.',
                    C: 'Distractor: "lackadaisical" = lacking enthusiasm and determination.',
                    D: 'Distractor: "pedestrian" = dull, uninspired.'
                  },
                  vocabItem: {
                    term: 'spellbinding',
                    type: 'C1/C2 Adjective',
                    phonetic: '/ˈspelˌbaɪn.dɪŋ/',
                    definition_en: 'Holding the attention completely as if by a spell; entrancing.',
                    definition_vi: 'Cuốn hút, làm say đắm lòng người.',
                    example: 'She delivered a spellbinding performance as Lady Macbeth.'
                  }
                }
              },
              {
                id: 'dhbb24-q3',
                number: 6,
                type: 'mcq',
                stem: 'Rather than addressing the structural root of inflation, the cabinet’s latest subsidy is merely a _______ measure designed to win votes before autumn.',
                options: [
                  { id: 'A', text: 'stopgap' },
                  { id: 'B', text: 'deadlock' },
                  { id: 'C', text: 'watershed' },
                  { id: 'D', text: 'benchmark' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Compound Noun Modifier ("a stopgap measure / solution")',
                  vi: '"A stopgap measure" = giải pháp tình thế, chắp vá tạm thời (đối lập với "addressing the structural root").',
                  en: 'A "stopgap measure" is a temporary way of dealing with a problem or satisfying a need.',
                  optionAnalysis: {
                    A: 'Correct: "stopgap measure" = temporary, provisional fix.',
                    B: 'Distractor: "deadlock" = stalemate/impasse.',
                    C: 'Distractor: "watershed moment" = critical turning point.',
                    D: 'Distractor: "benchmark" = standard of reference.'
                  },
                  vocabItem: {
                    term: 'stopgap measure',
                    type: 'C1/C2 Collocation',
                    phonetic: '/ˈstɒp.ɡæp ˈmeʒ.ər/',
                    definition_en: 'A temporary or provisional arrangement adopted until a permanent solution is found.',
                    definition_vi: 'Giải pháp tình thế, biện pháp chữa cháy tạm thời.',
                    example: 'Emergency food aid is only a stopgap measure; agricultural reform is essential.'
                  }
                }
              },
              {
                id: 'dhbb24-q4',
                number: 7,
                type: 'mcq',
                stem: 'The veteran detective knew the suspect was lying through his _______, yet she waited patiently for him to contradict his own timeline.',
                options: [
                  { id: 'A', text: 'teeth' },
                  { id: 'B', text: 'gums' },
                  { id: 'C', text: 'lips' },
                  { id: 'D', text: 'throat' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'C1/C2 Idiom ("lie through one’s teeth")',
                  vi: 'Thành ngữ "lie through one’s teeth" = nói dối trắng trợn, không chớp mắt.',
                  en: '"To lie through one\'s teeth" means to tell a blatant, shameless lie.',
                  optionAnalysis: {
                    A: 'Correct: "lie through one\'s teeth" is the fixed English idiom.',
                    B: 'Distractor: Not part of the idiom.',
                    C: 'Distractor: Not part of the idiom.',
                    D: 'Distractor: "lie in one\'s throat" is archaic 16th-century English.'
                  },
                  vocabItem: {
                    term: 'lie through one’s teeth',
                    type: 'C1/C2 Idiom',
                    phonetic: '/laɪ θruː wʌnz tiːθ/',
                    definition_en: 'To tell an outright, shameless lie.',
                    definition_vi: 'Nói dối trắng trợn, nói dối không chớp mắt.',
                    example: 'He stood before the inquiry and lied through his teeth.'
                  }
                }
              }
            ]
          },
          {
            id: 'dhbb24-lex-p2',
            title: 'Part 2: Word Formation (20 pts)',
            instructions: 'Use the correct form of the word in brackets to complete each sentence.',
            questions: [
              {
                id: 'dhbb24-wf1',
                number: 8,
                type: 'word_formation',
                stem: 'The regime’s systematic _______ of independent journalists drew swift condemnation from international human rights observers. (INTIMIDATE)',
                rootWord: 'INTIMIDATE',
                answer: 'intimidation',
                acceptedAnswers: ['intimidation'],
                points: 2,
                explanation: {
                  rule: 'Nominalization after Possessive + Adjective ("systematic + N + of")',
                  vi: 'Giữa tính từ "systematic" và giới từ "of" cần một danh từ trừu tượng: INTIMIDATE -> INTIMIDATION (sự đe dọa, uy hiếp có hệ thống).',
                  en: 'Requires the abstract noun "intimidation" modified by the adjective "systematic".'
                }
              },
              {
                id: 'dhbb24-wf2',
                number: 9,
                type: 'word_formation',
                stem: 'Although the startup’s valuation soared, veteran analysts warned that its business model was fundamentally _______ in a high-interest-rate environment. (SUSTAIN)',
                rootWord: 'SUSTAIN',
                answer: 'unsustainable',
                acceptedAnswers: ['unsustainable'],
                points: 2,
                explanation: {
                  rule: 'Contrastive Clause ("Although ... warned that ...") -> Negative Adjective',
                  vi: 'Mệnh đề nhượng bộ "Although valuation soared" đối lập với lời cảnh báo "warned that...", nên sau trạng từ "fundamentally" cần tính từ mang nghĩa phủ định: UNSUSTAINABLE (không bền vững).',
                  en: 'The contrast between soaring valuation and analysts\' warnings dictates the negative adjective "unsustainable".'
                }
              }
            ]
          }
        ]
      },
      reading: {
        title: 'III. READING COMPREHENSION (50 points)',
        parts: [
          {
            id: 'dhbb24-read-p1',
            title: 'Part 1: Academic Reading — Linguistic Relativity & Temporal Cognition',
            instructions: 'Read the passage and answer the questions below.',
            passageTitle: 'Spatial Metaphors of Time Across Cultures',
            passage: `<p id="p1">For decades, cognitive science operated under the universalist assumption that all human minds map time along a sagittal axis—envisioning the future ahead of the ego and the past behind it. However, fieldwork conducted among the Aymara indigenous community of the Andean highlands overturned this orthodoxy. In Aymara, the word for "front" or "eye" (<em>nayra</em>) designates the past, whereas "back" or "behind" (<em>qhipa</em>) refers to the future. Crucially, this linguistic inversion is not merely a dead metaphor: gesture studies demonstrate that Aymara speakers spontaneously point forward when recounting ancestral history and backward when discussing tomorrow’s harvest.</p>
<p id="p2">The epistemological logic underlying the Aymara framework is rooted in evidentiality—a grammatical requirement in their language to mark whether a speaker has personally witnessed an event. Because the past is known and visually experienced, it stands in full view before the observer’s eyes; the future, being unseen and uncertain, lies behind one’s back. Even more remarkably, speakers of Kuuk Thaayorre, an Aboriginal Australian community in Pormpuraaw, do not use ego-relative terms like "left" or "right" at all. Instead, they reckon space and time using cardinal directions—ordering temporal sequences from east to west regardless of which direction their body happens to be facing.</p>`,
            questions: [
              {
                id: 'dhbb24-r1',
                number: 10,
                type: 'mcq',
                stem: 'Why do Aymara speakers conceptualize the past as being in front of them?',
                options: [
                  { id: 'A', text: 'Because their calendar is cyclical rather than linear.' },
                  { id: 'B', text: 'Because past events have been witnessed and are therefore known, standing "in view" of the speaker.' },
                  { id: 'C', text: 'Because they walk backward during traditional ceremonial processions.' },
                  { id: 'D', text: 'Because their language lacks grammatical tenses for future events.' }
                ],
                answer: 'B',
                evidenceQuote: 'Because the past is known and visually experienced, it stands in full view before the observer’s eyes; the future, being unseen and uncertain, lies behind one’s back.',
                points: 2,
                explanation: {
                  rule: 'Causal Explanation in Cross-Cultural Linguistics',
                  vi: 'Đoạn 2 giải thích rõ: tiếng Aymara đặt nặng tính bằng chứng (evidentiality); vì quá khứ đã biết và đã chứng kiến tận mắt nên nó nằm ngay trước mắt ("in full view before the observer’s eyes"), còn tương lai chưa thấy nên nằm sau lưng.',
                  en: 'Paragraph 2 explicitly links this to evidentiality: the past is known and visually experienced, so it stands in view before the eyes.'
                }
              },
              {
                id: 'dhbb24-r2',
                number: 11,
                type: 'tfng',
                stem: 'Kuuk Thaayorre speakers arrange temporal sequences from left to right depending on the orientation of their bodies.',
                options: [
                  { id: 'TRUE', text: 'TRUE' },
                  { id: 'FALSE', text: 'FALSE' },
                  { id: 'NOT GIVEN', text: 'NOT GIVEN' }
                ],
                answer: 'FALSE',
                evidenceQuote: 'speakers of Kuuk Thaayorre, an Aboriginal Australian community in Pormpuraaw, do not use ego-relative terms like "left" or "right" at all. Instead, they reckon space and time using cardinal directions—ordering temporal sequences from east to west regardless of which direction their body happens to be facing.',
                points: 2,
                explanation: {
                  rule: 'TRUE / FALSE / NOT GIVEN — Explicit Negation',
                  vi: 'Đoạn 2 nêu rõ người Kuuk Thaayorre hoàn toàn không dùng khái niệm trái/phải theo cơ thể ("do not use ego-relative terms like left or right at all"), mà sắp xếp chuỗi thời gian từ Đông sang Tây bất kể cơ thể quay hướng nào.',
                  en: 'Directly contradicts the passage, which states they order time from east to west regardless of body orientation.'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. WRITING & SENTENCE TRANSFORMATION (60 points)',
        parts: [
          {
            id: 'dhbb24-wrt-st',
            title: 'Part 0: Sentence Transformation',
            instructions: 'Rewrite each sentence using the word in capitals without changing its form.',
            questions: [
              {
                id: 'dhbb24-st1',
                number: 12,
                type: 'sentence_transformation',
                stem: 'The young pianist’s performance was so extraordinary that the critics ran out of superlatives to praise her. (BEGGARED)',
                keyword: 'BEGGARED',
                promptPrefix: 'The young pianist’s extraordinary performance',
                answer: 'The young pianist’s extraordinary performance beggared description among the critics.',
                acceptedAnswers: [
                  "The young pianist's extraordinary performance beggared description among the critics.",
                  "The young pianist’s extraordinary performance beggared description among the critics.",
                  "The young pianist's extraordinary performance beggared description.",
                  "The young pianist’s extraordinary performance beggared description.",
                  "The young pianist's extraordinary performance beggared belief."
                ],
                points: 2,
                explanation: {
                  rule: 'C2 Idiom ("beggar description / beggar belief")',
                  vi: 'Thành ngữ "beggar description" = quá tuyệt vời/phi thường đến mức không lời lẽ nào tả xiết.',
                  en: '"To beggar description" means to be too extraordinary to be described adequately in words.',
                  vocabItem: {
                    term: 'beggar description / belief',
                    type: 'C2 Idiom',
                    phonetic: '/ˈbeɡ.ər dɪˈskrɪp.ʃən/',
                    definition_en: 'To be too extraordinary, shocking, or wonderful to be believed or described.',
                    definition_vi: 'Không lời nào tả xiết, vượt quá sức tưởng tượng.',
                    example: 'The sheer scale of the archaeological discovery beggared description.'
                  }
                }
              }
            ]
          },
          {
            id: 'dhbb24-wrt-essay',
            partType: 'essay',
            title: 'Academic Essay Writing (350 words)',
            instructions: 'Write an essay of 350 words on the following topic:',
            prompt: 'Some sociologists contend that urban gentrification revitalizes decaying neighborhoods and boosts municipal tax revenues, whereas critics argue it erodes cultural authenticity and displaces vulnerable communities. Discuss both views and give your own opinion.',
            minWords: 300,
            maxWords: 400,
            points: 30
          }
        ]
      }
    }
  },

  // =========================================================================
  // EXAM 3: TRẠI HÈ HÙNG VƯƠNG (HUNG VUONG SUMMER CAMP 2024)
  // =========================================================================
  {
    id: 'hungvuong-2024-cvp',
    title: 'Kỳ thi Olympic Trại hè Hùng Vương lần thứ XVIII (Hung Vuong Summer Camp 2024)',
    tournament: 'Trại hè Hùng Vương',
    year: 2024,
    province_school: 'THPT Chuyên Vĩnh Phúc & Chuyên Hùng Vương Phú Thọ',
    grade_level: 'Khối 11 Chuyên Anh',
    duration_minutes: 180,
    difficulty: 'C1-C2',
    tags: ['Trại hè Hùng Vương', 'Phrasal Verbs', 'Open Cloze', 'Word Formation'],
    sections: {
      listening: {
        title: 'I. LISTENING (50 points)',
        parts: [
          {
            id: 'hv24-list-p1',
            title: 'Part 1: Lecture on Behavioral Economics — The Sunk Cost Fallacy',
            instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
            audioUrl: '',
            dictationWords: ['irrecoverable', 'rationality', 'escalation', 'aversion', 'prestigious'],
            transcript: `Professor: In neoclassical economic theory, rational agents make decisions solely on the basis of prospective marginal utility, disregarding historical expenditures that can no longer be retrieved. In empirical reality, however, both individuals and sovereign governments routinely succumb to the sunk cost fallacy—continuing to pour capital into failing enterprises merely because substantial resources have already been committed. Behavioral psychologists attribute this irrational escalation of commitment primarily to loss aversion and a desire to avoid public admission of error. In corporate boards, abandoning a prestigious mega-project is often perceived as career suicide, prompting executives to throw good money after bad.`,
            questions: [
              {
                id: 'hv24-l1',
                number: 1,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Neoclassical theory assumes decision-makers focus exclusively on future _______.',
                answer: 'marginal utility',
                acceptedAnswers: ['marginal utility'],
                evidenceQuote: 'rational agents make decisions solely on the basis of prospective marginal utility',
                points: 2,
                explanation: {
                  rule: 'Economic Terminology Extraction',
                  vi: '"solely on the basis of prospective marginal utility" = "exclusively on future marginal utility". Đáp án là "marginal utility".',
                  en: '"prospective" = "future"; the 2-word target is "marginal utility".'
                }
              },
              {
                id: 'hv24-l2',
                number: 2,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Psychologists link this behavior to _______ and fear of admitting failure publicly.',
                answer: 'loss aversion',
                acceptedAnswers: ['loss aversion'],
                evidenceQuote: 'Behavioral psychologists attribute this irrational escalation of commitment primarily to loss aversion and a desire to avoid public admission of error.',
                points: 2,
                explanation: {
                  rule: 'Paraphrase ("attribute ... to" = "link ... to")',
                  vi: 'Các nhà tâm lý học hành vi quy hiện tượng này cho "loss aversion" (tâm lý ác cảm với mất mát).',
                  en: 'Directly matches "loss aversion".'
                }
              }
            ]
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'hv24-lex-p1',
            title: 'Part 1: Multiple Choice & Idiomatic Expressions',
            instructions: 'Choose the best option (A, B, C, or D).',
            questions: [
              {
                id: 'hv24-q1',
                number: 3,
                type: 'mcq',
                stem: 'After three consecutive quarters of operating losses, the airline was forced to _______ several unprofitable transpacific routes.',
                options: [
                  { id: 'A', text: 'axe' },
                  { id: 'B', text: 'saw' },
                  { id: 'C', text: 'chisel' },
                  { id: 'D', text: 'hammer' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Journalistic C1/C2 Verbs ("axe jobs / routes / budgets")',
                  vi: 'Động từ "axe" (cắt bỏ thẳng tay một khoản ngân sách, tuyến bay, chương trình hoặc nhân sự) rất phổ biến trong văn phong báo chí/kinh tế C1/C2.',
                  en: '"To axe" means to cancel, terminate, or drastically cut a service, route, or budget.',
                  optionAnalysis: {
                    A: 'Correct: "axe routes/jobs/programs" = abruptly cancel or eliminate them.',
                    B: 'Distractor: Does not mean cancel a route.',
                    C: 'Distractor: Means to carve or cheat someone out of something.',
                    D: 'Distractor: "hammer out a deal" means negotiate, not cancel.'
                  },
                  vocabItem: {
                    term: 'axe (routes / jobs / expenditure)',
                    type: 'C1/C2 Verb',
                    phonetic: '/æks/',
                    definition_en: 'To ruthlessly cancel, terminate, or eliminate a project, service, or workforce.',
                    definition_vi: 'Cắt bỏ thẳng tay (ngân sách, tuyến đường, việc làm).',
                    example: 'The network decided to axe the drama series after disappointing ratings.'
                  }
                }
              },
              {
                id: 'hv24-q2',
                number: 4,
                type: 'mcq',
                stem: 'The opposition leader’s fiery speech really set the _______ among the pigeons, provoking immediate resignations from two cabinet ministers.',
                options: [
                  { id: 'A', text: 'cat' },
                  { id: 'B', text: 'fox' },
                  { id: 'C', text: 'hawk' },
                  { id: 'D', text: 'wolf' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Animal Idioms ("set/put the cat among the pigeons")',
                  vi: 'Thành ngữ "put/set the cat among the pigeons" = làm náo loạn, gây chấn động và hoang mang lớn bằng một lời nói hay hành động bất ngờ.',
                  en: '"Set/put the cat among the pigeons" means to say or do something that causes fierce controversy, alarm, or upheaval.',
                  optionAnalysis: {
                    A: 'Correct: Fixed idiom "set the cat among the pigeons".',
                    B: 'Distractor: Confused with "set a fox to keep the geese".',
                    C: 'Distractor: Not part of the idiom.',
                    D: 'Distractor: Confused with "a wolf in sheep\'s clothing".'
                  },
                  vocabItem: {
                    term: 'put/set the cat among the pigeons',
                    type: 'C2 Idiom',
                    phonetic: '/set ðə kæt əˈmʌŋ ðə ˈpɪdʒ.ənz/',
                    definition_en: 'To do or say something that causes trouble, alarm, and controversy.',
                    definition_vi: 'Gây xôn xao, náo loạn dư luận.',
                    example: 'Her leaked memo really put the cat among the pigeons at headquarters.'
                  }
                }
              },
              {
                id: 'hv24-q3',
                number: 5,
                type: 'mcq',
                stem: 'Try as he might to appear nonchalant, the tremor in his voice _______ his underlying trepidation.',
                options: [
                  { id: 'A', text: 'betrayed' },
                  { id: 'B', text: 'treasoned' },
                  { id: 'C', text: 'defected' },
                  { id: 'D', text: 'forfeited' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Secondary C2 Meaning of Common Verbs ("betray" = unintentionally reveal)',
                  vi: 'Nghĩa C2 rất hay gặp của "betray": vô tình để lộ ra (cảm xúc, sự lo lắng, nguồn gốc) dù cố giấu ("betray one’s anxiety/trepidation/emotion").',
                  en: 'In literary and academic English, "betray" means to unintentionally reveal a hidden emotion or quality.',
                  optionAnalysis: {
                    A: 'Correct: "betray" = unintentionally reveal a feeling one is trying to conceal.',
                    B: 'Distractor: "treason" is a noun.',
                    C: 'Distractor: "defect" is intransitive (defect to another country).',
                    D: 'Distractor: "forfeit" means lose a right or asset as a penalty.'
                  },
                  vocabItem: {
                    term: 'betray (an emotion / nervousness / ignorance)',
                    type: 'C2 Literary Verb',
                    phonetic: '/bɪˈtreɪ/',
                    definition_en: 'To unintentionally reveal a secret feeling, quality, or deficiency.',
                    definition_vi: 'Vô tình để lộ ra (cảm xúc, sự lo lắng đang cố giấu).',
                    example: 'His stony expression betrayed no hint of remorse.'
                  }
                }
              }
            ]
          },
          {
            id: 'hv24-lex-p2',
            title: 'Part 2: Word Formation',
            instructions: 'Provide the correct derived form of the word in brackets.',
            questions: [
              {
                id: 'hv24-wf1',
                number: 6,
                type: 'word_formation',
                stem: 'The treaty’s ambiguous wording left room for _______ by belligerent states seeking a pretext for intervention. (INTERPRET)',
                rootWord: 'INTERPRET',
                answer: 'misinterpretation',
                acceptedAnswers: ['misinterpretation', 'misinterpretations'],
                points: 2,
                explanation: {
                  rule: 'Pejorative Prefix "mis-" + Nominal Suffix "-ation"',
                  vi: '"Ambiguous wording" (cách diễn đạt mơ hồ) tạo kẽ hở cho sự hiểu sai/diễn giải sai lệch có chủ đích ("misinterpretation") bởi các quốc gia hiếu chiến.',
                  en: 'Ambiguous wording exploited for a pretext implies "misinterpretation".'
                }
              }
            ]
          }
        ]
      },
      reading: {
        title: 'III. READING COMPREHENSION (50 points)',
        parts: [
          {
            id: 'hv24-read-p1',
            title: 'Part 1: Open Cloze — The History of Cartographic Projection',
            instructions: 'Fill each numbered blank with ONE suitable word.',
            passageTitle: 'Mercator’s Geometry and Geopolitical Perception',
            passage: `Every flat map of a spherical planet is, by mathematical necessity, a compromise. When the Flemish geographer Gerardus Mercator unveiled his cylindrical projection in 1569, his primary objective was nautical utility: a straight line drawn anywhere [[7]] his chart corresponded to a line of constant compass bearing. Yet this navigational triumph came at the [[8]] of extreme areal distortion toward the poles, making Greenland appear comparable in landmass to Africa, [[9]] in reality the African continent is fourteen times larger.`,
            questions: [
              {
                id: 'hv24-oc1',
                number: 7,
                type: 'open_cloze',
                blankNumber: 7,
                stem: 'Blank (7): "...a straight line drawn anywhere ___ his chart..."',
                answer: 'on',
                acceptedAnswers: ['on', 'across'],
                evidenceQuote: 'a straight line drawn anywhere [[7]] his chart corresponded to a line of constant compass bearing.',
                points: 2,
                explanation: {
                  rule: 'Preposition of Surface ("on/across a chart/map")',
                  vi: 'Vẽ một đường thẳng trên bản đồ/hải đồ dùng giới từ "on" (hoặc "across").',
                  en: 'Collocates with "chart": "drawn anywhere on his chart".'
                }
              },
              {
                id: 'hv24-oc2',
                number: 8,
                type: 'open_cloze',
                blankNumber: 8,
                stem: 'Blank (8): "Yet this navigational triumph came at the ___ of extreme areal distortion..."',
                answer: 'expense',
                acceptedAnswers: ['expense', 'cost'],
                evidenceQuote: 'Yet this navigational triumph came at the [[8]] of extreme areal distortion toward the poles',
                points: 2,
                explanation: {
                  rule: 'Idiomatic Prepositional Phrase ("at the expense/cost of")',
                  vi: 'Cụm cố định "come at the expense/cost of sth" = phải trả giá bằng cái gì / đánh đổi bằng cái gì.',
                  en: '"At the expense/cost of" means achieved by sacrificing something else.'
                }
              },
              {
                id: 'hv24-oc3',
                number: 9,
                type: 'open_cloze',
                blankNumber: 9,
                stem: 'Blank (9): "...comparable in landmass to Africa, ___ in reality the African continent is fourteen times larger."',
                answer: 'whereas',
                acceptedAnswers: ['whereas', 'while', 'whilst'],
                evidenceQuote: 'making Greenland appear comparable in landmass to Africa, [[9]] in reality the African continent is fourteen times larger.',
                points: 2,
                explanation: {
                  rule: 'Contrastive Conjunction ("whereas / while / whilst")',
                  vi: 'Liên từ chỉ sự tương phản giữa vẻ bề ngoài trên bản đồ và thực tế địa lý: "whereas / while / whilst".',
                  en: 'Introduces a clause of direct factual contrast.'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. WRITING & SENTENCE TRANSFORMATION (60 points)',
        parts: [
          {
            id: 'hv24-wrt-st',
            title: 'Part 0: Sentence Transformation',
            instructions: 'Complete the second sentence so that it has a similar meaning to the first.',
            questions: [
              {
                id: 'hv24-st1',
                number: 10,
                type: 'sentence_transformation',
                stem: 'Rumors of the merger began circulating the moment the two chief executives were spotted dining together. (SOONER)',
                keyword: 'SOONER',
                promptPrefix: 'No sooner had the two chief executives',
                answer: 'No sooner had the two chief executives been spotted dining together than rumors of the merger began circulating.',
                acceptedAnswers: [
                  'No sooner had the two chief executives been spotted dining together than rumors of the merger began circulating.',
                  'No sooner had the two chief executives been spotted dining together than rumours of the merger began circulating.'
                ],
                points: 2,
                explanation: {
                  rule: 'Passive Past Perfect Inversion ("No sooner had + S + been + V3/ed + than + S + V2/ed")',
                  vi: 'Cấu trúc "the moment..." chuyển sang đảo ngữ "No sooner had + S + been V3 (bị động quá khứ hoàn thành) + than + S + V2".',
                  en: 'Combines "No sooner ... than" inversion with the passive past perfect ("had ... been spotted").'
                }
              }
            ]
          },
          {
            id: 'hv24-wrt-essay',
            partType: 'essay',
            title: 'Academic Essay Writing (350 words)',
            instructions: 'Write an essay of about 350 words:',
            prompt: 'To what extent should scientific research funding be dictated by immediate commercial and societal utility rather than pure, curiosity-driven inquiry?',
            minWords: 300,
            maxWords: 400,
            points: 30
          }
        ]
      }
    }
  },

  // =========================================================================
  // EXAM 4: OLYMPIC TRUYỀN THỐNG 30/4 (APRIL 30TH TRADITIONAL OLYMPIAD)
  // =========================================================================
  {
    id: 'olympic304-2024-lhp',
    title: 'Kỳ thi Olympic Truyền thống 30/4 lần thứ XXVIII (THPT Chuyên Lê Hồng Phong TP.HCM)',
    tournament: 'Olympic 30/4',
    year: 2024,
    province_school: 'THPT Chuyên Lê Hồng Phong TP.HCM',
    grade_level: 'Khối 11 Chuyên Anh',
    duration_minutes: 180,
    difficulty: 'C2 (Mastery)',
    tags: ['Olympic 30/4', 'Hardcore Lexico-Grammar', 'Sentence Transformation', 'Word Formation'],
    sections: {
      listening: {
        title: 'I. LISTENING (40 points)',
        parts: [
          {
            id: 'ol304-list-p1',
            title: 'Part 1: Archival Conservation & Palimpsest Imaging',
            instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
            audioUrl: '',
            dictationWords: ['palimpsest', 'parchment', 'multispectral', 'ultraviolet', 'antiquity'],
            transcript: `Curator: During the early Middle Ages, vellum parchment was so scarce and labor-intensive to manufacture that monastic scribes routinely scraped and washed existing manuscripts with weak acid so the animal skin could be reused. Such a recycled manuscript is known as a palimpsest. For centuries, nineteenth-century philologists applied destructive chemical reagents that permanently stained the parchment in desperate attempts to read the erased undertext. Today, however, non-invasive multispectral imaging illuminates the folio under narrow bands of ultraviolet and infrared light, causing trace iron-gall ink residues from antiquity to fluoresce vividly without harming a single fiber.`,
            questions: [
              {
                id: 'ol304-l1',
                number: 1,
                type: 'note_completion',
                maxWords: 1,
                stem: 'A manuscript whose original text was scraped off for reuse is called a _______.',
                answer: 'palimpsest',
                acceptedAnswers: ['palimpsest'],
                evidenceQuote: 'Such a recycled manuscript is known as a palimpsest.',
                points: 2,
                explanation: {
                  rule: 'Term Definition Extraction',
                  vi: 'Bản thảo viết trên giấy da cạo đi tái sử dụng được gọi là "palimpsest".',
                  en: 'Explicitly defined in the transcript: "known as a palimpsest".'
                }
              },
              {
                id: 'ol304-l2',
                number: 2,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Modern conservators recover erased texts safely using _______.',
                answer: 'multispectral imaging',
                acceptedAnswers: ['multispectral imaging', 'non-invasive multispectral imaging'],
                evidenceQuote: 'Today, however, non-invasive multispectral imaging illuminates the folio under narrow bands of ultraviolet and infrared light',
                points: 2,
                explanation: {
                  rule: 'Method Identification',
                  vi: 'Phương pháp hiện đại không xâm lấn giúp đọc lại chữ cổ bị xóa là "multispectral imaging" (chụp ảnh đa phổ).',
                  en: 'Matches "non-invasive multispectral imaging".'
                }
              }
            ]
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (60 points — Classic Olympic 30/4 Intensive)',
        parts: [
          {
            id: 'ol304-lex-p1',
            title: 'Part 1: Multiple Choice (Grammar, Phrasal Verbs, Idioms & Rare Vocabulary)',
            instructions: 'Choose the best option (A, B, C, or D) to complete each sentence.',
            questions: [
              {
                id: 'ol304-q1',
                number: 3,
                type: 'mcq',
                stem: 'The newly appointed dean is a strict disciplinarian who insists that every faculty member _______ by the letter of the academic code.',
                options: [
                  { id: 'A', text: 'abide' },
                  { id: 'B', text: 'abides' },
                  { id: 'C', text: 'abided' },
                  { id: 'D', text: 'abiding' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Mandative Subjunctive ("insist that + S + V_bare") + "abide by"',
                  vi: 'Động từ "insist" mang nghĩa yêu cầu/đòi hỏi (mandative) nên mệnh đề sau "that" dùng Bàng thái cách hiện tại (Present Subjunctive): động từ nguyên thể không chia ("abide") cho dù chủ ngữ "every faculty member" là ngôi thứ 3 số ít. Ngoài ra "abide by the letter of the law/code" = tuân thủ nghiêm ngặt từng chữ của quy định.',
                  en: 'After "insists that" expressing a demand, the mandative subjunctive requires the bare infinitive "abide".',
                  optionAnalysis: {
                    A: 'Correct: Bare infinitive "abide" in the mandative subjunctive clause.',
                    B: 'Distractor: Indicative "-s" form; rejected in formal C2 grammar exams testing mandative subjunctive.',
                    C: 'Distractor: Past tense is incompatible with present demand.',
                    D: 'Distractor: Participle cannot serve as the finite verb of the "that"-clause.'
                  },
                  vocabItem: {
                    term: 'abide by the letter of the law',
                    type: 'C2 Idiomatic Collocation',
                    phonetic: '/əˈbaɪd baɪ ðə ˈlet.ər/',
                    definition_en: 'To obey the exact literal wording of a rule or law strictly.',
                    definition_vi: 'Tuân thủ từng câu từng chữ của luật định.',
                    example: 'Auditors insisted that the subsidiary abide by the letter of the tax code.'
                  }
                }
              },
              {
                id: 'ol304-q2',
                number: 4,
                type: 'mcq',
                stem: 'When the investigative committee questioned the treasurer about the missing endowment funds, he began to _______ and change his story.',
                options: [
                  { id: 'A', text: 'equivocate' },
                  { id: 'B', text: 'pontificate' },
                  { id: 'C', text: 'prognosticate' },
                  { id: 'D', text: 'venerate' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'High-Register C2 Verbs ending in "-ate"',
                  vi: '"Equivocate" = nói nước đôi, vòng vo lảng tránh để che giấu sự thật. Các phương án nhiễu: "pontificate" (thuyết giáo kẻ cả), "prognosticate" (tiên đoán), "venerate" (tôn kính).',
                  en: '"Equivocate" means to use ambiguous language so as to conceal the truth or avoid committing oneself.',
                  optionAnalysis: {
                    A: 'Correct: "equivocate" = speak evasively or ambiguously to hide the truth.',
                    B: 'Distractor: "pontificate" = express opinions in a pompous and dogmatic way.',
                    C: 'Distractor: "prognosticate" = foretell or prophesy future events.',
                    D: 'Distractor: "venerate" = regard with deep respect or reverence.'
                  },
                  vocabItem: {
                    term: 'equivocate',
                    type: 'C2 Verb',
                    phonetic: '/ɪˈkwɪv.ə.keɪt/',
                    definition_en: 'To use ambiguous or evasive language to conceal the truth or avoid commitment.',
                    definition_vi: 'Nói nước đôi, vòng vo lấp liếm.',
                    example: 'Asked directly whether taxes would rise, the chancellor continued to equivocate.'
                  }
                }
              },
              {
                id: 'ol304-q3',
                number: 5,
                type: 'mcq',
                stem: 'Ever since winning the literary prize, the young novelist has been _______ on his laurels instead of starting his second manuscript.',
                options: [
                  { id: 'A', text: 'resting' },
                  { id: 'B', text: 'sitting' },
                  { id: 'C', text: 'leaning' },
                  { id: 'D', text: 'sleeping' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Classical Idiom ("rest on one’s laurels")',
                  vi: 'Thành ngữ "rest on one’s laurels" = ngủ quên trên chiến thắng, tự mãn với thành tựu quá khứ mà ngừng nỗ lực.',
                  en: '"To rest on one\'s laurels" means to be satisfied with past achievements and stop putting in effort.',
                  optionAnalysis: {
                    A: 'Correct: "rest on one\'s laurels" is the exact idiom.',
                    B: 'Distractor: Incorrect verb for this idiom.',
                    C: 'Distractor: Incorrect verb.',
                    D: 'Distractor: Vietnamese says "ngủ quên trên chiến thắng", but English strictly uses "rest on one\'s laurels"!'
                  },
                  vocabItem: {
                    term: 'rest on one’s laurels',
                    type: 'C1/C2 Idiom',
                    phonetic: '/rest ɒn wʌnz ˈlɒr.əlz/',
                    definition_en: 'To be complacent with past achievements and cease striving for further success.',
                    definition_vi: 'Ngủ quên trên chiến thắng (tự mãn với hào quang cũ).',
                    example: 'Our research team cannot afford to rest on its laurels while competitors innovate.'
                  }
                }
              },
              {
                id: 'ol304-q4',
                number: 6,
                type: 'mcq',
                stem: 'The defense lawyer’s argument was so full of holes that it simply did not hold _______.',
                options: [
                  { id: 'A', text: 'water' },
                  { id: 'B', text: 'ground' },
                  { id: 'C', text: 'weight' },
                  { id: 'D', text: 'air' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Idiom of Logical Validity ("hold water")',
                  vi: 'Thành ngữ "not hold water" = (lập luận, lý lẽ, giả thuyết) không đứng vững, không hợp lý, có nhiều lỗ hổng ("full of holes"). Lưu ý: "carry weight" (có trọng lượng), "stand/hold one’s ground" (giữ vững lập trường).',
                  en: 'An argument or theory that "does not hold water" does not appear reasonable or consistent with the facts.',
                  optionAnalysis: {
                    A: 'Correct: "hold water" = remain logically sound under scrutiny.',
                    B: 'Distractor: We say "hold one\'s ground" (for a person), not "hold ground" for an argument.',
                    C: 'Distractor: The collocation is "carry weight", not "hold weight".',
                    D: 'Distractor: Not an idiom.'
                  },
                  vocabItem: {
                    term: 'not hold water',
                    type: 'C1/C2 Idiom',
                    phonetic: '/nɒt həʊld ˈwɔː.tər/',
                    definition_en: 'Of a theory, excuse, or argument: to fail to stand up to critical examination.',
                    definition_vi: '(Lập luận/lý lẽ) không đứng vững, thiếu thuyết phục.',
                    example: 'His alibi simply does not hold water when compared with CCTV timestamps.'
                  }
                }
              }
            ]
          },
          {
            id: 'ol304-lex-p2',
            title: 'Part 2: Word Formation (Olympic 30/4 Signature Style)',
            instructions: 'Give the correct form of the words in brackets.',
            questions: [
              {
                id: 'ol304-wf1',
                number: 7,
                type: 'word_formation',
                stem: 'The rebel commander was tried in absentia for _______ after inciting troops to mutiny against the provisional government. (SEDITIOUS)',
                rootWord: 'SEDITIOUS',
                answer: 'sedition',
                acceptedAnswers: ['sedition'],
                points: 2,
                explanation: {
                  rule: 'Adjective-to-Noun Back-Derivation ("seditious" -> "sedition")',
                  vi: 'Sau giới từ "for" (bị xét xử vì tội danh gì) cần một danh từ chỉ tội danh: SEDITIOUS (tính từ: xúi giục nổi loạn) -> SEDITION (danh từ: tội xúi giục phản loạn/lật đổ).',
                  en: '"tried ... for [crime]" requires the noun form "sedition" derived from the adjective "seditious".',
                  vocabItem: {
                    term: 'sedition',
                    type: 'C2 Legal/Political Noun',
                    phonetic: '/sɪˈdɪʃ.ən/',
                    definition_en: 'Conduct or speech inciting people to rebel against the authority of a state.',
                    definition_vi: 'Tội xúi giục nổi loạn, kích động chống chính quyền.',
                    example: 'Colonial pamphleteers were frequently arrested on charges of sedition.'
                  }
                }
              },
              {
                id: 'ol304-wf2',
                number: 8,
                type: 'word_formation',
                stem: 'Her _______ memory allowed her to recall verbatim entire pages of seventeenth-century legal statutes. (PHOTOGRAPH)',
                rootWord: 'PHOTOGRAPH',
                answer: 'photographic',
                acceptedAnswers: ['photographic'],
                points: 2,
                explanation: {
                  rule: 'Collocational Adjective ("photographic memory")',
                  vi: 'Collocation: "photographic memory" (trí nhớ siêu phàm như chụp ảnh).',
                  en: '"Photographic memory" (eidetic memory) is the standard collocation.'
                }
              }
            ]
          }
        ]
      },
      reading: {
        title: 'III. READING COMPREHENSION (40 points)',
        parts: [
          {
            id: 'ol304-read-p1',
            title: 'Part 1: Critical Reading — The Aesthetics of Ruins',
            instructions: 'Read the passage and answer the questions.',
            passageTitle: 'Romanticism and the Cult of Architectural Decay',
            passage: `<p id="p1">During the eighteenth century, European sensibility underwent a profound aesthetic reorientation regarding architectural decay. Where Renaissance humanists had viewed Roman ruins primarily as philological puzzles—quarries of fragmented inscriptions from which intact classical proportions might be mathematically reconstructed—Eighteenth-Century Romanticism celebrated the ruin precisely for its incompleteness. In the paintings of Hubert Robert and the engravings of Piranesi, encroaching ivy and fractured colonnades were no longer blemishes to be mentally erased, but sublime emblems of nature’s inexorable triumph over imperial hubris.</p>`,
            questions: [
              {
                id: 'ol304-r1',
                number: 9,
                type: 'mcq',
                stem: 'How did Eighteenth-Century Romantics differ from Renaissance humanists in their attitude toward ancient ruins?',
                options: [
                  { id: 'A', text: 'Romantics valued the fragmented, decaying state itself as a symbol of nature’s power over human ambition.' },
                  { id: 'B', text: 'Romantics sought to demolish ivy-covered ruins to build modern neoclassical parliaments.' },
                  { id: 'C', text: 'Renaissance humanists refused to study Roman inscriptions for religious reasons.' },
                  { id: 'D', text: 'Romantics used mathematical formulas to rebuild fallen colonnades.' }
                ],
                answer: 'A',
                evidenceQuote: 'Eighteenth-Century Romanticism celebrated the ruin precisely for its incompleteness... encroaching ivy and fractured colonnades were no longer blemishes to be mentally erased, but sublime emblems of nature’s inexorable triumph over imperial hubris.',
                points: 2,
                explanation: {
                  rule: 'Historical Contrast in Art Criticism',
                  vi: 'Trào lưu Lãng mạn thế kỷ 18 tôn vinh phế tích chính vì sự dang dở/đổ nát của nó ("celebrated the ruin precisely for its incompleteness") như biểu tượng cho chiến thắng tất yếu của tự nhiên trước sự ngạo mạn của đế chế.',
                  en: 'Matches "celebrated the ruin precisely for its incompleteness... sublime emblems of nature\'s inexorable triumph over imperial hubris".'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. SENTENCE TRANSFORMATION & WRITING (60 points)',
        parts: [
          {
            id: 'ol304-wrt-st',
            title: 'Part 0: Classic Olympic 30/4 Sentence Transformation',
            instructions: 'Rewrite the sentences using the given words without changing their form.',
            questions: [
              {
                id: 'ol304-st1',
                number: 10,
                type: 'sentence_transformation',
                stem: 'It is completely pointless to try to persuade the chairman once he has made up his mind. (BREATH)',
                keyword: 'BREATH',
                promptPrefix: 'You are',
                answer: 'You are wasting your breath trying to persuade the chairman once he has made up his mind.',
                acceptedAnswers: [
                  'You are wasting your breath trying to persuade the chairman once he has made up his mind.',
                  'You are wasting your breath in trying to persuade the chairman once he has made up his mind.',
                  'You are just wasting your breath trying to persuade the chairman once he has made up his mind.'
                ],
                points: 2,
                explanation: {
                  rule: 'Idiom ("waste one’s breath [doing sth]")',
                  vi: 'Thành ngữ "waste one’s breath (doing sth)" = tốn nước bọt, phí lời vô ích khi cố thuyết phục ai.',
                  en: '"Waste one\'s breath" means to speak or argue to no avail.',
                  vocabItem: {
                    term: 'waste one’s breath',
                    type: 'C1/C2 Idiom',
                    phonetic: '/weɪst wʌnz breθ/',
                    definition_en: 'To talk or try to persuade someone in vain because they will not listen.',
                    definition_vi: 'Tốn nước bọt, phí lời vô ích.',
                    example: 'Save your energy—you’re wasting your breath trying to reason with him.'
                  }
                }
              },
              {
                id: 'ol304-st2',
                number: 11,
                type: 'sentence_transformation',
                stem: 'Whatever happens, you must never disclose the encryption keys to unauthorized personnel. (CIRCUMSTANCES)',
                keyword: 'CIRCUMSTANCES',
                promptPrefix: 'Under no',
                answer: 'Under no circumstances must you disclose the encryption keys to unauthorized personnel.',
                acceptedAnswers: [
                  'Under no circumstances must you disclose the encryption keys to unauthorized personnel.',
                  'Under no circumstances should you disclose the encryption keys to unauthorized personnel.',
                  'Under no circumstances are you to disclose the encryption keys to unauthorized personnel.',
                  'Under no circumstances must you ever disclose the encryption keys to unauthorized personnel.'
                ],
                points: 2,
                explanation: {
                  rule: 'Negative Prepositional Phrase Inversion ("Under no circumstances + must/should/are + S + V")',
                  vi: 'Cấu trúc đảo ngữ nhấn mạnh sự cấm đoán tuyệt đối: "Under no circumstances + must/should + S + V_inf" (Dưới bất kỳ hoàn cảnh nào cũng tuyệt đối không được...).',
                  en: 'Fronting "Under no circumstances" triggers subject-auxiliary inversion.'
                }
              }
            ]
          },
          {
            id: 'ol304-wrt-essay',
            partType: 'essay',
            title: 'Academic Essay Writing (350 words)',
            instructions: 'Write an essay of about 350 words:',
            prompt: '"Historical monuments and artifacts acquired during the colonial era should be unconditionally repatriated to their countries of origin, even if doing so fragments universal encyclopedic museums." Discuss this statement and give your opinion.',
            minWords: 300,
            maxWords: 400,
            points: 30
          }
        ]
      }
    }
  },

  // =========================================================================
  // EXAM 5: ĐỀ CHỌN ĐỘI TUYỂN CHUYÊN HÀ NỘI - AMSTERDAM 2025
  // =========================================================================
  {
    id: 'ams-selection-2025',
    title: 'Đề thi Chọn Đội tuyển Dự thi HSGQG 2025 — THPT Chuyên Hà Nội - Amsterdam',
    tournament: 'Đề Chọn Đội Tuyển',
    year: 2025,
    province_school: 'THPT Chuyên Hà Nội - Amsterdam',
    grade_level: 'Đội tuyển HSGQG (Lớp 12)',
    duration_minutes: 180,
    difficulty: 'C2 (CPE)',
    tags: ['Chuyên Ams', 'Đề Chọn Đội Tuyển', 'Bioethics', 'C2 Writing'],
    sections: {
      listening: {
        title: 'I. LISTENING (50 points)',
        parts: [
          {
            id: 'ams25-list-p1',
            title: 'Part 1: Bioethics Symposium — CRISPR Germline Editing',
            instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
            audioUrl: '',
            dictationWords: ['somatic', 'heritable', 'mosaicism', 'eugenic', 'moratorium'],
            transcript: `Dr. Aris: In contemporary bioethics, a sharp demarcation is drawn between somatic gene therapy and germline modification. Somatic interventions target non-reproductive tissues in consenting patients, meaning any genetic alterations die with the individual. Germline editing, by contrast, introduces heritable changes into early-stage embryos, thereby altering the human gene pool across subsequent generations. Beyond technical hazards such as off-target mutations and genetic mosaicism, sociologists warn that commercialized germline enhancement could precipitate a eugenic stratification of society. Consequently, an international coalition of geneticists has called for a binding moratorium on clinical germline implantation.`,
            questions: [
              {
                id: 'ams25-l1',
                number: 1,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Unlike somatic therapy, germline editing creates _______ passed down to future descendants.',
                answer: 'heritable changes',
                acceptedAnswers: ['heritable changes'],
                evidenceQuote: 'Germline editing, by contrast, introduces heritable changes into early-stage embryos, thereby altering the human gene pool across subsequent generations.',
                points: 2,
                explanation: {
                  rule: 'Direct Contrast in Scientific Lecture',
                  vi: '"passed down to future descendants" = "across subsequent generations". Cụm danh từ cần điền là "heritable changes" (những biến đổi di truyền được).',
                  en: 'Matches "introduces heritable changes".'
                }
              },
              {
                id: 'ams25-l2',
                number: 2,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Leading geneticists have demanded a _______ on clinical embryo editing.',
                answer: 'binding moratorium',
                acceptedAnswers: ['binding moratorium', 'moratorium'],
                evidenceQuote: 'an international coalition of geneticists has called for a binding moratorium on clinical germline implantation.',
                points: 2,
                explanation: {
                  rule: 'Policy Vocabulary ("binding moratorium")',
                  vi: '"called for" = "demanded"; "binding moratorium" = lệnh tạm đình chỉ có tính ràng buộc pháp lý.',
                  en: '"called for a binding moratorium" matches "demanded a _______".',
                  vocabItem: {
                    term: 'binding moratorium (on sth)',
                    type: 'C2 Policy Collocation',
                    phonetic: '/ˈbaɪn.dɪŋ ˌmɒr.əˈtɔː.ri.əm/',
                    definition_en: 'A legally enforceable temporary prohibition of an activity.',
                    definition_vi: 'Lệnh tạm cấm / đình chỉ có tính ràng buộc.',
                    example: 'The treaty imposed a binding moratorium on deep-sea mineral extraction.'
                  }
                }
              }
            ]
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'ams25-lex-p1',
            title: 'Part 1: Multiple Choice',
            instructions: 'Choose the best option (A, B, C, or D).',
            questions: [
              {
                id: 'ams25-q1',
                number: 3,
                type: 'mcq',
                stem: 'The central bank governor walked a tightrope, trying to curb runaway inflation without _______ the economy into a severe recession.',
                options: [
                  { id: 'A', text: 'tipping' },
                  { id: 'B', text: 'spilling' },
                  { id: 'C', text: 'pouring' },
                  { id: 'D', text: 'dripping' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Macroeconomic Collocation ("tip [the economy] into recession")',
                  vi: 'Collocation kinh tế vĩ mô: "tip the economy/country into recession/crisis" = đẩy nền kinh tế rơi vào suy thoái.',
                  en: '"To tip (something) into recession/chaos" means to cause a delicate situation to cross a threshold into an undesirable state.',
                  optionAnalysis: {
                    A: 'Correct: "tip the economy into recession" is standard macroeconomic usage.',
                    B: 'Distractor: Does not collocate with "into recession".',
                    C: 'Distractor: Incorrect metaphor.',
                    D: 'Distractor: Incorrect metaphor.'
                  },
                  vocabItem: {
                    term: 'tip (sth) into recession / chaos',
                    type: 'C2 Collocation',
                    phonetic: '/tɪp ˈɪn.tuː rɪˈseʃ.ən/',
                    definition_en: 'To push an unstable system over the edge into an economic slump or crisis.',
                    definition_vi: 'Đẩy (nền kinh tế/đất nước) rơi vào suy thoái / hỗn loạn.',
                    example: 'Aggressive rate hikes risked tipping the fragile recovery into recession.'
                  }
                }
              },
              {
                id: 'ams25-q2',
                number: 4,
                type: 'mcq',
                stem: 'His ostensibly generous philanthropy was little more than a _______ attempt to burnish his tarnished reputation before the senate inquiry.',
                options: [
                  { id: 'A', text: 'transparent' },
                  { id: 'B', text: 'translucent' },
                  { id: 'C', text: 'diaphanous' },
                  { id: 'D', text: 'permeable' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Figurative Meaning of "transparent" (easily seen through / obvious excuse or ploy)',
                  vi: 'Nghĩa bóng của "transparent" khi đi với "attempt / ploy / excuse / lie": lộ liễu, dễ dàng bị nhìn thấu âm mưu thực sự. ("Translucent" và "diaphanous" chỉ dùng cho vật chất/vải vóc).',
                  en: 'Figuratively, a "transparent attempt/ploy/excuse" is one whose hidden motive is obvious and easily seen through.',
                  optionAnalysis: {
                    A: 'Correct: "transparent attempt/ploy" = an obvious, easily detected ulterior motive.',
                    B: 'Distractor: "translucent" is strictly physical (allowing light through diffusely).',
                    C: 'Distractor: "diaphanous" describes delicate, sheer fabric.',
                    D: 'Distractor: "permeable" describes membranes or borders allowing liquids/gases through.'
                  }
                }
              }
            ]
          },
          {
            id: 'ams25-lex-p2',
            title: 'Part 2: Word Formation',
            instructions: 'Supply the correct form of the word in brackets.',
            questions: [
              {
                id: 'ams25-wf1',
                number: 5,
                type: 'word_formation',
                stem: 'The documentary exposes the _______ working conditions endured by Cobalt miners in unregulated artisanal pits. (PLORE)',
                rootWord: 'PLORE',
                answer: 'deplorable',
                acceptedAnswers: ['deplorable'],
                points: 2,
                explanation: {
                  rule: 'Prefix "de-" + Root "plore" + Adjective Suffix "-able"',
                  vi: 'Từ gốc PLORE (trong implore, explore, deplore) kết hợp với ngữ cảnh "điều kiện làm việc tồi tệ, đáng lên án": DEPLORABLE (tồi tệ, đáng bị lên án kịch liệt).',
                  en: 'Derived from "deplore": "deplorable working conditions" (shockingly bad and deserving strong condemnation).',
                  vocabItem: {
                    term: 'deplorable conditions',
                    type: 'Word Formation (DEPLORE)',
                    phonetic: '/dɪˈplɔː.rə.bəl/',
                    definition_en: 'Deserving strong condemnation; shockingly bad in quality.',
                    definition_vi: 'Tồi tệ, thảm hại, đáng lên án.',
                    example: 'The refugees were housed in deplorable conditions.'
                  }
                }
              }
            ]
          }
        ]
      },
      reading: {
        title: 'III. READING COMPREHENSION (50 points)',
        parts: [
          {
            id: 'ams25-read-p1',
            title: 'Part 1: Academic Reading — The Philosophy of Scientific Revolutions',
            instructions: 'Read the passage and answer the question below.',
            passageTitle: 'Thomas Kuhn and Paradigm Incommensurability',
            passage: `<p id="p1">Prior to the publication of Thomas Kuhn’s landmark 1962 monograph <em>The Structure of Scientific Revolutions</em>, the history of science was predominantly chronicled as a linear, cumulative march toward objective truth. In this textbook view, each generation of researchers simply added new bricks to an ever-growing edifice of verified facts. Kuhn dismantled this Whig historiography by proposing that science instead alternates between prolonged epochs of "normal science"—during which practitioners solve puzzles within an unquestioned theoretical framework or <em>paradigm</em>—and abrupt episodes of "revolutionary science" triggered by the accumulation of stubborn anomalies that the reigning paradigm cannot assimilate.</p>`,
            questions: [
              {
                id: 'ams25-r1',
                number: 6,
                type: 'mcq',
                stem: 'What triggers a shift from "normal science" to "revolutionary science" in Kuhn’s model?',
                options: [
                  { id: 'A', text: 'The steady, trouble-free addition of verified facts to existing textbooks.' },
                  { id: 'B', text: 'The buildup of persistent empirical anomalies that the existing theoretical framework cannot explain.' },
                  { id: 'C', text: 'Government decrees requiring scientists to abandon classical physics.' },
                  { id: 'D', text: 'The complete disappearance of puzzle-solving activities in universities.' }
                ],
                answer: 'B',
                evidenceQuote: 'abrupt episodes of "revolutionary science" triggered by the accumulation of stubborn anomalies that the reigning paradigm cannot assimilate.',
                points: 2,
                explanation: {
                  rule: 'Causal Identification in Philosophy of Science',
                  vi: 'Sự chuyển dịch sang "khoa học cách mạng" được kích hoạt bởi sự tích tụ của các dị thường dai dẳng mà mô hình đương nhiệm không thể giải thích/dung nạp ("accumulation of stubborn anomalies that the reigning paradigm cannot assimilate").',
                  en: 'Directly matches "triggered by the accumulation of stubborn anomalies that the reigning paradigm cannot assimilate".'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. WRITING (60 points)',
        parts: [
          {
            id: 'ams25-wrt-p1',
            partType: 'summary',
            title: 'Part 1: Summary Writing (100–120 words)',
            instructions: 'Summarize the following passage on "Urban Heat Islands and Biophilic Mitigation" in 100–120 words.',
            sourcePassage: `Modern megacities consistently register ambient temperatures three to seven degrees Celsius higher than their surrounding rural hinterlands—a microclimatic anomaly known as the Urban Heat Island (UHI) effect. This thermal disparity arises primarily from the replacement of permeable vegetation with dark, impervious surfaces such as asphalt and concrete, which possess high thermal inertia and absorb vast quantities of solar radiation during the day before re-radiating heat throughout the night. Compounding the problem, waste heat expelled by vehicular traffic and air-conditioning condensers creates a self-reinforcing feedback loop: as outdoor temperatures climb, cooling demand surges, further heating the streetscape. Urban climatologists advocate a multi-tiered biophilic intervention—combining high-albedo reflective rooftops, vegetated green corridors, and permeable pavements—to restore evapotranspiration and lower peak summer mortality.`,
            prompt: 'Summarize the causes of the Urban Heat Island effect and proposed mitigation strategies (100–120 words).',
            minWords: 100,
            maxWords: 120,
            points: 20
          },
          {
            id: 'ams25-wrt-p3',
            partType: 'essay',
            title: 'Part 2: Academic Essay Writing (350 words)',
            instructions: 'Write an essay of about 350 words:',
            prompt: '"As biometric surveillance and predictive policing technologies become increasingly accurate at preventing crime, citizens should be willing to trade a degree of personal anonymity for collective security." Do you agree or disagree?',
            minWords: 320,
            maxWords: 400,
            points: 40
          }
        ]
      }
    }
  },

  // =========================================================================
  // EXAM 6: HSGQG INTENSIVE MOCK — CHUYÊN SƯ PHẠM & KHTN (NEC SET B)
  // =========================================================================
  {
    id: 'hsgqg-2024-csp-intensive',
    title: 'Đề Thi Trọng Điểm Quốc Gia HSGQG (NEC Intensive Set B — Chuyên Sư Phạm)',
    tournament: 'HSGQG',
    year: 2024,
    province_school: 'THPT Chuyên Đại học Sư phạm Hà Nội (CSP)',
    grade_level: 'Đội tuyển Quốc gia (11-12)',
    duration_minutes: 180,
    difficulty: 'C1-C2',
    tags: ['HSGQG', 'Chuyên Sư Phạm', 'Open Cloze', 'Chart Writing', 'C2 Idioms'],
    sections: {
      listening: {
        title: 'I. LISTENING (50 points)',
        parts: [
          {
            id: 'csp24-list-p1',
            title: 'Part 1: Economic History — The Tulip Mania of 1637 Reconsidered',
            instructions: 'Complete the notes below. Write NO MORE THAN TWO WORDS for each answer.',
            audioUrl: '',
            dictationWords: ['speculative', 'contagion', 'pamphleteers', 'Calvinist', 'solvent'],
            transcript: `Historian: Popular accounts of the 1637 Dutch Tulip Mania invariably portray an entire nation gripped by speculative delirium, with chimney sweeps trading ancestral townhouses for a single Semper Augustus bulb. However, archival research by historian Anne Goldgar reveals a far more restrained reality. Rather than a society-wide contagion, futures trading in rare tulip bulbs was confined to a tight-knit network of affluent merchants and artisans in Haarlem and Amsterdam. Furthermore, the infamous crash did not bankrupt the Dutch Republic; most prominent traders remained solvent, and the sensationalized tales of mass ruin were largely fabricated by Calvinist pamphleteers eager to moralize against financial hubris.`,
            questions: [
              {
                id: 'csp24-l1',
                number: 1,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Archival evidence shows tulip futures trading was restricted to wealthy merchants and _______ in two cities.',
                answer: 'artisans',
                acceptedAnswers: ['artisans', 'affluent artisans'],
                evidenceQuote: 'futures trading in rare tulip bulbs was confined to a tight-knit network of affluent merchants and artisans in Haarlem and Amsterdam.',
                points: 2,
                explanation: {
                  rule: 'Detail Extraction ("confined to" = "restricted to")',
                  vi: '"confined to" = "restricted to"; "affluent" = "wealthy". Đối tượng thứ hai bên cạnh "merchants" là "artisans" (thợ thủ công lành nghề).',
                  en: 'Matches "affluent merchants and artisans".'
                }
              },
              {
                id: 'csp24-l2',
                number: 2,
                type: 'note_completion',
                maxWords: 2,
                stem: 'Exaggerated stories of widespread financial ruin were invented by _______.',
                answer: 'Calvinist pamphleteers',
                acceptedAnswers: ['Calvinist pamphleteers', 'pamphleteers'],
                evidenceQuote: 'the sensationalized tales of mass ruin were largely fabricated by Calvinist pamphleteers eager to moralize against financial hubris.',
                points: 2,
                explanation: {
                  rule: 'Passive Agent Identification ("fabricated by" = "invented by")',
                  vi: '"sensationalized tales of mass ruin" = "exaggerated stories of widespread financial ruin"; "fabricated by" = "invented by". Đáp án là "Calvinist pamphleteers".',
                  en: 'Directly matches "fabricated by Calvinist pamphleteers".'
                }
              }
            ]
          }
        ]
      },
      lexicoGrammar: {
        title: 'II. LEXICO-GRAMMAR (40 points)',
        parts: [
          {
            id: 'csp24-lex-p1',
            title: 'Part 1: Multiple Choice',
            instructions: 'Choose the best option (A, B, C, or D).',
            questions: [
              {
                id: 'csp24-q1',
                number: 3,
                type: 'mcq',
                stem: 'The peace negotiations reached an impasse because neither delegation was willing to give _______.',
                options: [
                  { id: 'A', text: 'ground' },
                  { id: 'B', text: 'earth' },
                  { id: 'C', text: 'soil' },
                  { id: 'D', text: 'floor' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'C1/C2 Idiom ("give ground" vs. "stand/hold one’s ground")',
                  vi: 'Thành ngữ "give ground" = nhượng bộ, lùi bước trong tranh luận hoặc đàm phán (trái nghĩa với "stand/hold one’s ground" = giữ vững lập trường).',
                  en: '"To give ground" means to retreat or make concessions in an argument or negotiation.',
                  optionAnalysis: {
                    A: 'Correct: "give ground" = yield or make concessions.',
                    B: 'Distractor: Not an idiom.',
                    C: 'Distractor: Not an idiom.',
                    D: 'Distractor: "take the floor" means speak in a debate, not yield.'
                  },
                  vocabItem: {
                    term: 'give ground / hold one’s ground',
                    type: 'C1/C2 Idiom',
                    phonetic: '/ɡɪv ɡraʊnd/',
                    definition_en: 'To retreat, yield, or make concessions under pressure (opposite: hold one’s ground).',
                    definition_vi: 'Nhượng bộ, lùi bước (trái nghĩa: giữ vững lập trường).',
                    example: 'Faced with mounting evidence, the minister refused to give ground.'
                  }
                }
              },
              {
                id: 'csp24-q2',
                number: 4,
                type: 'mcq',
                stem: 'Many a _______ entrepreneur has mistaken a temporary bull market for personal genius, only to be humbled when credit tightens.',
                options: [
                  { id: 'A', text: 'fledgling' },
                  { id: 'B', text: 'feathered' },
                  { id: 'C', text: 'winged' },
                  { id: 'D', text: 'nested' }
                ],
                answer: 'A',
                points: 1,
                explanation: {
                  rule: 'Metaphorical Adjective ("fledgling" = inexperienced/emerging) + "Many a + singular N"',
                  vi: '"Fledgling" (nghĩa đen: chim non mới tập bay; nghĩa bóng: người/tổ chức non trẻ, mới vào nghề) thường đi với "entrepreneur / democracy / industry". Cấu trúc "Many a + N_số_ít + V_số_ít" = Biết bao nhiêu...',
                  en: '"Fledgling" describes a person or organization that is immature, inexperienced, or fledgling.',
                  optionAnalysis: {
                    A: 'Correct: "fledgling entrepreneur" = novice or newly established entrepreneur.',
                    B: 'Distractor: Literal only (except in "feather one\'s nest").',
                    C: 'Distractor: Literal only.',
                    D: 'Distractor: Used in computing/tables, not for inexperienced people.'
                  },
                  vocabItem: {
                    term: 'fledgling (entrepreneur / industry / democracy)',
                    type: 'C2 Metaphorical Adjective',
                    phonetic: '/ˈfledʒ.lɪŋ/',
                    definition_en: 'New and inexperienced; recently formed or emerging.',
                    definition_vi: 'Non trẻ, mới chập chững bước vào nghề / mới hình thành.',
                    example: 'Venture capital provides crucial seed funding for fledgling biotech firms.'
                  }
                }
              }
            ]
          },
          {
            id: 'csp24-lex-p2',
            title: 'Part 2: Word Formation',
            instructions: 'Provide the correct form of the word in brackets.',
            questions: [
              {
                id: 'csp24-wf1',
                number: 5,
                type: 'word_formation',
                stem: 'The committee’s report was criticized for its _______ tone, lecturing developing nations while ignoring historical emissions. (DESCEND)',
                rootWord: 'DESCEND',
                answer: 'condescending',
                acceptedAnswers: ['condescending'],
                points: 2,
                explanation: {
                  rule: 'Prefix "con-" + Root "descend" + "-ing"',
                  vi: 'Từ gốc DESCEND kết hợp với ngữ cảnh "lecturing developing nations" (lên mặt dạy đời các nước đang phát triển): CONDESCENDING (kẻ cả, bề trên, trịch thượng).',
                  en: '"Condescending" means having or showing a feeling of patronizing superiority.',
                  vocabItem: {
                    term: 'condescending tone / attitude',
                    type: 'Word Formation (DESCEND)',
                    phonetic: '/ˌkɒn.dɪˈsen.dɪŋ/',
                    definition_en: 'Showing feelings of patronizing superiority toward others.',
                    definition_vi: 'Trịch thượng, kẻ cả, ra vẻ bề trên.',
                    example: 'Patients resent doctors who speak to them in a condescending tone.'
                  }
                }
              }
            ]
          }
        ]
      },
      reading: {
        title: 'III. READING COMPREHENSION (50 points)',
        parts: [
          {
            id: 'csp24-read-p1',
            title: 'Part 1: Open Cloze — The Economics of Attention',
            instructions: 'Fill each gap with ONE word.',
            passageTitle: 'Information Abundance and Attentional Scarcity',
            passage: `As the economist Herbert Simon presciently observed in 1971, a wealth of information creates a poverty of attention. What information consumes is rather obvious: it consumes the attention of its recipients. [[6]] follows that in an information-rich world, human attention becomes the scarce bottleneck resource around [[7]] all media ecosystems compete.`,
            questions: [
              {
                id: 'csp24-oc1',
                number: 6,
                type: 'open_cloze',
                blankNumber: 6,
                stem: 'Blank (6): "___ follows that in an information-rich world..."',
                answer: 'It',
                acceptedAnswers: ['It', 'it'],
                evidenceQuote: '[[6]] follows that in an information-rich world, human attention becomes the scarce bottleneck resource',
                points: 2,
                explanation: {
                  rule: 'Dummy Subject in Logical Deduction ("It follows that...")',
                  vi: 'Cấu trúc suy luận học thuật: "It follows that + mệnh đề" = Hệ quả tất yếu là / Suy ra là...',
                  en: '"It follows that..." is a standard academic formula introducing a logical consequence.'
                }
              },
              {
                id: 'csp24-oc2',
                number: 7,
                type: 'open_cloze',
                blankNumber: 7,
                stem: 'Blank (7): "...the scarce bottleneck resource around ___ all media ecosystems compete."',
                answer: 'which',
                acceptedAnswers: ['which'],
                evidenceQuote: 'human attention becomes the scarce bottleneck resource around [[7]] all media ecosystems compete.',
                points: 2,
                explanation: {
                  rule: 'Preposition + Relative Pronoun ("around which")',
                  vi: 'Sau giới từ "around" bổ nghĩa cho danh từ chỉ vật "the scarce bottleneck resource" bắt buộc dùng đại từ quan hệ "which".',
                  en: 'After the preposition "around" referring to a non-human antecedent ("resource"), "which" is mandatory.'
                }
              }
            ]
          }
        ]
      },
      writing: {
        title: 'IV. WRITING (60 points)',
        parts: [
          {
            id: 'csp24-wrt-p2',
            partType: 'chart',
            title: 'Part 1: Chart & Table Description (150 words)',
            instructions: 'The chart below compares average weekly hours dedicated to four English sub-skills by Provincial First-Prize vs. Consolation-Prize winners in the HSGQG tournament. Summarize the main features (150 words).',
            chartData: {
              title: 'Weekly Autonomous Study Allocation by HSGQG Award Tier (Hours/Week)',
              unit: 'Hours per week',
              categories: ['First/Second Prize Winners', 'Third Prize Winners', 'Consolation Prize', 'Non-Awarded Candidates'],
              series: [
                { name: 'Academic Writing & Analytical Paraphrasing', values: [9.5, 6.2, 3.8, 2.1], prizeCorrelation: 'Decisive Differentiator' },
                { name: 'Authentic Listening & Dictation Lab', values: [7.8, 5.9, 4.5, 3.0], prizeCorrelation: 'Strong Positive' },
                { name: 'Critical Reading & Discourse Analysis', values: [8.4, 7.1, 5.8, 4.9], prizeCorrelation: 'High Baseline' },
                { name: 'Isolated Grammar Drilling Only', values: [3.2, 4.8, 6.5, 7.4], prizeCorrelation: 'Inverse / Diminishing Returns' }
              ]
            },
            prompt: 'Summarize the information in the chart by selecting and reporting the main features and making relevant comparisons (about 150 words).',
            minWords: 135,
            maxWords: 175,
            points: 20
          },
          {
            id: 'csp24-wrt-p3',
            partType: 'essay',
            title: 'Part 2: Academic Essay Writing (350 words)',
            instructions: 'Write an essay of about 350 words:',
            prompt: '"The relentless pursuit of GDP growth has become an obsolete metric of national progress; governments should instead evaluate policy success through ecological resilience and subjective well-being." To what extent do you agree or disagree?',
            minWords: 320,
            maxWords: 400,
            points: 40
          }
        ]
      }
    }
  }
];

const SEED_VOCAB = [
  {
    id: 'voc-seed-1',
    term: 'Had it not been for the fact that...',
    type: 'C2 Syntactic Inversion',
    phonetic: '/hæd ɪt nɒt biːn fɔːr/',
    definition_en: 'Inverted third conditional structure used when followed by a full finite clause rather than a noun phrase.',
    definition_vi: 'Nếu không nhờ vào thực tế là... (Đảo ngữ câu điều kiện loại 3 đi với mệnh đề hoàn chỉnh).',
    example: 'Had it not been for the fact that the central bank intervened, the currency would have collapsed.',
    source_exam: 'HSGQG 2025 (NEC)',
    grammar_note: 'Compare with "But for + Noun Phrase" and "Were it not for + Noun Phrase".',
    mastery_level: 4
  },
  {
    id: 'voc-seed-2',
    term: 'carry the can (for sb/sth)',
    type: 'C2 Idiom',
    phonetic: '/ˈkær.i ðə kæn/',
    definition_en: 'To take the blame or responsibility alone, especially for mistakes committed by others.',
    definition_vi: 'Đứng mũi chịu sào, giơ đầu chịu báng thay cho người khác.',
    example: 'Junior compliance officers were left to carry the can for executive negligence.',
    source_exam: 'HSGQG 2025 (NEC)',
    grammar_note: 'Often used with verbs like "leave sb to carry the can" or "make sb carry the can".',
    mastery_level: 3
  },
  {
    id: 'voc-seed-3',
    term: 'ring hollow',
    type: 'C2 Idiomatic Collocation',
    phonetic: '/rɪŋ ˈhɒl.əʊ/',
    definition_en: 'To sound insincere, unconvincing, or devoid of genuine commitment.',
    definition_vi: 'Nghe sáo rỗng, giả tạo, thiếu chân thành (trái nghĩa: ring true).',
    example: 'The CEO’s apology rang hollow after his multi-million-dollar bonus was leaked.',
    source_exam: 'DHBB 2024 — Khối 11',
    grammar_note: 'Antonym: ring true (nghe có vẻ thật/đáng tin).',
    mastery_level: 5
  },
  {
    id: 'voc-seed-4',
    term: 'beggar description / belief',
    type: 'C2 Idiom',
    phonetic: '/ˈbeɡ.ər dɪˈskrɪp.ʃən/',
    definition_en: 'To be too extraordinary, shocking, or wonderful to be described adequately or believed.',
    definition_vi: 'Không lời nào tả xiết / Vượt quá sức tưởng tượng.',
    example: 'The sheer virtuosity of the young pianist’s performance beggared description.',
    source_exam: 'DHBB 2024 — Sentence Transformation',
    grammar_note: 'Frequently tested in Sentence Transformation with keyword BEGGAR / BEGGARED.',
    mastery_level: 2
  },
  {
    id: 'voc-seed-5',
    term: 'disinterested vs. uninterested',
    type: 'C2 Word Formation Distinction',
    phonetic: '/dɪˈsɪn.trəs.tɪd/',
    definition_en: 'Disinterested = impartial, objective, having no personal stake; Uninterested = bored, indifferent.',
    definition_vi: 'Disinterested = vô tư, khách quan, không vụ lợi; Uninterested = thờ ơ, không quan tâm.',
    example: 'The alibi was corroborated by three disinterested bystanders.',
    source_exam: 'HSGQG 2025 — Word Formation',
    grammar_note: 'Root word: INTEREST. High-frequency trap in HSGQG and Olympic 30/4.',
    mastery_level: 4
  },
  {
    id: 'voc-seed-6',
    term: 'put/set the cat among the pigeons',
    type: 'C2 Idiom',
    phonetic: '/set ðə kæt əˈmʌŋ ðə ˈpɪdʒ.ənz/',
    definition_en: 'To say or do something that causes sudden alarm, controversy, or upheaval.',
    definition_vi: 'Làm xôn xao, gây chấn động và náo loạn dư luận.',
    example: 'The opposition leader’s speech set the cat among the pigeons in parliament.',
    source_exam: 'Trại hè Hùng Vương 2024',
    grammar_note: 'Both "put" and "set" are accepted verbs.',
    mastery_level: 3
  },
  {
    id: 'voc-seed-7',
    term: 'not budge an inch',
    type: 'C1/C2 Idiom',
    phonetic: '/nɒt bʌdʒ ən ɪntʃ/',
    definition_en: 'To refuse stubbornly to make any concession or change one’s stance.',
    definition_vi: 'Kiên quyết không nhượng bộ dù chỉ một phân.',
    example: 'The diplomat’s refusal to budge an inch caused the summit to collapse.',
    source_exam: 'HSGQG 2025 — Sentence Transformation',
    grammar_note: 'Synonyms: stand/hold one’s ground, dig one’s heels in.',
    mastery_level: 4
  },
  {
    id: 'voc-seed-8',
    term: 'equivocate',
    type: 'C2 Academic Verb',
    phonetic: '/ɪˈkwɪv.ə.keɪt/',
    definition_en: 'To use ambiguous or evasive language so as to conceal the truth or avoid committing oneself.',
    definition_vi: 'Nói nước đôi, vòng vo lấp liếm để né tránh sự thật.',
    example: 'Questioned about the missing endowment funds, the treasurer began to equivocate.',
    source_exam: 'Olympic 30/4 2024',
    grammar_note: 'Noun: equivocation; Adjective: equivocal.',
    mastery_level: 2
  },
  {
    id: 'voc-seed-9',
    term: 'rest on one’s laurels',
    type: 'C1/C2 Idiom',
    phonetic: '/rest ɒn wʌnz ˈlɒr.əlz/',
    definition_en: 'To be so satisfied with past achievements that one stops putting in effort.',
    definition_vi: 'Ngủ quên trên chiến thắng, tự mãn với hào quang quá khứ.',
    example: 'After winning the championship, the team refused to rest on their laurels.',
    source_exam: 'Olympic 30/4 2024',
    grammar_note: 'Watch out for Vietnamese interference ("sleep on victory" is wrong; always "rest on one’s laurels").',
    mastery_level: 5
  },
  {
    id: 'voc-seed-10',
    term: 'tacit support / approval / consent',
    type: 'C1/C2 Collocation',
    phonetic: '/ˈtæs.ɪt səˈpɔːt/',
    definition_en: 'Endorsement or agreement that is understood or implied without being stated aloud.',
    definition_vi: 'Sự ủng hộ / đồng thuận / chấp thuận ngầm.',
    example: 'His silence was construed as tacit support for the separatist faction.',
    source_exam: 'HSGQG 2025 (NEC)',
    grammar_note: 'Adverb: tacitly.',
    mastery_level: 3
  }
];

const SEED_SUBMISSIONS = [
  {
    id: 'sub-seed-1',
    exam_id: 'olympic304-2024-lhp',
    exam_title: 'Kỳ thi Olympic Truyền thống 30/4 lần thứ XXVIII',
    tournament: 'Olympic 30/4',
    mode: 'simulation',
    score: 16.5,
    max_score: 20,
    percentage: 82.5,
    time_spent_seconds: 5420,
    answers: { 'ol304-q1': 'A', 'ol304-q2': 'A', 'ol304-q3': 'A', 'ol304-wf1': 'sedition' },
    section_scores: { listening: 85, lexicoGrammar: 88, reading: 80, writing: 77 },
    created_at: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: 'sub-seed-2',
    exam_id: 'dhbb-2024-k11-cnn',
    exam_title: 'Kỳ thi HSG Khu vực Duyên hải & Đồng bằng Bắc Bộ (DHBB 2024)',
    tournament: 'DHBB',
    mode: 'simulation',
    score: 17.2,
    max_score: 20,
    percentage: 86.0,
    time_spent_seconds: 6180,
    answers: { 'dhbb24-q1': 'A', 'dhbb24-q2': 'A', 'dhbb24-wf1': 'intimidation' },
    section_scores: { listening: 90, lexicoGrammar: 85, reading: 88, writing: 81 },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'sub-seed-3',
    exam_id: 'hsgqg-2025-nec-official',
    exam_title: 'Kỳ thi Chọn Học sinh Giỏi Quốc gia THPT (HSGQG - NEC 2025)',
    tournament: 'HSGQG',
    mode: 'practice',
    score: 18.1,
    max_score: 20,
    percentage: 90.5,
    time_spent_seconds: 4890,
    answers: { 'hsgqg25-q1': 'A', 'hsgqg25-q2': 'A', 'hsgqg25-wf1': 'uncompromising' },
    section_scores: { listening: 92, lexicoGrammar: 94, reading: 90, writing: 86 },
    created_at: new Date(Date.now() - 86400000 * 1).toISOString()
  }
];

module.exports = {
  SEED_EXAMS,
  SEED_VOCAB,
  SEED_SUBMISSIONS
};
