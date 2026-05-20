'use client'

import type { Event } from '@/types'
import { EventPage } from '@/components/event/event-page'
import { usePublicGuestContext } from '@/lib/public-guest-context'

export function PublicEventShell({
  event,
  slug,
}: {
  event: Event
  slug: string
}) {
  const { withGuestContext } = usePublicGuestContext(slug)

  return (
    <EventPage
      event={event}
      rsvpHref={withGuestContext(`/e/${slug}/rsvp`)}
      registryHref={withGuestContext(`/e/${slug}/registry`)}
    />
  )
}
