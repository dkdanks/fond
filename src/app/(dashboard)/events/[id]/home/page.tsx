import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, LayoutTemplate, Users, Gift, ArrowRight, MapPin, ExternalLink } from 'lucide-react'
import { CopyLinkButton } from '@/components/dashboard/copy-link-button'
import { PublishButton } from '@/components/dashboard/publish-button'
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

  // Countdown calculation
  let daysToGo: number | null = null
  if (event.date) {
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff > 0) daysToGo = diff
  }

  return (
    <div className="px-8 py-10 max-w-4xl mx-auto">

      {/* Hero card */}
      <div
        className="rounded-3xl border overflow-hidden mb-8"
        style={{ background: 'white', borderColor: '#E8E3D9' }}
      >
        <div className="p-8 flex items-start justify-between gap-8">
          {/* Left: title, date, badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: '#F0EDE8', color: '#8B8670' }}
              >
                {EVENT_TYPE_LABELS[event.type]}
              </span>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{
                  background: event.status === 'published' ? '#F0FDF4' : '#F0EDE8',
                  color: event.status === 'published' ? '#16A34A' : '#8B8670',
                }}
              >
                {event.status === 'published' ? 'Live' : 'Draft'}
              </span>
            </div>

            <h1
              className="text-4xl font-semibold mb-3"
              style={{ color: '#2C2B26', letterSpacing: '-0.03em' }}
            >
              {event.title}
            </h1>

            <div className="flex flex-col gap-1.5">
              {event.date && (
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: '#B5A98A' }} />
                  <span className="text-sm" style={{ color: '#8B8670' }}>{formatDate(event.date)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: '#B5A98A' }} />
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm no-underline hover:underline"
                    style={{ color: '#8B8670' }}
                  >
                    {event.location}
                  </a>
                </div>
              )}
              {!event.date && !event.location && (
                <p className="text-sm" style={{ color: '#B5A98A' }}>Date and location not set yet</p>
              )}
            </div>
          </div>

          {/* Right: countdown or prompt */}
          <div
            className="shrink-0 rounded-2xl px-8 py-6 text-center"
            style={{ background: '#F0EDE8', minWidth: 140 }}
          >
            {daysToGo !== null ? (
              <>
                <p
                  className="text-5xl font-bold mb-1"
                  style={{ color: '#2C2B26', letterSpacing: '-0.04em', lineHeight: 1 }}
                >
                  {daysToGo}
                </p>
                <p className="text-xs font-medium uppercase tracking-wide mt-2" style={{ color: '#8B8670' }}>
                  days to go
                </p>
              </>
            ) : (
              <Link href={`/events/${id}/website`}>
                <div className="flex flex-col items-center gap-2">
                  <CalendarDays size={22} style={{ color: '#B5A98A' }} />
                  <p className="text-xs font-medium" style={{ color: '#8B8670' }}>
                    Set your<br />event date
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* URL bar */}
        <div
          className="px-8 py-4 flex items-center justify-between border-t"
          style={{ borderColor: '#F0EDE8', background: '#FAFAF7' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: event.status === 'published' ? '#4CAF50' : '#D4CCBC' }}
            />
            <p className="text-sm font-medium truncate" style={{ color: '#2C2B26' }}>{eventUrl}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <CopyLinkButton url={eventUrl} />
            {event.status === 'published' && (
              <a
                href={eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
              >
                <ExternalLink size={12} />
                View site
              </a>
            )}
            {event.status !== 'published' && (
              <PublishButton eventId={id} />
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total raised', value: formatCurrency(totalRaised), sub: `${contributions?.length ?? 0} contributions` },
          { label: 'Guests invited', value: totalGuests ?? 0, sub: 'on the list' },
          { label: 'Attending', value: attendingGuests ?? 0, sub: 'confirmed RSVPs' },
          { label: 'Awaiting RSVP', value: pendingGuests ?? 0, sub: 'yet to respond' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-2xl border p-5"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <p className="text-xs mb-2.5" style={{ color: '#B5A98A' }}>{label}</p>
            <p className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>{value}</p>
            <p className="text-xs" style={{ color: '#C8BFA8' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Website card */}
        <Link href={`/events/${id}/website`} className="group block">
          <div
            className="rounded-2xl border overflow-hidden transition-all hover:shadow-md hover:border-[#C8BFA8]"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            {/* Browser mockup */}
            <div className="h-40 relative overflow-hidden" style={{ background: '#F0EDE8' }}>
              <div className="absolute inset-0 flex flex-col p-4 gap-0">
                {/* Browser chrome */}
                <div
                  className="rounded-t-lg px-3 py-2 flex items-center gap-1.5 border-b"
                  style={{ background: 'white', borderColor: 'rgba(44,43,38,0.08)' }}
                >
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full" style={{ background: `rgba(44,43,38,${0.12 + i * 0.04})` }} />
                  ))}
                  <div className="flex-1 mx-2 h-3 rounded-full" style={{ background: 'rgba(44,43,38,0.07)' }} />
                </div>
                {/* Page content mockup */}
                <div
                  className="flex-1 rounded-b-lg flex flex-col gap-2 p-3"
                  style={{ background: 'white' }}
                >
                  <div className="rounded h-3.5 w-2/3" style={{ background: 'rgba(44,43,38,0.12)' }} />
                  <div className="rounded h-2.5 w-1/2" style={{ background: 'rgba(44,43,38,0.07)' }} />
                  <div className="mt-1 flex gap-1.5">
                    {[0.55, 0.35].map((w, i) => (
                      <div key={i} className="h-2 rounded" style={{ width: `${w * 100}%`, background: 'rgba(44,43,38,0.06)' }} />
                    ))}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <div className="rounded-md h-6 w-16" style={{ background: 'rgba(44,43,38,0.14)' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#2C2B26' }}>Your event website</p>
                  <p className="text-xs" style={{ color: '#8B8670' }}>
                    {event.slug ? `joyabl.com/e/${event.slug}` : 'Edit your event page'}
                  </p>
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
            <div className="h-40 relative overflow-hidden" style={{ background: '#F0EDE8' }}>
              <div className="absolute inset-0 p-5 flex flex-col justify-end gap-2">
                {/* Progress bars to represent registry items */}
                {[
                  { label: 'Honeymoon Fund', pct: 68 },
                  { label: 'Home Essentials', pct: 40 },
                  { label: 'Experience Gift', pct: 22 },
                ].map(({ label, pct }, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'rgba(44,43,38,0.45)', fontSize: 10 }}>{label}</span>
                      <span className="text-xs" style={{ color: 'rgba(44,43,38,0.35)', fontSize: 10 }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(44,43,38,0.12)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(44,43,38,0.35)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#2C2B26' }}>Gift registry</p>
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
      <div className="grid grid-cols-3 gap-3">
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
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#F0EDE8' }}
            >
              <Icon size={15} style={{ color: '#8B8670' }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm" style={{ color: '#2C2B26' }}>{label}</p>
              <p className="text-xs truncate" style={{ color: '#B5A98A' }}>{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
