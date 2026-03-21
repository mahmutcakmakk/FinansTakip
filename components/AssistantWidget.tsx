'use client';

import { useState, useEffect } from 'react';
import { BellRing, X, AlertOctagon, Info, CalendarClock, CheckCircle } from 'lucide-react';
import { getNotifications } from '@/app/actions/getNotifications';
import { paySmartSubscription } from '@/app/actions/subscriptionActions';

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Asistan verisi çekilemedi:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
    
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[99] w-16 h-16 rounded-full bg-[var(--color-neon-blue)] text-black flex items-center justify-center shadow-[0_4px_25px_rgba(0,240,255,0.4)] hover:scale-110 transition-transform"
      >
        <BellRing className="w-8 h-8" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-neon-red)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-[var(--color-neon-red)] border-2 border-[#090b14] items-center justify-center text-white text-xs font-bold">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      <div className={`fixed inset-y-0 right-0 z-[100] w-full max-w-sm bg-[#0a0d17] border-l border-[#ffffff14] shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-neon-blue)] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

          <div className="p-6 border-b border-[#ffffff14] flex justify-between items-center relative z-10 bg-[#0a0d17]">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><BellRing className="w-5 h-5 text-[var(--color-neon-blue)]" /> Akıllı Asistan</h2>
              <p className="text-sm text-[#8e95a5]">Gelecek işlemler & Aksiyonlar</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-[#8e95a5] hover:text-white bg-[#ffffff0a] rounded-xl"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-[#8e95a5]">Yükleniyor...</div>
            ) : unreadCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[rgba(0,255,136,0.1)] flex items-center justify-center text-[var(--color-neon-green)] mb-2"><CalendarClock className="w-8 h-8" /></div>
                <p className="text-[#8e95a5] font-medium">Harika! Yakın zamanda vadesi dolacak işleminiz yok.</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border-l-[4px] bg-[#ffffff05] shadow-sm flex gap-4 transition-all hover:-translate-y-1 ${notif.isUrgent ? 'border-[var(--color-neon-red)]' : 'border-[var(--color-neon-purple)]'}`}>
                  <div className="shrink-0 mt-1">
                    {notif.isUrgent ? <AlertOctagon className="w-6 h-6 text-[var(--color-neon-red)]" /> : <Info className="w-6 h-6 text-[var(--color-neon-purple)]" />}
                  </div>
                  <div className="w-full">
                    <h4 className={`font-bold text-sm mb-1 ${notif.isUrgent ? 'text-[var(--color-neon-red)]' : 'text-[var(--color-neon-purple)]'}`}>{notif.title}</h4>
                    <p className="text-sm text-[#8e95a5] leading-relaxed">{notif.message}</p>
                    {notif.actionData && (
                      <form action={async (fd) => {
                         await paySmartSubscription(fd);
                         setNotifications(prev => prev.filter(n => n.id !== notif.id));
                      }} className="mt-3">
                         <input type="hidden" name="id" value={notif.actionData.id} />
                         <input type="hidden" name="amount" value={notif.actionData.amount} />
                         <input type="hidden" name="name" value={notif.actionData.name} />
                         <button type="submit" className="w-full px-3 py-2 bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)] border border-[rgba(0,255,136,0.3)] hover:bg-[var(--color-neon-green)] hover:text-black transition-all rounded-lg font-bold text-xs flex justify-center items-center gap-1.5">
                           <CheckCircle className="w-4 h-4" /> Kasadan Öde ve Kapat
                         </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer (İpucu) */}
          <div className="p-6 border-t border-[#ffffff14] bg-[#ffffff02] relative z-10">
            <p className="text-xs text-[#8e95a5] flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0" />
              Asistan; işlemleri 3 gün öncesinden size hatırlatır ve gecikmeleri minimuma indirmeyi hedefler.
            </p>
          </div>
        </div>
      </div>

      {/* Arka Plan Overlay (Mobil için) */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden"
        ></div>
      )}
    </>
  );
}
