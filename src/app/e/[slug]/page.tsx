import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PasswordGate } from '@/components/event/password-gate'
import { EventPage } from '@/components/event/event-page'
import { getPublicEventBySlug } from '@/lib/public-events'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  return {
    title: event?.title ?? 'Event',
    description: event?.description ?? "You're invited",
  }
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ name?: string; email?: string }>
}) {
  const { slug } = await params
  const { name: guestName, email: guestEmail } = await searchParams
  const guestParamStr = guestName || guestEmail
    ? `?${new URLSearchParams({ ...(guestName ? { name: guestName } : {}), ...(guestEmail ? { email: guestEmail } : {}) }).toString()}`
    : ''

  const eventData = await getPublicEventBySlug(slug)
  if (!eventData) notFound()

  const page = (
    <EventPage
      event={eventData}
      rsvpHref={`/e/${slug}/rsvp${guestParamStr}`}
      registryHref={`/e/${slug}/registry${guestParamStr}`}
    />
  )

  if (eventData.access_password) {
    return <PasswordGate correctPassword={eventData.access_password}>{page}</PasswordGate>
  }

  return page
}
