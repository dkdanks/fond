import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function StartCTA() {
  return (
    <section className="border-t" style={{ borderColor: '#D4CCBC', background: '#F5F0E8' }}>
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2
          className="text-4xl font-semibold mb-4"
          style={{ color: '#2C2B26', letterSpacing: '-0.03em' }}
        >
          Ready to start planning?
        </h2>
        <p className="text-base mb-10" style={{ color: '#8B8670' }}>
          Build your page for free. Pay only when you&apos;re ready to go live.
        </p>
        <Link href="/start">
          <Button size="md">
            Choose your celebration <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </section>
  )
}
