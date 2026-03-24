import db from '@/lib/db';
import { CalendarDays, Plus, Trash2, Repeat } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

async function addSubscription(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const name = formData.get('name') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const dueDay = parseInt(formData.get('dueDay') as string);

  if (name && amount && dueDay) {
    await db.prepare(`INSERT INTO subscriptions (name, amount, dayOfMonth, profileId) VALUES (?, ?, ?, ?)`).run(name, amount, dueDay, session.profileId);
    revalidatePath('/abonelikler');
  }
}

async function deleteSubscription(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  await db.prepare(`DELETE FROM subscriptions WHERE id = ? AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/abonelikler');
}

export default async function AboneliklerPage() {
  const session = await getSession();
  if (!session) return null;

  const subscriptions = await db.prepare(`SELECT * FROM subscriptions WHERE profileId = ? ORDER BY dueDay ASC`).all(session.profileId) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  const totalMonthly = subscriptions.reduce((acc, sub) => acc + sub.amount, 0);

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <CalendarDays className="text-[var(--color-neon-blue)] w-8 h-8" /> 
          Sabit Giderler (Abonelik)
        </h2>
        <div className="bg-[rgba(255,51,102,0.1)] border border-[rgba(255,51,102,0.3)] px-4 py-2 rounded-xl text-[var(--color-neon-red)] font-bold">
          Aylık Toplam: {formatMoney(totalMonthly)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="glass-card p-6 lg:col-span-1 h-fit lg:sticky lg:top-6">
          <h5 className="font-bold text-lg mb-6">Yeni Sabit Gider Ekle</h5>
          <form action={addSubscription} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Gider/Abonelik Adı</label>
              <input type="text" name="name" required className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Netflix, İnternet, Kira" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Aylık Tutar (₺)</label>
              <input type="number" step="0.01" name="amount" required className="glass-input w-full p-3 rounded-xl font-bold text-lg text-[var(--color-neon-red)]" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Her Ayın Kaçıncı Günü?</label>
              <input type="number" name="dueDay" min="1" max="31" required className="glass-input w-full p-3 rounded-xl" placeholder="1-31 arası bir gün" />
            </div>
            
            <button type="submit" className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-[rgba(0,240,255,0.1)] text-[var(--color-neon-blue)] border border-[rgba(0,240,255,0.3)] hover:bg-[var(--color-neon-blue)] hover:text-white transition-all shadow-[0_4px_15px_rgba(0,240,255,0.2)] hover:shadow-[0_8px_25px_rgba(0,240,255,0.4)]">
              <Plus className="w-5 h-5" /> Kaydet
            </button>
          </form>
        </div>

        {/* Abonelik Listesi */}
        <div className="glass-card p-6 lg:col-span-2">
          <h5 className="font-bold text-lg mb-6">Mevcut Sabit Ödemeler</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.length === 0 ? (
              <div className="col-span-full text-center py-6 text-[#8e95a5]">Sisteme kayıtlı sabit gider bulunmuyor.</div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="p-5 rounded-2xl bg-[#ffffff05] border border-[#ffffff14] flex flex-col gap-4 relative overflow-hidden group hover:bg-[#ffffff0a] transition-colors">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(255,51,102,0.1)] border border-[rgba(255,51,102,0.2)] flex items-center justify-center">
                        <Repeat className="w-5 h-5 text-[var(--color-neon-red)]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white">{sub.name}</h4>
                        <p className="text-xs text-[#8e95a5]">Her ayın <span className="text-[var(--color-neon-blue)] font-bold">{sub.dueDay}.</span> günü</p>
                      </div>
                    </div>
                    <form action={deleteSubscription}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button type="submit" className="p-2 text-[#8e95a5] hover:text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)] rounded-lg transition-colors" title="Sil">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold tracking-tight text-[var(--color-neon-red)]">-{formatMoney(sub.amount)}</h3>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
