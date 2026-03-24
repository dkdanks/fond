'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Send, Users, Check, Loader2 } from 'lucide-react'

interface Guest {
  id: string
  name: string
  email: string
  rsvp_status: string
  invited_at: string | null
}

export default function GuestsEmailsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [guests, setGuests] = useState<Guest[]>([])
  const [subject, setSubject] = useState("You're invited!")
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [target, setTarget] = useState<'all' | 'uninvited' | 'pending'>('uninvited')
  const [eventTitle, setEventTitle] = useState('')
  const [eventSlug, setEventSlug] = useState('')

  const load = useCallback(async () => {
    const [{ data: guestData }, { data: eventData }] = await Promise.all([
      supabase.from('guests').select('*').eq('event_id', id).order('name'),
      supabase.from('events').select('title, slug').eq('id', id).single(),
    ])
    setGuests(guestData ?? [])
    if (eventData) {
      setEventTitle(eventData.title ?? '')
      setEventSlug(eventData.slug ?? '')
      setBody(`Hi [Guest Name],\n\nYou're invited to ${eventData.title}! We'd love to have you there.\n\nPlease RSVP at the link below:\n${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/e/${eventData.slug}\n\nWith love`)
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
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>
          Emails
        </h1>
        <p className="text-sm" style={{ color: '#8B8670' }}>
          Send invitation emails and follow-ups to your guest list
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Total guests', value: guests.length },
          { label: 'Invited', value: guests.filter(g => g.invited_at).length },
          { label: 'Not yet invited', value: guests.filter(g => !g.invited_at).length },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border p-5"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <p className="text-xs mb-2" style={{ color: '#B5A98A' }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color: '#2C2B26' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: '#E8E3D9' }}>
        <div className="p-6 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#2C2B26' }}>Compose email</h2>

          {/* Recipient target */}
          <div className="mb-4">
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
          <div className="mb-4">
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
          <div className="mb-6">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Message</label>
            <textarea
              className={`${inputCls} resize-none`}
              style={{ ...inputStyle, minHeight: 200 }}
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

        {/* Guest list preview */}
        <div className="p-6">
          <h3 className="text-sm font-medium mb-4" style={{ color: '#2C2B26' }}>
            Guests without an email address
          </h3>
          {guests.filter(g => !g.email).length === 0 ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#8B8670' }}>
              <Check size={14} style={{ color: '#4CAF50' }} />
              All guests have email addresses
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {guests.filter(g => !g.email).map(g => (
                <div key={g.id} className="flex items-center gap-2 py-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={{ background: '#F5F0E8', color: '#8B8670' }}
                  >
                    {g.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span className="text-sm" style={{ color: '#2C2B26' }}>{g.name}</span>
                  <span className="text-xs" style={{ color: '#D4CCBC' }}>No email</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
