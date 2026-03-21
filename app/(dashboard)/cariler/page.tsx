import db from '@/lib/db';
import { Users, Plus, Trash2, MapPin, Phone } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import Link from 'next/link';

async function addCustomer(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const notes = formData.get('notes') as string;

  if (name) {
    await db.prepare(`INSERT INTO customers (name, phone, address, notes, profileId) VALUES (?, ?, ?, ?, ?)`).run(name, phone, address, notes, session.profileId);
    revalidatePath('/cariler');
  }
}

async function deleteCustomer(formData: FormData) {
  'use server';
  const session = await getSession();
  if (!session) return;

  const id = formData.get('id');
  await db.prepare(`DELETE FROM customers WHERE id = ? AND profileId = ?`).run(id, session.profileId);
  revalidatePath('/cariler');
}

export default async function CarilerPage() {
  const session = await getSession();
  if (!session) return null;

  const customers = await db.prepare(`SELECT * FROM customers WHERE profileId = ? ORDER BY id DESC`).all(session.profileId) as any[];

  return (
    <div className="space-y-6 pt-16 md:pt-0 pb-12">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Users className="text-[var(--color-neon-blue)] w-8 h-8" /> 
        Cari (Müşteri/Tedarikçi) Rehberi
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="glass-card p-6 lg:col-span-1 h-fit lg:sticky lg:top-6">
          <h5 className="font-bold text-lg mb-6">Yeni Cari Profil Ekle</h5>
          <form action={addCustomer} className="space-y-4">
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Firma veya Kişi Adı</label>
              <input type="text" name="name" required className="glass-input w-full p-3 rounded-xl" placeholder="Örn: Ahmet Yılmaz" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Telefon Numarası</label>
              <input type="text" name="phone" className="glass-input w-full p-3 rounded-xl" placeholder="Örn: 05xx xxx xx xx" />
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Adres</label>
              <textarea name="address" rows={2} className="glass-input w-full p-3 rounded-xl" placeholder="Firma adresi..."></textarea>
            </div>
            <div>
              <label className="block text-sm text-[#8e95a5] mb-1">Özel Notlar</label>
              <textarea name="notes" rows={2} className="glass-input w-full p-3 rounded-xl" placeholder="Müşteri hakkında notlar..."></textarea>
            </div>
            
            <button type="submit" className="btn-neon-blue w-full p-3 rounded-xl font-bold flex justify-center items-center gap-2">
              <Plus className="w-5 h-5" /> Cari Kaydet
            </button>
          </form>
        </div>

        {/* Cari Listesi */}
        <div className="glass-card p-6 lg:col-span-2">
          <h5 className="font-bold text-lg mb-6">Kayıtlı Cariler</h5>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {customers.length === 0 ? (
              <div className="col-span-full text-center py-6 text-[#8e95a5]">Henüz kayıtlı bir cari profil yok.</div>
            ) : (
              customers.map((cust) => (
                <div key={cust.id} className="p-5 rounded-2xl bg-[#ffffff05] border border-[#ffffff14] hover:border-[var(--color-neon-blue)] transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg text-[var(--color-neon-blue)]">{cust.name}</h4>
                      <form action={deleteCustomer}>
                        <input type="hidden" name="id" value={cust.id} />
                        <button type="submit" className="p-1.5 bg-[#ffffff0a] text-[#8e95a5] hover:bg-[#ffffff14] hover:text-[var(--color-neon-red)] rounded-lg transition-colors" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                    <div className="space-y-2 text-sm text-[#8e95a5]">
                      {cust.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4"/> {cust.phone}</p>}
                      {cust.address && <p className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5"/> {cust.address}</p>}
                      {cust.notes && (
                        <div className="mt-3 pt-3 border-t border-[#ffffff14] text-xs italic">
                          "{cust.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-[#ffffff14] flex justify-end">
                    <Link href={`/cariler/${encodeURIComponent(cust.name)}`} className="px-4 py-2 bg-[rgba(0,240,255,0.1)] text-[var(--color-neon-blue)] rounded-xl text-sm font-bold transition-all hover:bg-[var(--color-neon-blue)] hover:text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                      Döküm Ekstresini Gör
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
