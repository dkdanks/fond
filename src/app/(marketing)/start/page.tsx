import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { EventTypeCard } from '@/components/marketing/event-type-card'

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

export default function StartPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-20 border-b"
        style={{ borderColor: '#D4CCBC', background: 'rgba(250,250,247,0.88)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <Link
            href="/"
            style={{ fontWeight: 500, fontSize: 18, letterSpacing: '-0.07em', color: '#2C2B26', textDecoration: 'none' }}
          >
            joyabl
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm" style={{ color: '#8B8670' }}>Log in</Link>
            <Link href="/signup">
              <Button size="sm">Get started <ArrowRight size={13} /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Selector */}
      <main
        className="flex flex-col items-center justify-center px-6"
        style={{ minHeight: 'calc(100svh - 61px)', paddingTop: 80, paddingBottom: 80 }}
      >
        <p
          className="text-xs font-medium uppercase tracking-widest mb-6 text-center"
          style={{ color: '#B5A98A' }}
        >
          Let&apos;s get started
        </p>
        <h1
          className="text-4xl font-semibold mb-14 text-center"
          style={{ color: '#2C2B26', letterSpacing: '-0.03em' }}
        >
          What are you celebrating?
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', maxWidth: 840 }}>
          {EVENT_TYPES.map((event) => (
            <EventTypeCard key={event.href} {...event} />
          ))}
        </div>
      </main>

    </div>
  )
}
