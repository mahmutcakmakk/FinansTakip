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
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-[#8e95a5] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#ffffff0d] border border-transparent"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-500" />}
      <span>{theme === 'dark' ? 'Gündüz Modu' : 'Karanlık Mod'}</span>
    </button>
  );
}
