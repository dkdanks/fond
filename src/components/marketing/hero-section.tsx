'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        Use native poster= attribute so the browser handles the still-to-motion
        transition internally with no JS crossfade or mismatch.
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
          padding: '104px 24px 28px',
          pointerEvents: main ? 'auto' : 'none',
        }}
      >
        <div style={{ width: '100%', maxWidth: 860 }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: 'clamp(42px, 8vw, 82px)',
                lineHeight: 0.96,
                letterSpacing: '-0.065em',
                color: '#FFFFFF',
                fontWeight: 500,
                margin: '0 0 20px',
                ...fadeUp(0),
              }}
            >
              Make your celebration feel as beautiful online as it does in real life.
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.8)',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                margin: '0 auto 28px',
                maxWidth: 620,
                ...fadeUp(0.12),
              }}
            >
              Joyabl brings your website, registry, RSVPs, and guest list into one considered place that feels polished from the first click.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 8,
                ...fadeUp(0.24),
              }}
            >
              <Link href="/start">
                <Button
                  size="lg"
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    color: '#FFFFFF',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Get started <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
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
