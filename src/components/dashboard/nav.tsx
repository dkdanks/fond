'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types'

export function DashboardNav({ profile }: { profile: Profile | null }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b px-6 py-4" style={{ borderColor: '#E5E5E4', background: '#FAFAF9' }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight" style={{ color: '#1C1C1C' }}>
          fond
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#6B7280' }}>
            {profile?.name ?? profile?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
