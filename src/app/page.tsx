'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Company, ScrapedRecord, FilterTab } from '@/components/cockpit/types';
import { GlassySidebar } from '@/components/cockpit/GlassySidebar';
import { FeedFilterTabs } from '@/components/cockpit/FeedFilterTabs';
import { NewsHighlightHero } from '@/components/cockpit/NewsHighlightHero';
import { NewsListItem } from '@/components/cockpit/NewsListItem';
import { EntityProfileManager } from '@/components/cockpit/EntityProfileManager';
import { TaskRunner } from '@/components/cockpit/TaskRunner';
import { CockpitModals } from '@/components/cockpit/CockpitModals';
import { NewsReaderModal } from '@/components/cockpit/NewsReaderModal';
import { PaginationControl } from '@/components/cockpit/PaginationControl';
import { Newspaper, Building2, Terminal, HelpCircle } from 'lucide-react';

type AppNavSection = 'NEWSFEED' | 'ENTITIES' | 'TASKS';

export default function CorporateIntelCockpit() {
  const [activeSection, setActiveSection] = useState<AppNavSection>('NEWSFEED');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [records, setRecords] = useState<ScrapedRecord[]>([]);
  const [highlightRecords, setHighlightRecords] = useState<ScrapedRecord[]>([]);
  const [totalRecordsCount, setTotalRecordsCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12); // Best for 3-column visual card grid
  const [loading, setLoading] = useState(true);
  const [seekingId, setSeekingId] = useState<number | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [unmasking, setUnmasking] = useState(false);
  const [unmaskStats, setUnmaskStats] = useState<{ remaining: number; totalInBatch: number; processedInBatch: number } | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('ALL');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Time range state
  const [timeRangeMode, setTimeRangeMode] = useState<'7d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newShareholders, setNewShareholders] = useState('');
  const [newEntityType, setNewEntityType] = useState<'AUTO' | 'TBK' | 'NON_TBK' | 'INDIVIDUAL'>('AUTO');
  const [inspectedRecord, setInspectedRecord] = useState<ScrapedRecord | null>(null);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/KeywordCrawler/api/companies');
      const data = await res.json();
      if (data.success) setCompanies(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHighlights = async () => {
    try {
      const res = await fetch('/KeywordCrawler/api/records?highlights=1');
      const data = await res.json();
      if (data.success && data.data) {
        setHighlightRecords(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = useCallback(async (
    companyId = selectedCompanyId,
    page = currentPage,
    limit = pageSize,
    tab = activeFilterTab,
    search = searchQuery
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.append('company_id', companyId.toString());
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (tab === 'VALID') params.append('status', 'VALID');
      else if (tab === 'RUMOR') params.append('status', 'RUMOR');
      else if (tab === 'GOOD') params.append('impact', 'GOOD_IMPACT');
      else if (tab === 'BAD') params.append('impact', 'BAD_IMPACT');
      else if (tab === 'VIDEO') params.append('is_video', '1');

      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/KeywordCrawler/api/records?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
        setTotalRecordsCount(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId, currentPage, pageSize, activeFilterTab, searchQuery]);

  useEffect(() => {
    fetchCompanies();
    fetchHighlights();
  }, []);

  useEffect(() => {
    fetchRecords(selectedCompanyId, currentPage, pageSize, activeFilterTab, searchQuery);
  }, [selectedCompanyId, currentPage, pageSize, activeFilterTab, searchQuery, fetchRecords]);

  const handleSeek = async (id: number) => {
    setSeekingId(id);
    setStatusMessage({ 
      text: `Sedang merayap seluruh web & medsos (${timeRangeMode === '7d' ? '7 hari' : timeRangeMode === '30d' ? '30 hari' : 'custom range'}). Mode Pacing aktif (1.3s jeda anti-ban)...`, 
      type: 'info' 
    });
    try {
      const res = await fetch(`/KeywordCrawler/api/companies/${id}/seek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRangeMode,
          startDate: timeRangeMode === 'custom' ? startDate : undefined,
          endDate: timeRangeMode === 'custom' ? endDate : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: data.message, type: 'success' });
        await Promise.all([fetchCompanies(), fetchRecords()]);
      } else {
        setStatusMessage({ text: data.error || 'Gagal mencari data', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setSeekingId(null);
    }
  };

  const handleCleanData = async () => {
    setCleaning(true);
    setStatusMessage({ text: 'Menjalankan pipeline data cleaning, summary video, & analisis Good/Bad impact...', type: 'info' });
    try {
      const res = await fetch('/KeywordCrawler/api/clean', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: data.message, type: 'success' });
        await fetchRecords();
      } else {
        setStatusMessage({ text: data.error || 'Gagal membersihkan data', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setCleaning(false);
    }
  };

  const handleIngestBatch = async (chunkSize: number = 10): Promise<string> => {
    setStatusMessage({ text: `Menjalankan Gentle Ingestion (${chunkSize} item) anti-block dengan jeda acak...`, type: 'info' });
    try {
      const res = await fetch('/KeywordCrawler/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunkSize }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ text: data.message, type: 'success' });
        await fetchRecords();
        return data.output || data.message;
      } else {
        setStatusMessage({ text: data.error || 'Gagal ekstrak batch', type: 'error' });
        throw new Error(data.error || 'Gagal ingest');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
      throw err;
    }
  };

  // Check remaining masked URLs on mount
  const checkMaskedStatus = async () => {
    try {
      const res = await fetch('/KeywordCrawler/api/unmask');
      const data = await res.json();
      if (data.success) {
        setUnmaskStats({
          remaining: data.remaining,
          totalInBatch: data.remaining,
          processedInBatch: 0,
        });
      }
    } catch {}
  };

  useEffect(() => {
    checkMaskedStatus();
  }, [records]);

  // Chunked Part-by-Part Unmasking
  const handleUnmaskAll = async () => {
    if (unmasking) return;
    setUnmasking(true);
    setStatusMessage({ text: 'Memulai proses unmasking Google URLs per part...', type: 'info' });

    try {
      const checkRes = await fetch('/KeywordCrawler/api/unmask');
      const checkData = await checkRes.json();
      let currentRemaining = checkData.remaining || 0;

      if (currentRemaining === 0) {
        setStatusMessage({ text: 'Semua link Google sudah ter-unmask ke domain asli.', type: 'success' });
        setUnmasking(false);
        return;
      }

      const totalToProcess = currentRemaining;
      let totalProcessed = 0;
      setUnmaskStats({ remaining: currentRemaining, totalInBatch: totalToProcess, processedInBatch: 0 });

      let partNumber = 1;
      while (currentRemaining > 0) {
        setStatusMessage({
          text: `Memproses Part #${partNumber} (${totalProcessed}/${totalToProcess} selesai, sisa ${currentRemaining} URL)...`,
          type: 'info',
        });

        const partRes = await fetch('/KeywordCrawler/api/unmask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunkSize: 20 }),
        });

        const partData = await partRes.json();
        if (!partData.success) {
          throw new Error(partData.error || 'Gagal memproses part');
        }

        const unmaskedThisPart = partData.unmasked || 0;
        currentRemaining = partData.remaining;
        totalProcessed += unmaskedThisPart;

        setUnmaskStats({
          remaining: currentRemaining,
          totalInBatch: totalToProcess,
          processedInBatch: Math.min(totalToProcess, totalProcessed),
        });

        if (unmaskedThisPart === 0 && currentRemaining > 0) {
          break;
        }

        partNumber++;
        await new Promise((r) => setTimeout(r, 600));
      }

      setStatusMessage({
        text: `Selesai seluruh part! Berhasil membuka ${totalProcessed} URL Google ke website asli.`,
        type: 'success',
      });
      await fetchRecords();
    } catch (err: any) {
      setStatusMessage({ text: `Unmasking terhenti: ${err.message}`, type: 'error' });
    } finally {
      setUnmasking(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const shList = newShareholders.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const res = await fetch('/KeywordCrawler/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName,
          shareholders: shList,
          entityType: newEntityType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewCompanyName('');
        setNewShareholders('');
        setNewEntityType('AUTO');
        setStatusMessage({ text: `Entitas ${newCompanyName} berhasil didaftarkan.`, type: 'success' });
        await fetchCompanies();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Ambient Radial Glow Wells */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[450px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[400px] bg-emerald-600/5 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Top Executive Master Header Bar ── */}
        <header className="mb-6 px-6 py-4 rounded-2xl bg-[#090d16]/90 border border-white/[0.08] backdrop-blur-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shrink-0">
              <Newspaper className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-cyan-400">
                  MARKET RADAR
                </span>
                <span className="text-slate-600 text-xs">/</span>
                <span className="text-[11px] font-mono tracking-wider uppercase text-slate-300 font-semibold">
                  EXECUTIVE INTELLIGENCE
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5" />
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Pemantauan real-time emiten, bowheer proyek, akta AHU, dan sentimen bursa modal
              </p>
            </div>
          </div>

          {/* Sovereign Actions: Unmask & Tambah Entitas */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleUnmaskAll}
              disabled={unmasking}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-xs font-mono text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Unmask URL</span>
              <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[10px] text-slate-400 font-mono">
                {unmaskStats?.remaining ?? 0}
              </span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-950 text-xs font-semibold tracking-tight transition-all shadow-sm active:scale-95"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Tambah Entitas</span>
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {statusMessage && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between backdrop-blur-md transition ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white ml-4 font-bold">×</button>
          </div>
        )}

        {/* ── Two-Column Architecture: Left Glassy Sidebar + Right Main Workspace ── */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT: Premium Glassy Sidebar */}
          <GlassySidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={(id) => {
              setSelectedCompanyId(id);
              setCurrentPage(1);
            }}
            totalRecordsCount={totalRecordsCount}
            timeRangeMode={timeRangeMode}
            onTimeRangeChange={(mode, start, end) => {
              setTimeRangeMode(mode);
              if (start) setStartDate(start);
              if (end) setEndDate(end);
            }}
            onOpenAddModal={() => setShowAddModal(true)}
            onRefresh={() => {
              fetchCompanies();
              fetchRecords();
              fetchHighlights();
            }}
            onUnmaskAll={handleUnmaskAll}
            unmasking={unmasking}
            unmaskStats={unmaskStats}
          />

          {/* RIGHT: Main Workspace (Newsfeed / Entities / Tasks) with Fluid Transition */}
          <main className="flex-1 min-w-0 w-full">
            <AnimatePresence mode="wait">
              {/* SECTION 1: VISUAL NEWSFEED PORTAL */}
              {activeSection === 'NEWSFEED' && (
                <motion.div
                  key="newsfeed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  className="space-y-8"
                >
                  {/* Top Permanent Section: News Highlight Hero (Lead Story + 2 Side Cards) */}
                  {highlightRecords.length > 0 && !searchQuery.trim() && activeFilterTab === 'ALL' && currentPage === 1 && (
                    <NewsHighlightHero
                      records={highlightRecords}
                      onInspect={setInspectedRecord}
                    />
                  )}

                  {/* Filter Tabs & Search */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                        ARSIP BERITA &amp; FEED AKTIF
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        {totalRecordsCount} Artikel Terdaftar
                      </span>
                    </div>

                    <FeedFilterTabs
                      activeTab={activeFilterTab}
                      onSelectTab={(tab) => {
                        setActiveFilterTab(tab);
                        setCurrentPage(1);
                      }}
                      searchQuery={searchQuery}
                      onSearchChange={(q) => {
                        setSearchQuery(q);
                        setCurrentPage(1);
                      }}
                      records={records}
                      totalRecordsCount={totalRecordsCount}
                      timeRangeMode={timeRangeMode}
                      onTimeRangeChange={(mode) => setTimeRangeMode(mode)}
                    />
                  </div>

                  {/* Visual News Grid (Filtered Archive List) */}
                  {loading ? (
                    <div className="text-center py-24 space-y-3">
                      <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-slate-500 font-mono">Menyiapkan visual portal berita...</p>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="text-center py-24 rounded-3xl bg-slate-900/20 border border-dashed border-slate-800 space-y-2">
                      <HelpCircle className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-base font-semibold text-slate-400">Tidak ada berita yang sesuai filter</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Coba ubah filter kategori, rentang waktu, atau lakukan perayapan data baru di Task Runner.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3">
                        {records.map((r) => (
                          <NewsListItem key={r.id} record={r} onInspect={setInspectedRecord} />
                        ))}
                      </div>

                      {/* Pagination Bar */}
                      <PaginationControl
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={totalRecordsCount}
                        onPageChange={(p) => setCurrentPage(p)}
                        onPageSizeChange={(sz) => {
                          setPageSize(sz);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* SECTION 2: ENTITIES & PROFILES MANAGER */}
              {activeSection === 'ENTITIES' && (
                <motion.div
                  key="entities"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                >
                  <EntityProfileManager
                    companies={companies}
                    records={records}
                    onOpenAddModal={() => setShowAddModal(true)}
                    onSelectCompany={(id) => {
                      setSelectedCompanyId(id);
                      setCurrentPage(1);
                    }}
                    onSeek={handleSeek}
                    onRefreshCompanies={fetchCompanies}
                    seekingId={seekingId}
                    onOpenReader={(record) => setInspectedRecord(record)}
                  />
                </motion.div>
              )}

              {/* SECTION 3: TASK RUNNER & PROCESS CONSOLE */}
              {activeSection === 'TASKS' && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                >
                  <TaskRunner
                    companies={companies}
                    onSeekSingle={async (id) => handleSeek(id)}
                    onSeekAll={async () => {
                      for (const comp of companies) {
                        await handleSeek(comp.id);
                      }
                    }}
                    onUnmaskAll={handleUnmaskAll}
                    onCleanAll={handleCleanData}
                    onIngestBatch={handleIngestBatch}
                    seekingId={seekingId}
                    unmasking={unmasking}
                    cleaning={cleaning}
                    unmaskStats={unmaskStats}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
        </div>

        {/* Module 5: Add Company & Inspect JSON Modals */}
      <CockpitModals
        showAddModal={showAddModal}
        onCloseAddModal={() => setShowAddModal(false)}
        newCompanyName={newCompanyName}
        setNewCompanyName={setNewCompanyName}
        newShareholders={newShareholders}
        setNewShareholders={setNewShareholders}
        newEntityType={newEntityType}
        setNewEntityType={setNewEntityType}
        onCreateCompany={handleCreateCompany}
        inspectedRecord={null}
        onCloseInspectModal={() => {}}
      />

      {/* Reader Modal: Clean In-App Reading View */}
      <NewsReaderModal
        record={inspectedRecord}
        onClose={() => setInspectedRecord(null)}
      />
    </div>
  );
}
