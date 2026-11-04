import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const chunkSize = Math.min(Math.max(body.chunkSize || 10, 1), 30);

    const scriptPath = './scripts/gentle_harvester.py';
    const vectorScriptPath = './scripts/vector_service.py';
    const pyVenv = './Project/mem0-svc/venv/bin/python';

    // 1. Run deterministic gentle harvester
    const { stdout: harvestOut, stderr: harvestErr } = await execAsync(
      `python3 ${scriptPath} ${chunkSize}`,
      { timeout: 180000, cwd: '.' }
    );

    // 2. Synchronize new full content to Vector Store (ChromaDB)
    await execAsync(
      `${pyVenv} ${vectorScriptPath} --sync`,
      { timeout: 60000, cwd: '.' }
    ).catch((err) => {
      console.warn('[Vector Sync Warning]', err.message);
    });

    return NextResponse.json({
      success: true,
      message: `Gentle Ingestion Selesai (Batch ${chunkSize} item).`,
      output: harvestOut.trim(),
    });
  } catch (err: any) {
    console.error('[API Ingest Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
