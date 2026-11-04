import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function queryVectorDatabase(query: string, recordId?: number): Promise<string> {
  try {
    const sanitizedQuery = query.replace(/["'\\]/g, ' ').slice(0, 150);
    const cmd = `./Project/mem0-svc/venv/bin/python ./scripts/vector_service.py --query "${sanitizedQuery}" --limit 3`;
    const { stdout } = await execAsync(cmd, { timeout: 4000 });
    const results = JSON.parse(stdout);
    if (!Array.isArray(results) || results.length === 0) return '';

    return results
      .map((r: any, idx: number) => `[Referensi Berita Terkait #${idx + 1} (${r.metadata?.domain})]:\n${r.content}`)
      .join('\n\n');
  } catch (err) {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, articleContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: 'Messages required' }, { status: 400 });
    }

    // Extract the latest user query for Vector DB semantic similarity retrieval
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    let vectorContext = '';
    if (lastUserMessage) {
      vectorContext = await queryVectorDatabase(lastUserMessage, articleContext?.id);
    }

    const systemPrompt = `Anda adalah Analis Riset & Intelijen Korporasi Finansial AI.
Tugas Anda adalah mendiskusikan, menganalisa dampak, dan membedah berita spesifik berikut bersama Willy.

INFORMASI DOKUMEN BERITA AKTIF:
- Judul: ${articleContext?.title || '-'}
- Entitas / Perusahaan: ${articleContext?.company_name || '-'}
- Sumber / Domain: ${articleContext?.domain || '-'}
- URL Sumber: ${articleContext?.url || '-'}
- Tanggal Terbit: ${articleContext?.published_date || '-'}
- Kata Kunci Pantauan: ${articleContext?.keyword_used || '-'}
- Sentimen Awal: ${articleContext?.impact_sentiment || '-'}
- Ringkasan / Snippet Asli: ${articleContext?.snippet || '-'}
- Analisis / Key Claim Intelijen: ${articleContext?.key_claim || '-'}
- Laporan Komprehensif Berita: ${articleContext?.full_content ? articleContext.full_content.slice(0, 3000) : '-'}

${vectorContext ? `KONTEKS INTELIJEN TERKAIT DARI VECTOR DATABASE (CROSS-REFERENCE):
${vectorContext}
` : ''}
PANDUAN INTERAKSI:
1. Jawab secara tajam, profesional, berbasis data nyata, dan fokus pada dampak finansial, reputasi, legal, atau valuasi saham.
2. Manfaatkan informasi dokumen berita aktif dan konteks cross-reference vector database untuk melengkapi analisa Anda.
3. Jangan berhalusinasi atau mengarang angka di luar konteks berita.
4. Berikan jawaban dalam Bahasa Indonesia yang lugas, terstruktur, dan analitis.`;

    const payload = {
      model: 'my-stack',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: false,
      temperature: 0.3,
      max_tokens: 1000
    };

    const routerUrl = process.env.ROUTER_BASE_URL || 'http://localhost:8000/v1';
    const upstream = await fetch(`${routerUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.NINEROUTER_API_KEY || 'dummy-key-9router'}`
      },
      body: JSON.stringify(payload)
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return NextResponse.json({ success: false, error: `Upstream error ${upstream.status}: ${errText}` }, { status: 502 });
    }

    const rawText = await upstream.text();
    let reply = 'Maaf, analis AI tidak dapat memproses jawaban saat ini.';

    // Check if upstream returned SSE stream (data: {...}) or direct JSON
    if (rawText.startsWith('data:')) {
      const lines = rawText.split('\n').filter(l => l.startsWith('data:'));
      const contents: string[] = [];
      for (const line of lines) {
        const jsonStr = line.replace(/^data:\s*/, '').trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
            if (delta) contents.push(delta);
          } catch {}
        }
      }
      if (contents.length > 0) reply = contents.join('');
    } else {
      try {
        const data = JSON.parse(rawText);
        reply = data.choices?.[0]?.message?.content || reply;
      } catch {
        reply = rawText;
      }
    }

    return NextResponse.json({
      success: true,
      reply
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
