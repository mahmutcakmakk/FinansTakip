import db from '@/lib/db';
import { Settings, Plus, Trash2, Target, Sparkles, Key } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';

async function saveGeminiKey(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;
  const apikey = formData.get('apikey') as string;
  await db.prepare(`UPDATE profiles SET geminiApiKey = ?`).run(apikey);
  revalidatePath('/ayarlar');
}

async function addCategory(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;

  if (name && type) {
    await db.prepare(`INSERT INTO categories (name, type, profileId) VALUES (?, ?, ?)`).run(name, type, session.profileId);
    revalidatePath('/ayarlar');
  }
}

async function deleteCategory(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  try {
    await db.prepare(`UPDATE transactions SET categoryId = NULL WHERE categoryId = ? AND profileId = ?`).run(id, session.profileId);
    await db.prepare(`DELETE FROM budgets WHERE categoryId = ? AND profileId = ?`).run(id, session.profileId);
    await db.prepare(`DELETE FROM categories WHERE id = ? AND profileId = ?`).run(id, session.profileId);
    revalidatePath('/ayarlar');
  } catch (error) {
    console.error(error);
  }
}

async function setBudget(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const categoryId = parseInt(formData.get('categoryId') as string);
  const amountLimit = parseFloat(formData.get('amountLimit') as string);
  const month = formData.get('month') as string; // '2026-03' formatında gelecek

  if (categoryId && amountLimit > 0 && month) {
    // Aynı ay ve kategoriye ait kayıt var mı kontrol et
    const existing = await db.prepare(`SELECT id FROM budgets WHERE profileId = ? AND categoryId = ? AND month = ?`).get(session.profileId, categoryId, month) as any;
    
    if (existing) {
      await db.prepare(`UPDATE budgets SET amountLimit = ? WHERE id = ?`).run(amountLimit, existing.id);
    } else {
      await db.prepare(`INSERT INTO budgets (profileId, categoryId, amountLimit, month) VALUES (?, ?, ?, ?)`).run(session.profileId, categoryId, amountLimit, month);
    }
    revalidatePath('/ayarlar');
    revalidatePath('/'); // Ana ekrandaki grafik güncellensin
  }
}

async function deleteBudget(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;
  const id = formData.get('id');
  await db.prepare(`DELETE FROM budgets WHERE id = ? AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/ayarlar');
  revalidatePath('/');
}


export default async function AyarlarPage() {
  const session = await getSession();
  if (!session) return null;

  const currentMonth = format(new Date(), 'yyyy-MM');
  const profile = await db.prepare(`SELECT * FROM profiles WHERE id = ?`).get(session.profileId) as any;

  const categories = await db.prepare(`SELECT * FROM categories WHERE profileId = ? ORDER BY type ASC, id DESC`).all(session.profileId) as any[];
  
  const incomeCats = categories.filter(c => c.type === 'INCOME');
  const expenseCats = categories.filter(c => c.type === 'EXPENSE');

  // Giderlerin bu ayki bütçelerini listelemek
  const budgets = await db.prepare(`
    SELECT b.*, c.name as categoryName 
    FROM budgets b
    JOIN categories c ON b.categoryId = c.id
    WHERE b.profileId = ? AND b.month = ?
    ORDER BY b.id DESC
  `).all(session.profileId, currentMonth) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const commonCategories = [
    { name: 'Ticari Satış', type: 'INCOME' },
    { name: 'Hizmet / Danışmanlık', type: 'INCOME' },
    { name: 'Kira / Ofis Gideri', type: 'EXPENSE' },
    { name: 'Yemek Gideri', type: 'EXPENSE' },
    { name: 'Kahve & Mola', type: 'EXPENSE' },
    { name: 'Market Alışverişi', type: 'EXPENSE' },
    { name: 'Elektrik Faturası', type: 'EXPENSE' },
    { name: 'Su Faturası', type: 'EXPENSE' },
    { name: 'İnternet Faturası', type: 'EXPENSE' },
    { name: 'İş & Ofis Masrafı', type: 'EXPENSE' },
    { name: 'Hediye / Oyuncak', type: 'EXPENSE' },
    { name: 'Yakıt & Ulaşım', type: 'EXPENSE' },
    { name: 'Personel Maaşı', type: 'EXPENSE' },
    { name: 'Reklam / Tasarım', type: 'EXPENSE' },
    { name: 'Vergi Ödemeleri', type: 'EXPENSE' }
  ];

  const availableTemplates = commonCategories.filter(c => !categories.some(existing => existing.name === c.name && existing.type === c.type));

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Settings className="text-[var(--color-neon-blue)] w-8 h-8" /> 
        Sistem Ayarları & Hedefler
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Formlar */}
        <div className="space-y-6 xl:col-span-1 h-fit xl:sticky xl:top-6">
          
          <div className="glass-card p-6 border-t-4 border-[var(--color-neon-blue)]">
            <h5 className="font-bold text-lg mb-6">Yeni Kategori Ekle</h5>
            <form action={addCategory} className="space-y-4">
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">Kategori Tipi</label>
                <select name="type" required className="glass-input w-full p-3 rounded-xl appearance-none">
                  <option value="INCOME">Gelir Kategorisi</option>
                  <option value="EXPENSE">Gider Kategorisi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">Kategori Adı</label>
                <input type="text" name="name" required className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Ofis Kirası" />
              </div>
              <button type="submit" className="btn-neon-blue w-full p-3 rounded-xl font-bold flex justify-center items-center gap-2">
                <Plus className="w-5 h-5" /> Kategori Kaydet
              </button>
            </form>
          </div>

          <div className="glass-card p-6 border-t-4 border-yellow-500">
            <h5 className="font-bold text-lg mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> Hızlı Şablonlar</h5>
            <p className="text-xs text-[#8e95a5] mb-4">Sık kullanılan esnaf kalemlerini tek tıkla sisteminize aktarın.</p>
            <div className="flex flex-wrap gap-2">
               {availableTemplates.length === 0 ? (
                  <span className="text-xs text-[var(--color-neon-green)] font-bold">Popüler tüm şablonları edindiniz! 🚀</span>
               ) : (
                  availableTemplates.map((c, idx) => (
                    <form action={addCategory} key={idx}>
                      <input type="hidden" name="name" value={c.name} />
                      <input type="hidden" name="type" value={c.type} />
                      <button type="submit" className={`text-xs px-3 py-1.5 rounded-full border transition-all ${c.type === 'INCOME' ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)] hover:bg-[rgba(0,255,136,0.1)]' : 'border-[var(--color-neon-red)] text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)]'}`}>
                        + {c.name}
                      </button>
                    </form>
                  ))
               )}
            </div>
          </div>

          <div className="glass-card p-6 border-t-4 border-purple-500">
            <h5 className="font-bold text-lg mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-purple-500"/> Aylık Gider Bütçesi (Limit)</h5>
            <form action={setBudget} className="space-y-4">
              <input type="hidden" name="month" value={currentMonth} />
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">Sınırlandırılacak Kategori</label>
                <select name="categoryId" required className="glass-input w-full p-3 rounded-xl appearance-none font-bold text-purple-400">
                  <option value="">Seçiniz</option>
                  {expenseCats.length === 0 && <option disabled>Önce gider kategorisi ekleyin</option>}
                  {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">Maksimum Aylık Bütçe (₺)</label>
                <input type="number" step="0.01" name="amountLimit" required min="1" className="glass-input w-full p-3 rounded-xl font-bold text-lg text-purple-400" placeholder="Örn: 10000" />
              </div>
              <button type="submit" className="w-full p-3 rounded-xl font-bold flex justify-center items-center gap-2 text-purple-400 bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.3)] hover:bg-purple-500 hover:text-white transition-colors shadow-[0_4px_15px_rgba(168,85,247,0.2)]">
                Bütçe Kuralı Ekle
              </button>
            </form>
          </div>

          <div className="glass-card p-6 border-t-4 border-[#0ea5e9]">
            <h5 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#0ea5e9]"><Sparkles className="w-5 h-5"/> Yapay Zeka Asistanı (Gemini)</h5>
            <p className="text-sm text-[#8e95a5] mb-4">Metinden otomatik gelir/gider eklemek için Google AI Studio anahtarınızı (API Key) buraya girin.</p>
            <form action={saveGeminiKey} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-3 top-3.5 w-5 h-5 text-[#8e95a5]" />
                <input 
                  type="password" 
                  name="apikey" 
                  defaultValue={profile?.geminiApiKey || profile?.geminiapikey || ''}
                  className="glass-input w-full p-3 pl-10 rounded-xl" 
                  placeholder="AIzaSyB..." 
                />
              </div>
              <button type="submit" className="w-full p-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-[#0ea5e9] text-white hover:bg-[#0284c7] transition-colors shadow-[0_4px_15px_rgba(14,165,233,0.3)]">
                Kaydet & Aktifleştir
              </button>
            </form>
          </div>

        </div>

        {/* Sağ Kolon: Listeler */}
        <div className="space-y-6 xl:col-span-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-card p-6 border-t-4 border-[var(--color-neon-green)]">
              <h5 className="font-bold text-lg mb-4">Gelir Kategorileri</h5>
              <div className="space-y-3">
                {incomeCats.length === 0 && <p className="text-[#8e95a5]">Kategori yok.</p>}
                {incomeCats.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl bg-[#ffffff05] border border-[rgba(0,255,136,0.2)]">
                    <span>{cat.name}</span>
                    <form action={deleteCategory}><input type="hidden" name="id" value={cat.id} />
                      <button type="submit" className="text-[#8e95a5] hover:text-[var(--color-neon-red)] transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </form>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 border-t-4 border-[var(--color-neon-red)]">
              <h5 className="font-bold text-lg mb-4">Gider Kategorileri</h5>
              <div className="space-y-3">
                {expenseCats.length === 0 && <p className="text-[#8e95a5]">Kategori yok.</p>}
                {expenseCats.map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl bg-[#ffffff05] border border-[rgba(255,51,102,0.2)]">
                    <span>{cat.name}</span>
                    <form action={deleteCategory}><input type="hidden" name="id" value={cat.id} />
                      <button type="submit" className="text-[#8e95a5] hover:text-[var(--color-neon-red)] transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bütçe Listesi */}
          <div className="glass-card p-6 border-t-4 border-purple-500">
            <h5 className="font-bold text-lg mb-4">Bu Ayki ({currentMonth}) Bütçe Kurallarınız</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {budgets.length === 0 ? (
                <div className="col-span-full py-4 text-[#8e95a5]">Aktif bir harcama limiti kuralı bulunmamaktadır.</div>
              ) : (
                budgets.map(b => (
                  <div key={b.id} className="p-4 rounded-xl bg-[rgba(168,85,247,0.05)] border border-[rgba(168,85,247,0.2)] flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-purple-400">{b.categoryName}</h4>
                      <p className="text-sm text-gray-400">Limit: {formatMoney(b.amountLimit)}</p>
                    </div>
                    <form action={deleteBudget}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className="p-2 text-[#8e95a5] hover:text-[var(--color-neon-red)] rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5"/>
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
