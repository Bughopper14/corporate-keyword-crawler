import { NextResponse } from 'next/server';
import { countGoogleMaskedRecords } from '@/lib/db';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

// GET: Check remaining Google masked URLs
export async function GET() {
  try {
    const remaining = countGoogleMaskedRecords();
    return NextResponse.json({
      success: true,
      remaining,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Process ONE chunk/part (e.g., 20 URLs) with clear metrics
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const chunkSize = Math.min(Math.max(parseInt(body.chunkSize || '20', 10), 5), 50);

    const initialRemaining = countGoogleMaskedRecords();
    if (initialRemaining === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        unmasked: 0,
        remaining: 0,
        message: 'Semua URL sudah ter-unmask. Antrean bersih.',
      });
    }

    // Execute unmasking script for exactly 1 part / chunk
    const cmd = `uv run --with googlenewsdecoder python3 scripts/unmask_urls.py ${chunkSize}`;
    const { stdout } = await execAsync(cmd, {
      cwd: process.cwd(),
      timeout: 30000,
    });

    const newRemaining = countGoogleMaskedRecords();
    const unmasked = Math.max(0, initialRemaining - newRemaining);

    return NextResponse.json({
      success: true,
      chunkSize,
      unmasked,
      remaining: newRemaining,
      rawOutput: stdout.trim().split('\n').slice(-3).join(' | '),
      message: `Part selesai: ${unmasked} URL terdecode. Sisa antrean: ${newRemaining} URL.`,
    });
  } catch (err: any) {
    console.error('[API Unmask Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
