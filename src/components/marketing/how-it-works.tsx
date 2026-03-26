'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

// ─── Step 1: mini event page building itself ─────────────────────────────────

function BuildVisual({ active }: { active: boolean }) {
  return (
    <div style={{ width: 280 }}>
      <div style={{
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 12px 48px rgba(44,43,38,0.10), 0 2px 8px rgba(44,43,38,0.05)',
        background: '#FAF8F5',
        border: '1px solid #E0DBCF',
        transform: active ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        opacity: active ? 1 : 0,
        transition: 'transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.5s ease',
      }}>
        {/* Header bar */}
        <div style={{ background: '#2C2B26', padding: '18px 20px 16px', textAlign: 'center' }}>
          <div style={{
            height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.15)',
            width: '35%', margin: '0 auto 10px',
            opacity: active ? 1 : 0,
            transition: 'opacity 0.4s ease 0.15s',
          }} />
          <p style={{
            fontSize: 15, fontWeight: 600, color: 'white', letterSpacing: '-0.02em', margin: 0,
            opacity: active ? 1 : 0,
            transition: 'opacity 0.4s ease 0.3s',
          }}>
            Sarah &amp; James
          </p>
          <div style={{
            height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.12)',
            width: '55%', margin: '10px auto 0',
            opacity: active ? 1 : 0,
            transition: 'opacity 0.4s ease 0.45s',
          }} />
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{
            height: 1, background: '#E0DBCF', marginBottom: 14,
            transformOrigin: 'left',
            transform: active ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 0.5s ease 0.6s',
          }} />
          {[
            { w: '80%', h: 5, delay: '0.7s', dark: true },
            { w: '65%', h: 3.5, delay: '0.85s', dark: false },
            { w: '75%', h: 3.5, delay: '0.95s', dark: false },
          ].map((l, i) => (
            <div key={i} style={{
              height: l.h, borderRadius: 3,
              background: l.dark ? '#2C2B26' : '#D4CCBC',
              width: l.w, marginBottom: 10,
              opacity: active ? 0.85 : 0,
              transform: active ? 'translateX(0)' : 'translateX(-10px)',
              transition: `opacity 0.4s ease ${l.delay}, transform 0.4s ease ${l.delay}`,
            }} />
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {[
              { bg: '#2C2B26', barColor: 'rgba(255,255,255,0.35)', delay: '1.1s' },
              { bg: 'transparent', border: '1px solid #E0DBCF', barColor: '#D4CCBC', delay: '1.25s' },
            ].map((btn, i) => (
              <div key={i} style={{
                flex: 1, padding: '7px 0', borderRadius: 8,
                background: btn.bg, border: btn.border,
                textAlign: 'center',
                opacity: active ? 1 : 0,
                transition: `opacity 0.4s ease ${btn.delay}`,
              }}>
                <div style={{ height: 4, borderRadius: 2, background: btn.barColor, width: 32, margin: '0 auto' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: paper plane flying ───────────────────────────────────────────────

function PlaneVisual({ active }: { active: boolean }) {
  return (
    <div style={{ width: 280, height: 170, position: 'relative' }}>
      <style>{`
        @keyframes joyablPlaneFly {
          0%   { transform: translate(-20px, 110px) rotate(-14deg); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(290px, 5px) rotate(-6deg); opacity: 0; }
        }
      `}</style>

      {/* Dashed flight path — revealed via clipPath */}
      <svg width="280" height="170" viewBox="0 0 280 170" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <clipPath id="joyabl-trail-clip">
            <rect
              x="0" y="0"
              width={active ? 280 : 0}
              height="170"
              style={{ transition: 'width 2.6s ease-in-out 1s' }}
            />
          </clipPath>
        </defs>
        <path
          d="M 0 128 C 60 115, 150 55, 280 15"
          fill="none"
          stroke="#D4CCBC"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          clipPath="url(#joyabl-trail-clip)"
        />
      </svg>

      {/* Paper plane */}
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: 0,
          animation: 'joyablPlaneFly 2.6s ease-in-out 1s both',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke="#C9A96E"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Envelope destination */}
      <div style={{
        position: 'absolute', right: 2, top: 4,
        opacity: active ? 1 : 0,
        transform: active ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.35s ease 3.4s, transform 0.35s ease 3.4s',
      }}>
        <div style={{
          width: 40, height: 28, borderRadius: 5,
          background: '#F5EDD9',
          border: '1.5px solid #C9A96E',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 0,
            borderLeft: '20px solid transparent',
            borderRight: '20px solid transparent',
            borderTop: '14px solid #C9A96E',
            opacity: 0.5,
          }} />
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: fund card with filling progress bar ──────────────────────────────

function FundVisual({ active }: { active: boolean }) {
  return (
    <div style={{ width: 280 }}>
      <div style={{
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 12px 48px rgba(44,43,38,0.10), 0 2px 8px rgba(44,43,38,0.05)',
        background: '#FAF8F5',
        border: '1px solid #E0DBCF',
        transform: active ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        opacity: active ? 1 : 0,
        transition: 'transform 0.7s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.5s ease 0.1s',
      }}>
        {/* Image */}
        <div style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
          <Image
            src="/images/cabin.jpg"
            alt=""
            aria-hidden
            fill
            sizes="280px"
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(44,43,38,0.6) 0%, transparent 55%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 10, left: 14,
            color: 'white',
            opacity: active ? 1 : 0,
            transition: 'opacity 0.4s ease 0.5s',
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>Weekend escape</p>
            <p style={{ fontSize: 10, opacity: 0.75, margin: '2px 0 0' }}>Somewhere new together</p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: '14px 16px 18px' }}>
          <div style={{ height: 6, borderRadius: 3, background: '#E8E3DA', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(to right, #C9A96E, #D4956A)',
              width: active ? '62%' : '0%',
              transition: 'width 1.3s cubic-bezier(0.4, 0, 0.2, 1) 0.7s',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            opacity: active ? 1 : 0,
            transition: 'opacity 0.4s ease 1.25s',
          }}>
            <p style={{ fontSize: 11, color: '#8B8670', margin: 0 }}>$620 raised</p>
            <p style={{ fontSize: 11, color: '#B5A98A', margin: 0 }}>of $1,000 · 62%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step wrapper ─────────────────────────────────────────────────────────────

interface StepProps {
  n: string
  title: string
  body: string
  Visual: React.ComponentType<{ active: boolean }>
  flip: boolean
}

function Step({ n, title, body, Visual, flip }: StepProps) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={`flex flex-col items-center gap-12 py-20 lg:gap-0 lg:py-0 ${flip ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
      style={{ borderTop: '1px solid #E8E3DA' }}
    >
      {/* Text */}
      <div
        className="lg:flex-1 lg:px-16 lg:py-20"
        style={{
          maxWidth: 420,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#C9A96E',
          marginBottom: 16, marginTop: 0,
        }}>
          {n}
        </p>
        <h3 style={{
          fontSize: 'clamp(22px, 2.5vw, 27px)',
          fontWeight: 600, color: '#2C2B26',
          letterSpacing: '-0.03em', lineHeight: 1.2,
          margin: '0 0 14px',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.65, color: '#8B8670', margin: 0, maxWidth: 360 }}>
          {body}
        </p>
      </div>

      {/* Visual */}
      <div
        className="lg:flex-1 lg:py-20 flex justify-center"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s',
        }}
      >
        <Visual active={inView} />
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

const STEPS: StepProps[] = [
  {
    n: '01',
    title: 'Build your page',
    body: 'Your story, your schedule, your details — one beautiful link with everything guests need.',
    Visual: BuildVisual,
    flip: false,
  },
  {
    n: '02',
    title: 'Invite everyone',
    body: 'Send invitations, collect RSVPs, track meal preferences. All in one place — no spreadsheets.',
    Visual: PlaneVisual,
    flip: true,
  },
  {
    n: '03',
    title: 'Receive what matters',
    body: "Guests contribute to funds you've actually planned. No products, no guessing, no returns.",
    Visual: FundVisual,
    flip: false,
  },
]

export function HowItWorks() {
  return (
    <section className="border-t" style={{ borderColor: '#D4CCBC' }}>
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ paddingTop: 56, paddingBottom: 8, textAlign: 'center' }}>
          <p style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: '#B5A98A', margin: 0,
          }}>
            How it works
          </p>
        </div>
        {STEPS.map(step => <Step key={step.n} {...step} />)}

        {/* See it live */}
        <div style={{
          borderTop: '1px solid #E8E3DA',
          padding: '48px 0',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 12, color: '#B5A98A', marginBottom: 20, marginTop: 0 }}>
            See it in action
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/e/sarah-and-james" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: '#2C2B26',
              padding: '10px 20px', borderRadius: 22,
              border: '1.5px solid #D4CCBC',
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Preview event page
            </Link>
            <Link href="/e/sarah-and-james/registry" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: '#2C2B26',
              padding: '10px 20px', borderRadius: 22,
              border: '1.5px solid #D4CCBC',
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M8 17h8"/></svg>
              Preview registry
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
