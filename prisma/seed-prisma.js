const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPrismaFourTier() {
  console.log('====================================================================');
  console.log('  Seeding 4-Tier Hierarchical Prisma Schema (Exam -> Section -> Group -> Question)');
  console.log('====================================================================');

  await prisma.attemptAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.vocabularyCard.deleteMany();
  await prisma.question.deleteMany();
  await prisma.questionGroup.deleteMany();
  await prisma.examSection.deleteMany();
  await prisma.exam.deleteMany();

  const exam = await prisma.exam.create({
    data: {
      slug: 'hsgqg-2025-4tier-master',
      title: 'Kỳ thi Chọn HSGQG THPT 2025 — 4-Tier Specialized Format Paper',
      tournament: 'HSGQG',
      year: 2025,
      schoolOrProvince: 'Bộ Giáo dục và Đào tạo (MOET)',
      gradeLevel: '11-12',
      durationMinutes: 180,
      cefrLevel: 'C1-C2',
      totalPoints: 200,
      sections: {
        create: [
          {
            skill: 'LEXICO_GRAMMAR',
            title: 'SECTION II: LEXICO-GRAMMAR & PASSAGE MORPHOLOGY',
            instructions: 'Complete the Word Formation Passage, Open Cloze, Error Correction Passage, and Sentence Transformations.',
            orderIndex: 1,
            maxPoints: 60,
            questionGroups: {
              create: [
                {
                  groupType: 'WORD_FORMATION_PASSAGE',
                  title: 'Part 1: Inline Word Formation Passage',
                  instructions: 'Use the word given in capitals at each inline gap to form a word that fits in the space.',
                  orderIndex: 1,
                  stimulusTitle: 'The Epistemology of Algorithmic Curation',
                  stimulusText: `In contemporary media ecosystems, the {{1}} of algorithmic recommendation engines has fundamentally altered public discourse. Proponents claim these systems democratize access to information; however, empirical studies reveal an {{2}} tendency to amplify partisan outrage. Without {{3}} regulatory transparency, citizens remain vulnerable to {{4}} behavioral manipulation.`,
                  questions: {
                    create: [
                      {
                        questionNumber: 1,
                        questionType: 'WORD_FORMATION_PASSAGE',
                        givenWord: 'UBIQUITOUS',
                        correctAnswer: 'ubiquity',
                        acceptedAnswersJson: JSON.stringify(['ubiquity', 'ubiquitousness']),
                        points: 2,
                        grammarRule: 'Adjective -> Abstract Noun ("the + N + of")',
                        explanationVi: 'Giữa mạo từ "the" và giới từ "of" cần một danh từ trừu tượng: UBIQUITOUS -> UBIQUITY (sự hiện diện khắp mọi nơi).',
                        explanationEn: 'Preceded by "the" and followed by "of", the slot requires the abstract noun "ubiquity".'
                      },
                      {
                        questionNumber: 2,
                        questionType: 'WORD_FORMATION_PASSAGE',
                        givenWord: 'ALARM',
                        correctAnswer: 'alarming',
                        acceptedAnswersJson: JSON.stringify(['alarming']),
                        points: 2,
                        grammarRule: 'Participial Adjective ("an alarming tendency")',
                        explanationVi: 'Sau mạo từ "an" và trước danh từ "tendency" cần tính từ chỉ tính chất đáng báo động: ALARMING.',
                        explanationEn: 'Requires the participial adjective "alarming" modifying "tendency".'
                      },
                      {
                        questionNumber: 3,
                        questionType: 'WORD_FORMATION_PASSAGE',
                        givenWord: 'COMPROMISE',
                        correctAnswer: 'uncompromising',
                        acceptedAnswersJson: JSON.stringify(['uncompromising']),
                        points: 2,
                        grammarRule: 'Negative Participial Adjective ("uncompromising transparency")',
                        explanationVi: 'Ngữ cảnh đòi hỏi sự minh bạch kiên quyết, không khoan nhượng: UNCOMPROMISING.',
                        explanationEn: 'Requires the negative participial adjective "uncompromising".'
                      },
                      {
                        questionNumber: 4,
                        questionType: 'WORD_FORMATION_PASSAGE',
                        givenWord: 'PERCEIVE',
                        correctAnswer: 'imperceptible',
                        acceptedAnswersJson: JSON.stringify(['imperceptible']),
                        points: 2,
                        grammarRule: 'Negative Prefix "im-" + "-ible" ("imperceptible manipulation")',
                        explanationVi: 'Sự thao túng hành vi tinh vi khó nhận biết bằng giác quan thông thường: IMPERCEPTIBLE.',
                        explanationEn: 'Derives "imperceptible" (too subtle to be perceived) modifying "behavioral manipulation".'
                      }
                    ]
                  }
                },
                {
                  groupType: 'OPEN_CLOZE',
                  title: 'Part 2: Inline Open Cloze Passage',
                  instructions: 'Fill each numbered inline blank with ONE suitable word.',
                  orderIndex: 2,
                  stimulusTitle: 'Solitude in the Age of Perpetual Telemetry',
                  stimulusText: `Throughout much of human history, solitude was neither a luxury {{5}} an eccentricity. Today, however, the proliferation of networked devices has all {{6}} eradicated the quiet intervals of daily life. Little {{7}} neuroscientists warn that our capacity for sustained introspection is atrophying.`,
                  questions: {
                    create: [
                      {
                        questionNumber: 5,
                        questionType: 'OPEN_CLOZE',
                        correctAnswer: 'nor',
                        acceptedAnswersJson: JSON.stringify(['nor']),
                        points: 2,
                        grammarRule: 'Correlative Conjunction ("neither ... nor ...")',
                        explanationVi: 'Cấu trúc "neither A nor B" bắt buộc điền "nor".',
                        explanationEn: 'Completes the correlative pair "neither ... nor".'
                      },
                      {
                        questionNumber: 6,
                        questionType: 'OPEN_CLOZE',
                        correctAnswer: 'but',
                        acceptedAnswersJson: JSON.stringify(['but']),
                        points: 2,
                        grammarRule: 'C2 Idiom ("all but" = almost completely)',
                        explanationVi: '"all but eradicated" = gần như đã xóa sổ hoàn toàn.',
                        explanationEn: '"All but" before a past participle means "almost completely".'
                      },
                      {
                        questionNumber: 7,
                        questionType: 'OPEN_CLOZE',
                        correctAnswer: 'wonder',
                        acceptedAnswersJson: JSON.stringify(['wonder']),
                        points: 2,
                        grammarRule: 'Discourse Marker ("Little wonder [that]...")',
                        explanationVi: '"Little wonder (that)..." = Chẳng trách sao / Không có gì ngạc nhiên khi...',
                        explanationEn: 'Idiomatic elliptical expression meaning "it is no wonder that".'
                      }
                    ]
                  }
                },
                {
                  groupType: 'ERROR_CORRECTION_PASSAGE',
                  title: 'Part 3: Error Identification & Correction Passage',
                  instructions: 'Each numbered line in the passage contains ONE grammatical or lexical error. Enter the Error Word and its Correction.',
                  orderIndex: 3,
                  stimulusTitle: 'The Myth of Purely Rational Markets',
                  stimulusText: `Line 1 (Q8): Scarcely the central bank had announced quantitative tightening when speculative equities plunged.\nLine 2 (Q9): Neither the treasury secretary nor the commercial bankers was prepared for the liquidity freeze.\nLine 3 (Q10): Investors were advised to remain uninterested and objective when auditing their own portfolios.`,
                  questions: {
                    create: [
                      {
                        questionNumber: 8,
                        questionType: 'ERROR_CORRECTION',
                        stem: 'Line 1: Scarcely the central bank had announced quantitative tightening when speculative equities plunged.',
                        correctAnswer: 'the central bank had -> had the central bank',
                        acceptedAnswersJson: JSON.stringify([
                          'the central bank had -> had the central bank',
                          'central bank had -> had the central bank'
                        ]),
                        points: 2,
                        grammarRule: 'Negative Adverbial Inversion ("Scarcely + had + S + V3")',
                        explanationVi: 'Sau "Scarcely" đứng đầu câu phải đảo trợ động từ "had" lên trước chủ ngữ "the central bank".',
                        explanationEn: 'Fronted "Scarcely" requires subject-auxiliary inversion.'
                      },
                      {
                        questionNumber: 9,
                        questionType: 'ERROR_CORRECTION',
                        stem: 'Line 2: Neither the treasury secretary nor the commercial bankers was prepared for the liquidity freeze.',
                        correctAnswer: 'was -> were',
                        acceptedAnswersJson: JSON.stringify(['was -> were', 'was prepared -> were prepared']),
                        points: 2,
                        grammarRule: 'Proximity Concord ("Neither A nor B + V_B")',
                        explanationVi: 'Trong cấu trúc "Neither A nor B", động từ chia theo chủ ngữ gần nhất ("the commercial bankers" số nhiều) -> sửa "was" thành "were".',
                        explanationEn: 'Verb agrees in number with the closer subject "the commercial bankers" (plural).'
                      },
                      {
                        questionNumber: 10,
                        questionType: 'ERROR_CORRECTION',
                        stem: 'Line 3: Investors were advised to remain uninterested and objective when auditing their own portfolios.',
                        correctAnswer: 'uninterested -> disinterested',
                        acceptedAnswersJson: JSON.stringify(['uninterested -> disinterested']),
                        points: 2,
                        grammarRule: 'Confusable C2 Lexis ("disinterested" vs. "uninterested")',
                        explanationVi: '"Uninterested" = thờ ơ/chán nản; trong khi ngữ cảnh đi cùng "objective" (khách quan, không vụ lợi) đòi hỏi tính từ "disinterested".',
                        explanationEn: '"Disinterested" means impartial/objective, whereas "uninterested" means bored.'
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            skill: 'READING',
            title: 'SECTION III: SPECIALIZED READING (GAPPED TEXT & MATCHING HEADINGS)',
            instructions: 'Complete the Gapped Text (Paragraph Bank A–E) and Matching Headings (i–vi) tasks.',
            orderIndex: 2,
            maxPoints: 60,
            questionGroups: {
              create: [
                {
                  groupType: 'GAPPED_TEXT',
                  title: 'Part 1: Gapped Text (Paragraph Insertion A–E)',
                  instructions: 'Choose from the paragraphs (A–E) the one which fits each gap ({{11}}–{{13}}). There are two extra paragraphs which you do not need to use.',
                  orderIndex: 1,
                  stimulusTitle: 'The Rise of Credentialism and Positional Inflation',
                  stimulusText: `When sociologist Michael Young coined the term "meritocracy" in 1958, he intended it as a satirical warning rather than an educational ideal. He foresaw a stratified regime in which the ruling class would attribute their privilege entirely to their own innate intelligence. {{11}} Over the subsequent decades, however, policymakers stripped the word of its dystopian irony and embraced standardized testing as the ultimate engine of social mobility. {{12}} Furthermore, modern labor markets suffer from acute "positional inflation": employers continually raise baseline degree requirements for jobs whose cognitive tasks have not changed. {{13}}`,
                  sharedOptionsJson: JSON.stringify([
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
                  ]),
                  questions: {
                    create: [
                      {
                        questionNumber: 11,
                        questionType: 'GAPPED_TEXT',
                        correctAnswer: 'A',
                        acceptedAnswersJson: JSON.stringify(['A']),
                        points: 2,
                        grammarRule: 'Anaphoric Reference ("In such a society..." -> Young’s stratified regime)',
                        explanationVi: 'Đoạn A bắt đầu bằng "In such a society..." nối trực tiếp với mô tả về xã hội phân tầng trong tác phẩm năm 1958 của Michael Young ở câu liền trước.',
                        explanationEn: '"In such a society" refers directly back to the stratified regime envisioned by Young.'
                      },
                      {
                        questionNumber: 12,
                        questionType: 'GAPPED_TEXT',
                        correctAnswer: 'B',
                        acceptedAnswersJson: JSON.stringify(['B']),
                        points: 2,
                        grammarRule: 'Contrastive Discourse Link ("Yet empirical data..." vs. policymaker ideal)',
                        explanationVi: 'Đoạn B ("Yet empirical data...") phản biện lại kỳ vọng của các nhà hoạch định chính sách ở câu trước về việc thi cử chuẩn hóa thúc đẩy dịch chuyển xã hội.',
                        explanationEn: 'Contrasts the optimistic promise of standardized testing with empirical OECD reality.'
                      },
                      {
                        questionNumber: 13,
                        questionType: 'GAPPED_TEXT',
                        correctAnswer: 'C',
                        acceptedAnswersJson: JSON.stringify(['C']),
                        points: 2,
                        grammarRule: 'Causal Result ("Consequently, applicants without tertiary credentials...")',
                        explanationVi: 'Đoạn C ("Consequently...") chỉ ra hệ quả trực tiếp của hiện tượng "positional inflation" (lạm phát bằng cấp) vừa nêu ở câu trước.',
                        explanationEn: 'Draws the logical consequence of employers raising baseline degree requirements.'
                      }
                    ]
                  }
                },
                {
                  groupType: 'MATCHING_HEADINGS',
                  title: 'Part 2: Matching Headings to Paragraphs (i–v)',
                  instructions: 'Choose the correct heading (i–v) for each paragraph from the list of headings below.',
                  orderIndex: 2,
                  stimulusTitle: 'Linguistic Relativity & Spatial Reckoning',
                  stimulusText: `For decades, cognitive psychologists assumed that all human cultures conceptualize time along an ego-relative sagittal axis—envisioning the future ahead of the speaker and the past behind.\n\nFieldwork among the Aymara community of the Andes overturned this universalist assumption: because the past has been visually witnessed, Aymara speakers place the known past in front of their eyes and the unseen future behind their backs.\n\nEven more strikingly, the Kuuk Thaayorre people of northern Australia eschew body-relative terms like "left" and "right" altogether, organizing both spatial navigation and temporal sequences strictly along cardinal directions from east to west.`,
                  sharedOptionsJson: JSON.stringify([
                    { id: 'i', text: 'The orthodox universalist assumption of ego-relative temporal mapping' },
                    { id: 'ii', text: 'Evidentiality and the inversion of front-and-back time in Andean Aymara' },
                    { id: 'iii', text: 'Cardinal-direction orientation and the absence of ego-relative coordinates' },
                    { id: 'iv', text: 'The decline of indigenous languages due to urban migration' },
                    { id: 'v', text: 'Computational translation of Indo-European verb tenses' }
                  ]),
                  questions: {
                    create: [
                      {
                        questionNumber: 14,
                        questionType: 'MATCHING_HEADINGS',
                        stem: 'Paragraph A',
                        correctAnswer: 'i',
                        acceptedAnswersJson: JSON.stringify(['i']),
                        points: 2,
                        grammarRule: 'Paragraph Gist synthesis (Orthodox universalist assumption)',
                        explanationVi: 'Đoạn A giới thiệu giả định phổ quát truyền thống của giới tâm lý học nhận thức rằng mọi nền văn hóa đều hình dung tương lai ở phía trước và quá khứ ở phía sau -> Heading i.',
                        explanationEn: 'Summarizes the traditional universalist assumption in cognitive psychology.'
                      },
                      {
                        questionNumber: 15,
                        questionType: 'MATCHING_HEADINGS',
                        stem: 'Paragraph B',
                        correctAnswer: 'ii',
                        acceptedAnswersJson: JSON.stringify(['ii']),
                        points: 2,
                        grammarRule: 'Paragraph Gist synthesis (Aymara evidentiality & front/back inversion)',
                        explanationVi: 'Đoạn B phân tích cách người Aymara ở dãy Andes đặt quá khứ đã chứng kiến ở phía trước mắt và tương lai chưa biết ở phía sau lưng -> Heading ii.',
                        explanationEn: 'Captures the Aymara inversion of past/future grounded in visual evidentiality.'
                      },
                      {
                        questionNumber: 16,
                        questionType: 'MATCHING_HEADINGS',
                        stem: 'Paragraph C',
                        correctAnswer: 'iii',
                        acceptedAnswersJson: JSON.stringify(['iii']),
                        points: 2,
                        grammarRule: 'Paragraph Gist synthesis (Cardinal directions in Kuuk Thaayorre)',
                        explanationVi: 'Đoạn C mô tả việc cộng đồng Kuuk Thaayorre không dùng khái niệm trái/phải theo cơ thể mà định vị không gian - thời gian theo hướng Đông - Tây -> Heading iii.',
                        explanationEn: 'Matches cardinal-direction reckoning in Kuuk Thaayorre.'
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            skill: 'WRITING',
            title: 'SECTION IV: SENTENCE TRANSFORMATION (OPTIONAL FRAGMENTS & SLASH VARIATIONS)',
            instructions: 'Rewrite each sentence using the given keyword. Graded by lib/grading-engine.ts with expandOptionalFragments().',
            orderIndex: 3,
            maxPoints: 40,
            questionGroups: {
              create: [
                {
                  groupType: 'SENTENCE_TRANSFORM',
                  title: 'Part 1: Keyword Sentence Transformation',
                  instructions: 'Complete the second sentence so that it has a similar meaning to the first sentence, using the word given.',
                  orderIndex: 1,
                  questions: {
                    create: [
                      {
                        questionNumber: 17,
                        questionType: 'SENTENCE_TRANSFORM',
                        stem: 'Immediately after I arrived at the summit venue, the opening keynote began. (SOONER)',
                        givenWord: 'SOONER',
                        promptPrefix: 'No sooner',
                        correctAnswer: 'No sooner had I (just) arrived at the summit venue than the opening keynote began.',
                        acceptedAnswersJson: JSON.stringify([
                          'No sooner had I (just) arrived (at the summit venue) than the opening keynote began.'
                        ]),
                        points: 2,
                        grammarRule: 'Negative Inversion ("No sooner had I (just) arrived ... than ...")',
                        explanationVi: 'Hỗ trợ kiểm tra expandOptionalFragments: Chấp nhận cả "No sooner had I arrived..." và "No sooner had I just arrived...".',
                        explanationEn: 'Demonstrates expandOptionalFragments() supporting optional parenthetical "(just)" and "(at the summit venue)".'
                      },
                      {
                        questionNumber: 18,
                        questionType: 'SENTENCE_TRANSFORM',
                        stem: 'Whatever happens, you must never reveal the master password to outsiders. (CIRCUMSTANCES)',
                        givenWord: 'CIRCUMSTANCES',
                        promptPrefix: 'Under no',
                        correctAnswer: 'Under/In no circumstances must/should you (ever) reveal the master password to outsiders.',
                        acceptedAnswersJson: JSON.stringify([
                          'Under/In no circumstances must/should/are you (ever) (to) reveal the master password (to outsiders).'
                        ]),
                        points: 2,
                        grammarRule: 'Slash & Parenthetical Expansion ("Under/In no circumstances must/should you (ever)...")',
                        explanationVi: 'Hỗ trợ đồng thời biến thể dấu gạch chéo (Under/In, must/should) và từ tùy chọn trong ngoặc đơn "(ever)".',
                        explanationEn: 'Supports both slash alternatives (Under/In, must/should) and optional parenthetical "(ever)".'
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    include: {
      sections: {
        include: {
          questionGroups: {
            include: {
              questions: true
            }
          }
        }
      }
    }
  });

  console.log(`  [✓] Seeded 4-Tier Prisma Exam: "${exam.title}" (ID: ${exam.id})`);
  console.log(`  [✓] Sections: ${exam.sections.length} | QuestionGroups: ${exam.sections.reduce((a, s) => a + s.questionGroups.length, 0)}`);
  await prisma.$disconnect();
}

if (require.main === module) {
  seedPrismaFourTier().catch(async err => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
}

module.exports = { seedPrismaFourTier };
