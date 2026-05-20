'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { DashboardModal } from '@/components/dashboard/modal'
import { PUBLISH_EVENT_FEE_CENTS } from '@/lib/stripe'
import type { PublishFeeStatus } from '@/types'

function formatFee(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

export function PublishButton({
  eventId,
  eventTitle,
  publishFeeStatus,
  isPublished,
  variant = 'button',
  className,
}: {
  eventId: string
  eventTitle: string
  publishFeeStatus?: PublishFeeStatus | null
  isPublished: boolean
  variant?: 'button' | 'card'
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(searchParams.get('publish') === 'ready')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolvedPublishFeeStatus: PublishFeeStatus = publishFeeStatus ?? 'unpaid'

  useEffect(() => {
    if (searchParams.get('publish') === 'ready' && resolvedPublishFeeStatus !== 'paid') {
      const timer = setTimeout(() => router.refresh(), 1200)
      return () => clearTimeout(timer)
    }
  }, [resolvedPublishFeeStatus, router, searchParams])

  async function openCheckout() {
    setLoading(true)
    setError('')
    const response = await fetch(`/api/events/${eventId}/publish-checkout`, {
      method: 'POST',
    })
    const json = await response.json()
    if (response.ok && json.url) {
      window.location.href = json.url
      return
    }
    setError(json.error ?? 'Something went wrong. Please try again.')
    setLoading(false)
  }

  async function publishNow() {
    setLoading(true)
    setError('')
    const response = await fetch(`/api/events/${eventId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetStatus: 'published' }),
    })

    if (response.ok) {
      setOpen(false)
      router.refresh()
      return
    }

    const json = await response.json().catch(() => ({}))
    setError(json.error ?? 'Something went wrong. Please try again.')
    setLoading(false)
  }

  const feePaid = resolvedPublishFeeStatus === 'paid'
  const body = feePaid ? (
    <>
      <div className="rounded-2xl border p-4" style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}>
        <p className="mb-2 text-sm font-medium" style={{ color: '#2C2B26' }}>
          Your event is ready to go live
        </p>
        <p className="text-sm leading-6" style={{ color: '#6B6255' }}>
          Everything is unlocked for <span className="font-medium">{eventTitle}</span>. Publish when it feels ready and guests will be able to open the page straight away.
        </p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void publishNow()}
          disabled={loading || isPublished}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity"
          style={{ background: '#2C2B26', color: '#FAFAF7', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Publish event
        </button>
      </div>
    </>
  ) : resolvedPublishFeeStatus === 'pending' ? (
    <>
      <div className="rounded-2xl border p-4" style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}>
        <p className="mb-2 text-sm font-medium" style={{ color: '#2C2B26' }}>
          Confirming your payment
        </p>
        <p className="text-sm leading-6" style={{ color: '#6B6255' }}>
          We&apos;re waiting for Stripe to confirm the checkout. This usually only takes a moment.
        </p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          style={{ background: '#2C2B26', color: '#FAFAF7' }}
        >
          <Loader2 size={14} className="animate-spin" />
          Refresh status
        </button>
      </div>
    </>
  ) : (
    <>
      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border p-4" style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}>
          <p className="mb-2 text-sm font-medium" style={{ color: '#2C2B26' }}>
            Go live when everything feels ready
          </p>
          <p className="text-sm leading-6" style={{ color: '#6B6255' }}>
            Publishing makes your event page shareable with guests, turns on your public link, and lets people RSVP and contribute in one polished place.
          </p>
        </div>
        <div className="rounded-2xl border p-4" style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}>
          <p className="mb-1 text-xs uppercase tracking-wide" style={{ color: '#B5A98A' }}>
            One-time publish fee
          </p>
          <p className="text-2xl font-medium" style={{ color: '#2C2B26', letterSpacing: '-0.03em' }}>
            {formatFee(PUBLISH_EVENT_FEE_CENTS)}
          </p>
          <p className="mt-2 text-xs leading-5" style={{ color: '#8B8670' }}>
            Per event. Once paid, you can unpublish and republish this event whenever you need.
          </p>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void openCheckout()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity"
          style={{ background: '#2C2B26', color: '#FAFAF7', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          Continue to secure checkout
        </button>
      </div>
    </>
  )

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={className ?? 'rounded-2xl border p-4 text-left transition-colors'}
          style={{
            borderColor: '#E8E3D9',
            background: '#FFFFFF',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: '#F5F0E8', color: '#8B8670' }}
            >
              <Sparkles size={15} />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium" style={{ color: '#2C2B26' }}>
                {feePaid ? 'Publish event' : 'Unlock publishing'}
              </p>
              <p className="text-xs leading-5" style={{ color: '#8B8670' }}>
                {feePaid
                  ? 'Your publish fee is already covered. Make the event live whenever you are ready.'
                  : 'Make the event shareable with guests once the one-time publish fee is covered.'}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: '#2C2B26', color: 'white' }}
        >
          {feePaid ? 'Publish event' : 'Publish to go live'}
        </button>
      )}

      <DashboardModal
        open={open}
        onClose={() => setOpen(false)}
        title={feePaid ? 'Publish your event' : 'Ready to share your event?'}
        description={feePaid
          ? 'Your publish fee is already sorted for this event.'
          : 'A simple one-time checkout unlocks publishing for this event.'}
      >
        <div className="flex flex-col gap-5">
          {body}
          {error && (
            <p className="text-sm" style={{ color: '#8B8670' }}>{error}</p>
          )}
        </div>
      </DashboardModal>
    </>
  )
}
