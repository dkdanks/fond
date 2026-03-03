'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateFee, formatCurrency, type RegistryPool } from '@/types'
import { ArrowLeft, Check, Heart, ImageIcon } from 'lucide-react'

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000]

type Step = 'pick' | 'contribute'

// null = "Give to anything", RegistryPool = specific fund
type SelectedFund = RegistryPool | null | undefined // undefined = nothing chosen yet

export default function RegistryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [event, setEvent] = useState<{ id: string; title: string; accent_color: string } | null>(null)
  const [funds, setFunds] = useState<RegistryPool[]>([])
  const [step, setStep] = useState<Step>('pick')
  const [selectedFund, setSelectedFund] = useState<SelectedFund>(undefined)

  // Contribution form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amountPence, setAmountPence] = useState(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase
        .from('events')
        .select('id, title, accent_color')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()
      if (!ev) return
      setEvent(ev)

      const { data: poolData } = await supabase
        .from('registry_pools')
        .select('*')
        .eq('event_id', ev.id)
        .order('created_at')
      setFunds(poolData ?? [])
    }
    load()
  }, [slug])

  function raisedForFund(fundId: string) {
    // We don't pre-load per-fund totals here — could add later if needed
    return null
  }

  function pickFund(fund: RegistryPool | null) {
    setSelectedFund(fund)
    setStep('contribute')
  }

  const accent = event?.accent_color ?? '#C9A96E'
  const effectiveAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountPence
  const fee = calculateFee(effectiveAmount)
  const theyReceive = effectiveAmount - fee

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (effectiveAmount < 100) { setError('Minimum contribution is £1.'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: event?.id,
        poolId: selectedFund?.id ?? null,
        contributorName: name,
        contributorEmail: email,
        message,
        amountPence: effectiveAmount,
      }),
    })

    if (res.ok) { setDone(true) } else { setError('Something went wrong. Please try again.') }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FAFAF9' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: accent + '20' }}>
          <Heart size={24} style={{ color: accent }} />
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1C1C1C' }}>Thank you, {name}!</h1>
        <p className="text-sm mb-2" style={{ color: '#6B7280' }}>
          Your gift of {formatCurrency(effectiveAmount)} has been received.
        </p>
        {selectedFund && (
          <p className="text-sm mb-8" style={{ color: '#9CA3AF' }}>Going towards: {selectedFund.title}</p>
        )}
        <Link href={`/e/${slug}`}><Button variant="secondary">Back to event</Button></Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: '#E5E5E4', background: 'white' }}>
        {step === 'contribute' ? (
          <button
            onClick={() => { setStep('pick'); setSelectedFund(undefined) }}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: '#6B7280' }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <Link href={`/e/${slug}`} className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
            <ArrowLeft size={14} /> Back
          </Link>
        )}
        <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
          {step === 'contribute'
            ? selectedFund ? selectedFund.title : 'Give a gift'
            : 'Gift funds'}
        </span>
      </nav>

      {/* Step 1 — Fund picker */}
      {step === 'pick' && (
        <div className="max-w-lg mx-auto px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>Choose a fund</h1>
          <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
            Pick something to contribute towards, or give to the couple directly.
          </p>

          <div className="flex flex-col gap-3">
            {/* Give to anything */}
            <button
              onClick={() => pickFund(null)}
              className="w-full text-left rounded-2xl border px-5 py-4 transition-all hover:shadow-sm hover:border-[#C9A96E]/40 focus:outline-none"
              style={{ background: 'white', borderColor: '#E5E5E4' }}
            >
              <p className="font-medium mb-0.5" style={{ color: '#1C1C1C' }}>Give to anything</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Let them decide where your gift goes.
              </p>
            </button>

            {funds.map((fund) => (
              <button
                key={fund.id}
                onClick={() => pickFund(fund)}
                className="w-full text-left rounded-2xl border overflow-hidden transition-all hover:shadow-sm hover:border-[#C9A96E]/40 focus:outline-none"
                style={{ background: 'white', borderColor: '#E5E5E4' }}
              >
                {fund.image_url ? (
                  <div
                    className="w-full h-36 bg-cover bg-center"
                    style={{ backgroundImage: `url(${fund.image_url})` }}
                  />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center" style={{ background: '#F4F4F3' }}>
                    <ImageIcon size={20} style={{ color: '#D1D5DB' }} />
                  </div>
                )}
                <div className="px-5 py-4">
                  <p className="font-medium mb-0.5" style={{ color: '#1C1C1C' }}>{fund.title}</p>
                  {fund.description && (
                    <p className="text-sm" style={{ color: '#6B7280' }}>{fund.description}</p>
                  )}
                  {fund.target_amount && (
                    <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
                      Goal: {formatCurrency(fund.target_amount)}
                    </p>
                  )}
                </div>
              </button>
            ))}

          </div>
        </div>
      )}

      {/* Step 2 — Contribution form */}
      {step === 'contribute' && (
        <div className="max-w-md mx-auto px-6 pt-10 pb-16">
          {/* Selected fund banner */}
          {selectedFund?.image_url && (
            <div
              className="w-full h-32 rounded-2xl bg-cover bg-center mb-6"
              style={{ backgroundImage: `url(${selectedFund.image_url})` }}
            />
          )}

          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>
            {selectedFund ? selectedFund.title : 'Give a gift'}
          </h1>
          {selectedFund?.description && (
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>{selectedFund.description}</p>
          )}
          {!selectedFund && (
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>Your gift will go wherever it's needed most.</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Amount picker */}
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: '#1C1C1C' }}>Choose an amount</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setAmountPence(amt); setCustomAmount('') }}
                    className="py-2 rounded-[10px] text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: amountPence === amt && !customAmount ? accent : '#E5E5E4',
                      background: amountPence === amt && !customAmount ? accent + '15' : 'white',
                      color: '#1C1C1C',
                    }}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or enter your own (e.g. 75)"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmountPence(0) }}
                type="number"
                min="1"
                step="0.01"
              />
            </div>

            {/* Fee breakdown */}
            {effectiveAmount >= 100 && (
              <div className="rounded-xl p-3.5 text-xs" style={{ background: '#F4F4F3' }}>
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#6B7280' }}>Your contribution</span>
                  <span style={{ color: '#1C1C1C', fontWeight: 500 }}>{formatCurrency(effectiveAmount)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span style={{ color: '#6B7280' }}>Fond fee (4.5%)</span>
                  <span style={{ color: '#9CA3AF' }}>−{formatCurrency(fee)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: '#E5E5E4' }}>
                  <span style={{ color: '#1C1C1C', fontWeight: 500 }}>They receive</span>
                  <span style={{ color: '#1C1C1C', fontWeight: 600 }}>{formatCurrency(theyReceive)}</span>
                </div>
              </div>
            )}

            <Input label="Your name" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email (optional)" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Leave a message (optional)</label>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                style={{ borderColor: '#E5E5E4', minHeight: 80 }}
                placeholder="Wishing you all the happiness in the world!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="rounded-xl p-3.5 text-xs" style={{ background: '#F5EDD9', color: '#8B6914' }}>
              <p className="font-medium mb-0.5">Demo mode</p>
              <p>Payments are not yet live. Your contribution will be recorded but no money will be taken.</p>
            </div>

            <Button
              type="submit"
              disabled={submitting || effectiveAmount < 100}
              className="w-full"
              style={{ background: accent }}
            >
              {submitting ? 'Processing…' : `Give ${effectiveAmount >= 100 ? formatCurrency(effectiveAmount) : ''}`}
              {!submitting && <Check size={14} />}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
