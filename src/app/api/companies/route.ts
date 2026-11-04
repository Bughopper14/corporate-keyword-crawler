import { NextResponse } from 'next/server';
import { getAllCompanies, createCompany } from '@/lib/db';

export async function GET() {
  try {
    const companies = getAllCompanies();
    return NextResponse.json({ success: true, data: companies });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, shareholders, entityType } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Nama perusahaan wajib diisi' }, { status: 400 });
    }

    const company = createCompany(
      name,
      Array.isArray(shareholders) ? shareholders : [],
      entityType || 'AUTO'
    );

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
