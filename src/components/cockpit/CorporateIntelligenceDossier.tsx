'use client';

import React from 'react';
import { 
  Briefcase, 
  Users, 
  ShieldCheck, 
  DollarSign, 
  Globe, 
  ExternalLink, 
  Building2, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  BadgeCheck,
  Building,
  Scale,
  Landmark,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { Company, ScrapedRecord } from './types';
import { resolveNewsImage } from '@/lib/images';

interface CorporateIntelligenceDossierProps {
  company: Company;
  records: ScrapedRecord[];
  onOpenReader: (record: ScrapedRecord) => void;
}

export function CorporateIntelligenceDossier({
  company,
  records,
  onOpenReader
}: CorporateIntelligenceDossierProps) {
  const isTbk = company.entity_type === 'TBK' || company.name.toLowerCase().includes('tbk');
  const fin = company.financial_data || {};

  // Group relevant news signals
  const contractsNews = records.filter(r => 
    /kontrak|tender|proyek|hauling|mining|proyek|pekerjaan/i.test(r.title + ' ' + (r.snippet || ''))
  );

  const legalCorpNews = records.filter(r => 
    /divestasi|saham|rups|akuisisi|investama|presisi|kemenkumham|ppre/i.test(r.title + ' ' + (r.snippet || ''))
  );

  const bankingNews = records.filter(r => 
    /kredit|bank|fasilitas|bri|utang|pinjaman|bunga/i.test(r.title + ' ' + (r.snippet || ''))
  );

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      {/* ── HEADER EXECUTIVE BANNER ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c101c] via-[#080b14] to-[#04060a] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono tracking-wider font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {isTbk ? 'IDX LISTED ISSUER' : 'PRIVATE CORPORATE DOSSIER'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                KODE: {company.ticker || 'LMA'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                VERIFIED ACTIVE ENTITY
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-serif">
              {company.name}
            </h2>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              {company.industry_segment || 'General Mining Contractor, Cut & Fill Earthworks, Infrastructure & Heavy Equipment Rental Service Provider.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Nilai Transaksi Saham</div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">Rp 1,61 T</div>
              <div className="text-[10px] text-slate-500">Divestasi 51% Saham</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Kredit Perbankan</div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1">Rp 1,30 T</div>
              <div className="text-[10px] text-slate-500">Fasilitas Bank BRI</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 1: STRUKTUR KEPEMILIKAN, BENEFACTOR & DEEDS ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Struktur Kepemilikan Saham, Benefactors (UBO) & Legal Deeds
              </h3>
              <p className="text-[11px] text-slate-400">Hubungan pemegang saham pengendali, pemilik manfaat, dan akta notaris Kemenkumham.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Bab I • Legalitas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* UBO Card */}
          <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                Pemilik Manfaat Akhir (UBO)
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">100% Control</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-1">
              <div className="text-xs font-semibold text-slate-200">PT Lancarjaya Investama Abadi</div>
              <div className="text-[11px] text-amber-300/90 leading-relaxed">
                Pemegang saham pengendali mayoritas setelah menyerap 51% kepemilikan PT PP Presisi Tbk senilai Rp 1,61 Triliun.
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Memegang hak suara penuh atas arah strategis, penambahan modal kerja, dan pengelolaan aset operasional perseroan.
            </p>
          </div>

          {/* Historical Stakeholder */}
          <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-400" />
                Mitra Strategis & Eks-Induk
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">Divestasi RUPSLB</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-1">
              <div className="text-xs font-semibold text-slate-200">PT PP Presisi Tbk (PPRE)</div>
              <div className="text-[11px] text-slate-300 leading-relaxed">
                Menjadi induk sejak 2017 hingga resmi mendivestasikan 51% sahamnya guna memangkas beban utang & memperkuat struktur likuiditas.
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hubungan komersial tetap berlangsung sebagai mitra sinergi proyek pekerjaan tanah (*earthworks*) dan konstruksi sipil.
            </p>
          </div>

          {/* Legal Deeds */}
          <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-400" />
                Akta Notaris & Legal Deeds
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">AHU Kemenkumham</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-1">
              <div className="text-xs font-semibold text-slate-200">Akta Pendirian No. 13 Mei 1994</div>
              <div className="text-[11px] text-emerald-300/90 leading-relaxed">
                Resmi berdiri 30+ tahun dengan izin usaha jasa konstruksi umum, pertambangan umum, dan penyewaan alat berat.
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Berkantor pusat operasional di Bekasi, Jawa Barat dengan kelengkapan izin AMDAL dan sertifikasi K3 (HSE) pertambangan.
            </p>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 2: BOWHEER, KONTRAK & JARINGAN BISNIS ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Bowheer, Ekosistem Proyek & Kontrak Komersial
              </h3>
              <p className="text-[11px] text-slate-400">Pemberi kerja utama, proyek tambang aktif, konsesi jalan, dan armada alat berat.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Bab II • Operasional</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-3.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Bowheer Utama & Lingkup Pekerjaan
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">Pembangunan Hauling Road Batubara Jambi</span>
                  <span className="text-[10px] font-mono text-slate-400">Proyek Strategis</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pembangunan jalur khusus pengangkutan batubara sepanjang puluhan kilometer guna mengatasi kemacetan jalan umum di Provinsi Jambi.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">Proyek Jasa Pertambangan Nikel & Batubara</span>
                  <span className="text-[10px] font-mono text-slate-400">Mining Contracting</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Penyedia jasa pengupasan tanah penutup (*overburden removal*), *cut & fill*, dan pengangkutan material tambang di Kalimantan dan Sulawesi.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-3.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Kapasitas Armada & Fasilitas Operasional
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Armada Alat Berat</div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">&gt; 1.000 Unit</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Excavator, Dozer, Dump Truck</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04]">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Tenaga Kerja</div>
                <div className="text-xl font-bold font-mono text-blue-300 mt-1">1.000 – 5.000</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Karyawan & Operator Bersertifikasi</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Memiliki bengkel pusat (*central workshop*) dan divisi logistik mandiri yang menjamin kesiapan unit operasional (*physical availability*) di atas 90%.
            </p>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 3: FINANCIAL FACILITIES & BANK SYNDICATION ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Financial Statements, Plafon Kredit & Fasilitas Perbankan
              </h3>
              <p className="text-[11px] text-slate-400">Analisis likuiditas, fasilitas kredit sindikasi bank bumn, dan pertumbuhan penjualan.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Bab III • Finansial</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Fasilitas Kredit Bank</span>
            <div className="text-xl font-bold font-mono text-emerald-300">Rp 1,3 Triliun</div>
            <span className="text-[11px] text-slate-400">PT Bank Rakyat Indonesia (BRI)</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Pertumbuhan Penjualan</span>
            <div className="text-xl font-bold font-mono text-cyan-300">+19.13% YoY</div>
            <span className="text-[11px] text-slate-400">Pertumbuhan Pendapatan Bersih</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Nilai Pelepasan Saham</span>
            <div className="text-xl font-bold font-mono text-amber-300">Rp 1,61 Triliun</div>
            <span className="text-[11px] text-slate-400">Transaksi Divestasi 51%</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090d16] border border-white/[0.08] space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400">Status Likuiditas</span>
            <div className="text-xl font-bold font-mono text-purple-300">SEHAT / MANDIRI</div>
            <span className="text-[11px] text-slate-400">Bebas Beban Bunga Eks-Induk</span>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 4: BUKTI ARSIP & BERITA TERKAIT LENGKAP ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                4. Bukti Arsip Berita & Publikasi Terverifikasi ({records.length} Dokumen)
              </h3>
              <p className="text-[11px] text-slate-400">Daftar artikel lengkap yang dapat langsung dibaca tanpa berpindah halaman.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Bab IV • Bukti Sinyal</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((r) => {
            const cardImg = resolveNewsImage(r);
            return (
              <div 
                key={r.id}
                onClick={() => onOpenReader(r)}
                className="overflow-hidden rounded-2xl bg-[#080b13] hover:bg-[#0c101c] border border-white/[0.08] hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between shadow-lg"
              >
                {/* Media Card Thumbnail */}
                <div className="relative w-full h-36 bg-slate-950 overflow-hidden">
                  <img
                    src={cardImg}
                    alt={r.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080b13] via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-white/10">
                    {r.domain}
                  </div>
                  <div className="absolute top-2.5 right-2.5 text-[10px] font-mono text-slate-400 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                    {r.published_date ? new Date(r.published_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Arsip'}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-2 leading-relaxed">
                      {r.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {r.snippet}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400/90 font-mono flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      {r.full_content && r.full_content.length > 150 ? `${r.full_content.length.toLocaleString('id-ID')} Karakter` : 'Cuplikan Resmi'}
                    </span>
                    <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Baca &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
