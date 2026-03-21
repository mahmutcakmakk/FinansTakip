'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, PieChart, TrendingUp, TrendingDown, Handshake, Settings, LogOut, CalendarDays, Users, HelpCircle, LineChart, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { handleLogout } from '@/app/actions/logoutSubmit';
import ThemeToggle from './ThemeToggle';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Özet Durum', href: '/', icon: PieChart },
    { name: 'Cüzdanlar (Kasa)', href: '/cuzdanlar', icon: Wallet },
    { name: 'Gelirler', href: '/gelirler', icon: TrendingUp },
    { name: 'Giderler', href: '/giderler', icon: TrendingDown },
    { name: 'Sabit Giderler', href: '/abonelikler', icon: CalendarDays },
    { name: 'Borç / Alacak', href: '/borclar', icon: Handshake },
    { name: 'Cari Rehber', href: '/cariler', icon: Users },
    { name: 'Gelişmiş Raporlar', href: '/raporlar', icon: LineChart },
    { name: 'İş & Proje Panosu', href: '/projeler', icon: LayoutDashboard },
    { name: 'Profil Ayarları', href: '/ayarlar', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 glass-card z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-[var(--color-neon-blue)]" />
          <h1 className="font-bold text-lg">Finans<span className="text-[var(--color-neon-blue)]">Takip</span></h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-[260px] bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-xl border-r border-[#e5e7eb] dark:border-[#ffffff14] z-40 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 hidden md:flex items-center justify-center gap-3">
          <Wallet className="text-[var(--color-neon-blue)] w-8 h-8" />
          <h1 className="font-bold text-2xl tracking-wide text-gray-900 dark:text-white">Finans<span className="text-[var(--color-neon-blue)]">Takip</span></h1>
        </div>

        <nav className="mt-20 md:mt-8 px-4 flex flex-col gap-2 overflow-y-auto h-[calc(100vh-120px)] pb-10 custom-scrollbar">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive 
                    ? 'bg-gradient-to-r from-[rgba(0,240,255,0.1)] to-transparent border-l-4 border-[var(--color-neon-blue)] text-white' 
                    : 'text-[#8e95a5] hover:text-white hover:bg-[#ffffff0d]'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive 
                    ? 'text-[var(--color-neon-blue)]' 
                    : link.name.includes('Gelir') ? 'text-[var(--color-neon-green)]' 
                    : link.name.includes('Gider') ? 'text-[var(--color-neon-red)]' 
                    : ''
                }`} />
                {link.name}
              </Link>
            );
          })}
          <div className="mt-6 border-t border-[#ffffff14] pt-4 flex flex-col gap-2">
            <button 
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new Event('open-tutorial'));
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-yellow-400 hover:bg-[rgba(250,204,21,0.1)] border border-transparent hover:border-[rgba(250,204,21,0.3)]"
            >
              <HelpCircle className="w-5 h-5" /> Kullanım Rehberi
            </button>
            <ThemeToggle />
            <form action={handleLogout}>
              <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-[var(--color-neon-red)] hover:bg-[rgba(255,51,102,0.1)] border border-transparent hover:border-[rgba(255,51,102,0.3)]">
                <LogOut className="w-5 h-5" /> Güvenli Çıkış
              </button>
            </form>
          </div>
        </nav>
      </div>
      
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
