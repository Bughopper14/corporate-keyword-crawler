import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'crawler.db');
const db = new Database(DB_PATH);

// Set WAL mode for fast concurrent writes
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    shareholders TEXT NOT NULL DEFAULT '[]', -- JSON string array
    last_crawled_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scraped_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    target_type TEXT NOT NULL, -- 'company' | 'shareholder' | 'combined'
    keyword_used TEXT NOT NULL,
    source_engine TEXT NOT NULL, -- 'duckduckgo' | 'bing_news' | 'google_news' | 'direct_web'
    domain TEXT NOT NULL, -- Destination domain (e.g., bisnis.com, reuters.com, techinasia.com)
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL UNIQUE, -- SHA-256 canonical hash for strict deduplication
    snippet TEXT,
    raw_content TEXT, -- Raw text / HTML snippet for downstream data cleaning
    published_date TEXT,
    clean_status TEXT DEFAULT 'UNVERIFIED', -- 'VALID' | 'RUMOR' | 'UNVERIFIED'
    source_category TEXT DEFAULT 'UNKNOWN', -- 'OFFICIAL' | 'MAINSTREAM_MEDIA' | 'SOCIAL_FORUM' | 'UNKNOWN'
    credibility_score INTEGER DEFAULT 50, -- 0 to 100
    key_claim TEXT, -- Summarized 1-sentence claim / issue
    rumor_keywords TEXT DEFAULT '[]', -- JSON array of detected rumor words
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_records_company ON scraped_records(company_id);
  CREATE INDEX IF NOT EXISTS idx_records_url_hash ON scraped_records(url_hash);
  CREATE INDEX IF NOT EXISTS idx_records_domain ON scraped_records(domain);
`);

function tryAddColumn(colName: string, typeDef: string) {
  try {
    db.exec(`ALTER TABLE scraped_records ADD COLUMN ${colName} ${typeDef}`);
  } catch {
    // Column already exists
  }
}

tryAddColumn('clean_status', "TEXT DEFAULT 'UNVERIFIED'");
tryAddColumn('source_category', "TEXT DEFAULT 'UNKNOWN'");
tryAddColumn('credibility_score', "INTEGER DEFAULT 50");
tryAddColumn('key_claim', "TEXT");
tryAddColumn('key_claim_en', "TEXT");
tryAddColumn('key_claim_zh', "TEXT");
tryAddColumn('image_url', "TEXT");
tryAddColumn('rumor_keywords', "TEXT DEFAULT '[]'");
tryAddColumn('impact_sentiment', "TEXT DEFAULT 'NEUTRAL'");
tryAddColumn('impact_reason', "TEXT");
tryAddColumn('is_video', "INTEGER DEFAULT 0");
tryAddColumn('full_content', "TEXT");

// Auto-detect entity type column for companies
try {
  db.exec(`ALTER TABLE companies ADD COLUMN entity_type TEXT DEFAULT 'AUTO'`);
} catch {}
try {
  db.exec(`ALTER TABLE companies ADD COLUMN industry_segment TEXT`);
} catch {}
try {
  db.exec(`ALTER TABLE companies ADD COLUMN ticker TEXT`);
} catch {}
try {
  db.exec(`ALTER TABLE companies ADD COLUMN financial_data TEXT DEFAULT '{}'`);
} catch {}

try {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_status ON scraped_records(clean_status);
    CREATE INDEX IF NOT EXISTS idx_records_impact ON scraped_records(impact_sentiment);
  `);
} catch {}

export interface FinancialMetric {
  period: string; // e.g. "FY 2025" or "Q1 2026"
  revenue?: string; // Pendapatan
  net_profit?: string; // Laba Bersih
  ebitda?: string; // EBITDA
  assets?: string; // Total Aset
  liabilities?: string; // Total Liabilitas
  equity?: string; // Ekuitas
  market_cap?: string; // Kapitalisasi Pasar
  pe_ratio?: string; // PER
  pbv_ratio?: string; // PBV
  dividend_yield?: string; // Dividen Yield
  currency?: string; // IDR / USD
  notes?: string;
  source?: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  shareholders: string[]; // parsed from JSON
  entity_type?: 'TBK' | 'NON_TBK' | 'INDIVIDUAL' | 'AUTO';
  industry_segment?: string | null;
  ticker?: string | null;
  financial_data?: FinancialMetric | null; // parsed JSON
  last_crawled_at: string | null;
  created_at: string;
  record_count?: number;
}

export interface ScrapedRecord {
  id?: number;
  company_id: number;
  company_name?: string;
  target_type: 'company' | 'shareholder' | 'combined';
  keyword_used: string;
  source_engine: string;
  domain: string;
  title: string;
  url: string;
  url_hash: string;
  snippet?: string;
  raw_content?: string;
  published_date?: string;
  clean_status?: 'VALID' | 'RUMOR' | 'UNVERIFIED';
  source_category?: 'OFFICIAL' | 'MAINSTREAM_MEDIA' | 'SOCIAL_FORUM' | 'UNKNOWN';
  credibility_score?: number;
  key_claim?: string;
  key_claim_en?: string;
  key_claim_zh?: string;
  image_url?: string;
  rumor_keywords?: string[]; // parsed from JSON
  impact_sentiment?: 'GOOD_IMPACT' | 'BAD_IMPACT' | 'NEUTRAL';
  impact_reason?: string;
  is_video?: number;
  created_at?: string;
}

// Canonicalize URL to prevent duplicate tracking params
export function hashUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const searchParams = new URLSearchParams(parsed.search);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid', 'oc'];
    trackingParams.forEach((param) => searchParams.delete(param));
    
    searchParams.sort();
    const query = searchParams.toString();
    const cleanUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}${query ? '?' + query : ''}`.toLowerCase();
    return crypto.createHash('sha256').update(cleanUrl).digest('hex');
  } catch {
    return crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');
  }
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function getAllCompanies(): Company[] {
  const rows = db.prepare(`
    SELECT c.*, COUNT(r.id) as record_count 
    FROM companies c 
    LEFT JOIN scraped_records r ON r.company_id = c.id 
    GROUP BY c.id 
    ORDER BY c.id DESC
  `).all() as any[];

  return rows.map((row) => ({
    ...row,
    shareholders: JSON.parse(row.shareholders || '[]'),
    financial_data: row.financial_data ? JSON.parse(row.financial_data) : null,
  }));
}

export function getCompanyById(id: number): Company | null {
  const row = db.prepare('SELECT * FROM companies WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    shareholders: JSON.parse(row.shareholders || '[]'),
    financial_data: row.financial_data ? JSON.parse(row.financial_data) : null,
  };
}

export function updateCompanyFinancials(id: number, financials: FinancialMetric): void {
  db.prepare(`
    UPDATE companies 
    SET financial_data = ? 
    WHERE id = ?
  `).run(JSON.stringify(financials), id);
}

export function createCompany(name: string, shareholders: string[], entityType = 'AUTO'): Company {
  const normName = name.trim();
  let detectedType = entityType;
  if (detectedType === 'AUTO') {
    const lower = normName.toLowerCase();
    if (lower.includes('tbk') || lower.includes('terbuka') || /\b[a-z]{4}\b/.test(lower)) {
      detectedType = 'TBK';
    } else if (lower.startsWith('pt') || lower.startsWith('cv') || lower.includes('ltd') || lower.includes('inc') || lower.includes('corp')) {
      detectedType = 'NON_TBK';
    } else {
      detectedType = 'INDIVIDUAL';
    }
  }

  const stmt = db.prepare(`
    INSERT INTO companies (name, shareholders, entity_type) 
    VALUES (?, ?, ?)
  `);
  const info = stmt.run(normName, JSON.stringify(shareholders.map((s) => s.trim()).filter(Boolean)), detectedType);
  return getCompanyById(Number(info.lastInsertRowid))!;
}

export function updateCompanyLastCrawled(id: number): void {
  const now = new Date().toISOString();
  db.prepare('UPDATE companies SET last_crawled_at = ? WHERE id = ?').run(now, id);
}

export function insertScrapedRecord(record: Omit<ScrapedRecord, 'id' | 'created_at'>): { inserted: boolean; recordId?: number } {
  try {
    const stmt = db.prepare(`
      INSERT INTO scraped_records (
        company_id, target_type, keyword_used, source_engine, domain, title, url, url_hash, snippet, raw_content, published_date,
        clean_status, source_category, credibility_score, key_claim, rumor_keywords
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      record.company_id,
      record.target_type,
      record.keyword_used,
      record.source_engine,
      record.domain || extractDomain(record.url),
      record.title,
      record.url,
      record.url_hash,
      record.snippet || null,
      record.raw_content || null,
      record.published_date || null,
      record.clean_status || 'UNVERIFIED',
      record.source_category || 'UNKNOWN',
      record.credibility_score ?? 50,
      record.key_claim || null,
      JSON.stringify(record.rumor_keywords || [])
    );

    return { inserted: true, recordId: Number(result.lastInsertRowid) };
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE constraint failed')) {
      return { inserted: false };
    }
    throw err;
  }
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getRecordsPaginated(options: {
  companyId?: number | null;
  status?: string | null;
  impact?: string | null;
  isVideo?: boolean;
  search?: string | null;
  page?: number;
  limit?: number;
}): PaginatedResult<ScrapedRecord & { company_name: string }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(10, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];

  if (options.companyId) {
    conditions.push('r.company_id = ?');
    params.push(options.companyId);
  }

  if (options.status && options.status !== 'ALL') {
    conditions.push('r.clean_status = ?');
    params.push(options.status);
  }

  if (options.impact && options.impact !== 'ALL') {
    conditions.push('r.impact_sentiment = ?');
    params.push(options.impact);
  }

  if (options.isVideo) {
    conditions.push('(r.is_video = 1 OR r.domain LIKE "%youtube%" OR r.url LIKE "%youtube.com%")');
  }

  if (options.search && options.search.trim()) {
    conditions.push('(r.title LIKE ? OR r.domain LIKE ? OR r.snippet LIKE ? OR r.key_claim LIKE ?)');
    const term = `%${options.search.trim()}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countRow = db.prepare(`
    SELECT count(*) as total 
    FROM scraped_records r 
    JOIN companies c ON c.id = r.company_id 
    ${whereClause}
  `).get(...params) as any;

  const total = countRow ? Number(countRow.total) : 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Get records with offset and limit
  const rows = db.prepare(`
    SELECT r.*, c.name as company_name 
    FROM scraped_records r 
    JOIN companies c ON c.id = r.company_id 
    ${whereClause} 
    ORDER BY r.id DESC 
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as any[];

  const data = rows.map((r) => ({
    ...r,
    rumor_keywords: JSON.parse(r.rumor_keywords || '[]'),
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

export function getEditorialHighlights(): (ScrapedRecord & { company_name: string })[] {
  // Pull 4 high-impact stories from diverse domains (e.g., Bloomberg, Kompas, CNBC, Investor, X)
  // that have verified cover photos
  const rows = db.prepare(`
    SELECT r.*, c.name as company_name 
    FROM scraped_records r 
    JOIN companies c ON c.id = r.company_id 
    WHERE (r.image_url IS NOT NULL AND r.image_url != '')
    GROUP BY r.domain
    ORDER BY r.id DESC 
    LIMIT 4
  `).all() as any[];

  return rows.map((r) => ({
    ...r,
    rumor_keywords: JSON.parse(r.rumor_keywords || '[]'),
  }));
}

export function getAllRecords(limit = 200): (ScrapedRecord & { company_name: string })[] {
  const rows = db.prepare(`
    SELECT r.*, c.name as company_name 
    FROM scraped_records r 
    JOIN companies c ON c.id = r.company_id 
    ORDER BY r.id DESC 
    LIMIT ?
  `).all(limit) as any[];

  return rows.map((r) => ({
    ...r,
    rumor_keywords: JSON.parse(r.rumor_keywords || '[]'),
  }));
}

export function updateRecordCleaning(id: number, data: {
  clean_status: 'VALID' | 'RUMOR' | 'UNVERIFIED';
  source_category: 'OFFICIAL' | 'MAINSTREAM_MEDIA' | 'SOCIAL_FORUM' | 'UNKNOWN';
  credibility_score: number;
  key_claim: string;
  key_claim_en?: string;
  key_claim_zh?: string;
  image_url?: string;
  rumor_keywords: string[];
  impact_sentiment: 'GOOD_IMPACT' | 'BAD_IMPACT' | 'NEUTRAL';
  impact_reason: string;
  is_video: number;
}): void {
  db.prepare(`
    UPDATE scraped_records 
    SET clean_status = ?, source_category = ?, credibility_score = ?, key_claim = ?,
        key_claim_en = COALESCE(?, key_claim_en), key_claim_zh = COALESCE(?, key_claim_zh),
        image_url = COALESCE(?, image_url),
        rumor_keywords = ?, impact_sentiment = ?, impact_reason = ?, is_video = ?
    WHERE id = ?
  `).run(
    data.clean_status,
    data.source_category,
    data.credibility_score,
    data.key_claim,
    data.key_claim_en || null,
    data.key_claim_zh || null,
    data.image_url || null,
    JSON.stringify(data.rumor_keywords),
    data.impact_sentiment,
    data.impact_reason,
    data.is_video,
    id
  );
}

export function getUncleanedRecords(limit = 100): ScrapedRecord[] {
  const rows = db.prepare(`
    SELECT * FROM scraped_records 
    WHERE clean_status = 'UNVERIFIED' OR clean_status IS NULL 
    LIMIT ?
  `).all(limit) as any[];

  return rows.map((r) => ({
    ...r,
    rumor_keywords: JSON.parse(r.rumor_keywords || '[]'),
  }));
}

export function countGoogleMaskedRecords(): number {
  const row = db.prepare(`
    SELECT count(*) as count 
    FROM scraped_records 
    WHERE url LIKE '%news.google.com%'
  `).get() as any;
  return row ? Number(row.count) : 0;
}

export function getDatabaseAudit() {
  const journalMode = db.pragma('journal_mode', { simple: true }) as string;
  const busyTimeout = db.pragma('busy_timeout', { simple: true }) as number;
  const synchronous = db.pragma('synchronous', { simple: true }) as number;
  const foreignKeys = db.pragma('foreign_keys', { simple: true }) as number;
  const integrity = db.pragma('quick_check', { simple: true }) as string;
  const checkpoint = db.pragma('wal_checkpoint(PASSIVE)') as any[];

  return {
    status: 'healthy',
    wal_enabled: typeof journalMode === 'string' && journalMode.toLowerCase() === 'wal',
    busy_timeout_ms: Number(busyTimeout),
    journal_mode: journalMode,
    synchronous_mode: synchronous === 1 ? 'NORMAL' : synchronous,
    foreign_keys_enabled: foreignKeys === 1,
    integrity_status: integrity,
    wal_checkpoint: checkpoint && checkpoint.length > 0 ? checkpoint[0] : null,
    db_path: DB_PATH,
  };
}

export default db;
