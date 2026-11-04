'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  Globe, 
  Plus, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  Layers,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  PieChart,
  RefreshCw,
  Sparkles,
  BarChart3,
  FileText
} from 'lucide-react';
import { Company, ScrapedRecord, FinancialMetric } from './types';
import { CorporateIntelligenceDossier } from './CorporateIntelligenceDossier';

interface EntityProfileManagerProps {
  companies: Company[];
  records: ScrapedRecord[];
  onOpenAddModal: () => void;
  onSelectCompany: (id: number | null) => void;
  onSeek: (id: number) => void;
  onRefreshCompanies: () => void;
  seekingId: number | null;
  onOpenReader?: (record: ScrapedRecord) => void;
}

export function EntityProfileManager({
  companies,
  records,
  onOpenAddModal,
  onSelectCompany,
  onSeek,
  onRefreshCompanies,
  seekingId,
  onOpenReader,
}: EntityProfileManagerProps) {
  const [selectedEntity, setSelectedEntity] = useState<Company | null>(companies[0] || null);
  const [viewMode, setViewMode] = useState<'UNIFIED_DOSSIER' | 'TABBED'>('UNIFIED_DOSSIER');
  const [activeEntityTab, setActiveEntityTab] = useState<'OVERVIEW' | 'CORPORATE_INTELLIGENCE' | 'FINANCIALS' | 'SIGNALS' | 'RISKS' | 'CATALYSTS'>('OVERVIEW');
  const [extractingFinancials, setExtractingFinancials] = useState(false);
  const [finStatusMessage, setFinStatusMessage] = useState<string | null>(null);

  // Filter signals belonging to selected entity
  const entityRecords = selectedEntity 
    ? records.filter((r) => r.company_id === selectedEntity.id)
    : [];

  const validSignals = entityRecords.filter((r) => r.clean_status === 'VALID');
  const rumorSignals = entityRecords.filter((r) => r.clean_status === 'RUMOR');
  const goodImpactSignals = entityRecords.filter((r) => r.impact_sentiment === 'GOOD_IMPACT');
  const badImpactSignals = entityRecords.filter((r) => r.impact_sentiment === 'BAD_IMPACT');

  // Global aggregate telemetry across all records
  const totalShareholders = companies.reduce((acc, c) => acc + (c.shareholders?.length || 0), 0);
  const totalValid = records.filter((r) => r.clean_status === 'VALID').length;
  const totalRumor = records.filter((r) => r.clean_status === 'RUMOR').length;
  const totalGood = records.filter((r) => r.impact_sentiment === 'GOOD_IMPACT').length;
  const totalBad = records.filter((r) => r.impact_sentiment === 'BAD_IMPACT').length;

  const handleExtractFinancials = async () => {
    if (!selectedEntity) return;
    setExtractingFinancials(true);
    setFinStatusMessage('Sedang menyerap laporan keuangan bursa & konsolidasi laba bersih...');

    try {
      const res = await fetch(`/KeywordCrawler/api/companies/${selectedEntity.id}/financials`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setFinStatusMessage(data.message);
        onRefreshCompanies();
        setSelectedEntity({
          ...selectedEntity,
          financial_data: data.data,
        });
      } else {
        setFinStatusMessage(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setFinStatusMessage(`Error: ${err.message}`);
    } finally {
      setExtractingFinancials(false);
    }
  };

  const isTbk = selectedEntity?.entity_type === 'TBK' || selectedEntity?.name.toLowerCase().includes('tbk');
  const fin = selectedEntity?.financial_data;

  return (
    <div className="space-y-6">
      {/* ── Global Market Telemetry Horizon (Consolidated into Entity Profiles) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-[#0b0e18]/80 border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Portofolio Target</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{companies.length} Entitas</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
            <Users className="w-3 h-3 text-cyan-500" /> {totalShareholders} Stakeholder
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-[#0b0e18]/80 border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sinyal Database</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-300">{records.length} Sinyal</div>
          <div className="text-[11px] text-blue-400/80 mt-1 font-mono">Arsip intelijen aktif</div>
        </div>

        <div className="p-4 rounded-3xl bg-[#0b0e18]/80 border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Status Verifikasi</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-emerald-400">{totalValid} Valid</span>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xl font-bold text-amber-400">{totalRumor} Rumor</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Audit kredibilitas leksikal</div>
        </div>

        <div className="p-4 rounded-3xl bg-[#0b0e18]/80 border border-white/[0.08] backdrop-blur-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dampak Pasar Global</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-xl font-bold text-emerald-400">{totalGood} Katalis</span>
            <span className="text-xs text-slate-600">vs</span>
            <span className="text-xl font-bold text-rose-400">{totalBad} Risiko</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Sentimen pasar akumulasi</div>
        </div>
      </div>

      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            Manajemen Profil Entitas & Stakeholder
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola daftar korporasi Tbk, PT swasta, pemegang saham pengendali (UBO), dan tinjau profil intelijen per entitas.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition shadow-lg shadow-cyan-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Tambah Entitas Baru
        </button>
      </div>

      {/* Split Deck: Entity List (Left) & Entity Intelligence Dossier (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Entity Roster Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Daftar Portofolio ({companies.length})
          </div>

          <div className="space-y-2">
            {companies.map((c) => {
              const isSelected = selectedEntity?.id === c.id;
              const isTbk = c.entity_type === 'TBK' || c.name.toLowerCase().includes('tbk');
              const recCount = records.filter((r) => r.company_id === c.id).length;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedEntity(c)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-white leading-tight">{c.name}</h4>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                          isTbk ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isTbk ? 'Tbk / Emiten' : 'Non-Tbk / Swasta'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{c.shareholders?.join(', ') || 'Belum ada UBO'}</span>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-cyan-400 translate-x-1' : 'text-slate-600'}`} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/60 pt-2">
                    <span>{recCount} sinyal terkumpul</span>
                    {c.last_crawled_at && (
                      <span>Crawl: {new Date(c.last_crawled_at).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Depth Entity Dossier Page with Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {selectedEntity ? (
            <div className="rounded-3xl bg-[#0b0f19] border border-slate-800/90 p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedEntity.name}</h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-cyan-950 border border-cyan-800/50 text-cyan-300">
                      ID: #{selectedEntity.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-cyan-400" /> Stakeholders: {selectedEntity.shareholders?.join(', ')}
                    </span>
                  </div>
                </div>

                <button
                  disabled={seekingId === selectedEntity.id}
                  onClick={() => onSeek(selectedEntity.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition"
                >
                  {seekingId === selectedEntity.id ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      Sedang Merayap...
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      Rayap Data Entitas Ini
                    </>
                  )}
                </button>
              </div>

              {/* Dossier Tabs & View Mode Switcher */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 gap-3 flex-wrap">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#060912] border border-white/[0.08]">
                  <button
                    onClick={() => setViewMode('UNIFIED_DOSSIER')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      viewMode === 'UNIFIED_DOSSIER'
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dossier Lengkap</span>
                  </button>
                  <button
                    onClick={() => setViewMode('TABBED')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                      viewMode === 'TABBED'
                        ? 'bg-white/[0.12] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tampilan Tab</span>
                  </button>
                </div>

                {viewMode === 'TABBED' && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'OVERVIEW', label: 'Ringkasan' },
                      { id: 'CORPORATE_INTELLIGENCE', label: 'Bowheer & Deeds' },
                      { id: 'FINANCIALS', label: 'Finansial' },
                      { id: 'SIGNALS', label: `Sinyal (${entityRecords.length})` },
                      { id: 'RISKS', label: `Risiko (${badImpactSignals.length})` },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveEntityTab(t.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          activeEntityTab === t.id
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* VIEW 1: UNIFIED LONG-READ DOSSIER */}
              {viewMode === 'UNIFIED_DOSSIER' && (
                <CorporateIntelligenceDossier
                  company={selectedEntity}
                  records={entityRecords}
                  onOpenReader={(r) => onOpenReader && onOpenReader(r)}
                />
              )}

              {/* Status Message for Financials Extraction */}
              {viewMode === 'TABBED' && finStatusMessage && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between">
                  <span>{finStatusMessage}</span>
                  <button onClick={() => setFinStatusMessage(null)} className="text-slate-400 hover:text-white ml-2">×</button>
                </div>
              )}

              {/* Tab 1.5: Corporate Intelligence (Bowheer, Benefactors, Deeds, Legal) */}
              {viewMode === 'TABBED' && activeEntityTab === 'CORPORATE_INTELLIGENCE' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Corporate Dossier & Verification Matrix
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Intelijen menyeluruh pemegang saham pengendali, pemilik manfaat (UBO/Benefactor), bowheer proyek, akta notaris, perbankan, dan audit finansial.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Card 1: Bowheer & Project Ecosystem */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                          Bowheer & Pemberi Kerja Proyek
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-mono">Commercial Network</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Klien utama dan pemilik proyek infrastruktur/pertambangan yang memberikan kontrak kerja.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">PT PP Presisi Tbk / PT PP (Persero) Tbk</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Kontrak Konstruksi, Hauling Road Batubara Jambi, & Earthworks Bendungan</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">Konsorsium Pertambangan & BUMN Karya</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Kontrak Jasa Penambangan, Cut & Fill, serta Rental &gt;1.000 Unit Alat Berat</div>
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Benefactors & UBO (Ultimate Beneficial Owner) */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          Benefactors & Pemilik Manfaat (UBO)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono">UBO Registry</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Individu atau entitas induk pengendali manfaat akhir di balik struktur legal perseroan.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">PT Lancarjaya Investama Abadi</div>
                          <div className="text-[10px] text-amber-400 mt-0.5">Pemegang Saham Mayoritas Pengendali (100% Kepemilikan Pasca-Divestasi Rp1,61 T)</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">Founding Family & Partners (Didirikan 1994)</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Pendiri operasional spesialis alat berat dan konstruksi sipil Bekasi</div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Deeds, Akta Notaris & Legal Corporate Actions */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Legal Deeds & Akta Notaris
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-mono">AHU & Notaris</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Catatan pendirian, perubahan anggaran dasar, dan persetujuan RUPSLB pelepasan saham.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">Akta Pendirian No. 13 Mei 1994</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Pendirian perseroan terbatas bidang kontraktor umum & rental alat berat</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">Akta RUPSLB Divestasi 51% Saham (2025/2026)</div>
                          <div className="text-[10px] text-emerald-400 mt-0.5">Persetujuan pelepasan 51% saham PPRE ke Lancarjaya Investama senilai Rp1,61 T</div>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Financial Statements & Bank Facilities */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                          Financial Facilities & Bank Syndication
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono">Banking Dossier</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Plafon kredit perbankan, fasilitas sindikasi, dan jaminan aset operasional.
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">PT Bank Rakyat Indonesia (Persero) Tbk (BRI)</div>
                          <div className="text-[10px] text-cyan-300 mt-0.5">Fasilitas Kredit Modal Kerja & Investasi senilai Rp 1,3 Triliun</div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                          <div className="font-semibold text-slate-200">Pertumbuhan Penjualan Bersih (+19.13% YoY)</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Didukung utilisasi armada &gt;1.000 unit alat berat di sektor nikel & batubara</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Financials Performance Extraction */}
              {viewMode === 'TABBED' && activeEntityTab === 'FINANCIALS' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 to-cyan-950/20 border border-cyan-500/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Financial Highlights & Disclosures ({fin?.period || 'Belum Diekstrak'})
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {isTbk 
                          ? 'Data diekstrak otomatis dari publikasi keterbukaan informasi IDX & portal finansial resmi.'
                          : 'Perusahaan swasta / non-Tbk tidak memiliki kewajiban keterbukaan publik (estimasi nilai proyek/tender).'}
                      </p>
                    </div>

                    <button
                      disabled={extractingFinancials}
                      onClick={handleExtractFinancials}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition disabled:opacity-40 shrink-0"
                    >
                      {extractingFinancials ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Mengekstrak Lapkeu...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Update Metrik Keuangan
                        </>
                      )}
                    </button>
                  </div>

                  {fin && (fin.revenue || fin.net_profit) ? (
                    <div className="space-y-4">
                      {/* Metric KPI Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400 font-medium">Pendapatan (Revenue)</span>
                          <div className="text-lg font-bold font-mono text-cyan-300">{fin.revenue || '-'}</div>
                          <span className="text-[10px] text-slate-500">{fin.period}</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400 font-medium">Laba Bersih (Net Profit)</span>
                          <div className="text-lg font-bold font-mono text-emerald-300">{fin.net_profit || '-'}</div>
                          <span className="text-[10px] text-emerald-500/80">Kinerja Bersih</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400 font-medium">EBITDA Operasional</span>
                          <div className="text-lg font-bold font-mono text-blue-300">{fin.ebitda || '-'}</div>
                          <span className="text-[10px] text-slate-500">Operasional Cashflow</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                          <span className="text-[11px] text-slate-400 font-medium">Kapitalisasi Pasar</span>
                          <div className="text-lg font-bold font-mono text-purple-300">{fin.market_cap || '-'}</div>
                          <span className="text-[10px] text-purple-400/80">Valuasi Bursa</span>
                        </div>
                      </div>

                      {/* Financial Notes Card */}
                      {fin.notes && (
                        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                          <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px]">
                            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Catatan Kinerja & Penggerak Fundamental:</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-sans">{fin.notes}</p>
                          {fin.source && (
                            <div className="pt-2 text-[10px] text-slate-500 font-mono">
                              Sumber Ekstraksi: {fin.source} • Terakhir diperbarui: {fin.updated_at ? new Date(fin.updated_at).toLocaleString('id-ID') : 'Baru saja'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 space-y-3">
                      <BarChart3 className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">
                        Belum ada metrik keuangan yang terekstrak untuk entitas ini.
                      </p>
                      <button
                        onClick={handleExtractFinancials}
                        disabled={extractingFinancials}
                        className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-xs font-semibold text-cyan-200 transition"
                      >
                        {extractingFinancials ? 'Sedang Mengekstrak...' : 'Mulai Ekstrak Laporan Keuangan Sekarang'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: Overview */}
              {viewMode === 'TABBED' && activeEntityTab === 'OVERVIEW' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400">Total Sinyal</div>
                      <div className="text-xl font-bold font-mono text-white mt-1">{entityRecords.length}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400">Valid A1</div>
                      <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{validSignals.length}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400">Rumor Medsos</div>
                      <div className="text-xl font-bold font-mono text-amber-400 mt-1">{rumorSignals.length}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-slate-400">Sentimen Risiko</div>
                      <div className="text-xl font-bold font-mono text-rose-400 mt-1">{badImpactSignals.length}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-2">
                    <h5 className="font-semibold text-cyan-300 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4" /> Status Profil Klasifikasi
                    </h5>
                    <p className="text-slate-300 leading-relaxed">
                      Entitas ini diklasifikasikan sebagai <strong className="text-white">{selectedEntity.entity_type === 'TBK' ? 'Perusahaan Terbuka (Tbk)' : 'PT Tertutup / Swasta'}</strong>. Sistem secara otomatis memetakan relasi antara nama perseroan dan pemegang saham <strong className="text-cyan-300">{selectedEntity.shareholders?.join(', ')}</strong> untuk mendeteksi pergerakan saham, aksi korporasi, serta rumor sengketa hukum atau transaksi semu di ruang publik.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Signals list */}
              {viewMode === 'TABBED' && activeEntityTab === 'SIGNALS' && (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {entityRecords.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-cyan-400">{r.domain}</span>
                        <span className="text-slate-500">{r.published_date?.slice(0, 10)}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white">{r.title}</h4>
                      {r.key_claim && <p className="text-[11px] text-slate-400 line-clamp-2">{r.key_claim}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Risks */}
              {viewMode === 'TABBED' && activeEntityTab === 'RISKS' && (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {badImpactSignals.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Tidak ada sinyal risiko negatif yang terdeteksi.</div>
                  ) : (
                    badImpactSignals.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-rose-400 font-semibold">{r.domain}</span>
                          <span className="text-slate-500">{r.published_date?.slice(0, 10)}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white">{r.title}</h4>
                        {r.impact_reason && (
                          <p className="text-[11px] text-rose-200/90 font-medium">{r.impact_reason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Catalysts */}
              {viewMode === 'TABBED' && activeEntityTab === 'CATALYSTS' && (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {goodImpactSignals.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Belum ada katalis positif tercatat.</div>
                  ) : (
                    goodImpactSignals.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-emerald-400 font-semibold">{r.domain}</span>
                          <span className="text-slate-500">{r.published_date?.slice(0, 10)}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white">{r.title}</h4>
                        {r.impact_reason && (
                          <p className="text-[11px] text-emerald-200/90 font-medium">{r.impact_reason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 rounded-3xl bg-slate-900/20 border border-dashed border-slate-800 text-xs text-slate-500">
              Pilih entitas di sebelah kiri untuk melihat dossier profil lengkap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
