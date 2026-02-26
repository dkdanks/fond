import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-5">
        <Link href="/" className="text-xl font-semibold tracking-tight" style={{ color: '#1C1C1C' }}>
          fond
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
