import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS, type Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { MapPin, CalendarDays, Gift, CheckSquare } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('title, description').eq('slug', slug).eq('status', 'published').single()
  return {
    title: event?.title ?? 'Event',
    description: event?.description ?? 'You\'re invited',
  }
}

export default async function PublicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: eventData } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!eventData) notFound()
  const event = eventData as Event

  const { data: pool } = await supabase.from('registry_pools').select('*').eq('event_id', event.id).single()
  const { data: contributions } = await supabase.from('contributions').select('amount').eq('event_id', event.id).eq('status', 'completed')
  const totalRaised = contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0

  const accent = event.accent_color ?? '#C9A96E'

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Minimal nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E5E4' }}>
        <Link href="/" className="text-base font-semibold tracking-tight" style={{ color: '#1C1C1C' }}>
          fond
        </Link>
        <div className="flex gap-3">
          <Link href={`/e/${slug}/rsvp`}>
            <Button variant="secondary" size="sm">RSVP</Button>
          </Link>
          <Link href={`/e/${slug}/registry`}>
            <Button size="sm" style={{ background: accent }}>
              Give a gift
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="text-5xl mb-6">{EVENT_TYPE_EMOJIS[event.type]}</div>
        <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: accent }}>
          {EVENT_TYPE_LABELS[event.type]}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6" style={{ color: '#1C1C1C' }}>
          {event.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center justify-center gap-6 flex-wrap mb-8">
          {event.date && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
              <CalendarDays size={14} />
              {formatDate(event.date)}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
              <MapPin size={14} />
              {event.location}
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: '#6B7280' }}>
            {event.description}
          </p>
        )}
      </section>

      {/* Action cards */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/e/${slug}/rsvp`}
            className="rounded-2xl border p-6 transition-all hover:shadow-sm hover:-translate-y-0.5 group"
            style={{ background: 'white', borderColor: '#E5E5E4' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: '#F4F4F3' }}
            >
              <CheckSquare size={18} style={{ color: '#1C1C1C' }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: '#1C1C1C' }}>RSVP</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Let us know if you&apos;ll be joining us.
            </p>
          </Link>

          <Link
            href={`/e/${slug}/registry`}
            className="rounded-2xl border p-6 transition-all hover:shadow-sm hover:-translate-y-0.5 group"
            style={{ background: accent + '15', borderColor: accent + '40' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: accent + '25' }}
            >
              <Gift size={18} style={{ color: accent }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: '#1C1C1C' }}>
              {pool?.title ?? 'Gift fund'}
            </h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              {pool?.description ?? 'Contribute a gift to celebrate this occasion.'}
            </p>
            {totalRaised > 0 && (
              <p className="text-xs mt-2 font-medium" style={{ color: accent }}>
                £{(totalRaised / 100).toFixed(0)} raised so far
              </p>
            )}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center" style={{ borderColor: '#E5E5E4' }}>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Powered by <Link href="/" className="font-medium" style={{ color: accent }}>Fond</Link>
        </p>
      </footer>
    </div>
  )
}
