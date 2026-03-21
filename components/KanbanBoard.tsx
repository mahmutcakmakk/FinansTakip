'use client';

import { useState } from 'react';
import { updateKanbanTaskStatus, deleteKanbanTask, addKanbanTask } from '@/app/actions/kanbanActions';
import { Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
};

const COLUMNS = [
  { id: 'TODO', title: '📌 Yapılacaklar', color: 'border-t-4 border-[var(--color-neon-blue)]' },
  { id: 'IN_PROGRESS', title: '⏳ Devam Edenler', color: 'border-t-4 border-yellow-400' },
  { id: 'DONE', title: '✅ Tamamlananlar', color: 'border-t-4 border-[var(--color-neon-green)]' },
];

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.5'; }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = async (e: React.DragEvent, statusStr: string) => {
    e.preventDefault();
    if (draggedTaskId === null) return;
    
    const task = tasks.find(t => t.id === draggedTaskId);
    if (!task || task.status === statusStr) return;

    // Arayüzü beklemeden (Optimistic) güncelle
    setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: statusStr } : t));
    
    // SQLite'a bildir
    await updateKanbanTaskStatus(draggedTaskId, statusStr);
    setDraggedTaskId(null);
  };

  const handleDelete = async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteKanbanTask(id);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full pb-8">
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.id);
        
        return (
          <div 
            key={col.id}
            className={`flex-1 min-w-[320px] bg-[#0a0d17] border border-[#ffffff14] rounded-2xl flex flex-col ${col.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Sütun Başlığı */}
            <div className="p-5 border-b border-[#ffffff14] flex justify-between items-center bg-[#ffffff05]">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {col.title} 
                <span className="text-xs text-[#8e95a5] px-2.5 py-1 bg-[#ffffff14] rounded-xl">{columnTasks.length}</span>
              </h3>
              <button onClick={() => setIsAdding(col.id)} className="p-1.5 hover:bg-[#ffffff14] rounded-lg transition-colors text-[var(--color-neon-blue)]" title="Yeni Ekle">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Sütun İçi Görevler */}
            <div className="flex-1 p-4 space-y-4 min-h-[150px]">
              
              {isAdding === col.id && (
                <div className="glass-card p-4 border-l-2 border-[var(--color-neon-blue)]">
                  <form action={async (fd) => {
                     await addKanbanTask(fd);
                     setIsAdding(null);
                     // Sayfa Server Action tarafından otomatik revalidate olur, bizde initialTasks güncellenir.
                  }}>
                    <input type="hidden" name="status" value={col.id} />
                    <input type="text" name="title" required placeholder="İş Tanımı veya Görev Adı..." className="w-full bg-[#ffffff0a] border border-[#ffffff14] rounded-lg p-2.5 text-sm mb-2 focus:border-[var(--color-neon-blue)] outline-none text-white font-medium" autoFocus />
                    <textarea name="description" placeholder="Açıklama / Notlar (Opsiyonel)" rows={2} className="w-full bg-[#ffffff0a] border border-[#ffffff14] rounded-lg p-2.5 text-sm mb-3 focus:border-[var(--color-neon-blue)] outline-none custom-scrollbar text-[#8e95a5]"></textarea>
                    <div className="flex gap-2">
                       <button type="submit" className="flex-1 bg-[var(--color-neon-blue)] text-black font-bold py-2 rounded-lg text-sm transition-all hover:brightness-110">Panoya Ekle</button>
                       <button type="button" onClick={() => setIsAdding(null)} className="px-4 py-2 bg-[#ffffff14] hover:bg-[#ffffff20] rounded-lg text-sm font-bold transition-all text-[#8e95a5]">İptal</button>
                    </div>
                  </form>
                </div>
              )}

              {columnTasks.length === 0 && !isAdding && (
                <div className="text-center py-10 border border-dashed border-[#ffffff14] rounded-2xl text-[#8e95a5] text-sm">
                  Burada hiç iş yok.
                </div>
              )}

              {columnTasks.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  className="glass-card p-5 cursor-grab active:cursor-grabbing hover:border-[#ffffff2a] transition-all group shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h4 className="font-bold text-[15px] leading-snug text-white group-hover:text-[var(--color-neon-blue)] transition-colors">{task.title}</h4>
                    <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-[#8e95a5] hover:bg-[#ffffff14] rounded-lg hover:text-[var(--color-neon-red)] transition-all shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {task.description && (
                     <p className="text-sm text-[#8e95a5] line-clamp-3 mb-4 leading-relaxed">{task.description}</p>
                  )}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#ffffff0a]">
                     <GripVertical className="w-5 h-5 text-[#ffffff20] cursor-grab" />
                     {col.id === 'DONE' && <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-neon-green)]"><CheckCircle2 className="w-4 h-4" /> Tamamlandı</span>}
                     {col.id === 'TODO' && <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-neon-blue)]"><div className="w-2 h-2 rounded-full bg-[var(--color-neon-blue)]"></div> Bekliyor</span>}
                     {col.id === 'IN_PROGRESS' && <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-500"><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div> Sürüyor</span>}
                  </div>
                </div>
              ))}

            </div>
          </div>
        )
      })}
    </div>
  );
}
