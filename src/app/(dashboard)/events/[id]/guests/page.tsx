'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { Guest } from '@/types'
import { Plus, Trash2, ArrowLeft, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEADER_RE = /^(name|email|guest|first.?name|last.?name)/i

interface ParsedRow {
  name: string
  email: string
  error?: string
}

function parseGuestList(raw: string): ParsedRow[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .flatMap((line): ParsedRow[] => {
      if (HEADER_RE.test(line)) return []

      const parts = line.includes('\t')
        ? line.split('\t').map((p) => p.trim().replace(/^"|"$/g, ''))
        : line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''))

      const emailIdx = parts.findIndex((p) => EMAIL_RE.test(p))
      if (emailIdx === -1) return [{ name: line, email: '', error: 'No valid email found' }]

      const email = parts[emailIdx]
      const name = parts.filter((_, i) => i !== emailIdx).join(', ').trim() || email.split('@')[0]
      return [{ name, email }]
    })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Tab = 'single' | 'import'

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('single')

  // Single add
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [addingAndInviting, setAddingAndInviting] = useState(false)

  // Bulk import
  const [importText, setImportText] = useState('')
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [sendInvites, setSendInvites] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  useEffect(() => { setParsed(importText.trim() ? parseGuestList(importText) : []) }, [importText])

  function closePanel() {
    setPanelOpen(false)
    setImportText('')
  }

  // Single add
  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    await supabase.from('guests').insert({ event_id: id, name, email })
    setName(''); setEmail(''); closePanel(); setAdding(false)
    loadGuests()
  }

  async function addGuestAndInvite(e: React.MouseEvent) {
    e.preventDefault()
    setAddingAndInviting(true)
    const { data: guest } = await supabase
      .from('guests')
      .insert({ event_id: id, name, email })
      .select()
      .single()
    if (guest) {
      await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, guestIds: [guest.id] }),
      })
    }
    setName(''); setEmail(''); closePanel(); setAddingAndInviting(false)
    loadGuests()
  }

  async function removeGuest(guestId: string) {
    await supabase.from('guests').delete().eq('id', guestId)
    loadGuests()
  }

  // Bulk import
  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = (ev) => setImportText(ev.target?.result as string ?? '')
    reader.readAsText(file)
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) loadFile(file)
  }

  async function importGuests() {
    const valid = parsed.filter((r) => !r.error)
    if (!valid.length) return
    setImporting(true)
    const { data: inserted } = await supabase
      .from('guests')
      .insert(valid.map((r) => ({ event_id: id, name: r.name, email: r.email })))
      .select('id')
    if (sendInvites && inserted?.length) {
      await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, guestIds: inserted.map((g) => g.id) }),
      })
    }
    setImportText(''); setParsed([]); closePanel(); setImporting(false)
    loadGuests()
  }

  const [filter, setFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all')

  const attending = guests.filter((g) => g.rsvp_status === 'attending').length
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length
  const pending = guests.filter((g) => g.rsvp_status === 'pending').length
  const validRows = parsed.filter((r) => !r.error)
  const errorRows = parsed.filter((r) => r.error)
  const filteredGuests = filter === 'all' ? guests : guests.filter((g) => g.rsvp_status === filter)

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
        <Button size="sm" onClick={() => setPanelOpen((o) => !o)}>
          <Plus size={14} /> Add guests
        </Button>
      </div>

      {/* Add guests panel */}
      {panelOpen && (
        <div
          className="rounded-2xl border mb-6 overflow-hidden"
          style={{ background: 'white', borderColor: '#E5E5E4' }}
        >
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: '#E5E5E4' }}>
            {(['single', 'import'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="px-5 py-3 text-sm font-medium transition-colors"
                style={{
                  color: tab === t ? '#1C1C1C' : '#9CA3AF',
                  borderBottom: tab === t ? '2px solid #1C1C1C' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t === 'single' ? 'Add one' : 'Import list'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Add one */}
            {tab === 'single' && (
              <form onSubmit={addGuest}>
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
                  <Button type="submit" size="sm" disabled={adding || addingAndInviting}>
                    {adding ? 'Adding…' : 'Add guest'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={adding || addingAndInviting}
                    onClick={addGuestAndInvite}
                  >
                    {addingAndInviting ? 'Sending…' : 'Add & send invitation'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={closePanel}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Import list */}
            {tab === 'import' && (
              <div>
                <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
                  Paste a list or drop a CSV. Each line can be an email, or "Name, email". Column headers are skipped automatically.
                </p>

                {/* Drop zone */}
                <div
                  className={`relative rounded-xl border-2 border-dashed transition-colors mb-4 ${dragOver ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#E5E5E4]'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                >
                  <textarea
                    className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none font-mono rounded-xl"
                    style={{ color: '#1C1C1C', minHeight: 140 }}
                    placeholder={'jane@example.com\nJane Smith, jane@example.com\nJohn Doe, john@example.com'}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    spellCheck={false}
                  />
                  {!importText && (
                    <button
                      type="button"
                      className="absolute bottom-3 right-3 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                      style={{ color: '#9CA3AF', background: '#F4F4F3' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={12} /> Upload CSV
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
                />

                {/* Preview */}
                {parsed.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      {validRows.length > 0 && (
                        <span className="text-xs flex items-center gap-1" style={{ color: '#16A34A' }}>
                          <CheckCircle2 size={12} /> {validRows.length} ready
                        </span>
                      )}
                      {errorRows.length > 0 && (
                        <span className="text-xs flex items-center gap-1" style={{ color: '#DC2626' }}>
                          <AlertCircle size={12} /> {errorRows.length} skipped (no email)
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E5E4' }}>
                      {parsed.slice(0, 8).map((row, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-4 py-2.5 text-xs border-b last:border-b-0"
                          style={{ borderColor: '#E5E5E4', background: row.error ? '#FEF2F2' : 'white' }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {row.error
                              ? <AlertCircle size={12} style={{ color: '#DC2626', flexShrink: 0 }} />
                              : <CheckCircle2 size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
                            }
                            <span className="font-medium truncate" style={{ color: '#1C1C1C' }}>{row.name}</span>
                          </div>
                          <span className="truncate ml-4" style={{ color: row.error ? '#DC2626' : '#6B7280' }}>
                            {row.error ?? row.email}
                          </span>
                        </div>
                      ))}
                      {parsed.length > 8 && (
                        <div className="px-4 py-2.5 text-xs" style={{ color: '#9CA3AF', background: '#FAFAF9' }}>
                          + {parsed.length - 8} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Send invitations toggle */}
                {validRows.length > 0 && (
                  <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendInvites}
                      onChange={(e) => setSendInvites(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#1C1C1C]"
                    />
                    <span className="text-sm" style={{ color: '#1C1C1C' }}>
                      Send invitation emails after importing
                    </span>
                  </label>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!validRows.length || importing}
                    onClick={importGuests}
                  >
                    {importing ? 'Importing…' : `Import ${validRows.length || ''} guest${validRows.length !== 1 ? 's' : ''}`}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={closePanel}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter pills */}
      {!loading && guests.length > 0 && (
        <div className="flex gap-2 mb-4">
          {([
            { key: 'all', label: 'All', count: guests.length },
            { key: 'attending', label: 'Attending', count: attending },
            { key: 'declined', label: 'Declined', count: declined },
            { key: 'pending', label: 'Pending', count: pending },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: filter === key ? '#1C1C1C' : '#F4F4F3',
                color: filter === key ? 'white' : '#6B7280',
              }}
            >
              {label}
              <span
                className="rounded-md px-1.5 py-0.5 text-xs"
                style={{
                  background: filter === key ? 'rgba(255,255,255,0.2)' : '#E5E5E4',
                  color: filter === key ? 'white' : '#9CA3AF',
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Guest list */}
      {loading ? (
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading…</p>
      ) : guests.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: '#E5E5E4' }}
        >
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No guests yet. Add your first guest above.</p>
        </div>
      ) : filteredGuests.length === 0 ? (
        <p className="text-sm" style={{ color: '#9CA3AF' }}>No guests with this status.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredGuests.map((guest) => (
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
