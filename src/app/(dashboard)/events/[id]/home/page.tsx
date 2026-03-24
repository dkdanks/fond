import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, LayoutTemplate, Users, Gift, ArrowRight, Share2 } from 'lucide-react'
import { CopyLinkButton } from '@/components/dashboard/copy-link-button'
import { EVENT_TYPE_LABELS, formatCurrency, type Event } from '@/types'
import { formatDate } from '@/lib/utils'

export default async function HomePage({ params }: { params: Promise<{ id: string }> }) {
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
    { count: totalGuests },
    { count: attendingGuests },
    { count: pendingGuests },
    { data: contributions },
    { data: funds },
  ] = await Promise.all([
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id),
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('rsvp_status', 'attending'),
    supabase.from('guests').select('*', { count: 'exact', head: true }).eq('event_id', id).eq('rsvp_status', 'pending'),
    supabase.from('contributions').select('amount').eq('event_id', id).eq('status', 'completed'),
    supabase.from('registry_pools').select('id, title').eq('event_id', id),
  ])

  const totalRaised = contributions?.reduce((sum: number, c: { amount: number }) => sum + c.amount, 0) ?? 0
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const eventUrl = `${baseUrl}/e/${event.slug}`

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: '#F5F0E8', color: '#8B8670' }}
            >
              {EVENT_TYPE_LABELS[event.type]}
            </span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{
                background: event.status === 'published' ? '#F0FDF4' : '#F5F0E8',
                color: event.status === 'published' ? '#16A34A' : '#8B8670',
              }}
            >
              {event.status === 'published' ? 'Live' : 'Draft'}
            </span>
          </div>
          <h1 className="text-3xl font-semibold mb-1.5" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>
            {event.title}
          </h1>
          <p className="text-sm" style={{ color: '#8B8670' }}>
            {event.date && formatDate(event.date)}
            {event.date && event.location && ' · '}
            {event.location}
            {!event.date && !event.location && 'Date and location not set yet'}
          </p>
        </div>
        {event.status === 'published' && (
          <Link href={eventUrl} target="_blank">
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all hover:shadow-sm"
              style={{ background: 'white', borderColor: '#E8E3D9', color: '#2C2B26' }}
            >
              <ExternalLink size={14} />
              View live page
            </button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total raised', value: formatCurrency(totalRaised), sub: `${contributions?.length ?? 0} contributions` },
          { label: 'Invited', value: totalGuests ?? 0, sub: 'guests on list' },
          { label: 'Attending', value: attendingGuests ?? 0, sub: 'confirmed RSVPs' },
          { label: 'Awaiting', value: pendingGuests ?? 0, sub: 'yet to respond' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl p-5 border"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <p className="text-xs mb-2" style={{ color: '#B5A98A' }}>{label}</p>
            <p className="text-2xl font-semibold mb-0.5" style={{ color: '#2C2B26' }}>{value}</p>
            <p className="text-xs" style={{ color: '#C8BFA8' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Preview cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Website card */}
        <Link href={`/events/${id}/website`} className="group block">
          <div
            className="rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:border-[#C8BFA8]"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            {/* Visual preview mockup */}
            <div className="h-36 relative overflow-hidden" style={{ background: '#F5F0E8' }}>
              {/* Abstract website mockup lines */}
              <div className="absolute inset-0 p-4 flex flex-col gap-2">
                <div className="rounded-sm h-4 w-3/4" style={{ background: 'rgba(44,43,38,0.12)' }} />
                <div className="rounded-sm h-2.5 w-1/2" style={{ background: 'rgba(44,43,38,0.07)' }} />
                <div className="mt-2 rounded-sm h-2 w-full" style={{ background: 'rgba(44,43,38,0.06)' }} />
                <div className="rounded-sm h-2 w-5/6" style={{ background: 'rgba(44,43,38,0.06)' }} />
                <div className="rounded-sm h-2 w-4/5" style={{ background: 'rgba(44,43,38,0.06)' }} />
                <div className="mt-1 flex gap-2">
                  <div className="rounded h-7 w-20" style={{ background: 'rgba(44,43,38,0.15)' }} />
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#2C2B26' }}>Your website</p>
                  <p className="text-xs" style={{ color: '#8B8670' }}>Edit your event page</p>
                </div>
                <ArrowRight size={14} style={{ color: '#B5A98A' }} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>

        {/* Registry card */}
        <Link href={`/events/${id}/registry`} className="group block">
          <div
            className="rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:border-[#C8BFA8]"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <div className="h-36 relative overflow-hidden" style={{ background: '#F5F0E8' }}>
              <div className="absolute inset-0 p-4 flex flex-col gap-2.5">
                <div className="flex gap-2">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex-1 rounded-xl h-20" style={{ background: `rgba(44,43,38,${0.08 + i * 0.03})` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#2C2B26' }}>Registry</p>
                  <p className="text-xs" style={{ color: '#8B8670' }}>
                    {funds?.length ?? 0} {(funds?.length ?? 0) === 1 ? 'item' : 'items'} · {formatCurrency(totalRaised)} raised
                  </p>
                </div>
                <ArrowRight size={14} style={{ color: '#B5A98A' }} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { href: `/events/${id}/website`, icon: LayoutTemplate, label: 'Edit website', desc: 'Update content & design' },
          { href: `/events/${id}/guests`, icon: Users, label: 'Manage guests', desc: 'Add guests & track RSVPs' },
          { href: `/events/${id}/registry`, icon: Gift, label: 'Registry', desc: 'Manage gift items & funds' },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:shadow-sm"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#F5F0E8' }}>
              <Icon size={15} style={{ color: '#8B8670' }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm" style={{ color: '#2C2B26' }}>{label}</p>
              <p className="text-xs truncate" style={{ color: '#B5A98A' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* URL bar */}
      <div
        className="flex items-center justify-between rounded-2xl px-5 py-4 border"
        style={{ background: 'white', borderColor: '#E8E3D9' }}
      >
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: '#8B8670' }}>Your shareable link</p>
          <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>{eventUrl}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyLinkButton url={eventUrl} />
          {event.status !== 'published' && (
            <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: '#F5F0E8', color: '#8B8670' }}>
              Publish to make live
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
