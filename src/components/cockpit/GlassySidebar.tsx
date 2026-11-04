'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  Newspaper, 
  Building2, 
  Terminal, 
  Globe, 
  Sparkles, 
  RefreshCw, 
  Link2, 
  Plus,
  Calendar,
  Layers,
  ChevronRight,
  Database
} from 'lucide-react';
import { Company } from './types';

interface GlassySidebarProps {
  activeSection: 'NEWSFEED' | 'ENTITIES' | 'TASKS';
  onSelectSection: (s: 'NEWSFEED' | 'ENTITIES' | 'TASKS') => void;
  companies: Company[];
  selectedCompanyId: number | null;
  onSelectCompany: (id: number | null) => void;
  totalRecordsCount: number;
  timeRangeMode: '7d' | '30d' | 'custom';
  onTimeRangeChange: (mode: '7d' | '30d' | 'custom', start?: string, end?: string) => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  onUnmaskAll: () => void;
  unmasking: boolean;
  unmaskStats: { remaining: number; totalInBatch: number; processedInBatch: number } | null;
}

export function GlassySidebar({
  activeSection,
  onSelectSection,
  companies,
  selectedCompanyId,
  onSelectCompany,
  totalRecordsCount,
  timeRangeMode,
  onTimeRangeChange,
  onOpenAddModal,
  onRefresh,
  onUnmaskAll,
  unmasking,
  unmaskStats,
}: GlassySidebarProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
      {/* ── Brand & Radar Title (Glass Card) ── */}
      <div className="p-4 rounded-2xl bg-[#090d16]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center">
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold tracking-tight text-white flex items-center gap-1.5">
                DATABASE RADAR
              </div>
              <p className="text-[10px] font-mono text-slate-500">Active Live Index</p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh feed"
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global Live Signals */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            {totalRecordsCount} Artikel
          </span>
          <span className="text-[10px] text-emerald-400/90 font-medium">
            100% Terverifikasi
          </span>
        </div>
      </div>

      {/* ── Glassy Nav Menu (Vertical Sidebar Navigation) ── */}
      <div className="p-2 rounded-2xl bg-[#090d16]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          Navigation Desk
        </div>

        {/* Navigation buttons */}
        {(
          [
            { id: 'NEWSFEED', label: 'Portal Berita Media', icon: Newspaper },
            { id: 'ENTITIES', label: 'Profil & Metrik Entitas', icon: Building2 },
            { id: 'TASKS', label: 'Log & Status Scraping', icon: Terminal },
          ] as const
        ).map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`relative w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-medium transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 bg-white/[0.07] border border-white/[0.14] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_16px_rgba(0,0,0,0.4)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <ChevronRight className="relative z-10 w-3.5 h-3.5 text-cyan-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Glass Filter Bar: Time Range Selector ── */}
      {/* (Moved to FeedFilterTabs for cohesive in-place context) */}

      {/* ── Monitored Companies (Quick Focus Selector) ── */}
      <div className="p-3.5 rounded-2xl bg-[#090d16]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-2.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Target Korporasi
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {companies.length} Entitas
          </span>
        </div>

        <div className="space-y-1 overflow-y-auto max-h-64 pr-1">
          <button
            onClick={() => onSelectCompany(null)}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between ${
              selectedCompanyId === null
                ? 'bg-white/[0.08] text-white font-bold border border-white/[0.12]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <span>Semua Entitas</span>
            <span className="text-[10px] text-slate-500 font-mono">{companies.length}</span>
          </button>

          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectCompany(c.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition flex items-center justify-between gap-2 ${
                selectedCompanyId === c.id
                  ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <span className="truncate">{c.name}</span>
              {c.ticker && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 shrink-0">
                  {c.ticker}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
