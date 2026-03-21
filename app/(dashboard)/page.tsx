import db from '@/lib/db';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, CalendarDays, Handshake, Clock } from 'lucide-react';
import Link from 'next/link';
import DashboardChart from '@/components/DashboardChart';
import ExpensePieChart from '@/components/ExpensePieChart';
import TodoWidget from '@/components/TodoWidget';
import AiWidget from '@/components/AiWidget';
import { getSession } from '@/lib/auth';

// --- Server Action ---
async function getDashboardData(profileId: number) {
  'use server';
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const thisMonth = format(new Date(), 'yyyy-MM');

  const todayIncome = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date = ? AND profileId = ?`).get(today, profileId) as {total: number|null};
  const todayExpense = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date = ? AND profileId = ?`).get(today, profileId) as {total: number|null};
  const monthIncome = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date LIKE ? AND profileId = ?`).get(`${thisMonth}%`, profileId) as {total: number|null};
  const monthExpense = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date LIKE ? AND profileId = ?`).get(`${thisMonth}%`, profileId) as {total: number|null};
  
  const upcomingDebts = await db.prepare(`SELECT * FROM debts WHERE status = 'UNPAID' AND dueDate <= date(?, '+7 day') AND profileId = ? ORDER BY dueDate ASC LIMIT 5`).all(today, profileId) as any[];
  
  const recentTransactions = await db.prepare(`
    SELECT t.*, c.name as categoryName 
    FROM transactions t 
    LEFT JOIN categories c ON t.categoryId = c.id 
    WHERE t.profileId = ?
    ORDER BY t.date DESC, t.id DESC LIMIT 5
  `).all(profileId) as any[];

  const todos = await db.prepare('SELECT * FROM todos WHERE profileId = ? ORDER BY isCompleted ASC, id DESC LIMIT 20').all(profileId) as any[];

  // Grafik için günlük özet verisi (Bu Ay)
  const chartTransactions = await db.prepare(`SELECT type, amount, date FROM transactions WHERE date LIKE ? AND profileId = ? ORDER BY date ASC`).all(`${thisMonth}%`, profileId) as any[];
  
  const groupedChartData: Record<string, {date: string, income: number, expense: number}> = {};
  chartTransactions.forEach(t => {
    const day = format(new Date(t.date), 'dd MMM', { locale: tr });
    if (!groupedChartData[day]) {
      groupedChartData[day] = { date: day, income: 0, expense: 0 };
    }
    if (t.type === 'INCOME') groupedChartData[day].income += t.amount;
    if (t.type === 'EXPENSE') groupedChartData[day].expense += t.amount;
  });

  const chartDataArray = Object.values(groupedChartData);

  // Pasta Grafik için Kategorilere Göre Gider Dağılımı
  const categoryExpenses = await db.prepare(`
    SELECT c.name as name, SUM(t.amount) as value 
    FROM transactions t 
    JOIN categories c ON t.categoryId = c.id 
    WHERE t.type = 'EXPENSE' AND t.date LIKE ? AND t.profileId = ?
    GROUP BY c.id
    ORDER BY value DESC
  `).all(`${thisMonth}%`, profileId) as any[];

  // Bütçeler ve Harcama İlerlemesi
  const budgets = await db.prepare(`SELECT b.*, c.name as categoryName FROM budgets b JOIN categories c ON b.categoryId = c.id WHERE b.profileId = ? AND b.month = ?`).all(profileId, thisMonth) as any[];

  const budgetProgress = await Promise.all(budgets.map(async (b: any) => {
    const spent = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE categoryId = ? AND profileId = ? AND date LIKE ?`).get(b.categoryId, profileId, `${thisMonth}%`) as {total: number|null};
    const totalSpent = spent.total || 0;
    const isExceeded = totalSpent > b.amountLimit;
    return {
      ...b,
      spent: totalSpent,
      percentage: Math.min(100, Math.round((totalSpent / b.amountLimit) * 100)),
      isExceeded
    };
  }));

  // Yapay Zeka Hızlı Giriş Günlük Kullanım Limit Sayacı (1500 limit için referans)
  const aiTransactions = await db.prepare(`SELECT COUNT(*) as total FROM transactions WHERE profileId = ? AND date LIKE ? AND (description LIKE '%🤖%' OR description LIKE '%Yapay Zeka%')`).get(profileId, `${today}%`) as {total: number};
  const aiTransfers = await db.prepare(`SELECT COUNT(*) as total FROM transfers WHERE profileId = ? AND date LIKE ? AND (description LIKE '%🤖%' OR description LIKE '%Yapay Zeka%')`).get(profileId, `${today}%`) as {total: number};
  
  const aiUsageToday = (aiTransactions.total || 0) + (aiTransfers.total || 0);

  return {
    todayIncome: todayIncome.total || 0,
    todayExpense: todayExpense.total || 0,
    monthIncome: monthIncome.total || 0,
    monthExpense: monthExpense.total || 0,
    upcomingDebts,
    recentTransactions,
    chartDataArray,
    categoryExpenses,
    budgetProgress,
    aiUsageToday,
    todos
  };
}

export default async function DashboardPage() {
  const session = await getSession();
  if(!session) return null;

  const data = await getDashboardData(session.profileId);
  const monthNet = data.monthIncome - data.monthExpense;
  const todayStr = format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr });

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-6 pt-16 md:pt-0">
      <div className="flex justify-between items-center bg-[rgba(0,240,255,0.05)] p-4 rounded-xl border border-[rgba(0,240,255,0.1)]">
        <div>
          <h2 className="text-2xl font-bold">Özet Durum</h2>
          <p className="text-[var(--color-neon-blue)] text-sm font-semibold">Aktif Profil: {session.name}</p>
        </div>
        <span className="text-[#8e95a5] flex items-center gap-2">
          <CalendarDays className="w-5 h-5" /> {todayStr}
        </span>
      </div>

      <AiWidget usedCount={data.aiUsageToday} />

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 border-t-4 border-t-[var(--color-neon-green)]">
          <p className="text-[#8e95a5] flex items-center gap-2 mb-2"><TrendingUp className="text-[var(--color-neon-green)] w-5 h-5"/> Bugünkü Gelir</p>
          <h3 className="text-3xl font-bold">{formatMoney(data.todayIncome)}</h3>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-[var(--color-neon-red)]">
          <p className="text-[#8e95a5] flex items-center gap-2 mb-2"><TrendingDown className="text-[var(--color-neon-red)] w-5 h-5"/> Bugünkü Gider</p>
          <h3 className="text-3xl font-bold">{formatMoney(data.todayExpense)}</h3>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-[var(--color-neon-blue)]">
          <p className="text-[#8e95a5] flex items-center gap-2 mb-2"><CalendarDays className="text-[var(--color-neon-blue)] w-5 h-5"/> Bu Ayki Net Durum</p>
          <h3 className={`text-3xl font-bold ${monthNet >= 0 ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
            {formatMoney(monthNet)}
          </h3>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-[var(--color-neon-purple)]">
          <p className="text-[#8e95a5] flex items-center gap-2 mb-2"><Handshake className="text-[var(--color-neon-purple)] w-5 h-5"/> Yaklaşan Borçlar</p>
          <h3 className="text-3xl font-bold">{data.upcomingDebts.length} Adet Bekleyen</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol 2 Kolon: Çizgi Grafik */}
        <div className="glass-card p-6 lg:col-span-2">
          <h5 className="font-bold text-lg mb-2">Bu Ayki Gelir / Gider Dalgalanması</h5>
          <DashboardChart data={data.chartDataArray} />
        </div>

        {/* Sağ 1 Kolon: Pasta Grafik */}
        <div className="glass-card p-6 lg:col-span-1">
          <h5 className="font-bold text-lg mb-2">Harcama Dağılımı</h5>
          <ExpensePieChart data={data.categoryExpenses} />
        </div>
      </div>

      {/* Bütçe İlerlemeleri (Hedefler) */}
      {data.budgetProgress.length > 0 && (
        <div className="glass-card p-6">
          <h5 className="font-bold text-lg mb-4 text-purple-400">Aylık Kategori Bütçeleri (Harcama Limitleri)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {data.budgetProgress.map(b => (
               <div key={b.id} className="space-y-2 p-4 bg-[#ffffff05] rounded-xl border border-[#ffffff14]">
                 <div className="flex justify-between text-sm">
                   <span className="font-bold">{b.categoryName}</span>
                   <span className={b.isExceeded ? 'text-[var(--color-neon-red)] font-bold' : 'text-[#8e95a5]'}>
                     {formatMoney(b.spent)} / {formatMoney(b.amountLimit)}
                   </span>
                 </div>
                 <div className="w-full bg-[#090b14] rounded-full h-3 border border-[#ffffff14]">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${
                        b.isExceeded ? 'bg-[var(--color-neon-red)] shadow-[0_0_10px_rgba(255,51,102,0.6)]' : 
                        (b.percentage > 80 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]' : 'bg-[var(--color-neon-green)] shadow-[0_0_10px_rgba(0,255,136,0.6)]')
                     }`} 
                     style={{ width: `${b.percentage}%` }}
                   ></div>
                 </div>
                 {b.isExceeded && <p className="text-[10px] text-[var(--color-neon-red)] mt-1 font-bold text-right tracking-wider">LİMİT AŞILDI!</p>}
               </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Son Hareketler */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h5 className="font-bold text-lg">Son Hareketler</h5>
            <Link href="/gelirler" className="text-[var(--color-neon-blue)] text-sm hover:underline">Tümünü Gör</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ffffff14] text-[#8e95a5]">
                  <th className="py-3 px-4 font-medium">Tip</th>
                  <th className="py-3 px-4 font-medium">Kategori</th>
                  <th className="py-3 px-4 font-medium">Tarih</th>
                  <th className="py-3 px-4 font-medium text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-[#8e95a5]">İşlem bulunamadı.</td></tr>
                ) : (
                  data.recentTransactions.map((t, idx) => (
                    <tr key={idx} className="border-b border-[#ffffff0a] hover:bg-[#ffffff05] transition-colors">
                      <td className="py-3 px-4">
                        {t.type === 'INCOME' ? 
                          <span className="px-3 py-1 bg-[rgba(0,255,136,0.1)] text-[var(--color-neon-green)] border border-[rgba(0,255,136,0.3)] rounded-full text-xs font-semibold">Gelir</span> : 
                          <span className="px-3 py-1 bg-[rgba(255,51,102,0.1)] text-[var(--color-neon-red)] border border-[rgba(255,51,102,0.3)] rounded-full text-xs font-semibold">Gider</span>
                        }
                      </td>
                      <td className="py-3 px-4">{t.categoryName || '-'} <br/><span className="text-xs text-[#8e95a5]">{t.description}</span></td>
                      <td className="py-3 px-4">{format(new Date(t.date), 'dd.MM.yyyy')}</td>
                      <td className={`py-3 px-4 text-right font-bold ${t.type === 'INCOME' ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatMoney(t.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ Kolon: Borçlar ve Notlar */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Yaklaşan Borçlar Paneli */}
          <div className="glass-card p-6">
            <h5 className="font-bold text-lg mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-400" /> Hatırlatmalar</h5>
            {data.upcomingDebts.length === 0 ? (
              <div className="text-center text-[#8e95a5] py-4">Yaklaşan ödeme/tahsilat yok. 🎉</div>
            ) : (
              <div className="space-y-4">
                {data.upcomingDebts.map((d, idx) => {
                  const isIncome = d.type === 'GIVEN'; // Verdiğim borcu tahsil edeceğim (Para girecek)
                  const isOverdue = new Date(d.dueDate) < new Date();
                  return (
                    <div key={idx} className={`p-4 rounded-xl border-l-4 bg-[#ffffff05] ${isIncome ? 'border-[var(--color-neon-green)]' : 'border-[var(--color-neon-red)]'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{d.personName}</span>
                        <div className="text-right">
                          <span className={`font-bold ${isIncome ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
                            {formatMoney(d.amount - (d.paidAmount || 0))}
                          </span>
                          {(d.paidAmount || 0) > 0 && (
                            <div className="text-[10px] text-[#8e95a5] font-normal leading-tight">
                              Toplam: {formatMoney(d.amount)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-[#8e95a5]">
                        <span>{isIncome ? 'Tahsil Edilecek' : 'Ödenecek Şahıs/Kurum'}</span>
                        <span className={isOverdue ? 'text-red-400 font-bold' : ''}>
                          {format(new Date(d.dueDate), 'dd.MM.yyyy')} {isOverdue && '(GEÇTİ)'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notlar Paneli (Post-it) */}
          <TodoWidget todos={data.todos} />
        </div>
      </div>
    </div>
  );
}
