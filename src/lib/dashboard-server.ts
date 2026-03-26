import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requireDashboardUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return { supabase, user }
}

export async function requireOwnedEvent<T = Record<string, unknown>>(eventId: string, select = '*') {
  const { supabase, user } = await requireDashboardUser()

  const { data: event } = await supabase
    .from('events')
    .select(select)
    .eq('id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!event) notFound()

  return {
    supabase,
    user,
    event: event as T,
  }
}
