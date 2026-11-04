'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ScrapedRecord } from './types';

interface ModalsProps {
  showAddModal: boolean;
  onCloseAddModal: () => void;
  newCompanyName: string;
  setNewCompanyName: (v: string) => void;
  newShareholders: string;
  setNewShareholders: (v: string) => void;
  newEntityType: 'AUTO' | 'TBK' | 'NON_TBK' | 'INDIVIDUAL';
  setNewEntityType: (v: 'AUTO' | 'TBK' | 'NON_TBK' | 'INDIVIDUAL') => void;
  onCreateCompany: (e: React.FormEvent) => void;

  inspectedRecord: ScrapedRecord | null;
  onCloseInspectModal: () => void;
}

export function CockpitModals({
  showAddModal,
  onCloseAddModal,
  newCompanyName,
  setNewCompanyName,
  newShareholders,
  setNewShareholders,
  newEntityType,
  setNewEntityType,
  onCreateCompany,
  inspectedRecord,
  onCloseInspectModal,
}: ModalsProps) {
  return (
    <>
      {/* Modal 1: Add Company */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white">Tambah Target Entitas & Stakeholder</h3>
              <button
                onClick={onCloseAddModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Nama Perusahaan / Entitas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Barito Renewables Energy Tbk atau PT Maju Sejahtera"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Tipe Entitas (Auto-Detect)
                </label>
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="AUTO">✨ Auto-Detect (Otomatis Deteksi Tbk / Swasta)</option>
                  <option value="TBK">🏢 Perusahaan Terbuka (Tbk / Saham Bursa)</option>
                  <option value="NON_TBK">🏭 PT Tertutup / Swasta (Tender, PKPU, Izin)</option>
                  <option value="INDIVIDUAL">👤 Tokoh / Pengusaha / Stakeholder</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Sistem otomatis menyesuaikan kamus: Saham/MSCI untuk Tbk, PKPU/Tender untuk Swasta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Pemegang Saham Pengendali / Stakeholder (Pisahkan koma)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Prajogo Pangestu, Barito Pacific"
                  value={newShareholders}
                  onChange={(e) => setNewShareholders(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition shadow-lg shadow-cyan-600/20"
                >
                  Simpan Entitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Inspect Raw JSON & Verification Dossier */}
      {inspectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {inspectedRecord.title}
                </h3>
              </div>
              <button
                onClick={onCloseInspectModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500">Destination URL:</span>
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-cyan-300 break-all select-all">
                  {inspectedRecord.url}
                </div>
              </div>

              {inspectedRecord.key_claim && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Key Intelligence Briefing:</span>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.07] text-slate-200 leading-relaxed font-sans">
                    {inspectedRecord.key_claim}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500">Raw Stored Record:</span>
                <pre className="p-3 rounded-xl bg-black/80 border border-white/10 font-mono text-[11px] text-slate-400 overflow-x-auto">
                  {JSON.stringify(inspectedRecord, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] shrink-0">
              <span className="text-[11px] text-slate-500 font-mono">
                Hash: {inspectedRecord.url_hash?.slice(0, 16)}...
              </span>
              <a
                href={inspectedRecord.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md transition"
              >
                Kunjungi Situs Sumber
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
