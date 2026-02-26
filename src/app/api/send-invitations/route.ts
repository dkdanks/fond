import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvitation } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { eventId, guestIds } = await req.json()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: event } = await supabase
    .from('events')
    .select('*, profiles(name)')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: guests } = await supabase
    .from('guests')
    .select('*')
    .in('id', guestIds)
    .eq('event_id', eventId)

  if (!guests) return NextResponse.json({ error: 'No guests found' }, { status: 400 })

  const results = await Promise.allSettled(
    guests.map(async (guest) => {
      await sendInvitation({
        to: guest.email,
        guestName: guest.name,
        eventTitle: event.title,
        eventType: event.type,
        eventSlug: event.slug,
        hostName: event.profiles?.name ?? 'Your host',
      })
      await supabase
        .from('guests')
        .update({ invitation_sent_at: new Date().toISOString() })
        .eq('id', guest.id)
    })
  )

  const failed = results.filter(r => r.status === 'rejected').length
  return NextResponse.json({ sent: guests.length - failed, failed })
}
