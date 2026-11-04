#!/usr/bin/env python3
import sqlite3
import sys
import time
import re
import urllib.request
from urllib.parse import urlparse
from googlenewsdecoder import gnewsdecoder

DB_PATH = './data/crawler.db'

def extract_domain(url: str) -> str:
    try:
        hostname = urlparse(url).hostname or ''
        return hostname.replace('www.', '')
    except Exception:
        return 'unknown'

def fetch_og_image(url: str, timeout=3.5) -> str | None:
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            content = response.read(65536).decode('utf-8', errors='ignore')
            m = re.search(r'<meta[^>]+property=["\']og:image(?::url)?["\'][^>]+content=["\']([^"\']+)["\']', content, re.I)
            if not m:
                m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::url)?["\']', content, re.I)
            if not m:
                m = re.search(r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']', content, re.I)
            if m:
                img = m.group(1).strip()
                if img.startswith('http'):
                    return img
    except Exception:
        pass
    return None

def unmask_all(limit=100):
    conn = sqlite3.connect(DB_PATH, timeout=5.0)
    c = conn.cursor()
    c.execute("PRAGMA busy_timeout = 5000;")
    c.execute("SELECT id, url FROM scraped_records WHERE url LIKE '%news.google.com%' LIMIT ?", (limit,))
    rows = c.fetchall()
    
    print(f"Found {len(rows)} Google News URLs to unmask...")
    unmasked = 0
    
    for row_id, g_url in rows:
        try:
            res = gnewsdecoder(g_url, timeout=5)
            if res.get('success'):
                real_url = res.get('decoded_url')
                real_domain = extract_domain(real_url)
                
                # Check category
                socials = ['instagram.com', 'x.com', 'twitter.com', 'threads.net', 'stockbit.com', 'youtube.com', 'reddit.com', 'tiktok.com']
                category = 'SOCIAL_FORUM' if any(s in real_domain for s in socials) else 'MAINSTREAM_MEDIA'
                
                # Also fetch real og:image upon unmasking
                real_img = fetch_og_image(real_url)
                
                if real_img:
                    c.execute("""
                        UPDATE scraped_records 
                        SET url = ?, domain = ?, source_category = ?, image_url = ?
                        WHERE id = ?
                    """, (real_url, real_domain, category, real_img, row_id))
                else:
                    c.execute("""
                        UPDATE scraped_records 
                        SET url = ?, domain = ?, source_category = ?
                        WHERE id = ?
                    """, (real_url, real_domain, category, row_id))
                conn.commit()
                unmasked += 1
                print(f"[{unmasked}/{len(rows)}] #{row_id} -> {real_url[:75]}... (Img: {'YES' if real_img else 'NO'})")
        except Exception as e:
            print(f"Error row #{row_id}: {e}")
        time.sleep(0.1)
        
    conn.close()
    print(f"Finished. Successfully unmasked {unmasked} URLs.")

if __name__ == '__main__':
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    unmask_all(limit)
