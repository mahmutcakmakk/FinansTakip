import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import PwaRegister from '@/components/PwaRegister';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinansTakip | Özel Muhasebe',
  description: 'Gelişmiş Ön Muhasebe ve Cari Takibi Sistemi',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinansTakip',
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-512x512.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <PwaRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
