'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 text-center"
      style={{ color: '#2C2B26' }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: '#B5A98A', letterSpacing: '0.1em' }}>Error</p>
      <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm mb-6" style={{ color: '#8B8670' }}>
        We couldn&apos;t load this page. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#2C2B26', color: '#F5F0E8' }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2 rounded-lg text-sm font-medium border"
          style={{ borderColor: '#D4CCBC', color: '#8B8670' }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
