import db from '@/lib/db';
import { Wallet, Plus, Trash2, Landmark, CreditCard, Coins, ArrowRightLeft } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';

async function addWallet(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const initialBalance = parseFloat(formData.get('initialBalance') as string) || 0;

  if (name && type) {
    db.prepare(`INSERT INTO wallets (name, type, balance, profileId) VALUES (?, ?, ?, ?)`).run(name, type, initialBalance, session.profileId);
    revalidatePath('/cuzdanlar');
  }
}

async function deleteWallet(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  db.prepare(`UPDATE transactions SET walletId = NULL WHERE walletId = ? AND profileId = ?`).run(id, session.profileId);
  db.prepare(`UPDATE transfers SET fromWalletId = 0 WHERE fromWalletId = ? AND profileId = ?`).run(id, session.profileId);
  db.prepare(`UPDATE transfers SET toWalletId = 0 WHERE toWalletId = ? AND profileId = ?`).run(id, session.profileId);
  db.prepare(`DELETE FROM wallets WHERE id = ? AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/cuzdanlar');
}

async function transferMoney(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const fromWalletId = parseInt(formData.get('fromWalletId') as string);
  const toWalletId = parseInt(formData.get('toWalletId') as string);
  const amount = parseFloat(formData.get('amount') as string);
  const date = formData.get('date') as string;
  const description = formData.get('description') as string;

  if (fromWalletId && toWalletId && amount > 0 && fromWalletId !== toWalletId) {
    db.prepare(`UPDATE wallets SET balance = balance - ? WHERE id = ? AND profileId = ?`).run(amount, fromWalletId, session.profileId);
    db.prepare(`UPDATE wallets SET balance = balance + ? WHERE id = ? AND profileId = ?`).run(amount, toWalletId, session.profileId);
    
    db.prepare(`INSERT INTO transfers (profileId, fromWalletId, toWalletId, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)`).run(session.profileId, fromWalletId, toWalletId, amount, date, description);
    
    revalidatePath('/cuzdanlar');
    revalidatePath('/'); // Dashboard'a da yansıyabilir
  }
}

export default async function CuzdanlarPage() {
  const session = await getSession();
  if (!session) return null;

  const wallets = db.prepare(`SELECT * FROM wallets WHERE profileId = ? ORDER BY id DESC`).all(session.profileId) as any[];
  
  const transfers = db.prepare(`
    SELECT t.*, 
           w1.name as fromName, 
           w2.name as toName 
    FROM transfers t 
    LEFT JOIN wallets w1 ON t.fromWalletId = w1.id 
    LEFT JOIN wallets w2 ON t.toWalletId = w2.id 
    WHERE t.profileId = ? 
    ORDER BY t.date DESC, t.id DESC
  `).all(session.profileId) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  const getIcon = (type: string) => {
    if (type === 'BANK') return <Landmark className="w-8 h-8 text-[var(--color-neon-blue)]" />;
    if (type === 'POS') return <CreditCard className="w-8 h-8 text-[var(--color-neon-purple)]" />;
    return <Coins className="w-8 h-8 text-[var(--color-neon-green)]" />;
  };

  const getTypeName = (type: string) => {
    if (type === 'BANK') return 'Banka Hesabı';
    if (type === 'POS') return 'POS / Sanal Pos';
    return 'Nakit Kasa';
  };

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Wallet className="text-[var(--color-neon-blue)] w-8 h-8" /> 
        Cüzdan ve Transfer Yönetimi
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon: Formlar */}
        <div className="space-y-6 lg:col-span-1 h-fit lg:sticky lg:top-6">
          
          {/* Yeni Kasa Ekle */}
          <div className="glass-card p-6">
            <h5 className="font-bold text-lg mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-[var(--color-neon-blue)]" /> Yeni Kasa Ekle</h5>
            <form action={addWallet} className="space-y-4">
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">Cüzdan Tipi</label>
                <select name="type" required className="glass-input w-full p-3 rounded-xl appearance-none font-bold">
                  <option value="CASH">Nakit Kasa</option>
                  <option value="BANK">Banka Hesabı</option>
                  <option value="POS">POS Cüzdanı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">Banka / Kasa Adı</label>
                <input type="text" name="name" required className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Ziraat, Çekmece" />
              </div>
              <div>
                <label className="block text-sm text-[#8e95a5] mb-1">İlkel Bakiye (₺)</label>
                <input type="number" step="0.01" name="initialBalance" defaultValue={0} className="glass-input w-full p-3 rounded-xl" placeholder="0.00" />
              </div>
              <button type="submit" className="btn-neon-blue w-full p-3 rounded-xl font-bold flex justify-center items-center gap-2">
                 Oluştur
              </button>
            </form>
          </div>

          {/* Para Transferi Yap */}
          {wallets.length >= 2 && (
            <div className="glass-card p-6 border-t-4 border-yellow-400">
              <h5 className="font-bold text-lg mb-6 flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-yellow-400" /> Kasa Arası Transfer</h5>
              <form action={transferMoney} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8e95a5] mb-1">Gönderen Kasa (Çıkış)</label>
                  <select name="fromWalletId" required className="glass-input w-full p-3 rounded-xl appearance-none font-bold">
                    <option value="">Seçiniz</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatMoney(w.balance)})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8e95a5] mb-1">Alıcı Kasa (Giriş)</label>
                  <select name="toWalletId" required className="glass-input w-full p-3 rounded-xl appearance-none font-bold text-[var(--color-neon-blue)]">
                    <option value="">Seçiniz</option>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8e95a5] mb-1">Tutar (₺)</label>
                  <input type="number" step="0.01" name="amount" required min="0.01" className="glass-input w-full p-3 rounded-xl font-bold text-lg text-yellow-400" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-[#8e95a5] mb-1">Tarih</label>
                  <input type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="glass-input w-full p-3 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm text-[#8e95a5] mb-1">Açıklama</label>
                  <input type="text" name="description" className="glass-input w-full p-3 rounded-xl" placeholder="Örn: ATM'ye yatırılan" />
                </div>
                <button type="submit" className="w-full p-3 rounded-xl font-bold flex justify-center items-center gap-2 text-yellow-400 bg-[rgba(250,204,21,0.1)] border border-[rgba(250,204,21,0.3)] hover:bg-[var(--color-neon-yellow)] hover:text-black transition-colors shadow-[0_4px_15px_rgba(250,204,21,0.2)] hover:shadow-[0_8px_25px_rgba(250,204,21,0.4)]">
                  Transferi Gerçekleştir
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sağ Kolon: Cüzdan Listesi ve Transfer Geçmişi */}
        <div className="space-y-6 lg:col-span-2">
          
          <div className="glass-card p-6">
            <h5 className="font-bold text-lg mb-6">Mevcut Cüzdanlarım</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wallets.length === 0 ? (
                <div className="col-span-full text-center py-6 text-[#8e95a5]">Henüz kayıtlı bir kasanız yok.</div>
              ) : (
                wallets.map((wallet) => (
                  <div key={wallet.id} className="p-5 rounded-2xl bg-[#ffffff05] border border-[rgba(0,240,255,0.2)] flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon-blue)] rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[rgba(0,240,255,0.05)] border border-[rgba(0,240,255,0.1)] flex items-center justify-center">
                          {getIcon(wallet.type)}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg">{wallet.name}</h4>
                          <p className="text-xs text-[#8e95a5] uppercase tracking-wider">{getTypeName(wallet.type)}</p>
                        </div>
                      </div>
                      <form action={deleteWallet}>
                        <input type="hidden" name="id" value={wallet.id} />
                        <button type="submit" className="p-2 text-[#8e95a5] hover:text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)] rounded-lg transition-colors" title="Cüzdanı Sil">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                    
                    <div className="mt-2 relative z-10">
                      <p className="text-sm text-[#8e95a5] mb-1">Mevcut Bakiye</p>
                      <h3 className={`text-3xl font-bold tracking-tight ${wallet.balance < 0 ? 'text-[var(--color-neon-red)]' : 'text-white'}`}>
                        {formatMoney(wallet.balance)}
                      </h3>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-6 border-t-4 border-yellow-400">
            <h5 className="font-bold text-lg mb-6">Transfer Geçmişi</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#ffffff14] text-[#8e95a5]">
                    <th className="py-3 px-4 font-medium">Tarih</th>
                    <th className="py-3 px-4 font-medium">Kimden - Kime</th>
                    <th className="py-3 px-4 font-medium">Açıklama</th>
                    <th className="py-3 px-4 font-medium text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-6 text-[#8e95a5]">Hiçbir transfer geçmişiniz yok.</td></tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="border-b border-[#ffffff0a] hover:bg-[#ffffff05] transition-colors">
                        <td className="py-4 px-4">{format(new Date(t.date), 'dd.MM.yyyy')}</td>
                        <td className="py-4 px-4 font-bold flex items-center gap-2">
                           <span className="text-[var(--color-neon-red)]">{t.fromName || 'Silinmiş Kasa'}</span>
                           <ArrowRightLeft className="w-4 h-4 text-[#8e95a5] shrink-0" />
                           <span className="text-[var(--color-neon-green)]">{t.toName || 'Silinmiş Kasa'}</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-[#8e95a5]">{t.description || '-'}</td>
                        <td className="py-4 px-4 text-right font-bold text-yellow-500">{formatMoney(t.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
