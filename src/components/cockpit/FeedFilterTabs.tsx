'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Video, 
  Search 
} from 'lucide-react';
import { FilterTab, ScrapedRecord } from './types';

interface FeedFilterTabsProps {
  activeTab: FilterTab;
  onSelectTab: (tab: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  records: ScrapedRecord[];
  totalRecordsCount: number;
  timeRangeMode?: '7d' | '30d' | 'custom';
  onTimeRangeChange?: (mode: '7d' | '30d' | 'custom', start?: string, end?: string) => void;
}

export function FeedFilterTabs({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  records,
  totalRecordsCount,
  timeRangeMode = '7d',
  onTimeRangeChange,
}: FeedFilterTabsProps) {
  const allCount = totalRecordsCount;
  const validCount = records.filter((r) => r.clean_status === 'VALID').length;
  const rumorCount = records.filter((r) => r.clean_status === 'RUMOR').length;
  const goodCount = records.filter((r) => r.impact_sentiment === 'GOOD_IMPACT').length;
  const badCount = records.filter((r) => r.impact_sentiment === 'BAD_IMPACT').length;
  const videoCount = records.filter(
    (r) => r.is_video === 1 || r.domain.includes('youtube') || r.url.includes('youtube.com')
  ).length;

  const tabs: { id: FilterTab; label: string; count: number; icon: any; color: string }[] = [
    { id: 'ALL', label: 'Semua Berita', count: allCount, icon: null, color: 'text-slate-300' },
    { id: 'VALID', label: 'Valid Resmi', count: validCount, icon: CheckCircle2, color: 'text-emerald-400' },
    { id: 'RUMOR', label: 'Isu Pasar', count: rumorCount, icon: AlertTriangle, color: 'text-amber-400' },
    { id: 'GOOD', label: 'Katalis Positif', count: goodCount, icon: TrendingUp, color: 'text-emerald-400' },
    { id: 'BAD', label: 'Risiko Regulasi', count: badCount, icon: TrendingDown, color: 'text-rose-400' },
    { id: 'VIDEO', label: 'Video YouTube', count: videoCount, icon: Video, color: 'text-purple-400' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-3 py-2 rounded-2xl bg-[#090d16]/90 border border-white/[0.08] backdrop-blur-xl shadow-lg">
      {/* Sliding Kinetic Segmented Filter */}
      <div className="flex items-center flex-nowrap overflow-x-auto no-scrollbar gap-1 py-0.5">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;

          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`relative shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium tracking-tight transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Morphing Liquid Pill */}
              {isActive && (
                <motion.div
                  layoutId="activeFilterPill"
                  className="absolute inset-0 bg-white/[0.08] border border-white/[0.14] rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.35)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                {Icon && <Icon className={`w-3.5 h-3.5 ${t.color}`} />}
                <span>{t.label}</span>
              </span>

              <span
                className={`relative z-10 text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                  isActive
                    ? 'bg-white/[0.12] text-white font-bold'
                    : 'bg-white/[0.04] text-slate-500'
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Time Range Toggle + Real-time Query Search */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onTimeRangeChange && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#050811] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => onTimeRangeChange('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                timeRangeMode === '7d'
                  ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => onTimeRangeChange('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                timeRangeMode === '30d'
                  ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Hari
            </button>
          </div>
        )}

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kata kunci, emiten, isu..."
            className="w-full bg-[#050811] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
