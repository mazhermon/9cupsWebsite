import type { Metadata, Viewport } from 'next'
import { Caprasimo, DM_Sans } from 'next/font/google'
import './globals.css'

const display = Caprasimo({
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
  title: '9cups · Catching A Feeling',
  description: 'Play with the stems of a 9cups release. House and UK Garage from Wellington.',
}

export const viewport: Viewport = {
  themeColor: '#1a0d2e',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
