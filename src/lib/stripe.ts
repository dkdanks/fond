import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

export const JOYABL_FEE_RATE = 0.0498 // 4.98% (GST-inclusive for AU)

/**
 * Calculate Joyabl's platform fee on a contribution.
 * The fee is GST-inclusive (standard AU consumer pricing).
 */
export function calculateFee(amountCents: number): number {
  return Math.round(amountCents * JOYABL_FEE_RATE)
}

/**
 * GST component of the fee (for Joyabl's tax accounting).
 * Australian GST: working back from a GST-inclusive price, GST = price / 11.
 */
export function calculateGst(feeCents: number): number {
  return Math.round(feeCents / 11)
}

/**
 * Net amount the event organiser receives after the platform fee.
 */
export function calculateNetAmount(amountCents: number): number {
  return amountCents - calculateFee(amountCents)
}
