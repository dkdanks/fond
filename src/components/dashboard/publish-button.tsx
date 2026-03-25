'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function PublishButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function publish() {
    setLoading(true)
    await supabase.from('events').update({ status: 'published' }).eq('id', eventId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={publish}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
      style={{ background: '#2C2B26', color: 'white', opacity: loading ? 0.7 : 1 }}
    >
      {loading ? 'Publishing…' : 'Publish to go live'}
    </button>
  )
}
