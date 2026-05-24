import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PasswordGate } from '@/components/event/password-gate'
import { PublicEventShell } from '@/components/event/public-event-shell'
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
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const eventData = await getPublicEventBySlug(slug)
  if (!eventData) notFound()

  const page = <PublicEventShell event={eventData} slug={slug} />

  if (eventData.access_password) {
    return <PasswordGate correctPassword={eventData.access_password}>{page}</PasswordGate>
  }

  return page
}
