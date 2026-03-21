'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addKanbanTask(formData: FormData) {
  const session = await getSession();
  if(!session) return;
  
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const status = formData.get('status') as string || 'TODO';

  if (!title) return;

  await db.prepare('INSERT INTO kanban_tasks (profileId, title, description, status) VALUES (?, ?, ?, ?)').run(session.profileId, title, description, status);

  revalidatePath('/projeler');
}

export async function updateKanbanTaskStatus(id: number, newStatus: string) {
  const session = await getSession();
  if(!session) return;

  await db.prepare('UPDATE kanban_tasks SET status = ? WHERE id = ? AND profileId = ?').run(newStatus, id, session.profileId);
    
  revalidatePath('/projeler');
}

export async function deleteKanbanTask(id: number) {
  const session = await getSession();
  if(!session) return;

  await db.prepare('DELETE FROM kanban_tasks WHERE id = ? AND profileId = ?').run(id, session.profileId);

  revalidatePath('/projeler');
}
