import db from '@/lib/db';
import { format, startOfMonth } from 'date-fns';
import { getSession } from '@/lib/auth';
import { TrendingUp, TrendingDown, Target, LineChart, PieChart as PieChartIcon } from 'lucide-react';
import ExpensePieChart from '@/components/ExpensePieChart';

export default async function RaporlarPage(props: { searchParams: Promise<{ start?: string, end?: string }> }) {
  const session = await getSession();
  if(!session) return null;

  const searchParams = await props.searchParams;
  const today = format(new Date(), 'yyyy-MM-dd');
  const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const startDate = searchParams.start || thisMonthStart;
  const endDate = searchParams.end || today;

  const incomeQuery = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'INCOME' AND date >= ? AND date <= ? AND profileId = ?`).get(startDate, endDate, session.profileId) as {total: number|null};
  const expenseQuery = await db.prepare(`SELECT SUM(amount) as total FROM transactions WHERE type = 'EXPENSE' AND date >= ? AND date <= ? AND profileId = ?`).get(startDate, endDate, session.profileId) as {total: number|null};

  const income = incomeQuery.total || 0;
  const expense = expenseQuery.total || 0;
  const netProfit = income - expense;

  const categoryExpenses = await db.prepare(`
    SELECT c.name as name, SUM(t.amount) as value 
    FROM transactions t 
    JOIN categories c ON t.categoryId = c.id 
    WHERE t.type = 'EXPENSE' AND t.date >= ? AND t.date <= ? AND t.profileId = ?
    GROUP BY c.id
    ORDER BY value DESC
  `).all(startDate, endDate, session.profileId) as any[];

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <LineChart className="text-[var(--color-neon-blue)] w-8 h-8" />
          Kapsamlı Kâr/Zarar Raporu
        </h2>
      </div>

      <div className="glass-card p-6 border-l-4 border-[var(--color-neon-blue)]">
        <form className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
            <label className="block text-sm text-[#8e95a5] mb-1">Başlangıç Tarihi</label>
            <input type="date" name="start" defaultValue={startDate} className="glass-input w-full p-3 rounded-xl" />
          </div>
          <div className="w-full">
            <label className="block text-sm text-[#8e95a5] mb-1">Bitiş Tarihi</label>
            <input type="date" name="end" defaultValue={endDate} className="glass-input w-full p-3 rounded-xl" />
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-3 bg-[var(--color-neon-blue)] text-black font-bold flex-shrink-0 rounded-xl hover:brightness-110 transition-all">
            Filtrele & Raporla
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="glass-card p-6 border-b-2 border-[var(--color-neon-green)] flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(0,255,136,0.1)] flex justify-center items-center mb-4">
             <TrendingUp className="text-[var(--color-neon-green)] w-6 h-6" />
          </div>
          <p className="text-[#8e95a5] font-bold mb-2">Toplam Tahsilat (Gelir)</p>
          <h3 className="text-3xl font-black text-[var(--color-neon-green)]">{formatMoney(income)}</h3>
        </div>

        <div className="glass-card p-6 border-b-2 border-[var(--color-neon-red)] flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[rgba(255,51,102,0.1)] flex justify-center items-center mb-4">
             <TrendingDown className="text-[var(--color-neon-red)] w-6 h-6" />
          </div>
          <p className="text-[#8e95a5] font-bold mb-2">Toplam Çıkış (Gider)</p>
          <h3 className="text-3xl font-black text-[var(--color-neon-red)]">{formatMoney(expense)}</h3>
        </div>

        <div className="glass-card p-6 border-b-2 border-[var(--color-neon-blue)] flex flex-col justify-center items-center text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[var(--color-neon-blue)] opacity-5 group-hover:opacity-10 transition-opacity"></div>
          <div className="w-12 h-12 rounded-full bg-[rgba(0,240,255,0.1)] flex justify-center items-center mb-4 relative z-10">
             <Target className="text-[var(--color-neon-blue)] w-6 h-6" />
          </div>
          <p className="text-[#8e95a5] font-bold mb-2 relative z-10">Dönem Sonu NET Yansıma</p>
          <h3 className={`text-4xl font-black relative z-10 ${netProfit >= 0 ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-red)]'}`}>
            {formatMoney(netProfit)}
          </h3>
          <p className="text-xs text-[#8e95a5] mt-2 italic relative z-10">
            {netProfit >= 0 ? 'Mükemmel, bu dönem kârdasınız! 🎉' : 'Dikkat, giderler gelirlerin üzerinde. ⚠️'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h5 className="font-bold text-lg mb-6 flex items-center gap-2 text-yellow-400">
            <PieChartIcon className="w-5 h-5" /> Harcama (Gider) Analizi
          </h5>
          {categoryExpenses.length === 0 ? (
            <div className="text-center py-10 text-[#8e95a5]">Bu dönem boyunca seçili aralıkta kaydedilmiş hiçbir harcama kaydı bulunamadı.</div>
          ) : (
            <ExpensePieChart data={categoryExpenses} />
          )}
        </div>
        
        <div className="glass-card p-6">
          <h5 className="font-bold text-lg mb-6">Detaylı Kalem Dökümü</h5>
          <div className="space-y-4">
            {categoryExpenses.map((c, i) => (
              <div key={i} className="flex justify-between items-center border-b border-[#ffffff0a] pb-2 last:border-0 hover:bg-[#ffffff05] transition-colors px-2 rounded-lg">
                <span className="font-bold text-[#8e95a5]">{c.name}</span>
                <span className="font-black text-[var(--color-neon-red)]">{formatMoney(c.value)}</span>
              </div>
            ))}
            {categoryExpenses.length === 0 && <div className="text-sm text-[#8e95a5] text-center italic">Henüz döküm oluşturulacak veri yok.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
