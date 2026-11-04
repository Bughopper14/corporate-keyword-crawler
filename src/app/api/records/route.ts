import { NextResponse } from 'next/server';
import { getRecordsPaginated, getEditorialHighlights } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isHighlights = searchParams.get('highlights') === '1' || searchParams.get('highlights') === 'true';

    if (isHighlights) {
      const data = getEditorialHighlights();
      return NextResponse.json({
        success: true,
        data,
      });
    }

    const companyIdStr = searchParams.get('company_id');
    const companyId = companyIdStr ? parseInt(companyIdStr, 10) : null;
    const status = searchParams.get('status') || 'ALL';
    const impact = searchParams.get('impact') || 'ALL';
    const isVideo = searchParams.get('is_video') === '1' || searchParams.get('is_video') === 'true';
    const search = searchParams.get('search') || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = getRecordsPaginated({
      companyId: isNaN(companyId as number) ? null : companyId,
      status,
      impact,
      isVideo,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
