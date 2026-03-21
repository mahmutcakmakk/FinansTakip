'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';

export async function paySmartSubscription(formData: FormData) {
  const session = await getSession();
  if(!session) return { error: 'Oturum kapalı' };

  const id = formData.get('id');
  const amountStr = formData.get('amount') as string;
  const amount = amountStr ? parseFloat(amountStr) : 0;
  const name = formData.get('name');

  if (!id || amount <= 0) return { error: 'Geçersiz data' };

  const currentMonthStr = format(new Date(), 'yyyy-MM');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Tercihen kasadan düşmek için ilk kasanın (wallet) ID'sini bul
  const wallet = db.prepare(`SELECT id FROM wallets WHERE profileId = ? ORDER BY id ASC LIMIT 1`).get(session.profileId) as {id: number}|undefined;
  const walletId = wallet ? wallet.id : null;

  try {
    const transaction = db.transaction(() => {
      // 1. İşlemi Gider olarak Kasa Defterine yaz
      db.prepare(`
        INSERT INTO transactions (profileId, walletId, type, amount, date, description) 
        VALUES (?, ?, 'EXPENSE', ?, ?, ?)
      `).run(session.profileId, walletId, amount, todayStr, `Otomatik Abonelik/Kira Tahsilatı: ${name}`);

      // 2. Kasa varsa bakiyeden düş
      if (walletId) {
        db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(amount, walletId);
      }

      // 3. Aboneliğin lastPaidMonth şalterini kapatarak bu ay tekrar bildirim çıkarmasını engelle
      db.prepare('UPDATE subscriptions SET lastPaidMonth = ? WHERE id = ? AND profileId = ?').run(currentMonthStr, id, session.profileId);
    });
    
    transaction();

    // Cache'leri uçur ve sayfayı yeniden render et
    revalidatePath('/');
    revalidatePath('/abonelikler');
    revalidatePath('/cuzdanlar');
    revalidatePath('/giderler');

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
