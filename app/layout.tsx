import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GeoCheck.nl — Is jouw bedrijf zichtbaar in AI-zoekmachines?',
  description: 'Check hoe goed ChatGPT, Perplexity en Gemini jouw bedrijf aanbevelen. GEO-score, concurrentie-benchmark en AI-verbeteringstips voor NL bedrijven.',
  keywords: 'GEO, generative engine optimization, AI zoekmachine, ChatGPT ranking, Perplexity zichtbaarheid, AI SEO Nederland, merkzichtbaarheid AI',
  openGraph: {
    title: 'GeoCheck.nl — AI-zichtbaarheid voor NL bedrijven',
    description: 'Ontdek of ChatGPT jouw bedrijf aanbeveelt. Automatische GEO-scan, concurrentie-vergelijking en wekelijkse e-mailrapporten.',
    type: 'website',
    locale: 'nl_NL',
    url: 'https://geocheck.nl',
    siteName: 'GeoCheck.nl',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeoCheck.nl — Is jouw bedrijf zichtbaar in ChatGPT?',
    description: 'Check jouw GEO-score in 60 seconden. €39/m voor MKB.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
