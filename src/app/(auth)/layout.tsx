import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF7' }}>
      <nav className="border-b px-6 py-4" style={{ borderColor: '#D4CCBC' }}>
        <Link
          href="/"
          style={{ fontWeight: 500, fontSize: 18, letterSpacing: '-0.07em', color: '#2C2B26', textDecoration: 'none' }}
        >
          joyabl
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
