import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PUBLISH_EVENT_PRICE_ID, stripe } from '@/lib/stripe'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!PUBLISH_EVENT_PRICE_ID) {
    return NextResponse.json({ error: 'Missing STRIPE_PUBLISH_PRICE_ID' }, { status: 500 })
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, title, publish_fee_status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  if (event.publish_fee_status === 'paid') {
    return NextResponse.json({ error: 'Publish fee already paid' }, { status: 409 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin
  const successUrl = `${baseUrl}/events/${id}/settings?publish=ready`
  const cancelUrl = `${baseUrl}/events/${id}/settings?publish=cancelled`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: PUBLISH_EVENT_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: user.email ?? undefined,
    metadata: {
      purpose: 'publish_event',
      event_id: event.id,
      user_id: user.id,
    },
    payment_intent_data: {
      metadata: {
        purpose: 'publish_event',
        event_id: event.id,
        user_id: user.id,
      },
      description: `Publish fee for ${event.title}`,
    },
  })

  await supabase
    .from('events')
    .update({
      publish_fee_status: 'pending',
      publish_fee_checkout_session_id: session.id,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  return NextResponse.json({ url: session.url })
}
