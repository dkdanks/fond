import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

// Slugs reserved for static demo/marketing pages under /e/
const RESERVED_SLUGS = new Set([
  'sarah-and-james',
])

export async function GET(request: NextRequest) {
  if (!checkRateLimit(`check-slug:${getIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('slug') ?? ''
  const slug = slugify(raw)

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, slug, reason: 'too_short' })
  }

  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ available: false, slug, reason: 'reserved' })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return NextResponse.json({ available: !data, slug })
}
