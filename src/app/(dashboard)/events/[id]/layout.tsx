import { requireOwnedEvent } from '@/lib/dashboard-server'
import { AppSidebar } from '@/components/app/sidebar'
import { canCreateAnotherUpcomingEvent } from '@/lib/events'
import type { Event } from '@/types'

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user, event, supabase } = await requireOwnedEvent<Event>(id, 'id, user_id, title, date')
  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAFAF7' }}>
      <AppSidebar
        eventId={id}
        userEmail={user.email}
        currentEventTitle={event.title}
        currentEventDate={event.date}
        events={events ?? []}
        canCreateEvent={canCreateAnotherUpcomingEvent(events ?? [])}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
