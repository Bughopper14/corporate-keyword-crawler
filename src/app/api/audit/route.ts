import { NextResponse } from 'next/server';
import { getDatabaseAudit } from '@/lib/db';

export async function GET() {
  try {
    const auditData = getDatabaseAudit();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: auditData,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to audit database configuration',
      },
      { status: 500 }
    );
  }
}
