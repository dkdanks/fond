'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Check } from 'lucide-react'

type Status = 'attending' | 'declined'

export default function RsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('attending')
  const [message, setMessage] = useState('')
  const [plusOne, setPlusOne] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!event) {
      setError('Event not found.')
      setSubmitting(false)
      return
    }

    // Check if guest exists (invited), update if so, insert if not
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('event_id', event.id)
      .eq('email', email)
      .single()

    if (existing) {
      await supabase
        .from('guests')
        .update({ rsvp_status: status, message, plus_one: plusOne, responded_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('guests')
        .insert({ event_id: event.id, name, email, rsvp_status: status, message, plus_one: plusOne, responded_at: new Date().toISOString() })
    }

    setDone(true)
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FAFAF9' }}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
          style={{ background: status === 'attending' ? '#E8F4F0' : '#F4F4F3' }}
        >
          <Check size={24} style={{ color: status === 'attending' ? '#2D7A5A' : '#6B7280' }} />
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1C1C1C' }}>
          {status === 'attending' ? "You're going!" : "You're not able to make it"}
        </h1>
        <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
          {status === 'attending'
            ? "We're so excited to celebrate with you."
            : "Thanks for letting us know. You'll be missed!"}
        </p>
        <Link href={`/e/${slug}`}>
          <Button variant="secondary">Back to event</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#E5E5E4' }}>
        <Link href={`/e/${slug}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
        <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>RSVP</span>
      </nav>

      <div className="max-w-md mx-auto px-6 pt-12">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>Will you be joining us?</h1>
        <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
          Let the hosts know your plans.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Attending toggle */}
          <div className="grid grid-cols-2 gap-3">
            {(['attending', 'declined'] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className="py-3 rounded-[10px] text-sm font-medium border-2 transition-all"
                style={{
                  borderColor: status === s ? '#1C1C1C' : '#E5E5E4',
                  background: status === s ? '#1C1C1C' : 'white',
                  color: status === s ? 'white' : '#6B7280',
                }}
              >
                {s === 'attending' ? "I'll be there" : "Can't make it"}
              </button>
            ))}
          </div>

          <Input label="Your name" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

          {status === 'attending' && (
            <label className="flex items-center gap-3 cursor-pointer text-sm" style={{ color: '#1C1C1C' }}>
              <input
                type="checkbox"
                checked={plusOne}
                onChange={(e) => setPlusOne(e.target.checked)}
                className="w-4 h-4 accent-[#1C1C1C]"
              />
              I&apos;m bringing a +1
            </label>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
              Message for the hosts (optional)
            </label>
            <textarea
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
              style={{ borderColor: '#E5E5E4', minHeight: 80 }}
              placeholder="Can't wait to celebrate with you!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Sending…' : 'Send RSVP'}
          </Button>
        </form>
      </div>
    </div>
  )
}
