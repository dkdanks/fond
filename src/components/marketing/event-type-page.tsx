import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check, ChevronLeft } from 'lucide-react'
import { FooterType } from '@/components/marketing/footer-type'

export interface EventTypePageConfig {
  label: string
  headline: string
  tagline: string
  accent: string
  features: { title: string; body: string }[]
  reviews: { quote: string; name: string; location: string }[]
}

export function EventTypePage({ config }: { config: EventTypePageConfig }) {
  const { label, headline, tagline, accent, features, reviews } = config

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>

      {/* ── Nav ── */}
      <nav
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: '#D4CCBC', background: 'rgba(250,250,247,0.88)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              style={{ fontWeight: 500, fontSize: 18, letterSpacing: '-0.07em', color: '#2C2B26', textDecoration: 'none' }}
            >
              joyabl
            </Link>
            <Link
              href="/start"
              className="hidden sm:flex items-center gap-1 text-sm"
              style={{ color: '#8B8670', textDecoration: 'none' }}
            >
              <ChevronLeft size={13} />
              All celebrations
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm" style={{ color: '#8B8670' }}>Log in</Link>
            <Link href="/signup">
              <Button size="sm">Get started <ArrowRight size={13} /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#F5F0E8', borderBottom: '1px solid #D4CCBC' }}
      >
        {/* Accent blob */}
        <div
          style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 500, height: 500, borderRadius: '50%',
            background: accent, opacity: 0.5,
            filter: 'blur(100px)',
            pointerEvents: 'none',
          }}
          aria-hidden
        />

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-2xl">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: '#B5A98A' }}
            >
              {label}
            </p>
            <h1
              className="font-semibold leading-tight mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.03em', color: '#2C2B26' }}
            >
              {headline}
            </h1>
            <p
              className="text-lg leading-relaxed mb-10"
              style={{ color: '#8B8670', maxWidth: 520 }}
            >
              {tagline}
            </p>
            <div className="flex items-center gap-6 flex-wrap">
              <Link href="/signup">
                <Button size="md">
                  Start for free <ArrowRight size={14} />
                </Button>
              </Link>
              <span className="text-sm" style={{ color: '#B5A98A' }}>
                Free to build &middot; $49 to go live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-16"
          style={{ color: '#B5A98A' }}
        >
          What you get
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: '#D4CCBC' }}>
          {features.map((f) => (
            <div key={f.title} className="p-10" style={{ background: '#FAFAF7' }}>
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8B8670' }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="border-t border-b" style={{ borderColor: '#D4CCBC', background: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: '#B5A98A' }}>
                Pricing
              </p>
              <h2
                className="font-semibold leading-tight mb-6"
                style={{ fontSize: 'clamp(32px, 4vw, 44px)', letterSpacing: '-0.03em', color: '#2C2B26' }}
              >
                Free to build.
                <br />$49 to go live.
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: '#8B8670', maxWidth: 400 }}>
                Build your page, invite guests, and set up your registry at no cost.
                Pay a one-time <span style={{ color: '#2C2B26', fontWeight: 500 }}>$49</span> when
                you&apos;re ready to publish. A small{' '}
                <span style={{ color: '#2C2B26', fontWeight: 500 }}>4.98% fee</span> applies
                to contributions only. No subscriptions, no surprises.
              </p>
              <Link href="/signup">
                <Button variant="secondary" size="md">Get started free <ArrowRight size={14} /></Button>
              </Link>
            </div>

            <div className="rounded-2xl p-10" style={{ background: '#2C2B26' }}>
              <div className="mb-8 text-center">
                <p className="text-sm mb-2" style={{ color: '#8B8670' }}>One-time publish fee</p>
                <p className="font-semibold text-white" style={{ fontSize: 72, lineHeight: 1 }}>
                  $49
                </p>
                <p className="text-sm mt-2" style={{ color: '#8B8670' }}>then 4.98% per contribution</p>
              </div>
              <div className="space-y-3 border-t pt-8" style={{ borderColor: '#3D3D2E' }}>
                {[
                  { label: 'Event page — free', highlight: false },
                  { label: 'Email invitations — free', highlight: false },
                  { label: 'RSVP management — free', highlight: false },
                  { label: 'Gift fund setup — free', highlight: false },
                  { label: '$49 to publish and go live', highlight: true },
                  { label: '4.98% on contributions only', highlight: true },
                ].map(({ label: l, highlight }) => (
                  <div key={l} className="flex items-center gap-3">
                    <Check size={13} style={{ color: highlight ? '#C8BFA8' : '#4A3728', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: highlight ? '#C8BFA8' : '#8B8670' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-12"
          style={{ color: '#B5A98A' }}
        >
          What people are saying
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl p-8 flex flex-col justify-between"
              style={{ background: '#F5F0E8', minHeight: 200 }}
            >
              <p className="text-sm leading-relaxed" style={{ color: '#4A3728' }}>
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="mt-6">
                <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>{r.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#B5A98A' }}>{r.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t" style={{ borderColor: '#D4CCBC', background: '#F5F0E8' }}>
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2
            className="font-semibold mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em', color: '#2C2B26' }}
          >
            Ready to get started?
          </h2>
          <p className="text-base mb-10" style={{ color: '#8B8670' }}>
            Build your {label.toLowerCase()} page for free. Pay only when you&apos;re ready to go live.
          </p>
          <Link href="/signup">
            <Button size="md">
              Create your page <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t overflow-hidden" style={{ borderColor: '#D4CCBC' }}>
        <FooterType />
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs" style={{ color: '#B5A98A' }}>© {new Date().getFullYear()} Joyabl</p>
        </div>
      </footer>

    </div>
  )
}
