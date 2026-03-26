import Image from 'next/image'
import { FooterType } from '@/components/marketing/footer-type'
import { StartCTA } from '@/components/marketing/start-cta'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { HeroSection } from '@/components/marketing/hero-section'
import { Navbar } from '@/components/marketing/navbar'

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

      <Navbar />
      <HeroSection />

      <HowItWorks />

      {/* ── Photo break ── */}
      <div className="w-full relative" style={{ height: 420 }}>
        <Image
          src="/images/table.jpg"
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover"
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
