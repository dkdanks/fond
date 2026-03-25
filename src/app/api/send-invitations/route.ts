import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`send-inv:${getIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  const body = await req.json()
  const { eventId, guestIds, target, subject, body: emailBody } = body

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

  // Resolve guest list
  let query = supabase.from('guests').select('*').eq('event_id', eventId)

  if (guestIds?.length) {
    query = query.in('id', guestIds)
  } else if (target === 'all') {
    query = query.not('email', 'is', null).neq('email', '')
  } else if (target === 'pending') {
    query = query.eq('rsvp_status', 'pending').not('email', 'is', null).neq('email', '')
  } else {
    // uninvited (default)
    query = query.is('invitation_sent_at', null).not('email', 'is', null).neq('email', '')
  }

  const { data: guests } = await query
  if (!guests?.length) return NextResponse.json({ sent: 0, failed: 0 })

  const hostName = (event.profiles as { name?: string } | null)?.name ?? event.host_name ?? 'Your hosts'
  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/e/${event.slug}`

  const results = await Promise.allSettled(
    guests.map(async (guest) => {
      const guestName = guest.name || 'there'

      // Use custom subject/body if provided, otherwise default template
      const emailSubject = subject ?? `You're invited to ${event.title}`
      const customBody = emailBody
        ? emailBody.replace(/\[Guest Name\]/g, guestName)
        : null

      const html = customBody
        ? `<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2C2B26;">
            ${customBody.split('\n').map((line: string) => `<p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px;">${line}</p>`).join('')}
            <a href="${eventUrl}" style="display: inline-block; margin-top: 24px; padding: 14px 28px; background: #2C2B26; color: #F5F0E8; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500;">View event →</a>
            <p style="margin-top: 48px; font-size: 13px; color: #B5A98A;">Sent with <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #8B8670; text-decoration: none;">Joyabl</a></p>
           </div>`
        : `<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #2C2B26;">
            <h1 style="font-size: 28px; font-weight: 600; margin-bottom: 8px;">You're invited</h1>
            <p style="font-size: 16px; color: #8B8670; margin-bottom: 32px;">Hi ${guestName},</p>
            <p style="font-size: 16px; line-height: 1.6; color: #2C2B26;">${hostName} has invited you to celebrate <strong>${event.title}</strong>.</p>
            <a href="${eventUrl}" style="display: inline-block; margin-top: 32px; padding: 14px 28px; background: #2C2B26; color: #F5F0E8; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 500;">View the event →</a>
            <p style="margin-top: 48px; font-size: 13px; color: #B5A98A;">Sent with <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color: #8B8670; text-decoration: none;">Joyabl</a></p>
           </div>`

      await resend.emails.send({
        from: `${hostName} via Joyabl <hello@joyabl.com>`,
        to: guest.email,
        subject: emailSubject,
        html,
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
