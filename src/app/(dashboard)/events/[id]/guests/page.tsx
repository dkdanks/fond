'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Guest } from '@/types'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const supabase = createClient()

  async function loadGuests() {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
    setGuests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadGuests() }, [])

  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    await supabase.from('guests').insert({ event_id: id, name, email })
    setName('')
    setEmail('')
    setShowForm(false)
    setAdding(false)
    loadGuests()
  }

  async function removeGuest(guestId: string) {
    await supabase.from('guests').delete().eq('id', guestId)
    loadGuests()
  }

  const attending = guests.filter(g => g.rsvp_status === 'attending').length
  const declined = guests.filter(g => g.rsvp_status === 'declined').length
  const pending = guests.filter(g => g.rsvp_status === 'pending').length

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#1C1C1C' }}>Guests</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            {attending} attending · {declined} declined · {pending} pending
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Add guest
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={addGuest}
          className="rounded-2xl border p-5 mb-6"
          style={{ background: 'white', borderColor: '#E5E5E4' }}
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Name"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={adding}>
              {adding ? 'Adding…' : 'Add guest'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading…</p>
      ) : guests.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: '#E5E5E4' }}
        >
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No guests yet. Add your first guest above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center justify-between rounded-2xl border px-5 py-4"
              style={{ background: 'white', borderColor: '#E5E5E4' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#1C1C1C' }}>{guest.name}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{guest.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    guest.rsvp_status === 'attending' ? 'success' :
                    guest.rsvp_status === 'declined' ? 'warning' : 'muted'
                  }
                >
                  {guest.rsvp_status}
                </Badge>
                {guest.invitation_sent_at && (
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Invited</span>
                )}
                <button
                  onClick={() => removeGuest(guest.id)}
                  className="text-[#9CA3AF] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
