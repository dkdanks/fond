import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJIS, type Event, type EventContent } from '@/types'
import { formatDate } from '@/lib/utils'
import { MapPin, CalendarDays, Gift, CheckSquare, Clock, ExternalLink } from 'lucide-react'
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
  const content: EventContent = event.content ?? {}

  const { data: funds } = await supabase.from('registry_pools').select('title, description').eq('event_id', event.id)
  const { data: contributions } = await supabase.from('contributions').select('amount').eq('event_id', event.id).eq('status', 'completed')
  const totalRaised = contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0

  const accent = event.accent_color ?? '#C9A96E'

  const hasSchedule = content.schedule && content.schedule.length > 0
  const hasStory = content.our_story?.text
  const hasAttire = content.attire?.dress_code || content.attire?.notes
  const hasTravel = content.travel?.notes || (content.travel?.hotels && content.travel.hotels.length > 0)
  const hasFaq = content.faq && content.faq.length > 0

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b bg-white sticky top-0 z-10" style={{ borderColor: '#E5E5E4' }}>
        <Link href="/" className="text-base font-semibold tracking-tight" style={{ color: '#1C1C1C' }}>fond</Link>
        <div className="flex gap-3">
          <Link href={`/e/${slug}/rsvp`}><Button variant="secondary" size="sm">RSVP</Button></Link>
          <Link href={`/e/${slug}/registry`}><Button size="sm" style={{ background: accent }}>Give a gift</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      {event.cover_image_url ? (
        <div
          className="w-full h-72 sm:h-96 bg-cover bg-center"
          style={{ backgroundImage: `url(${event.cover_image_url})` }}
        />
      ) : null}

      <section className="max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="text-5xl mb-6">{EVENT_TYPE_EMOJIS[event.type]}</div>
        <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: accent }}>
          {EVENT_TYPE_LABELS[event.type]}
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6" style={{ color: '#1C1C1C' }}>
          {event.title}
        </h1>
        <div className="flex items-center justify-center gap-6 flex-wrap mb-8">
          {event.date && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
              <CalendarDays size={14} />{formatDate(event.date)}
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
              <MapPin size={14} />{event.location}
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
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/e/${slug}/rsvp`}
            className="rounded-2xl border p-6 transition-all hover:shadow-sm hover:-translate-y-0.5"
            style={{ background: 'white', borderColor: '#E5E5E4' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#F4F4F3' }}>
              <CheckSquare size={18} style={{ color: '#1C1C1C' }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: '#1C1C1C' }}>RSVP</h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Let us know if you&apos;ll be joining us.</p>
          </Link>

          <Link
            href={`/e/${slug}/registry`}
            className="rounded-2xl border p-6 transition-all hover:shadow-sm hover:-translate-y-0.5"
            style={{ background: accent + '15', borderColor: accent + '40' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: accent + '25' }}>
              <Gift size={18} style={{ color: accent }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ color: '#1C1C1C' }}>
              {funds && funds.length > 0 ? (funds.length === 1 ? funds[0].title : `${funds.length} gift funds`) : 'Gift fund'}
            </h3>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              {funds?.[0]?.description ?? 'Contribute a gift to celebrate this occasion.'}
            </p>
            {totalRaised > 0 && (
              <p className="text-xs mt-2 font-medium" style={{ color: accent }}>
                ${(totalRaised / 100).toFixed(0)} raised so far
              </p>
            )}
          </Link>
        </div>
      </section>

      {/* Divider only if there's content below */}
      {(hasStory || hasSchedule || hasAttire || hasTravel || hasFaq) && (
        <div className="max-w-2xl mx-auto px-6">
          <div className="border-t" style={{ borderColor: '#E5E5E4' }} />
        </div>
      )}

      {/* Our Story */}
      {hasStory && (
        <section className="max-w-2xl mx-auto px-6 py-16">
          <SectionLabel accent={accent}>Our story</SectionLabel>
          <div className={`gap-8 ${content.our_story?.photo_url ? 'grid grid-cols-1 sm:grid-cols-2 items-start' : ''}`}>
            {content.our_story?.photo_url && (
              <div
                className="w-full h-64 rounded-2xl bg-cover bg-center order-last sm:order-first"
                style={{ backgroundImage: `url(${content.our_story.photo_url})` }}
              />
            )}
            <p className="text-base leading-loose whitespace-pre-wrap" style={{ color: '#4B5563' }}>
              {content.our_story?.text}
            </p>
          </div>
        </section>
      )}

      {/* Schedule */}
      {hasSchedule && (
        <section className="max-w-2xl mx-auto px-6 py-16">
          <SectionLabel accent={accent}>The day</SectionLabel>
          <div className="flex flex-col gap-0">
            {content.schedule!.map((item, idx) => (
              <div key={item.id} className="flex gap-6">
                {/* Timeline spine */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ background: accent }}
                  />
                  {idx < content.schedule!.length - 1 && (
                    <div className="w-px flex-1 mt-2" style={{ background: '#E5E5E4', minHeight: 48 }} />
                  )}
                </div>

                {/* Content */}
                <div className="pb-10">
                  <h3 className="font-semibold text-base mb-1" style={{ color: '#1C1C1C' }}>{item.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                    {item.time && (
                      <span className="text-sm flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                        <Clock size={13} /> {item.time}
                      </span>
                    )}
                    {item.venue && (
                      <span className="text-sm" style={{ color: '#6B7280' }}>{item.venue}</span>
                    )}
                  </div>
                  {item.address && (
                    <p className="text-sm mb-2" style={{ color: '#9CA3AF' }}>{item.address}</p>
                  )}
                  {item.notes && (
                    <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Attire */}
      {hasAttire && (
        <section className="max-w-2xl mx-auto px-6 py-16">
          <SectionLabel accent={accent}>Dress code</SectionLabel>
          {content.attire?.dress_code && (
            <p
              className="text-2xl font-semibold mb-4"
              style={{ color: '#1C1C1C' }}
            >
              {content.attire.dress_code}
            </p>
          )}
          {content.attire?.notes && (
            <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>
              {content.attire.notes}
            </p>
          )}
        </section>
      )}

      {/* Travel */}
      {hasTravel && (
        <section className="max-w-2xl mx-auto px-6 py-16">
          <SectionLabel accent={accent}>Getting there</SectionLabel>
          {content.travel?.notes && (
            <p className="text-base leading-relaxed mb-8 whitespace-pre-wrap" style={{ color: '#6B7280' }}>
              {content.travel.notes}
            </p>
          )}
          {content.travel?.hotels && content.travel.hotels.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-4" style={{ color: '#1C1C1C' }}>Recommended hotels</p>
              <div className="flex flex-col gap-3">
                {content.travel.hotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    className="rounded-2xl border p-5"
                    style={{ background: 'white', borderColor: '#E5E5E4' }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium mb-1" style={{ color: '#1C1C1C' }}>{hotel.name}</p>
                        {hotel.notes && (
                          <p className="text-sm" style={{ color: '#6B7280' }}>{hotel.notes}</p>
                        )}
                      </div>
                      {hotel.url && (
                        <a
                          href={hotel.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium"
                          style={{ color: accent }}
                        >
                          Book <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* FAQ */}
      {hasFaq && (
        <section className="max-w-2xl mx-auto px-6 py-16">
          <SectionLabel accent={accent}>Questions</SectionLabel>
          <div className="flex flex-col gap-6">
            {content.faq!.map((item) => (
              <div key={item.id}>
                <p className="font-medium mb-2" style={{ color: '#1C1C1C' }}>{item.question}</p>
                <p className="text-base leading-relaxed" style={{ color: '#6B7280' }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8 text-center mt-8" style={{ borderColor: '#E5E5E4' }}>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          Powered by <Link href="/" className="font-medium" style={{ color: accent }}>Fond</Link>
        </p>
      </footer>
    </div>
  )
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div className="mb-8">
      <div className="w-8 h-0.5 mb-4 rounded-full" style={{ background: accent }} />
      <h2 className="text-2xl font-semibold" style={{ color: '#1C1C1C' }}>{children}</h2>
    </div>
  )
}
