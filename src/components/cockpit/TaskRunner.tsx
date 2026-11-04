'use client';

import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Terminal, 
  Database, 
  Link2, 
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';
import { Company } from './types';

interface TaskRunnerProps {
  companies: Company[];
  onSeekSingle: (id: number) => Promise<void>;
  onSeekAll: () => Promise<void>;
  onUnmaskAll: () => Promise<void>;
  onCleanAll: () => Promise<void>;
  onIngestBatch?: (chunkSize: number) => Promise<string>;
  seekingId: number | null;
  unmasking: boolean;
  cleaning: boolean;
  unmaskStats: { remaining: number; totalInBatch: number; processedInBatch: number } | null;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

export function TaskRunner({
  companies,
  onSeekSingle,
  onSeekAll,
  onUnmaskAll,
  onCleanAll,
  onIngestBatch,
  seekingId,
  unmasking,
  cleaning,
  unmaskStats,
}: TaskRunnerProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(companies[0]?.id || 1);
  const [runningAll, setRunningAll] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString('id-ID'),
      type: 'INFO',
      message: 'Sistem Task Runner siap menerima instruksi crawling manual.',
    },
  ]);

  const addLog = (type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR', message: string) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        type,
        message,
      },
      ...prev.slice(0, 40),
    ]);
  };

  const handleRunSingle = async () => {
    const comp = companies.find((c) => c.id === selectedCompanyId);
    addLog('INFO', `Memulai crawl satuan untuk: ${comp?.name || selectedCompanyId}...`);
    try {
      await onSeekSingle(selectedCompanyId);
      addLog('SUCCESS', `Crawl satuan untuk ${comp?.name} selesai dengan sukses.`);
    } catch (err: any) {
      addLog('ERROR', `Crawl gagal: ${err.message}`);
    }
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    addLog('INFO', `Memulai FULL CRAWL untuk ${companies.length} entitas berurutan dengan pacing anti-ban...`);
    try {
      await onSeekAll();
      addLog('SUCCESS', `FULL CRAWL seluruh entitas selesai diproses.`);
    } catch (err: any) {
      addLog('ERROR', `FULL CRAWL terhenti: ${err.message}`);
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          Pusat Eksekusi Task & Pemantau Proses (Process Console)
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Trigger manual proses crawling satuan atau keseluruhan, pembersihan data, unmasking URL Google, dan pantau log proses secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Triggers Deck */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Panel Kontrol Eksekusi
          </div>

          {/* Trigger 1: Single Target Crawl */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>1. Crawl Satuan (Per Entitas)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Pilih satu perusahaan spesifik untuk dirayap secara terisolasi.
            </p>

            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              disabled={seekingId !== null || runningAll}
              onClick={handleRunSingle}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition disabled:opacity-40"
            >
              {seekingId === selectedCompanyId ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sedang Merayap...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Mulai Crawl Entitas Terpilih
                </>
              )}
            </button>
          </div>

          {/* Trigger 2: Full Crawl (All Targets) */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>2. Full Crawl (Semua Portofolio)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Merayap seluruh entitas yang terdaftar berurutan dengan jeda jitter anti-ban.
            </p>

            <button
              disabled={runningAll || seekingId !== null}
              onClick={handleRunAll}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition disabled:opacity-40"
            >
              {runningAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Memproses Seluruh Entitas...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Mulai Full Batch Crawl
                </>
              )}
            </button>
          </div>

          {/* Trigger 3 & 4: Unmasking & Cleaning */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-white">3. Pipeline Pemrosesan Lanjutan</div>

            <button
              disabled={unmasking}
              onClick={async () => {
                addLog('INFO', 'Menjalankan batch unmasking URL Google...');
                await onUnmaskAll();
                addLog('SUCCESS', 'Batch unmasking URL Google selesai.');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-cyan-300 transition disabled:opacity-40"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              {unmasking ? 'Unmasking Berjalan...' : `Unmasking Part (Sisa ${unmaskStats?.remaining ?? 0})`}
            </button>

            <button
              disabled={cleaning}
              onClick={async () => {
                addLog('INFO', 'Menjalankan analisis dampak & pembersihan data...');
                await onCleanAll();
                addLog('SUCCESS', 'Analisis dampak & data cleaning selesai.');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-300 transition disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {cleaning ? 'Menganalisis...' : 'Re-Run Impact & Rumor Cleaner'}
            </button>

            {/* Gentle Batch Harvester & ChromaDB Vector Sync */}
            <button
              disabled={ingesting}
              onClick={async () => {
                if (!onIngestBatch) return;
                setIngesting(true);
                addLog('INFO', 'Memulai Gentle Batch Harvester (10 URLs) dengan jeda sopan & sinkronisasi Vector Store...');
                try {
                  const out = await onIngestBatch(10);
                  addLog('SUCCESS', `Harvester Batch Selesai:\n${out}`);
                } catch (err: any) {
                  addLog('ERROR', `Harvester gagal: ${err.message}`);
                } finally {
                  setIngesting(false);
                }
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-emerald-300 transition disabled:opacity-40"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              {ingesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Memproses Batch Anti-Block...
                </>
              ) : (
                'Ekstrak Deep Content (10 Item Batch)'
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Process Console & Real-time Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
            <span>Terminal Log Aktivitas Sistem</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ONLINE & STANDBY
            </span>
          </div>

          <div className="rounded-3xl bg-black border border-slate-800 p-5 font-mono text-xs space-y-3 min-h-[420px] flex flex-col justify-between shadow-2xl">
            {/* Log Stream Window */}
            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 leading-relaxed text-[11px]">
                  <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                  <span className={`shrink-0 font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    log.type === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    log.type === 'ERROR' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    log.type === 'WARNING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-slate-900 text-cyan-400 border border-slate-800'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300 break-words">{log.message}</span>
                </div>
              ))}
            </div>

            {/* Bottom Status bar */}
            <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>SQLite WAL Mode: Aktif</span>
              </div>
              <button
                onClick={() => setLogs([{ id: '1', timestamp: new Date().toLocaleTimeString('id-ID'), type: 'INFO', message: 'Log dibersihkan.' }])}
                className="text-slate-500 hover:text-slate-300 transition underline text-[10px]"
              >
                Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
