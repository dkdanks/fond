'use client'

import type { FormEvent } from 'react'
import { Gift, Loader2, Plus, X } from 'lucide-react'
import { ImageUploadInput } from '@/components/dashboard/image-upload-input'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

export function RegistryLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>{children}</label>
}

export function RegistryToggle({ on, onChange }: { on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} className="w-10 h-6 rounded-full relative cursor-pointer transition-colors shrink-0" style={{ background: on ? '#2C2B26' : '#E8E3D9' }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }} />
    </div>
  )
}

type AddGroupFormProps = {
  show: boolean
  newGroupName: string
  addingGroupSaving: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
  onGroupNameChange: (value: string) => void
}

export function AddGroupForm({
  show,
  newGroupName,
  addingGroupSaving,
  onSubmit,
  onClose,
  onGroupNameChange,
}: AddGroupFormProps) {
  if (!show) return null

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E8E3D9' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>New group</p>
        <button type="button" onClick={onClose} style={{ color: '#B5A98A' }}><X size={16} /></button>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <RegistryLabel>Group name *</RegistryLabel>
          <input autoFocus required className={inputCls} style={inputStyle} placeholder="e.g. Kitchen Reno, Honeymoon" value={newGroupName} onChange={event => onGroupNameChange(event.target.value)} />
          <p className="text-xs mt-1.5" style={{ color: '#B5A98A' }}>A group fund will be created automatically. You can add specific items to it too.</p>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={addingGroupSaving || !newGroupName.trim()} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
            {addingGroupSaving ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </div>
    </form>
  )
}

type AddItemFormProps = {
  show: boolean
  addingGroup: string | null
  viewMode: 'cards' | 'list'
  groups: string[]
  newName: string
  newDesc: string
  newAmount: string
  newGroup: string
  newImage: string
  addingSaving: boolean
  eventId: string
  supabase: ReturnType<typeof createClient>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onClose: () => void
  onNameChange: (value: string) => void
  onDescChange: (value: string) => void
  onAmountChange: (value: string) => void
  onGroupChange: (value: string) => void
  onImageChange: (value: string) => void
}

export function AddItemForm({
  show,
  addingGroup,
  viewMode,
  groups,
  newName,
  newDesc,
  newAmount,
  newGroup,
  newImage,
  addingSaving,
  eventId,
  supabase,
  onSubmit,
  onClose,
  onNameChange,
  onDescChange,
  onAmountChange,
  onGroupChange,
  onImageChange,
}: AddItemFormProps) {
  if (!show) return null

  return (
    <form onSubmit={onSubmit} className="mb-6 rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E8E3D9' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>
          New item {addingGroup ? <span style={{ color: '#8B8670', fontWeight: 400 }}>- {addingGroup}</span> : ''}
        </p>
        <button type="button" onClick={onClose} style={{ color: '#B5A98A' }}><X size={16} /></button>
      </div>
      <div className={`grid gap-3 ${viewMode === 'cards' ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <div className={viewMode === 'list' ? 'col-span-1' : 'col-span-2'}>
          <RegistryLabel>Name *</RegistryLabel>
          <input autoFocus required className={inputCls} style={inputStyle} placeholder="e.g. Coffee machine" value={newName} onChange={event => onNameChange(event.target.value)} />
        </div>
        <div>
          <RegistryLabel>Amount ($) <span style={{ color: '#C8BFA8', fontWeight: 400 }}>optional</span></RegistryLabel>
          <input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} placeholder="Open-ended if blank" value={newAmount} onChange={event => onAmountChange(event.target.value)} />
        </div>
        <div>
          <RegistryLabel>Group</RegistryLabel>
          <input list="groups-list" className={inputCls} style={inputStyle} placeholder="Assign to group" value={newGroup} onChange={event => onGroupChange(event.target.value)} />
          <datalist id="groups-list">{groups.map(group => <option key={group} value={group} />)}</datalist>
        </div>
        <div className="col-span-2">
          <RegistryLabel>Description <span style={{ color: '#C8BFA8', fontWeight: 400 }}>optional</span></RegistryLabel>
          <input className={inputCls} style={inputStyle} placeholder="A note for guests" value={newDesc} onChange={event => onDescChange(event.target.value)} />
        </div>
        <div className="col-span-2">
          <RegistryLabel>Photo <span style={{ color: '#C8BFA8', fontWeight: 400 }}>optional</span></RegistryLabel>
          <ImageUploadInput value={newImage} onChange={onImageChange} eventId={eventId} supabase={supabase} showPreview />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <button type="submit" disabled={addingSaving || !newName.trim()} className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5" style={{ background: '#2C2B26', color: 'white' }}>
          {addingSaving ? <><Loader2 size={12} className="animate-spin" /> Adding…</> : 'Add item'}
        </button>
      </div>
    </form>
  )
}

export function RegistryEmptyState({
  onAddGroup,
  onAddItem,
}: {
  onAddGroup: () => void
  onAddItem: () => void
}) {
  return (
    <div className="py-24 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'white', border: '1px solid #E8E3D9' }}>
        <Gift size={24} style={{ color: '#B5A98A' }} />
      </div>
      <p className="text-base font-semibold mb-2" style={{ color: '#2C2B26' }}>No registry items yet</p>
      <p className="text-sm mb-6" style={{ color: '#8B8670' }}>Add a group (e.g. Kitchen Reno, Honeymoon) or individual items.</p>
      <div className="flex items-center justify-center gap-3">
        <button onClick={onAddGroup} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border font-medium transition-colors" style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}>
          <Plus size={14} /> Add group
        </button>
        <button onClick={onAddItem} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
          <Plus size={14} /> Add item
        </button>
      </div>
    </div>
  )
}
