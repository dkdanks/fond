'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: '#F0EDE6' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2C2B26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1C1C1C' }}>Check your email</h1>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          We sent a password reset link to <strong>{email}</strong>. It may take a minute to arrive.
        </p>
        <Link href="/login" className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
        Reset your password
      </h1>
      <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          error={error}
        />
        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: '#6B7280' }}>
        <Link href="/login" className="font-medium" style={{ color: '#1C1C1C' }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
