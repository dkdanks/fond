import type { Event } from '@/types'

export type EventLifecycleStatus = 'coming_up' | 'complete'

export function getEventLifecycleStatus(date: string | null): EventLifecycleStatus {
  if (!date) return 'coming_up'

  const eventDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eventDate.setHours(0, 0, 0, 0)

  return eventDate < today ? 'complete' : 'coming_up'
}

export function isUpcomingEvent(date: string | null) {
  return getEventLifecycleStatus(date) === 'coming_up'
}

export function canCreateAnotherUpcomingEvent(events: Array<Pick<Event, 'date'>>) {
  return events.filter(event => isUpcomingEvent(event.date)).length < 3
}
