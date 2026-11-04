import os
import sys
import sqlite3
import urllib.request
import ssl
import hashlib
import time

DB_PATH = './data/crawler.db'
SAVE_DIR = './public/covers'

os.makedirs(SAVE_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
}

def download_and_localize():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("PRAGMA busy_timeout = 5000;")

    c.execute("SELECT id, image_url, domain FROM scraped_records WHERE image_url LIKE 'http%'")
    rows = c.fetchall()
    print(f"Checking {len(rows)} remote images to cache locally...")

    cached_count = 0
    for rid, img_url, dom in rows:
        # Clean HTML entity &amp; in image_url
        clean_img_url = img_url.replace('&amp;', '&')
        
        ext = '.jpg'
        if '.png' in clean_img_url.lower(): ext = '.png'
        elif '.webp' in clean_img_url.lower(): ext = '.webp'
        
        file_hash = hashlib.md5(f"{rid}_{clean_img_url[:80]}".encode()).hexdigest()[:16]
        filename = f"cover_{rid}_{file_hash}{ext}"
        filepath = os.path.join(SAVE_DIR, filename)
        local_url = f"/KeywordCrawler/covers/{filename}"

        if not os.path.exists(filepath):
            try:
                headers = dict(HEADERS)
                if 'instagram' in dom or 'cdninstagram' in clean_img_url:
                    headers['Referer'] = 'https://www.instagram.com/'
                elif 'twitter' in dom or 'x.com' in dom or 'twimg' in clean_img_url:
                    headers['Referer'] = 'https://x.com/'

                req = urllib.request.Request(clean_img_url, headers=headers)
                with urllib.request.urlopen(req, timeout=7.0, context=ctx) as resp:
                    data = resp.read()
                    if len(data) > 500: # Valid image
                        with open(filepath, 'wb') as f:
                            f.write(data)
                        c.execute("UPDATE scraped_records SET image_url = ? WHERE id = ?", (local_url, rid))
                        conn.commit()
                        cached_count += 1
                        print(f"[CACHED] #{rid} ({dom}) -> {filename} ({len(data)} bytes)")
                    else:
                        print(f"[REJECT_TOO_SMALL] #{rid} ({len(data)} bytes)")
            except Exception as e:
                print(f"[FAIL] #{rid} ({dom}): {e}")
        else:
            c.execute("UPDATE scraped_records SET image_url = ? WHERE id = ?", (local_url, rid))
            conn.commit()
            cached_count += 1

    conn.close()
    print(f"\nFinished! Successfully localized {cached_count} cover images to /public/covers/.")

if __name__ == '__main__':
    download_and_localize()
