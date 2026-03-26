'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EVENT_TYPE_COLORS, type EventType } from '@/types'
import { ChevronLeft } from 'lucide-react'
import { DetailsStep, EventTypeStep, NamesStep, SlugStep } from '@/components/new-event/steps'

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
    const defaultContent = getDefaultContent(type, hostName)

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

          {step === 1 && (
            <EventTypeStep
              selectedType={type}
              canContinue={step1Valid}
              onSelectType={setType}
              onContinue={() => step1Valid && goNext()}
            />
          )}

          {step === 2 && (
            <NamesStep
              type={type}
              hostName={hostName}
              partnerName={partnerName}
              title={title}
              canContinue={step2Valid}
              onHostNameChange={setHostName}
              onPartnerNameChange={setPartnerName}
              onBack={goBack}
              onContinue={() => step2Valid && goNext()}
            />
          )}

          {step === 3 && (
            <DetailsStep
              title={title}
              date={date}
              dateUndecided={dateUndecided}
              location={location}
              onDateChange={setDate}
              onToggleDateUndecided={() => setDateUndecided(value => !value)}
              onLocationChange={setLocation}
              onBack={goBack}
              onContinue={goNext}
            />
          )}

          {step === 4 && (
            <SlugStep
              slug={slug}
              slugStatus={slugStatus}
              suggestions={suggestions}
              creating={creating}
              canCreate={step4Valid}
              onSlugChange={value => setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              onSelectSuggestion={setSlug}
              onBack={goBack}
              onCreate={handleCreate}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Generate sensible default content for the event
function getDefaultContent(type: EventType, hostName: string) {
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
