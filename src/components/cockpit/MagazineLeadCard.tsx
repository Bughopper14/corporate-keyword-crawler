'use client';

import React from 'react';
import { ScrapedRecord } from './types';
import { resolveNewsImage } from '@/lib/images';
import { 
  Building2, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Globe2, 
  Sparkles 
} from 'lucide-react';

interface MagazineLeadCardProps {
  record: ScrapedRecord;
  onInspect: (r: ScrapedRecord) => void;
}

export function MagazineLeadCard({ record: r, onInspect }: MagazineLeadCardProps) {
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
      className="group relative bg-[#0d121f] hover:bg-[#111827] focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 active:scale-[0.99] border border-cyan-500/30 hover:border-cyan-400/60 rounded-3xl overflow-hidden transition-[background-color,border-color,box-shadow] duration-200 shadow-2xl hover:shadow-cyan-950/40 cursor-pointer flex flex-col justify-between"
    >
      {/* Top Media Cover with Aspect Ratio */}
      <div className="relative w-full h-72 sm:h-80 md:h-96 overflow-hidden bg-slate-950">
        <img
          src={imageUrl}
          alt={r.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-[#0d121f]/40 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              LEAD STORY
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs font-mono backdrop-blur-md">
              {r.domain}
            </span>
          </div>

          {/* Sentiment Badge */}
          {isGood && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Good Impact
            </span>
          )}
          {isBad && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/50 backdrop-blur-md">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Bad Impact
            </span>
          )}
        </div>

        {/* Company Ribbon on Image */}
        {r.company_name && (
          <div className="absolute bottom-4 left-5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-md">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              {r.company_name}
            </span>
          </div>
        )}
      </div>

      {/* Headline & Body Editorial */}
      <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-100 group-hover:text-cyan-300 transition-colors leading-tight tracking-tight break-words [overflow-wrap:anywhere]">
            {r.title}
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-3">
            {r.snippet}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 tabular-nums">
          <div className="flex items-center gap-4">
            {r.published_date && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {r.published_date.slice(0, 16).replace(/T/, ' ')}
              </span>
            )}
            <span className="text-slate-400 font-mono hidden sm:inline">
              kw: <span className="text-slate-300 truncate max-w-[200px] inline-block align-bottom">{r.keyword_used}</span>
            </span>
          </div>

          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-300 hover:text-cyan-200 transition-colors font-medium"
          >
            Buka Sumber
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
