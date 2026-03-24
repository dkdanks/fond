'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateFee, formatCurrency, type RegistryPool } from '@/types'
import { ArrowLeft, Check, Heart, ImageIcon, Loader2 } from 'lucide-react'

const QUICK_AMOUNTS = [2500, 5000, 10000, 25000]

type Step = 'pick' | 'contribute'
type SelectedFund = RegistryPool | null | undefined

interface FundProgress {
  [poolId: string]: number // cents raised
}

export default function RegistryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [primaryColor, setPrimaryColor] = useState('#2C2B26')
  const [bgColor, setBgColor] = useState('#F5F0E8')
  const [font, setFont] = useState('Inter')
  const [eventId, setEventId] = useState<string | null>(null)
  const [funds, setFunds] = useState<RegistryPool[]>([])
  const [progress, setProgress] = useState<FundProgress>({})
  const [step, setStep] = useState<Step>('pick')
  const [selectedFund, setSelectedFund] = useState<SelectedFund>(undefined)

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
        .select('id, title, content, primary_color, accent_color')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()
      if (!ev) return
      setEventId(ev.id)

      // Use palette from content JSONB first, fall back to columns
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedPalette = (ev.content as any)?._palette
      setPrimaryColor(savedPalette?.primary ?? ev.primary_color ?? '#2C2B26')
      setBgColor(savedPalette?.bg ?? ev.accent_color ?? '#F5F0E8')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedFont = (ev.content as any)?._font
      setFont(savedFont ?? 'Inter')

      const [{ data: poolData }, { data: contribData }] = await Promise.all([
        supabase.from('registry_pools').select('*').eq('event_id', ev.id).order('display_order').order('created_at'),
        supabase.from('contributions').select('pool_id, amount').eq('event_id', ev.id).eq('status', 'completed'),
      ])
      setFunds(poolData ?? [])

      // Build progress map
      const prog: FundProgress = {}
      for (const c of contribData ?? []) {
        if (c.pool_id) prog[c.pool_id] = (prog[c.pool_id] ?? 0) + c.amount
      }
      setProgress(prog)
    }
    load()
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  function pickFund(fund: RegistryPool | null) {
    setSelectedFund(fund)
    setStep('contribute')
  }

  const effectiveAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountPence
  const fee = calculateFee(effectiveAmount)
  const theyReceive = effectiveAmount - fee

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (effectiveAmount < 100) { setError('Minimum contribution is $1.'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/contribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
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

  const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors'
  const inputStyle = { borderColor: `${primaryColor}20`, background: 'white', color: primaryColor }
  const inputFocusStyle = `focus:border-[${primaryColor}]`

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: bgColor, fontFamily: `'${font}', serif` }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap');`}</style>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: `${primaryColor}15` }}>
          <Heart size={28} style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: primaryColor }}>Thank you, {name}!</h1>
        <p className="text-sm mb-2 opacity-60" style={{ color: primaryColor }}>
          Your gift of {formatCurrency(effectiveAmount)} has been received.
        </p>
        {selectedFund && (
          <p className="text-sm mb-8 opacity-40" style={{ color: primaryColor }}>Going towards: {selectedFund.title}</p>
        )}
        <Link
          href={`/e/${slug}`}
          className="px-6 py-2.5 rounded-full text-sm font-medium border"
          style={{ borderColor: `${primaryColor}30`, color: primaryColor }}
        >
          Back to event
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: bgColor, fontFamily: `'${font}', serif`, color: primaryColor }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap');`}</style>

      {/* Nav */}
      <nav
        className="px-6 py-3.5 border-b flex items-center gap-3 sticky top-0 z-10"
        style={{ borderColor: `${primaryColor}12`, background: bgColor }}
      >
        {step === 'contribute' ? (
          <button
            onClick={() => { setStep('pick'); setSelectedFund(undefined) }}
            className="flex items-center gap-1.5 text-sm opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: primaryColor }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <Link
            href={`/e/${slug}`}
            className="flex items-center gap-1.5 text-sm opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: primaryColor }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
        )}
        <span className="text-sm font-medium opacity-70" style={{ color: primaryColor }}>
          {step === 'contribute'
            ? (selectedFund ? selectedFund.title : 'Give a gift')
            : 'Registry'}
        </span>
      </nav>

      {/* Step 1 — Fund picker */}
      {step === 'pick' && (
        <div className="max-w-lg mx-auto px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: primaryColor }}>Choose a fund</h1>
          <p className="text-sm mb-8 opacity-55" style={{ color: primaryColor }}>
            Pick something to contribute towards, or give a general gift.
          </p>

          <div className="flex flex-col gap-3">
            {/* Give to anything */}
            <button
              onClick={() => pickFund(null)}
              className="w-full text-left rounded-2xl border px-5 py-4 transition-all hover:shadow-sm"
              style={{ background: 'white', borderColor: `${primaryColor}20` }}
            >
              <p className="font-medium mb-0.5" style={{ color: primaryColor }}>Give to anything</p>
              <p className="text-sm opacity-55" style={{ color: primaryColor }}>
                Let them decide where your gift goes.
              </p>
            </button>

            {funds.map(fund => {
              const raised = progress[fund.id] ?? 0
              const pct = fund.target_amount ? Math.min(Math.round((raised / fund.target_amount) * 100), 100) : null
              return (
                <button
                  key={fund.id}
                  onClick={() => pickFund(fund)}
                  className="w-full text-left rounded-2xl border overflow-hidden transition-all hover:shadow-sm"
                  style={{ background: 'white', borderColor: `${primaryColor}20` }}
                >
                  {fund.image_url ? (
                    <div className="w-full h-40 bg-cover bg-center" style={{ backgroundImage: `url(${fund.image_url})` }} />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center" style={{ background: `${primaryColor}08` }}>
                      <ImageIcon size={20} style={{ color: `${primaryColor}40` }} />
                    </div>
                  )}
                  <div className="px-5 py-4">
                    <p className="font-medium mb-0.5" style={{ color: primaryColor }}>{fund.title}</p>
                    {fund.description && (
                      <p className="text-sm opacity-55 mb-3" style={{ color: primaryColor }}>{fund.description}</p>
                    )}
                    {fund.target_amount && pct !== null && (
                      <>
                        <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: `${primaryColor}15` }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primaryColor }} />
                        </div>
                        <p className="text-xs opacity-40" style={{ color: primaryColor }}>
                          {formatCurrency(raised)} of {formatCurrency(fund.target_amount)} · {pct}%
                        </p>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2 — Contribution form */}
      {step === 'contribute' && (
        <div className="max-w-md mx-auto px-6 pt-10 pb-16">
          {selectedFund?.image_url && (
            <div className="w-full h-36 rounded-2xl bg-cover bg-center mb-6" style={{ backgroundImage: `url(${selectedFund.image_url})` }} />
          )}

          <h1 className="text-2xl font-semibold mb-1" style={{ color: primaryColor }}>
            {selectedFund ? selectedFund.title : 'Give a gift'}
          </h1>
          <p className="text-sm mb-8 opacity-55" style={{ color: primaryColor }}>
            {selectedFund?.description ?? 'Your gift will go wherever it\'s needed most.'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Amount picker */}
            <div>
              <label className="text-sm font-medium block mb-2.5" style={{ color: primaryColor }}>Choose an amount</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setAmountPence(amt); setCustomAmount('') }}
                    className="py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: amountPence === amt && !customAmount ? primaryColor : `${primaryColor}20`,
                      background: amountPence === amt && !customAmount ? `${primaryColor}10` : 'white',
                      color: primaryColor,
                    }}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
              <input
                className={`${inputCls} ${inputFocusStyle}`}
                style={inputStyle}
                placeholder="Or enter your own amount ($)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmountPence(0) }}
                type="number"
                min="1"
                step="0.01"
              />
            </div>

            {/* Fee breakdown */}
            {effectiveAmount >= 100 && (
              <div className="rounded-xl p-4 text-xs" style={{ background: `${primaryColor}07`, border: `1px solid ${primaryColor}12` }}>
                <div className="flex justify-between mb-2">
                  <span className="opacity-55" style={{ color: primaryColor }}>Your contribution</span>
                  <span className="font-medium" style={{ color: primaryColor }}>{formatCurrency(effectiveAmount)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="opacity-55" style={{ color: primaryColor }}>Joyabl fee (4.98%)</span>
                  <span className="opacity-40" style={{ color: primaryColor }}>−{formatCurrency(fee)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: `${primaryColor}15` }}>
                  <span className="font-medium" style={{ color: primaryColor }}>They receive</span>
                  <span className="font-semibold" style={{ color: primaryColor }}>{formatCurrency(theyReceive)}</span>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: primaryColor }}>Your name</label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: primaryColor }}>
                Email <span className="opacity-40 font-normal">(optional)</span>
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium block mb-1.5" style={{ color: primaryColor }}>
                Message <span className="opacity-40 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none resize-none transition-colors"
                style={{ ...inputStyle, minHeight: 80 }}
                placeholder="Wishing you all the happiness in the world!"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}

            {/* Demo banner */}
            <div className="rounded-xl px-4 py-3 text-xs" style={{ background: `${primaryColor}08`, border: `1px solid ${primaryColor}12` }}>
              <p className="font-medium mb-0.5 opacity-70" style={{ color: primaryColor }}>Demo mode</p>
              <p className="opacity-50" style={{ color: primaryColor }}>
                Payments are not yet live. Your contribution will be recorded but no money will be taken.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || effectiveAmount < 100}
              className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
              style={{ background: primaryColor, color: bgColor }}
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                : <><Check size={14} /> Give {effectiveAmount >= 100 ? formatCurrency(effectiveAmount) : ''}</>
              }
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
