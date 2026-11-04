'use client';

import React from 'react';
import { Building2, Search, Users, Clock, Globe } from 'lucide-react';
import { Company } from './types';

interface CompanySidebarProps {
  companies: Company[];
  selectedCompanyId: number | null;
  seekingId: number | null;
  onSelectCompany: (id: number | null) => void;
  onSeek: (id: number) => void;
  onOpenAddModal: () => void;
}

export function CompanySidebar({
  companies,
  selectedCompanyId,
  seekingId,
  onSelectCompany,
  onSeek,
  onOpenAddModal,
}: CompanySidebarProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          Roster Entitas ({companies.length})
        </h2>
      </div>

      <div className="space-y-2">
        {/* All Companies Button */}
        <button
          onClick={() => onSelectCompany(null)}
          className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between ${
            selectedCompanyId === null
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-950/20'
              : 'bg-slate-900/40 border-white/[0.06] hover:border-white/15 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold">Semua Entitas (Global Radar)</span>
          </div>
        </button>

        {/* Company Cards */}
        {companies.map((c) => {
          const isSelected = selectedCompanyId === c.id;
          const isSeeking = seekingId === c.id;
          const isTbk = c.entity_type === 'TBK' || c.name.toLowerCase().includes('tbk');

          return (
            <div
              key={c.id}
              onClick={() => onSelectCompany(c.id)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-500/50 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/40 border-white/[0.06] hover:border-white/15 text-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-xs font-bold text-white leading-tight">{c.name}</h3>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      isTbk ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {isTbk ? 'Tbk / Emiten' : 'Non-Tbk / Swasta'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span>{c.shareholders?.join(', ') || 'Belum ada data Stakeholder'}</span>
                  </div>
                </div>

                <button
                  disabled={isSeeking}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(c.id);
                  }}
                  className={`shrink-0 p-2 rounded-xl text-xs font-semibold border transition ${
                    isSeeking
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse'
                      : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border-cyan-500/40 shadow-sm'
                  }`}
                  title="Rayap multi-kanal"
                >
                  {isSeeking ? (
                    <Clock className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {c.last_crawled_at && (
                <div className="text-[10px] text-slate-500 flex items-center gap-1 border-t border-white/[0.04] pt-2">
                  <Clock className="w-3 h-3 text-slate-600" />
                  Terakhir rayap: {new Date(c.last_crawled_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}
            </div>
          );
        })}

        {companies.length === 0 && (
          <div className="text-center p-6 rounded-2xl bg-slate-900/20 border border-dashed border-white/10 text-xs text-slate-500">
            Belum ada emiten terdaftar.
            <button
              onClick={onOpenAddModal}
              className="mt-2 block w-full py-1.5 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-medium"
            >
              + Tambah Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
