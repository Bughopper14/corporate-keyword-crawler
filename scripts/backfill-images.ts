import Database from 'better-sqlite3';
import path from 'path';
import { extractRealOgImage } from '../src/lib/og-extractor';

const dbPath = path.join(__dirname, '../data/crawler.db');
const db = new Database(dbPath);

async function backfillImages() {
  console.log('--- Backfilling real og:images for existing records ---');
  // Order by id DESC so newest records on page 1 get real images first!
  const records = db.prepare("SELECT id, url, title, domain FROM scraped_records WHERE (image_url IS NULL OR image_url = '') AND url NOT LIKE '%news.google.com%' ORDER BY id DESC LIMIT 50").all() as any[];
  console.log(`Found ${records.length} records needing genuine og:image...`);

  let updated = 0;
  for (const r of records) {
    if (!r.url || !r.url.startsWith('http')) continue;
    try {
      const realImg = await extractRealOgImage(r.url, 3000);
      if (realImg) {
        db.prepare('UPDATE scraped_records SET image_url = ? WHERE id = ?').run(realImg, r.id);
        console.log(`[OK] ID ${r.id} (${r.domain}) -> ${realImg.slice(0, 65)}...`);
        updated++;
      } else {
        console.log(`[NO-IMG] ID ${r.id} (${r.domain})`);
      }
    } catch (e: any) {
      console.log(`[ERR] ID ${r.id}: ${e.message}`);
    }
  }

  console.log(`\nBackfill finished! Updated ${updated}/${records.length} records with authentic og:images.`);
}

backfillImages();
