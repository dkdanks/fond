'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Shield, Clock, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, ArrowRight, CreditCard, Building2, Wallet,
  Loader2, Check, ExternalLink
} from 'lucide-react'
import { formatCurrency } from '@/types'
import type { Contribution } from '@/types'

interface PayoutDetails {
  bsb: string
  account_number: string
  account_name: string
}

const FAQS = [
  {
    q: 'When will I receive my money?',
    a: 'Payouts are processed within 2–3 business days of your request. Funds are transferred directly to your nominated bank account.',
  },
  {
    q: 'Is my guests\' money safe?',
    a: 'All payments are processed by Stripe, one of the world\'s most trusted payment platforms. Your guests\' card details are never stored on our servers.',
  },
  {
    q: 'What fees do you charge?',
    a: 'We charge a 4.98% platform fee (inclusive of GST) on each contribution. This covers payment processing, platform maintenance, and support. There are no setup fees or monthly charges.',
  },
  {
    q: 'Can I get a partial payout before the event?',
    a: 'Yes. You can request a payout at any time, for any amount up to your current available balance.',
  },
  {
    q: 'What if a guest requests a refund?',
    a: 'Refund requests are handled on a case-by-case basis. Contact our support team and we\'ll help resolve it. In most cases, refunds are processed within 5–10 business days.',
  },
  {
    q: 'Is there a minimum payout amount?',
    a: 'The minimum payout is $10. There\'s no maximum — you can request your full balance at any time.',
  },
]

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }

export default function RegistryPaymentsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [payout, setPayout] = useState<PayoutDetails>({ bsb: '', account_number: '', account_name: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [payoutRequested, setPayoutRequested] = useState(false)
  const [showPayoutForm, setShowPayoutForm] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [{ data: contribs, error: err1 }, { data: ev, error: err2 }] = await Promise.all([
        supabase.from('contributions').select('*').eq('event_id', id).eq('status', 'completed'),
        supabase.from('events').select('content').eq('id', id).single(),
      ])
      if (err1) throw err1
      if (err2) throw err2
      setContributions(contribs ?? [])
      const content = ev?.content as Record<string, unknown> | null
      if (content?.payout_details) {
        setPayout(content.payout_details as PayoutDetails)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  async function savePayout() {
    setSaving(true)
    try {
      const { data: ev, error: fetchErr } = await supabase.from('events').select('content').eq('id', id).single()
      if (fetchErr) throw fetchErr
      const existing = (ev?.content as Record<string, unknown>) ?? {}
      const { error: updateErr } = await supabase.from('events').update({ content: { ...existing, payout_details: payout } } as Record<string, unknown>).eq('id', id)
      if (updateErr) throw updateErr
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save payout details', err)
    } finally {
      setSaving(false)
    }
  }

  async function requestPayout() {
    setRequestingPayout(true)
    // In production: call a payout API endpoint
    await new Promise(r => setTimeout(r, 1500))
    setRequestingPayout(false)
    setPayoutRequested(true)
    setTimeout(() => setPayoutRequested(false), 5000)
  }

  const totalRaised = contributions.reduce((s, c) => s + c.amount, 0)
  const totalFees = contributions.reduce((s, c) => s + c.fee_amount, 0)
  const available = totalRaised - totalFees

  const STEPS = [
    { icon: CreditCard, label: 'Guest contributes', sub: 'Secured by Stripe' },
    { icon: Shield, label: 'Funds held safely', sub: 'In your account' },
    { icon: Clock, label: 'You request payout', sub: 'Any time' },
    { icon: Building2, label: 'Bank transfer', sub: '2–3 business days' },
  ]

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>Payments</h1>
        <p className="text-sm" style={{ color: '#8B8670' }}>Manage how contributions are collected and how you receive your funds.</p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Total raised', value: formatCurrency(totalRaised), sub: `${contributions.length} contribution${contributions.length !== 1 ? 's' : ''}` },
          { label: 'Platform fees', value: formatCurrency(totalFees), sub: '4.98% incl. GST' },
          { label: 'Available to pay out', value: formatCurrency(available), sub: 'After fees', highlight: true },
        ].map(({ label, value, sub, highlight }) => (
          <div key={label} className="rounded-2xl border p-3 md:p-5" style={{ background: highlight ? '#F5F0E8' : 'white', borderColor: highlight ? '#D4CCBC' : '#E8E3D9' }}>
            <p className="text-xs mb-2 font-medium" style={{ color: '#B5A98A' }}>{label}</p>
            <p className="text-xl md:text-2xl font-semibold mb-0.5" style={{ color: '#2C2B26' }}>{value}</p>
            <p className="text-xs" style={{ color: '#8B8670' }}>{sub}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-sm mb-4" style={{ color: '#8B8670' }}>{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#2C2B26', color: '#FAFAF7' }}
          >
            Try again
          </button>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: 'white', borderColor: '#E8E3D9' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: '#2C2B26' }}>How payouts work</h2>
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: '#8B8670' }}
          >
            Powered by Stripe <ExternalLink size={11} />
          </a>
        </div>

        {/* Timeline */}
        <div className="flex flex-col sm:flex-row items-start gap-0">
          {STEPS.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center text-center relative w-full sm:w-auto">
              {i < STEPS.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-1/2 w-full h-px" style={{ background: '#E8E3D9' }} />
              )}
              <div className="w-10 h-10 rounded-full flex items-center justify-center relative z-10 mb-2" style={{ background: '#F5F0E8', border: '2px solid white' }}>
                <step.icon size={16} style={{ color: '#8B8670' }} />
              </div>
              <p className="text-xs font-medium" style={{ color: '#2C2B26' }}>{step.label}</p>
              <p className="text-xs" style={{ color: '#B5A98A' }}>{step.sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 p-3 rounded-xl flex items-start gap-3" style={{ background: '#F5F0E8' }}>
          <Shield size={16} className="shrink-0 mt-0.5" style={{ color: '#8B8670' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#6B5E4A' }}>
            All contributions are processed securely through <strong>Stripe</strong>, a PCI-DSS Level 1 certified payment provider. Your guests' payment details are never stored on our servers.
            {' '}<a href="https://stripe.com/security" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#8B8670' }}>Learn more</a>
          </p>
        </div>
      </div>

      {/* Payout section */}
      <div className="rounded-2xl border p-6 mb-6" style={{ background: 'white', borderColor: '#E8E3D9' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold mb-0.5" style={{ color: '#2C2B26' }}>Request a payout</h2>
            <p className="text-xs" style={{ color: '#8B8670' }}>Transfer your available balance to your bank account.</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: '#B5A98A' }}>Available</p>
            <p className="text-lg font-semibold" style={{ color: '#2C2B26' }}>{formatCurrency(available)}</p>
          </div>
        </div>

        {available <= 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm" style={{ color: '#B5A98A' }}>No funds available to pay out yet.</p>
          </div>
        ) : (
          <button
            onClick={() => setShowPayoutForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#2C2B26', color: 'white' }}
          >
            <Wallet size={14} /> Request payout
          </button>
        )}

        {showPayoutForm && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: '#F0EDE8' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#2C2B26' }}>Bank details for this payout</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Account name</label>
                <input className={inputCls} style={inputStyle} placeholder="Jane Smith" value={payout.account_name} onChange={e => setPayout(p => ({ ...p, account_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>BSB</label>
                <input className={inputCls} style={inputStyle} placeholder="012-345" value={payout.bsb} onChange={e => setPayout(p => ({ ...p, bsb: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Account number</label>
                <input className={inputCls} style={inputStyle} placeholder="12345678" value={payout.account_number} onChange={e => setPayout(p => ({ ...p, account_number: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => { await savePayout(); await requestPayout() }}
                disabled={requestingPayout || !payout.account_name || !payout.bsb || !payout.account_number}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: payoutRequested ? '#4CAF50' : '#2C2B26', color: 'white', opacity: requestingPayout ? 0.7 : 1 }}
              >
                {requestingPayout ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : payoutRequested ? <><Check size={14} /> Requested!</> : <>Submit payout request</>}
              </button>
              <button onClick={() => setShowPayoutForm(false)} className="text-sm" style={{ color: '#8B8670' }}>Cancel</button>
            </div>
            <p className="text-xs mt-3" style={{ color: '#B5A98A' }}>Funds will arrive in your account within 2–3 business days. You'll receive a confirmation email.</p>
          </div>
        )}
      </div>

      {/* Save bank details separately */}
      {!showPayoutForm && (
        <div className="rounded-2xl border p-6 mb-6" style={{ background: 'white', borderColor: '#E8E3D9' }}>
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#2C2B26' }}>Saved bank details</h2>
          <p className="text-xs mb-4" style={{ color: '#8B8670' }}>Save your bank details so they're ready when you request a payout.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Account name</label>
              <input className={inputCls} style={inputStyle} placeholder="Jane Smith" value={payout.account_name} onChange={e => setPayout(p => ({ ...p, account_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>BSB</label>
              <input className={inputCls} style={inputStyle} placeholder="012-345" value={payout.bsb} onChange={e => setPayout(p => ({ ...p, bsb: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Account number</label>
              <input className={inputCls} style={inputStyle} placeholder="12345678" value={payout.account_number} onChange={e => setPayout(p => ({ ...p, account_number: e.target.value }))} />
            </div>
          </div>
          <button
            onClick={savePayout}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: saved ? '#4CAF50' : '#2C2B26', color: 'white' }}
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><Check size={14} /> Saved!</> : 'Save details'}
          </button>
        </div>
      )}

      {/* FAQ */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: '#E8E3D9' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: '#F0EDE8' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Frequently asked questions</h2>
        </div>
        {FAQS.map((faq, i) => (
          <div key={i} className="border-b last:border-b-0" style={{ borderColor: '#F0EDE8' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors"
              style={{ color: '#2C2B26' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF7')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="text-sm font-medium">{faq.q}</span>
              {openFaq === i ? <ChevronUp size={15} style={{ color: '#8B8670', flexShrink: 0 }} /> : <ChevronDown size={15} style={{ color: '#B5A98A', flexShrink: 0 }} />}
            </button>
            {openFaq === i && (
              <div className="px-6 pb-4">
                <p className="text-sm leading-relaxed" style={{ color: '#8B8670' }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Help link */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: '#B5A98A' }}>
          Have a question not answered here?{' '}
          <button className="underline transition-colors" style={{ color: '#8B8670' }}>Contact support</button>
        </p>
      </div>
    </div>
  )
}
