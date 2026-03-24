import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

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
      <body className={jakartaSans.variable}>
        {children}
      </body>
    </html>
  )
}
