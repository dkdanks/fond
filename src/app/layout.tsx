import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import { jakartaSans, siteFontVariables } from '@/lib/site-fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Joyabl', template: '%s · Joyabl' },
  description: 'The gift registry for every life moment',
  openGraph: {
    title: 'Joyabl',
    description: 'The gift registry for every life moment',
    siteName: 'Joyabl',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakartaSans.variable} ${siteFontVariables}`}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
