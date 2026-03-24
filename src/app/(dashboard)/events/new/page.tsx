'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPE_COLORS, type EventType } from '@/types'
import {
  Heart, Sparkles, Star, House, Gift,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react'

const EVENT_TYPES: { type: EventType; label: string; description: string; icon: React.ElementType }[] = [
  { type: 'wedding', label: 'Wedding', description: 'For the big day', icon: Heart },
  { type: 'baby_shower', label: 'Baby Shower', description: 'Welcome your little one', icon: Sparkles },
  { type: 'mitzvah', label: 'Bar / Bat Mitzvah', description: 'Mark this milestone', icon: Star },
  { type: 'housewarming', label: 'Housewarming', description: 'Celebrate a new home', icon: House },
  { type: 'birthday', label: 'Birthday', description: 'Another trip around the sun', icon: Gift },
]

function slugify_local(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getSlugSuggestions(type: EventType, hostName: string, partnerName: string, date: string): string[] {
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear()
  const suggestions: string[] = []

  if (type === 'wedding' && hostName && partnerName) {
    suggestions.push(slugify_local(`${hostName}-and-${partnerName}`))
    suggestions.push(slugify_local(`${hostName}-${partnerName}-wedding`))
    suggestions.push(slugify_local(`${hostName}-and-${partnerName}-${year}`))
  } else if (hostName) {
    const eventWord = type === 'baby_shower' ? 'baby-shower' : type === 'mitzvah' ? 'mitzvah' : type
    suggestions.push(slugify_local(`${hostName}s-${eventWord}`))
    suggestions.push(slugify_local(`${hostName}-${eventWord}-${year}`))
    suggestions.push(slugify_local(`${hostName}-${year}`))
  }

  return suggestions.filter(Boolean).slice(0, 3)
}

function getEventTitle(type: EventType, hostName: string, partnerName: string): string {
  if (!hostName) return ''
  if (type === 'wedding') {
    if (partnerName) return `${hostName} & ${partnerName}`
    return `${hostName}'s Wedding`
  }
  const labels: Record<EventType, string> = {
    wedding: 'Wedding',
    baby_shower: 'Baby Shower',
    mitzvah: 'Bar Mitzvah',
    housewarming: 'Housewarming',
    birthday: 'Birthday',
  }
  return `${hostName}'s ${labels[type]}`
}

// Simple calendar component
function CalendarPicker({ selected, onChange }: { selected: string; onChange: (d: string) => void }) {
  const today = new Date()
  const [viewing, setViewing] = useState({
    year: selected ? new Date(selected).getFullYear() : today.getFullYear(),
    month: selected ? new Date(selected).getMonth() : today.getMonth(),
  })

  const firstDay = new Date(viewing.year, viewing.month, 1).getDay()
  const daysInMonth = new Date(viewing.year, viewing.month + 1, 0).getDate()

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  function prevMonth() {
    setViewing(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  }
  function nextMonth() {
    setViewing(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
  }

  function selectDay(day: number) {
    const d = new Date(viewing.year, viewing.month, day)
    const str = d.toISOString().split('T')[0]
    onChange(str)
  }

  const selectedDay = selected ? new Date(selected) : null
  const isSelected = (day: number) => {
    if (!selectedDay) return false
    return selectedDay.getFullYear() === viewing.year &&
      selectedDay.getMonth() === viewing.month &&
      selectedDay.getDate() === day
  }

  const isPast = (day: number) => {
    const d = new Date(viewing.year, viewing.month, day)
    d.setHours(0, 0, 0, 0)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return d < t
  }

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <div className="rounded-2xl border p-5 select-none" style={{ background: 'white', borderColor: '#E8E3D9', maxWidth: 320 }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5">
          <ChevronLeft size={16} style={{ color: '#8B8670' }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>
          {monthNames[viewing.month]} {viewing.year}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5">
          <ChevronRight size={16} style={{ color: '#8B8670' }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-1">
        {days.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#B5A98A' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => (
          <div key={i} className="h-9 flex items-center justify-center">
            {day !== null && (
              <button
                onClick={() => !isPast(day) && selectDay(day)}
                disabled={isPast(day)}
                className="w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-all"
                style={{
                  background: isSelected(day) ? '#2C2B26' : 'transparent',
                  color: isSelected(day) ? 'white' : isPast(day) ? '#D4CCBC' : '#2C2B26',
                  cursor: isPast(day) ? 'default' : 'pointer',
                  fontWeight: isSelected(day) ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isSelected(day) && !isPast(day)) (e.target as HTMLElement).style.background = '#F5F0E8' }}
                onMouseLeave={e => { if (!isSelected(day)) (e.target as HTMLElement).style.background = 'transparent' }}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [animating, setAnimating] = useState(false)

  // Step 1
  const [type, setType] = useState<EventType>('wedding')

  // Step 2
  const [hostName, setHostName] = useState('')
  const [partnerName, setPartnerName] = useState('')

  // Step 3
  const [date, setDate] = useState('')
  const [dateUndecided, setDateUndecided] = useState(false)
  const [location, setLocation] = useState('')

  // Step 4
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [creating, setCreating] = useState(false)

  const title = getEventTitle(type, hostName, partnerName)

  // Generate suggestions when entering step 4
  useEffect(() => {
    if (step === 4) {
      const s = getSlugSuggestions(type, hostName, partnerName, date)
      setSuggestions(s)
      if (!slug && s.length > 0) {
        setSlug(s[0])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Debounced slug check
  const checkSlug = useCallback((value: string) => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    if (!value || value.length < 2) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(value)}`)
        const data = await res.json()
        setSlug(data.slug) // normalized
        setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 400)
  }, [])

  useEffect(() => {
    if (slug) checkSlug(slug)
  }, [slug, checkSlug])

  function goNext() {
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 150)
  }
  function goBack() {
    setAnimating(true)
    setTimeout(() => { setStep(s => s - 1); setAnimating(false) }, 150)
  }

  async function handleCreate() {
    if (slugStatus !== 'available') return
    setCreating(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const colors = EVENT_TYPE_COLORS[type]
    const defaultContent = getDefaultContent(type, hostName, partnerName)

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        type,
        title: title || (hostName || 'My Event'),
        host_name: hostName || null,
        partner_name: type === 'wedding' ? (partnerName || null) : null,
        slug,
        date: dateUndecided ? null : (date || null),
        location: location || null,
        accent_color: colors.accent,
        primary_color: colors.primary,
        status: 'draft',
        content: defaultContent,
      })
      .select()
      .single()

    if (error || !event) {
      setCreating(false)
      return
    }

    // Create default registry pool
    const poolTitles: Record<EventType, string> = {
      wedding: 'Our Honeymoon Fund',
      baby_shower: 'Baby Essentials Fund',
      mitzvah: 'Celebration Fund',
      housewarming: 'Home Sweet Home Fund',
      birthday: 'Birthday Fund',
    }
    await supabase.from('registry_pools').insert({
      event_id: event.id,
      title: poolTitles[type],
    })

    router.push(`/events/${event.id}/website`)
  }

  // Validation
  const step1Valid = !!type
  const step2Valid = hostName.trim().length > 0 && (type !== 'wedding' || partnerName.trim().length > 0)
  const step4Valid = slugStatus === 'available'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#FAFAF7' }}
    >
      {/* Top bar with back + dots */}
      <div className="flex items-center justify-between px-8 py-5">
        {step > 1 ? (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: '#8B8670' }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        ) : (
          <div />
        )}
        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: s === step ? 20 : 6,
                height: 6,
                background: s === step ? '#2C2B26' : s < step ? '#8B8670' : '#D4CCBC',
              }}
            />
          ))}
        </div>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 pb-20"
        style={{
          opacity: animating ? 0 : 1,
          transition: 'opacity 150ms ease',
          transform: animating ? 'translateY(8px)' : 'none',
        }}
      >
        <div className="w-full max-w-lg">

          {/* STEP 1: Event type */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
                What are you celebrating?
              </h1>
              <p className="text-base mb-10" style={{ color: '#8B8670' }}>
                Choose and we'll set everything up for you.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {EVENT_TYPES.map(({ type: t, label, description, icon: Icon }) => {
                  const selected = type === t
                  return (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="text-left rounded-2xl p-5 border-2 transition-all"
                      style={{
                        borderColor: selected ? '#2C2B26' : '#E8E3D9',
                        background: selected ? '#F5F0E8' : 'white',
                      }}
                    >
                      <div
                        className="mb-3 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: selected ? '#2C2B26' : '#F5F0E8' }}
                      >
                        <Icon size={16} style={{ color: selected ? 'white' : '#8B8670' }} />
                      </div>
                      <div className="font-semibold text-sm mb-0.5" style={{ color: '#2C2B26' }}>{label}</div>
                      <div className="text-xs" style={{ color: '#8B8670' }}>{description}</div>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => step1Valid && goNext()}
                  disabled={!step1Valid}
                  className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: step1Valid ? '#2C2B26' : '#E8E3D9', color: step1Valid ? 'white' : '#B5A98A' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Names */}
          {step === 2 && (
            <div>
              <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
                {type === 'wedding' ? "Let's start with your names." : "What's your name?"}
              </h1>
              <p className="text-base mb-10" style={{ color: '#8B8670' }}>
                {type === 'wedding' ? "We'll use these across your page." : "We'll personalise your page for you."}
              </p>

              {type === 'wedding' ? (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>First partner</label>
                    <input
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
                      style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                      placeholder="e.g. Sarah"
                      value={hostName}
                      onChange={e => setHostName(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = '#2C2B26')}
                      onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Second partner</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
                      style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                      placeholder="e.g. Tom"
                      value={partnerName}
                      onChange={e => setPartnerName(e.target.value)}
                      onFocus={e => (e.target.style.borderColor = '#2C2B26')}
                      onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
                    />
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Your first name</label>
                  <input
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
                    style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                    placeholder={
                      type === 'birthday' ? 'e.g. Alex' :
                      type === 'baby_shower' ? 'e.g. Emma' :
                      type === 'mitzvah' ? 'e.g. Noah' :
                      'e.g. The Smiths'
                    }
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    onFocus={e => (e.target.style.borderColor = '#2C2B26')}
                    onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
                  />
                </div>
              )}

              {/* Live preview */}
              {title && (
                <div className="mb-10 px-4 py-3 rounded-xl" style={{ background: '#F5F0E8' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#B5A98A' }}>Your page will be called</p>
                  <p className="font-semibold" style={{ color: '#2C2B26' }}>{title}</p>
                </div>
              )}
              {!title && <div className="mb-10" />}

              <div className="flex justify-between">
                <button onClick={goBack} className="px-5 py-3 rounded-xl text-sm transition-colors" style={{ color: '#8B8670' }}>
                  Back
                </button>
                <button
                  onClick={() => step2Valid && goNext()}
                  disabled={!step2Valid}
                  className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: step2Valid ? '#2C2B26' : '#E8E3D9', color: step2Valid ? 'white' : '#B5A98A' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Date + location */}
          {step === 3 && (
            <div>
              <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
                {title ? `${title}.` : 'When is the big day?'}
              </h1>
              <p className="text-base mb-8" style={{ color: '#8B8670' }}>
                When is it? You can always update this later.
              </p>

              <div className={`mb-6 transition-opacity ${dateUndecided ? 'opacity-40 pointer-events-none' : ''}`}>
                <CalendarPicker selected={date} onChange={setDate} />
              </div>

              {/* Haven't decided toggle */}
              <label className="flex items-center gap-3 mb-8 cursor-pointer select-none">
                <div
                  className="w-11 h-6 rounded-full transition-colors relative"
                  style={{ background: dateUndecided ? '#2C2B26' : '#E8E3D9' }}
                  onClick={() => setDateUndecided(d => !d)}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: dateUndecided ? 'translateX(21px)' : 'translateX(2px)' }}
                  />
                </div>
                <span className="text-sm" style={{ color: '#2C2B26' }}>We haven't decided yet</span>
              </label>

              {/* Location */}
              <div className="mb-10">
                <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>
                  Where is it? <span style={{ color: '#B5A98A' }}>(optional)</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26', maxWidth: 320 }}
                  placeholder="e.g. Sydney, Australia"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = '#2C2B26')}
                  onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
                />
              </div>

              <div className="flex justify-between">
                <button onClick={goBack} className="px-5 py-3 rounded-xl text-sm transition-colors" style={{ color: '#8B8670' }}>Back</button>
                <button
                  onClick={goNext}
                  className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#2C2B26', color: 'white' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: URL slug */}
          {step === 4 && (
            <div>
              <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
                Choose your URL.
              </h1>
              <p className="text-base mb-10" style={{ color: '#8B8670' }}>
                This is the link you'll share with your guests.
              </p>

              {/* URL input */}
              <div className="mb-6">
                <div
                  className="flex items-center rounded-xl border overflow-hidden"
                  style={{ borderColor: '#E8E3D9', background: 'white' }}
                >
                  <span className="pl-4 pr-1 text-sm shrink-0" style={{ color: '#B5A98A' }}>
                    joyabl.com/
                  </span>
                  <input
                    autoFocus
                    className="flex-1 py-3 pr-3 text-sm outline-none font-medium"
                    style={{ color: '#2C2B26', background: 'transparent' }}
                    placeholder="your-url"
                    value={slug}
                    onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                  <div className="pr-4 pl-2 flex items-center gap-1.5 shrink-0">
                    {slugStatus === 'checking' && <Loader2 size={14} className="animate-spin" style={{ color: '#B5A98A' }} />}
                    {slugStatus === 'available' && (
                      <>
                        <div className="w-2 h-2 rounded-full" style={{ background: '#4CAF50' }} />
                        <span className="text-xs" style={{ color: '#4CAF50' }}>Available</span>
                      </>
                    )}
                    {slugStatus === 'taken' && (
                      <>
                        <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                        <span className="text-xs" style={{ color: '#EF4444' }}>Taken</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => setSlug(s)}
                      className="px-3 py-1.5 rounded-lg text-xs border transition-all"
                      style={{
                        borderColor: slug === s ? '#2C2B26' : '#E8E3D9',
                        background: slug === s ? '#F5F0E8' : 'white',
                        color: '#2C2B26',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {!suggestions.length && <div className="mb-10" />}

              <div className="flex justify-between">
                <button onClick={goBack} className="px-5 py-3 rounded-xl text-sm transition-colors" style={{ color: '#8B8670' }}>Back</button>
                <button
                  onClick={handleCreate}
                  disabled={!step4Valid || creating}
                  className="px-7 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  style={{ background: step4Valid ? '#2C2B26' : '#E8E3D9', color: step4Valid ? 'white' : '#B5A98A' }}
                >
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create your page'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Generate sensible default content for the event
function getDefaultContent(type: EventType, hostName: string, partnerName: string) {
  if (type === 'wedding') {
    return {
      welcome: {
        greeting: `After years of love, laughter, and exploring the world together, we're so excited to begin this next adventure. We can't wait to celebrate with the people who mean the most.`,
        show_rsvp: true,
      },
      our_story: {
        introduction: `We first met at a mutual friend's dinner, and by the end of the night we both knew something special had started.`,
        story: `From there, it's been a whirlwind. We've travelled to new countries, tried more food than we can count, and built a life together that still surprises us every day. We're so ready for the next chapter — and so excited to share it with you.`,
        images: [
          'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
          'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
          'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80',
          'https://images.unsplash.com/photo-1520854221256-17d7dc783f06?w=800&q=80',
        ],
      },
      schedule: [
        { id: '1', title: 'Ceremony', time: '3:00 PM', venue: '', address: '', notes: '' },
        { id: '2', title: 'Reception', time: '6:00 PM', venue: '', address: '', notes: '' },
      ],
      wedding_party: {
        introduction: `Meet the crew that kept us laughing, supported us through every adventure, and somehow survived planning this wedding with us.`,
        members: [
          { id: '1', role: 'maid_of_honour', name: 'Maid of Honour', photo_url: '', story: '' },
          { id: '2', role: 'best_man', name: 'Best Man', photo_url: '', story: '' },
          { id: '3', role: 'bridesmaid', name: 'Bridesmaid', photo_url: '', story: '' },
          { id: '4', role: 'bridesmaid', name: 'Bridesmaid', photo_url: '', story: '' },
          { id: '5', role: 'groomsman', name: 'Groomsman', photo_url: '', story: '' },
          { id: '6', role: 'groomsman', name: 'Groomsman', photo_url: '', story: '' },
          { id: '7', role: 'ring_bearer', name: 'Ring Bearer', photo_url: '', story: '' },
          { id: '8', role: 'flower_person', name: 'Flower Girl', photo_url: '', story: '' },
        ],
      },
      travel: {
        notes: `We have a number of recommended hotels nearby. Please reach out if you need help with travel arrangements.`,
        cards: [],
      },
      registry: {
        note: `If you'd like to help us kickstart our next adventure, we've put together a few thoughtful ideas. No pressure at all — your presence is the greatest gift. But if something catches your eye, we'll be forever grateful.`,
      },
      faq: [
        { id: '1', question: "What's the dress code?", answer: "Smart casual. Think elegant but comfortable — this is a celebration!" },
        { id: '2', question: "Are children invited?", answer: "We love your little ones, but this is an adults-only celebration to ensure a peaceful and enjoyable experience for everyone." },
        { id: '3', question: "Can I take photos?", answer: "We kindly ask that you are fully present during the ceremony. After that, snap away and capture all the fun memories!" },
      ],
      attire: { dress_code: 'Smart Casual', notes: '' },
    }
  }

  if (type === 'baby_shower') {
    return {
      welcome: {
        greeting: `We're so excited to welcome our little one into the world, and even more excited to celebrate with the people we love most.`,
        show_rsvp: true,
      },
      our_story: {
        introduction: `We found out the news and it's safe to say our lives changed forever in the very best way.`,
        story: `We've been busy dreaming, planning, and preparing — and we can't wait to share this next chapter with all of you. Your love and support means everything to us.`,
        images: [],
      },
      schedule: [
        { id: '1', title: 'Welcome & drinks', time: '11:00 AM', venue: '', address: '', notes: '' },
        { id: '2', title: 'Lunch', time: '12:30 PM', venue: '', address: '', notes: '' },
      ],
      registry: {
        note: `If you'd like to help us welcome our little one, we've put together a wish list of things that would mean so much to our growing family. No pressure at all — just having you there is more than enough.`,
      },
      faq: [
        { id: '1', question: "What should I bring?", answer: "Just yourself! If you'd like to give a gift, our registry has everything we need." },
        { id: '2', question: "Is there parking?", answer: "Yes, there's free parking available nearby." },
      ],
    }
  }

  if (type === 'birthday') {
    return {
      welcome: {
        greeting: `Another year older, another reason to celebrate with the people who matter most. So glad you're here.`,
        show_rsvp: true,
      },
      registry: {
        note: `If you'd like to give a gift, I've put together a few things I'd genuinely love. No obligation at all — your company is the real present.`,
      },
      schedule: [
        { id: '1', title: 'Drinks & arrivals', time: '6:00 PM', venue: '', address: '', notes: '' },
        { id: '2', title: 'Dinner', time: '7:30 PM', venue: '', address: '', notes: '' },
      ],
      faq: [
        { id: '1', question: "What's the dress code?", answer: "Come as you are — smart casual works perfectly." },
        { id: '2', question: "Is there parking?", answer: "Yes, street parking is available nearby." },
      ],
    }
  }

  if (type === 'mitzvah') {
    return {
      welcome: {
        greeting: `We are so honoured to celebrate this milestone with you. Your presence makes this moment complete.`,
        show_rsvp: true,
      },
      our_story: {
        introduction: `${hostName} has been preparing for this day for years — and the moment is finally here.`,
        story: `We are so proud of everything they have accomplished and can't wait to share this milestone with our family and friends.`,
        images: [],
      },
      schedule: [
        { id: '1', title: 'Service', time: '10:00 AM', venue: '', address: '', notes: '' },
        { id: '2', title: 'Reception & lunch', time: '12:30 PM', venue: '', address: '', notes: '' },
      ],
      registry: {
        note: `If you'd like to mark this milestone with a gift, we've put together a few meaningful ideas. Your presence is truly the greatest gift, but if something resonates with you, we'll be so touched.`,
      },
      travel: {
        notes: `We have a number of recommended hotels nearby for guests travelling from out of town.`,
        cards: [],
      },
      faq: [
        { id: '1', question: "What's the dress code?", answer: "Smart / semi-formal. Please no white." },
        { id: '2', question: "Is there parking?", answer: "Yes, parking is available nearby." },
      ],
    }
  }

  // Housewarming
  return {
    welcome: {
      greeting: `We finally did it — we have a home! Come celebrate with us as we settle into this new chapter.`,
      show_rsvp: true,
    },
    registry: {
      note: `If you'd like to help us make this house a home, we've put together a few things that would mean a lot. No pressure at all — just having you here to celebrate is more than enough.`,
    },
    schedule: [
      { id: '1', title: 'Drinks & welcome', time: '5:00 PM', venue: '', address: '', notes: '' },
      { id: '2', title: 'Dinner & celebrations', time: '7:00 PM', venue: '', address: '', notes: '' },
    ],
    faq: [
      { id: '1', question: "Is there parking?", answer: "Yes, there's street parking available out the front." },
      { id: '2', question: "What should I bring?", answer: "Just yourself! If you'd like to bring something, a bottle of wine is always welcome." },
    ],
  }
}
