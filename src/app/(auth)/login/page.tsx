'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
        Welcome back
      </h1>
      <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium" style={{ color: '#1C1C1C' }}>
          Sign up
        </Link>
      </p>

      {/* Demo credentials hint */}
      <div
        className="rounded-xl p-4 mb-6 text-xs leading-relaxed"
        style={{ background: '#F5EDD9', color: '#8B6914' }}
      >
        <p className="font-medium mb-1">Demo accounts</p>
        <p>demo@fond.app / demo1234 — sample wedding</p>
        <p>demo2@fond.app / demo1234 — sample baby shower</p>
        <p>you@fond.app / demo1234 — start fresh</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={error}
        />
        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
