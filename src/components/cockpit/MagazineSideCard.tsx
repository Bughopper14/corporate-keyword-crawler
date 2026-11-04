'use client';

import React from 'react';
import { ScrapedRecord } from './types';
import { resolveNewsImage } from '@/lib/images';
import { Building2, ExternalLink, TrendingUp, TrendingDown, Clock, Globe2 } from 'lucide-react';

interface MagazineSideCardProps {
  record: ScrapedRecord;
  onInspect: (r: ScrapedRecord) => void;
}

export function MagazineSideCard({ record: r, onInspect }: MagazineSideCardProps) {
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
      className="group relative bg-[#0d121f] hover:bg-[#111827] focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 active:scale-[0.99] border border-slate-800 hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-[background-color,border-color,box-shadow] duration-200 shadow-md hover:shadow-cyan-950/20 cursor-pointer flex flex-col justify-between"
    >
      <div className="relative w-full h-44 overflow-hidden bg-slate-950">
        <img
          src={imageUrl}
          alt={r.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-cyan-300 backdrop-blur-md">
            {r.domain}
          </span>
          {isGood && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md">
              Good
            </span>
          )}
          {isBad && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/50 backdrop-blur-md">
              Bad
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {r.company_name && (
            <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-cyan-500" />
              {r.company_name}
            </span>
          )}
          <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {r.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {r.snippet}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
          <span>{r.published_date ? r.published_date.slice(0, 10) : ''}</span>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Sumber <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
