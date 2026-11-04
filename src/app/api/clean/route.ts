import { NextResponse } from 'next/server';
import { reclassifyAllRecords } from '@/lib/cleaning';

export async function POST() {
  try {
    const result = reclassifyAllRecords(500);
    return NextResponse.json({
      success: true,
      message: `Pembersihan & Klasifikasi Selesai: ${result.total_processed} data diproses. (${result.valid_count} Valid/Resmi, ${result.rumor_count} Rumor/Spekulasi/Social, ${result.unverified_count} Pending)`,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
