import db from '@/lib/db';
import { createSession } from '@/lib/auth';
import { Wallet, LogIn } from 'lucide-react';
import { redirect } from 'next/navigation';

async function loginAction(formData: FormData) {
  'use server';
  
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) return;

  const user = await db.prepare('SELECT * FROM profiles WHERE username = ? AND password = ?').get(username, password) as any;

  if (user) {
    await createSession(user.id, user.username, user.name);
    redirect('/');
  } else {
    redirect('/login?error=1');
  }
}

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const hasError = params?.error === '1';

  let profiles: any[] = [];
  let dbError = false;
  try {
    profiles = await db.prepare('SELECT * FROM profiles ORDER BY id ASC').all() as any[];
    if (!profiles || profiles.length === 0) dbError = true;
  } catch (e) {
    dbError = true;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 relative overflow-hidden">
        {/* Dekoratif Neon Işıklar */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[var(--color-neon-blue)] rounded-full blur-[80px] opacity-20"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[var(--color-neon-purple)] rounded-full blur-[80px] opacity-20"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-full bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.3)] shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center">
              <Wallet className="text-[var(--color-neon-blue)] w-8 h-8" />
            </div>
            <h1 className="font-bold text-3xl tracking-wide text-center">
              Finans<span className="text-[var(--color-neon-blue)]">Takip</span>
            </h1>
            <p className="text-[#8e95a5] text-sm">Sisteme giriş yapmak için profilinizi seçin.</p>
          </div>

          {hasError && (
            <div className="mb-6 p-3 rounded-lg bg-[rgba(255,51,102,0.1)] border border-[rgba(255,51,102,0.3)] text-[var(--color-neon-red)] text-sm text-center font-medium">
              Geçersiz kullanıcı adı veya şifre!
            </div>
          )}

          {dbError && (
            <div className="mb-6 p-3 rounded-lg bg-[rgba(255,165,0,0.1)] border border-[rgba(255,165,0,0.8)] text-[#ffb03a] text-sm text-center font-medium">
              ⚠️ Veritabanı bağlantısı Bulut Sunucusunda kurulamadı veya profiller çekilemedi. Bağlantı şifresi eksik olabilir!
            </div>
          )}

          <form action={loginAction} className="space-y-5">
            <div>
              <label className="block text-sm text-[#8e95a5] mb-2">Seçili Profil (Kullanıcı)</label>
              <select name="username" required className="glass-input w-full p-4 rounded-xl appearance-none font-bold text-lg bg-[#ffffff05]">
                {profiles.map(p => (
                  <option key={p.id} value={p.username}>👤 {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-2">Şifre</label>
              <input type="password" name="password" required className="glass-input w-full p-4 rounded-xl font-bold tracking-widest text-lg" placeholder="••••••" />
            </div>
            
            <button type="submit" className="btn-neon-blue w-full p-4 rounded-xl font-bold flex justify-center items-center gap-2 text-lg mt-4">
              <LogIn className="w-6 h-6" /> Giriş Yap
            </button>
          </form>
          
          <p className="text-center text-[#8e95a5] text-xs mt-8">
            Şifrenizi unuttuysanız sistem yöneticisine başvurun.
          </p>
        </div>
      </div>
    </div>
  );
}
