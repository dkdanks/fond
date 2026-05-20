'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, CheckCircle2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types'
import { getEventLifecycleStatus } from '@/lib/events'

interface NavEvent {
  id: string
  title: string
  date: string | null
  status: 'draft' | 'published'
}

export function DashboardNav({
  profile,
  events,
  canCreateEvent,
}: {
  profile: Profile | null
  events: NavEvent[]
  canCreateEvent: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const currentEventId = pathname.match(/\/events\/([^/]+)/)?.[1] ?? null
  const currentEvent = events.find(event => event.id === currentEventId) ?? events[0] ?? null
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b px-6 py-4" style={{ borderColor: '#D4CCBC', background: '#FAFAF7' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" style={{ fontWeight: 500, fontSize: 18, letterSpacing: '-0.07em', color: '#2C2B26' }}>
            joyabl
          </Link>
          {currentEvent && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen(value => !value)}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors"
                style={{ borderColor: '#E8E3D9', background: '#FFFFFF', color: '#2C2B26' }}
              >
                <div>
                  <p className="text-sm font-medium leading-none">{currentEvent.title}</p>
                  <p className="mt-1 text-[11px]" style={{ color: '#8B8670' }}>
                    {getEventLifecycleStatus(currentEvent.date) === 'coming_up' ? 'Coming up' : 'Complete'}
                  </p>
                </div>
                <ChevronDown size={14} style={{ color: '#8B8670' }} />
              </button>

              {open && (
                <div
                  className="absolute left-0 top-[calc(100%+10px)] z-50 w-[320px] rounded-2xl border shadow-xl"
                  style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}
                >
                  <div className="border-b px-4 py-3" style={{ borderColor: '#F0EDE8' }}>
                    <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Your events</p>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto p-2">
                    {events.map(event => {
                      const isCurrent = event.id === currentEventId
                      const lifecycle = getEventLifecycleStatus(event.date)
                      return (
                        <Link
                          key={event.id}
                          href={`/events/${event.id}/home`}
                          onClick={() => setOpen(false)}
                          className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors"
                          style={{ background: isCurrent ? '#FAFAF7' : 'transparent' }}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" style={{ color: '#2C2B26' }}>{event.title}</p>
                            <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: '#8B8670' }}>
                              <span>{lifecycle === 'coming_up' ? 'Coming up' : 'Complete'}</span>
                              <span>•</span>
                              <span>{event.status === 'published' ? 'Live' : 'Draft'}</span>
                            </div>
                          </div>
                          {isCurrent && <CheckCircle2 size={14} style={{ color: '#8B8670' }} />}
                        </Link>
                      )
                    })}
                  </div>
                  <div className="border-t p-3" style={{ borderColor: '#F0EDE8' }}>
                    {canCreateEvent ? (
                      <Link
                        href="/events/new"
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
                        style={{ background: '#2C2B26', color: '#FAFAF7' }}
                      >
                        <Plus size={14} />
                        Create new event
                      </Link>
                    ) : (
                      <div className="rounded-xl px-3 py-2 text-sm" style={{ background: '#FAFAF7', color: '#8B8670' }}>
                        You can have up to 3 upcoming events at once.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
