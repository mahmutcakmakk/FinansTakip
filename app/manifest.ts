import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finans Takip (Özel Muhasebe)',
    short_name: 'F. Takip',
    description: 'Kişisel ve Kurumsal Mükemmel Finans Yönetimi',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1115',
    theme_color: '#00f0ff',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ],
  }
}
