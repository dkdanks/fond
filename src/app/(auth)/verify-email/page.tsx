'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function VerifyEmailContent() {
  const params = useSearchParams()
  const email = params.get('email') ?? 'your inbox'

  return (
    <div className="w-full max-w-sm text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: '#F0EDE6' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C2B26" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1C1C1C' }}>
        Check your email
      </h1>
      <p className="text-sm mb-1" style={{ color: '#6B7280' }}>
        We sent a confirmation link to
      </p>
      <p className="text-sm font-medium mb-6" style={{ color: '#1C1C1C' }}>
        {email}
      </p>
      <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>
        Click the link in the email to activate your account. It may take a minute to arrive — check your spam folder if you don&apos;t see it.
      </p>
      <Link href="/login" className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
        Back to sign in
      </Link>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
