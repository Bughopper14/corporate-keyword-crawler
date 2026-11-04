// Helper to resolve relevant news cover images deterministically
// Prioritizes genuine extracted og:image, YouTube video frames, and authoritative brand-specific source defaults.

export function resolveNewsImage(record: {
  title?: string;
  url?: string;
  domain?: string;
  image_url?: string;
  is_video?: number;
}): string {
  // 1. If it's already a local static cached cover (e.g. /KeywordCrawler/covers/cover_*.jpg), return directly!
  if (record.image_url && record.image_url.startsWith('/KeywordCrawler/covers/')) {
    return record.image_url;
  }

  // 2. Genuine Scraped remote og:image from news portal
  if (record.image_url && record.image_url.startsWith('http')) {
    // If it's a domain that doesn't restrict hotlinking (e.g. Kompas, DigitalOcean, Suara), load directly
    const imgUrl = record.image_url;
    if (imgUrl.includes('asset.kompas.com') || imgUrl.includes('suara.com') || imgUrl.includes('digitaloceanspaces.com') || imgUrl.includes('twimg.com')) {
      return imgUrl;
    }
    return `/KeywordCrawler/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
  }

  const url = (record.url || '').toLowerCase();
  const domain = (record.domain || '').toLowerCase();

  // 2. YouTube Video Thumbnails
  if (record.is_video === 1 || domain.includes('youtube') || url.includes('youtube.com') || url.includes('youtu.be')) {
    const vMatch = url.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (vMatch) {
      return `https://img.youtube.com/vi/${vMatch[1]}/hqdefault.jpg`;
    }
  }

  // 3. Official Source-Specific Brand Defaults (Instagram, Twitter/X, Kontan, CNBC, Bisnis, Kompas, etc.)
  // When portal protects with Cloudflare / blocking bots, show authoritative Brand Hero Cover

  // A. INSTAGRAM
  if (domain.includes('instagram.com') || url.includes('instagram.com')) {
    const igSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <defs>
        <radialGradient id="ig-grad" cx="20%" cy="100%" r="130%">
          <stop offset="0%" stop-color="#fdf497"/>
          <stop offset="5%" stop-color="#fdf497"/>
          <stop offset="45%" stop-color="#fd5949"/>
          <stop offset="60%" stop-color="#d6249f"/>
          <stop offset="90%" stop-color="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill="url(#ig-grad)"/>
      <rect width="800" height="450" fill="#000000" fill-opacity="0.35"/>
      <g transform="translate(400, 180)" text-anchor="middle">
        <rect x="-45" y="-45" width="90" height="90" rx="24" fill="none" stroke="#ffffff" stroke-width="6"/>
        <circle cx="0" cy="0" r="22" fill="none" stroke="#ffffff" stroke-width="6"/>
        <circle cx="24" cy="-24" r="5" fill="#ffffff"/>
        <text x="0" y="85" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" letter-spacing="1">INSTAGRAM INTEL</text>
        <text x="0" y="115" fill="#ffffff" fill-opacity="0.85" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14" letter-spacing="0.5">Postingan &amp; Diskusi Publik Saham</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(igSvg)}`;
  }

  // B. TWITTER / X
  if (domain.includes('x.com') || domain.includes('twitter.com') || url.includes('x.com') || url.includes('twitter.com')) {
    const xSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#05070a"/>
      <g transform="translate(400, 185)" text-anchor="middle">
        <path d="M -30 -35 L 5 12 L -28 48 L -18 48 L 10 18 L 30 48 L 52 48 L 15 -2 L 46 -35 L 36 -35 L 11 -7 L -8 -35 Z" fill="#ffffff"/>
        <text x="0" y="90" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="26" letter-spacing="2">X (TWITTER) RADAR</text>
        <text x="0" y="120" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="14">Sinyal Percakapan &amp; Komunitas Bursa</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xSvg)}`;
  }

  // C. KONTAN (Investasi / Harian Kontan)
  if (domain.includes('kontan.co.id')) {
    const kontanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#091b34"/>
      <rect x="0" y="435" width="800" height="15" fill="#f59e0b"/>
      <g transform="translate(400, 190)" text-anchor="middle">
        <rect x="-120" y="-55" width="240" height="52" rx="10" fill="#d97706"/>
        <text x="0" y="-18" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="32" letter-spacing="3">KONTAN</text>
        <text x="0" y="50" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="24">BERITA PASAR MODAL &amp; INVESTASI</text>
        <text x="0" y="85" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="15">PT Grahanusa Mediatama (Kompas Gramedia)</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(kontanSvg)}`;
  }

  // D. CNBC INDONESIA
  if (domain.includes('cnbcindonesia.com')) {
    const cnbcSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#03122e"/>
      <rect x="0" y="435" width="800" height="15" fill="#0284c7"/>
      <g transform="translate(400, 190)" text-anchor="middle">
        <text x="0" y="-10" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" letter-spacing="2">CNBC INDONESIA</text>
        <text x="0" y="45" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22">MARKET INTELLIGENCE &amp; MACRO</text>
        <text x="0" y="80" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14">Beyond Business &amp; Finance</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cnbcSvg)}`;
  }

  // E. BISNIS INDONESIA
  if (domain.includes('bisnis.com')) {
    const bisnisSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#082f49"/>
      <rect x="0" y="435" width="800" height="15" fill="#0ea5e9"/>
      <g transform="translate(400, 190)" text-anchor="middle">
        <text x="0" y="-10" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="36" letter-spacing="1">BISNIS INDONESIA</text>
        <text x="0" y="45" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22">NAVIGASI BISNIS TERPERCAYA</text>
        <text x="0" y="80" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14">Portal Berita Ekonomi &amp; Finansial</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bisnisSvg)}`;
  }

  // F. BLOOMBERG / BLOOMBERG TECHNOZ
  if (domain.includes('bloomberg')) {
    const bbSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#000000"/>
      <g transform="translate(400, 190)" text-anchor="middle">
        <text x="0" y="-10" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="34" letter-spacing="4">BLOOMBERG TECHNOZ</text>
        <text x="0" y="45" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20">FINANCIAL MARKETS NEWS</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bbSvg)}`;
  }

  // G. KOMPAS / MONEY KOMPAS
  if (domain.includes('kompas')) {
    const kompasSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#0a192f"/>
      <rect x="0" y="435" width="800" height="15" fill="#0284c7"/>
      <g transform="translate(400, 190)" text-anchor="middle">
        <text x="0" y="-10" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38" letter-spacing="2">KOMPAS.com</text>
        <text x="0" y="45" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22">MONEY &amp; EKONOMI BISNIS</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(kompasSvg)}`;
  }

  // H. MSN (Microsoft News)
  if (domain.includes('msn.com')) {
    const msnSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#001833"/>
      <rect x="0" y="435" width="800" height="15" fill="#0078d4"/>
      <g transform="translate(400, 185)" text-anchor="middle">
        <circle cx="-35" cy="-25" r="14" fill="#0078d4"/>
        <circle cx="0" cy="-25" r="14" fill="#2b88d8"/>
        <circle cx="35" cy="-25" r="14" fill="#50e6ff"/>
        <text x="0" y="45" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="36" letter-spacing="2">MSN FINANCIAL</text>
        <text x="0" y="80" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="15">Microsoft Network News Feed</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(msnSvg)}`;
  }

  // I. TRIBUNNEWS
  if (domain.includes('tribunnews.com')) {
    const tribunSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#0b1b36"/>
      <rect x="0" y="435" width="800" height="15" fill="#0284c7"/>
      <g transform="translate(400, 185)" text-anchor="middle">
        <rect x="-130" y="-45" width="260" height="50" rx="8" fill="#0284c7"/>
        <text x="0" y="-10" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" letter-spacing="2">TRIBUNNEWS</text>
        <text x="0" y="50" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="22">TRIBUN BISNIS &amp; PASAR</text>
        <text x="0" y="85" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14">Mata Lokal Menjangkau Indonesia</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tribunSvg)}`;
  }

  // J. TEMPO.CO
  if (domain.includes('tempo.co')) {
    const tempoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#180505"/>
      <rect x="0" y="435" width="800" height="15" fill="#dc2626"/>
      <g transform="translate(400, 185)" text-anchor="middle">
        <text x="0" y="-10" fill="#ef4444" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="44" letter-spacing="4">TEMPO.CO</text>
        <text x="0" y="45" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22">BERITA EKONOMI &amp; INVESTIGASI</text>
        <text x="0" y="80" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14">Independen &amp; Terpercaya</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tempoSvg)}`;
  }

  // K. KATADATA
  if (domain.includes('katadata.co.id')) {
    const kataSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
      <rect width="800" height="450" fill="#082032"/>
      <rect x="0" y="435" width="800" height="15" fill="#f97316"/>
      <g transform="translate(400, 185)" text-anchor="middle">
        <text x="0" y="-10" fill="#f97316" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="42" letter-spacing="2">KATADATA</text>
        <text x="0" y="45" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="22">RISET &amp; BERITA EKONOMI</text>
      </g>
    </svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(kataSvg)}`;
  }

  // 4. Default Clean Media Domain Badge
  const domainLabel = record.domain ? record.domain.replace(/^www\./, '').toUpperCase() : 'PORTAL BERITA';
  const defSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#0b1120"/>
    <rect x="0" y="438" width="800" height="12" fill="#0284c7"/>
    <g transform="translate(400, 195)" text-anchor="middle">
      <rect x="-100" y="-45" width="200" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.2"/>
      <text x="0" y="-20" fill="#38bdf8" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" letter-spacing="1">${domainLabel}</text>
      <text x="0" y="40" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="26" letter-spacing="-0.5">DOKUMENTASI MEDIA RESMI</text>
      <text x="0" y="75" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14">Verifikasi Berita Korporasi &amp; Pemegang Saham</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(defSvg)}`;
}
