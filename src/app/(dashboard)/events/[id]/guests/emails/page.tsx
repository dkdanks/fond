'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { guardEvent } from '@/lib/event-guard'
import { Check, Loader2, Monitor, Send, Smartphone } from 'lucide-react'
import { useToast } from '@/components/app/toast-provider'
import { DashboardErrorState, DashboardPage, DashboardPageHeader } from '@/components/dashboard/page-layout'
import { DashboardCard, DashboardCardDescription, DashboardCardTitle, DashboardStatCard } from '@/components/dashboard/surface'

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

type ComposeField = 'subject' | 'preview' | 'body'
type PreviewMode = 'desktop' | 'mobile'

const EMAIL_TEMPLATES = [
  {
    id: 'invitation',
    label: 'Invitation',
    subject: "You're invited to [Event Name]",
    previewText: 'Everything you need for the celebration, in one place.',
    body: `Hi [Guest Name],

We'd love for you to join us for [Event Name].

You can view the event details here:
[Event Link]

Please RSVP here:
[RSVP Link]

With love,
[Host Name]`,
  },
  {
    id: 'reminder',
    label: 'Reminder',
    subject: 'A quick reminder about [Event Name]',
    previewText: 'Just sharing the details again before the day arrives.',
    body: `Hi [Guest Name],

Just a quick reminder about [Event Name].

You can find the full details here:
[Event Link]

If you still need to reply, RSVP here:
[RSVP Link]

Looking forward to celebrating with you,
[Host Name]`,
  },
  {
    id: 'final-call',
    label: 'Last RSVP call',
    subject: 'Last chance to RSVP for [Event Name]',
    previewText: 'Please send your response so we can finalise everything.',
    body: `Hi [Guest Name],

We're finalising the plans for [Event Name] and would love to hear from you.

Please RSVP here when you can:
[RSVP Link]

Thank you,
[Host Name]`,
  },
] as const

const MERGE_TAGS = [
  { token: '[Guest Name]', label: 'Guest name' },
  { token: '[Event Name]', label: 'Event name' },
  { token: '[Host Name]', label: 'Host name' },
  { token: '[Event Link]', label: 'Event link' },
  { token: '[RSVP Link]', label: 'RSVP link' },
] as const

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function replacePreviewTokens(value: string, event: EventData) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  return value
    .replace(/\[Guest Name\]/g, 'Olivia')
    .replace(/\[Event Name\]/g, event.title)
    .replace(/\[Host Name\]/g, event.hostName)
    .replace(/\[Event Link\]/g, `${baseUrl}/e/${event.slug}`)
    .replace(/\[RSVP Link\]/g, `${baseUrl}/e/${event.slug}/rsvp`)
}

function buildPreviewHtml(body: string, event: EventData, previewText: string) {
  const { title, slug, date, location, primaryColor, bgColor, font } = event
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const eventUrl = `${baseUrl}/e/${slug}`
  const rsvpUrl = `${eventUrl}/rsvp`
  const dateLine = [date ? formatDate(date) : null, location].filter(Boolean).join(' · ')
  const resolvedBody = replacePreviewTokens(body, event)
  const resolvedPreviewText = replacePreviewTokens(previewText, event)

  const btnPrimary = `display:inline-block;padding:14px 32px;background-color:${primaryColor};color:${bgColor};text-decoration:none;border-radius:100px;font-size:15px;font-weight:500;letter-spacing:-0.01em;`
  const btnOutline = `display:inline-block;padding:13px 32px;border:1.5px solid ${primaryColor};color:${primaryColor};text-decoration:none;border-radius:100px;font-size:15px;font-weight:500;letter-spacing:-0.01em;`

  const bodyHtml = resolvedBody.trim()
    ? resolvedBody.split('\n').map(line =>
        line.trim()
          ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:${primaryColor};">${line}</p>`
          : '<p style="margin:0 0 14px;">&nbsp;</p>'
      ).join('')
    : `<p style="margin:0 0 8px;font-size:16px;color:${primaryColor};opacity:0.55;">Hi Olivia,</p>
       <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:${primaryColor};">${event.hostName} would love for you to join them for <strong>${title}</strong>.</p>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
              ${resolvedPreviewText}
            </div>
            ${bodyHtml}
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${eventUrl}" style="${btnPrimary}">View the event</a>
            </p>
            <p style="margin:12px 0 0;text-align:center;">
              <a href="${rsvpUrl}" style="${btnOutline}">RSVP</a>
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
  const toast = useToast()

  const [guests, setGuests] = useState<Guest[]>([])
  const [event, setEvent] = useState<EventData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState<string>(EMAIL_TEMPLATES[0].subject)
  const [previewText, setPreviewText] = useState<string>(EMAIL_TEMPLATES[0].previewText)
  const [body, setBody] = useState<string>(EMAIL_TEMPLATES[0].body)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [target, setTarget] = useState<'all' | 'uninvited' | 'pending'>('uninvited')
  const [focusedField, setFocusedField] = useState<ComposeField>('body')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  const subjectRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    setError(null)
    const userId = await guardEvent(id)
    if (!userId) {
      setError('You do not have access to this event.')
      return
    }
    try {
      const [{ data: guestData, error: err1 }, { data: ev, error: err2 }, { data: profile }] = await Promise.all([
        supabase.from('guests').select('*').eq('event_id', id).order('name'),
        supabase.from('events').select('title, slug, date, location, content, primary_color, accent_color').eq('id', id).single(),
        supabase.from('profiles').select('name').single(),
      ])
      if (err1) throw err1
      if (err2) throw err2
      setGuests(guestData ?? [])
      if (ev) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content = (ev.content ?? {}) as Record<string, any>
        const palette = content._palette as Record<string, string> | undefined
        const primaryColor = palette?.primary ?? ev.primary_color ?? '#2C2B26'
        const bgColor = palette?.bg ?? ev.accent_color ?? '#F5F0E8'
        const font = (content._displayFont as string | undefined) ?? (content._font as string | undefined) ?? 'Inter'

        setEvent({
          title: ev.title ?? '',
          slug: ev.slug ?? '',
          date: ev.date ?? null,
          location: ev.location ?? null,
          primaryColor,
          bgColor,
          font,
          hostName: (profile as { name?: string } | null)?.name ?? 'Your hosts',
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }, [id, supabase])

  useEffect(() => {
    void load()
  }, [load])

  const recipientCount = (() => {
    switch (target) {
      case 'all': return guests.filter(guest => guest.email).length
      case 'uninvited': return guests.filter(guest => guest.email && !guest.invited_at).length
      case 'pending': return guests.filter(guest => guest.email && guest.rsvp_status === 'pending').length
    }
  })()

  const previewHtml = useMemo(() => {
    if (!event) return ''
    return buildPreviewHtml(body, event, previewText)
  }, [body, event, previewText])

  function applyTemplate(templateId: string) {
    const template = EMAIL_TEMPLATES.find(item => item.id === templateId)
    if (!template) return
    setSubject(template.subject)
    setPreviewText(template.previewText)
    setBody(template.body)
    setFocusedField('body')
    bodyRef.current?.focus()
  }

  function insertToken(token: string) {
    const config = {
      subject: { value: subject, setter: setSubject, ref: subjectRef },
      preview: { value: previewText, setter: setPreviewText, ref: previewRef },
      body: { value: body, setter: setBody, ref: bodyRef },
    }[focusedField]

    const element = config.ref.current
    if (!element) {
      config.setter(`${config.value}${token}`)
      return
    }

    const start = element.selectionStart ?? config.value.length
    const end = element.selectionEnd ?? config.value.length
    const nextValue = `${config.value.slice(0, start)}${token}${config.value.slice(end)}`
    config.setter(nextValue)

    requestAnimationFrame(() => {
      element.focus()
      const cursor = start + token.length
      element.setSelectionRange(cursor, cursor)
    })
  }

  async function sendEmails() {
    setSending(true)
    try {
      const res = await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, target, subject, previewText, body }),
      })
      if (res.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 4000)
        toast.success(`Sent to ${recipientCount} guest${recipientCount !== 1 ? 's' : ''}`)
        void load()
      } else {
        toast.error('Failed to send emails. Please try again.')
      }
    } catch {
      toast.error('Failed to send emails. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#2C2B26]'
  const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }
  const resolvedSubject = event ? replacePreviewTokens(subject || 'No subject', event) : subject
  const resolvedPreviewText = event ? replacePreviewTokens(previewText || '', event) : previewText

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Emails"
        description="Compose invite emails with a clearer inbox preview and simple personalisation."
        className="mb-6"
      />

      <div className="mb-4 grid grid-cols-3 gap-2 md:mb-6 md:gap-3">
        {[
          { label: 'Total guests', value: guests.length },
          { label: 'Invited', value: guests.filter(guest => guest.invited_at).length },
          { label: 'Ready to send', value: recipientCount },
        ].map(({ label, value }) => (
          <DashboardStatCard
            key={label}
            label={label}
            value={value}
            sub=""
            className="[&>p:last-child]:hidden"
          />
        ))}
      </div>

      {error ? (
        <DashboardErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <DashboardCard className="overflow-hidden">
              <div className="border-b px-6 py-5" style={{ borderColor: '#F0EDE8' }}>
                <DashboardCardTitle>Compose</DashboardCardTitle>
                <DashboardCardDescription className="mt-1">
                  Best email editors keep the important bits close: audience, subject, preview text, message, and a live preview.
                </DashboardCardDescription>
              </div>

              <div className="flex flex-col gap-6 p-6">
                <div>
                  <label className="mb-2 block text-xs font-medium" style={{ color: '#8B8670' }}>Send to</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { val: 'uninvited', label: 'Not yet invited' },
                      { val: 'pending', label: 'Awaiting RSVP' },
                      { val: 'all', label: 'All guests' },
                    ] as const).map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => setTarget(val)}
                        className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
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
                  <p className="mt-2 text-xs" style={{ color: '#B5A98A' }}>
                    {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} will receive this email.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium" style={{ color: '#8B8670' }}>Quick start</label>
                  <div className="flex flex-wrap gap-2">
                    {EMAIL_TEMPLATES.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => applyTemplate(template.id)}
                        className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
                        style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: '#8B8670' }}>Subject line</label>
                    <input
                      ref={subjectRef}
                      className={inputCls}
                      style={inputStyle}
                      value={subject}
                      onFocus={() => setFocusedField('subject')}
                      onChange={event => setSubject(event.target.value)}
                      placeholder="You're invited to..."
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: '#8B8670' }}>Preview text</label>
                    <input
                      ref={previewRef}
                      className={inputCls}
                      style={inputStyle}
                      value={previewText}
                      onFocus={() => setFocusedField('preview')}
                      onChange={event => setPreviewText(event.target.value)}
                      placeholder="A short line that appears beside the subject"
                    />
                    <p className="mt-1.5 text-xs" style={{ color: '#B5A98A' }}>
                      This is the line guests see next to the subject in their inbox.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium" style={{ color: '#8B8670' }}>Personalisation</label>
                  <div className="flex flex-wrap gap-2">
                    {MERGE_TAGS.map(tag => (
                      <button
                        key={tag.token}
                        type="button"
                        onClick={() => insertToken(tag.token)}
                        className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ borderColor: '#E8E3D9', background: '#FFFFFF', color: '#2C2B26' }}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs" style={{ color: '#B5A98A' }}>
                    Click a token to insert it into the field you are editing.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#8B8670' }}>Message</label>
                  <textarea
                    ref={bodyRef}
                    className={`${inputCls} resize-none`}
                    style={{ ...inputStyle, minHeight: 280 }}
                    value={body}
                    onFocus={() => setFocusedField('body')}
                    onChange={event => setBody(event.target.value)}
                    placeholder="Write your message..."
                  />
                  <p className="mt-2 text-xs" style={{ color: '#B5A98A' }}>
                    Keep it personal and direct. The event and RSVP buttons are added automatically below.
                  </p>
                </div>

                <button
                  onClick={sendEmails}
                  disabled={sending || recipientCount === 0}
                  className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all"
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
            </DashboardCard>

            <DashboardCard className="overflow-hidden">
              <div className="border-b px-6 py-5" style={{ borderColor: '#F0EDE8' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DashboardCardTitle>Preview</DashboardCardTitle>
                    <DashboardCardDescription className="mt-1">
                      Subject, preview text, and mobile layout all matter before the message is opened.
                    </DashboardCardDescription>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl p-0.5" style={{ background: '#F5F0E8' }}>
                    {(['desktop', 'mobile'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreviewMode(mode)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                        style={{
                          background: previewMode === mode ? 'white' : 'transparent',
                          color: previewMode === mode ? '#2C2B26' : '#8B8670',
                          boxShadow: previewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {mode === 'desktop' ? <Monitor size={12} /> : <Smartphone size={12} />}
                        {mode === 'desktop' ? 'Desktop' : 'Mobile'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-2xl border p-4" style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}>
                  <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: '#B5A98A' }}>
                    Inbox preview
                  </p>
                  <div className="rounded-xl border bg-white px-4 py-3" style={{ borderColor: '#F0EDE8' }}>
                    <p className="text-xs font-medium" style={{ color: '#2C2B26' }}>
                      {event?.hostName ?? 'Your hosts'} via Joyabl
                    </p>
                    <p className="mt-1 text-sm font-medium" style={{ color: '#2C2B26' }}>
                      {resolvedSubject || 'No subject'}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: '#8B8670' }}>
                      {resolvedPreviewText || 'Add preview text to shape what guests see in their inbox.'}
                    </p>
                  </div>
                </div>

                <div
                  className="mx-auto overflow-hidden rounded-[28px] border bg-white shadow-sm"
                  style={{
                    width: '100%',
                    maxWidth: previewMode === 'mobile' ? 360 : '100%',
                    borderColor: '#E8E3D9',
                  }}
                >
                  <div className="border-b px-4 py-3 text-xs" style={{ borderColor: '#F0EDE8', color: '#8B8670' }}>
                    {event?.hostName ?? 'Your hosts'} via Joyabl
                  </div>
                  <div style={{ height: previewMode === 'mobile' ? 620 : 700, overflow: 'hidden' }}>
                    {previewHtml ? (
                      <iframe
                        srcDoc={previewHtml}
                        className="h-full w-full border-0"
                        title="Email preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center" style={{ color: '#D4CCBC' }}>
                        <p className="text-sm">Loading preview…</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>

          {guests.filter(guest => !guest.email).length > 0 && (
            <DashboardCard className="mt-6 p-5">
              <DashboardCardTitle className="mb-3">Guests without an email address</DashboardCardTitle>
              <DashboardCardDescription className="mb-3">
                These guests will be skipped until an email address is added.
              </DashboardCardDescription>
              <div className="flex flex-wrap gap-2">
                {guests.filter(guest => !guest.email).map(guest => (
                  <div key={guest.id} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs" style={{ background: '#F5F0E8', color: '#8B8670' }}>
                    <span className="font-medium">{guest.name}</span>
                    <span style={{ color: '#C8BFA8' }}>no email</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </>
      )}
    </DashboardPage>
  )
}
