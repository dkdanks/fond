'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, X } from 'lucide-react'

const PRIMARY = '#2C2B26'
const BG = '#F5F0E8'
const FONT = 'Cormorant Garamond'

interface Fund {
  id: string
  group: string
  title: string
  description: string
  target: number
  raised: number
}

const FUNDS: Fund[] = [
  {
    id: 'honeymoon',
    group: 'Honeymoon',
    title: 'Amalfi Coast flights',
    description: 'We\'ve dreamed of a morning espresso overlooking the sea in Positano. Help us get there.',
    target: 120000,
    raised: 74000,
  },
  {
    id: 'hotel',
    group: 'Honeymoon',
    title: 'A night at Le Sirenuse',
    description: 'One perfect night at the most beautiful hotel in the world — a bucket list moment.',
    target: 80000,
    raised: 32000,
  },
  {
    id: 'cooking',
    group: 'Experiences',
    title: 'Italian cooking class in Ravello',
    description: 'Learning to make fresh pasta from a local nonna. We promise to recreate it for you.',
    target: 25000,
    raised: 25000,
  },
  {
    id: 'wine',
    group: 'Experiences',
    title: 'Wine tasting tour',
    description: 'A full-day private tour through the Campanian vineyards.',
    target: 18000,
    raised: 9000,
  },
  {
    id: 'kitchen',
    group: 'Our Home',
    title: 'Kitchen upgrade fund',
    description: 'We\'ve moved in together and discovered our pots are embarrassing. Any contribution helps.',
    target: 60000,
    raised: 22000,
  },
  {
    id: 'garden',
    group: 'Our Home',
    title: 'Garden & outdoor space',
    description: 'Help us turn our small London garden into somewhere we actually want to spend time.',
    target: 40000,
    raised: 12500,
  },
]

const QUICK_AMOUNTS = [2500, 5000, 10000, 25000]

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(cents / 100)
}

function pct(fund: Fund) {
  if (!fund.target) return null
  return Math.min(Math.round((fund.raised / fund.target) * 100), 100)
}

function FundCard({ fund, onClick }: { fund: Fund; onClick: () => void }) {
  const p = pct(fund)
  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl p-5 border transition-all hover:shadow-sm"
      style={{ background: 'white', borderColor: `${PRIMARY}18` }}
    >
      <p className="text-xs font-medium mb-2.5 opacity-50" style={{ color: PRIMARY }}>
        {fund.group}
      </p>
      <p className="font-semibold text-base mb-1 leading-snug" style={{ color: PRIMARY, letterSpacing: '-0.01em' }}>
        {fund.title}
      </p>
      <p className="text-xs mb-3 opacity-55 leading-relaxed line-clamp-2" style={{ color: PRIMARY }}>
        {fund.description}
      </p>
      {p !== null && (
        <div className="mt-3">
          <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: `${PRIMARY}12` }}>
            <div className="h-full rounded-full" style={{ width: `${p}%`, background: PRIMARY }} />
          </div>
          <p className="text-xs opacity-35" style={{ color: PRIMARY }}>{p}% funded · {formatCurrency(fund.raised)} raised</p>
        </div>
      )}
      {p === null && (
        <p className="text-xs mt-3 opacity-35 group-hover:opacity-60 transition-opacity" style={{ color: PRIMARY }}>
          Contribute →
        </p>
      )}
    </button>
  )
}

function DemoModal({ fund, onClose }: { fund: Fund; onClose: () => void }) {
  const [amount, setAmount] = useState(5000)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  const effective = custom ? Math.round(parseFloat(custom) * 100) || 0 : amount

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
        <div
          className="relative w-full max-w-md rounded-3xl p-8 text-center"
          style={{ background: BG, fontFamily: `'${FONT}', serif` }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${PRIMARY}12` }}>
            <Heart size={22} style={{ color: PRIMARY }} />
          </div>
          <h2 className="text-2xl font-medium mb-2" style={{ color: PRIMARY }}>Thank you{name ? `, ${name}` : ''}!</h2>
          <p className="text-sm mb-1 opacity-60" style={{ color: PRIMARY }}>
            Your gift of {formatCurrency(effective)} towards &ldquo;{fund.title}&rdquo; would mean the world.
          </p>
          <p className="text-xs opacity-40 mb-8" style={{ color: PRIMARY }}>
            This is a demo — no payment was taken.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-75"
            style={{ background: PRIMARY, color: BG }}
          >
            Create your own registry
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl p-7"
        style={{ background: BG, fontFamily: `'${FONT}', serif`, color: PRIMARY }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ color: PRIMARY, background: `${PRIMARY}08` }}
        >
          <X size={14} />
        </button>

        <p className="text-xs uppercase tracking-[0.15em] opacity-40 mb-1">{fund.group}</p>
        <h2 className="text-xl font-semibold mb-1" style={{ letterSpacing: '-0.01em' }}>{fund.title}</h2>
        <p className="text-sm opacity-55 mb-6 leading-relaxed">{fund.description}</p>

        <p className="text-xs font-medium uppercase tracking-[0.1em] opacity-50 mb-3">Choose an amount</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {QUICK_AMOUNTS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(a); setCustom('') }}
              className="py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
              style={{
                borderColor: amount === a && !custom ? PRIMARY : `${PRIMARY}20`,
                background: amount === a && !custom ? PRIMARY : 'transparent',
                color: amount === a && !custom ? BG : PRIMARY,
              }}
            >
              {formatCurrency(a)}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Or enter amount (£)"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none mb-5"
          style={{ borderColor: `${PRIMARY}20`, background: 'white', color: PRIMARY }}
        />

        <input
          type="text"
          placeholder="Your name *"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none mb-3"
          style={{ borderColor: `${PRIMARY}20`, background: 'white', color: PRIMARY }}
        />
        <textarea
          placeholder="Leave a message (optional)"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none resize-none mb-5"
          style={{ borderColor: `${PRIMARY}20`, background: 'white', color: PRIMARY }}
        />

        <button
          onClick={() => name.trim() && setDone(true)}
          disabled={!name.trim() || effective < 100}
          className="w-full py-3.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
          style={{ background: PRIMARY, color: BG }}
        >
          Contribute {effective >= 100 ? formatCurrency(effective) : ''}
        </button>
        <p className="text-center text-xs mt-3 opacity-30">
          Demo mode — no payment will be taken
        </p>
      </div>
    </div>
  )
}

export default function SarahAndJamesRegistry() {
  const [selected, setSelected] = useState<Fund | null>(null)

  const groups = Array.from(new Set(FUNDS.map(f => f.group)))

  return (
    <div style={{ fontFamily: `'${FONT}', serif`, background: BG, color: PRIMARY, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>

      {/* Nav */}
      <nav className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: `${PRIMARY}15` }}>
        <Link
          href="/e/sarah-and-james"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-100"
          style={{ color: PRIMARY, opacity: 0.55, textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <span className="text-sm font-medium" style={{ color: PRIMARY }}>Sarah &amp; James</span>
      </nav>

      {/* Hero */}
      <section className="px-4 py-12 md:px-8 md:py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4 opacity-40">Registry</p>
        <h1 className="text-4xl md:text-5xl font-light mb-4" style={{ fontStyle: 'italic', letterSpacing: '-0.02em' }}>
          Gift registry
        </h1>
        <p className="text-base opacity-60 max-w-lg mx-auto leading-relaxed">
          Your presence is the greatest gift. For those who&rsquo;d like to contribute, we&rsquo;ve put together a few things we&rsquo;d treasure.
        </p>
      </section>

      {/* Fund cards by group */}
      <div className="px-4 pb-20 md:px-8 max-w-5xl mx-auto">
        {groups.map(group => (
          <div key={group} className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] opacity-40 mb-4">{group}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {FUNDS.filter(f => f.group === group).map(fund => (
                <FundCard key={fund.id} fund={fund} onClick={() => setSelected(fund)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contribution modal */}
      {selected && (
        <DemoModal fund={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
