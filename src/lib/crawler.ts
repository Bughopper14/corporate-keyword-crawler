import { hashUrl, extractDomain, insertScrapedRecord, updateCompanyLastCrawled, getCompanyById } from './db';
import type { ScrapedRecord } from './db';
import { extractRealOgImage } from './og-extractor';

interface RawSearchResult {
  title: string;
  url: string;
  snippet: string;
  source_engine: string;
  source_name?: string;
  real_domain?: string;
  published_date?: string;
}

// Clean HTML entities and tags
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();
}

export type TimeRangeMode = '7d' | '30d' | 'custom';

export interface TimeRangeOption {
  mode: TimeRangeMode;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

// Blacklist of untrusted scrapers, dead mirrors, and spam aggregators
export const BLACKLISTED_DOMAINS = [
  'twaslnews.com',
  'twaslnews1.twaslnews.com',
  'qoo10.co.id',
  'gadget.qoo10.co.id',
  'peradaban.id',
  'topik.id',
  'autoblog',
  'free-news',
  'scraper',
];

export function isBlockedOrSpamDomain(domain?: string | null, url?: string | null): boolean {
  if (!domain && !url) return false;
  const target = `${domain || ''} ${url || ''}`.toLowerCase();
  return BLACKLISTED_DOMAINS.some(b => target.includes(b));
}

// 1. DuckDuckGo Open Web Search with dynamic date filtering
async function searchDuckDuckGo(query: string, timeRange: TimeRangeOption = { mode: '7d' }): Promise<RawSearchResult[]> {
  const results: RawSearchResult[] = [];
  try {
    const url = 'https://lite.duckduckgo.com/lite/';
    const formBody = new URLSearchParams();
    formBody.append('q', query);
    
    // Date filter: df=w (week) or df=m (month)
    if (timeRange.mode === '30d') {
      formBody.append('df', 'm');
    } else {
      formBody.append('df', 'w');
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html',
      },
      body: formBody.toString(),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return results;
    const html = await res.text();

    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi;

    const links: { href: string; title: string }[] = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({
        href: match[1],
        title: cleanText(match[2]),
      });
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(cleanText(match[1]));
    }

    for (let i = 0; i < links.length; i++) {
      let rawUrl = links[i].href;
      if (rawUrl.includes('/l/?uddg=')) {
        try {
          const matchUddg = rawUrl.match(/uddg=([^&]+)/);
          if (matchUddg) rawUrl = decodeURIComponent(matchUddg[1]);
        } catch {}
      }

      if (rawUrl.startsWith('http')) {
        const domain = extractDomain(rawUrl);
        results.push({
          title: links[i].title,
          url: rawUrl,
          snippet: snippets[i] || '',
          source_engine: 'duckduckgo',
          source_name: domain,
          real_domain: domain,
          published_date: new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.error(`[DDG Search Error] ${err.message}`);
  }
  return results;
}

// 2. Bing News RSS with dynamic date window
async function searchBingNews(query: string, timeRange: TimeRangeOption = { mode: '7d' }): Promise<RawSearchResult[]> {
  const results: RawSearchResult[] = [];
  try {
    const encoded = encodeURIComponent(query);
    // interval="7" for 7d, interval="9" for past month
    const intervalParam = timeRange.mode === '30d' ? 'interval%3d"9"' : 'interval%3d"7"';
    const url = `https://www.bing.com/news/search?q=${encoded}&qft=${intervalParam}&format=rss&setlang=id&cc=id`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return results;
    const xml = await res.text();
    const items = xml.split('<item>');

    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        let destUrl = cleanText(linkMatch[1]);
        if (destUrl.includes('bing.com/news/apiclick.aspx')) {
          try {
            const parsed = new URL(destUrl);
            const originalUrl = parsed.searchParams.get('url');
            if (originalUrl) destUrl = decodeURIComponent(originalUrl);
          } catch {}
        }

        const domain = extractDomain(destUrl);
        results.push({
          title: cleanText(titleMatch[1]),
          url: destUrl,
          snippet: cleanText(descMatch ? descMatch[1] : ''),
          source_engine: 'bing_news',
          source_name: domain,
          real_domain: domain,
          published_date: pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.error(`[Bing Search Error] ${err.message}`);
  }
  return results;
}

// 3. Google News RSS with dynamic date window & custom range support
async function searchGoogleNews(query: string, timeRange: TimeRangeOption = { mode: '7d' }): Promise<RawSearchResult[]> {
  const results: RawSearchResult[] = [];
  try {
    let dateFilter = 'when:7d';
    if (timeRange.mode === '30d') {
      dateFilter = 'when:30d';
    } else if (timeRange.mode === 'custom' && timeRange.startDate && timeRange.endDate) {
      dateFilter = `after:${timeRange.startDate}+before:${timeRange.endDate}`;
    }

    const encoded = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encoded}+${dateFilter}&hl=id&gl=ID&ceid=ID:id`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return results;
    const xml = await res.text();
    const items = xml.split('<item>');

    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source([^>]*)>([\s\S]*?)<\/source>/);

      if (titleMatch && linkMatch) {
        const destUrl = cleanText(linkMatch[1]);
        let sourceName = 'Google News';
        let realDomain = extractDomain(destUrl);

        if (sourceMatch) {
          sourceName = cleanText(sourceMatch[2]) || 'Google News';
          const urlAttr = sourceMatch[1].match(/url="([^"]+)"/);
          if (urlAttr) {
            realDomain = extractDomain(urlAttr[1]);
          } else {
            // Map common source names
            const sLower = sourceName.toLowerCase();
            if (sLower.includes('instagram')) realDomain = 'instagram.com';
            else if (sLower.includes('x') || sLower.includes('twitter')) realDomain = 'x.com';
            else if (sLower.includes('stockbit')) realDomain = 'stockbit.com';
            else if (sLower.includes('youtube')) realDomain = 'youtube.com';
          }
        }

        results.push({
          title: cleanText(titleMatch[1]),
          url: destUrl,
          snippet: cleanText(descMatch ? descMatch[1] : ''),
          source_engine: 'google_news',
          source_name: sourceName,
          real_domain: realDomain,
          published_date: pubDateMatch ? cleanText(pubDateMatch[1]) : new Date().toISOString(),
        });
      }
    }
  } catch (err: any) {
    console.error(`[Google News Search Error] ${err.message}`);
  }
  return results;
}

export interface CrawlStats {
  company_id: number;
  company_name: string;
  total_discovered: number;
  new_inserted: number;
  duplicate_skipped: number;
  keywords_crawled: string[];
  new_records: ScrapedRecord[];
}

// Helper sleep with jitter to prevent bot detection
function sleepWithJitter(baseMs = 1200): Promise<void> {
  const jitter = Math.floor(Math.random() * 800); // 0 - 800ms jitter
  return new Promise((resolve) => setTimeout(resolve, baseMs + jitter));
}

// Orchestrator: Seek data across Web, Social Media (X, IG, Stockbit, YT), & Market Rumors
export async function seekCompanyData(companyId: number, timeRange: TimeRangeOption = { mode: '7d' }): Promise<CrawlStats> {
  const company = getCompanyById(companyId);
  if (!company) {
    throw new Error(`Company ID ${companyId} not found`);
  }

  // 1. Auto-detect Entity Nature (Tbk vs Non-Tbk / Individual)
  const lowerName = company.name.toLowerCase();
  const isTbk = company.entity_type === 'TBK' || lowerName.includes('tbk') || lowerName.includes('terbuka');

  const searchPlans: { query: string; target_type: 'company' | 'shareholder' | 'combined' }[] = [];

  // Social sites targeted
  const socialFilter = '(site:x.com OR site:twitter.com OR site:instagram.com OR site:threads.net OR site:stockbit.com OR site:youtube.com OR site:reddit.com)';
  
  // Specific Rumor & Risk Filter according to Entity Type
  const rumorFilter = isTbk
    ? '(rumor OR isu OR spekulasi OR bocoran OR hearing OR dikabarkan OR "cek ombak")'
    : '(gugatan OR sengketa OR PKPU OR pailit OR wanprestasi OR tender OR "menang tender" OR amdal OR izin OR dugaan)';

  // 1. Core Entity Query (Broad & Unlimited by 7d strictly if results are low)
  searchPlans.push({
    query: `"${company.name}"`,
    target_type: 'company',
  });

  // 2. Ticker / Short Code / Known Alias Query (e.g. "PT LMA" / "Lancarjaya Mandiri Abadi")
  const shortAlias = company.name.replace(/^(PT|CV)\s+/i, '').trim();
  if (shortAlias !== company.name) {
    searchPlans.push({
      query: `"${shortAlias}"`,
      target_type: 'company',
    });
  }

  // 3. Customer Intelligence Dimension: Bowheer, Project Owners & Tenders
  searchPlans.push({
    query: `"${shortAlias}" (bowheer OR "owner proyek" OR kontraktor OR subkon OR tender OR "kontrak baru" OR konsesi)`,
    target_type: 'company',
  });

  // 4. Benefactor, UBO, & Deeds (Akta Perusahaan, Notaris, Kemenkumham, AHU, Pengurus)
  searchPlans.push({
    query: `"${shortAlias}" (akta OR notaris OR Kemenkumham OR AHU OR direksi OR komisaris OR "pemilik manfaat" OR UBO)`,
    target_type: 'company',
  });

  // 5. Financial Statements, Audit, Banking & Financing
  searchPlans.push({
    query: `"${shortAlias}" ("laporan keuangan" OR "financial statement" OR audit OR laba OR utang OR kredit OR perbankan OR sindikasi)`,
    target_type: 'company',
  });

  // 6. Entity Social Media / Public Footprint
  searchPlans.push({
    query: `"${company.name}" ${socialFilter}`,
    target_type: 'company',
  });

  // 7. Entity Rumor / Legal Risk Query
  searchPlans.push({
    query: `"${company.name}" ${rumorFilter}`,
    target_type: 'company',
  });

  // 4. Coalesced Shareholder / Stakeholder Queries (Batching to prevent query explosion)
  const validStakeholders = company.shareholders.map((s) => s.trim()).filter(Boolean);

  if (validStakeholders.length > 0) {
    // If multiple stakeholders, combine them with OR operator to save HTTP requests!
    const shCombinedQuery = validStakeholders.map((sh) => `"${sh}"`).join(' OR ');

    // Individual / Combined Stakeholders
    searchPlans.push({
      query: `(${shCombinedQuery})`,
      target_type: 'shareholder',
    });

    // Stakeholders on Social Media
    searchPlans.push({
      query: `(${shCombinedQuery}) ${socialFilter}`,
      target_type: 'shareholder',
    });

    // Specific Rumor & Risk Filter according to Entity Type
    const rumorFilter = isTbk
      ? '(rumor OR isu OR spekulasi OR bocoran OR hearing OR dikabarkan OR "cek ombak")'
      : '(gugatan OR sengketa OR PKPU OR pailit OR wanprestasi OR tender OR "menang tender" OR amdal OR izin OR dugaan)';

    // Combined Entity + Stakeholders with Rumor / Legal filter
    searchPlans.push({
      query: `"${shortAlias}" (${shCombinedQuery}) ${rumorFilter}`,
      target_type: 'combined',
    });

    // Combined Entity + Stakeholders with Deeds, Bowheer & Commercial Relations
    searchPlans.push({
      query: `"${shortAlias}" (${shCombinedQuery}) (divestasi OR akuisisi OR saham OR konsorsium OR subkon OR bowheer)`,
      target_type: 'combined',
    });
  }

  let totalDiscovered = 0;
  let newInserted = 0;
  let duplicateSkipped = 0;
  const keywordsCrawled: string[] = [];
  const newRecords: ScrapedRecord[] = [];

  for (const plan of searchPlans) {
    keywordsCrawled.push(plan.query);

    // Concurrently fetch across engines with specific time range
    const [ddgResults, bingResults, googleResults] = await Promise.all([
      searchDuckDuckGo(plan.query, timeRange),
      searchBingNews(plan.query, timeRange),
      searchGoogleNews(plan.query, timeRange),
    ]);

    const combinedPool = [...ddgResults, ...bingResults, ...googleResults];
    totalDiscovered += combinedPool.length;

    for (const item of combinedPool) {
      // ─── STRICT RELEVANCE GATE ───
      const textToVerify = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();
      
      const companyWords = company.name.toLowerCase()
        .replace(/pt|tbk|persero|cv/g, '')
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3);
        
      const shWords = company.shareholders
        .flatMap(sh => sh.toLowerCase().split(/\s+/))
        .map(w => w.trim())
        .filter(w => w.length >= 3);
        
      // Ticker aliases for known groups
      const tickerAliases = ['bren', 'barito', 'chandra asri', 'tpia', 'petrindo', 'cuan', 'ptro'];
      const allTargetTokens = [...companyWords, ...shWords, ...tickerAliases];
      
      const isRelevant = allTargetTokens.some(token => textToVerify.includes(token));
      if (!isRelevant) {
        continue;
      }

      const uHash = hashUrl(item.url);
      const domain = item.real_domain || extractDomain(item.url);

      // Pre-flight filter: reject spam scrapers, mirrors, and dead domains immediately
      if (isBlockedOrSpamDomain(domain, item.url)) {
        continue;
      }

      // Scrape real og:image from the destination article directly
      const realOgImage = await extractRealOgImage(item.url, 3000);

      const recordToInsert = {
        company_id: company.id,
        target_type: plan.target_type,
        keyword_used: plan.query,
        source_engine: item.source_engine,
        domain: domain,
        title: item.title,
        url: item.url,
        url_hash: uHash,
        snippet: item.snippet,
        image_url: realOgImage || undefined,
        raw_content: JSON.stringify({
          title: item.title,
          url: item.url,
          engine: item.source_engine,
          source_name: item.source_name || domain,
          domain: domain,
          snippet: item.snippet,
          published_date: item.published_date,
          image_url: realOgImage || null,
        }),
        published_date: item.published_date,
      };

      const result = insertScrapedRecord(recordToInsert);
      if (result.inserted) {
        newInserted++;
        newRecords.push({
          ...recordToInsert,
          id: result.recordId,
        });
      } else {
        duplicateSkipped++;
      }
    }

    // ─── ANTI-BAN PACING JITTER ───
    // Jeda sopan 1.2s - 2.0s antar query plan agar IP server tidak terkena ban / rate limit
    await sleepWithJitter(1300);
  }

  updateCompanyLastCrawled(company.id);

  // Background trigger: auto-harvest pending deep articles for newly inserted records
  if (newInserted > 0) {
    try {
      const { spawn } = await import('child_process');
      const child = spawn('python3', ['scripts/gentle_harvester.py', '10'], {
        detached: true,
        stdio: 'ignore',
        cwd: '.'
      });
      child.unref();
    } catch (e) {
      // Non-blocking background worker
    }
  }

  return {
    company_id: company.id,
    company_name: company.name,
    total_discovered: totalDiscovered,
    new_inserted: newInserted,
    duplicate_skipped: duplicateSkipped,
    keywords_crawled: keywordsCrawled,
    new_records: newRecords,
  };
}
