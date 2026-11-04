// Text Sanitation & Article Content Formatting Utility
// Cleans raw crawl artifacts: &nbsp;, &amp;, &quot;, &#39;, zero-width spaces (\u200e), duplicate whitespace, and truncations.

export function cleanText(input?: string | null): string {
  if (!input) return '';

  let text = input;

  // 1. Decode HTML entities repeatedly
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&bull;/gi, '•')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–');

  // 2. Strip Unicode control characters & invisible artifacts
  // \u200e (Left-to-Right Mark), \u200b (Zero-width space), \ufeff (Byte Order Mark), \u00a0 (Non-breaking space)
  text = text
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00A0]/g, ' ')
    .replace(/[\r\n\t]+/g, ' ');

  // 3. Strip trailing snippet ellipses and platform cutoffs (e.g. "... - Instagram", "... - Detikcom")
  text = text
    .replace(/\s*-\s*(Instagram|Twitter|X|Facebook|LinkedIn|TikTok|YouTube)\s*$/i, '')
    .replace(/(\.\.\.|\u2026|\s\.\s)\s*$/, '');

  // 4. Normalize multiple whitespace sequences to a single clean space
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

// Format article snippet or full content into comfortable readable paragraphs
export function formatArticleParagraphs(
  snippet?: string | null,
  rawContent?: string | null,
  fullContent?: string | null
): string[] {
  // If full_content is provided, clean and split by natural paragraph breaks (\n\n or \n)
  if (fullContent && fullContent.trim().length > 50) {
    // Preserve newlines, clean individual lines
    const rawParagraphs = fullContent
      .split(/\n+/)
      .map(p => {
        // Decode HTML entities but DO NOT destroy newlines
        let t = p
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;/gi, "'")
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&bull;/gi, '•')
          .replace(/&mdash;/gi, '—')
          .replace(/&ndash;/gi, '–')
          .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00A0]/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        return t;
      })
      .filter(p => p.length > 25);

    if (rawParagraphs.length > 0) {
      return rawParagraphs;
    }
  }

  const cleanedSnippet = cleanText(snippet);
  if (!cleanedSnippet) return ['Laporan berita sedang diproses dari portal sumber.'];

  // Try parsing raw_content if available for additional context
  let fullBody = cleanedSnippet;
  if (rawContent && rawContent.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed.snippet && parsed.snippet.length > fullBody.length) {
        fullBody = cleanText(parsed.snippet);
      }
    } catch {}
  }

  // Split into natural sentences / paragraphs (split on '. ' after complete sentences)
  const sentences = fullBody.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/);
  if (sentences.length <= 2) {
    return [fullBody];
  }

  // Group sentences into 2-3 readable paragraph chunks
  const paragraphs: string[] = [];
  let currentPara: string[] = [];

  for (let i = 0; i < sentences.length; i++) {
    currentPara.push(sentences[i]);
    if (currentPara.length >= 2 || i === sentences.length - 1) {
      paragraphs.push(currentPara.join(' '));
      currentPara = [];
    }
  }

  return paragraphs.length > 0 ? paragraphs : [fullBody];
}
