import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Interview Coach',
    short_name: 'Interview Coach',
    description:
      'Personalized interview prep — 30 questions and STAR answers written from your résumé.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAF7',
    theme_color: '#4F46E5',
    orientation: 'portrait-primary',
    categories: ['productivity', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
