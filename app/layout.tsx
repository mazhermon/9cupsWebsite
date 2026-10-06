import type { Metadata, Viewport } from 'next'
import { Bungee, DM_Sans } from 'next/font/google'
import './globals.css'
import { SITE_URL } from '@/lib/site-url'
import StructuredData from '@/components/StructuredData/StructuredData'

// Bungee: signage display, single weight, uppercase-leaning. Replaced
// Caprasimo on 2026-10-01 — see docs/STATE.md.
const display = Bungee({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  display: 'swap',
  variable: '--font-body',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title carries the words people actually search: the name, the role, the
  // place. "9cups" alone is ambiguous and competes with the tarot card.
  title: {
    default: '9cups · UK Garage & House DJ, Wellington NZ',
    // Inner pages set their own title; this keeps the brand on the end of it.
    template: '%s · 9cups',
  },
  description:
    'DJ and beat maker 9cups, Wellington Aotearoa New Zealand. UK Garage, bassline, 140 and house. Play with the stems of Catching A Feeling, then listen on Bandcamp, SoundCloud, Spotify and Tidal.',
  applicationName: '9cups',
  authors: [{ name: 'DJ 9cups' }],
  creator: 'DJ 9cups',
  publisher: 'DJ 9cups',
  keywords: [
    'DJ 9cups', '9cups', 'UK Garage NZ', 'UKG New Zealand', 'Wellington DJ',
    'New Zealand DJ', 'bassline', '140', 'house music Wellington',
    'Aotearoa electronic music',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: '9cups',
    locale: 'en_NZ',
    url: '/',
    title: '9cups · UK Garage & House DJ, Wellington NZ',
    description:
      'UK Garage, bassline, 140 and house from Wellington Aotearoa. Pull Catching A Feeling apart, one stem at a time.',
    images: [{
      url: '/og.png',
      width: 1200,
      height: 630,
      alt: '9cups, beat maker and DJ, Wellington Aotearoa. UKG, bassline, 140 and house.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '9cups · UK Garage & House DJ, Wellington NZ',
    description:
      'UK Garage, bassline, 140 and house from Wellington Aotearoa. Pull Catching A Feeling apart, one stem at a time.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  // The .ico is not listed here: app/favicon.ico is a Next file convention and
  // is emitted automatically at /favicon.ico. Listing it again would duplicate
  // the tag. These are the extras that convention does not cover.
  icons: {
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#1a0d2e',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <StructuredData />
      </body>
    </html>
  )
}
