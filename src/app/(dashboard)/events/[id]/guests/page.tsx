'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Guest } from '@/types'
import {
  Plus, ChevronDown, Trash2, Check, Upload,
  AlertCircle, CheckCircle2, Mail, Users, X
} from 'lucide-react'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEADER_RE = /^(name|email|guest|first.?name|last.?name)/i

interface ParsedRow { name: string; email: string; error?: string }

function parseGuestList(raw: string): ParsedRow[] {
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).flatMap((line): ParsedRow[] => {
    if (HEADER_RE.test(line)) return []
    const parts = line.includes('\t')
      ? line.split('\t').map(p => p.trim().replace(/^"|"$/g, ''))
      : line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    const emailIdx = parts.findIndex(p => EMAIL_RE.test(p))
    if (emailIdx === -1) return [{ name: line, email: '', error: 'No valid email found' }]
    const email = parts[emailIdx]
    const name = parts.filter((_, i) => i !== emailIdx).join(', ').trim() || email.split('@')[0]
    return [{ name, email }]
  })
}

type AddMode = 'none' | 'single' | 'paste' | 'csv'
type Filter = 'all' | 'attending' | 'declined' | 'pending'

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [addMode, setAddMode] = useState<AddMode>('none')
  const [addDropdown, setAddDropdown] = useState(false)

  // Single add
  const [singleName, setSingleName] = useState('')
  const [singleEmail, setSingleEmail] = useState('')
  const [adding, setAdding] = useState(false)

  // Paste import
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [sendInvites, setSendInvites] = useState(false)

  // CSV
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('guests').select('*').eq('event_id', id).order('created_at', { ascending: false })
    setGuests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setParsed(pasteText.trim() ? parseGuestList(pasteText) : []) }, [pasteText])

  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    if (!singleName.trim() || !singleEmail.trim()) return
    setAdding(true)
    await supabase.from('guests').insert({ event_id: id, name: singleName.trim(), email: singleEmail.trim() })
    setSingleName(''); setSingleEmail('')
    setAdding(false)
    setAddMode('none')
    load()
  }

  async function deleteGuest(guestId: string) {
    await supabase.from('guests').delete().eq('id', guestId)
    setGuests(g => g.filter(x => x.id !== guestId))
  }

  async function importGuests() {
    const valid = parsed.filter(r => !r.error)
    if (!valid.length) return
    setImporting(true)
    const { data: inserted } = await supabase
      .from('guests')
      .insert(valid.map(r => ({ event_id: id, name: r.name, email: r.email })))
      .select('id')
    if (sendInvites && inserted?.length) {
      await fetch('/api/send-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, guestIds: inserted.map(g => g.id) }),
      })
    }
    setPasteText(''); setParsed([]); setAddMode('none'); setImporting(false)
    load()
  }

  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => setPasteText(e.target?.result as string ?? '')
    reader.readAsText(file)
    setAddMode('paste')
  }

  async function saveEdit(guestId: string) {
    await supabase.from('guests').update({ name: editName, email: editEmail }).eq('id', guestId)
    setGuests(g => g.map(x => x.id === guestId ? { ...x, name: editName, email: editEmail } : x))
    setEditingId(null)
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id)
    setEditName(guest.name)
    setEditEmail(guest.email)
  }

  const attending = guests.filter(g => g.rsvp_status === 'attending').length
  const declined = guests.filter(g => g.rsvp_status === 'declined').length
  const pending = guests.filter(g => g.rsvp_status === 'pending').length
  const acceptanceRate = guests.length > 0 ? Math.round((attending / guests.length) * 100) : 0
  const validRows = parsed.filter(r => !r.error)
  const errorRows = parsed.filter(r => r.error)

  const filtered = filter === 'all' ? guests : guests.filter(g => g.rsvp_status === filter)

  const statusColor = (status: string) => {
    if (status === 'attending') return { bg: '#F0FDF4', text: '#16A34A' }
    if (status === 'declined') return { bg: '#FEF2F2', text: '#DC2626' }
    return { bg: '#F5F5F4', text: '#78716C' }
  }

  const EXAMPLE_CSV = 'Name,Email\nJane Smith,jane@example.com\nJohn Doe,john@example.com'

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header + action bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26' }}>Guests</h1>
          <p className="text-sm" style={{ color: '#8B8670' }}>
            {guests.length === 0 ? 'No guests yet — add your first below' : `${guests.length} guest${guests.length !== 1 ? 's' : ''} on your list`}
          </p>
        </div>

        {/* Add guests dropdown */}
        <div className="relative">
          <button
            onClick={() => setAddDropdown(o => !o)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#2C2B26', color: 'white' }}
          >
            <Plus size={14} />
            Add guests
            <ChevronDown size={14} />
          </button>
          {addDropdown && (
            <div
              className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border overflow-hidden z-10 shadow-lg"
              style={{ background: 'white', borderColor: '#E8E3D9' }}
            >
              {[
                { mode: 'single' as AddMode, label: 'Add one guest', sub: 'Fill in a quick form' },
                { mode: 'paste' as AddMode, label: 'Paste a list', sub: 'From a spreadsheet or doc' },
                { mode: 'csv' as AddMode, label: 'Upload CSV', sub: 'Import a CSV file' },
              ].map(({ mode, label, sub }) => (
                <button
                  key={mode}
                  onClick={() => { setAddMode(mode === addMode ? 'none' : mode); setAddDropdown(false) }}
                  className="w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 hover:bg-[#FAFAF7]"
                  style={{ borderColor: '#F5F0E8' }}
                >
                  <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>{label}</p>
                  <p className="text-xs" style={{ color: '#B5A98A' }}>{sub}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats pills */}
      {guests.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {([
            { key: 'all', label: `All · ${guests.length}` },
            { key: 'attending', label: `Attending · ${attending}` },
            { key: 'declined', label: `Declined · ${declined}` },
            { key: 'pending', label: `Awaiting · ${pending}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={{
                background: filter === key ? '#2C2B26' : 'white',
                color: filter === key ? 'white' : '#8B8670',
                borderColor: filter === key ? '#2C2B26' : '#E8E3D9',
              }}
            >
              {label}
            </button>
          ))}
          {guests.length > 0 && (
            <span className="ml-auto text-xs" style={{ color: '#B5A98A' }}>
              {acceptanceRate}% acceptance rate
            </span>
          )}
        </div>
      )}

      {/* Add one panel */}
      {addMode === 'single' && (
        <form
          onSubmit={addGuest}
          className="rounded-2xl border p-5 mb-5"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium text-sm" style={{ color: '#2C2B26' }}>Add a guest</p>
            <button type="button" onClick={() => setAddMode('none')}>
              <X size={14} style={{ color: '#B5A98A' }} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Name</label>
              <input
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors"
                style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                placeholder="Jane Smith"
                value={singleName}
                onChange={e => setSingleName(e.target.value)}
                required
                onFocus={e => (e.target.style.borderColor = '#2C2B26')}
                onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Email</label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors"
                style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                placeholder="jane@example.com"
                value={singleEmail}
                onChange={e => setSingleEmail(e.target.value)}
                required
                onFocus={e => (e.target.style.borderColor = '#2C2B26')}
                onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#2C2B26', color: 'white' }}
            >
              {adding ? 'Adding…' : 'Add guest'}
            </button>
            <button type="button" onClick={() => setAddMode('none')} className="px-5 py-2 rounded-xl text-sm" style={{ color: '#8B8670' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Paste panel */}
      {addMode === 'paste' && (
        <div
          className="rounded-2xl border p-5 mb-5"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-sm mb-0.5" style={{ color: '#2C2B26' }}>Paste your guest list</p>
              <p className="text-xs" style={{ color: '#8B8670' }}>One guest per line · Format: Name, email@example.com</p>
            </div>
            <button onClick={() => setAddMode('none')}>
              <X size={14} style={{ color: '#B5A98A' }} />
            </button>
          </div>

          <textarea
            autoFocus
            className="w-full px-4 py-3 text-sm rounded-xl border outline-none resize-none font-mono mb-4"
            style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26', minHeight: 120 }}
            placeholder={'Jane Smith, jane@example.com\nJohn Doe, john@example.com\njane@example.com'}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            onFocus={e => (e.target.style.borderColor = '#2C2B26')}
            onBlur={e => (e.target.style.borderColor = '#E8E3D9')}
            spellCheck={false}
          />

          {parsed.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                {validRows.length > 0 && (
                  <span className="text-xs flex items-center gap-1" style={{ color: '#16A34A' }}>
                    <CheckCircle2 size={12} /> {validRows.length} ready to import
                  </span>
                )}
                {errorRows.length > 0 && (
                  <span className="text-xs flex items-center gap-1" style={{ color: '#DC2626' }}>
                    <AlertCircle size={12} /> {errorRows.length} will be skipped (no email)
                  </span>
                )}
              </div>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E8E3D9' }}>
                {parsed.slice(0, 6).map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 text-xs border-b last:border-b-0"
                    style={{ borderColor: '#F5F0E8', background: row.error ? '#FEF2F2' : 'white' }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {row.error
                        ? <AlertCircle size={11} style={{ color: '#DC2626', flexShrink: 0 }} />
                        : <CheckCircle2 size={11} style={{ color: '#16A34A', flexShrink: 0 }} />
                      }
                      <span className="font-medium truncate" style={{ color: '#2C2B26' }}>{row.name}</span>
                    </div>
                    <span className="ml-4 truncate" style={{ color: row.error ? '#DC2626' : '#8B8670' }}>
                      {row.error ?? row.email}
                    </span>
                  </div>
                ))}
                {parsed.length > 6 && (
                  <div className="px-4 py-2 text-xs" style={{ color: '#B5A98A', background: '#FAFAF7' }}>
                    + {parsed.length - 6} more
                  </div>
                )}
              </div>
            </div>
          )}

          {validRows.length > 0 && (
            <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
              <div
                className="w-9 h-5 rounded-full transition-colors relative shrink-0"
                style={{ background: sendInvites ? '#2C2B26' : '#E8E3D9' }}
                onClick={() => setSendInvites(s => !s)}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: sendInvites ? 'translateX(17px)' : 'translateX(2px)' }}
                />
              </div>
              <span className="text-sm" style={{ color: '#2C2B26' }}>Send invitation emails after importing</span>
            </label>
          )}

          <div className="flex gap-2">
            <button
              disabled={!validRows.length || importing}
              onClick={importGuests}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: validRows.length ? '#2C2B26' : '#E8E3D9', color: validRows.length ? 'white' : '#B5A98A' }}
            >
              {importing ? 'Importing…' : `Import ${validRows.length || ''} guest${validRows.length !== 1 ? 's' : ''}`}
            </button>
            <button onClick={() => setAddMode('none')} className="px-5 py-2 rounded-xl text-sm" style={{ color: '#8B8670' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CSV upload panel */}
      {addMode === 'csv' && (
        <div
          className="rounded-2xl border p-6 mb-5"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-sm mb-0.5" style={{ color: '#2C2B26' }}>Upload a CSV file</p>
              <p className="text-xs" style={{ color: '#8B8670' }}>Required columns: Name, Email</p>
            </div>
            <button onClick={() => setAddMode('none')}>
              <X size={14} style={{ color: '#B5A98A' }} />
            </button>
          </div>

          {/* Drop zone */}
          <div
            className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors mb-4 cursor-pointer ${dragOver ? 'bg-[#F5F0E8]' : ''}`}
            style={{ borderColor: dragOver ? '#2C2B26' : '#D4CCBC' }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={20} className="mx-auto mb-3" style={{ color: '#B5A98A' }} />
            <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>Drop your CSV here</p>
            <p className="text-xs" style={{ color: '#B5A98A' }}>or click to browse</p>
          </div>

          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />

          {/* Download template */}
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(EXAMPLE_CSV)}`}
            download="joyabl-guest-template.csv"
            className="text-xs underline"
            style={{ color: '#8B8670' }}
          >
            Download example template
          </a>
        </div>
      )}

      {/* Guest table */}
      {loading ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: '#B5A98A' }}>Loading guests…</p>
        </div>
      ) : guests.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#F5F0E8' }}>
            <Users size={20} style={{ color: '#B5A98A' }} />
          </div>
          <h3 className="font-semibold mb-1.5" style={{ color: '#2C2B26' }}>No guests yet</h3>
          <p className="text-sm" style={{ color: '#8B8670' }}>Add your first guest to get started.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: '#B5A98A' }}>No guests with this status.</p>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_1fr_120px_48px_100px_48px] px-5 py-3 border-b text-xs font-medium"
            style={{ borderColor: '#F5F0E8', color: '#B5A98A', background: '#FAFAF7' }}
          >
            <span>Name</span>
            <span>Email</span>
            <span>RSVP</span>
            <span>+1</span>
            <span>Invited</span>
            <span />
          </div>

          {/* Rows */}
          {filtered.map(guest => {
            const isEditing = editingId === guest.id
            const sc = statusColor(guest.rsvp_status)
            return (
              <div
                key={guest.id}
                className="group grid grid-cols-[1fr_1fr_120px_48px_100px_48px] px-5 py-3.5 border-b last:border-b-0 items-center transition-colors hover:bg-[#FAFAF7]"
                style={{ borderColor: '#F5F0E8' }}
              >
                {isEditing ? (
                  <>
                    <input
                      autoFocus
                      className="text-sm px-2 py-1 rounded-lg border outline-none mr-2"
                      style={{ borderColor: '#E8E3D9', color: '#2C2B26' }}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(guest.id); if (e.key === 'Escape') setEditingId(null) }}
                    />
                    <input
                      className="text-sm px-2 py-1 rounded-lg border outline-none mr-2"
                      style={{ borderColor: '#E8E3D9', color: '#2C2B26' }}
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(guest.id); if (e.key === 'Escape') setEditingId(null) }}
                    />
                    <div className="col-span-3 flex items-center gap-2">
                      <button onClick={() => saveEdit(guest.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#2C2B26', color: 'white' }}>Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#8B8670' }}>Cancel</button>
                    </div>
                    <div />
                  </>
                ) : (
                  <>
                    <button
                      className="text-sm font-medium text-left truncate"
                      style={{ color: '#2C2B26' }}
                      onClick={() => startEdit(guest)}
                      title="Click to edit"
                    >
                      {guest.name}
                    </button>
                    <span className="text-sm truncate" style={{ color: '#8B8670' }}>{guest.email}</span>
                    <span>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {guest.rsvp_status}
                      </span>
                    </span>
                    <span className="text-sm" style={{ color: guest.plus_one ? '#2C2B26' : '#D4CCBC' }}>
                      {guest.plus_one ? <Check size={14} /> : '—'}
                    </span>
                    <span className="text-xs" style={{ color: '#B5A98A' }}>
                      {guest.invitation_sent_at
                        ? new Date(guest.invitation_sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : 'Not sent'
                      }
                    </span>
                    <button
                      onClick={() => deleteGuest(guest.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#D4CCBC' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
