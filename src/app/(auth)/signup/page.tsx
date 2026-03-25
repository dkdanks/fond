'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is enabled in Supabase, session will be null
    // until the user clicks the verification link in their email.
    if (data.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
        Create your account
      </h1>
      <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium" style={{ color: '#1C1C1C' }}>
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Your name"
          type="text"
          placeholder="David"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          error={error}
        />
        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-xs text-center" style={{ color: '#9CA3AF' }}>
        By signing up you agree to our{' '}
        <Link href="/terms" style={{ color: '#6B7280' }}>terms of service</Link>
        {' '}and{' '}
        <Link href="/privacy" style={{ color: '#6B7280' }}>privacy policy</Link>.
      </p>
    </div>
  )
}
