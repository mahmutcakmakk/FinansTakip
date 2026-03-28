import db from '@/lib/db';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

async function addDebt(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const type = formData.get('type') as string;
  const personName = formData.get('personName') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const rawDueDate = formData.get('dueDate') as string;
  const description = formData.get('description') as string;
  const installmentsStr = formData.get('installmentsCount') as string;
  const installmentsCount = installmentsStr ? parseInt(installmentsStr) : 0;

  if (type && personName && amount && rawDueDate) {
    if (installmentsCount > 1) {
      const installmentAmount = amount / installmentsCount;
      const insertStmt = await db.prepare(`INSERT INTO debts (type, personName, amount, dueDate, description, profileId, installments) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      
      for (let i = 1; i <= installmentsCount; i++) {
          let iterDate = new Date(rawDueDate);
          iterDate.setMonth(iterDate.getMonth() + (i - 1));
          
          const formattedDate = iterDate.toISOString().split('T')[0];
          const iterDesc = (description ? description + ' - ' : '') + `Taksit ${i}/${installmentsCount}`;
          await insertStmt.run(type, personName, installmentAmount, formattedDate, iterDesc, session.profileId, installmentsCount);
      }
    } else {
      db.prepare(`INSERT INTO debts (type, personName, amount, dueDate, description, profileId) VALUES (?, ?, ?, ?, ?, ?)`).run(type, personName, amount, rawDueDate, description, session.profileId);
    }
    revalidatePath('/borclar');
    revalidatePath('/');
  }
}

async function markAsPaid(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  await db.prepare(`UPDATE debts SET status = 'PAID', paidAmount = amount WHERE id = ? AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/borclar');
  revalidatePath('/');
}

async function payDebtPartially(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;
  
  const id = formData.get('id');
  const payAmount = parseFloat(formData.get('payAmount') as string);
  
  if (!payAmount || payAmount <= 0) return;

  const debt = await db.prepare(`SELECT * FROM debts WHERE id = ? AND profileId = ?`).get(id, session.profileId) as any;
  if (!debt) return;
  
  const newPaidAmount = (debt.paidAmount || 0) + payAmount;
  let newStatus = debt.status;
  
  if (newPaidAmount >= debt.amount) {
     newStatus = 'PAID';
  }
  
  await db.prepare(`UPDATE debts SET paidAmount = ?, status = ? WHERE id = ? AND profileId = ?`).run(newPaidAmount, newStatus, id, session.profileId);
  revalidatePath('/borclar');
  revalidatePath('/');
}

async function deleteDebt(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = parseInt(formData.get('id') as string, 10);
  if (!id) return;
  
  await db.prepare(`DELETE FROM debts WHERE id = ? AND (profileId = ? OR profileId IS NULL)`).run(id, session.profileId);
  revalidatePath('/borclar');
  revalidatePath('/');
}

export default async function BorclarPage() {
  const session = await getSession();
  if (!session) return null;

  const debts = await db.prepare(`SELECT * FROM debts WHERE profileId = ? ORDER BY status DESC, dueDate ASC`).all(session.profileId) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Handshake className="text-[var(--color-neon-purple)] w-8 h-8" /> 
        Borç ve Alacak Takibi (Cari)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form */}
        <div className="glass-card p-6 lg:col-span-1 h-fit lg:sticky lg:top-6">
          <h5 className="font-bold text-lg mb-6">Yeni Bakiye Ekle</h5>
          <form action={addDebt} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">İşlem Tipi</label>
              <select name="type" required className="glass-input w-full p-3 rounded-xl appearance-none font-bold">
                <option value="GIVEN">Alacak (Ona Borç Verdim/Ürün Sattım)</option>
                <option value="TAKEN">Borç (Ondan Borç Aldım/Ürün Aldım)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Kişi / Firma Adı (Cari)</label>
              <input type="text" name="personName" required className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Ahmet Yılmaz" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Tutar (₺)</label>
              <input type="number" step="0.01" name="amount" required className="glass-input w-full p-3 rounded-xl font-bold text-lg" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Vade (Ödeme) Tarihi</label>
              <input type="date" name="dueDate" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="glass-input w-full p-3 rounded-xl" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Açıklama</label>
              <textarea name="description" rows={2} className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Kredi Kartı Bilgisayar Alımı"></textarea>
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1 flex items-center justify-between">
                <span>Taksit Sayısı (Opsiyonel)</span>
                <span className="text-[10px] text-yellow-500 font-bold border border-yellow-500/30 px-2 py-0.5 rounded-full bg-yellow-500/10">PRO</span>
              </label>
              <input type="number" name="installmentsCount" min="2" max="36" className="glass-input w-full p-3 rounded-xl focus:border-yellow-500 transition-colors" placeholder="Örn: 6 (Tek çekim için boş bırak)" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 bg-[rgba(168,85,247,0.1)] text-[var(--color-neon-purple)] border border-[rgba(168,85,247,0.3)] hover:bg-[var(--color-neon-purple)] hover:text-white transition-all shadow-[0_4px_15px_rgba(168,85,247,0.2)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.4)]">
              <Plus className="w-5 h-5" /> Bakiye Kaydet
            </button>
          </form>
        </div>

        {/* Borçlar Listesi */}
        <div className="glass-card p-6 lg:col-span-2">
          <h5 className="font-bold text-lg mb-6">Mevcut Bakiyeler</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#ffffff14] text-[#8e95a5]">
                  <th className="py-3 px-4 font-medium">Tip</th>
                  <th className="py-3 px-4 font-medium">Kişi/Kurum</th>
                  <th className="py-3 px-4 font-medium text-right">Tutar</th>
                  <th className="py-3 px-4 font-medium">Vade</th>
                  <th className="py-3 px-4 font-medium text-center">Durum / İşlem</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-[#8e95a5]">Hiçbir borç veya alacak kaydı yok. 🎉</td></tr>
                ) : (
                  debts.map((debt) => {
                    const isPaid = debt.status === 'PAID';
                    const isGiven = debt.type === 'GIVEN'; // Alacaklısın formu
                    const isOverdue = !isPaid && new Date(debt.dueDate) < new Date();
                    
                    return (
                      <tr key={debt.id} className={`border-b border-[#ffffff0a] hover:bg-[#ffffff05] transition-colors ${isPaid ? 'opacity-50' : ''}`}>
                        <td className="py-4 px-4">
                          {isGiven ? (
                            <span className="px-3 py-1 bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)] border border-[rgba(0,255,136,0.3)] rounded-full text-xs font-semibold">Alacak</span>
                          ) : (
                            <span className="px-3 py-1 bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)] border border-[rgba(255,51,102,0.3)] rounded-full text-xs font-semibold">Borç</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`${isPaid ? 'line-through' : 'font-bold'}`}>{debt.personName}</span>
                          <br/><span className="text-xs text-[#8e95a5]">{debt.description}</span>
                        </td>
                        <td className={`py-4 px-4 text-right ${isPaid ? 'text-[#8e95a5] line-through' : (isGiven ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]')}`}>
                          <div className="font-bold">{formatMoney(debt.amount)}</div>
                          {(!isPaid && (debt.paidAmount || 0) > 0) && (
                            <div className="text-xs text-[#8e95a5] mt-1 space-y-0.5">
                              <div>Ödenen: <span className="text-white">{formatMoney(debt.paidAmount)}</span></div>
                              <div>Kalan: <span className="text-yellow-400 font-bold">{formatMoney(debt.amount - debt.paidAmount)}</span></div>
                            </div>
                          )}
                        </td>
                        <td className={`py-4 px-4 ${isOverdue ? 'text-red-400 font-bold' : ''}`}>
                          {format(new Date(debt.dueDate), 'dd.MM.yyyy')} {isOverdue && '(Geçti)'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col xl:flex-row items-center justify-end gap-2">
                            {!isPaid && (
                              <div className="flex items-center gap-2">
                                {/* Kısmi Ödeme Formu */}
                                <form action={payDebtPartially} className="flex items-center gap-1">
                                  <input type="hidden" name="id" value={debt.id} />
                                  <input 
                                    type="number" 
                                    name="payAmount" 
                                    max={debt.amount - (debt.paidAmount || 0)} 
                                    step="0.01" 
                                    required
                                    placeholder="Tutar..." 
                                    className="glass-input w-20 p-1.5 rounded-lg text-xs outline-none focus:border-[var(--color-neon-blue)]" 
                                  />
                                  <button type="submit" className="px-2 py-1.5 bg-[#ffffff14] text-white font-bold rounded-lg hover:bg-[var(--color-neon-blue)] hover:text-black transition-all text-xs" title="Kısmi Tahsilat / Ödeme Ekle">
                                    Öde
                                  </button>
                                </form>

                                {/* Tamamını Kapat Butonu */}
                                <form action={markAsPaid}>
                                  <input type="hidden" name="id" value={debt.id} />
                                  <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-neon-blue)] text-black font-bold rounded-lg hover:brightness-110 transition-all text-xs" title="Borcu Komple Kapat">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                </form>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              {isPaid && <span className="text-xs font-bold text-[#8e95a5] whitespace-nowrap">TAMAMLANDI</span>}
                              <form action={deleteDebt}>
                                <input type="hidden" name="id" value={debt.id} />
                                <button type="submit" className="p-1.5 text-[#8e95a5] hover:text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)] rounded-lg transition-colors" title="Sil">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </form>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
