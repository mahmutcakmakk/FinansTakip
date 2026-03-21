'use client';

import { useState } from 'react';
import { Sparkles, Send, Coins } from 'lucide-react';
import { processAiEntry } from '@/app/actions/aiEntry';

export default function AiWidget({ usedCount = 0 }: { usedCount?: number }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const MAX_LIMIT = 1500;
  const remaining = Math.max(0, MAX_LIMIT - usedCount);
  const percentage = Math.min(100, Math.round((usedCount / MAX_LIMIT) * 100));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await processAiEntry(formData);
    
    if (result && result.error) {
       setMessage({ text: result.error, type: 'error' });
    } else if (result && result.success) {
       setMessage({ text: `Gemini ${result.count} farklı işlemi çözümledi ve veritabanına kaydetti! 🎉 (Sayfayı yenileyerek kotayı görebilirsiniz)`, type: 'success' });
       (e.target as HTMLFormElement).reset();
    }
    
    setLoading(false);
  }

  return (
    <div className="glass-card p-6 border-2 border-[#0ea5e9] bg-gradient-to-r from-[rgba(14,165,233,0.05)] to-transparent relative overflow-hidden group">
      <div className="absolute -top-4 -right-4 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
        <Sparkles className="w-40 h-40 text-[#0ea5e9]" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <div>
            <h5 className="font-bold text-xl mb-1 flex items-center gap-2 text-[#0ea5e9]">
              <Sparkles className="w-6 h-6" /> Akıllı Veri İşleyici (Mini AI)
            </h5>
            <p className="text-[#8e95a5] text-sm hidden md:block">
              Sadece yazın. <b>Gemini 2.5 Flash</b> ağı anlayıp veritabanına işlesin.
            </p>
          </div>

          {/* Gemini Kota Miktarı Göstergesi */}
          <div className="bg-[#0a0d17] border border-[#0ea5e9]/30 rounded-xl p-3 w-full md:w-auto md:min-w-[220px] flex flex-col gap-2 shadow-inner mt-2 md:mt-0">
             <div className="flex justify-between items-center text-xs gap-4">
               <span className="text-[#0ea5e9] font-bold whitespace-nowrap">Günlük Kredi</span>
               <span className="text-white font-bold whitespace-nowrap">{remaining} <span className="text-[#8e95a5]">/ 1500</span></span>
             </div>
             <div className="w-full bg-[#ffffff14] rounded-full h-1.5 overflow-hidden">
               <div className="bg-[#0ea5e9] h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(14,165,233,0.5)]" style={{ width: `${percentage}%` }}></div>
             </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <input 
            type="text" 
            name="prompt"
            required
            disabled={loading}
            placeholder="Örn: Trendyol'dan bugün 5000 lira geldi..." 
            className="w-full bg-[#0a0d17] border border-[#0ea5e9]/30 p-4 pr-16 rounded-2xl text-white outline-none focus:border-[#0ea5e9] transition-all shadow-inner placeholder:text-[#8e95a5]/50"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-[#0ea5e9] hover:bg-[#0284c7] text-white p-3 rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        {message && (
          <div className={`mt-3 p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)] border border-[rgba(255,51,102,0.3)]' : 'bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)] border border-[rgba(0,255,136,0.3)]'}`}>
            {message.type === 'success' && <Coins className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
