'use client'

import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

const RSVP_OPTIONS: Array<{ label: string; active: boolean }> = [
  { label: 'Accepts with pleasure', active: true },
  { label: 'Declines with love', active: false },
  { label: 'Meal preference collected', active: false },
]

const FEATURE_CARDS = [
  {
    title: 'Website',
    description: 'Create a page that feels polished from the first glance, with space for your story, schedule, and details.',
    accent: '#F5F0E8',
    art: (
      <div
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #c9c4bc 0%, #8a847c 100%)',
          padding: 14,
          minHeight: 220,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            background: 'rgba(255,255,255,0.9)',
            padding: 12,
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ height: 92, borderRadius: 14, background: 'linear-gradient(135deg, #C8BFA8 0%, #FAFAF7 100%)' }} />
          <div style={{ width: '48%', height: 7, borderRadius: 999, background: '#2C2B26' }} />
          <div style={{ width: '78%', height: 4, borderRadius: 999, background: '#B5A98A' }} />
          <div style={{ width: '66%', height: 4, borderRadius: 999, background: '#D7D1C4' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto' }}>
            <div style={{ height: 44, borderRadius: 12, background: '#F5F0E8' }} />
            <div style={{ height: 44, borderRadius: 12, background: '#FAFAF7', border: '1px solid #E8E3DA' }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Registry',
    description: 'Guide guests toward contributions that feel thoughtful, personal, and genuinely useful for your next chapter.',
    accent: '#C8BFA8',
    art: (
      <div
        style={{
          borderRadius: 22,
          background: 'linear-gradient(180deg, #FAFAF7 0%, #F5F0E8 100%)',
          border: '1px solid #E8E3DA',
          padding: 16,
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {[
          ['Weekend away', '62% funded', '62%'],
          ['New home pieces', '41% funded', '41%'],
          ['Dinner in Italy', '78% funded', '78%'],
        ].map(([label, meta, progress]) => (
          <div
            key={label}
            style={{
              borderRadius: 16,
              background: '#FFFFFF',
              padding: 14,
              boxShadow: '0 18px 40px rgba(44,43,38,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#2C2B26' }}>{label}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#8B8670' }}>{meta}</p>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: '#F5F0E8', overflow: 'hidden' }}>
          <div
                style={{
                  width: progress,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #3f3a35 0%, #959089 100%)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'RSVP',
    description: 'Let guests respond beautifully, with room for meal choices, plus-ones, and the details that matter to you.',
    accent: '#6B7A5E',
    art: (
      <div
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #d4d0c9 0%, #938d84 100%)',
          padding: 16,
          minHeight: 220,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            background: '#FFFFFF',
            minHeight: '100%',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ width: '54%', height: 7, borderRadius: 999, background: '#2C2B26' }} />
          {RSVP_OPTIONS.map(({ label, active }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderRadius: 14,
                padding: '11px 12px',
                background: active ? '#F5F0E8' : '#FAFAF7',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `1.5px solid ${active ? '#6d685f' : '#C8BFA8'}`,
                  background: active ? '#6d685f' : 'transparent',
                  boxShadow: active ? 'inset 0 0 0 4px #F5F0E8' : 'none',
                }}
              />
              <span style={{ fontSize: 12, color: '#2C2B26' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: 'Guest List',
    description: 'Keep everyone in one calm, organised place so you can focus on the celebration, not the spreadsheet.',
    accent: '#8B8670',
    art: (
      <div
        style={{
          borderRadius: 22,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F0E8 100%)',
          border: '1px solid #E8E3DA',
          padding: 16,
          minHeight: 220,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {[
          ['The Brooks Family', '4 attending'],
          ['Mia Chen', 'Awaiting reply'],
          ['Alex & Samir', 'Meal noted'],
        ].map(([name, status], index) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderRadius: 16,
              padding: 14,
              background: index === 0 ? '#FAFAF7' : '#FFFFFF',
              boxShadow: '0 18px 40px rgba(44,43,38,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: index === 1 ? '#d2cdc5' : '#8a837b',
                  opacity: 0.85,
                }}
              />
              <span style={{ fontSize: 13, color: '#2C2B26', fontWeight: 500 }}>{name}</span>
            </div>
            <span style={{ fontSize: 11, color: '#8B8670' }}>{status}</span>
          </div>
        ))}
      </div>
    ),
  },
]

const FLOW_STEPS = [
  {
    eyebrow: '01',
    title: 'Style your website',
    body: 'Start with a page that feels considered and easy to share. Your guests see something beautiful, and you stay in control of every detail.',
    accent: '#8B8670',
    visual: (
      <div
        style={{
          display: 'grid',
          gap: 14,
          width: '100%',
        }}
      >
        <div
          style={{
            borderRadius: 26,
            padding: 18,
            background: 'linear-gradient(160deg, #F5F0E8 0%, #FFFFFF 100%)',
            boxShadow: '0 28px 60px rgba(44,43,38,0.10)',
          }}
        >
          <div style={{ height: 220, borderRadius: 20, background: 'linear-gradient(180deg, #8B8670 0%, #4A3728 100%)', padding: 18 }}>
            <div style={{ borderRadius: 18, background: 'rgba(255,255,255,0.9)', height: '100%', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ width: '36%', height: 6, borderRadius: 999, background: '#2C2B26', marginBottom: 10 }} />
                <div style={{ width: '72%', height: 4, borderRadius: 999, background: '#B5A98A', marginBottom: 8 }} />
                <div style={{ width: '64%', height: 4, borderRadius: 999, background: '#D4CCBC' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
                <div style={{ borderRadius: 14, background: '#FAFAF7', height: 88 }} />
                <div style={{ borderRadius: 14, background: '#F5F0E8', height: 88 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: '02',
    title: 'Share it with ease',
    body: 'Invite guests into one simple experience where they can RSVP, check the details, and feel looked after from the moment they open the link.',
    accent: '#6B7A5E',
    visual: (
      <div
        style={{
          borderRadius: 26,
          padding: 18,
          background: 'linear-gradient(160deg, #FFFFFF 0%, #F5F0E8 100%)',
          boxShadow: '0 28px 60px rgba(44,43,38,0.10)',
        }}
      >
        <div style={{ position: 'relative', height: 220, overflow: 'hidden', borderRadius: 20, background: '#FAFAF7' }}>
          <div style={{ position: 'absolute', left: 22, right: 110, top: 70, height: 1, borderTop: '1.5px dashed #B5A98A' }} />
          <div
            style={{
              position: 'absolute',
              top: 58,
              left: 28,
              width: 62,
              height: 44,
              borderRadius: 16,
              background: '#FFFFFF',
              boxShadow: '0 18px 40px rgba(44,43,38,0.08)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 44,
              right: 26,
              width: 74,
              height: 58,
              borderRadius: 18,
              background: '#6B7A5E',
              boxShadow: '0 20px 40px rgba(44,43,38,0.15)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 61,
              left: '42%',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#C8BFA8',
              animation: 'landing-float 3.6s ease-in-out infinite',
            }}
          />
          <div style={{ position: 'absolute', left: 22, right: 22, bottom: 22, display: 'grid', gap: 10 }}>
            {['RSVP captured', 'Meal preferences sorted', 'All details in one place'].map((item, index) => (
              <div key={item} style={{ borderRadius: 14, background: index === 0 ? '#F5F0E8' : '#FFFFFF', padding: '12px 14px', fontSize: 12, color: '#2C2B26' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: '03',
    title: 'Receive what matters',
    body: 'When guests want to give, the experience feels warm and intentional. Contributions go toward the things you actually care about.',
    accent: '#B5A98A',
    visual: (
      <div
        style={{
          borderRadius: 26,
          padding: 18,
          background: 'linear-gradient(160deg, #F5F0E8 0%, #FFFFFF 100%)',
          boxShadow: '0 28px 60px rgba(44,43,38,0.10)',
        }}
      >
        <div style={{ height: 220, borderRadius: 20, background: '#FFFFFF', padding: 16, display: 'grid', gap: 12 }}>
          <div style={{ borderRadius: 18, background: '#FAFAF7', padding: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 500, color: '#2C2B26' }}>A slower Sunday somewhere beautiful</p>
            <div style={{ height: 8, borderRadius: 999, background: '#F5F0E8', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: '74%', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #8B8670 0%, #C8BFA8 100%)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8B8670' }}>
              <span>$1,480 raised</span>
              <span>74% funded</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ borderRadius: 16, background: '#F5F0E8', padding: 14 }}>
              <div style={{ width: '72%', height: 5, borderRadius: 999, background: '#2C2B26', marginBottom: 9 }} />
              <div style={{ width: '54%', height: 4, borderRadius: 999, background: '#B5A98A' }} />
            </div>
            <div style={{ borderRadius: 16, background: '#FAFAF7', padding: 14 }}>
              <div style={{ width: '66%', height: 5, borderRadius: 999, background: '#2C2B26', marginBottom: 9 }} />
              <div style={{ width: '50%', height: 4, borderRadius: 999, background: '#B5A98A' }} />
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

const REVIEWS = [
  {
    quote: 'We wanted something that looked thoughtful and felt easy for guests. Joyabl gave us both.',
    name: 'Sarah & Tom',
    event: 'Wedding, Sydney',
  },
  {
    quote: 'The page felt calm and polished, and the registry finally made sense for the way we actually live.',
    name: 'Priya K.',
    event: 'Baby shower, Melbourne',
  },
  {
    quote: 'People kept telling us how beautiful the site looked, but what I loved most was having everything in one place.',
    name: 'James & Marcus',
    event: 'Wedding, Brisbane',
  },
]

const FAQS = [
  {
    question: 'What can I create with Joyabl?',
    answer: 'A beautiful event website, a thoughtful registry, RSVP collection, and a guest list that stays organised from start to finish.',
  },
  {
    question: 'Do I need to choose an event type on the homepage?',
    answer: 'No. You can start with the overall experience first, then choose the celebration that fits best once you begin.',
  },
  {
    question: 'Can I use Joyabl before I am ready to publish?',
    answer: 'Yes. You can start building your page and shaping the experience before you decide to go live.',
  },
]

function FlowSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)
  const autoAdvanceRef = useRef<number | null>(null)

  function clearAutoAdvance() {
    if (autoAdvanceRef.current !== null) {
      window.clearTimeout(autoAdvanceRef.current)
      autoAdvanceRef.current = null
    }
  }

  function goToStep(index: number) {
    clearAutoAdvance()
    setActiveStep(index)
  }

  function goToNextStep() {
    clearAutoAdvance()
    setActiveStep((current) => (current + 1) % FLOW_STEPS.length)
  }

  function goToPreviousStep() {
    clearAutoAdvance()
    setActiveStep((current) => (current + FLOW_STEPS.length - 1) % FLOW_STEPS.length)
  }

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActiveStep(0)
        }
        if (!entry.isIntersecting) {
          clearAutoAdvance()
        }
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.35 }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    clearAutoAdvance()
    autoAdvanceRef.current = window.setTimeout(() => {
      setActiveStep((current) => (current + 1) % FLOW_STEPS.length)
    }, 7600)

    return () => clearAutoAdvance()
  }, [activeStep, isInView])

  const step = FLOW_STEPS[activeStep]

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="border-t border-b"
      style={{ borderColor: '#D4CCBC', background: '#F5F0E8' }}
    >
      <style>{`
        @keyframes landing-float {
          0%, 100% { transform: translateX(-10px) translateY(0); }
          50% { transform: translateX(10px) translateY(-6px); }
        }
      `}</style>
      <div className="max-w-6xl mx-auto px-6 py-24 lg:py-28">
        <div className="max-w-2xl mb-12 lg:mb-16">
          <p className="text-[11px] uppercase tracking-[0.24em] mb-5" style={{ color: '#8B8670' }}>
            How it works
          </p>
          <h2
            className="mb-5"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.02, letterSpacing: '-0.05em', color: '#2C2B26', fontWeight: 500 }}
          >
            Build the feeling first, then let the details follow.
          </h2>
          <p className="text-base leading-7" style={{ color: '#6B6255', maxWidth: 620 }}>
            Joyabl is designed to make the practical parts of planning feel as good as the celebration itself.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              {FLOW_STEPS.map((item, index) => {
                const active = index === activeStep
                return (
                  <button
                    key={item.eyebrow}
                    type="button"
                    onClick={() => goToStep(index)}
                    aria-label={`Show step ${index + 1}`}
                    style={{
                      width: active ? 40 : 12,
                      height: 12,
                      borderRadius: 999,
                      background: active ? '#2C2B26' : '#C8BFA8',
                      transition: 'all 180ms ease',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </div>

            <div style={{ minHeight: 240 }}>
              <p className="text-[12px] uppercase tracking-[0.22em] mb-4" style={{ color: step.accent }}>
                {step.eyebrow}
              </p>
              <h3 style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.04, letterSpacing: '-0.04em', color: '#2C2B26', fontWeight: 500, margin: '0 0 18px' }}>
                {step.title}
              </h3>
              <p className="text-base leading-7 mb-8" style={{ color: '#6B6255', maxWidth: 460 }}>
                {step.body}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  aria-label="Previous step"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid #D4CCBC',
                    background: '#FFFFFF',
                    color: '#2C2B26',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={goToNextStep}
                  aria-label="Next step"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid #D4CCBC',
                    background: '#FFFFFF',
                    color: '#2C2B26',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            key={step.eyebrow}
            style={{
              opacity: 1,
              transform: 'translateY(0)',
              transition: 'opacity 260ms ease, transform 260ms ease',
            }}
          >
            {step.visual}
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingSections() {
  return (
    <>
      <section style={{ background: '#FAFAF7' }}>
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-28">
          <div className="max-w-2xl mb-14">
            <p className="text-[11px] uppercase tracking-[0.24em] mb-5" style={{ color: '#8B8670' }}>
              Everything in one place
            </p>
            <h2
              className="mb-5"
              style={{ fontSize: 'clamp(32px, 4.3vw, 50px)', lineHeight: 1.02, letterSpacing: '-0.05em', color: '#2C2B26', fontWeight: 500 }}
            >
              A thoughtful way to host beautifully.
            </h2>
            <p className="text-base leading-7" style={{ color: '#6B6255', maxWidth: 640 }}>
              The pieces work together so your website, registry, RSVPs, and guest list feel like one calm, considered experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURE_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-[28px] p-6 md:p-7"
                style={{ background: '#FFFFFF', border: '1px solid #E8E3DA', boxShadow: '0 28px 60px rgba(44,43,38,0.06)' }}
              >
                <div className="mb-6">{card.art}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: card.accent, display: 'inline-block' }} />
                  <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#2C2B26', fontWeight: 500 }}>
                    {card.title}
                  </h3>
                </div>
                <p className="text-[15px] leading-7" style={{ color: '#6B6255', margin: 0 }}>
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FlowSection />

      <section id="pricing" style={{ background: '#6B7A5E' }}>
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-28">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.24em] mb-5" style={{ color: 'rgba(250,250,247,0.66)' }}>
                Pricing
              </p>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.02, letterSpacing: '-0.05em', color: '#FAFAF7', fontWeight: 500, margin: '0 0 18px' }}>
                Start with the vision, then go live when you are ready.
              </h2>
              <p className="text-base leading-7" style={{ color: 'rgba(250,250,247,0.78)', margin: 0 }}>
                Build your page, shape your registry, and organise your guests before you publish. Joyabl keeps the experience simple and polished from beginning to launch.
              </p>
            </div>

            <div className="rounded-[30px] p-7 md:p-8" style={{ background: '#FFFFFF', boxShadow: '0 30px 60px rgba(44,43,38,0.18)' }}>
              <div className="flex items-end justify-between gap-6 pb-6 mb-6" style={{ borderBottom: '1px solid #E8E3DA' }}>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: '#8B8670' }}>One-time publish fee</p>
                  <p style={{ margin: 0, fontSize: 'clamp(52px, 8vw, 76px)', lineHeight: 0.92, letterSpacing: '-0.06em', color: '#2C2B26', fontWeight: 500 }}>$49</p>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#6B6255', maxWidth: 180 }}>
                  Then 4.98% applies to contributions only.
                </p>
              </div>

              <div className="grid gap-3 mb-8">
                {[
                  'Build your website for free',
                  'Set up your registry for free',
                  'Collect RSVPs in one place',
                  'Publish when everything feels ready',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check size={15} style={{ color: '#6B7A5E', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#2C2B26' }}>{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/start">
                <Button size="md">
                  Get started <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#FAFAF7' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.24em] mb-5" style={{ color: '#8B8670' }}>
                Social proof
              </p>
              <h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.04, letterSpacing: '-0.05em', color: '#2C2B26', fontWeight: 500, margin: '0 0 14px' }}>
                Made for celebrations that care about the details.
              </h2>
              <p className="text-base leading-7" style={{ color: '#6B6255', margin: 0 }}>
                Joyabl is chosen by hosts who want something that feels warm, modern, and easy to share.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {REVIEWS.map((review) => (
              <article
                key={review.name}
                className="rounded-[26px] p-7 md:p-8"
                style={{ background: '#FFFFFF', border: '1px solid #E8E3DA', boxShadow: '0 24px 50px rgba(44,43,38,0.05)' }}
              >
                <p className="text-[17px] leading-8 mb-10" style={{ color: '#2C2B26', marginTop: 0 }}>
                  &ldquo;{review.quote}&rdquo;
                </p>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 14, color: '#2C2B26', fontWeight: 500 }}>{review.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#8B8670' }}>{review.event}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="border-t" style={{ borderColor: '#D4CCBC', background: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-28">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] uppercase tracking-[0.24em] mb-5" style={{ color: '#8B8670' }}>
              FAQ
            </p>
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.04, letterSpacing: '-0.05em', color: '#2C2B26', fontWeight: 500, margin: '0 0 14px' }}>
              A few things people usually want to know.
            </h2>
            <p className="text-base leading-7" style={{ color: '#6B6255', margin: 0 }}>
              The essentials, without making you dig for them.
            </p>
          </div>

          <div className="grid gap-4">
            {FAQS.map((item) => (
              <article
                key={item.question}
                className="rounded-[24px] p-6 md:p-7"
                style={{ background: '#FFFFFF', border: '1px solid #E8E3DA' }}
              >
                <h3 style={{ margin: '0 0 10px', fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#2C2B26', fontWeight: 500 }}>
                  {item.question}
                </h3>
                <p className="text-[15px] leading-7" style={{ color: '#6B6255', margin: 0 }}>
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
