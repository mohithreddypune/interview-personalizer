import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Interview Coach — Personalized AI Interview Prep',
    template: '%s · Interview Coach',
  },
  description:
    'Drop in a job description and your résumé. Get 30 personalized interview questions and STAR answers written from your real experience.',
  keywords: [
    'interview prep',
    'STAR method',
    'mock interview',
    'AI interview coach',
    'résumé',
    'job interview questions',
  ],
  authors: [{ name: 'Mohith Reddy Pune' }],
  applicationName: 'Interview Coach',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Interview Coach',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Interview Coach — Personalized AI Interview Prep',
    description:
      'Drop in a JD + your résumé. Get 30 questions and STAR answers from your real experience. Powered by Groq.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Interview Coach',
    description:
      'Personalized interview prep, written from your résumé.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF7' },
    { media: '(prefers-color-scheme: dark)',  color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
