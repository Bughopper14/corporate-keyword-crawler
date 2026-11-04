/**
 * Zero-dependency robust real og:image & twitter:image extractor.
 * Parses HTML metadata directly using RegExp without external parser dependencies.
 */
export async function extractRealOgImage(targetUrl: string, timeoutMs: number = 3500): Promise<string | null> {
  if (!targetUrl || !targetUrl.startsWith('http')) return null;

  // 1. YouTube direct handling
  if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
    const vMatch = targetUrl.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (vMatch) {
      return `https://img.youtube.com/vi/${vMatch[1]}/hqdefault.jpg`;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isMeta = targetUrl.includes('instagram.com') || targetUrl.includes('threads.net') || targetUrl.includes('facebook.com');
    const userAgent = isMeta 
      ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) return null;

    // Only scan first 128KB for speed
    const htmlChunk = (await response.text()).slice(0, 131072);

    let match: RegExpMatchArray | null = null;

    // A. og:image or og:image:url
    match = htmlChunk.match(/<meta[^>]+property=["']og:image(?::url|:secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
            htmlChunk.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url|:secure_url)?["']/i);

    // B. twitter:image
    if (!match) {
      match = htmlChunk.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i) ||
              htmlChunk.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i);
    }

    // C. link rel="image_src"
    if (!match) {
      match = htmlChunk.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
    }

    if (match && match[1]) {
      let img = match[1].trim();

      // Resolve relative protocol //
      if (img.startsWith('//')) {
        img = 'https:' + img;
      } else if (img.startsWith('/')) {
        try {
          const parsed = new URL(targetUrl);
          img = `${parsed.protocol}//${parsed.host}${img}`;
        } catch {
          // parse error fallback
        }
      }

      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
    }

    return null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
