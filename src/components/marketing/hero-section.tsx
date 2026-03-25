'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { EventTypeCard } from './event-type-card'

const EVENT_TYPES = [
  { label: 'Wedding', description: 'Your big day, beautifully organised', href: '/wedding', accent: '#D4CCBC' },
  { label: 'Baby Shower', description: 'Welcoming your little one', href: '/baby-shower', accent: '#C8D4C4' },
  { label: 'Bar / Bat Mitzvah', description: 'Celebrating this milestone', href: '/mitzvah', accent: '#D8D4C8' },
  { label: 'Housewarming', description: 'Making a house a home', href: '/housewarming', accent: '#D4C8BC' },
  { label: 'Birthday', description: 'Another trip around the sun', href: '/birthday', accent: '#D0CCBC' },
]

export function HeroSection() {
  const [phase, setPhase] = useState<'intro' | 'main'>('intro')
  const main = phase === 'main'

  useEffect(() => {
    const t = setTimeout(() => setPhase('main'), 3200)
    return () => clearTimeout(t)
  }, [])

  const fadeUp = (delay: number) => ({
    opacity: main ? 1 : 0,
    transform: main ? 'translateY(0px)' : 'translateY(18px)',
    transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
  })

  return (
    <section
      style={{
        height: '100svh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#2C2B26',
      }}
    >
      {/*
        Use native poster= attribute so the browser handles the still→motion
        transition internally — no JS crossfade, no glitch.
        poster is extracted from frame 0 of the compressed video so they match exactly.
      */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-poster.jpg"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 1,
        }}
      >
        <source src="/videos/walking_through_field.webm" type="video/webm" />
        <source src="/videos/walking_through_field_compressed.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: main ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,0,0.18)',
          transition: 'background 1.8s ease',
        }}
      />

      {/* ── Intro: large wordmark ── */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          opacity: main ? 0 : 1,
          transition: 'opacity 1s ease',
        }}
      >
        <span
          style={{
            fontWeight: 500,
            fontSize: 'clamp(96px, 22vw, 260px)',
            letterSpacing: '-0.07em',
            lineHeight: 1,
            color: '#FFFFFF',
          }}
        >
          joyabl
        </span>
      </div>

      {/* ── Main: tagline + cards ── */}
      {/* paddingTop accounts for the fixed nav so tagline never crowds it on mobile */}
      <div
        style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          padding: '80px 24px 24px',
          pointerEvents: main ? 'auto' : 'none',
        }}
      >
        {/* Tagline */}
        <p
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.78)',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            marginBottom: 56,
            textAlign: 'center',
            ...fadeUp(0),
          }}
        >
          The gift registry for every celebration.
        </p>

        <div style={{ width: '100%', maxWidth: 840 }}>
          {/* Label */}
          <p
            style={{
              textAlign: 'center', marginBottom: 18,
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.38)',
              ...fadeUp(0.15),
            }}
          >
            What are you celebrating?
          </p>

          {/* Cards — staggered. Mobile: full-width equal cards. Desktop: auto-sized. */}
          <style>{`
            .hero-card-wrap { width: 100%; }
            @media (min-width: 540px) { .hero-card-wrap { width: auto; } }
          `}</style>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {EVENT_TYPES.map((event, i) => (
              <div key={event.href} className="hero-card-wrap" style={fadeUp(0.28 + i * 0.08)}>
                <EventTypeCard {...event} dark />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: 'absolute', bottom: 28,
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            opacity: main ? 0.45 : 0,
            transition: 'opacity 0.75s ease 0.85s',
            animation: main ? 'scrollBob 2.4s ease-in-out 1.6s infinite' : undefined,
          }}
        >
          <ChevronDown size={18} color="#FFFFFF" />
        </div>
      </div>
    </section>
  )
}
