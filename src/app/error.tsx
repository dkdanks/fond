'use client'

import { useEffect } from 'react'

export default function Error({
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
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#FAFAF7', color: '#2C2B26' }}
    >
      <p className="text-sm font-medium mb-4" style={{ color: '#B5A98A', letterSpacing: '0.1em' }}>Something went wrong</p>
      <h1 className="text-3xl font-semibold mb-3">Unexpected error</h1>
      <p className="text-base mb-8 max-w-xs" style={{ color: '#8B8670' }}>
        We&apos;re sorry — something didn&apos;t work. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 rounded-full text-sm font-medium"
        style={{ background: '#2C2B26', color: '#F5F0E8' }}
      >
        Try again
      </button>
    </div>
  )
}
