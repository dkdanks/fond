import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { slugify } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('slug') ?? ''
  const slug = slugify(raw)

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, slug, reason: 'too_short' })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return NextResponse.json({ available: !data, slug })
}
