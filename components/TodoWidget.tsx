import { CheckSquare, Square, Trash2, Plus, StickyNote } from 'lucide-react';
import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

async function addTodo(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;
  const text = formData.get('text') as string;
  if (text) {
    db.prepare('INSERT INTO todos (text, isCompleted, profileId) VALUES (?, 0, ?)').run(text, session.profileId);
    revalidatePath('/');
  }
}

async function toggleTodo(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;
  const id = formData.get('id');
  const currentState = parseInt(formData.get('currentState') as string);
  db.prepare('UPDATE todos SET isCompleted = ? WHERE id = ? AND profileId = ?').run(currentState === 1 ? 0 : 1, id, session.profileId);
  revalidatePath('/');
}

async function deleteTodo(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;
  const id = formData.get('id');
  db.prepare('DELETE FROM todos WHERE id = ? AND profileId = ?').run(id, session.profileId);
  revalidatePath('/');
}

export default function TodoWidget({ todos }: { todos: any[] }) {
  return (
    <div className="glass-card p-6 bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-[rgba(255,255,255,0.05)]">
      <h5 className="font-bold text-lg mb-4 flex items-center gap-2">
        <StickyNote className="w-5 h-5 text-[var(--color-neon-blue)]" /> 
        Hızlı Notlar (Post-it)
      </h5>
      
      <form action={addTodo} className="flex gap-2 mb-4">
        <input 
          type="text" 
          name="text" 
          placeholder="Yeni not ekle..." 
          required 
          maxLength={100}
          className="glass-input w-full p-2.5 rounded-xl text-sm"
        />
        <button type="submit" className="bg-[var(--color-neon-blue)] text-black p-2.5 rounded-xl hover:brightness-110 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {todos.length === 0 ? (
          <p className="text-sm text-[#8e95a5] text-center py-4">Harika! Bekleyen hiçbir göreviniz yok.</p>
        ) : (
          todos.map((todo) => {
            const isCompleted = todo.isCompleted === 1;
            return (
              <div key={todo.id} className={`flex items-center justify-between p-3 rounded-xl border border-[#ffffff0a] transition-colors ${isCompleted ? 'bg-[#ffffff05] opacity-60' : 'bg-[#ffffff0a] hover:bg-[#ffffff14]'}`}>
                <form action={toggleTodo} className="flex-1 flex items-center gap-3 cursor-pointer group">
                  <input type="hidden" name="id" value={todo.id} />
                  <input type="hidden" name="currentState" value={todo.isCompleted} />
                  <button type="submit" className="text-[var(--color-neon-blue)] group-hover:scale-110 transition-transform">
                    {isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  <span className={`text-sm ${isCompleted ? 'line-through text-[#8e95a5]' : 'font-medium'}`}>
                    {todo.text}
                  </span>
                </form>
                
                <form action={deleteTodo}>
                  <input type="hidden" name="id" value={todo.id} />
                  <button type="submit" className="text-[#8e95a5] hover:text-[var(--color-neon-red)] p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
