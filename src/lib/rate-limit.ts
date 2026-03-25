/**
 * Simple in-memory rate limiter.
 * Works for single-instance (Node.js dev + Vercel functions while warm).
 * For higher scale, swap with Upstash Redis + @upstash/ratelimit.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Returns true if the request is allowed, false if rate limited.
 * @param key      Unique key (e.g. `${route}:${ip}`)
 * @param limit    Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** Extract the best available IP from a Next.js request. */
export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
