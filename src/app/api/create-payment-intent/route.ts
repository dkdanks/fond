import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, calculateFee, calculateGst } from '@/lib/stripe'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // 10 payment attempts per IP per minute
  if (!checkRateLimit(`create-pi:${getIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }
  const { eventId, poolId, contributorName, contributorEmail, message, amountCents } = await req.json()

  if (!eventId || !contributorName || !amountCents || amountCents < 100) {
    return NextResponse.json({ error: 'Invalid contribution data' }, { status: 400 })
  }

  const supabase = await createClient()

  // Verify the event exists and is published
  const { data: event } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('id', eventId)
    .eq('status', 'published')
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const feeAmount = calculateFee(amountCents)
  const gstAmount = calculateGst(feeAmount)

  // Create Stripe PaymentIntent for the full contribution amount
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'aud',
    // Store metadata so webhook can find the contribution
    metadata: {
      eventId,
      poolId: poolId ?? '',
      contributorName,
      contributorEmail: contributorEmail ?? '',
      message: message ?? '',
      feeAmount: String(feeAmount),
      gstAmount: String(gstAmount),
    },
    description: `Contribution to ${event.title}`,
    receipt_email: contributorEmail ?? undefined,
  })

  // Insert a pending contribution record, linked to the PaymentIntent
  const { data: contribution, error } = await supabase
    .from('contributions')
    .insert({
      event_id: eventId,
      pool_id: poolId ?? null,
      contributor_name: contributorName,
      contributor_email: contributorEmail ?? null,
      message: message ?? null,
      amount: amountCents,
      fee_amount: feeAmount,
      gst_amount: gstAmount,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select('id')
    .single()

  if (error) {
    // Clean up the PaymentIntent if we couldn't create the record
    await stripe.paymentIntents.cancel(paymentIntent.id)
    return NextResponse.json({ error: 'Failed to initialise contribution' }, { status: 500 })
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    contributionId: contribution.id,
  })
}
