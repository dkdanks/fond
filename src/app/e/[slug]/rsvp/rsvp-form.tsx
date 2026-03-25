'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Check } from 'lucide-react'

export interface RsvpQuestion {
  id: string
  question: string
  type: 'yes_no' | 'text' | 'dropdown'
  options?: string[]
  required: boolean
}

interface Props {
  slug: string
  eventId: string
  eventTitle: string
  questions: RsvpQuestion[]
  primaryColor: string
  bgColor: string
  font: string
}

export default function RsvpForm({ slug, eventId, eventTitle, questions, primaryColor, bgColor, font }: Props) {
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    if (questions.some(q => q.id === 'attend')) init['attend'] = 'attending'
    return init
  })
  const [name, setName] = useState(searchParams.get('name') ?? '')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function setAnswer(qid: string, val: string) {
    setAnswers(prev => ({ ...prev, [qid]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const rsvpStatus = answers['attend'] === 'attending' ? 'attending' : 'declined'
    const msgParts = questions
      .filter(q => q.id !== 'attend' && answers[q.id])
      .map(q => `${q.question}: ${answers[q.id]}`)
    if (answers['_message']) msgParts.push(answers['_message'])
    const message = msgParts.length > 0 ? msgParts.join('\n') : null

    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('event_id', eventId)
      .eq('email', email)
      .single()

    if (existing) {
      await supabase
        .from('guests')
        .update({ rsvp_status: rsvpStatus, message, responded_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('guests').insert({
        event_id: eventId,
        name,
        email,
        rsvp_status: rsvpStatus,
        message,
        responded_at: new Date().toISOString(),
      })
    }

    setDone(true)
    setSubmitting(false)
  }

  const inputStyle = {
    borderColor: `${primaryColor}25`,
    background: `${primaryColor}05`,
    color: primaryColor,
  }

  if (done) {
    const attending = answers['attend'] === 'attending'
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: bgColor, fontFamily: `'${font}', sans-serif`, color: primaryColor }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
          style={{ background: attending ? `${primaryColor}15` : 'rgba(0,0,0,0.06)' }}
        >
          <Check size={24} style={{ color: attending ? primaryColor : '#6B7280' }} />
        </div>
        <h1 className="text-2xl font-semibold mb-2">
          {attending ? "You're going!" : "You're not able to make it"}
        </h1>
        <p className="text-sm mb-8" style={{ opacity: 0.6 }}>
          {attending
            ? "We're so excited to celebrate with you."
            : "Thanks for letting us know. You'll be missed!"}
        </p>
        <Link
          href={`/e/${slug}`}
          className="px-6 py-2.5 rounded-xl text-sm font-medium border transition-colors"
          style={{ borderColor: primaryColor, color: primaryColor }}
        >
          Back to event
        </Link>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: bgColor, fontFamily: `'${font}', sans-serif`, color: primaryColor }}
    >
      <nav
        className="px-6 py-4 border-b flex items-center gap-3"
        style={{ borderColor: `${primaryColor}15` }}
      >
        <Link
          href={`/e/${slug}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: primaryColor, opacity: 0.6, textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <span className="text-sm font-medium" style={{ color: primaryColor }}>
          {eventTitle}
        </span>
      </nav>

      <div className="max-w-lg mx-auto px-6 pt-12 pb-16">
        <h1 className="text-2xl font-semibold mb-1">RSVP</h1>
        <p className="text-sm mb-10" style={{ opacity: 0.5 }}>Let the hosts know your plans.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ opacity: 0.6 }}>Your name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none"
                style={inputStyle}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ opacity: 0.6 }}>Email *</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none"
                style={inputStyle}
                placeholder="jane@example.com"
              />
            </div>
          </div>

          {questions.filter(q => q.id === 'attend').map(q => (
            <div key={q.id}>
              <label className="block text-sm font-medium mb-3" style={{ color: primaryColor }}>
                {q.question}{q.required && <span style={{ opacity: 0.4 }}> *</span>}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'attending', label: "I'll be there" },
                  { val: 'declined', label: "Can't make it" },
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswer(q.id, val)}
                    className="py-3 rounded-xl text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: answers[q.id] === val ? primaryColor : `${primaryColor}20`,
                      background: answers[q.id] === val ? primaryColor : 'transparent',
                      color: answers[q.id] === val ? bgColor : primaryColor,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {answers['attend'] !== 'declined' && questions.filter(q => q.id !== 'attend').map(q => (
            <div key={q.id}>
              <label className="block text-sm font-medium mb-3" style={{ color: primaryColor }}>
                {q.question}{q.required && <span style={{ opacity: 0.4 }}> *</span>}
              </label>
              {q.type === 'yes_no' && (
                <div className="grid grid-cols-2 gap-3">
                  {['Yes', 'No'].map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAnswer(q.id, label)}
                      className="py-3 rounded-xl text-sm font-medium border-2 transition-all"
                      style={{
                        borderColor: answers[q.id] === label ? primaryColor : `${primaryColor}20`,
                        background: answers[q.id] === label ? primaryColor : 'transparent',
                        color: answers[q.id] === label ? bgColor : primaryColor,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  required={q.required}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none resize-none"
                  style={inputStyle}
                  placeholder="Your answer…"
                />
              )}
              {q.type === 'dropdown' && (
                <select
                  value={answers[q.id] ?? ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  required={q.required}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none"
                  style={inputStyle}
                >
                  <option value="">Select an option…</option>
                  {(q.options ?? []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: primaryColor }}>
              Message for the hosts{' '}
              <span style={{ opacity: 0.4, fontSize: '0.75rem', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={answers['_message'] ?? ''}
              onChange={e => setAnswer('_message', e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none resize-none"
              style={inputStyle}
              placeholder={answers['attend'] === 'declined' ? "Sorry I can't make it…" : "Can't wait to celebrate with you!"}
            />
          </div>

          {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || !name || !email}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: primaryColor,
              color: bgColor,
              opacity: submitting || !name || !email ? 0.5 : 1,
            }}
          >
            {submitting ? 'Sending…' : 'Send RSVP'}
          </button>
        </form>
      </div>
    </div>
  )
}
