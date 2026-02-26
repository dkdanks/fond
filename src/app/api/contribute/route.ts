import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateFee } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const { eventId, poolId, contributorName, contributorEmail, message, amountPence } = await req.json()

  if (!eventId || !contributorName || !amountPence || amountPence < 100) {
    return NextResponse.json({ error: 'Invalid contribution data' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, status')
    .eq('id', eventId)
    .eq('status', 'published')
    .single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const feeAmount = calculateFee(amountPence)

  // Mock payment — replace with real Stripe PaymentIntent when ready
  const mockPaymentIntentId = `mock_pi_${Date.now()}`

  const { data: contribution, error } = await supabase
    .from('contributions')
    .insert({
      event_id: eventId,
      pool_id: poolId ?? null,
      contributor_name: contributorName,
      contributor_email: contributorEmail ?? null,
      message: message ?? null,
      amount: amountPence,
      fee_amount: feeAmount,
      status: 'completed', // Mocked — set to 'pending' when real Stripe is added
      stripe_payment_intent_id: mockPaymentIntentId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 })

  return NextResponse.json({ success: true, contribution })
}
