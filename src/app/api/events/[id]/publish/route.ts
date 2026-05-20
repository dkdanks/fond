import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { targetStatus } = await req.json() as { targetStatus?: 'draft' | 'published' }

  if (!targetStatus || !['draft', 'published'].includes(targetStatus)) {
    return NextResponse.json({ error: 'Invalid target status' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, status, publish_fee_status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  if (targetStatus === 'published' && event.publish_fee_status !== 'paid') {
    return NextResponse.json({ error: 'Publish fee required' }, { status: 402 })
  }

  const patch: Record<string, string | null> = {
    status: targetStatus,
  }

  if (targetStatus === 'published') {
    patch.published_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('events')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
