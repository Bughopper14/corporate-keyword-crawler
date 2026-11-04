'use client';

import React from 'react';
import { ScrapedRecord } from './types';
import { MagazineLeadCard } from './MagazineLeadCard';
import { MagazineSideCard } from './MagazineSideCard';
import { CleanMediaCard } from './CleanMediaCard';
import { LayoutGrid, Sparkles } from 'lucide-react';

interface EditorialGalleryProps {
  records: ScrapedRecord[];
  onInspect: (r: ScrapedRecord) => void;
}

export function EditorialGallery({ records, onInspect }: EditorialGalleryProps) {
  if (records.length === 0) return null;

  const leadRecord = records[0];
  const sideRecords = records.slice(1, 3);
  const remainingRecords = records.slice(3);

  return (
    <div className="space-y-8">
      {/* ── Top Editorial Section: Lead Story (Left) + Side Stack (Right) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Lead Story (Takes 7 or 8 columns on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
          <MagazineLeadCard record={leadRecord} onInspect={onInspect} />
        </div>

        {/* Side Editorial Stack (Takes remaining columns) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-6">
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              EDITORIAL CURATION
            </h3>
          </div>
          {sideRecords.map((r) => (
            <MagazineSideCard key={r.id} record={r} onInspect={onInspect} />
          ))}
        </div>
      </section>

      {/* ── Secondary Gallery: Dynamic Rhythmic Grid ── */}
      {remainingRecords.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold tracking-wide text-slate-300 uppercase font-mono">
                Arsip Berita &amp; Sinyal Pasar
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {remainingRecords.length} Artikel Terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {remainingRecords.map((r) => (
              <CleanMediaCard key={r.id} record={r} onInspect={onInspect} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
