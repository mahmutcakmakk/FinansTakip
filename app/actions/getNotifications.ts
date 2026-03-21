'use server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { format, addDays, getDate, getDaysInMonth } from 'date-fns';

export async function getNotifications() {
  const session = await getSession();
  if (!session) return [];

  const notifications: any[] = [];
  const todayDate = new Date();
  
  // 1. Borçlar ve Alacaklar (Son 3 Gün Kalanlar)
  const threeDaysLater = format(addDays(todayDate, 3), 'yyyy-MM-dd');
  const todayStr = format(todayDate, 'yyyy-MM-dd');

  const upcomingDebts = await db.prepare(`
    SELECT * FROM debts 
    WHERE status = 'UNPAID' 
    AND dueDate >= ? AND dueDate <= ? 
    AND profileId = ?
  `).all(todayStr, threeDaysLater, session.profileId) as any[];

  upcomingDebts.forEach(debt => {
    const isIncome = debt.type === 'GIVEN';
    notifications.push({
      id: `debt-${debt.id}`,
      type: 'DEBT',
      title: isIncome ? 'Aman Dikkat: Tahsilat Geldi' : 'Ödeme Hatırlatması',
      message: `${debt.personName} adlı cariye ${debt.amount} TL değerinde ${isIncome ? 'tahsilat' : 'ödeme'} işleminiz var. Son gün: ${format(new Date(debt.dueDate), 'dd.MM.yyyy')}`,
      isUrgent: new Date(debt.dueDate) <= addDays(new Date(), 1)
    });
  });

  // 2. Sabit Giderler Abonelikleri (Son 3 Gün)
  const currentDay = getDate(todayDate);
  const daysInMonth = getDaysInMonth(todayDate);
  const currentMonthStr = format(todayDate, 'yyyy-MM');
  
  const subscriptions = await db.prepare(`SELECT * FROM subscriptions WHERE profileId = ?`).all(session.profileId) as any[];
  
  subscriptions.forEach(sub => {
    // Eğer bu ay için zaten ödeme yapıldıysa/onaylandıysa bir daha gösterme
    if (sub.lastPaidMonth === currentMonthStr) return;

    let daysUntil = sub.dueDay - currentDay;
    if (daysUntil < 0) {
      daysUntil = (daysInMonth - currentDay) + sub.dueDay;
    }
    
    // Yalnızca 3 gün ve aşağısı kaldıysa (bugün dahil)
    if (daysUntil <= 3 && daysUntil >= 0) {
      notifications.push({
        id: `sub-${sub.id}`,
        type: 'SUBSCRIPTION',
        title: 'Sabit Gider Yaklaştı',
        message: `${sub.name} (Tutar: ${sub.amount} TL) ödemenizin zamanı yaklaştı. Durum: ${daysUntil === 0 ? 'BUGÜN' : daysUntil + ' gün kaldı'}`,
        isUrgent: daysUntil <= 1,
        actionData: {
          id: sub.id,
          amount: sub.amount,
          name: sub.name
        }
      });
    }
  });

  return notifications;
}
