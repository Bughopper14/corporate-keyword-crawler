import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, targetLang } = body; // targetLang: 'id' | 'en' | 'zh'

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: 'Text required' }, { status: 400 });
    }

    if (targetLang === 'id') {
      return NextResponse.json({ success: true, text });
    }

    // Call LLM proxy or OpenAI compatible endpoint
    const langPrompt = targetLang === 'zh'
      ? 'Translate the following financial intelligence briefing into Simplified Chinese (中文). Output ONLY the translation without any preamble or explanation:'
      : 'Translate the following financial intelligence briefing into clear, executive English. Output ONLY the translation without any preamble or explanation:';

    const routerUrl = process.env.ROUTER_BASE_URL || 'http://localhost:8000/v1';
    const llmRes = await fetch(`${routerUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'my-stack',
        messages: [
          { role: 'system', content: 'You are a professional financial translator for corporate intelligence reports.' },
          { role: 'user', content: `${langPrompt}\n\n${text}` }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!llmRes.ok) {
      throw new Error(`LLM status ${llmRes.status}`);
    }

    const data = await llmRes.json();
    const translated = data.choices?.[0]?.message?.content?.trim() || text;

    return NextResponse.json({
      success: true,
      text: translated,
      targetLang,
    });
  } catch (err: any) {
    // Graceful fallback heuristics if LLM proxy is unavailable
    const fallbackText = req.headers.get('x-fallback-text') || '';
    return NextResponse.json({
      success: true,
      text: `[Translation ${err.message?.includes('timeout') ? 'timeout' : 'unavailable'}] ${fallbackText}`,
      error: err.message,
    });
  }
}
