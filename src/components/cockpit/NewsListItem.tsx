'use client';

import React from 'react';
import { ScrapedRecord } from './types';
import { resolveNewsImage } from '@/lib/images';
import { cleanText } from '@/lib/sanitize';
import { 
  Building2, 
  Clock, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface NewsListItemProps {
  record: ScrapedRecord;
  onInspect: (r: ScrapedRecord) => void;
}

export function NewsListItem({ record: r, onInspect }: NewsListItemProps) {
  const imageUrl = resolveNewsImage(r);
  const isGood = r.impact_sentiment === 'GOOD_IMPACT';
  const isBad = r.impact_sentiment === 'BAD_IMPACT';

  return (
    <article
      onClick={() => onInspect(r)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onInspect(r);
        }
      }}
      className="group relative bg-[#090d16]/90 hover:bg-[#0c1220] border border-white/[0.07] hover:border-white/[0.14] rounded-2xl p-4.5 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
    >
      {/* Left: 16:9 Thumbnail Cover with Subtle Hairline */}
      <div className="relative w-full sm:w-56 h-36 sm:h-32 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/[0.07]">
        <img
          src={imageUrl}
          alt={r.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/85 border border-white/20 text-[10px] font-mono font-bold text-slate-200 backdrop-blur-md shadow-sm">
          {r.domain}
        </span>
      </div>

      {/* Middle: Editorial Content & Typography */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Meta Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {r.company_name && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white/[0.04] border border-white/[0.08] text-cyan-300">
              <Building2 className="w-3 h-3 text-cyan-400" />
              {r.company_name}
            </span>
          )}
          {isGood && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              Katalis Positif
            </span>
          )}
          {isBad && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrendingDown className="w-3 h-3" />
              Risiko Negatif
            </span>
          )}
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3 text-slate-600" />
            {r.published_date ? r.published_date.replace(/T/, ' ').replace(/\..+/, '') : '7 Hari'}
          </span>
        </div>

        {/* Headline */}
        <h3 className="font-editorial text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 break-words [overflow-wrap:anywhere] tracking-tight">
          {cleanText(r.title)}
        </h3>

        {/* Excerpt */}
        <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 leading-relaxed font-sans">
          {cleanText(r.snippet)}
        </p>
      </div>

      {/* Right: Clean Ghost Action Trigger */}
      <div className="hidden lg:flex flex-col items-end justify-center gap-2 shrink-0 pl-6 border-l border-white/[0.05]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] group-hover:bg-cyan-500/10 border border-white/[0.06] group-hover:border-cyan-500/30 text-xs font-mono text-slate-400 group-hover:text-cyan-300 transition-all">
          <span>Baca Berita</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          {r.source_category || 'MAINSTREAM'}
        </span>
      </div>
    </article>
  );
}
