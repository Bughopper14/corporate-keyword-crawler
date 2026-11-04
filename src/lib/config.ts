import path from 'path';
import fs from 'fs';

export interface AppConfig {
  app: {
    name: string;
    basePath: string;
    port: number;
    host: string;
  };
  database: {
    sqlitePath: string;
    vectorStorePath: string;
  };
  assets: {
    coversDir: string;
  };
  llm: {
    routerBaseUrl: string;
    model: string;
    timeoutMs: number;
  };
  crawler: {
    defaultTimeRange: string;
    maxResultsPerQuery: number;
    requestTimeoutMs: number;
    gentleDelayMinMs: number;
    gentleDelayMaxMs: number;
  };
}

const PROJECT_ROOT = process.cwd();
const CONFIG_FILE_PATH = path.join(PROJECT_ROOT, 'config.json');

let rawConfig: any = {};
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    rawConfig = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
  }
} catch (e) {
  console.warn('[config] Warning: Failed to read config.json, using defaults:', e);
}

export const config: AppConfig = {
  app: {
    name: rawConfig.app?.name || 'CorporateKeywordCrawler',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || rawConfig.app?.basePath || '',
    port: Number(process.env.PORT) || rawConfig.app?.port || 3000,
    host: process.env.HOST || rawConfig.app?.host || 'localhost'
  },
  database: {
    sqlitePath: path.resolve(PROJECT_ROOT, rawConfig.database?.sqlitePath || 'data/crawler.db'),
    vectorStorePath: path.resolve(PROJECT_ROOT, rawConfig.database?.vectorStorePath || 'data/vector_store')
  },
  assets: {
    coversDir: path.resolve(PROJECT_ROOT, rawConfig.assets?.coversDir || 'public/covers')
  },
  llm: {
    routerBaseUrl: process.env.ROUTER_BASE_URL || rawConfig.llm?.routerBaseUrl || 'http://localhost:8000/v1',
    model: process.env.LLM_MODEL || rawConfig.llm?.model || 'gpt-4o-mini',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS) || rawConfig.llm?.timeoutMs || 8000
  },
  crawler: {
    defaultTimeRange: rawConfig.crawler?.defaultTimeRange || '7d',
    maxResultsPerQuery: rawConfig.crawler?.maxResultsPerQuery || 30,
    requestTimeoutMs: rawConfig.crawler?.requestTimeoutMs || 10000,
    gentleDelayMinMs: rawConfig.crawler?.gentleDelayMinMs || 1200,
    gentleDelayMaxMs: rawConfig.crawler?.gentleDelayMaxMs || 2000
  }
};

export default config;
