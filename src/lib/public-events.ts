import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Event } from '@/types'

type PublicEventRow = Event & {
  access_password?: string | null
}

export const getPublicEventBySlug = cache(async (slug: string): Promise<PublicEventRow | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('*, access_password')
    .eq('slug', slug)
    .single()

  return (data as PublicEventRow | null) ?? null
})
