import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EventPage } from '@/components/event/event-page'

export default async function PreviewEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: eventData } = await supabase
    .from('events')
    .select('*, access_password')
    .eq('id', id)
    .single()

  if (!eventData) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', background: '#FAFAF7', color: '#2C2B26', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Event not found</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.5 }}>This event may have been deleted or you may not have access.</p>
          <Link href="/events" style={{ display: 'inline-block', marginTop: '1.5rem', fontSize: '0.875rem', textDecoration: 'underline', opacity: 0.6 }}>Back to events</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-4 py-2 text-xs"
        style={{ background: '#2C2B26', color: '#FAFAF7' }}
      >
        <span>Preview mode — this is how your guests will see it</span>
        <a href={`/events/${id}/website`} className="underline opacity-70 hover:opacity-100">← Back to editor</a>
      </div>

      <EventPage
        event={eventData}
        rsvpHref={`/e/${eventData.slug}/rsvp`}
        registryHref={`/events/${id}/preview/registry`}
        topPaddingClassName="pt-9"
      />
    </>
  )
}
