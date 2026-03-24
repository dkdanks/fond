// Stripe integration — ready to activate when payments go live
// To enable: add STRIPE_SECRET_KEY to env and uncomment below

// import Stripe from 'stripe'
// export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-11-20.acacia',
// })

export const JOYABL_FEE_RATE = 0.0498 // 4.98%
/** @deprecated use JOYABL_FEE_RATE */
export const FOND_FEE_RATE = JOYABL_FEE_RATE

export function calculateFee(amountPence: number): number {
  return Math.round(amountPence * JOYABL_FEE_RATE)
}

// Placeholder — replace with real Stripe PaymentIntent creation
export async function createMockPaymentIntent(amountPence: number) {
  console.log(`[Stripe mock] Would create PaymentIntent for $${(amountPence / 100).toFixed(2)}`)
  return { id: `mock_pi_${Date.now()}`, status: 'succeeded' }
}
