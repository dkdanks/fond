'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Mail,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import type { ChangeEvent, Dispatch, FormEvent, RefObject, SetStateAction } from 'react'
import React from 'react'
import { Edit2, MessageSquare, Trash2 as TrashSmall } from 'lucide-react'
import type { Guest } from '@/types'

const PRESET_TAGS = [
  'Immediate family', 'Distant family', 'Close friend', 'Wedding party',
  'Interstate', 'International', 'Colleague', 'Plus one',
]

type RsvpStatus = 'attending' | 'declined' | 'pending'
type Filter = 'all' | 'attending' | 'declined' | 'pending'
type AddMode = 'none' | 'single' | 'paste' | 'csv'

type GuestsHeaderProps = {
  statsTotal: number
  addDropdownOpen: boolean
  onToggleAddDropdown: () => void
  onExport: () => void
  onSelectAddMode: (mode: Exclude<AddMode, 'none'>) => void
}

export function GuestsHeader({
  statsTotal,
  addDropdownOpen,
  onToggleAddDropdown,
  onExport,
  onSelectAddMode,
}: GuestsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-6 md:mb-8 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>Guests</h1>
        <p className="text-sm" style={{ color: '#8B8670' }}>{statsTotal} guest{statsTotal !== 1 ? 's' : ''} on your list</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
          style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
        >
          <Download size={13} /> Export
        </button>
        <div className="relative">
          <button
            onClick={onToggleAddDropdown}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#2C2B26', color: 'white' }}
          >
            <Plus size={14} /> Add guest <ChevronDown size={12} style={{ opacity: 0.6 }} />
          </button>
          {addDropdownOpen && (
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
                  onClick={() => onSelectAddMode(key)}
                  className="w-full px-4 py-2.5 text-sm text-left transition-colors"
                  style={{ color: '#2C2B26' }}
                  onMouseEnter={event => { event.currentTarget.style.background = 'rgba(44,43,38,0.06)' }}
                  onMouseLeave={event => { event.currentTarget.style.background = 'transparent' }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function GuestStatsCards({
  attending,
  declined,
  pending,
  acceptanceRate,
}: {
  attending: number
  declined: number
  pending: number
  acceptanceRate: number
}) {
  return (
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
  )
}

export function GuestFilters({
  search,
  filter,
  statsTotal,
  attending,
  declined,
  pending,
  onSearchChange,
  onFilterChange,
}: {
  search: string
  filter: Filter
  statsTotal: number
  attending: number
  declined: number
  pending: number
  onSearchChange: (value: string) => void
  onFilterChange: (filter: Filter) => void
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B5A98A' }} />
        <input
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26] transition-colors"
          style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
          placeholder="Search by name or email…"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex gap-1">
        {([
          { key: 'all', label: `All (${statsTotal})` },
          { key: 'attending', label: `Attending (${attending})` },
          { key: 'declined', label: `Declined (${declined})` },
          { key: 'pending', label: `Awaiting (${pending})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
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
  )
}

export function GuestsEmptyState({
  hasGuests,
  onAddFirstGuest,
}: {
  hasGuests: boolean
  onAddFirstGuest: () => void
}) {
  return (
    <div className="py-20 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F0EDE8' }}>
        <Users size={20} style={{ color: '#B5A98A' }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>
        {hasGuests ? 'No guests match your filter' : 'No guests yet'}
      </p>
      {hasGuests ? (
        <p className="text-xs" style={{ color: '#8B8670' }}>Try adjusting your search or filter.</p>
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: '#8B8670' }}>Start building your guest list.</p>
          <button
            onClick={onAddFirstGuest}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: '#2C2B26', color: 'white' }}
          >
            <Plus size={14} /> Add first guest
          </button>
        </>
      )}
    </div>
  )
}

export function BulkActionBar({
  selectedCount,
  confirmDelete,
  deletingSelected,
  onConfirmDelete,
  onStartDelete,
  onCancelDelete,
  onClearSelection,
}: {
  selectedCount: number
  confirmDelete: boolean
  deletingSelected: boolean
  onConfirmDelete: () => void
  onStartDelete: () => void
  onCancelDelete: () => void
  onClearSelection: () => void
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: selectedCount > 0 ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(120%)',
        zIndex: 50,
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: 'white',
        borderColor: '#E8E3D9',
      }}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-xl"
    >
      <span className="text-sm font-medium" style={{ color: '#2C2B26' }}>{selectedCount} selected</span>
      <div className="w-px h-4 shrink-0" style={{ background: '#E8E3D9' }} />
      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#EF4444' }}>
            Delete {selectedCount} guest{selectedCount !== 1 ? 's' : ''}?
          </span>
          <button
            onClick={onConfirmDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: '#EF4444', color: 'white' }}
          >
            Confirm
          </button>
          <button
            onClick={onCancelDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ color: '#8B8670' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={onStartDelete}
          disabled={deletingSelected}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
          style={{ borderColor: '#EF4444', color: '#EF4444', background: 'white' }}
          onMouseEnter={event => { event.currentTarget.style.background = '#FEF2F2' }}
          onMouseLeave={event => { event.currentTarget.style.background = 'white' }}
        >
          <Trash2 size={12} /> {deletingSelected ? 'Deleting…' : 'Delete'}
        </button>
      )}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
        onMouseEnter={event => { event.currentTarget.style.background = 'rgba(44,43,38,0.06)' }}
        onMouseLeave={event => { event.currentTarget.style.background = 'white' }}
      >
        <Mail size={12} /> Send invitation
      </button>
      <div className="w-px h-4 shrink-0" style={{ background: '#E8E3D9' }} />
      <button
        className="flex items-center gap-1 text-xs transition-colors"
        style={{ color: '#B5A98A' }}
        onClick={onClearSelection}
      >
        <X size={13} />
      </button>
    </div>
  )
}

type ParsedRow = { name: string; email: string; error?: string }
type ParsedCsvRow = { first_name: string; last_name: string; email: string; phone: string }

type AddGuestPanelsProps = {
  addMode: AddMode
  onClose: () => void
  onAddGuest: (event: FormEvent<HTMLFormElement>) => void
  singleFirstName: string
  singleLastName: string
  singleEmail: string
  singlePhone: string
  singleNote: string
  singlePlusOne: boolean
  adding: boolean
  onSingleFirstNameChange: (value: string) => void
  onSingleLastNameChange: (value: string) => void
  onSingleEmailChange: (value: string) => void
  onSinglePhoneChange: (value: string) => void
  onSingleNoteChange: (value: string) => void
  onToggleSinglePlusOne: () => void
  csvText: string
  csvRows: ParsedCsvRow[]
  csvImporting: boolean
  onCsvTextChange: (value: string) => void
  onImportCsv: () => void
  pasteText: string
  parsed: ParsedRow[]
  validRows: ParsedRow[]
  errorRows: ParsedRow[]
  importing: boolean
  sendInvites: boolean
  onPasteTextChange: (value: string) => void
  onToggleSendInvites: () => void
  onImportGuests: () => void
  dragOver: boolean
  fileRef: RefObject<HTMLInputElement | null>
  onDragOver: () => void
  onDragLeave: () => void
  onFileDrop: (file: File) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function AddGuestPanels({
  addMode,
  onClose,
  onAddGuest,
  singleFirstName,
  singleLastName,
  singleEmail,
  singlePhone,
  singleNote,
  singlePlusOne,
  adding,
  onSingleFirstNameChange,
  onSingleLastNameChange,
  onSingleEmailChange,
  onSinglePhoneChange,
  onSingleNoteChange,
  onToggleSinglePlusOne,
  csvText,
  csvRows,
  csvImporting,
  onCsvTextChange,
  onImportCsv,
  pasteText,
  parsed,
  validRows,
  errorRows,
  importing,
  sendInvites,
  onPasteTextChange,
  onToggleSendInvites,
  onImportGuests,
  dragOver,
  fileRef,
  onDragOver,
  onDragLeave,
  onFileDrop,
  onFileChange,
}: AddGuestPanelsProps) {
  if (addMode === 'none') return null

  const exampleCsv = 'Name,Email\nJane Smith,jane@example.com\nJohn Doe,john@example.com'

  return (
    <div
      className="mb-6 rounded-2xl border p-6"
      style={{ background: 'white', borderColor: '#E8E3D9' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: '#2C2B26' }}>
          {addMode === 'single' ? 'Add a guest' : addMode === 'paste' ? 'Paste your guest list' : 'Upload CSV'}
        </h2>
        <button onClick={onClose} style={{ color: '#B5A98A' }}>
          <X size={16} />
        </button>
      </div>

      {addMode === 'single' && (
        <form onSubmit={onAddGuest} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>First name *</label>
              <input
                autoFocus
                required
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                value={singleFirstName}
                onChange={event => onSingleFirstNameChange(event.target.value)}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>Last name</label>
              <input
                className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[#2C2B26]"
                style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                value={singleLastName}
                onChange={event => onSingleLastNameChange(event.target.value)}
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
                onChange={event => onSingleEmailChange(event.target.value)}
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
                onChange={event => onSinglePhoneChange(event.target.value)}
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
              onChange={event => onSingleNoteChange(event.target.value)}
              placeholder="Private note…"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                className="w-9 h-5 rounded-full relative transition-colors"
                style={{ background: singlePlusOne ? '#2C2B26' : '#E8E3D9' }}
                onClick={onToggleSinglePlusOne}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: singlePlusOne ? 'translateX(17px)' : 'translateX(2px)' }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: '#2C2B26' }}>+1 allowed</span>
            </label>
          </div>

          <div className="border-t pt-4 mt-1 flex flex-col gap-2" style={{ borderColor: '#F0EDE8' }}>
            <p className="text-xs font-semibold" style={{ color: '#2C2B26' }}>Paste &amp; upload CSV</p>
            <p className="text-xs" style={{ color: '#B5A98A' }}>Columns: first name, last name, email, phone (one per line, comma-separated)</p>
            <textarea
              className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none"
              style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26', minHeight: 90, fontFamily: 'monospace' }}
              placeholder="Jane,Smith,jane@example.com,+61400000000"
              value={csvText}
              onChange={event => onCsvTextChange(event.target.value)}
            />
            {csvRows.length > 0 && (
              <p className="text-xs" style={{ color: '#16A34A' }}>{csvRows.length} row{csvRows.length !== 1 ? 's' : ''} ready to import</p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onImportCsv}
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
            placeholder={`Paste names + emails, one per line:\n${exampleCsv}`}
            value={pasteText}
            onChange={event => onPasteTextChange(event.target.value)}
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
              onClick={onToggleSendInvites}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ transform: sendInvites ? 'translateX(17px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="text-xs" style={{ color: '#2C2B26' }}>Send invitation emails immediately</span>
          </label>
          <div className="flex justify-end">
            <button
              onClick={onImportGuests}
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
          onDragOver={event => { event.preventDefault(); onDragOver() }}
          onDragLeave={onDragLeave}
          onDrop={event => {
            event.preventDefault()
            onDragLeave()
            const file = event.dataTransfer.files[0]
            if (file) onFileDrop(file)
          }}
          className="flex flex-col items-center justify-center gap-3 py-12 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
          style={{ borderColor: dragOver ? '#2C2B26' : '#E8E3D9', background: dragOver ? 'rgba(44,43,38,0.06)' : '#FAFAF7' }}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={20} style={{ color: '#B5A98A' }} />
          <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Drop a CSV here or click to browse</p>
          <p className="text-xs" style={{ color: '#B5A98A' }}>Columns: Name, Email (headers optional)</p>
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFileChange} />
        </div>
      )}
    </div>
  )
}

export function TagBadge({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
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

export function TagSelector({
  tags,
  onChange,
  allTags,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  allTags: string[]
}) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allOptions = Array.from(new Set([...PRESET_TAGS, ...allTags]))

  function toggle(tag: string) {
    onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  }

  function addCustom() {
    const nextTag = custom.trim()
    if (!nextTag || tags.includes(nextTag)) return
    onChange([...tags, nextTag])
    setCustom('')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
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
                onMouseEnter={event => { event.currentTarget.style.background = 'rgba(44,43,38,0.06)' }}
                onMouseLeave={event => { event.currentTarget.style.background = 'transparent' }}
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
              onChange={event => setCustom(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && (event.preventDefault(), addCustom())}
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

export function RsvpDropdown({ status, onUpdate }: { status: string; onUpdate: (s: RsvpStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = RSVP_OPTIONS.find(option => option.value === status) ?? RSVP_OPTIONS[2]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
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
          {RSVP_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onUpdate(option.value); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors"
              style={{ color: '#2C2B26' }}
              onMouseEnter={event => { event.currentTarget.style.background = 'rgba(44,43,38,0.06)' }}
              onMouseLeave={event => { event.currentTarget.style.background = 'transparent' }}
            >
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: option.dot }} />
              {option.label}
              {option.value === status && <Check size={10} className="ml-auto" style={{ color: '#2C2B26' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type GuestTableProps = {
  guests: Guest[]
  allFilteredSelected: boolean
  allTags: string[]
  editingId: string | null
  editData: Partial<Guest>
  savingEdit: boolean
  expandedId: string | null
  selected: Set<string>
  onToggleSelectAll: () => void
  onToggleSelect: (guestId: string) => void
  onStartEdit: (guest: Guest) => void
  onSaveEdit: (guestId: string) => void
  onCancelEdit: () => void
  onDeleteGuest: (guestId: string) => void
  onUpdateRsvp: (guestId: string, status: RsvpStatus) => void
  onToggleExpanded: (guestId: string) => void
  setEditData: Dispatch<SetStateAction<Partial<Guest>>>
}

export function GuestTable({
  guests,
  allFilteredSelected,
  allTags,
  editingId,
  editData,
  savingEdit,
  expandedId,
  selected,
  onToggleSelectAll,
  onToggleSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteGuest,
  onUpdateRsvp,
  onToggleExpanded,
  setEditData,
}: GuestTableProps) {
  return (
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
                  onClick={onToggleSelectAll}
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
            {guests.map((guest, idx) => {
              const isEditing = editingId === guest.id
              const isSelected = selected.has(guest.id)
              const isExpanded = expandedId === guest.id
              const firstName = guest.first_name ?? guest.name.split(' ')[0]
              const lastName = guest.last_name ?? guest.name.split(' ').slice(1).join(' ')

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
                                  onChange={event => setEditData(data => ({ ...data, first_name: event.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Last name</label>
                                <input
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={editData.last_name ?? ''}
                                  onChange={event => setEditData(data => ({ ...data, last_name: event.target.value }))}
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
                                  onChange={event => setEditData(data => ({ ...data, email: event.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Phone</label>
                                <input
                                  type="tel"
                                  className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                                  style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
                                  value={(editData.phone as string) ?? ''}
                                  onChange={event => setEditData(data => ({ ...data, phone: event.target.value }))}
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
                                  onChange={event => setEditData(data => ({ ...data, note: event.target.value }))}
                                  placeholder="Private note…"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 cursor-pointer select-none pb-1.5">
                                  <div
                                    className="w-9 h-5 rounded-full relative transition-colors"
                                    style={{ background: editData.plus_one ? '#2C2B26' : '#E8E3D9' }}
                                    onClick={() => setEditData(data => ({ ...data, plus_one: !data.plus_one }))}
                                  >
                                    <div
                                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                                      style={{ transform: editData.plus_one ? 'translateX(17px)' : 'translateX(2px)' }}
                                    />
                                  </div>
                                  <span className="text-xs" style={{ color: '#2C2B26' }}>+1 allowed</span>
                                </label>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs mb-1.5" style={{ color: '#8B8670' }}>Tags</label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {(editData.tags as string[] ?? []).map(tag => (
                                  <TagBadge key={tag} tag={tag} onRemove={() => setEditData(data => ({ ...data, tags: (data.tags as string[]).filter(t => t !== tag) }))} />
                                ))}
                              </div>
                              <TagSelector
                                tags={editData.tags as string[] ?? []}
                                onChange={tags => setEditData(data => ({ ...data, tags }))}
                                allTags={allTags}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => onSaveEdit(guest.id)}
                                disabled={savingEdit}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: '#2C2B26', color: 'white' }}
                              >
                                {savingEdit ? 'Saving…' : <><Check size={12} /> Save</>}
                              </button>
                              <button
                                onClick={onCancelEdit}
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
                            onClick={() => onToggleSelect(guest.id)}
                          >
                            {isSelected && <Check size={10} color="white" />}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onStartEdit(guest)}
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
                            onUpdate={status => onUpdateRsvp(guest.id, status)}
                          />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: guest.plus_one ? '#2C2B26' : '#D4CCBC' }}>
                          {guest.plus_one ? <Check size={14} /> : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {rsvpAnswers.length > 0 && (
                              <button
                                onClick={() => onToggleExpanded(guest.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ color: isExpanded ? '#2C2B26' : '#B5A98A', background: isExpanded ? 'rgba(44,43,38,0.06)' : 'transparent' }}
                                title={`${rsvpAnswers.length} RSVP response${rsvpAnswers.length !== 1 ? 's' : ''}`}
                              >
                                <MessageSquare size={13} />
                              </button>
                            )}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onStartEdit(guest)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ color: '#8B8670' }}
                                onMouseEnter={event => { event.currentTarget.style.background = 'rgba(44,43,38,0.06)' }}
                                onMouseLeave={event => { event.currentTarget.style.background = 'transparent' }}
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => onDeleteGuest(guest.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                style={{ color: '#D4CCBC' }}
                                onMouseEnter={event => {
                                  event.currentTarget.style.color = '#EF4444'
                                  event.currentTarget.style.background = '#FEF2F2'
                                }}
                                onMouseLeave={event => {
                                  event.currentTarget.style.color = '#D4CCBC'
                                  event.currentTarget.style.background = 'transparent'
                                }}
                                title="Delete"
                              >
                                <TrashSmall size={13} />
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
                          {rsvpAnswers.map(({ q, a }, index) => (
                            <div key={index}>
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
  )
}
