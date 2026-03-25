import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend'
import { checkRateLimit, getIp } from '@/lib/rate-limit'
import { formatDate } from '@/lib/utils'

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

  // Pull event branding from saved palette / fallbacks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = (event.content ?? {}) as Record<string, any>
  const palette = content._palette as Record<string, string> | undefined
  const primaryColor = palette?.primary ?? event.primary_color ?? '#2C2B26'
  const bgColor = palette?.bg ?? event.accent_color ?? '#F5F0E8'
  const font = (content._font as string | undefined) ?? 'Inter'

  const dateLine = [
    event.date ? formatDate(event.date) : null,
    event.location ?? null,
  ].filter(Boolean).join(' · ')

  // Shared email shell — wraps any body content in the event's branded layout
  function emailShell(innerHtml: string) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:${bgColor};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:${bgColor};font-family:'${font}',Georgia,serif;color:${primaryColor};">

          <!-- Header: event name + date/location -->
          <tr>
            <td style="padding:48px 48px 36px;text-align:center;border-bottom:1px solid ${primaryColor}18;">
              <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.35;color:${primaryColor};">You&rsquo;re invited</p>
              <h1 style="margin:0 0 10px;font-size:34px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;color:${primaryColor};">${event.title}</h1>
              ${dateLine ? `<p style="margin:0;font-size:14px;opacity:0.5;color:${primaryColor};">${dateLine}</p>` : ''}
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding:36px 48px 32px;">
              ${innerHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 48px 32px;text-align:center;border-top:1px solid ${primaryColor}12;">
              <p style="margin:0;font-size:12px;opacity:0.3;color:${primaryColor};">Sent with <a href="${process.env.NEXT_PUBLIC_BASE_URL}" style="color:${primaryColor};text-decoration:none;opacity:0.5;">Joyabl</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }

  const results = await Promise.allSettled(
    guests.map(async (guest) => {
      const guestName = guest.name || 'there'
      const guestParam = new URLSearchParams({
        name: guest.name || '',
        email: guest.email || '',
      }).toString()
      const guestEventUrl = `${eventUrl}?${guestParam}`
      const guestRsvpUrl = `${eventUrl}/rsvp?${guestParam}`

      const emailSubject = subject ?? `You're invited to ${event.title}`

      const customBody = emailBody
        ? emailBody
            .replace(/\[Guest Name\]/g, guestName)
            .replace(new RegExp(eventUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), guestEventUrl)
        : null

      const btnPrimary = `display:inline-block;padding:14px 32px;background-color:${primaryColor};color:${bgColor};text-decoration:none;border-radius:100px;font-size:15px;font-weight:500;letter-spacing:-0.01em;`
      const btnOutline = `display:inline-block;padding:13px 32px;border:1.5px solid ${primaryColor};color:${primaryColor};text-decoration:none;border-radius:100px;font-size:15px;font-weight:500;letter-spacing:-0.01em;`

      const html = emailShell(
        customBody
          ? `${customBody.split('\n').map((line: string) =>
              line.trim()
                ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${primaryColor};">${line}</p>`
                : '<p style="margin:0 0 14px;">&nbsp;</p>'
            ).join('')}
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${guestEventUrl}" style="${btnPrimary}">View the event</a>
            </p>`
          : `<p style="margin:0 0 8px;font-size:16px;color:${primaryColor};opacity:0.55;">Hi ${guestName},</p>
             <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:${primaryColor};">${hostName} would love for you to join them to celebrate <strong>${event.title}</strong>.</p>
             <p style="margin:0;text-align:center;">
               <a href="${guestEventUrl}" style="${btnPrimary};margin-bottom:12px;">View the event</a>
             </p>
             <p style="margin:12px 0 0;text-align:center;">
               <a href="${guestRsvpUrl}" style="${btnOutline}">RSVP</a>
             </p>`
      )

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
