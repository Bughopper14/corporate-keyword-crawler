export interface FinancialMetric {
  period: string;
  revenue?: string;
  net_profit?: string;
  ebitda?: string;
  assets?: string;
  liabilities?: string;
  equity?: string;
  market_cap?: string;
  pe_ratio?: string;
  pbv_ratio?: string;
  dividend_yield?: string;
  currency?: string;
  notes?: string;
  source?: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  shareholders: string[];
  entity_type?: 'TBK' | 'NON_TBK' | 'INDIVIDUAL' | 'AUTO';
  industry_segment?: string | null;
  ticker?: string | null;
  financial_data?: FinancialMetric | null;
  last_crawled_at: string | null;
  created_at: string;
  record_count?: number;
}

export interface ScrapedRecord {
  id: number;
  company_id: number;
  company_name?: string;
  target_type: 'company' | 'shareholder' | 'combined';
  keyword_used: string;
  source_engine: string;
  domain: string;
  title: string;
  url: string;
  url_hash?: string;
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
  rumor_keywords?: string[];
  impact_sentiment?: 'GOOD_IMPACT' | 'BAD_IMPACT' | 'NEUTRAL';
  impact_reason?: string;
  is_video?: number;
  full_content?: string;
  created_at: string;
}

export type FilterTab = 'ALL' | 'VALID' | 'RUMOR' | 'GOOD' | 'BAD' | 'VIDEO';
