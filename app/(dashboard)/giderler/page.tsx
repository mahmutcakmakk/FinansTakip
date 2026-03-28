import db from '@/lib/db';
import { format } from 'date-fns';
import { TrendingDown, Minus, Trash2, Edit2, Check, X } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

async function addExpense(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const amount = parseFloat(formData.get('amount') as string);
  const categoryId = parseInt(formData.get('categoryId') as string);
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;

  if (amount && categoryId && date) {
    await db.prepare(`INSERT INTO transactions (type, amount, categoryId, description, date, profileId) VALUES ('EXPENSE', ?, ?, ?, ?, ?)`).run(amount, categoryId, description, date, session.profileId);
    revalidatePath('/giderler');
    revalidatePath('/giderler');
    revalidatePath('/');
  }
}

async function updateExpense(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  const amount = parseFloat(formData.get('amount') as string);
  const categoryId = parseInt(formData.get('categoryId') as string);
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;

  if (id && amount && categoryId && date) {
    await db.prepare(`UPDATE transactions SET amount = ?, categoryId = ?, date = ?, description = ? WHERE id = ? AND profileId = ? AND type = 'EXPENSE'`)
      .run(amount, categoryId, date, description, id, session.profileId);
    revalidatePath('/giderler');
    revalidatePath('/');
    redirect('/giderler');
  }
}

async function deleteExpense(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  await db.prepare(`DELETE FROM transactions WHERE id = ? AND type = 'EXPENSE' AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/giderler');
  revalidatePath('/');
}

export default async function GiderlerPage({ searchParams }: { searchParams: any }) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;
  const currentMonth = format(new Date(), 'yyyy-MM');
  const monthFilter = params?.month || currentMonth;
  const categoryFilter = params?.categoryId || 'all';
  const editId = params?.edit;

  const categories = await db.prepare(`SELECT * FROM categories WHERE type = 'EXPENSE' AND (profileId = ? OR profileId IS NULL) ORDER BY name ASC`).all(session.profileId) as any[];
  
  let query = `
    SELECT t.*, c.name as categoryName 
    FROM transactions t 
    LEFT JOIN categories c ON t.categoryId = c.id 
    WHERE t.type = 'EXPENSE' AND t.profileId = ?
  `;
  const queryParams: any[] = [session.profileId];
  
  if (monthFilter !== 'all') {
    query += ` AND t.date LIKE ? `;
    queryParams.push(`${monthFilter}%`);
  }
  
  if (categoryFilter !== 'all') {
    query += ` AND t.categoryId = ? `;
    queryParams.push(categoryFilter);
  }
  
  query += ` ORDER BY t.date DESC, t.id DESC`;
  
  const expenses = await db.prepare(query).all(...queryParams) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <TrendingDown className="text-[var(--color-neon-red)] w-8 h-8" /> 
        Kasa Çıkışları (Gider)
      </h2>

      {/* Filtreleme Barı */}
      <div className="glass-card p-4">
        <form method="GET" className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full sm:w-1/3">
            <label className="block text-sm text-[#8e95a5] mb-1">Aya Göre Filtrele</label>
            <input type="month" name="month" defaultValue={monthFilter === 'all' ? '' : monthFilter} className="glass-input w-full p-2.5 rounded-xl" />
          </div>
          <div className="flex-1 w-full sm:w-1/3">
            <label className="block text-sm text-[#8e95a5] mb-1">Kategoriye Göre</label>
            <select name="categoryId" defaultValue={categoryFilter} className="glass-input w-full p-2.5 rounded-xl appearance-none">
              <option value="all">Tüm Kategoriler</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-[#ffffff14] hover:bg-[#ffffff20] transition-colors">Filtrele</button>
            <a href="/giderler?month=all&categoryId=all" className="px-6 py-2.5 rounded-xl font-bold text-[#8e95a5] hover:text-white border border-[#ffffff14] transition-colors text-center w-full sm:w-auto">Sıfırla</a>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gider Ekleme Formu */}
        <div className="glass-card p-6 lg:col-span-1 h-fit lg:sticky lg:top-6">
          <h5 className="font-bold text-lg mb-6">Yeni Gider Ekle</h5>
          <form action={addExpense} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Tutar (₺)</label>
              <input type="number" step="0.01" name="amount" required className="glass-input w-full p-3 rounded-xl font-bold text-[var(--color-neon-red)] text-xl" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Kategori</label>
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
              <textarea name="description" rows={2} className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Yemek molası vb."></textarea>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)] border border-[rgba(255,51,102,0.3)] hover:bg-[var(--color-neon-red)] hover:text-white transition-all shadow-[0_4px_15px_rgba(255,51,102,0.2)] hover:shadow-[0_8px_25px_rgba(255,51,102,0.4)]">
              <Minus className="w-5 h-5" /> Gider Kaydet
            </button>
          </form>
        </div>

        {/* Gider Listesi */}
        <div className="glass-card p-6 lg:col-span-2">
          <h5 className="font-bold text-lg mb-6">Geçmiş Giderler</h5>
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
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-[#8e95a5]">Henüz gider kaydı yok.</td></tr>
                ) : (
                  expenses.map((exp) => (
                    editId === exp.id.toString() ? (
                      <tr key={exp.id} className="border-b border-[#ffffff14] bg-[rgba(0,240,255,0.05)]">
                        <td colSpan={5} className="p-3">
                          <form action={updateExpense} className="flex flex-col xl:flex-row gap-3 items-center w-full">
                            <input type="hidden" name="id" value={exp.id} />
                            <input type="date" name="date" required defaultValue={exp.date.split('T')[0]} className="glass-input p-2 rounded-lg w-full xl:w-auto text-sm" />
                            <select name="categoryId" required defaultValue={exp.categoryId} className="glass-input p-2 rounded-lg w-full xl:w-48 text-sm">
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="text" name="description" defaultValue={exp.description || ''} className="glass-input p-2 rounded-lg w-full xl:flex-1 text-sm" placeholder="Kısa Açıklama" />
                            <input type="number" step="0.01" name="amount" required defaultValue={exp.amount} className="glass-input p-2 rounded-lg w-full xl:w-32 font-bold text-[var(--color-neon-red)]" />
                            <div className="flex gap-2 w-full xl:w-auto justify-end">
                              <button type="submit" className="p-2 bg-[var(--color-neon-blue)] text-black rounded-lg hover:scale-105 transition-all"><Check className="w-5 h-5"/></button>
                              <a href={`/giderler?month=${monthFilter}`} className="p-2 bg-[#ffffff14] text-white rounded-lg hover:scale-105 transition-all"><X className="w-5 h-5"/></a>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={exp.id} className="border-b border-[#ffffff0a] hover:bg-[#ffffff05] transition-colors">
                        <td className="py-4 px-4">{format(new Date(exp.date), 'dd.MM.yyyy')}</td>
                        <td className="py-4 px-4"><span className="px-3 py-1 bg-black/40 border border-[#ffffff14] rounded-lg text-sm">{exp.categoryName}</span></td>
                        <td className="py-4 px-4 text-[#8e95a5]">{exp.description || '-'}</td>
                        <td className="py-4 px-4 text-right font-bold text-[var(--color-neon-red)]">-{formatMoney(exp.amount)}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a href={`/giderler?month=${monthFilter}&edit=${exp.id}`} className="p-2 text-[#8e95a5] hover:text-[var(--color-neon-blue)] hover:bg-[rgba(0,240,255,0.1)] rounded-lg transition-colors" title="Düzenle">
                              <Edit2 className="w-4 h-4" />
                            </a>
                            <form action={deleteExpense}>
                              <input type="hidden" name="id" value={exp.id} />
                              <button type="submit" className="p-2 text-[#8e95a5] hover:text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)] rounded-lg transition-colors" title="Sil">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )
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
