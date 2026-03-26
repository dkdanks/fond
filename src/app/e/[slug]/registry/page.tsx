'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import { calculateFee, formatCurrency, type RegistryPool } from '@/types'
import { ArrowLeft, Check, Heart, Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const QUICK_AMOUNTS = [2500, 5000, 10000, 25000]

type Step = 'pick' | 'details' | 'payment'
type SelectedFund = RegistryPool | null | undefined

interface FundProgress {
  [poolId: string]: number
}

// ── Inner payment form (must be inside <Elements>) ───────────────────────────
function PaymentForm({
  amountCents,
  name,
  primaryColor,
  bgColor,
  onSuccess,
  onError,
}: {
  amountCents: number
  name: string
  primaryColor: string
  bgColor: string
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}?success=1`,
      },
    })

    if (error) {
      onError(error.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess()
    } else {
      onError('Payment incomplete. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handlePay}>
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="mt-6 w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
        style={{ background: primaryColor, color: bgColor }}
      >
        {submitting
          ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
          : <><Check size={14} /> Pay {formatCurrency(amountCents)}</>
        }
      </button>
    </form>
  )
}

// ── Fund Card ─────────────────────────────────────────────────────────────────
function FundCard({
  fund,
  raised,
  pct,
  primaryColor,
  bgColor,
  onClick,
}: {
  fund: RegistryPool
  raised: number
  pct: number | null
  primaryColor: string
  bgColor: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left w-full rounded-2xl p-5 border transition-all hover:shadow-sm"
      style={{ background: 'white', borderColor: `${primaryColor}18` }}
    >
      <p className="text-xs font-medium mb-2.5 opacity-50" style={{ color: primaryColor }}>
        {fund.group_name ?? 'Gift fund'}
      </p>
      <p className="font-semibold text-base mb-1 leading-snug" style={{ color: primaryColor, letterSpacing: '-0.01em' }}>
        {fund.title}
      </p>
      {fund.description && (
        <p className="text-xs mb-3 opacity-55 leading-relaxed line-clamp-2" style={{ color: primaryColor }}>
          {fund.description}
        </p>
      )}
      {fund.target_amount && pct !== null ? (
        <div className="mt-3">
          <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: `${primaryColor}12` }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: primaryColor }} />
          </div>
          <p className="text-xs opacity-35" style={{ color: primaryColor }}>{pct}% funded</p>
        </div>
      ) : (
        <p className="text-xs mt-3 opacity-35 group-hover:opacity-60 transition-opacity" style={{ color: primaryColor }}>
          Contribute →
        </p>
      )}
    </button>
  )
}

// ── Main registry page ────────────────────────────────────────────────────────
export default function RegistryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [primaryColor, setPrimaryColor] = useState('#2C2B26')
  const [bgColor, setBgColor] = useState('#F5F0E8')
  const [font, setFont] = useState('Inter')
  const [eventId, setEventId] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [funds, setFunds] = useState<RegistryPool[]>([])
  const [progress, setProgress] = useState<FundProgress>({})
  const [step, setStep] = useState<Step>('pick')
  const [selectedFund, setSelectedFund] = useState<SelectedFund>(undefined)

  // Details form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [amountCents, setAmountCents] = useState(5000)
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    // Handle Stripe redirect return (3DS flows)
    const url = new URL(window.location.href)
    if (url.searchParams.get('success') === '1') {
      setDone(true)
    }

    // Pre-fill name and email from URL params (e.g. from invitation email links)
    const params = new URLSearchParams(window.location.search)
    const n = params.get('name')
    const e = params.get('email')
    if (n) setName(n)
    if (e) setEmail(e)
  }, [])

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
      setEventTitle(ev.title ?? '')

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

      const prog: FundProgress = {}
      for (const c of contribData ?? []) {
        if (c.pool_id) prog[c.pool_id] = (prog[c.pool_id] ?? 0) + c.amount
      }
      setProgress(prog)
    }
    load()
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const effectiveAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountCents
  const fee = calculateFee(effectiveAmount)
  const theyReceive = effectiveAmount - fee

  async function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault()
    if (effectiveAmount < 100) { setError('Minimum contribution is $1.'); return }
    if (!name.trim()) { setError('Please enter your name.'); return }
    setLoadingPayment(true)
    setError('')

    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        poolId: selectedFund?.id ?? null,
        contributorName: name,
        contributorEmail: email || null,
        message: message || null,
        amountCents: effectiveAmount,
      }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setLoadingPayment(false)
      return
    }

    const { clientSecret: secret } = await res.json()
    setClientSecret(secret)
    setStep('payment')
    setLoadingPayment(false)
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors'
  const inputStyle = { borderColor: `${primaryColor}20`, background: 'white', color: primaryColor }

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: bgColor, fontFamily: `'${font}', serif` }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap');`}</style>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: `${primaryColor}15` }}>
          <Heart size={28} style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: primaryColor }}>Thank you{name ? `, ${name}` : ''}!</h1>
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

  const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: primaryColor,
      colorBackground: '#FFFFFF',
      fontFamily: font,
      borderRadius: '12px',
      spacingUnit: '5px',
    },
  }

  return (
    <div className="min-h-screen" style={{ background: bgColor, fontFamily: `'${font}', serif`, color: primaryColor }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap');`}</style>

      {/* Nav */}
      <nav
        className="px-6 py-3.5 border-b flex items-center gap-3 sticky top-0 z-10"
        style={{ borderColor: `${primaryColor}12`, background: bgColor }}
      >
        {step !== 'pick' ? (
          <button
            onClick={() => {
              if (step === 'payment') { setStep('details'); setClientSecret(null) }
              else { setStep('pick'); setSelectedFund(undefined) }
            }}
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
          {step === 'payment' ? 'Payment' : step === 'details' ? (selectedFund ? selectedFund.title : 'Give a gift') : 'Registry'}
        </span>
      </nav>

      {/* ── Step 1: Pick fund ─────────────────────────────────────────────── */}
      {step === 'pick' && (() => {
        // Group funds by group_name; ungrouped first
        const grouped: Record<string, RegistryPool[]> = {}
        for (const fund of funds) {
          const key = fund.group_name ?? '__ungrouped__'
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(fund)
        }
        const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
          if (a === '__ungrouped__') return -1
          if (b === '__ungrouped__') return 1
          return a.localeCompare(b)
        })

        return (
          <>
            {/* Hero */}
            <div className="px-4 py-10 md:px-8 md:py-16 text-center border-b" style={{ borderColor: `${primaryColor}12` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-35" style={{ color: primaryColor }}>Registry</p>
              <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: primaryColor, letterSpacing: '-0.03em' }}>
                {eventTitle}
              </h1>
              <p className="text-sm opacity-50" style={{ color: primaryColor }}>
                Choose a gift or contribute to any of our funds below
              </p>
            </div>

            {/* Grid */}
            <div className="px-4 md:px-12 py-8 md:py-10 max-w-6xl mx-auto">
              {/* "Give a general gift" banner */}
              <button
                onClick={() => { setSelectedFund(null); setStep('details') }}
                className="w-full mb-10 flex items-center justify-between px-8 py-6 rounded-2xl transition-all hover:shadow-sm"
                style={{ background: 'white', border: `1px solid ${primaryColor}15` }}
              >
                <div>
                  <p className="font-semibold text-base mb-0.5" style={{ color: primaryColor }}>Give a general gift</p>
                  <p className="text-sm opacity-50" style={{ color: primaryColor }}>Let the couple decide where your gift goes.</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background: `${primaryColor}10`, color: primaryColor }}>→</div>
              </button>

              {/* Grouped fund cards */}
              {sortedGroups.map(([groupName, groupFunds]) => (
                <div key={groupName} className="mb-12">
                  {groupName !== '__ungrouped__' && (
                    <h2 className="text-xl font-semibold mb-6" style={{ color: primaryColor, letterSpacing: '-0.02em' }}>
                      {groupName}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {groupFunds.map(fund => {
                      const raised = progress[fund.id] ?? 0
                      const pct = fund.target_amount ? Math.min(Math.round((raised / fund.target_amount) * 100), 100) : null
                      return (
                        <FundCard
                          key={fund.id}
                          fund={fund}
                          raised={raised}
                          pct={pct}
                          primaryColor={primaryColor}
                          bgColor={bgColor}
                          onClick={() => { setSelectedFund(fund); setStep('details') }}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      })()}

      {/* ── Step 2: Details form ──────────────────────────────────────────── */}
      {step === 'details' && (
        <div className="max-w-md mx-auto px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: primaryColor }}>
            {selectedFund ? selectedFund.title : 'Give a gift'}
          </h1>
          <p className="text-sm mb-8 opacity-55" style={{ color: primaryColor }}>
            {selectedFund?.description ?? 'Your gift will go wherever it\'s needed most.'}
          </p>

          <form onSubmit={handleContinueToPayment} className="flex flex-col gap-5">
            {/* Amount */}
            <div>
              <label className="text-sm font-medium block mb-2.5" style={{ color: primaryColor }}>Choose an amount</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setAmountCents(amt); setCustomAmount('') }}
                    className="py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: amountCents === amt && !customAmount ? primaryColor : `${primaryColor}20`,
                      background: amountCents === amt && !customAmount ? `${primaryColor}10` : 'white',
                      color: primaryColor,
                    }}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Or enter your own amount ($)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setAmountCents(0) }}
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
                  <span className="opacity-55" style={{ color: primaryColor }}>Joyabl fee (4.98% incl. GST)</span>
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
                Email <span className="opacity-40 font-normal">(for receipt)</span>
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

            <button
              type="submit"
              disabled={loadingPayment || effectiveAmount < 100}
              className="w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
              style={{ background: primaryColor, color: bgColor }}
            >
              {loadingPayment
                ? <><Loader2 size={14} className="animate-spin" /> Preparing payment…</>
                : <>Continue to payment →</>
              }
            </button>
          </form>
        </div>
      )}

      {/* ── Step 3: Stripe Payment ────────────────────────────────────────── */}
      {step === 'payment' && clientSecret && (
        <div className="max-w-md mx-auto px-6 pt-10 pb-16">
          <h1 className="text-2xl font-semibold mb-1" style={{ color: primaryColor }}>Payment</h1>
          <p className="text-sm mb-8 opacity-55" style={{ color: primaryColor }}>
            {name ? `Hi ${name} —` : ''} your contribution of {formatCurrency(effectiveAmount)} is ready to be sent.
          </p>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: stripeAppearance,
            }}
          >
            <PaymentForm
              amountCents={effectiveAmount}
              name={name}
              primaryColor={primaryColor}
              bgColor={bgColor}
              onSuccess={() => setDone(true)}
              onError={(msg) => { setError(msg); setStep('details') }}
            />
          </Elements>

          {error && <p className="mt-4 text-sm" style={{ color: '#EF4444' }}>{error}</p>}

          <p className="mt-6 text-center text-xs opacity-30" style={{ color: primaryColor }}>
            Secured by Stripe · Payments processed in AUD
          </p>
        </div>
      )}
    </div>
  )
}
