'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Guest } from '@/types'
import {
  Plus, ChevronDown, Trash2, Check, Upload,
  AlertCircle, CheckCircle2, Mail, Users, X, Search,
  Download, Edit2, Tag, Phone, ChevronUp, MessageSquare
} from 'lucide-react'
import { SkeletonRow } from '@/components/app/skeleton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEADER_RE = /^(name|email|guest|first.?name|last.?name)/i

const PRESET_TAGS = [
  'Immediate family', 'Distant family', 'Close friend', 'Wedding party',
  'Interstate', 'International', 'Colleague', 'Plus one',
]

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

interface ParsedCsvRow { first_name: string; last_name: string; email: string; phone: string }

function parseCsvGuests(raw: string): ParsedCsvRow[] {
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).flatMap((line): ParsedCsvRow[] => {
    const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''))
    if (parts.length < 2) return []
    return [{
      first_name: parts[0] ?? '',
      last_name: parts[1] ?? '',
      email: parts[2] ?? '',
      phone: parts[3] ?? '',
    }]
  })
}

type AddMode = 'none' | 'single' | 'paste' | 'csv'
type Filter = 'all' | 'attending' | 'declined' | 'pending'
type RsvpStatus = 'attending' | 'declined' | 'pending'

function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: '#F0EDE8', color: '#6B5E4A' }}
    >
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-70">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

function TagSelector({ tags, onChange, allTags }: {
  tags: string[]
  onChange: (tags: string[]) => void
  allTags: string[]
}) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allOptions = Array.from(new Set([...PRESET_TAGS, ...allTags]))

  function toggle(tag: string) {
    onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  }

  function addCustom() {
    const t = custom.trim()
    if (!t || tags.includes(t)) return
    onChange([...tags, t])
    setCustom('')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
      >
        <Tag size={10} /> Tags {tags.length > 0 && <span style={{ color: '#2C2B26', fontWeight: 600 }}>({tags.length})</span>}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: '#E8E3D9', minWidth: 200 }}
        >
          <div className="p-2 max-h-48 overflow-y-auto">
            {allOptions.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left"
                style={{ color: '#2C2B26' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(44,43,38,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                  style={{ borderColor: tags.includes(tag) ? '#2C2B26' : '#D4CCBC', background: tags.includes(tag) ? '#2C2B26' : 'white' }}
                >
                  {tags.includes(tag) && <Check size={9} color="white" />}
                </div>
                {tag}
              </button>
            ))}
          </div>
          <div className="border-t p-2 flex gap-1" style={{ borderColor: '#F0EDE8' }}>
            <input
              className="flex-1 px-2 py-1 text-xs rounded-lg border outline-none"
              style={{ borderColor: '#E8E3D9', color: '#2C2B26' }}
              placeholder="New tag…"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            />
            <button
              type="button"
              onClick={addCustom}
              className="px-2 py-1 rounded-lg text-xs font-medium"
              style={{ background: '#2C2B26', color: 'white' }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string; dot: string }[] = [
  { value: 'attending', label: 'Attending', dot: '#4CAF50' },
  { value: 'declined', label: 'Declined', dot: '#EF4444' },
  { value: 'pending', label: 'Pending', dot: '#B5A98A' },
]

function RsvpDropdown({ status, onUpdate }: { status: string; onUpdate: (s: RsvpStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = RSVP_OPTIONS.find(o => o.value === status) ?? RSVP_OPTIONS[2]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-colors"
        style={{ background: 'white', borderColor: '#E8E3D9', color: '#2C2B26' }}
      >
        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: current.dot }} />
        {current.label}
        <ChevronDown size={10} style={{ color: '#B5A98A' }} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-xl border shadow-lg overflow-hidden"
          style={{ background: 'white', borderColor: '#E8E3D9', minWidth: 140 }}
        >
          {RSVP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onUpdate(opt.value); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{ color: '#2C2B26' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(44,43,38,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: opt.dot }} />
              {opt.label}
              {opt.value === status && <Check size={10} className="ml-auto" style={{ color: '#2C2B26' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [addMode, setAddMode] = useState<AddMode>('none')
  const [addDropdown, setAddDropdown] = useState(false)

  // Single add
  const [singleFirstName, setSingleFirstName] = useState('')
  const [singleLastName, setSingleLastName] = useState('')
  const [singleEmail, setSingleEmail] = useState('')
  const [singlePhone, setSinglePhone] = useState('')
  const [singleNote, setSingleNote] = useState('')
  const [singlePlusOne, setSinglePlusOne] = useState(false)
  const [adding, setAdding] = useState(false)

  // Paste import
  const [pasteText, setPasteText] = useState('')
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [sendInvites, setSendInvites] = useState(false)

  // CSV bulk paste
  const [csvText, setCsvText] = useState('')
  const [csvImporting, setCsvImporting] = useState(false)

  // CSV file
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Expanded RSVP responses
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Guest>>({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deletingSelected, setDeletingSelected] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.from('guests').select('*').eq('event_id', id).order('created_at', { ascending: false })
      if (err) throw err
      setGuests((data ?? []).map(g => ({ ...g, tags: g.tags ?? [] })) as Guest[])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setParsed(pasteText.trim() ? parseGuestList(pasteText) : []) }, [pasteText])

  async function addGuest(e: React.FormEvent) {
    e.preventDefault()
    const firstName = singleFirstName.trim()
    if (!firstName) return
    setAdding(true)
    const fullName = [firstName, singleLastName.trim()].filter(Boolean).join(' ')
    await supabase.from('guests').insert({
      event_id: id,
      name: fullName,
      first_name: firstName,
      last_name: singleLastName.trim() || null,
      email: singleEmail.trim(),
      phone: singlePhone.trim() || null,
      note: singleNote.trim() || null,
      plus_one: singlePlusOne,
    } as Record<string, unknown>)
    setSingleFirstName(''); setSingleLastName(''); setSingleEmail(''); setSinglePhone('')
    setSingleNote(''); setSinglePlusOne(false)
    setAdding(false)
    setAddMode('none')
    load()
  }

  async function deleteGuest(guestId: string) {
    await supabase.from('guests').delete().eq('id', guestId)
    setGuests(g => g.filter(x => x.id !== guestId))
    setSelected(s => { const next = new Set(s); next.delete(guestId); return next })
  }

  async function deleteSelected() {
    setDeletingSelected(true)
    const ids = Array.from(selected)
    await supabase.from('guests').delete().in('id', ids)
    setGuests(g => g.filter(x => !selected.has(x.id)))
    setSelected(new Set())
    setDeletingSelected(false)
  }

  async function updateRsvp(guestId: string, status: RsvpStatus) {
    await supabase.from('guests').update({ rsvp_status: status } as Record<string, unknown>).eq('id', guestId)
    setGuests(prev => prev.map(g => g.id === guestId ? { ...g, rsvp_status: status } : g))
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

  async function importCsv() {
    const rows = parseCsvGuests(csvText)
    if (!rows.length) return
    setCsvImporting(true)
    await supabase.from('guests').insert(
      rows.map(r => ({
        event_id: id,
        name: [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Guest',
        first_name: r.first_name || null,
        last_name: r.last_name || null,
        email: r.email || null,
        phone: r.phone || null,
      }))
    )
    setCsvText('')
    setCsvImporting(false)
    setAddMode('none')
    load()
  }

  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => setPasteText(e.target?.result as string ?? '')
    reader.readAsText(file)
    setAddMode('paste')
  }

  function startEdit(guest: Guest) {
    setEditingId(guest.id)
    setEditData({
      first_name: guest.first_name ?? guest.name.split(' ')[0],
      last_name: guest.last_name ?? guest.name.split(' ').slice(1).join(' '),
      email: guest.email,
      phone: guest.phone ?? '',
      note: guest.note ?? '',
      plus_one: guest.plus_one,
      tags: guest.tags ?? [],
    })
  }

  async function saveEdit(guestId: string) {
    setSavingEdit(true)
    const firstName = (editData.first_name ?? '').trim()
    const lastName = (editData.last_name ?? '').trim()
    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    await supabase.from('guests').update({
      name: fullName || editData.email?.split('@')[0] || 'Guest',
      first_name: firstName || null,
      last_name: lastName || null,
      email: editData.email ?? '',
      phone: (editData.phone as string)?.trim() || null,
      note: (editData.note as string)?.trim() || null,
      plus_one: editData.plus_one ?? false,
      tags: editData.tags ?? [],
    } as Record<string, unknown>).eq('id', guestId)
    setGuests(prev => prev.map(g => g.id === guestId ? {
      ...g,
      name: fullName || g.name,
      first_name: firstName || null,
      last_name: lastName || null,
      email: editData.email ?? g.email,
      phone: (editData.phone as string)?.trim() || null,
      note: (editData.note as string)?.trim() || null,
      plus_one: editData.plus_one ?? g.plus_one,
      tags: editData.tags ?? [],
    } : g))
    setEditingId(null)
    setSavingEdit(false)
  }

  function exportCSV() {
    // Parse every guest's message into a { question -> answer } map
    const parseAnswers = (message: string | null): Record<string, string> => {
      if (!message) return {}
      return Object.fromEntries(
        message.split('\n').filter(Boolean).map(line => {
          const idx = line.indexOf(': ')
          return idx > -1 ? [line.slice(0, idx), line.slice(idx + 2)] : ['Message', line]
        })
      )
    }

    // Collect all unique RSVP question headers in the order they first appear
    const questionHeaders: string[] = []
    const seenQs = new Set<string>()
    for (const g of guests) {
      for (const q of Object.keys(parseAnswers(g.message ?? null))) {
        if (!seenQs.has(q)) { seenQs.add(q); questionHeaders.push(q) }
      }
    }

    const baseHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'RSVP Status', 'Plus One', 'Tags', 'Note', 'Invited At']
    const headers = [...baseHeaders, ...questionHeaders]

    const rows = guests.map(g => {
      const answers = parseAnswers(g.message ?? null)
      return [
        g.first_name ?? g.name.split(' ')[0],
        g.last_name ?? g.name.split(' ').slice(1).join(' '),
        g.email,
        g.phone ?? '',
        g.rsvp_status,
        g.plus_one ? 'Yes' : 'No',
        (g.tags ?? []).join('; '),
        g.note ?? '',
        g.invitation_sent_at ? new Date(g.invitation_sent_at).toLocaleDateString() : '',
        ...questionHeaders.map(q => answers[q] ?? ''),
      ]
    })

    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'guests.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const attending = guests.filter(g => g.rsvp_status === 'attending').length
  const declined = guests.filter(g => g.rsvp_status === 'declined').length
  const pending = guests.filter(g => g.rsvp_status === 'pending').length
  const acceptanceRate = guests.length > 0 ? Math.round((attending / guests.length) * 100) : 0
  const allTags = Array.from(new Set(guests.flatMap(g => g.tags ?? [])))
  const validRows = parsed.filter(r => !r.error)
  const errorRows = parsed.filter(r => r.error)
  const EXAMPLE_CSV = 'Name,Email\nJane Smith,jane@example.com\nJohn Doe,john@example.com'

  const filtered = guests.filter(g => {
    if (filter !== 'all' && g.rsvp_status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        g.name.toLowerCase().includes(q) ||
        (g.email ?? '').toLowerCase().includes(q) ||
        (g.phone ?? '').includes(q)
      )
    }
    return true
  })

  const allFilteredSelected = filtered.length > 0 && filtered.every(g => selected.has(g.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(s => {
        const next = new Set(s)
        filtered.forEach(g => next.delete(g.id))
        return next
      })
    } else {
      setSelected(s => {
        const next = new Set(s)
        filtered.forEach(g => next.add(g.id))
        return next
      })
    }
  }

  function toggleSelect(guestId: string) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(guestId)) next.delete(guestId)
      else next.add(guestId)
      return next
    })
  }

  const csvRows = csvText.trim() ? parseCsvGuests(csvText) : []

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 md:mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>Guests</h1>
          <p className="text-sm" style={{ color: '#8B8670' }}>{guests.length} guest{guests.length !== 1 ? 's' : ''} on your list</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
            style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
          >
            <Download size={13} /> Export
          </button>
          <div className="relative">
            <button
              onClick={() => setAddDropdown(o => !o)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#2C2B26', color: 'white' }}
            >
              <Plus size={14} /> Add guest <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>
            {addDropdown && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden"
                style={{ background: 'white', borderColor: '#E8E3D9', minWidth: 180 }}
              >
                {([
                  { key: 'single', label: 'Add one by one' },
                  { key: 'paste', label: 'Paste a list' },
                  { key: 'csv', label: 'Upload CSV' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setAddMode(key); setAddDropdown(false) }}
                    className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                    style={{ color: '#2C2B26' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(44,43,38,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Attending', value: attending },
          { label: 'Declined', value: declined },
          { label: 'Awaiting', value: pending },
          { label: 'Acceptance rate', value: `${acceptanceRate}%` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border p-3 md:p-5"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <p className="text-xs mb-2 font-medium" style={{ color: '#B5A98A' }}>{label}</p>
            <p className="text-2xl md:text-3xl font-semibold" style={{ color: '#2C2B26' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Add mode panels */}
      {addMode !== 'none' && (
        <div
          className="mb-6 rounded-2xl border p-6"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#2C2B26' }}>
              {addMode === 'single' ? 'Add a guest' : addMode === 'paste' ? 'Paste your guest list' : 'Upload CSV'}
            </h2>
            <button onClick={() => setAddMode('none')} style={{ color: '#B5A98A' }}>
              <X size={16} />
            </button>
          </div>

          {addMode === 'single' && (
            <form onSubmit={addGuest} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>First name *</label>
                  <input
                    autoFocus required
                    className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                    style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                    value={singleFirstName}
                    onChange={e => setSingleFirstName(e.target.value)}
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Last name</label>
                  <input
                    className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                    style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                    value={singleLastName}
                    onChange={e => setSingleLastName(e.target.value)}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                    style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                    value={singleEmail}
                    onChange={e => setSingleEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Phone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                    style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                    value={singlePhone}
                    onChange={e => setSinglePhone(e.target.value)}
                    placeholder="+61 400 000 000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Note <span style={{ color: '#B5A98A', fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                  style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                  value={singleNote}
                  onChange={e => setSingleNote(e.target.value)}
                  placeholder="Private note…"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className="w-9 h-5 rounded-full relative transition-colors"
                    style={{ background: singlePlusOne ? '#2C2B26' : '#E8E3D9' }}
                    onClick={() => setSinglePlusOne(v => !v)}
                  >
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                      style={{ transform: singlePlusOne ? 'translateX(17px)' : 'translateX(2px)' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#2C2B26' }}>+1 allowed</span>
                </label>
              </div>

              {/* CSV bulk paste section */}
              <div className="border-t pt-4 mt-1 flex flex-col gap-2" style={{ borderColor: '#F0EDE8' }}>
                <p className="text-xs font-semibold" style={{ color: '#2C2B26' }}>Paste &amp; upload CSV</p>
                <p className="text-xs" style={{ color: '#B5A98A' }}>Columns: first name, last name, email, phone (one per line, comma-separated)</p>
                <textarea
                  className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none"
                  style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26', minHeight: 90, fontFamily: 'monospace' }}
                  placeholder="Jane,Smith,jane@example.com,+61400000000"
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                />
                {csvRows.length > 0 && (
                  <p className="text-xs" style={{ color: '#16A34A' }}>{csvRows.length} row{csvRows.length !== 1 ? 's' : ''} ready to import</p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={importCsv}
                    disabled={csvImporting || !csvRows.length}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: csvRows.length ? '#2C2B26' : '#E8E3D9', color: csvRows.length ? 'white' : '#B5A98A' }}
                  >
                    {csvImporting ? 'Importing…' : `Import ${csvRows.length} guest${csvRows.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={adding || !singleFirstName.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
                  style={{ background: '#2C2B26', color: 'white', opacity: adding ? 0.7 : 1 }}
                >
                  {adding ? 'Adding…' : 'Add guest'}
                </button>
              </div>
            </form>
          )}

          {addMode === 'paste' && (
            <div className="flex flex-col gap-3">
              <textarea
                className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none"
                style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26', minHeight: 140, fontFamily: 'monospace' }}
                placeholder={`Paste names + emails, one per line:\n${EXAMPLE_CSV}`}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                autoFocus
              />
              {parsed.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  {validRows.length > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#16A34A' }}>
                      <CheckCircle2 size={13} /> {validRows.length} guest{validRows.length !== 1 ? 's' : ''} ready to import
                    </div>
                  )}
                  {errorRows.length > 0 && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#EF4444' }}>
                      <AlertCircle size={13} /> {errorRows.length} row{errorRows.length !== 1 ? 's' : ''} skipped (no email)
                    </div>
                  )}
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  className="w-9 h-5 rounded-full relative transition-colors"
                  style={{ background: sendInvites ? '#2C2B26' : '#E8E3D9' }}
                  onClick={() => setSendInvites(v => !v)}
                >
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: sendInvites ? 'translateX(17px)' : 'translateX(2px)' }} />
                </div>
                <span className="text-xs" style={{ color: '#2C2B26' }}>Send invitation emails immediately</span>
              </label>
              <div className="flex justify-end">
                <button
                  onClick={importGuests}
                  disabled={importing || !validRows.length}
                  className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: validRows.length ? '#2C2B26' : '#E8E3D9', color: validRows.length ? 'white' : '#B5A98A' }}
                >
                  {importing ? 'Importing…' : `Import ${validRows.length} guest${validRows.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {addMode === 'csv' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f) }}
              className="flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
              style={{ borderColor: dragOver ? '#2C2B26' : '#E8E3D9', background: dragOver ? 'rgba(44,43,38,0.06)' : '#FAFAF7' }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={20} style={{ color: '#B5A98A' }} />
              <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Drop a CSV here or click to browse</p>
              <p className="text-xs" style={{ color: '#B5A98A' }}>Columns: Name, Email (headers optional)</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
            </div>
          )}
        </div>
      )}

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B5A98A' }} />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26] transition-colors"
            style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {([
            { key: 'all', label: `All (${guests.length})` },
            { key: 'attending', label: `Attending (${attending})` },
            { key: 'declined', label: `Declined (${declined})` },
            { key: 'pending', label: `Awaiting (${pending})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
              style={{
                background: filter === key ? '#2C2B26' : 'white',
                color: filter === key ? 'white' : '#8B8670',
                borderColor: filter === key ? '#2C2B26' : '#E8E3D9',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Guest table */}
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="text-sm mb-4" style={{ color: '#8B8670' }}>{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#2C2B26', color: '#FAFAF7' }}
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border" style={{ borderColor: '#E8E3D9' }}>
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <table className="w-full text-sm" style={{ minWidth: 640 }}>
              <thead>
                <tr className="sticky top-0 z-10" style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E3D9' }}>
                  <th className="px-4 py-3 w-8" />
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#8B8670' }}>Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#8B8670' }}>Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: '#8B8670' }}>Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold hidden lg:table-cell" style={{ color: '#8B8670' }}>Tags</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#8B8670' }}>RSVP</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              </tbody>
            </table>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F0EDE8' }}>
            <Users size={20} style={{ color: '#B5A98A' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>
            {guests.length === 0 ? 'No guests yet' : 'No guests match your filter'}
          </p>
          {guests.length === 0 ? (
            <>
              <p className="text-xs mb-4" style={{ color: '#8B8670' }}>Start building your guest list.</p>
              <button
                onClick={() => { setAddMode('single'); setAddDropdown(false) }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#2C2B26', color: 'white' }}
              >
                <Plus size={14} /> Add first guest
              </button>
            </>
          ) : (
            <p className="text-xs" style={{ color: '#8B8670' }}>Try adjusting your search or filter.</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border" style={{ borderColor: '#E8E3D9' }}>
          <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
            <thead>
              <tr className="sticky top-0 z-10" style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E3D9' }}>
                <th className="px-4 py-3 w-8">
                  <div
                    className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer"
                    style={{
                      borderColor: allFilteredSelected ? '#2C2B26' : '#D4CCBC',
                      background: allFilteredSelected ? '#2C2B26' : 'white',
                    }}
                    onClick={toggleSelectAll}
                  >
                    {allFilteredSelected && <Check size={10} color="white" />}
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#8B8670' }}>Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#8B8670' }}>Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: '#8B8670' }}>Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold hidden lg:table-cell" style={{ color: '#8B8670' }}>Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#8B8670' }}>RSVP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: '#8B8670' }}>+1</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((guest, idx) => {
                const isEditing = editingId === guest.id
                const isSelected = selected.has(guest.id)
                const isExpanded = expandedId === guest.id
                const firstName = guest.first_name ?? guest.name.split(' ')[0]
                const lastName = guest.last_name ?? guest.name.split(' ').slice(1).join(' ')

                // Parse message into question/answer pairs
                const rsvpAnswers = guest.message
                  ? guest.message.split('\n').filter(Boolean).map(line => {
                      const colonIdx = line.indexOf(': ')
                      return colonIdx > -1
                        ? { q: line.slice(0, colonIdx), a: line.slice(colonIdx + 2) }
                        : { q: 'Message', a: line }
                    })
                  : []

                return (
                  <React.Fragment key={guest.id}>
                  <tr
                    className="group"
                    style={{ borderTop: idx > 0 ? '1px solid #F0EDE8' : undefined, background: isEditing ? '#FAFAF7' : isSelected ? '#FAFAF7' : 'white' }}
                  >
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2" colSpan={7}>
                          <div className="flex flex-col gap-3 py-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>First name</label>
                                <input
                                  autoFocus
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={editData.first_name ?? ''}
                                  onChange={e => setEditData(d => ({ ...d, first_name: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Last name</label>
                                <input
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={editData.last_name ?? ''}
                                  onChange={e => setEditData(d => ({ ...d, last_name: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Email</label>
                                <input
                                  type="email"
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={editData.email ?? ''}
                                  onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Phone</label>
                                <input
                                  type="tel"
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={(editData.phone as string) ?? ''}
                                  onChange={e => setEditData(d => ({ ...d, phone: e.target.value }))}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Note (host only)</label>
                                <input
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={(editData.note as string) ?? ''}
                                  onChange={e => setEditData(d => ({ ...d, note: e.target.value }))}
                                  placeholder="Private note…"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer select-none pb-1.5">
                                  <div
                                    className="w-9 h-5 rounded-full relative transition-colors"
                                    style={{ background: editData.plus_one ? '#2C2B26' : '#E8E3D9' }}
                                    onClick={() => setEditData(d => ({ ...d, plus_one: !d.plus_one }))}
                                  >
                                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                                      style={{ transform: editData.plus_one ? 'translateX(17px)' : 'translateX(2px)' }} />
                                  </div>
                                  <span className="text-xs" style={{ color: '#2C2B26' }}>+1 allowed</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs mb-1.5" style={{ color: '#8B8670' }}>Tags</label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {(editData.tags as string[] ?? []).map(tag => (
                                  <TagBadge key={tag} tag={tag} onRemove={() => setEditData(d => ({ ...d, tags: (d.tags as string[]).filter(t => t !== tag) }))} />
                                ))}
                              </div>
                              <TagSelector
                                tags={editData.tags as string[] ?? []}
                                onChange={tags => setEditData(d => ({ ...d, tags }))}
                                allTags={allTags}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => saveEdit(guest.id)}
                                disabled={savingEdit}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: '#2C2B26', color: 'white' }}
                              >
                                {savingEdit ? 'Saving…' : <><Check size={12} /> Save</>}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                                style={{ color: '#8B8670' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div
                            className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer"
                            style={{
                              borderColor: isSelected ? '#2C2B26' : '#D4CCBC',
                              background: isSelected ? '#2C2B26' : 'white',
                            }}
                            onClick={() => toggleSelect(guest.id)}
                          >
                            {isSelected && <Check size={10} color="white" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEdit(guest)}
                            className="font-medium text-left hover:underline"
                            style={{ color: '#2C2B26' }}
                          >
                            {firstName} {lastName}
                          </button>
                          {guest.note && (
                            <p className="text-xs mt-0.5" style={{ color: '#B5A98A' }}>{guest.note}</p>
                          )}
                        </td>
                        <td className="px-4 py-3" style={{ color: '#8B8670' }}>{guest.email || <span style={{ color: '#D4CCBC' }}>—</span>}</td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#8B8670' }}>{guest.phone || <span style={{ color: '#D4CCBC' }}>—</span>}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(guest.tags ?? []).slice(0, 2).map(tag => <TagBadge key={tag} tag={tag} />)}
                            {(guest.tags ?? []).length > 2 && (
                              <span className="text-xs" style={{ color: '#B5A98A' }}>+{(guest.tags ?? []).length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RsvpDropdown
                            status={guest.rsvp_status}
                            onUpdate={status => updateRsvp(guest.id, status)}
                          />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: guest.plus_one ? '#2C2B26' : '#D4CCBC' }}>
                          {guest.plus_one ? <Check size={14} /> : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {rsvpAnswers.length > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : guest.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ color: isExpanded ? '#2C2B26' : '#B5A98A', background: isExpanded ? 'rgba(44,43,38,0.06)' : 'transparent' }}
                                title={`${rsvpAnswers.length} RSVP response${rsvpAnswers.length !== 1 ? 's' : ''}`}
                              >
                                <MessageSquare size={13} />
                              </button>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(guest)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ color: '#8B8670' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(44,43,38,0.06)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => { if (confirm('Remove this guest?')) deleteGuest(guest.id) }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ color: '#D4CCBC' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#D4CCBC'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  {isExpanded && !isEditing && rsvpAnswers.length > 0 && (
                    <tr style={{ borderTop: '1px solid #F0EDE8', background: '#FAFAF7' }}>
                      <td />
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                          {rsvpAnswers.map(({ q, a }, i) => (
                            <div key={i}>
                              <p className="text-xs font-medium mb-0.5" style={{ color: '#B5A98A' }}>{q}</p>
                              <p className="text-sm" style={{ color: '#2C2B26' }}>{a}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Floating bulk action bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: selected.size > 0 ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120%)',
          zIndex: 50,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: 'white',
          borderColor: '#E8E3D9',
        }}
        className="flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-xl"
      >
        <span className="text-sm font-medium" style={{ color: '#2C2B26' }}>{selected.size} selected</span>
        <div className="w-px h-4 shrink-0" style={{ background: '#E8E3D9' }} />
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: '#EF4444' }}>
              Delete {selected.size} guest{selected.size !== 1 ? 's' : ''}?
            </span>
            <button
              onClick={async () => { setConfirmDelete(false); await deleteSelected() }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#EF4444', color: 'white' }}
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ color: '#8B8670' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deletingSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{ borderColor: '#EF4444', color: '#EF4444', background: 'white' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
          >
            <Trash2 size={12} /> {deletingSelected ? 'Deleting…' : 'Delete'}
          </button>
        )}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white' }}
        >
          <Mail size={12} /> Send invitation
        </button>
        <div className="w-px h-4 shrink-0" style={{ background: '#E8E3D9' }} />
        <button
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: '#B5A98A' }}
          onClick={() => { setSelected(new Set()); setConfirmDelete(false) }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
