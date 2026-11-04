# Corporate Keyword & Intelligence Crawler

A high-performance corporate news monitoring cockpit, shareholder entity intelligence platform, and automated media harvester built with **Next.js 16 (Turbopack)**, **Tailwind CSS**, and **Motion (v12)**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## Overview
Corporate Keyword Crawler enables financial analysts and legal compliance officers to track public news, corporate filings, bowheer contracts, and shareholder data across public sources with an executive editorial interface.

### Key Capabilities
- **Multi-Layer News Harvester:** Resilient extraction pipeline (direct parsing, Next.js `__NEXT_DATA__` SSR extraction, metadata fallback, and local cover caching).
- **Executive Intelligence Dossier:** Single-page comprehensive long-read format detailing corporate summaries, commercial ecosystems, AHU legal deeds, and bank credit facilities.
- **Kinetic Micro-Interactions:** Tactile sliding pills and fluid layout transitions powered by `motion/react`.
- **Editorial Typography:** High-contrast Newsreader serif display styling optimized for financial and market intelligence analysis.
- **AI Synthesis Sidecar:** RAG-powered financial metric extraction and multilingual translation support.

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v20+ 
- **Python**: v3.11+ (for background harvesting scripts)
- **SQLite3**

### 2. Installation
```bash
git clone https://github.com/Bughopper14/corporate-keyword-crawler.git
cd corporate-keyword-crawler
npm install
```

### 3. Environment Variables
Copy the example environment template:
```bash
cp .env.example .env.local
```

Configure your local or remote LLM endpoint (compatible with OpenAI format):
```env
PORT=3000
NODE_ENV=development
ROUTER_BASE_URL=http://localhost:8000/v1
ROUTER_API_KEY=your-api-key-here
```

### 4. Running the Cockpit
```bash
# Development mode
npm run dev

# Production build & serve
npm run build
npm start
```

---

## Architecture
```
├── scripts/                      # Harvester waterfall & maintenance scripts
│   ├── waterfall_harvester.py    # Multi-tier full-text news extractor
│   ├── unmask_urls.py            # Decodes Google News encrypted redirects
│   └── cache_all_covers.py       # Local high-res thumbnail cacher
├── src/
│   ├── app/                      # Next.js 16 App Router & API routes
│   │   ├── api/records/          # Search & feed queries
│   │   ├── api/companies/        # Monitored entities & dossiers
│   │   └── api/chat/             # LLM corporate intelligence queries
│   ├── components/cockpit/       # Modular UI components (<250 LOC)
│   │   ├── CorporateIntelligenceDossier.tsx
│   │   ├── FeedFilterTabs.tsx
│   │   ├── GlassySidebar.tsx
│   │   └── NewsListItem.tsx
│   └── lib/                      # Database & crawler orchestration
└── public/                       # Localized cover assets & brand icons
```

## License
MIT License.
