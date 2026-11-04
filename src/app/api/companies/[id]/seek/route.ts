import { NextResponse } from 'next/server';
import { seekCompanyData } from '@/lib/crawler';

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const companyId = parseInt(params.id, 10);

    if (isNaN(companyId)) {
      return NextResponse.json({ success: false, error: 'Invalid company ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const timeRange = {
      mode: body.timeRangeMode || '7d',
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
    };

    const stats = await seekCompanyData(companyId, timeRange);

    return NextResponse.json({
      success: true,
      message: `Crawl (${timeRange.mode}) selesai. Ditemukan ${stats.total_discovered} link mentah. ${stats.new_inserted} sinyal baru disimpan, ${stats.duplicate_skipped} duplikat diabaikan.`,
      stats,
    });
  } catch (err: any) {
    console.error('[API Seek Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
