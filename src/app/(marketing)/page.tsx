import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { FooterType } from '@/components/marketing/footer-type'
import { EventTypeCard } from '@/components/marketing/event-type-card'
import { StartCTA } from '@/components/marketing/start-cta'
import { HowItWorks } from '@/components/marketing/how-it-works'

const EVENT_TYPES = [
  {
    label: 'Wedding',
    description: 'Your big day, beautifully organised',
    href: '/wedding',
    accent: '#D4CCBC',
  },
  {
    label: 'Baby Shower',
    description: 'Welcoming your little one',
    href: '/baby-shower',
    accent: '#C8D4C4',
  },
  {
    label: 'Bar / Bat Mitzvah',
    description: 'Celebrating this milestone',
    href: '/mitzvah',
    accent: '#D8D4C8',
  },
  {
    label: 'Housewarming',
    description: 'Making a house a home',
    href: '/housewarming',
    accent: '#D4C8BC',
  },
  {
    label: 'Birthday',
    description: 'Another trip around the sun',
    href: '/birthday',
    accent: '#D0CCBC',
  },
]

const REVIEWS = [
  {
    quote: "We'd spent weeks stressing about the registry. Setting up with Joyabl took an afternoon — our guests said it was the most beautiful invitation link they'd ever received.",
    name: 'Sarah & Tom',
    event: 'Wedding, Sydney',
  },
  {
    quote: "The fund idea changed everything. Instead of getting things we didn't need, we got contributions toward our first family holiday. We're going in March.",
    name: 'Priya K.',
    event: 'Baby shower, Melbourne',
  },
  {
    quote: "Simple, fast, and our guests actually used it. The dashboard made it easy to see who'd responded and who still needed a nudge.",
    name: 'James & Marcus',
    event: 'Wedding, Brisbane',
  },
  {
    quote: "I was nervous about asking for money. The way Joyabl frames it — as funds for experiences — made it feel thoughtful, not grabby.",
    name: 'Olivia R.',
    event: 'Housewarming, Auckland',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: '#D4CCBC', background: 'rgba(250,250,247,0.88)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <span style={{ fontWeight: 500, fontSize: 18, letterSpacing: '-0.07em', color: '#2C2B26' }}>
            joyabl
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm" style={{ color: '#8B8670' }}>Log in</Link>
            <Link href="/start">
              <Button size="sm">Get started <ArrowRight size={13} /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: '100svh',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '80px 24px 100px',
        }}
      >
        {/* Animated background blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden>
          <div
            style={{
              position: 'absolute', top: '-10%', left: '-8%',
              width: 650, height: 650, borderRadius: '50%',
              background: '#F5F0E8', opacity: 0.75,
              filter: 'blur(110px)',
              animation: 'blobA 22s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute', bottom: '-15%', right: '-8%',
              width: 550, height: 550, borderRadius: '50%',
              background: '#C8BFA8', opacity: 0.4,
              filter: 'blur(100px)',
              animation: 'blobB 28s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute', top: '35%', right: '15%',
              width: 380, height: 380, borderRadius: '50%',
              background: '#B5A98A', opacity: 0.2,
              filter: 'blur(85px)',
              animation: 'blobC 34s ease-in-out infinite',
            }}
          />
        </div>

        {/* Wordmark + tagline */}
        <div
          style={{
            position: 'relative', zIndex: 1,
            textAlign: 'center',
            animation: 'fadeUp 1s ease both',
            animationDelay: '0.1s',
          }}
        >
          <h1
            style={{
              fontWeight: 500,
              fontSize: 'clamp(72px, 14vw, 144px)',
              letterSpacing: '-0.07em',
              lineHeight: 1,
              color: '#2C2B26',
              margin: 0,
            }}
          >
            joyabl
          </h1>
          <p
            style={{
              marginTop: 20,
              fontSize: 17,
              color: '#8B8670',
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            The gift registry for every celebration.
          </p>
        </div>

        {/* Event type selector */}
        <div
          style={{
            position: 'relative', zIndex: 1,
            marginTop: 64,
            width: '100%', maxWidth: 840,
            animation: 'fadeUp 1s ease both',
            animationDelay: '0.45s',
          }}
        >
          <p
            style={{
              textAlign: 'center', marginBottom: 18,
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: '#B5A98A',
            }}
          >
            What are you celebrating?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {EVENT_TYPES.map((event) => (
              <EventTypeCard key={event.href} {...event} />
            ))}
          </div>

        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: 'absolute', bottom: 28,
            left: '50%', transform: 'translateX(-50%)',
            animation: 'fadeUp 1s ease both 1.2s, scrollBob 2.4s ease-in-out 2s infinite',
            opacity: 0.35,
          }}
        >
          <ChevronDown size={18} color="#2C2B26" />
        </div>
      </section>

      <HowItWorks />

      {/* ── Photo break ── */}
      <div className="w-full" style={{ height: 420 }}>
        <img
          src="/images/table.jpg"
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 60%' }}
        />
      </div>

      {/* ── Reviews ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <p
          className="text-xs font-medium uppercase tracking-widest mb-16 text-center"
          style={{ color: '#B5A98A' }}
        >
          What people are saying
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl p-7 flex flex-col justify-between"
              style={{ background: '#F5F0E8', minHeight: 220 }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#4A3728' }}>
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="mt-6">
                <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>{r.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#B5A98A' }}>{r.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <StartCTA />

      {/* ── Footer ── */}
      <footer className="border-t" style={{ borderColor: '#D4CCBC' }}>
        <FooterType />
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs" style={{ color: '#B5A98A' }}>© {new Date().getFullYear()} Joyabl</p>
        </div>
      </footer>

    </div>
  )
}
