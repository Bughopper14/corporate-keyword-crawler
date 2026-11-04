#!/usr/bin/env python3
"""
KeywordCrawler Full-Spectrum Waterfall Harvester & Multi-Layer Resolver
-----------------------------------------------------------------------
Layer 1: Fast HTTP Direct Stream & Social Embed
Layer 2: Canonical / Gallery-to-Article URL Normalizer
Layer 3: Canonical Syndication & Open Mirror Resolution (Exa / Free Tier)
Layer 4: Auto-classification (Twitter/YT as SOCIAL_MICROBLOG) + Local Cover Downloader

Integrated for Cron & Manual Re-harvest.
"""

import sys
import os
import re
import time
import json
import sqlite3
import subprocess
import urllib.request
import urllib.error
import urllib.parse
import hashlib
import ssl
import random

from config_loader import DB_PATH, COVERS_DIR, ROUTER_BASE_URL
os.makedirs(COVERS_DIR, exist_ok=True)

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout = 5000;")
    return conn

def clean_html(text: str) -> str:
    text = re.sub(r'<(script|style|nav|header|footer|aside|noscript|figure)[^>]*>.*?</\1>', ' ', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&quot;', '"').replace('&#39;', "'")
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_direct_article(url: str) -> str:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=9, context=ssl_ctx) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            
            # 1. Check JSON-LD
            ld_matches = re.findall(r'<script[^>]*type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
            for ld in ld_matches:
                try:
                    data = json.loads(ld.strip())
                    items = data if isinstance(data, list) else [data]
                    for it in items:
                        if isinstance(it, dict):
                            if '@graph' in it and isinstance(it['@graph'], list):
                                items.extend(it['@graph'])
                            body = it.get('articleBody')
                            if body and len(body) > 200:
                                return body.strip()
                except Exception:
                    pass

            # 2. Check Next.js SSR / SPA Data Payload (__NEXT_DATA__)
            next_data_match = re.search(r'<script id=[\'"]__NEXT_DATA__[\'"][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
            if next_data_match:
                try:
                    nd = json.loads(next_data_match.group(1).strip())
                    # Traverse pageProps for article content
                    pp = nd.get('props', {}).get('pageProps', {})
                    for key in ['prearticle', 'article', 'post', 'data', 'detail']:
                        target_obj = pp.get(key)
                        if isinstance(target_obj, dict):
                            content_field = target_obj.get('content') or target_obj.get('body') or target_obj.get('articleBody')
                            if content_field and len(content_field) > 200:
                                clean_nd = clean_html(content_field)
                                if len(clean_nd) > 200:
                                    return clean_nd
                except Exception:
                    pass

            # 3. Extract <p> tags
            p_tags = re.findall(r'<p[^>]*>(.*?)</p>', html, re.DOTALL | re.IGNORECASE)
            paragraphs = []
            for p in p_tags:
                clean_p = clean_html(p)
                if len(clean_p) > 35 and not any(skip in clean_p.lower() for skip in ['baca juga', 'simak berita', 'copyright', 'editor:', 'advertisement']):
                    paragraphs.append(clean_p)
            
            if len(paragraphs) >= 2:
                return "\n\n".join(paragraphs).strip()
    except Exception:
        pass
    return ""

def extract_instagram_caption(url: str) -> str:
    m = re.search(r'/(?:p|reel)/([A-Za-z0-9_-]+)', url)
    if not m:
        return ""
    embed_url = f"https://www.instagram.com/p/{m.group(1)}/embed/captioned/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        req = urllib.request.Request(embed_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as r:
            html = r.read().decode('utf-8', errors='ignore')
        m_cap = re.search(r'<div class="Caption"[^>]*>(.*?)</div>', html, re.DOTALL)
        if m_cap:
            raw = m_cap.group(1)
            raw = re.sub(r'<span class="CaptionComments"[^>]*>.*?</span>', '', raw, flags=re.DOTALL)
            raw = re.sub(r'<br\s*/?>', '\n', raw)
            clean = clean_html(raw)
            return clean
    except Exception:
        pass
    return ""

def resolve_syndicated_mirror(title: str, domain: str) -> str:
    """Layer 3: Queries public syndicated news aggregators for identical wire stories."""
    clean_t = re.sub(r'(\s*-\s*[A-Za-z0-9\s]+$)|(\s*\|\s*[A-Za-z0-9\s]+$)', '', title).strip()
    clean_t = re.sub(r'[^a-zA-Z0-9\s]', ' ', clean_t)
    words = clean_t.split()[:7]
    if len(words) < 3:
        return ""
    
    q_str = " ".join(words)
    # Search public syndicated wire
    try:
        url_api = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(q_str)}"
        req = urllib.request.Request(url_api, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=8, context=ssl_ctx) as r:
            html = r.read().decode('utf-8', errors='ignore')
            links = re.findall(r'<a class=\"result__url\" href=\"(.*?)\"', html)
            for link in links:
                unquoted = urllib.parse.unquote(link)
                m_target = re.search(r'uddg=(https?://[^&]+)', unquoted)
                target_url = m_target.group(1) if m_target else link
                if not any(blocked in target_url for blocked in ['kontan.co.id', 'bisnis.com', 'tempo.co', 'msn.com']):
                    art = extract_direct_article(target_url)
                    if art and len(art) > 300:
                        return art
    except Exception:
        pass
    return ""

def cache_image_locally(rid: int, img_url: str, domain: str) -> str:
    if not img_url or not img_url.startswith('http'):
        return img_url or ""
    clean_url = img_url.replace('&amp;', '&')
    ext = '.jpg'
    if '.webp' in clean_url.lower(): ext = '.webp'
    elif '.png' in clean_url.lower(): ext = '.png'
    
    file_hash = hashlib.md5(f"{rid}_{clean_url[:60]}".encode()).hexdigest()[:16]
    fname = f"cover_{rid}_{file_hash}{ext}"
    fpath = os.path.join(COVERS_DIR, fname)
    local_url = f"/KeywordCrawler/covers/{fname}"

    if os.path.exists(fpath):
        return local_url

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        if 'instagram' in domain: headers['Referer'] = 'https://www.instagram.com/'
        elif 'twitter' in domain or 'x.com' in domain: headers['Referer'] = 'https://x.com/'
        
        req = urllib.request.Request(clean_url, headers=headers)
        with urllib.request.urlopen(req, timeout=6, context=ssl_ctx) as r:
            data = r.read()
            if len(data) > 500:
                with open(fpath, 'wb') as f:
                    f.write(data)
                return local_url
    except Exception:
        pass
    return img_url

def execute_full_harvest_cycle():
    conn = get_db()
    c = conn.cursor()

    # 0. Purge or mark dead spam scrapers & dead mirror domains immediately
    c.execute("""
        UPDATE scraped_records 
        SET harvest_status = 'EXPIRED_OR_SPAM' 
        WHERE domain LIKE '%twaslnews%' 
           OR domain LIKE '%qoo10%' 
           OR domain LIKE '%peradaban%' 
           OR domain LIKE '%topik.id%';
    """)
    conn.commit()

    # 1. Tag all microblogs as SOCIAL_MICROBLOG automatically
    c.execute("""
        UPDATE scraped_records 
        SET harvest_status = 'SOCIAL_MICROBLOG' 
        WHERE (domain LIKE '%youtube%' OR domain LIKE '%x.com%' OR domain LIKE '%twitter%')
          AND harvest_status != 'SOCIAL_MICROBLOG';
    """)
    conn.commit()

    # 2. Select candidates that lack full content
    c.execute("""
        SELECT id, domain, url, title, snippet, image_url, harvest_status 
        FROM scraped_records 
        WHERE (full_content IS NULL OR length(full_content) < 250)
          AND harvest_status != 'SOCIAL_MICROBLOG'
        ORDER BY id DESC;
    """)
    candidates = [dict(r) for r in c.fetchall()]

    print(f"[{time.strftime('%H:%M:%S')}] Processing {len(candidates)} unharvested candidate records...")

    harvested_count = 0
    images_cached = 0

    for row in candidates:
        rid = row['id']
        dom = row['domain']
        url = row['url']
        title = row['title']
        img = row['image_url']
        body = ""

        # Cache image if remote
        if img and img.startswith('http'):
            loc_img = cache_image_locally(rid, img, dom)
            if loc_img != img:
                c.execute("UPDATE scraped_records SET image_url = ? WHERE id = ?", (loc_img, rid))
                images_cached += 1

        # Layer 1: Social Instagram Embed
        if 'instagram.com' in dom:
            body = extract_instagram_caption(url)

        # Layer 2: Canonical Read URL (Kompas Photo Gallery fix)
        elif '/image/' in url:
            read_url = url.replace('/image/', '/read/').split('?')[0]
            body = extract_direct_article(read_url)
            if body:
                c.execute("UPDATE scraped_records SET url = ? WHERE id = ?", (read_url, rid))

        # Layer 1 / Direct HTTP Stream
        if not body and not any(w in dom for w in ['kontan.co.id', 'bisnis.com', 'tempo.co', 'msn.com']):
            body = extract_direct_article(url)

        # Layer 3: Syndicated Mirror Resolution for WAF portals
        if not body:
            body = resolve_syndicated_mirror(title, dom)

        # Commit update if successful
        if body and len(body) >= 200:
            c.execute("""
                UPDATE scraped_records 
                SET full_content = ?, harvest_status = 'COMPLETED', last_harvest_error = NULL 
                WHERE id = ?;
            """, (body, rid))
            conn.commit()
            harvested_count += 1
            print(f"  ✓ Extracted #{rid} [{dom}] -> {len(body)} chars")
            time.sleep(random.uniform(0.8, 1.8))
        else:
            c.execute("UPDATE scraped_records SET last_harvest_error = 'WAF_OR_PAYWALL' WHERE id = ?;", (rid,))
            conn.commit()

    # Recalculate stats
    c.execute("SELECT count(*) FROM scraped_records WHERE length(full_content) >= 250;")
    total_complete = c.fetchone()[0]

    c.execute("SELECT count(*) FROM scraped_records WHERE harvest_status = 'SOCIAL_MICROBLOG';")
    total_micro = c.fetchone()[0]

    c.execute("SELECT count(*) FROM scraped_records WHERE (full_content IS NULL OR length(full_content) < 250) AND harvest_status != 'SOCIAL_MICROBLOG' AND harvest_status != 'EXPIRED_OR_SPAM';")
    total_remaining = c.fetchone()[0]

    conn.close()

    # Run ChromaDB Vector Sync if new records landed
    if harvested_count > 0:
        try:
            subprocess.run(["./Project/mem0-svc/venv/bin/python", "./scripts/vector_service.py", "--sync"], capture_output=True, timeout=90)
        except Exception:
            pass

    # Print Telemetry Report for Telegram Cron Delivery
    print("\n" + "="*50)
    print("📊 KeywordCrawler Harvester Telemetry Report")
    print(f"🕒 Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')} WIB\n")
    print(f"• Sudah Lengkap (Full Text): {total_complete} artikel (+{harvested_count} baru)")
    print(f"• Micro-blog Lengkap (Twitter/YT): {total_micro} data")
    print(f"• Gambar Dilokalisasi: {images_cached} gambar")
    print(f"• Antrean Tertahan (WAF/Paywall): {total_remaining} data")
    print("="*50)

if __name__ == '__main__':
    execute_full_harvest_cycle()
