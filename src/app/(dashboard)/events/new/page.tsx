'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  EVENT_TYPE_LABELS, EVENT_TYPE_DESCRIPTIONS, EVENT_TYPE_EMOJIS,
  EVENT_TYPE_COLORS, type EventType
} from '@/types'
import { slugify } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

const EVENT_TYPES: EventType[] = ['wedding', 'baby_shower', 'mitzvah', 'housewarming']

const ACCENT_PRESETS = [
  '#C9A96E', '#D4956A', '#A8C5B8', '#D4AF37',
  '#E8A0A0', '#A0B4E8', '#B4A0E8', '#A0E8B4',
]

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<EventType>('wedding')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [accentColor, setAccentColor] = useState('#C9A96E')
  const [poolTitle, setPoolTitle] = useState('')
  const [poolDescription, setPoolDescription] = useState('')

  function handleTypeSelect(t: EventType) {
    setType(t)
    setAccentColor(EVENT_TYPE_COLORS[t].accent)
    if (!poolTitle) setPoolTitle(defaultPoolTitle(t))
  }

  function defaultPoolTitle(t: EventType) {
    const defaults: Record<EventType, string> = {
      wedding: 'Our Honeymoon Fund',
      baby_shower: 'Baby Essentials Fund',
      birthday: 'Birthday Fund',
      mitzvah: 'Celebration Fund',
      housewarming: 'Home Sweet Home Fund',
    }
    return defaults[t]
  }

  async function handlePublish() {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const slug = slugify(title) + '-' + Math.random().toString(36).slice(2, 7)

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        type,
        title,
        slug,
        date: date || null,
        location: location || null,
        description: description || null,
        accent_color: accentColor,
        status: 'published',
      })
      .select()
      .single()

    if (eventError || !event) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    await supabase.from('registry_pools').insert({
      event_id: event.id,
      title: poolTitle || defaultPoolTitle(type),
      description: poolDescription || null,
    })

    router.push(`/events/${event.id}`)
  }

  const canProceedStep1 = type !== null
  const canProceedStep2 = title.trim().length > 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors"
              style={{
                background: step > s ? '#1C1C1C' : step === s ? '#1C1C1C' : '#E5E5E4',
                color: step >= s ? 'white' : '#9CA3AF',
              }}
            >
              {step > s ? <Check size={12} /> : s}
            </div>
            {s < 3 && (
              <div
                className="h-px w-12 transition-colors"
                style={{ background: step > s ? '#1C1C1C' : '#E5E5E4' }}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-sm" style={{ color: '#6B7280' }}>
          {step === 1 && 'Choose event type'}
          {step === 2 && 'Event details'}
          {step === 3 && 'Your gift fund'}
        </span>
      </div>

      {/* Step 1: Event type */}
      {step === 1 && (
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
            What are you celebrating?
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            Choose the type of event you&apos;re creating a page for.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => handleTypeSelect(t)}
                className="text-left rounded-2xl p-5 border-2 transition-all"
                style={{
                  borderColor: type === t ? '#1C1C1C' : '#E5E5E4',
                  background: type === t ? '#F4F4F3' : 'white',
                }}
              >
                <div className="text-2xl mb-2">{EVENT_TYPE_EMOJIS[t]}</div>
                <div className="font-medium text-sm mb-1" style={{ color: '#1C1C1C' }}>
                  {EVENT_TYPE_LABELS[t]}
                </div>
                <div className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {EVENT_TYPE_DESCRIPTIONS[t].split(' ').slice(0, 8).join(' ')}…
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-8">
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Continue
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Event details */}
      {step === 2 && (
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
            Tell us about your {EVENT_TYPE_LABELS[type].toLowerCase()}
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            This information appears on your public event page.
          </p>

          <div className="flex flex-col gap-5">
            <Input
              id="title"
              label="Event title"
              placeholder={type === 'wedding' ? "Sarah & Tom's Wedding" : type === 'baby_shower' ? "Emma's Baby Shower" : "My Event"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="date"
                label="Date (optional)"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Input
                id="location"
                label="Location (optional)"
                placeholder="London, UK"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
                Description (optional)
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                style={{ borderColor: '#E5E5E4', minHeight: 80 }}
                placeholder="Share a little about your event with guests…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#1C1C1C'}
                onBlur={(e) => e.target.style.borderColor = '#E5E5E4'}
              />
            </div>

            {/* Accent colour */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
                Accent colour
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color)}
                    className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: color,
                      outline: accentColor === color ? `3px solid ${color}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft size={14} />
              Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
              Continue
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Gift fund */}
      {step === 3 && (
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
            Set up your gift fund
          </h1>
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            Guests will contribute to this fund. You can edit these details later.
          </p>

          <div className="flex flex-col gap-5">
            <Input
              id="pool-title"
              label="Fund name"
              placeholder="Our Honeymoon Fund"
              value={poolTitle}
              onChange={(e) => setPoolTitle(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
                Fund description (optional)
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                style={{ borderColor: '#E5E5E4', minHeight: 80 }}
                placeholder="Tell guests what their contributions will go towards…"
                value={poolDescription}
                onChange={(e) => setPoolDescription(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = '#1C1C1C'}
                onBlur={(e) => e.target.style.borderColor = '#E5E5E4'}
              />
            </div>

            {/* Fee notice */}
            <div
              className="rounded-xl p-4 text-sm"
              style={{ background: '#F5EDD9', color: '#8B6914' }}
            >
              <p className="font-medium mb-1">How Fond earns</p>
              <p className="leading-relaxed text-xs">
                Fond takes a <strong>4.5% fee</strong> from each contribution. If a guest contributes $100,
                you receive $95.50. This is always shown clearly to guests before they pay.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ArrowLeft size={14} />
              Back
            </Button>
            <Button onClick={handlePublish} disabled={loading} variant="gold">
              {loading ? 'Creating…' : 'Publish event'}
              {!loading && <Check size={14} />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
