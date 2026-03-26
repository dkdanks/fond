'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Check, Loader2 } from 'lucide-react'

interface Guest {
  id: string
  name: string
  email: string
  rsvp_status: string
  invited_at: string | null
}

interface EventData {
  title: string
  slug: string
  date: string | null
  location: string | null
  primaryColor: string
  bgColor: string
  font: string
  hostName: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildPreviewHtml(body: string, event: EventData) {
  const { title, slug, date, location, primaryColor, bgColor, font } = event
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const eventUrl = `${baseUrl}/e/${slug}`
  const dateLine = [date ? formatDate(date) : null, location].filter(Boolean).join(' · ')

  const btnPrimary = `display:inline-block;padding:14px 32px;background-color:${primaryColor};color:${bgColor};text-decoration:none;border-radius:100px;font-size:15px;font-weight:500;letter-spacing:-0.01em;`
  const btnOutline = `display:inline-block;padding:13px 32px;border:1.5px solid ${primaryColor};color:${primaryColor};text-decoration:none;border-radius:100px;font-size:15px;font-weight:500;letter-spacing:-0.01em;`

  const bodyHtml = body.trim()
    ? body.split('\n').map(line =>
        line.trim()
          ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${primaryColor};">${line}</p>`
          : '<p style="margin:0 0 14px;">&nbsp;</p>'
      ).join('')
    : `<p style="margin:0 0 8px;font-size:16px;color:${primaryColor};opacity:0.55;">Hi [Guest Name],</p>
       <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:${primaryColor};">${event.hostName} would love for you to join them to celebrate <strong>${title}</strong>.</p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:${bgColor};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${bgColor};padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:${bgColor};font-family:'${font}',Georgia,serif;color:${primaryColor};">
        <tr>
          <td style="padding:48px 48px 36px;text-align:center;border-bottom:1px solid ${primaryColor}30;">
            <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.35;color:${primaryColor};">You&rsquo;re invited</p>
            <h1 style="margin:0 0 10px;font-size:32px;font-weight:600;letter-spacing:-0.02em;line-height:1.15;color:${primaryColor};">${title}</h1>
            ${dateLine ? `<p style="margin:0;font-size:14px;opacity:0.5;color:${primaryColor};">${dateLine}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding:36px 48px 32px;">
            ${bodyHtml}
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${eventUrl}" style="${btnPrimary}">View the event</a>
            </p>
            <p style="margin:12px 0 0;text-align:center;">
              <a href="${eventUrl}/rsvp" style="${btnOutline}">RSVP</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 48px 32px;text-align:center;border-top:1px solid ${primaryColor}20;">
            <p style="margin:0;font-size:12px;opacity:0.3;color:${primaryColor};">Sent with Joyabl</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export default function GuestsEmailsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [guests, setGuests] = useState<Guest[]>([])
  const [event, setEvent] = useState<EventData | null>(null)
  const [subject, setSubject] = useState("You're invited!")
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [target, setTarget] = useState<'all' | 'uninvited' | 'pending'>('uninvited')

  const load = useCallback(async () => {
    const [{ data: guestData }, { data: ev }, { data: profile }] = await Promise.all([
      supabase.from('guests').select('*').eq('event_id', id).order('name'),
      supabase.from('events').select('title, slug, date, location, content, primary_color, accent_color').eq('id', id).single(),
      supabase.from('profiles').select('name').single(),
    ])
    setGuests(guestData ?? [])
    if (ev) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const content = (ev.content ?? {}) as Record<string, any>
      const palette = content._palette as Record<string, string> | undefined
      const primaryColor = palette?.primary ?? ev.primary_color ?? '#2C2B26'
      const bgColor = palette?.bg ?? ev.accent_color ?? '#F5F0E8'
      const font = (content._font as string | undefined) ?? 'Inter'
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      const eventData: EventData = {
        title: ev.title ?? '',
        slug: ev.slug ?? '',
        date: ev.date ?? null,
        location: ev.location ?? null,
        primaryColor,
        bgColor,
        font,
        hostName: (profile as { name?: string } | null)?.name ?? 'Your hosts',
      }
      setEvent(eventData)
      setBody(`Hi [Guest Name],\n\nYou're invited to ${ev.title}! We'd love to have you there.\n\nPlease RSVP at the link below:\n${baseUrl}/e/${ev.slug}\n\nWith love`)
    }
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  const recipientCount = (() => {
    switch (target) {
      case 'all': return guests.filter(g => g.email).length
      case 'uninvited': return guests.filter(g => g.email && !g.invited_at).length
      case 'pending': return guests.filter(g => g.email && g.rsvp_status === 'pending').length
    }
  })()

  const previewHtml = useMemo(() => {
    if (!event) return ''
    return buildPreviewHtml(body, event)
  }, [body, event])

  async function sendEmails() {
    setSending(true)
    try {
      const res = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, target, subject, body }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 4000)
        load()
      }
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
  const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>Emails</h1>
        <p className="text-sm" style={{ color: '#8B8670' }}>Send invitation emails and follow-ups to your guest list</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
        {[
          { label: 'Total guests', value: guests.length },
          { label: 'Invited', value: guests.filter(g => g.invited_at).length },
          { label: 'Not yet invited', value: guests.filter(g => !g.invited_at).length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border p-3 md:p-5" style={{ background: 'white', borderColor: '#E8E3D9' }}>
            <p className="text-xs mb-2" style={{ color: '#B5A98A' }}>{label}</p>
            <p className="text-xl md:text-2xl font-semibold" style={{ color: '#2C2B26' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

        {/* Left: compose */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: '#E8E3D9' }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: '#F0EDE8' }}>
            <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Compose</p>
          </div>
          <div className="p-6 flex flex-col gap-5">

            {/* Send to */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Send to</label>
              <div className="flex gap-2">
                {([
                  { val: 'uninvited', label: 'Not yet invited' },
                  { val: 'pending', label: 'Awaiting RSVP' },
                  { val: 'all', label: 'All guests' },
                ] as const).map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => setTarget(val)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                    style={{
                      background: target === val ? '#2C2B26' : 'white',
                      color: target === val ? 'white' : '#8B8670',
                      borderColor: target === val ? '#2C2B26' : '#E8E3D9',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: '#B5A98A' }}>
                {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} will receive this email
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Subject</label>
              <input
                className={inputCls}
                style={inputStyle}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Subject line…"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Message</label>
              <textarea
                className={`${inputCls} resize-none`}
                style={{ ...inputStyle, minHeight: 220 }}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Your message…"
              />
              <p className="text-xs mt-1.5" style={{ color: '#B5A98A' }}>
                Use [Guest Name] as a placeholder — it will be replaced with each guest&apos;s name.
              </p>
            </div>

            <button
              onClick={sendEmails}
              disabled={sending || recipientCount === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: sent ? '#4CAF50' : recipientCount === 0 ? '#E8E3D9' : '#2C2B26',
                color: recipientCount === 0 ? '#B5A98A' : 'white',
              }}
            >
              {sending ? (
                <><Loader2 size={14} className="animate-spin" /> Sending…</>
              ) : sent ? (
                <><Check size={14} /> Sent!</>
              ) : (
                <><Send size={14} /> Send to {recipientCount} guest{recipientCount !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>
        </div>

        {/* Right: preview */}
        <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: '#E8E3D9' }}>
          {/* Mock email chrome */}
          <div className="px-6 py-5 border-b" style={{ borderColor: '#F0EDE8' }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#2C2B26' }}>Preview</p>
            <div className="flex flex-col gap-1.5 text-xs" style={{ color: '#8B8670' }}>
              <div className="flex gap-2">
                <span style={{ color: '#B5A98A', minWidth: 40 }}>From</span>
                <span style={{ color: '#2C2B26' }}>{event?.hostName ?? '—'} via Joyabl &lt;hello@joyabl.com&gt;</span>
              </div>
              <div className="flex gap-2">
                <span style={{ color: '#B5A98A', minWidth: 40 }}>Subject</span>
                <span style={{ color: '#2C2B26' }}>{subject || '—'}</span>
              </div>
            </div>
          </div>
          {/* Rendered email */}
          <div style={{ height: 560, overflow: 'hidden' }}>
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full border-0"
                title="Email preview"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="h-full flex items-center justify-center" style={{ color: '#D4CCBC' }}>
                <p className="text-sm">Loading preview…</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Guests without email */}
      {guests.filter(g => !g.email).length > 0 && (
        <div className="mt-6 rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E8E3D9' }}>
          <p className="text-sm font-medium mb-3" style={{ color: '#2C2B26' }}>Guests without an email address</p>
          <div className="flex flex-wrap gap-2">
            {guests.filter(g => !g.email).map(g => (
              <div key={g.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: '#F5F0E8', color: '#8B8670' }}>
                <span className="font-medium">{g.name}</span>
                <span style={{ color: '#C8BFA8' }}>no email</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
