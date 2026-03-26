'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardEmptyState, DashboardPage, DashboardPageHeader } from '@/components/dashboard/page-layout'
import { DashboardCard, DashboardCardDescription, DashboardCardTitle } from '@/components/dashboard/surface'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Guest } from '@/types'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

export default function InvitationsPage() {
  const { id } = useParams<{ id: string }>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function loadGuests() {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (!cancelled) {
        setGuests(data ?? [])
        setLoading(false)
      }
    }

    void loadGuests()

    return () => {
      cancelled = true
    }
  }, [id, supabase])

  function toggleGuest(guestId: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(guests.map(g => g.id)))
  }

  async function sendInvitations() {
    setSending(true)
    const res = await fetch('/api/send-invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: id, guestIds: Array.from(selected) }),
    })
    if (res.ok) {
      setSent(true)
      const { data } = await supabase.from('guests').select('*').eq('event_id', id)
      setGuests(data ?? [])
      setSelected(new Set())
    }
    setSending(false)
  }

  const uninvited = guests.filter(g => !g.invitation_sent_at)
  const invited = guests.filter(g => g.invitation_sent_at)

  return (
    <DashboardPage width="narrow" className="px-0 py-0">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
      </div>

      <DashboardPageHeader
        title="Invitations"
        actions={selected.size > 0 ? (
          <Button size="sm" onClick={sendInvitations} disabled={sending}>
            <Send size={14} />
            {sending ? 'Sending…' : `Send to ${selected.size}`}
          </Button>
        ) : undefined}
        className="mb-6"
      />

      {sent && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: '#E8F4F0', color: '#2D7A5A' }}
        >
          Invitations sent successfully.
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading…</p>
      ) : guests.length === 0 ? (
        <DashboardEmptyState
          title="No guests yet"
          description="Add guests first before sending invitations."
          action={(
            <Link href={`/events/${id}/guests`} className="inline-block">
              <Button size="sm" variant="secondary">Go to Guests</Button>
            </Link>
          )}
        />
      ) : (
        <>
          {uninvited.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <DashboardCardTitle className="text-sm" style={{ color: '#6B7280' }}>
                  Not yet invited ({uninvited.length})
                </DashboardCardTitle>
                <button
                  className="text-xs font-medium"
                  style={{ color: '#C9A96E' }}
                  onClick={selectAll}
                >
                  Select all
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {uninvited.map((guest) => (
                  <label
                    key={guest.id}
                    className="flex items-center gap-3 rounded-2xl border px-5 py-4 cursor-pointer transition-colors"
                    style={{
                      background: selected.has(guest.id) ? '#F5EDD9' : 'white',
                      borderColor: selected.has(guest.id) ? '#C9A96E' : '#E5E5E4',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(guest.id)}
                      onChange={() => toggleGuest(guest.id)}
                      className="w-4 h-4 accent-[#C9A96E]"
                    />
                    <div>
                      <DashboardCardTitle className="text-sm" style={{ color: '#1C1C1C' }}>{guest.name}</DashboardCardTitle>
                      <DashboardCardDescription style={{ color: '#9CA3AF' }}>{guest.email}</DashboardCardDescription>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {invited.length > 0 && (
            <div>
              <DashboardCardTitle className="text-sm mb-3" style={{ color: '#6B7280' }}>
                Already invited ({invited.length})
              </DashboardCardTitle>
              <div className="flex flex-col gap-2">
                {invited.map((guest) => (
                  <DashboardCard
                    key={guest.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ background: 'white', borderColor: '#E5E5E4' }}
                  >
                    <div>
                      <DashboardCardTitle className="text-sm" style={{ color: '#1C1C1C' }}>{guest.name}</DashboardCardTitle>
                      <DashboardCardDescription style={{ color: '#9CA3AF' }}>{guest.email}</DashboardCardDescription>
                    </div>
                    <Badge variant={guest.rsvp_status === 'attending' ? 'success' : guest.rsvp_status === 'declined' ? 'warning' : 'muted'}>
                      {guest.rsvp_status}
                    </Badge>
                  </DashboardCard>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardPage>
  )
}
