import sqlite3
import urllib.request
import ssl
import re
import json
import time

DB_PATH = './data/crawler.db'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
}

def extract_article_text(html: str) -> str:
    # 1. Remove unwanted script, style, nav, footer, aside, ads tags
    cleaned = re.sub(r'<(script|style|nav|footer|header|aside|noscript|svg|button)[^>]*>.*?</\1>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    
    # 2. Extract paragraphs inside article containers or standard <p> tags
    p_matches = re.findall(r'<p[^>]*>(.*?)</p>', cleaned, flags=re.DOTALL | re.IGNORECASE)
    
    paragraphs = []
    for p in p_matches:
        # Strip internal tags like <a>, <span>, <strong>
        text = re.sub(r'<[^>]+>', ' ', p)
        text = re.sub(r'&nbsp;', ' ', text, flags=re.IGNORECASE)
        text = re.sub(r'&amp;', '&', text, flags=re.IGNORECASE)
        text = re.sub(r'&quot;', '"', text, flags=re.IGNORECASE)
        text = re.sub(r'&#39;', "'", text, flags=re.IGNORECASE)
        text = re.sub(r'[\u200B-\u200D\uFEFF\u200E\u200F\u00A0]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Filter out noisy short sentences / ads / copyright lines
        if len(text) > 40 and not any(noise in text.lower() for noise in ['baca juga:', 'simak juga:', 'copyright', 'all rights reserved', 'advertisement', 'pilihan editor:']):
            paragraphs.append(text)
            
    return "\n\n".join(paragraphs)

def harvest_deep_articles(limit=250):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("PRAGMA busy_timeout = 5000;")

    # Find records with empty full_content
    c.execute("""
        SELECT id, url, domain, title 
        FROM scraped_records 
        WHERE (full_content IS NULL OR length(full_content) < 150)
          AND domain NOT IN ('instagram.com', 'x.com', 'twitter.com', 'youtube.com')
        ORDER BY id DESC 
        LIMIT ?
    """, (limit,))
    
    rows = c.fetchall()
    print(f"Scraping deep full content for {len(rows)} web news articles...")

    success_count = 0
    for rid, url, dom, title in rows:
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=8.0, context=ctx) as resp:
                html = resp.read().decode('utf-8', errors='ignore')
                full_text = extract_article_text(html)

                if len(full_text) > 200:
                    c.execute("UPDATE scraped_records SET full_content = ? WHERE id = ?", (full_text, rid))
                    conn.commit()
                    success_count += 1
                    print(f"[OK] #{rid} ({dom}) -> Extracted {len(full_text)} chars ({full_text.count(chr(10))} paragraphs)")
                else:
                    print(f"[SHORT] #{rid} ({dom}) -> Only {len(full_text)} chars found")
        except Exception as e:
            print(f"[FAIL] #{rid} ({dom}): {e}")
        time.sleep(0.3)

    conn.close()
    print(f"\nDone! Successfully updated {success_count} articles with deep comprehensive content.")

if __name__ == '__main__':
    harvest_deep_articles(limit=40)
