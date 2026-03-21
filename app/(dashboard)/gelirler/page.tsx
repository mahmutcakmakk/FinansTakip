import db from '@/lib/db';
import { format } from 'date-fns';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

async function addIncome(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const amount = parseFloat(formData.get('amount') as string);
  const categoryId = parseInt(formData.get('categoryId') as string);
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;

  if (amount && categoryId && date) {
    db.prepare(`INSERT INTO transactions (type, amount, categoryId, description, date, profileId) VALUES ('INCOME', ?, ?, ?, ?, ?)`).run(amount, categoryId, description, date, session.profileId);
    revalidatePath('/gelirler');
    revalidatePath('/');
  }
}

async function deleteIncome(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  db.prepare(`DELETE FROM transactions WHERE id = ? AND type = 'INCOME' AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/gelirler');
  revalidatePath('/');
}

export default async function GelirlerPage({ searchParams }: { searchParams: any }) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams; // Next.js 15+ compatibility
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthFilter = params?.month || currentMonth;
  
  const categories = db.prepare(`SELECT * FROM categories WHERE type = 'INCOME' AND profileId = ?`).all(session.profileId) as any[];
  
  let query = `
    SELECT t.*, c.name as categoryName 
    FROM transactions t 
    LEFT JOIN categories c ON t.categoryId = c.id 
    WHERE t.type = 'INCOME' AND t.profileId = ?
  `;
  const queryParams: any[] = [session.profileId];
  
  if (monthFilter !== 'all') {
    query += ` AND t.date LIKE ? `;
    queryParams.push(`${monthFilter}%`);
  }
  
  query += ` ORDER BY t.date DESC, t.id DESC`;
  
  const incomes = db.prepare(query).all(...queryParams) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <TrendingUp className="text-[var(--color-neon-green)] w-8 h-8" /> 
        Kasa Girişleri (Gelir)
      </h2>

      {/* Filtreleme Barı */}
      <div className="glass-card p-4">
        <form method="GET" className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-[#8e95a5] mb-1">Aya Göre Filtrele</label>
            <input type="month" name="month" defaultValue={monthFilter === 'all' ? '' : monthFilter} className="glass-input w-full p-2.5 rounded-xl" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#ffffff14] hover:bg-[#ffffff20] transition-colors">Tarihte Ara</button>
            <a href="/gelirler?month=all" className="px-6 py-2.5 rounded-xl font-bold text-[#8e95a5] hover:text-white border border-[#ffffff14] transition-colors text-center w-full sm:w-auto">Tüm Zamanlar</a>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gelir Ekleme Formu */}
        <div className="glass-card p-6 lg:col-span-1 h-fit lg:sticky lg:top-6">
          <h5 className="font-bold text-lg mb-6">Yeni Gelir Ekle</h5>
          <form action={addIncome} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Tutar (₺)</label>
              <input type="number" step="0.01" name="amount" required className="glass-input w-full p-3 rounded-xl font-bold text-[var(--color-neon-green)] text-xl" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Kategori / Kaynak</label>
              <select name="categoryId" required className="glass-input w-full p-3 rounded-xl appearance-none">
                <option value="">Seçiniz...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Tarih</label>
              <input type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="glass-input w-full p-3 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Açıklama (İsteğe Bağlı)</label>
              <textarea name="description" rows={2} className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Hafta Sonu Satışı"></textarea>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)] border border-[rgba(0,255,136,0.3)] hover:bg-[var(--color-neon-green)] hover:text-black transition-all shadow-[0_4px_15px_rgba(0,255,136,0.2)] hover:shadow-[0_8px_25px_rgba(0,255,136,0.4)]">
              <Plus className="w-5 h-5" /> Gelir Kaydet
            </button>
          </form>
        </div>

        {/* Gelir Listesi */}
        <div className="glass-card p-6 lg:col-span-2">
          <h5 className="font-bold text-lg mb-6">Geçmiş Gelirler</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[#ffffff14] text-[#8e95a5]">
                  <th className="py-3 px-4 font-medium">Tarih</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium">Açıklama</th>
                  <th className="py-3 px-4 font-medium text-right">Tutar</th>
                  <th className="py-3 px-4 font-medium text-center">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-[#8e95a5]">Henüz gelir kaydı yok.</td></tr>
                ) : (
                  incomes.map((inc) => (
                    <tr key={inc.id} className="border-b border-[#ffffff0a] hover:bg-[#ffffff05] transition-colors">
                      <td className="py-4 px-4">{format(new Date(inc.date), 'dd.MM.yyyy')}</td>
                      <td className="py-4 px-4"><span className="px-3 py-1 bg-black/40 border border-[#ffffff14] rounded-lg text-sm">{inc.categoryName}</span></td>
                      <td className="py-4 px-4 text-[#8e95a5]">{inc.description || '-'}</td>
                      <td className="py-4 px-4 text-right font-bold text-[var(--color-neon-green)]">+{formatMoney(inc.amount)}</td>
                      <td className="py-4 px-4 text-center">
                        <form action={deleteIncome}>
                          <input type="hidden" name="id" value={inc.id} />
                          <button type="submit" className="p-2 text-[#8e95a5] hover:text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)] rounded-lg transition-colors" title="Sil">
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
