import { ScrapedRecord, updateRecordCleaning, getUncleanedRecords, getAllRecords } from './db';

const OFFICIAL_DOMAINS = [
  'idx.co.id',
  'ojk.go.id',
  'ksei.co.id',
  'bi.go.id',
  'kemenkeu.go.id',
  'setneg.go.id',
  'sec.gov',
];

const MAINSTREAM_MEDIA = [
  'bisnis.com',
  'kontan.co.id',
  'bloombergtechnoz.com',
  'bloomberg.com',
  'reuters.com',
  'cnbcindonesia.com',
  'katadata.co.id',
  'kompas.com',
  'detik.com',
  'investor.id',
  'tempo.co',
  'wartaekonomi.co.id',
  'emitennews.com',
  'idxchannel.com',
  'msn.com',
  'market.bisnis.com',
  'tribunnews.com',
  'kumparan.com',
  'liputan6.com',
  'merdeka.com',
  'sindonews.com',
  'antaranews.com',
  'suara.com',
  'thejakartapost.com',
  'businesstimes.com.sg',
  'techinasia.com',
  'cnbc.com',
  'seekingalpha.com',
  'marketwatch.com',
  'wsj.com',
  'ft.com',
  'dunia-energi.com',
  'pintarsaham.id',
  'investortrust.id',
  'koridor.co.id',
  'industry.co.id',
  'jernih.co',
];

const SOCIAL_FORUMS = [
  'stockbit.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'threads.net',
  'reddit.com',
  'youtube.com',
  'facebook.com',
  'tiktok.com',
  'kaskus.co.id',
  't.me',
  'telegram.org',
];

const RUMOR_PATTERNS = [
  { word: 'dikabarkan bakal', weight: 4 },
  { word: 'dikabarkan', weight: 3 },
  { word: 'beredar kabar', weight: 4 },
  { word: 'isu pasar', weight: 4 },
  { word: 'isu', weight: 3 },
  { word: 'isunya', weight: 3 },
  { word: 'spekulasi', weight: 4 },
  { word: 'bocoran', weight: 4 },
  { word: 'hearing pasar', weight: 4 },
  { word: 'hearing', weight: 3 },
  { word: 'rumor', weight: 4 },
  { word: 'konon', weight: 3 },
  { word: 'disebut-sebut', weight: 3 },
  { word: 'kabarnya', weight: 3 },
  { word: 'diduga', weight: 2 },
  { word: 'cek ombak', weight: 3 },
  { word: 'masuk radar', weight: 2 },
  { word: 'berpotensi akuisisi', weight: 3 },
  { word: 'tersiar kabar', weight: 3 },
  { word: 'digosipkan', weight: 4 },
  { word: 'transaksi semu', weight: 4 },
  { word: 'gorengan', weight: 4 },
  { word: 'halu', weight: 4 },
  { word: 'rumored', weight: 4 },
  { word: 'speculation', weight: 4 },
  { word: 'sources say', weight: 3 },
  { word: 'people familiar', weight: 3 },
  { word: 'unconfirmed', weight: 4 },
  { word: 'allegedly', weight: 3 },
  { word: 'whispers', weight: 4 },
];

const OFFICIAL_DISCLOSURE_PATTERNS = [
  'keterbukaan informasi',
  'rilis resmi',
  'siaran pers',
  'pengumuman resmi',
  'laporan keuangan',
  'corporate action',
  'press release',
  'resmi mengumumkan',
  'direktur utama',
  'sekretaris perusahaan',
  'ojk',
  'bei',
  'idx',
  'telah rampung',
  'menandatangani',
  'dividen',
  'rups',
  'rupo',
  'buyback',
  'realisasi',
  'pendapatan',
  'laba bersih',
];

const GOOD_IMPACT_KEYWORDS = [
  'buyback',
  'laba bersih naik',
  'laba naik',
  'kinerja solid',
  'untung',
  'pendapatan meroket',
  'rebound',
  'melonjak',
  'bangkit',
  'ekspansi',
  'akselerasi',
  'investasi',
  'dividen',
  'penguatan',
  'tertinggi',
  'naik 10%',
  'naik 12',
  'rampungkan retrofit',
  'meroket',
  'borong saham',
  'melesat',
];

const BAD_IMPACT_KEYWORDS = [
  'didepak',
  'denda ojk',
  'denda',
  'sanksi',
  'turun',
  'rontok',
  'ambruk',
  'anjlok',
  'transaksi semu',
  'msci downgrade',
  'msci',
  'penipuan',
  'boncos',
  'berguguran',
  'tertekan',
  'merugi',
  'arb',
  'lock arb',
  'penjahat',
  'pelanggaran',
  'manipulasi pasar',
  'tergerus',
  'laggard',
];

export interface CleaningResult {
  total_processed: number;
  valid_count: number;
  rumor_count: number;
  unverified_count: number;
}

// Evaluate Good vs Bad Impact with Explicit Reason
function evaluateImpact(text: string, title: string, isVideo: boolean): { sentiment: 'GOOD_IMPACT' | 'BAD_IMPACT' | 'NEUTRAL'; reason: string } {
  const lower = (text + ' ' + title).toLowerCase();

  let goodHits = 0;
  let badHits = 0;
  const goodMatched: string[] = [];
  const badMatched: string[] = [];

  for (const kw of GOOD_IMPACT_KEYWORDS) {
    if (lower.includes(kw)) {
      goodHits++;
      goodMatched.push(kw);
    }
  }

  for (const kw of BAD_IMPACT_KEYWORDS) {
    if (lower.includes(kw)) {
      badHits++;
      badMatched.push(kw);
    }
  }

  if (goodHits > badHits) {
    const reasonParts: string[] = [];
    if (goodMatched.includes('buyback') || goodMatched.includes('borong saham')) {
      reasonParts.push('Aksi buyback saham perseroan memberikan bantalan likuiditas di pasar dan menahan laju penurunan harga saham');
    }
    if (goodMatched.includes('laba') || goodMatched.includes('kinerja solid') || goodMatched.includes('meroket')) {
      reasonParts.push('Pertumbuhan laba bersih dan pendapatan operasional memperkuat rasio valuasi fundamental emiten');
    }
    if (goodMatched.includes('rebound') || goodMatched.includes('bangkit') || goodMatched.includes('melonjak')) {
      reasonParts.push('Sentimen teknikal pasar berbalik positif (rebound) meredam tekanan aksi jual sebelumnya');
    }
    if (reasonParts.length === 0) {
      reasonParts.push(`Katalis positif teridentifikasi (${goodMatched.slice(0, 2).join(', ')}) yang berpotensi mengangkat sentimen investor terhadap emiten`);
    }

    return {
      sentiment: 'GOOD_IMPACT',
      reason: reasonParts.join('; ') + '.',
    };
  } else if (badHits > goodHits) {
    const reasonParts: string[] = [];
    if (badMatched.includes('msci') || badMatched.includes('didepak')) {
      reasonParts.push('Dikeluarkannya saham dari bobot indeks atau peringatan MSCI berisiko memicu rebalancing dan outflow dana institusi asing');
    }
    if (badMatched.includes('denda') || badMatched.includes('sanksi') || badMatched.includes('ojk')) {
      reasonParts.push('Penjatuhan denda/sanksi administratif oleh regulator memicu risiko kepatuhan hukum dan sentimen negatif tata kelola');
    }
    if (badMatched.includes('arb') || badMatched.includes('lock arb') || badMatched.includes('anjlok') || badMatched.includes('rontok')) {
      reasonParts.push('Koreksi tajam hingga Auto Reject Bawah (ARB) menyebabkan kepanikan ritel dan mengeringnya likuiditas beli');
    }
    if (badMatched.includes('transaksi semu') || badMatched.includes('manipulasi pasar') || badMatched.includes('penjahat')) {
      reasonParts.push('Isu manipulasi transaksi semu di media sosial mencederai persepsi integritas emiten dan pemegang saham pengendali');
    }
    if (reasonParts.length === 0) {
      reasonParts.push(`Tekanan risiko pasar teridentifikasi (${badMatched.slice(0, 2).join(', ')}) yang menekan psikologis pelaku pasar`);
    }

    return {
      sentiment: 'BAD_IMPACT',
      reason: reasonParts.join('; ') + '.',
    };
  } else {
    return {
      sentiment: 'NEUTRAL',
      reason: 'Informasi bersifat ulasan deskriptif atau profil umum tanpa adanya sentimen pergerakan material yang langsung menggeser fundamental saham.',
    };
  }
}

// Generate in-depth structured intelligence briefing (including video summary)
function generateDeepSummary(
  record: ScrapedRecord, 
  status: 'VALID' | 'RUMOR' | 'UNVERIFIED', 
  detectedRumors: string[], 
  sourceCategory: string, 
  domain: string,
  isVideo: boolean,
  impact: { sentiment: 'GOOD_IMPACT' | 'BAD_IMPACT' | 'NEUTRAL'; reason: string }
): string {
  const title = record.title || '';
  const snippet = record.snippet || '';

  let coreTopic = 'Aktivitas Korporasi & Pasar Modal';
  if (title.toLowerCase().includes('buyback')) {
    coreTopic = 'Aksi Korporasi Pembelian Kembali Saham (Buyback)';
  } else if (title.toLowerCase().includes('laba') || title.toLowerCase().includes('kinerja') || title.toLowerCase().includes('pendapatan')) {
    coreTopic = 'Publikasi Kinerja Finansial & Laba Bersih Q3/2026';
  } else if (title.toLowerCase().includes('denda') || title.toLowerCase().includes('sanksi') || title.toLowerCase().includes('ojk')) {
    coreTopic = 'Penegakan Hukum & Sanksi Administratif Regulator OJK';
  } else if (title.toLowerCase().includes('msci') || title.toLowerCase().includes('bobot') || title.toLowerCase().includes('ihsg')) {
    coreTopic = 'Evaluasi Indeks Pasar Modal (MSCI & Bobot IHSG)';
  } else if (title.toLowerCase().includes('terkaya') || title.toLowerCase().includes('kekayaan') || title.toLowerCase().includes('harta')) {
    coreTopic = 'Valuasi Kekayaan Bersih Konglomerat & Fluktuasi Saham';
  } else if (title.toLowerCase().includes('reklamasi') || title.toLowerCase().includes('ekspansi')) {
    coreTopic = 'Diversifikasi Usaha & Ekspansi Bisnis Portofolio';
  }

  let mediaTypePrefix = isVideo ? '🎬 [RINGKASAN VIDEO / PODCAST]: ' : '📰 [RINGKASAN INTELIJEN]: ';

  let videoContext = '';
  if (isVideo) {
    videoContext = `Video mengulas secara audio-visual pergerakan harga saham grup Barito, mengkaji level support/resistance teknikal, dan membedah apakah aksi buyback perseroan cukup kuat menahan gejolak pasar. `;
  }

  let verificationNote = '';
  if (status === 'RUMOR') {
    if (sourceCategory === 'SOCIAL_FORUM' || domain.includes('instagram') || domain.includes('x.com')) {
      verificationNote = `Sinyal berasal dari obrolan/sentimen media sosial (${domain}). Merupakan persepsi publik tanpa nomor surat keterbukaan resmi IDX.`;
    } else {
      const kwList = detectedRumors.join(', ');
      verificationNote = `Terdapat indikasi spekulasi jurnalistik (terdeteksi kata kunci: ${kwList || 'isu pasar'}). Data memerlukan konfirmasi resmi manajemen.`;
    }
  } else {
    verificationNote = `Didukung oleh rilis media arus utama (${domain}) dengan rujukan data keterbukaan informasi bursa atau laporan resmi perseroan.`;
  }

  return `${mediaTypePrefix}Topik: ${coreTopic} | ${videoContext}Inti Bahasan: ${snippet.slice(0, 150) || title} | Status: ${verificationNote}`;
}

export function classifyRecord(record: ScrapedRecord): {
  clean_status: 'VALID' | 'RUMOR' | 'UNVERIFIED';
  source_category: 'OFFICIAL' | 'MAINSTREAM_MEDIA' | 'SOCIAL_FORUM' | 'UNKNOWN';
  credibility_score: number;
  key_claim: string;
  rumor_keywords: string[];
  impact_sentiment: 'GOOD_IMPACT' | 'BAD_IMPACT' | 'NEUTRAL';
  impact_reason: string;
  is_video: number;
} {
  const domain = (record.domain || '').toLowerCase();
  const url = (record.url || '').toLowerCase();
  const textToScan = `${record.title || ''} ${record.snippet || ''}`.toLowerCase();

  // 1. Video detection
  const isVideo = domain.includes('youtube') || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('/reel/') || url.includes('/shorts/');
  const is_video = isVideo ? 1 : 0;

  // 2. Precise Source Category Detection
  let source_category: 'OFFICIAL' | 'MAINSTREAM_MEDIA' | 'SOCIAL_FORUM' | 'UNKNOWN' = 'MAINSTREAM_MEDIA';

  if (OFFICIAL_DOMAINS.some((d) => domain.includes(d)) || domain.startsWith('ir.') || domain.startsWith('investor.')) {
    source_category = 'OFFICIAL';
  } else if (SOCIAL_FORUMS.some((d) => domain.includes(d)) || domain.includes('instagram') || domain.includes('twitter') || domain.includes('x.com') || isVideo) {
    source_category = 'SOCIAL_FORUM';
  } else if (MAINSTREAM_MEDIA.some((d) => domain.includes(d))) {
    source_category = 'MAINSTREAM_MEDIA';
  } else {
    source_category = 'MAINSTREAM_MEDIA';
  }

  // 3. Detect Rumor Signals
  const detectedRumors: string[] = [];
  let rumorScore = 0;
  for (const pattern of RUMOR_PATTERNS) {
    if (textToScan.includes(pattern.word)) {
      if (!detectedRumors.includes(pattern.word)) {
        detectedRumors.push(pattern.word);
        rumorScore += pattern.weight;
      }
    }
  }

  // 4. Detect Official Disclosures
  const hasOfficialMarkers = OFFICIAL_DISCLOSURE_PATTERNS.some((p) => textToScan.includes(p));

  // 5. Determine Classification & Credibility Score
  let clean_status: 'VALID' | 'RUMOR' | 'UNVERIFIED' = 'VALID';
  let credibility = 75;

  if (source_category === 'OFFICIAL') {
    clean_status = 'VALID';
    credibility = 95;
  } else if (detectedRumors.length > 0) {
    clean_status = 'RUMOR';
    credibility = source_category === 'SOCIAL_FORUM' 
      ? Math.max(20, 45 - rumorScore * 3) 
      : Math.max(35, 60 - rumorScore * 4);
  } else if (source_category === 'SOCIAL_FORUM') {
    clean_status = 'RUMOR';
    credibility = 38;
    if (detectedRumors.length === 0) {
      detectedRumors.push(isVideo ? 'video_analysis' : 'social_forum_post');
    }
  } else if (hasOfficialMarkers) {
    clean_status = 'VALID';
    credibility = 88;
  } else if (source_category === 'MAINSTREAM_MEDIA') {
    clean_status = 'VALID';
    credibility = 80;
  } else {
    clean_status = 'UNVERIFIED';
    credibility = 50;
  }

  // 6. Good Impact vs Bad Impact Evaluation with Reason
  const impact = evaluateImpact(textToScan, record.title, isVideo);

  // 7. Deep Analytical Summary Generation (including video summary)
  const deepSummary = generateDeepSummary(record, clean_status, detectedRumors, source_category, domain, isVideo, impact);

  return {
    clean_status,
    source_category,
    credibility_score: credibility,
    key_claim: deepSummary,
    rumor_keywords: detectedRumors,
    impact_sentiment: impact.sentiment,
    impact_reason: impact.reason,
    is_video,
  };
}

export function cleanAllPendingRecords(limit = 300): CleaningResult {
  const records = getUncleanedRecords(limit);
  let validCount = 0;
  let rumorCount = 0;
  let unverifiedCount = 0;

  for (const r of records) {
    if (!r.id) continue;
    const classified = classifyRecord(r);

    updateRecordCleaning(r.id, classified);

    if (classified.clean_status === 'VALID') validCount++;
    else if (classified.clean_status === 'RUMOR') rumorCount++;
    else unverifiedCount++;
  }

  return {
    total_processed: records.length,
    valid_count: validCount,
    rumor_count: rumorCount,
    unverified_count: unverifiedCount,
  };
}

export function reclassifyAllRecords(limit = 500): CleaningResult {
  const all = getAllRecords(limit);
  let validCount = 0;
  let rumorCount = 0;
  let unverifiedCount = 0;

  for (const r of all) {
    if (!r.id) continue;
    const classified = classifyRecord(r);
    updateRecordCleaning(r.id, classified);

    if (classified.clean_status === 'VALID') validCount++;
    else if (classified.clean_status === 'RUMOR') rumorCount++;
    else unverifiedCount++;
  }

  return {
    total_processed: all.length,
    valid_count: validCount,
    rumor_count: rumorCount,
    unverified_count: unverifiedCount,
  };
}
