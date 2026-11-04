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

interface NewsHighlightHeroProps {
  records: ScrapedRecord[];
  onInspect: (r: ScrapedRecord) => void;
}

export function NewsHighlightHero({ records, onInspect }: NewsHighlightHeroProps) {
  if (records.length === 0) return null;

  const lead = records[0];
  const sideItems = records.slice(1, 4);

  const leadImage = resolveNewsImage(lead);
  const isLeadGood = lead.impact_sentiment === 'GOOD_IMPACT';
  const isLeadBad = lead.impact_sentiment === 'BAD_IMPACT';

  return (
    <section className="bg-[#0b0e18] border border-white/[0.08] rounded-3xl p-5 sm:p-6 lg:p-7 shadow-2xl space-y-5">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              EDITORIAL NEWS HIGHLIGHTS
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Curated Spread
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Sorotan utama pasar modal dan emiten dari berbagai portal berita terverifikasi
            </p>
          </div>
        </div>

        {/* Multi-Portal Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Array.from(new Set(records.map(r => r.domain))).map((dom) => (
            <span
              key={dom}
              className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-[11px] font-mono text-slate-300"
            >
              {dom}
            </span>
          ))}
        </div>
      </div>

      {/* Balanced Height Grid (Equal Height Container) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-[480px]">
        
        {/* ── LEFT: The Lead Story (7 Columns) ── */}
        <article
          onClick={() => onInspect(lead)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onInspect(lead);
            }
          }}
          className="lg:col-span-7 h-full group relative bg-[#0e1424] hover:bg-[#121a30] border border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg"
        >
          {/* Cover Media Header */}
          <div className="relative w-full h-56 sm:h-64 lg:h-[260px] overflow-hidden bg-slate-950 shrink-0">
            <img
              src={leadImage}
              alt={lead.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424] via-[#0e1424]/40 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  LEAD STORY
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-white/10 text-slate-300 text-[11px] font-mono backdrop-blur-md">
                  {lead.domain}
                </span>
              </div>

              {isLeadGood && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  Katalis Positif
                </span>
              )}
              {isLeadBad && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/50 backdrop-blur-md">
                  <TrendingDown className="w-3 h-3 text-rose-400" />
                  Risiko Negatif
                </span>
              )}
            </div>

            {/* Company Tag */}
            {lead.company_name && (
              <div className="absolute bottom-3 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-md">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  {lead.company_name}
                </span>
              </div>
            )}
          </div>

          {/* Lead Text Content */}
          <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-editorial text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2 break-words [overflow-wrap:anywhere]">
                {cleanText(lead.title)}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 font-sans">
                {cleanText(lead.snippet)}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {lead.published_date ? lead.published_date.slice(0, 16).replace(/T/, ' ') : 'Hari Ini'}
              </span>
              <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                Baca Selengkapnya <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </article>

        {/* ── RIGHT: 3 Secondary Curated Stories (5 Columns, Compact Equal Rows) ── */}
        <div className="lg:col-span-5 h-full flex flex-col justify-between gap-3">
          {sideItems.map((item) => {
            const sideImg = resolveNewsImage(item);
            const isGood = item.impact_sentiment === 'GOOD_IMPACT';
            const isBad = item.impact_sentiment === 'BAD_IMPACT';

            return (
              <article
                key={item.id}
                onClick={() => onInspect(item)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onInspect(item);
                  }
                }}
                className="group flex-1 bg-[#090d16] hover:bg-[#0e1424] border border-white/[0.06] hover:border-cyan-500/30 rounded-2xl p-3 sm:p-3.5 transition-all duration-200 cursor-pointer flex gap-3.5 items-center justify-between shadow-sm"
              >
                {/* Square / 16:9 Thumbnail */}
                <div className="relative w-28 sm:w-32 h-full min-h-[90px] rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-white/[0.06]">
                  <img
                    src={sideImg}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-slate-200 backdrop-blur-md">
                    {item.domain}
                  </span>
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {item.company_name && (
                      <span className="text-[10px] font-mono font-semibold text-cyan-400 truncate max-w-[120px]">
                        {item.company_name}
                      </span>
                    )}
                    {isGood && (
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        Katalis
                      </span>
                    )}
                    {isBad && (
                      <span className="text-[9px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                        Risiko
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {item.published_date ? item.published_date.slice(0, 10) : ''}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                    {cleanText(item.title)}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                    {cleanText(item.snippet)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
