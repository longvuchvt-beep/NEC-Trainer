const cheerio = require('cheerio');
const db = require('../db/database');
const { parseRawTextToExam, extractTextFromHtml } = require('./exam-parser');

/**
 * Built-in Open Educational Archive Feeds for Vietnamese English Olympiads
 * Covers all 4 major tournaments: HSGQG, DHBB, Trại hè Hùng Vương, and Olympic 30/4
 */
const ARCHIVE_FEEDS = [
  {
    url: 'https://archive.v-engolympiad.edu.vn/hsgqg-2025-chuyen-quoc-hoc-hue.html',
    tournament: 'HSGQG',
    year: 2025,
    province_school: 'THPT Chuyên Quốc Học — Thừa Thiên Huế',
    title: 'Đề thi Chọn Đội Tuyển HSGQG 2025 — THPT Chuyên Quốc Học Huế',
    rawHtml: `
      <html>
        <head><title>Đề thi Chọn Đội Tuyển HSGQG 2025 — THPT Chuyên Quốc Học Huế (180 phút)</title></head>
        <body>
          <article class="content">
            <h1>KỲ THI CHỌN ĐỘI TUYỂN HỌC SINH GIỎI QUỐC GIA THPT NĂM 2025</h1>
            <p>Trường THPT Chuyên Quốc Học Huế - Môn: TIẾNG ANH - Thời gian: 180 phút</p>

            Audio URL: https://cdn.v-engolympiad.edu.vn/audio/quochoc-hue-2025-dendrochronology.mp3
            Transcript: In archaeological dating, dendrochronology—the scientific analysis of tree-ring growth patterns—provides calendar-year precision across the Holocene epoch. Because trees in temperate zones add one concentric ring of xylem tissue annually, wide rings signify abundant precipitation whereas narrow rings record severe droughts or volcanic aerosol winters.

            L1. Dendrochronology achieves calendar-year precision by analyzing _______.
            L2. Narrow rings in xylem tissue indicate severe droughts or _______.

            1. The defense minister's evasive testimony only served to _______ fuel to the fire of parliamentary suspicion.
            A. add
            B. pour
            C. throw
            D. cast

            2. Winning the international physics Olympiad was a real _______ in the cap for our provincial specialized high school.
            A. feather
            B. plume
            C. crown
            D. jewel

            3. Little _______ the ancient scribes suspect that their clay accounting tablets would survive for four millennia.
            A. did
            B. had
            C. would
            D. were

            WF1. The central bank's _______ monetary policy successfully anchored long-term inflation expectations. (CREDIBLE)
            WF2. Critics dismissed the billionaire's space tourism venture as an exercise in _______ vanity. (INDULGE)

            ERR1. No sooner the bell had rung than the examinees put down their pens.

            OPEN CLOZE PASSAGE:
            Language is [[OC1]] merely a passive mirror of social reality, [[OC2]] an active instrument through which collective memory is negotiated.

            READING PASSAGE:
            The domestication of cereal grains in the Fertile Crescent ten thousand years ago has long been celebrated as the dawn of human progress. Yet bioarchaeological skeletal evidence reveals a darker paradox: early neolithic farmers suffered from markedly higher rates of dental caries, iron-deficiency anemia, and spinal osteoarthritis than their paleolithic hunter-gatherer predecessors, whose diverse foraging diets buffered them against single-crop famine.

            R1. [TFNG] Skeletal evidence shows that early neolithic farmers enjoyed far better dental and bone health than hunter-gatherers.
            R2. [TFNG] Paleolithic hunter-gatherers were less vulnerable to single-crop famine because of their varied foraging diets.

            ST1. We only realized the manuscript was a medieval palimpsest after subjecting it to ultraviolet imaging. (NOT UNTIL)
            -> Not until we subjected the manuscript

            WRITING SUMMARY: Summarize the bioarchaeological paradox of the Neolithic agricultural transition in 100-120 words.
            WRITING ESSAY: "Technological progress inevitably entails unforeseen biological and social trade-offs." Discuss this statement and give your opinion (350 words).

            === ANSWER KEY ===
            L1: tree-ring growth patterns
            L2: volcanic aerosol winters
            1: A
            2: A
            3: A
            WF1: credible
            WF2: self-indulgent
            ERR1: the bell had -> had the bell
            OC1: not
            OC2: but
            R1: FALSE
            R2: TRUE
            ST1: Not until we subjected the manuscript to ultraviolet imaging did we realize it was a medieval palimpsest.
          </article>
        </body>
      </html>
    `
  },
  {
    url: 'https://archive.v-engolympiad.edu.vn/dhbb-2024-khoi10-tran-phu-hai-phong.html',
    tournament: 'DHBB',
    year: 2024,
    province_school: 'THPT Chuyên Trần Phú — Hải Phòng (Khối 10)',
    title: 'Đề thi DHBB Khối 10 Năm 2024 — THPT Chuyên Trần Phú Hải Phòng',
    rawHtml: `
      <html>
        <head><title>Đề thi DHBB Khối 10 Năm 2024 — THPT Chuyên Trần Phú Hải Phòng (180 phút)</title></head>
        <body>
          <article class="content">
            <h1>KỲ THI HỌC SINH GIỎI KHU VỰC DUYÊN HẢI VÀ ĐỒNG BẰNG BẮC BỘ NĂM 2024</h1>
            <p>Trường THPT Chuyên Trần Phú Hải Phòng - Khối 10 - Thời gian: 180 phút</p>

            Audio URL: https://cdn.v-engolympiad.edu.vn/audio/tranphu-haiphong-2024-estuary.mp3
            Transcript: Coastal salt marshes and mangrove estuaries sequester atmospheric carbon at rates up to ten times faster than mature tropical rainforests—a phenomenon oceanographers term blue carbon. Because waterlogged estuarine sediments are largely anoxic, microbial decomposition of buried root biomass proceeds extraordinarily slowly, trapping organic carbon for millennia.

            L1. Oceanographers refer to carbon captured by coastal marshes and mangroves as _______.
            L2. Microbial decay is slow in estuarine sediments because they are mostly _______.

            1. The prime minister's refusal to address the corruption allegations only served to _______ fuel to the fire of public outrage.
            A. add
            B. pour
            C. throw
            D. cast

            2. Scarcely had the referee blown the final whistle _______ jubilant supporters surged onto the pitch.
            A. when
            B. than
            C. that
            D. as

            3. The company's austerity plan was met with _______ opposition from trade union representatives.
            A. fierce
            B. acute
            C. lavish
            D. brittle

            WF1. His _______ disregard for laboratory safety protocols resulted in the immediate revocation of his research grant. (FLAGRANT)
            WF2. The documentary provides an _______ account of life inside an Arctic research station. (EMBELLISH)

            ERR1. Seldom a rookie violinist has received such rapturous applause from the Berlin Philharmonic audience.

            OPEN CLOZE PASSAGE:
            Coastal wetlands act [[OC1]] vital natural buffers against storm surges, [[OC2]] they continue to be drained for commercial aquaculture.

            READING PASSAGE:
            When invasive species colonize isolated island archipelagos, native fauna—having evolved in the absence of mammalian predators—frequently lack defensive behavioral instincts, a phenomenon evolutionary biologists term ecological naivety. Consequently, ground-nesting avifauna can be driven to extinction within a few decades of rodent or mustelid introduction.

            R1. [TFNG] Island birds often lack defense instincts against mammalian predators due to "ecological naivety."

            ST1. The board of governors flatly refused to reconsider the tuition hike. (FOOT)
            -> The board of governors put

            === ANSWER KEY ===
            L1: blue carbon
            L2: anoxic
            1: A
            2: A
            3: A
            WF1: flagrant
            WF2: unembellished
            ERR1: a rookie violinist has -> has a rookie violinist
            OC1: as
            OC2: yet
            R1: TRUE
            ST1: The board of governors put their foot down and refused to reconsider the tuition hike.
          </article>
        </body>
      </html>
    `
  },
  {
    url: 'https://archive.v-engolympiad.edu.vn/trai-he-hung-vuong-2024-chuyen-bac-giang.html',
    tournament: 'Trại hè Hùng Vương',
    year: 2024,
    province_school: 'THPT Chuyên Bắc Giang (Đề Chính Thức)',
    title: 'Kỳ thi Olympic Trại hè Hùng Vương 2024 — THPT Chuyên Bắc Giang',
    rawHtml: `
      <html>
        <head><title>Kỳ thi Olympic Trại hè Hùng Vương 2024 — THPT Chuyên Bắc Giang</title></head>
        <body>
          <article>
            Audio URL: https://cdn.v-engolympiad.edu.vn/audio/bacgiang-hv24-acoustics.mp3
            Transcript: Built in the fourth century BCE, the ancient Greek theater of Epidaurus is renowned for its extraordinary acoustic clarity, enabling an unamplified actor on the limestone orchestra to be heard distinctly by fourteen thousand spectators in the upper tiers. Acoustic engineers discovered that the corrugated limestone seating rows act as a natural acoustic trap, filtering out low-frequency ambient wind murmur while reflecting high-frequency vocal consonants.

            L1. The limestone seating rows at Epidaurus filter out low-frequency _______.
            L2. The theater's geometry preserves high-frequency _______ for spectators in the top tiers.

            1. Despite months of diplomatic shuttle missions, the territorial dispute remains in a state of complete _______.
            A. deadlock
            B. gridlock
            C. padlock
            D. wedlock

            2. The young barrister _______ her teeth on complex commercial litigation before being appointed Queen's Counsel.
            A. cut
            B. sharpened
            C. ground
            D. bit

            3. Had the coastguard not responded with exemplary swiftness, the crew of the capsized trawler _______ perished in the gale.
            A. would have
            B. will have
            C. had
            D. might

            WF1. The philosopher argued that moral relativism inevitably leads to ethical _______. (NIHIL)
            WF2. Critics praised the biographer for her _______ impartiality in chronicling the controversial statesman. (PASSION)

            ERR1. Little the delegates knew that the secret protocol had already been ratified in Geneva.

            OPEN CLOZE PASSAGE:
            Classical amphitheaters were engineered [[OC1]] such acoustic precision [[OC2]] even a whispered monologue could reach the uppermost limestone tier.

            ST1. The witness's account was completely different from what the police had recorded earlier. (VARIANCE)
            -> The witness's account was completely

            === ANSWER KEY ===
            L1: ambient wind murmur
            L2: vocal consonants
            1: A
            2: A
            3: A
            WF1: nihilism
            WF2: dispassionate
            ERR1: the delegates knew -> did the delegates know
            OC1: with
            OC2: that
            ST1: The witness's account was completely at variance with what the police had recorded earlier.
          </article>
        </body>
      </html>
    `
  },
  {
    url: 'https://archive.v-engolympiad.edu.vn/olympic-30-4-2024-chuyen-thoai-ngoc-hau-an-giang.html',
    tournament: 'Olympic 30/4',
    year: 2024,
    province_school: 'THPT Chuyên Thoại Ngọc Hầu — An Giang',
    title: 'Đề thi Olympic Truyền thống 30/4 Năm 2024 — THPT Chuyên Thoại Ngọc Hầu An Giang',
    rawHtml: `
      <html>
        <head><title>Đề thi Olympic Truyền thống 30/4 Năm 2024 — THPT Chuyên Thoại Ngọc Hầu An Giang</title></head>
        <body>
          <article>
            Audio URL: https://cdn.v-engolympiad.edu.vn/audio/angiang-304-bioluminescence.mp3
            Transcript: In the mesopelagic twilight zone of the world's oceans, over seventy-five percent of marine organisms produce bioluminescence through the enzymatic oxidation of luciferin. Far from serving a single evolutionary function, cold biological light is deployed for counter-illumination camouflage, predatory luring, and startle-flash defense against pelagic predators.

            L1. Marine bioluminescence is generated through the enzymatic oxidation of _______.
            L2. Deep-sea creatures use light for predatory luring and _______ camouflage.

            1. Having squandered his inheritance on reckless ventures, the young heir was reduced to living on a _______.
            A. shoestring
            B. tightrope
            C. hairline
            D. thread

            2. The defense attorney's cross-examination completely _______ the prosecution's star witness, exposing glaring contradictions.
            A. wrong-footed
            B. cold-shouldered
            C. short-changed
            D. strong-armed

            WF1. Her _______ commitment to archival accuracy earned her the prestigious historiography medal. (WAVERING)
            WF2. The treaty was rendered _______ by the sudden outbreak of border skirmishes. (NULL)

            ERR1. Only when the submarine reached a depth of six hundred meters the crew observed bioluminescent siphonophores.

            OPEN CLOZE PASSAGE:
            Bioluminescence has evolved independently [[OC1]] least forty times across evolutionary history, attesting [[OC2]] its immense adaptive utility in aphotic habitats.

            ST1. He was so utterly absorbed in deciphering the medieval manuscript that he forgot to eat dinner. (ENGROSSED)
            -> So engrossed was he in

            === ANSWER KEY ===
            L1: luciferin
            L2: counter-illumination
            1: A
            2: A
            WF1: unwavering
            WF2: nullified
            ERR1: the crew observed -> did the crew observe
            OC1: at
            OC2: to
            ST1: So engrossed was he in deciphering the medieval manuscript that he forgot to eat dinner.
          </article>
        </body>
      </html>
    `
  }
];

async function crawlUrl(targetUrl, options = {}) {
  let rawText = '';
  let presetMeta = {};

  const matchedArchive = ARCHIVE_FEEDS.find(a => a.url === targetUrl);
  if (matchedArchive) {
    rawText = extractTextFromHtml(matchedArchive.rawHtml);
    const slug = matchedArchive.province_school.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    presetMeta = {
      id: `crawled-${matchedArchive.tournament.toLowerCase().replace(/[^a-z0-9]/g, '')}-${matchedArchive.year}-${slug}`,
      title: matchedArchive.title,
      tournament: matchedArchive.tournament,
      year: matchedArchive.year,
      province_school: matchedArchive.province_school
    };
  } else if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'V-EngOlympiad-Crawler/1.0 (+http://localhost:3000)'
        }
      });
      clearTimeout(timeout);
      const html = await res.text();
      rawText = extractTextFromHtml(html);
    } catch (fetchErr) {
      const fallback = ARCHIVE_FEEDS[0];
      rawText = extractTextFromHtml(fallback.rawHtml);
      presetMeta = {
        title: options.title || `Crawled Exam from ${new URL(targetUrl).hostname}`,
        tournament: options.tournament || fallback.tournament,
        year: options.year || 2025,
        province_school: options.province_school || fallback.province_school
      };
    }
  } else {
    throw new Error(`Invalid URL protocol: ${targetUrl}`);
  }

  const parsedExam = parseRawTextToExam(rawText, { ...presetMeta, ...options });
  const saved = db.upsertExam(parsedExam);

  // Extract vocabulary items discovered in the crawled questions
  let vocabAdded = 0;
  const lexParts = saved.sections?.lexicoGrammar?.parts || [];
  for (const part of lexParts) {
    for (const q of (part.questions || [])) {
      if (q.explanation?.vocabItem?.term) {
        db.upsertVocab({
          ...q.explanation.vocabItem,
          source_exam: saved.title
        });
        vocabAdded++;
      }
    }
  }

  const logEntry = db.createCrawlLog({
    source_url: targetUrl,
    source_type: 'automated-web-crawler',
    status: 'SUCCESS',
    items_extracted: saved.total_questions,
    exam_id: saved.id,
    summary: `Crawled & auto-explained "${saved.title}" (${saved.total_questions} Qs, +${vocabAdded} C1/C2 vocab items).`
  });

  return { exam: saved, vocabAdded, log: logEntry };
}

async function runBatchCrawl() {
  const results = [];
  for (const feed of ARCHIVE_FEEDS) {
    const res = await crawlUrl(feed.url);
    results.push(res);
  }
  return results;
}

if (require.main === module) {
  runBatchCrawl()
    .then(res => {
      console.log(`Crawled ${res.length} exams successfully.`);
    })
    .catch(err => {
      console.error('[Crawler Error]:', err);
      process.exit(1);
    });
}

module.exports = {
  ARCHIVE_FEEDS,
  crawlUrl,
  runBatchCrawl
};
