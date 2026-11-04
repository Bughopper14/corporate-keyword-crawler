'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Globe, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  Plus, 
  Link2,
  Calendar,
  Clock,
  Database,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Video
} from 'lucide-react';
import { Company, ScrapedRecord } from './types';

interface TelemetryHeaderProps {
  companies: Company[];
  records: ScrapedRecord[];
  totalRecordsCount: number;
  timeRangeMode: '7d' | '30d' | 'custom';
  startDate: string;
  endDate: string;
  cleaning: boolean;
  unmasking: boolean;
  unmaskStats: { remaining: number; totalInBatch: number; processedInBatch: number } | null;
  onRefresh: () => void;
  onClean: () => void;
  onUnmaskAll: () => void;
  onOpenAddModal: () => void;
  onTimeRangeChange: (mode: '7d' | '30d' | 'custom', start?: string, end?: string) => void;
}

export function TelemetryHeader({
  companies,
  records,
  totalRecordsCount,
  timeRangeMode,
  startDate,
  endDate,
  cleaning,
  unmasking,
  unmaskStats,
  onRefresh,
  onClean,
  onUnmaskAll,
  onOpenAddModal,
  onTimeRangeChange,
}: TelemetryHeaderProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  const totalShareholders = companies.reduce((acc, c) => acc + (c.shareholders?.length || 0), 0);
  const validRecordsCount = records.filter((r) => r.clean_status === 'VALID').length;
  const rumorRecordsCount = records.filter((r) => r.clean_status === 'RUMOR').length;
  const goodImpactCount = records.filter((r) => r.impact_sentiment === 'GOOD_IMPACT').length;
  const badImpactCount = records.filter((r) => r.impact_sentiment === 'BAD_IMPACT').length;
  const videoRecordsCount = records.filter(
    (r) => r.is_video === 1 || r.domain.includes('youtube') || r.url.includes('youtube.com')
  ).length;

  return (
    <header className="border-b border-white/[0.08] pb-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-600/30 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans">
                  Corporate & Stakeholder Radar
                </h1>
                
                {/* Time Range Selector Strip */}
                <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-medium">
                  <button
                    onClick={() => onTimeRangeChange('7d')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      timeRangeMode === '7d'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => onTimeRangeChange('30d')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      timeRangeMode === '30d'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    30 Hari
                  </button>
                  <button
                    onClick={() => setShowCustomPicker(!showCustomPicker)}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      timeRangeMode === 'custom'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Custom</span>
                  </button>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  Anti-Ban Paced
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-source intelligence harvester untuk Korporasi Tbk, PT Swasta & Stakeholder UBO
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm backdrop-blur-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            disabled={unmasking}
            onClick={onUnmaskAll}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-sm backdrop-blur-md ${
              unmasking
                ? 'bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 cursor-wait'
                : 'bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300'
            }`}
          >
            {unmasking ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>
                  Unmasking...{' '}
                  {unmaskStats && unmaskStats.totalInBatch > 0
                    ? `(${Math.round((unmaskStats.processedInBatch / unmaskStats.totalInBatch) * 100)}%)`
                    : ''}
                </span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Unmask URL ({unmaskStats?.remaining ?? 0})</span>
              </>
            )}
          </button>

          <button
            disabled={cleaning || records.length === 0}
            onClick={onClean}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shadow-lg backdrop-blur-md ${
              cleaning
                ? 'bg-amber-600/30 text-amber-200 border border-amber-500/40 cursor-wait'
                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 shadow-amber-950/20'
            }`}
          >
            {cleaning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Menganalisis...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Analisis Dampak
              </>
            )}
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white transition shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            + Tambah Entitas
          </button>
        </div>
      </div>

      {/* Custom Date Range Popover */}
      {showCustomPicker && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center gap-3 flex-wrap text-xs text-slate-300">
          <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Tentukan Rentang Tanggal Pencarian:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Dari:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[11px] text-slate-400">Sampai:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
            />
          </div>
          <button
            onClick={() => {
              if (customStart && customEnd) {
                onTimeRangeChange('custom', customStart, customEnd);
                setShowCustomPicker(false);
              }
            }}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
          >
            Terapkan Filter
          </button>
        </div>
      )}

      {/* Progress Bar for Chunked Unmasking */}
      {unmasking && unmaskStats && unmaskStats.totalInBatch > 0 && (
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-cyan-300">
            <span className="font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Proses Unmasking URL Google Berjalan (Mode Part / Chunking)...
            </span>
            <span className="font-mono font-medium">
              {unmaskStats.processedInBatch} / {unmaskStats.totalInBatch} URL ({Math.round((unmaskStats.processedInBatch / unmaskStats.totalInBatch) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((unmaskStats.processedInBatch / unmaskStats.totalInBatch) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            URL Google News didecode per part (batch 20 URL) untuk menghindari timeout dan menjaga kestabilan request.
          </p>
        </div>
      )}

      {/* Telemetry KPI Horizon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.07] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Roster Target</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">{companies.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> {totalShareholders} stakeholder
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.07] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sinyal Database</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-300">{totalRecordsCount}</div>
          <div className="text-[11px] text-blue-400/80 mt-1">Total tersimpan di server</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.07] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Valid vs Rumor</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-300">{validRecordsCount} Valid</span>
            <span className="text-xs text-slate-500">/</span>
            <span className="text-xl font-bold font-mono text-amber-300">{rumorRecordsCount} Rumor</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Status verifikasi leksikal</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.07] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dampak Pasar</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-emerald-400 flex items-center"><TrendingUp className="w-3 h-3 mr-0.5" />{goodImpactCount}</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400 flex items-center"><TrendingDown className="w-3 h-3 mr-0.5" />{badImpactCount}</span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-300">{goodImpactCount} Good</span>
            <span className="text-xs text-slate-500">vs</span>
            <span className="text-xl font-bold font-mono text-rose-300">{badImpactCount} Bad</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Sinyal sentimen harga</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/40 border border-white/[0.07] backdrop-blur-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Multi-Media Feed</span>
            <Video className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-purple-300">{videoRecordsCount}</div>
          <div className="text-[11px] text-purple-400/80 mt-1">Video YouTube & Shorts</div>
        </div>
      </div>
    </header>
  );
}
