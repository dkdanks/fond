import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS, formatCurrency, type Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { ExternalLink, Users, Gift, Mail, Settings } from 'lucide-react'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!eventData) notFound()
  const event = eventData as Event

  const [
    { count: guestCount },
    { count: attendingCount },
    { data: contributions },
    { data: pool },
  ] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id),
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('rsvp_status', 'attending'),
    supabase.from('contributions').select('amount').eq('event_id', id).eq('status', 'completed'),
    supabase.from('registry_pools').select('*').eq('event_id', id).single(),
  ])

  const totalRaised = contributions?.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) ?? 0

  const navItems = [
    { href: `/events/${id}/guests`, icon: Users, label: 'Guests', description: 'Manage your guest list and RSVPs' },
    { href: `/events/${id}/invitations`, icon: Mail, label: 'Invitations', description: 'Send and track email invitations' },
    { href: `/events/${id}/registry`, icon: Gift, label: 'Registry', description: 'View contributions and fund details' },
    { href: `/events/${id}/settings`, icon: Settings, label: 'Settings', description: 'Edit event details and customisation' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: '#F4F4F3' }}
          >
            {EVENT_TYPE_EMOJIS[event.type]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-semibold" style={{ color: '#1C1C1C' }}>{event.title}</h1>
              <Badge variant={event.status === 'published' ? 'success' : 'muted'}>{event.status}</Badge>
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {EVENT_TYPE_LABELS[event.type]}
              {event.date && ` · ${formatDate(event.date)}`}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
        </div>
        {event.status === 'published' && (
          <Link href={`/e/${event.slug}`} target="_blank">
            <Button variant="secondary" size="sm">
              View page
              <ExternalLink size={12} />
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total raised', value: formatCurrency(totalRaised), sub: `from ${contributions?.length ?? 0} contribution${contributions?.length !== 1 ? 's' : ''}` },
          { label: 'Guests', value: guestCount ?? 0, sub: `${attendingCount ?? 0} attending` },
          { label: 'Fund', value: pool?.title ?? '—', sub: pool ? 'active' : 'not set up' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-5 border"
            style={{ background: 'white', borderColor: '#E5E5E4' }}
          >
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{label}</p>
            <p className="text-2xl font-semibold mb-0.5" style={{ color: '#1C1C1C' }}>{value}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-2 gap-4">
        {navItems.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border p-5 transition-all hover:shadow-sm hover:border-[#C9A96E]/40"
            style={{ background: 'white', borderColor: '#E5E5E4' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors"
              style={{ background: '#F4F4F3' }}
            >
              <Icon size={16} style={{ color: '#1C1C1C' }} />
            </div>
            <h3 className="font-medium mb-1 text-sm" style={{ color: '#1C1C1C' }}>{label}</h3>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{description}</p>
          </Link>
        ))}
      </div>

      {/* Public URL */}
      {event.status === 'published' && (
        <div
          className="mt-6 rounded-2xl p-4 flex items-center justify-between"
          style={{ background: '#F4F4F3' }}
        >
          <div>
            <p className="text-xs font-medium mb-0.5" style={{ color: '#6B7280' }}>Your event URL</p>
            <p className="text-sm font-mono" style={{ color: '#1C1C1C' }}>
              {process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/e/{event.slug}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigator?.clipboard?.writeText(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/e/${event.slug}`)}
          >
            Copy link
          </Button>
        </div>
      )}
    </div>
  )
}
