'use client';

import React from 'react';
import { 
  X, 
  ExternalLink, 
  Building2, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Share2, 
  Bookmark,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { ScrapedRecord } from './types';
import { resolveNewsImage } from '@/lib/images';
import { cleanText, formatArticleParagraphs } from '@/lib/sanitize';
import { ArticleAiChat } from './ArticleAiChat';

interface NewsReaderModalProps {
  record: ScrapedRecord | null;
  onClose: () => void;
}

export function NewsReaderModal({ record, onClose }: NewsReaderModalProps) {
  if (!record) return null;

  const imageUrl = resolveNewsImage(record);
  const isGood = record.impact_sentiment === 'GOOD_IMPACT';
  const isBad = record.impact_sentiment === 'BAD_IMPACT';

  // Format: clean title and snippet
  const cleanTitle = cleanText(record.title);
  const cleanSnippet = cleanText(record.snippet);
  const cleanClaim = cleanText(record.key_claim);
  const paragraphs = formatArticleParagraphs(record.snippet, record.raw_content, record.full_content);

  // Fallback: If paragraphs still empty or very short, split full_content directly
  const displayParagraphs = paragraphs.length > 0 && paragraphs[0] !== 'Laporan berita sedang diproses dari portal sumber.'
    ? paragraphs
    : (record.full_content ? record.full_content.split(/\n+/).filter(Boolean) : [cleanSnippet]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#04060a]/90 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b0f19] border border-white/[0.08] rounded-3xl max-w-[96vw] xl:max-w-7xl w-full h-[94vh] overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col lg:flex-row justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT COLUMN: Professional Editorial News Article ── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0d16]">
          {/* Top Sticky Editorial Control Bar */}
          <div className="px-6 py-3.5 border-b border-white/[0.06] bg-[#0b0e18]/80 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono font-bold text-slate-300">
                {record.domain}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-xs font-mono text-slate-400">
                {record.source_category || 'FINANCIAL_NEWS'}
              </span>
              {record.company_name && (
                <>
                  <span className="text-slate-600 hidden sm:inline">/</span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-mono font-semibold text-cyan-400">
                    <Building2 className="w-3.5 h-3.5" />
                    {record.company_name}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Sumber Asli
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Editorial Paper Body */}
          <div className="overflow-y-auto px-6 sm:px-10 lg:px-14 py-8 space-y-8 flex-1 text-slate-100 max-w-5xl mx-auto w-full">
            
            {/* Header: Topic & Impact Tag */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {isGood && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Sentimen Positif (Katalis Pasar)
                  </span>
                )}
                {isBad && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Risiko Negatif (Tekanan Jual / Regulasi)
                  </span>
                )}
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {record.published_date ? record.published_date.replace(/T/, ' ').replace(/\..+/, '') : 'Terverifikasi 7 Hari Terakhir'}
                </span>
              </div>

              {/* Editorial Display Headline (Newsreader Serif typography) */}
              <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-[1.25] break-words [overflow-wrap:anywhere]">
                {cleanTitle}
              </h1>

              {/* Author / Source Meta Bar */}
              <div className="flex items-center justify-between border-y border-white/[0.06] py-3 text-xs text-slate-400 font-mono">
                <div>
                  Koleksi Intelijen: <span className="text-slate-200">Keyword &quot;{cleanText(record.keyword_used)}&quot;</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>ID #{record.id}</span>
                  <span>Verified Feed ✓</span>
                </div>
              </div>
            </div>

            {/* Hero Cover Image (Frameless Editorial Studio) */}
            <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-950 border border-white/[0.08] shadow-xl">
              <img
                src={imageUrl}
                alt={cleanTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 text-[11px] font-mono text-slate-300/80 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-md">
                Dokumentasi Visual: {record.domain}
              </div>
            </div>

            {/* ── SECTION 1: EXECUTIVE BRIEFING (The Key Takeaway) ── */}
            <div className="border-l-2 border-amber-500/80 pl-5 py-1 space-y-1.5">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                EXECUTIVE SUMMARY
              </div>
              <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed font-sans">
                {cleanSnippet}
              </p>
            </div>

            {/* ── SECTION 2: ANALISA INTELIJEN & DAMPAK PASAR (Cardless Restraint) ── */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/20 via-slate-900/40 to-slate-900/10 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  ANALISA DAMPAK &amp; PERSEPSI PASAR
                </div>
                <span className="text-[10px] font-mono text-cyan-500/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  AI Synthesis
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                {cleanClaim || 'Informasi ini memberikan implikasi langsung terhadap likuiditas perdagangan dan sentimen jangka pendek pelaku pasar institusi.'}
              </p>
            </div>

            {/* ── SECTION 3: KONTEN BERITA SUMBER RESMI ── */}
            <div className="space-y-4 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  LAPORAN LENGKAP ARTIKEL SUMBER
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  Kanal Resmi {record.domain}
                </span>
              </div>

              {/* Long-form readable typography */}
              <div className="text-slate-300 font-sans text-base leading-relaxed space-y-4">
                {displayParagraphs.map((p, idx) => (
                  <p key={idx} className="leading-relaxed text-slate-200">
                    {p}
                  </p>
                ))}
                
                {(!record.full_content || record.full_content.length < 200) && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-slate-200">
                        Artikel bersumber dari {record.domain} ({record.source_category || 'MAINSTREAM'})
                      </p>
                      <p className="text-slate-400">
                        Sebagian artikel pada platform ini diproteksi oleh paywall atau pembatasan akses bot. Klik tombol &quot;Buka Sumber Asli&quot; untuk membaca artikel versi penuh langsung pada situs penerbit.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Open Button */}
              <div className="pt-2">
                <a
                  href={record.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs transition duration-200 group"
                >
                  Buka Halaman Penuh di {record.domain}
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

          </div>

          {/* Left Footer Action Bar */}
          <div className="px-6 py-4 border-t border-white/[0.06] bg-[#0b0e18] flex items-center justify-between gap-4 shrink-0">
            <span className="text-xs text-slate-500 font-mono truncate max-w-sm">
              Source: {record.url}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition"
              >
                Tutup Pembaca
              </button>
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                Kunjungi Portal
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: High-Density AI Live Chat Sidecar ── */}
        <ArticleAiChat record={record} />
      </div>
    </div>
  );
}
