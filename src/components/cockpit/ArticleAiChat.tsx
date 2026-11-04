'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { ScrapedRecord } from './types';

interface ArticleAiChatProps {
  record: ScrapedRecord;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ArticleAiChat({ record }: ArticleAiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Halo Willy! Saya asisten intelijen finansial untuk berita ini. Apa yang ingin Anda bedah mengenai dampak aksi korporasi **${record.company_name || record.domain}** ini terhadap pasar modal atau risiko kepatuhan?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/KeywordCrawler/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          articleContext: {
            title: record.title,
            company_name: record.company_name,
            domain: record.domain,
            url: record.url,
            published_date: record.published_date,
            keyword_used: record.keyword_used,
            impact_sentiment: record.impact_sentiment,
            snippet: record.snippet,
            key_claim: record.key_claim,
            full_content: record.full_content
          }
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...updatedMessages, { role: 'assistant', content: 'Gagal mendapatkan analisa AI: ' + (data.error || 'Server error') }]);
      }
    } catch (err: any) {
      setMessages([...updatedMessages, { role: 'assistant', content: 'Koneksi ke 9Router gagal: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-full lg:w-96 flex flex-col h-full bg-[#080d1a] border-t lg:border-t-0 lg:border-l border-white/[0.08] shrink-0">
      {/* Top Chat Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-[#090d16] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              Intel AI Desk
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">my-stack local inference</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-400 border border-white/[0.08]">
          Interactive
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-[#070a12]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-cyan-950 border border-cyan-500/30 text-cyan-400'
            }`}>
              {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>
            <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed break-words [overflow-wrap:anywhere] ${
              m.role === 'user'
                ? 'bg-blue-600/30 border border-blue-500/40 text-blue-100 rounded-tr-none'
                : 'bg-slate-900/80 border border-white/[0.07] text-slate-200 rounded-tl-none font-sans'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 p-2.5 rounded-xl w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Menganalisa data pasar...</span>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-white/[0.06] bg-[#090d16]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Diskusikan dampak finansial atau regulasi..."
            disabled={loading}
            className="w-full bg-[#0d121f] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
