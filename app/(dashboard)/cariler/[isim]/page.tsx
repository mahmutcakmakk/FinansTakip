import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowLeft, FileText, CheckCircle2, Clock, Send, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function CariEkstrePage({ params }: { params: { isim: string } }) {
  const session = await getSession();
  if(!session) return null;

  const decodedName = decodeURIComponent(params.isim);
  
  // 1. Tüm Borç/Alacak kayıtları (Vade, Taksit)
  const debts = db.prepare('SELECT * FROM debts WHERE personName = ? AND profileId = ? ORDER BY createdAt ASC').all(decodedName, session.profileId) as any[];

  // 2. İşlemler (Nakit, Havale - Eğer açıklama içinde geçiyorsa)
  const transactions = db.prepare(`SELECT * FROM transactions WHERE description LIKE ? AND profileId = ? ORDER BY date ASC`).all(`%${decodedName}%`, session.profileId) as any[];

  // Matematik: Kimin kime ne kadar borcu var?
  let totalBizeBorcu = 0;   // Müşterinin bize olan toplam borcu (Bize giren hizmet tutarı)
  let totalBizeOdedigi = 0; // Şahsen bize ödediği toplam nakit/havale tahsilatları

  // Eğer `debts` tablosundaki type='GIVEN' ise biz borç vermişiz demektir (Alacağımız var).
  debts.forEach(d => {
    if (d.type === 'GIVEN') {
       totalBizeBorcu += d.amount;
       totalBizeOdedigi += (d.paidAmount || 0);
       if (d.status === 'PAID') totalBizeOdedigi += (d.amount - (d.paidAmount || 0)); // Eğer tamamen kapandı ise kalanı da ekle
    }
  });

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Header and Info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/cariler" className="p-2.5 bg-[#ffffff0a] hover:bg-[#ffffff14] border border-[#ffffff14] rounded-xl text-[#8e95a5] hover:text-white transition-all hover:scale-105 active:scale-95">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-[var(--color-neon-blue)] w-7 h-7" /> 
              {decodedName}
            </h2>
            <p className="text-[#8e95a5] text-sm mt-1">Bu cari hesaba ait tüm finansal geçmiş dökümü (Ledger).</p>
          </div>
        </div>
      </div>

      {/* Rapor Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-l-4 border-[var(--color-neon-blue)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-blue)] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-sm font-semibold text-[#8e95a5] mb-1">Toplam Alacak (Bize Olan Borcu)</p>
          <h3 className="text-3xl font-bold">{formatMoney(totalBizeBorcu)}</h3>
        </div>
        <div className="glass-card p-6 border-l-4 border-[var(--color-neon-green)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-green)] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-sm font-semibold text-[#8e95a5] mb-1">Bugüne Kadar Tahsil Edilen</p>
          <h3 className="text-3xl font-bold text-[var(--color-neon-green)]">{formatMoney(totalBizeOdedigi)}</h3>
        </div>
        <div className="glass-card p-6 border-l-4 border-[var(--color-neon-red)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-red)] rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
          <p className="text-sm font-semibold text-[#8e95a5] mb-1">Kalan Bakiye (Net Alacak)</p>
          <h3 className="text-3xl font-bold text-[var(--color-neon-red)]">{formatMoney(totalBizeBorcu - totalBizeOdedigi)}</h3>
        </div>
      </div>

      {/* Döküm Çizelgesi */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 border-b border-[#ffffff14] pb-4">
          <Clock className="w-5 h-5 text-[#8e95a5]" /> Zaman Çizelgesi (İşlem Ekstresi)
        </h3>

        <div className="space-y-4">
          {debts.length === 0 && transactions.length === 0 ? (
            <div className="text-center text-[#8e95a5] py-12 border-2 border-dashed border-[#ffffff14] rounded-2xl">
              <span className="text-4xl block mb-2">📭</span>
              Bu kişiye ait hiçbir Kasa veya Borç/Alacak kaydı bulunamadı.
            </div>
          ) : null}

          {/* Borç/Vade Kayıtları Döngüsü */}
          {debts.map((d, i) => (
             <div key={`debt-${i}`} className="p-5 rounded-2xl bg-[#ffffff05] border border-[#ffffff0a] hover:border-[#ffffff14] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
               <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-full shrink-0 ${d.type === 'GIVEN' ? 'bg-[rgba(0,240,255,0.1)] text-[var(--color-neon-blue)]' : 'bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)]'}`}>
                     <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 mb-2 rounded text-[10px] uppercase tracking-wider font-bold ${d.type === 'GIVEN' ? 'bg-[rgba(0,240,255,0.1)] text-[var(--color-neon-blue)]' : 'bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)]'}`}>
                       {d.type === 'GIVEN' ? 'Size Borçlandı (Alacağınız)' : 'Siz Borçlandınız (Ödemeniz)'}
                    </span>
                    <p className="text-white font-semibold text-lg">{d.description || 'Açıklama girilmemiş'}</p>
                    <p className="text-xs text-[#8e95a5] mt-1.5 flex items-center gap-2">
                       <span>Kayıt: {format(new Date(d.createdAt), 'dd MMMM yyyy (HH:mm)', {locale: tr})}</span>
                       <span className="w-1 h-1 rounded-full bg-[#8e95a5]"></span>
                       <span>Vade: {format(new Date(d.dueDate), 'dd.MM.yyyy')}</span>
                    </p>
                  </div>
               </div>
               
               <div className="text-right shrink-0 w-full md:w-auto border-t border-[#ffffff0a] pt-4 md:border-none md:pt-0">
                  <div className="text-2xl border-b border-transparent group-hover:border-[#ffffff20] transition-colors pb-1 font-bold">{formatMoney(d.amount)}</div>
                  <div className="text-sm mt-2">
                    {d.status === 'PAID' ? (
                       <span className="flex items-center gap-1.5 justify-end text-[var(--color-neon-green)] font-semibold"><CheckCircle2 className="w-4 h-4"/> Tamamı Ödendi/Kapandı</span>
                    ) : (d.paidAmount || 0) > 0 ? (
                       <span className="text-yellow-400 font-semibold bg-[rgba(250,204,21,0.1)] px-3 py-1 rounded-full">Kısmi ({formatMoney(d.paidAmount)}) Ödendi</span>
                    ) : (
                       <span className="text-[#8e95a5] font-medium bg-[#ffffff14] px-3 py-1 rounded-full">Tahsilat Bekliyor</span>
                    )}
                  </div>
               </div>
             </div>
          ))}

          {/* Direkt Kasa İşlemleri Döngüsü (Parayı Peşin Aldıysak vs.) */}
          {transactions.map((t, i) => (
             <div key={`trans-${i}`} className="p-5 rounded-2xl bg-[rgba(0,255,136,0.02)] border border-[rgba(0,255,136,0.1)] hover:border-[rgba(0,255,136,0.3)] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex gap-4 items-start">
                  <div className={`p-3 rounded-full shrink-0 ${t.type === 'INCOME' ? 'bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)]' : 'bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)]'}`}>
                     <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`inline-block px-2 py-0.5 mb-2 rounded text-[10px] uppercase tracking-wider font-bold ${t.type === 'INCOME' ? 'bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)]' : 'bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)]'}`}>
                       Direkt Kasa İşlemi ({t.type === 'INCOME' ? 'Gelir/Tahsilat' : 'Gider/Ödeme'})
                    </span>
                    <p className="text-white font-semibold text-lg">{t.description}</p>
                    <p className="text-xs text-[#8e95a5] mt-1.5">
                      İşlem Tarihi: {format(new Date(t.date), 'dd MMMM yyyy', {locale: tr})}
                    </p>
                  </div>
               </div>
               
               <div className="text-right shrink-0 w-full md:w-auto border-t border-[#ffffff0a] pt-4 md:border-none md:pt-0">
                  <div className={`text-2xl font-bold ${t.type === 'INCOME' ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatMoney(t.amount)}
                  </div>
               </div>
             </div>
          ))}

        </div>
      </div>
    </div>
  );
}
