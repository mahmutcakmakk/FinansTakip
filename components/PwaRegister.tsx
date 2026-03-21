'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('PWA Service Worker Başarıyla Kaydedildi! Kapsam: ', registration.scope);
          },
          (err) => {
            console.log('PWA Service Worker Kaydı Başarısız: ', err);
          }
        );
      });
    }
  }, []);

  return null;
}
