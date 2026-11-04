import sqlite3
import re
import urllib.request
import ssl
from googlenewsdecoder import gnewsdecoder

DB_PATH = './data/crawler.db'

# Disable SSL check strictly for scraping edge cases
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
}

META_HEADERS = {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
}

def extract_meta_image(url: str) -> str | None:
    if not url or not url.startswith('http'):
        return None
    
    # YouTube video thumbnail
    if 'youtube.com' in url or 'youtu.be' in url:
        m = re.search(r'(?:v=|youtu\.be/|/shorts/|/embed/)([a-zA-Z0-9_-]{11})', url)
        if m:
            return f"https://img.youtube.com/vi/{m.group(1)}/hqdefault.jpg"

    is_meta = any(k in url for k in ['instagram.com', 'threads.net', 'facebook.com'])
    h = META_HEADERS if is_meta else HEADERS

    try:
        req = urllib.request.Request(url, headers=h)
        with urllib.request.urlopen(req, timeout=4.0, context=ctx) as resp:
            html = resp.read(131072).decode('utf-8', errors='ignore')

            # 1. og:image
            m = re.search(r'<meta[^>]+property=["\']og:image(?::url)?["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
            if not m:
                m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image(?::url)?["\']', html, re.I)
            # 2. twitter:image
            if not m:
                m = re.search(r'<meta[^>]+name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
            if not m:
                m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image(?::src)?["\']', html, re.I)

            if m:
                img = m.group(1).strip()
                if img.startswith('//'):
                    img = 'https:' + img
                if img.startswith('http'):
                    return img
    except Exception:
        pass
    return None

def deep_harvest():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("PRAGMA busy_timeout = 5000;")

    # First unmask any remaining Google URLs
    c.execute("SELECT id, url FROM scraped_records WHERE url LIKE '%news.google.com%'")
    g_rows = c.fetchall()
    print(f"Decoding {len(g_rows)} Google news URLs...")
    for rid, g_url in g_rows:
        try:
            res = gnewsdecoder(g_url, timeout=5)
            if res.get('success'):
                real_url = res.get('decoded_url')
                c.execute("UPDATE scraped_records SET url = ? WHERE id = ?", (real_url, rid))
                conn.commit()
        except Exception:
            pass

    # Now scrape images for records that still lack authentic images
    c.execute("SELECT id, url, domain, title FROM scraped_records WHERE image_url IS NULL OR image_url = '' ORDER BY id DESC")
    records = c.fetchall()
    print(f"Scanning {len(records)} records for real news images...")

    success_count = 0
    for rid, url, dom, title in records:
        img = extract_meta_image(url)
        if img:
            c.execute("UPDATE scraped_records SET image_url = ? WHERE id = ?", (img, rid))
            conn.commit()
            success_count += 1
            print(f"[SUCCESS] #{rid} ({dom}) -> {img[:60]}...")
        else:
            print(f"[FALLBACK-BRAND] #{rid} ({dom})")

    conn.close()
    print(f"\nDeep Harvest complete! Extracted {success_count} real news images.")

if __name__ == '__main__':
    deep_harvest()
