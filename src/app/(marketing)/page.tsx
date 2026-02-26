import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EVENT_TYPE_LABELS, EVENT_TYPE_DESCRIPTIONS, type EventType } from '@/types'

const eventTypes: { type: EventType; emoji: string; color: string }[] = [
  { type: 'wedding', emoji: '💍', color: '#F5EDD9' },
  { type: 'baby_shower', emoji: '🍼', color: '#E8F4F0' },
  { type: 'mitzvah', emoji: '✡️', color: '#EEF0F8' },
  { type: 'housewarming', emoji: '🏡', color: '#F5EDE8' },
]

const steps = [
  {
    number: '01',
    title: 'Create your event page',
    body: 'Pick your event type, add your details, and personalise with your own photos and colours.',
  },
  {
    number: '02',
    title: 'Invite your guests',
    body: 'Send beautiful invitations by email and manage RSVPs all in one place.',
  },
  {
    number: '03',
    title: 'Receive gifts with joy',
    body: 'Guests contribute what they can to your gift fund. You get the money, minus a small fee.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-xl font-semibold tracking-tight">fond</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-28 text-center">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{ background: '#F5EDD9', color: '#8B6914' }}
        >
          <span style={{ color: '#C9A96E' }}>✦</span>
          Weddings, baby showers, mitzvahs, and more
        </div>

        <h1
          className="text-5xl sm:text-6xl font-semibold leading-[1.1] tracking-tight mb-6"
          style={{ color: '#1C1C1C' }}
        >
          The gift registry for
          <br />
          <span style={{ color: '#C9A96E' }}>every life moment</span>
        </h1>

        <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: '#6B7280' }}>
          Create a beautiful event page, send invitations, and let the people who love you
          contribute to what really matters — no awkward gift lists required.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/signup">
            <Button size="lg">Create your event</Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="secondary">See how it works</Button>
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-10 text-sm" style={{ color: '#9CA3AF' }}>
          Trusted by couples, parents, and families everywhere
        </p>
      </section>

      {/* Event types */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {eventTypes.map(({ type, emoji, color }) => (
            <div
              key={type}
              className="rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
              style={{ background: color }}
            >
              <div className="text-3xl mb-3">{emoji}</div>
              <h3 className="font-semibold text-base mb-1" style={{ color: '#1C1C1C' }}>
                {EVENT_TYPE_LABELS[type]}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                {EVENT_TYPE_DESCRIPTIONS[type]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl p-12"
          style={{ background: '#1C1C1C' }}
        >
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#C9A96E' }}>
            How it works
          </p>
          <h2 className="text-3xl font-semibold text-white mb-12 max-w-md">
            Simple for you. Delightful for your guests.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number}>
                <div
                  className="text-xs font-mono font-medium mb-4"
                  style={{ color: '#C9A96E' }}
                >
                  {step.number}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing note */}
      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl font-semibold mb-4" style={{ color: '#1C1C1C' }}>
          Free to create. We only earn when you do.
        </h2>
        <p className="text-base max-w-xl mx-auto mb-3" style={{ color: '#6B7280' }}>
          Creating an event page and sending invitations is completely free.
          Fond takes a small <strong style={{ color: '#1C1C1C' }}>4.5% fee</strong> only when guests
          contribute to your registry.
        </p>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Always shown clearly to you before you publish.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#F5EDD9' }}
        >
          <h2 className="text-3xl font-semibold mb-4" style={{ color: '#1C1C1C' }}>
            Ready to celebrate?
          </h2>
          <p className="text-base mb-8" style={{ color: '#6B7280' }}>
            It takes less than five minutes to create your event.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="gold">Create your event — it&apos;s free</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between border-t" style={{ borderColor: '#E5E5E4' }}>
        <span className="text-sm font-semibold tracking-tight">fond</span>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          © {new Date().getFullYear()} Fond. Made with care.
        </p>
      </footer>
    </div>
  )
}
