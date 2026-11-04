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
  Globe2 
} from 'lucide-react';

interface CleanMediaCardProps {
  record: ScrapedRecord;
  onInspect: (r: ScrapedRecord) => void;
}

export function CleanMediaCard({ record: r, onInspect }: CleanMediaCardProps) {
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
      className="group relative bg-[#0d121f] hover:bg-[#111827] focus-visible:outline-2 focus-visible:outline-cyan-400 focus-visible:outline-offset-2 active:scale-[0.99] border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-cyan-950/20 cursor-pointer flex flex-col justify-between"
    >
      {/* 1. Clear Media Cover with clean aspect ratio */}
      <div className="relative w-full h-48 overflow-hidden bg-slate-950 shrink-0">
        <img
          src={imageUrl}
          alt={r.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d121f] via-transparent to-transparent" />

        {/* Clean top badges: separated and non-colliding */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-cyan-300 backdrop-blur-md">
            <Globe2 className="w-3 h-3 text-cyan-400" />
            {r.domain}
          </span>

          <div className="flex items-center gap-1.5">
            {isGood && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 backdrop-blur-md flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Good
              </span>
            )}
            {isBad && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-500/50 backdrop-blur-md flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-rose-400" />
                Bad
              </span>
            )}
          </div>
        </div>

        {/* Target Entity Pill cleanly anchored at bottom */}
        {r.company_name && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/95 border border-slate-700/80 text-[11px] font-medium text-slate-200 backdrop-blur-md">
              <Building2 className="w-3 h-3 text-cyan-400" />
              {r.company_name}
            </span>
          </div>
        )}
      </div>

      {/* 2. Structured Card Body: Zero Clutter, Zero Overlap */}
      <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Headline with clean line height & word break */}
          <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug break-words [overflow-wrap:anywhere]">
            {r.title}
          </h3>

          {/* Snippet text */}
          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
            {r.snippet}
          </p>
        </div>

        {/* 3. Footer Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 tabular-nums">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{r.published_date ? r.published_date.slice(0, 10) : 'Terkini'}</span>
          </div>

          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Sumber <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
