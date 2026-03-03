import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { ProductPreview } from '@/components/marketing/product-preview'
import { FooterType } from '@/components/marketing/footer-type'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 border-b bg-[#FAFAF9]/90 backdrop-blur-sm" style={{ borderColor: '#E5E5E4' }}>
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <span className="text-lg font-semibold tracking-tight" style={{ color: '#1C1C1C' }}>fond</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm" style={{ color: '#6B7280' }}>Log in</Link>
            <Link href="/signup">
              <Button size="sm">Get started <ArrowRight size={13} /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="lg:col-span-3 pt-8">
            <p className="text-xs font-medium uppercase tracking-widest mb-8" style={{ color: '#C9A96E' }}>
              The wedding registry, reimagined
            </p>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.04] tracking-tight mb-8"
              style={{ color: '#1C1C1C' }}
            >
              Your whole
              <br />
              celebration,
              <br />
              beautifully
              <br />
              organised.
            </h1>
            <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: '#6B7280' }}>
              Create a stunning event page, send invitations, manage RSVPs, and set up a gift
              registry your guests will actually enjoy using — all in one place.
            </p>
            <div className="flex items-center gap-5 flex-wrap">
              <Link href="/signup">
                <Button size="lg">
                  Get started — it&apos;s free <ArrowRight size={15} />
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm" style={{ color: '#9CA3AF' }}>
              No card required. Takes about five minutes.
            </p>
          </div>

          {/* Right — couple photo */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
              <img
                src="/images/couple.jpg"
                alt="A couple celebrating"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Product preview — interactive tabs */}
        <ProductPreview />
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-1">
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: '#C9A96E' }}>How it works</p>
            <h2 className="text-3xl font-semibold leading-snug" style={{ color: '#1C1C1C' }}>
              Simple for you. A joy for your guests.
            </h2>
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                n: '01',
                title: 'Build your event page',
                body: 'Tell your story, add your venue and date, share your schedule and travel tips. One link with everything your guests need — and it looks beautiful.',
              },
              {
                n: '02',
                title: 'Invite guests, track RSVPs',
                body: 'Send invitations directly from Fond. Guests RSVP, log meal preferences, add a plus-one. You see it all in one dashboard — no spreadsheets.',
              },
              {
                n: '03',
                title: 'Receive gifts that mean something',
                body: 'Add funds for whatever you actually want. Guests pick one and contribute any amount, knowing exactly what they\'re helping with. The money comes to you.',
              },
            ].map((step) => (
              <div key={step.n}>
                <p className="font-mono text-xs font-medium mb-5" style={{ color: '#C9A96E' }}>{step.n}</p>
                <h3 className="text-base font-semibold mb-3" style={{ color: '#1C1C1C' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Ceremony photo break ── */}
      <div className="w-full" style={{ height: 420 }}>
        <img
          src="/images/ceremony.jpg"
          alt="Wedding ceremony"
          className="w-full h-full object-cover"
        />
      </div>

      {/* ── What makes Fond different ── */}
      <section className="border-t" style={{ borderColor: '#E5E5E4' }}>
        <div className="max-w-6xl mx-auto px-6 py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left — copy */}
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: '#C9A96E' }}>Why Fond?</p>
              <h2 className="text-4xl font-semibold leading-tight mb-8" style={{ color: '#1C1C1C' }}>
                Not a list.
                <br />A wish.
              </h2>
              <div className="space-y-5 text-base leading-relaxed" style={{ color: '#6B7280' }}>
                <p>
                  Traditional gift registries ask your guests to buy specific products — a casserole dish from a shop they've never been to, a voucher they'll forget they have, a lamp in the wrong finish. They spend exactly that amount, hope it arrives in one piece, and everyone's quietly awkward about the whole thing.
                </p>
                <p>
                  Fond works differently. You create <span style={{ color: '#1C1C1C', fontWeight: 500 }}>funds</span> — things you've actually planned. The honeymoon you've been dreaming about for two years. Your first proper kitchen renovation. A weekend away together every year. Guests contribute whatever they're comfortable giving, and they know exactly where it goes.
                </p>
                <p>
                  No guessing. No returns. No awkward thank-you notes for something you'll never use. Just meaningful gifts, and the money to make them happen.
                </p>
              </div>
            </div>

            {/* Right — fund image grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { img: '/images/jet.jpg', label: 'The honeymoon', sub: 'Two weeks, wherever you want' },
                { img: '/images/cabin.jpg', label: 'A place to escape', sub: 'Your first trip as a family' },
                { img: '/images/nice-dinner.jpg', label: 'The dinner', sub: 'That restaurant you always said you\'d go to' },
                { img: '/images/suitcase.jpg', label: 'Two weeks, anywhere', sub: 'The trip you\'ve been planning' },
              ].map((fund) => (
                <div
                  key={fund.label}
                  className="relative rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '3/4' }}
                >
                  <img
                    src={fund.img}
                    alt={fund.label}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }}
                  />
                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-semibold text-white leading-snug">{fund.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{fund.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Table photo break ── */}
      <div className="w-full" style={{ height: 420 }}>
        <img
          src="/images/table.jpg"
          alt="Wedding celebration"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 60%' }}
        />
      </div>

      {/* ── Pricing ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: '#C9A96E' }}>Pricing</p>
            <h2 className="text-4xl font-semibold leading-tight mb-6" style={{ color: '#1C1C1C' }}>
              Free to create.
              <br />We only earn when you do.
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#6B7280' }}>
              Your event page, invitations, RSVP tracking — all free, forever.
              Fond takes a <span style={{ color: '#1C1C1C', fontWeight: 500 }}>4.5% fee</span> on
              contributions only. No subscriptions, no setup costs, no surprises.
            </p>
            <Link href="/signup">
              <Button variant="secondary" size="md">Get started free <ArrowRight size={14} /></Button>
            </Link>
          </div>

          <div className="rounded-2xl p-10 text-center" style={{ background: '#1C1C1C' }}>
            <p className="text-sm mb-2" style={{ color: '#6B7280' }}>Our only fee</p>
            <p className="font-semibold text-white mb-1" style={{ fontSize: 72, lineHeight: 1 }}>
              4.5<span style={{ fontSize: 36 }}>%</span>
            </p>
            <p className="text-sm mb-8" style={{ color: '#6B7280' }}>per contribution. That's it.</p>
            <div className="space-y-3 text-left border-t pt-8" style={{ borderColor: '#2C2C2C' }}>
              {[
                'Event page — free',
                'Email invitations — free',
                'RSVP management — free',
                'Gift fund setup — free',
                '4.5% on contributions only',
              ].map((item, i) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={13} style={{ color: i === 4 ? '#C9A96E' : '#4B5563', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: i === 4 ? '#C9A96E' : '#9CA3AF' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t overflow-hidden" style={{ borderColor: '#E5E5E4' }}>
        <FooterType />
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>© {new Date().getFullYear()} Fond</p>
        </div>
      </footer>

    </div>
  )
}
