'use client';

import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Video, 
  Clock,
  Sparkles,
  ArrowUpRight,
  Globe2,
  Building2,
  Share2
} from 'lucide-react';
import { ScrapedRecord } from './types';

interface SignalCardProps {
  record: ScrapedRecord;
  onInspect: (r: ScrapedRecord) => void;
}

export function SignalCard({ record: r, onInspect }: SignalCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(r.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVideo = r.is_video === 1 || r.domain.includes('youtube') || r.url.includes('youtube.com');
  const isValid = r.clean_status === 'VALID';
  const isRumor = r.clean_status === 'RUMOR';
  const isGood = r.impact_sentiment === 'GOOD_IMPACT';
  const isBad = r.impact_sentiment === 'BAD_IMPACT';

  // Format relative date or clean string
  const formattedDate = r.published_date 
    ? r.published_date.replace(/T/, ' ').replace(/\..+/, '')
    : null;

  return (
    <article
      onClick={() => onInspect(r)}
      className="group relative bg-[#0d121f]/90 hover:bg-[#111827] border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-5 transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-cyan-950/20 cursor-pointer space-y-4"
    >
      {/* Top Header Row: Source, Entity, & Badges */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Pill with subtle favicon dot */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-xs font-medium text-slate-300">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-cyan-300">{r.domain}</span>
          </div>

          {/* Company Target Tag */}
          {r.company_name && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400">
              <Building2 className="w-3 h-3 text-slate-500" />
              <span className="text-slate-300 font-medium truncate max-w-[180px]">{r.company_name}</span>
            </span>
          )}

          {/* Status Validation Badge */}
          {isValid ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Valid Resmi (A1)
            </span>
          ) : isRumor ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Isu & Spekulasi
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
              Unverified
            </span>
          )}

          {/* Impact Sentiment Tag */}
          {isGood && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Katalis Positif
            </span>
          )}
          {isBad && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-300">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Risiko / Tekanan
            </span>
          )}

          {/* Video Tag */}
          {isVideo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <Video className="w-3 h-3 text-purple-400" />
              Video YouTube
            </span>
          )}
        </div>

        {/* Timestamp */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>{formattedDate}</span>
          </div>
        )}
      </div>

      {/* Headline Title */}
      <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-relaxed">
        {r.title}
      </h3>

      {/* Snippet / Context preview */}
      {r.snippet && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {r.snippet}
        </p>
      )}

      {/* Executive Briefing & Impact Callout Card */}
      {r.key_claim && (
        <div className="rounded-xl bg-[#080c16] border border-cyan-500/20 p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Executive Briefing & Key Claim:</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-xs">
            {r.key_claim}
          </p>

          {/* Impact Rationale */}
          {r.impact_reason && (
            <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2">
              <span className="font-semibold text-slate-400 shrink-0 text-[11px]">Analisis Dampak:</span>
              <span className="text-slate-200 font-medium text-[11px] leading-snug">{r.impact_reason}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Footer & Direct Link */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 shrink-0">URL:</span>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-cyan-400/90 hover:text-cyan-200 hover:underline truncate"
            title={r.url}
          >
            {r.url}
          </a>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-[11px]"
            title="Salin Tautan"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>

          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 hover:text-cyan-100 font-medium transition text-[11px]"
            title="Buka Berita Asli"
          >
            <span>Buka Sumber</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
