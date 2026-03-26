import { createClient } from '@/lib/supabase/client'

/**
 * Verifies the authenticated user owns the given event.
 * Returns the user id if ownership is confirmed, null otherwise.
 * Call this at the start of every client-side load() function.
 */
export async function guardEvent(eventId: string): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', user.id)
    .maybeSingle()

  return data ? user.id : null
}
