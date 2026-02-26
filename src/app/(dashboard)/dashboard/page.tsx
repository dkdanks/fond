import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS, formatCurrency, type Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, ArrowRight } from 'lucide-react'

async function getEventsWithStats(userId: string) {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!events) return []

  const enriched = await Promise.all(
    events.map(async (event: Event) => {
      const [{ count: guestCount }, { data: contributions }] = await Promise.all([
        supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', event.id),
        supabase.from('contributions').select('amount').eq('event_id', event.id).eq('status', 'completed'),
      ])
      const totalRaised = contributions?.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) ?? 0
      return { ...event, guestCount: guestCount ?? 0, totalRaised }
    })
  )

  return enriched
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const events = await getEventsWithStats(user.id)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#1C1C1C' }}>Your events</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {events.length === 0 ? 'Create your first event to get started' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/events/new">
          <Button size="sm">
            <Plus size={14} />
            New event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-16 text-center"
          style={{ borderColor: '#E5E5E4' }}
        >
          <p className="text-4xl mb-4">🎉</p>
          <h2 className="text-lg font-medium mb-2" style={{ color: '#1C1C1C' }}>No events yet</h2>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Create your first event and start sharing your registry.
          </p>
          <Link href="/events/new">
            <Button>
              <Plus size={14} />
              Create event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group block rounded-2xl border p-6 transition-all hover:shadow-sm hover:border-[#C9A96E]/30"
              style={{ background: 'white', borderColor: '#E5E5E4' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: '#F4F4F3' }}
                  >
                    {EVENT_TYPE_EMOJIS[event.type]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-semibold" style={{ color: '#1C1C1C' }}>{event.title}</h2>
                      <Badge variant={event.status === 'published' ? 'success' : 'muted'}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm" style={{ color: '#6B7280' }}>
                      {EVENT_TYPE_LABELS[event.type]}
                      {event.date && ` · ${formatDate(event.date)}`}
                      {event.location && ` · ${event.location}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-lg font-semibold" style={{ color: '#1C1C1C' }}>
                      {formatCurrency(event.totalRaised)}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>raised</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold" style={{ color: '#1C1C1C' }}>
                      {event.guestCount}
                    </p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>guests</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#9CA3AF' }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
