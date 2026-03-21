'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-3 p-3 w-full rounded-xl transition-colors hover:bg-[#ffffff14] text-[#8e95a5] hover:text-white"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-500" />}
      <span className="font-medium">{theme === 'dark' ? 'Gündüz Modu' : 'Karanlık Mod'}</span>
    </button>
  );
}
