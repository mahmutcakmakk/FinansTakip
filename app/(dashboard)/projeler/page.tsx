import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import KanbanBoard from '@/components/KanbanBoard';
import { LayoutDashboard } from 'lucide-react';

export default async function ProjelerPage() {
  const session = await getSession();
  if (!session) return null;

  // Tüm taskleri çekip Componente yolluyoruz
  const tasks = await db.prepare('SELECT * FROM kanban_tasks WHERE profileId = ? ORDER BY id DESC').all(session.profileId) as any[];

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold flex items-center gap-3">
             <LayoutDashboard className="text-[var(--color-neon-blue)] w-8 h-8" />
             Projeler ve İş Panosu (Kanban)
           </h2>
           <p className="text-[#8e95a5] mt-2 text-sm">İşlerinizi ve Notlarınızı sürükleyip bırakarak (Trello mantığında) saniyeler içinde organize edin.</p>
        </div>
      </div>
      
      {/* Scrollable Container for Kanban Columns */}
      <div className="mt-8 overflow-x-auto pb-8 custom-scrollbar">
        <KanbanBoard initialTasks={tasks} />
      </div>
    </div>
  );
}
