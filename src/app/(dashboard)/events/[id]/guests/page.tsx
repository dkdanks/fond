'use client'

import { useEffect, useRef, useState, useCallback, type FormEvent } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { guardEvent } from '@/lib/event-guard'
import type { Guest } from '@/types'
import {
  exportGuestsCsv,
  parseCsvGuests,
  parseGuestList,
  type AddMode,
  type Filter,
  type ParsedRow,
  type RsvpStatus,
} from '@/lib/guest-management'
import { SkeletonRow } from '@/components/app/skeleton'
import { Pagination } from '@/components/app/pagination'
import { DashboardErrorState } from '@/components/dashboard/page-layout'
import {
  AddGuestPanels,
  BulkActionBar,
  GuestFilters,
  GuestsEmptyState,
  GuestsHeader,
  GuestStatsCards,
  GuestTable,
} from '@/components/guest-management/ui'

const PAGE_SIZE = 50

export default function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // Stats counts (from full table, not page slice)
  const [statsAttending, setStatsAttending] = useState(0)
  const [statsDeclined, setStatsDeclined] = useState(0)
  const [statsPending, setStatsPending] = useState(0)
  const [statsTotal, setStatsTotal] = useState(0)
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

  // Stable load function — params passed explicitly so deps stay minimal
  const load = useCallback(async (p: number, s: string, f: Filter) => {
    setLoading(true)
    setError(null)
    const userId = await guardEvent(id)
    if (!userId) {
      setError('You do not have access to this event.')
      setLoading(false)
      return
    }
    try {
      let query = supabase
        .from('guests')
        .select('*', { count: 'exact' })
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (f !== 'all') {
        query = query.eq('rsvp_status', f)
      }

      if (s.trim()) {
        query = query.or(`name.ilike.%${s.trim()}%,email.ilike.%${s.trim()}%`)
      }

      query = query.range((p - 1) * PAGE_SIZE, p * PAGE_SIZE - 1)

      const { data, error: err, count } = await query
      if (err) throw err
      setGuests((data ?? []).map(g => ({ ...g, tags: g.tags ?? [] })) as Guest[])
      setTotal(count ?? 0)

      // Stats counts from full table (unaffected by search/filter)
      const { data: statsData } = await supabase
        .from('guests')
        .select('rsvp_status')
        .eq('event_id', id)

      const allGuests = statsData ?? []
      setStatsTotal(allGuests.length)
      setStatsAttending(allGuests.filter(g => g.rsvp_status === 'attending').length)
      setStatsDeclined(allGuests.filter(g => g.rsvp_status === 'declined').length)
      setStatsPending(allGuests.filter(g => g.rsvp_status === 'pending').length)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Initial load
  useEffect(() => { load(1, '', 'all') }, [load])

  // Reload when page changes; clear selection
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setSelected(new Set())
    load(page, search, filter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Reload when filter changes, reset page to 1
  const isFirstFilterRender = useRef(true)
  useEffect(() => {
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return }
    setPage(1)
    load(1, search, filter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Debounced search: reset page to 1 and reload
  const isFirstSearchRender = useRef(true)
  useEffect(() => {
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return }
    const timer = setTimeout(() => {
      setPage(1)
      load(1, search, filter)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => { setParsed(pasteText.trim() ? parseGuestList(pasteText) : []) }, [pasteText])

  async function addGuest(e: FormEvent) {
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
    load(page, search, filter)
  }

  async function deleteGuest(guestId: string) {
    await supabase.from('guests').delete().eq('id', guestId)
    setSelected(s => { const next = new Set(s); next.delete(guestId); return next })
    load(page, search, filter)
  }

  async function deleteSelected() {
    setDeletingSelected(true)
    const ids = Array.from(selected)
    await supabase.from('guests').delete().in('id', ids)
    setSelected(new Set())
    setDeletingSelected(false)
    load(page, search, filter)
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
    load(page, search, filter)
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
    load(page, search, filter)
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
    exportGuestsCsv(guests)
  }

  // Stats come from full table counts (not the current page slice)
  const attending = statsAttending
  const declined = statsDeclined
  const pending = statsPending
  const acceptanceRate = statsTotal > 0 ? Math.round((statsAttending / statsTotal) * 100) : 0
  const allTags = Array.from(new Set(guests.flatMap(g => g.tags ?? [])))
  const validRows = parsed.filter(r => !r.error)
  const errorRows = parsed.filter(r => r.error)
  // guests IS the current page — no client-side filtering
  const allFilteredSelected = guests.length > 0 && guests.every(g => selected.has(g.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected(s => {
        const next = new Set(s)
        guests.forEach(g => next.delete(g.id))
        return next
      })
    } else {
      setSelected(s => {
        const next = new Set(s)
        guests.forEach(g => next.add(g.id))
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
      <GuestsHeader
        statsTotal={statsTotal}
        addDropdownOpen={addDropdown}
        onToggleAddDropdown={() => setAddDropdown(o => !o)}
        onExport={exportCSV}
        onSelectAddMode={mode => { setAddMode(mode); setAddDropdown(false) }}
      />

      <GuestStatsCards
        attending={attending}
        declined={declined}
        pending={pending}
        acceptanceRate={acceptanceRate}
      />

      <AddGuestPanels
        addMode={addMode}
        onClose={() => setAddMode('none')}
        onAddGuest={addGuest}
        singleFirstName={singleFirstName}
        singleLastName={singleLastName}
        singleEmail={singleEmail}
        singlePhone={singlePhone}
        singleNote={singleNote}
        singlePlusOne={singlePlusOne}
        adding={adding}
        onSingleFirstNameChange={setSingleFirstName}
        onSingleLastNameChange={setSingleLastName}
        onSingleEmailChange={setSingleEmail}
        onSinglePhoneChange={setSinglePhone}
        onSingleNoteChange={setSingleNote}
        onToggleSinglePlusOne={() => setSinglePlusOne(value => !value)}
        csvText={csvText}
        csvRows={csvRows}
        csvImporting={csvImporting}
        onCsvTextChange={setCsvText}
        onImportCsv={importCsv}
        pasteText={pasteText}
        parsed={parsed}
        validRows={validRows}
        errorRows={errorRows}
        importing={importing}
        sendInvites={sendInvites}
        onPasteTextChange={setPasteText}
        onToggleSendInvites={() => setSendInvites(value => !value)}
        onImportGuests={importGuests}
        dragOver={dragOver}
        fileRef={fileRef}
        onDragOver={() => setDragOver(true)}
        onDragLeave={() => setDragOver(false)}
        onFileDrop={loadFile}
        onFileChange={event => {
          const file = event.target.files?.[0]
          if (file) loadFile(file)
        }}
      />

      <GuestFilters
        search={search}
        filter={filter}
        statsTotal={statsTotal}
        attending={attending}
        declined={declined}
        pending={pending}
        onSearchChange={setSearch}
        onFilterChange={nextFilter => { setPage(1); setFilter(nextFilter) }}
      />

      {/* Guest table */}
      {error ? (
        <DashboardErrorState message={error} onRetry={() => void load(page, search, filter)} />
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
      ) : guests.length === 0 ? (
        <GuestsEmptyState
          hasGuests={statsTotal > 0}
          onAddFirstGuest={() => { setAddMode('single'); setAddDropdown(false) }}
        />
      ) : (
        <div className="rounded-2xl border" style={{ borderColor: '#E8E3D9' }}>
          <GuestTable
            guests={guests}
            allFilteredSelected={allFilteredSelected}
            allTags={allTags}
            editingId={editingId}
            editData={editData}
            savingEdit={savingEdit}
            expandedId={expandedId}
            selected={selected}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelect}
            onStartEdit={startEdit}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onDeleteGuest={guestId => { if (confirm('Remove this guest?')) deleteGuest(guestId) }}
            onUpdateRsvp={updateRsvp}
            onToggleExpanded={guestId => setExpandedId(current => current === guestId ? null : guestId)}
            setEditData={setEditData}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>
      )}

      <BulkActionBar
        selectedCount={selected.size}
        confirmDelete={confirmDelete}
        deletingSelected={deletingSelected}
        onConfirmDelete={async () => { setConfirmDelete(false); await deleteSelected() }}
        onStartDelete={() => setConfirmDelete(true)}
        onCancelDelete={() => setConfirmDelete(false)}
        onClearSelection={() => { setSelected(new Set()); setConfirmDelete(false) }}
      />
    </div>
  )
}
