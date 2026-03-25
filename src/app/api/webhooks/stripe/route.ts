import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Stripe requires the raw body for signature verification
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEvent>>

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const paymentIntentId = paymentIntent.id

    const { error } = await supabase
      .from('contributions')
      .update({ status: 'completed' })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('status', 'pending')

    if (error) {
      console.error('[Stripe webhook] Failed to update contribution:', error)
      // Return 500 so Stripe retries the webhook
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object

    await supabase
      .from('contributions')
      .update({ status: 'pending' }) // keep as pending — contributor can retry
      .eq('stripe_payment_intent_id', paymentIntent.id)
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id

    if (paymentIntentId) {
      await supabase
        .from('contributions')
        .update({ status: 'refunded' })
        .eq('stripe_payment_intent_id', paymentIntentId)
    }
  }

  return NextResponse.json({ received: true })
}
