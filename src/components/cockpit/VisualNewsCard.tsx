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
  Languages,
  BookOpen,
  X
} from 'lucide-react';
import { ScrapedRecord } from './types';
import { resolveNewsImage } from '@/lib/images';

interface VisualNewsCardProps {
  record: ScrapedRecord;
  onInspect: (r: ScrapedRecord) => void;
}

export function VisualNewsCard({ record: r, onInspect }: VisualNewsCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeLang, setActiveLang] = useState<'id' | 'en' | 'zh'>('id');
  const [translatedText, setTranslatedText] = useState<{ en?: string; zh?: string }>({
    en: r.key_claim_en,
    zh: r.key_claim_zh,
  });
  const [translating, setTranslating] = useState(false);
  const [showFullArticleModal, setShowFullArticleModal] = useState(false);

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

  const imageUrl = resolveNewsImage(r);

  const handleLanguageSwitch = async (lang: 'id' | 'en' | 'zh', e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveLang(lang);

    if (lang === 'id') return;
    if (translatedText[lang]) return; // Already cached

    const baseClaim = r.key_claim || r.snippet || r.title;
    if (!baseClaim) return;

    setTranslating(true);
    try {
      const res = await fetch('/KeywordCrawler/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: baseClaim, targetLang: lang }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setTranslatedText((prev) => ({ ...prev, [lang]: data.text }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTranslating(false);
    }
  };

  const displayedSummary = activeLang === 'id'
    ? (r.key_claim || r.snippet)
    : (translatedText[activeLang] || r.key_claim || r.snippet);

  return (
    <>
      <article
        onClick={() => onInspect(r)}
        className="group relative bg-[#0c101c] hover:bg-[#101626] border border-slate-800/80 hover:border-cyan-500/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-2xl hover:shadow-cyan-950/20 cursor-pointer flex flex-col justify-between"
      >
        {/* Cover Image Banner */}
        <div className="relative w-full h-48 overflow-hidden bg-slate-950">
          <img
            src={imageUrl}
            alt={r.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
            loading="lazy"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c101c] via-[#0c101c]/40 to-transparent" />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-cyan-300 flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-cyan-400" />
                {r.domain}
              </span>

              {isValid && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-950/80 backdrop-blur-md border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Valid A1
                </span>
              )}

              {isRumor && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-950/80 backdrop-blur-md border border-amber-500/40 text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Isu Pasar
                </span>
              )}
            </div>

            {/* Impact Pill */}
            {isGood && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                <TrendingUp className="w-3 h-3" /> Good
              </span>
            )}
            {isBad && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-600/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                <TrendingDown className="w-3 h-3" /> Bad
              </span>
            )}
          </div>

          {/* Target Entity Pill at Bottom Left of Image */}
          {r.company_name && (
            <div className="absolute bottom-2.5 left-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/10 text-[11px] font-medium text-slate-200">
                <Building2 className="w-3 h-3 text-cyan-400" />
                {r.company_name}
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            {/* Timestamp */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3 h-3 text-slate-600" />
              <span>{r.published_date ? new Date(r.published_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}</span>
            </div>

            {/* Title */}
            <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
              {r.title}
            </h3>

            {/* Snippet */}
            {r.snippet && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {r.snippet}
              </p>
            )}
          </div>

          {/* Executive Briefing Callout with 3-Language Selector */}
          <div className="rounded-2xl bg-black/60 border border-slate-800 p-3.5 space-y-2 text-xs">
            {/* Language Switcher Bar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Executive Summary:</span>
              </div>

              {/* 3-Language Pill Tabs (Indo, Inggris, China) */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => handleLanguageSwitch('id', e)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    activeLang === 'id' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Bahasa Indonesia"
                >
                  🇮🇩 ID
                </button>
                <button
                  onClick={(e) => handleLanguageSwitch('en', e)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    activeLang === 'en' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="English Version"
                >
                  🇬🇧 EN
                </button>
                <button
                  onClick={(e) => handleLanguageSwitch('zh', e)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    activeLang === 'zh' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="中文版本"
                >
                  🇨🇳 中文
                </button>
              </div>
            </div>

            {/* Summary Text (Changes with Language) */}
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {translating ? (
                <span className="text-cyan-400 animate-pulse flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 animate-spin" /> Menerjemahkan ke versi {activeLang.toUpperCase()}...
                </span>
              ) : (
                displayedSummary
              )}
            </p>

            {/* Impact Reason */}
            {r.impact_reason && (
              <div className="pt-2 border-t border-slate-800/60 text-[11px] flex items-start gap-1.5 text-slate-300">
                <span className="font-semibold text-slate-400 shrink-0">Dampak:</span>
                <span className="text-slate-200 font-medium leading-tight">{r.impact_reason}</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2"
          >
            <button
              onClick={() => setShowFullArticleModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition font-medium"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Baca Rangkuman Penuh</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                title="Salin Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:text-white transition"
              >
                <span>Berita Asli</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </article>

      {/* Full Modal Reader for this Article */}
      {showFullArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400">{r.domain}</span>
                <h3 className="text-lg font-bold text-white mt-1">{r.title}</h3>
              </div>
              <button
                onClick={() => setShowFullArticleModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-950">
              <img src={imageUrl} alt={r.title} className="w-full h-full object-cover" />
            </div>

            {/* 3-Version Reader Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Pilih Bahasa Ringkasan:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={(e) => handleLanguageSwitch('id', e)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${activeLang === 'id' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                  >
                    🇮🇩 Bahasa Indonesia
                  </button>
                  <button
                    onClick={(e) => handleLanguageSwitch('en', e)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${activeLang === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={(e) => handleLanguageSwitch('zh', e)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${activeLang === 'zh' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                  >
                    🇨🇳 中文 (Mandarin)
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                  {displayedSummary}
                </p>
                {r.impact_reason && (
                  <div className="pt-3 border-t border-slate-900 text-xs">
                    <strong className="text-cyan-400">Analisis Dampak Pasar:</strong> {r.impact_reason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500">Diterbitkan: {r.published_date || 'N/A'}</span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition shadow-lg shadow-cyan-600/20"
              >
                <span>Buka Berita Lengkap di {r.domain}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
