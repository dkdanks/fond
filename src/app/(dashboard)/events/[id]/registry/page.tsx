'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, ImageIcon, Gift, X, Check, Loader2, Pencil,
  LayoutGrid, List, ChevronDown, ChevronRight, Eye, SlidersHorizontal
} from 'lucide-react'
import { formatCurrency, type RegistryPool, type Contribution } from '@/types'

interface RegistryItem extends RegistryPool {
  group_name: string | null
  display_order: number | null
}

interface RegistrySettings {
  show_amounts: boolean
  progress_display: 'percentage' | 'dollar' | 'remaining' | 'current_goal'
}

const DEFAULT_SETTINGS: RegistrySettings = {
  show_amounts: true,
  progress_display: 'percentage',
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>{children}</label>
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} className="w-10 h-6 rounded-full relative cursor-pointer transition-colors shrink-0" style={{ background: on ? '#2C2B26' : '#E8E3D9' }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200" style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }} />
    </div>
  )
}

function ImageUploadInput({ value, onChange, eventId, supabase }: {
  value: string; onChange: (url: string) => void; eventId: string; supabase: ReturnType<typeof createClient>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const path = `${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { data, error } = await supabase.storage.from('event-images').upload(path, file, { upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path)
      onChange(publicUrl)
    } catch { /* fallback */ } finally {
      setUploading(false); if (fileRef.current) fileRef.current.value = ''
    }
  }
  return (
    <div className="flex items-center gap-2">
      <input className={`${inputCls} flex-1`} style={inputStyle} placeholder="https://… or upload" value={value} onChange={e => onChange(e.target.value)} />
      {value && <div className="w-8 h-8 rounded-lg shrink-0 bg-cover bg-center border" style={{ backgroundImage: `url(${value})`, borderColor: '#E8E3D9' }} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="shrink-0 px-2.5 py-2 rounded-xl text-xs border transition-colors" style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FAFAF7' }} title="Upload photo">
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
      </button>
    </div>
  )
}

type ViewMode = 'cards' | 'list'

export default function RegistryPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [items, setItems] = useState<RegistryItem[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [settings, setSettings] = useState<RegistrySettings>(DEFAULT_SETTINGS)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [settingsOpen, setSettingsOpen] = useState(true)

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addingGroup, setAddingGroup] = useState<string | null>(null) // group name to pre-fill
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newGroup, setNewGroup] = useState('')
  const [newImage, setNewImage] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  // Add group form
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [addingGroupSaving, setAddingGroupSaving] = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editImage, setEditImage] = useState('')
  const [editGroup, setEditGroup] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const [{ data: poolData }, { data: contribData }, { data: eventData }] = await Promise.all([
      supabase.from('registry_pools').select('*').eq('event_id', id).order('display_order').order('created_at'),
      supabase.from('contributions').select('*').eq('event_id', id).eq('status', 'completed'),
      supabase.from('events').select('content').eq('id', id).single(),
    ])
    setItems((poolData ?? []) as RegistryItem[])
    setContributions(contribData ?? [])
    if (eventData?.content) {
      const s = (eventData.content as Record<string, unknown>)?.registry_settings as Partial<RegistrySettings> | undefined
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s })
    }
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  function raisedFor(itemId: string) {
    return contributions.filter(c => c.pool_id === itemId).reduce((s, c) => s + c.amount, 0)
  }

  function progressLabel(item: RegistryItem): string | null {
    const raised = raisedFor(item.id)
    if (!item.target_amount) return raised > 0 ? formatCurrency(raised) + ' raised' : null
    const pct = Math.min(Math.round((raised / item.target_amount) * 100), 100)
    switch (settings.progress_display) {
      case 'percentage': return `${pct}%`
      case 'dollar': return formatCurrency(raised)
      case 'remaining': return `${formatCurrency(Math.max(0, item.target_amount - raised))} remaining`
      case 'current_goal': return `${formatCurrency(raised)} / ${formatCurrency(item.target_amount)}`
      default: return `${pct}%`
    }
  }

  const groups = Array.from(new Set(items.map(i => i.group_name).filter((g): g is string => g !== null)))
  const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0)
  const totalRequested = items.filter(i => i.target_amount).reduce((sum, i) => sum + (i.target_amount ?? 0), 0)

  const grouped: Record<string, RegistryItem[]> = {}
  items.forEach(item => {
    const g = item.group_name ?? '__ungrouped__'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(item)
  })

  function toggleGroup(g: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      next.has(g) ? next.delete(g) : next.add(g)
      return next
    })
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAddingSaving(true)
    await supabase.from('registry_pools').insert({
      event_id: id,
      title: newName.trim(),
      description: newDesc.trim() || null,
      target_amount: newAmount ? Math.round(parseFloat(newAmount) * 100) : null,
      group_name: newGroup.trim() || addingGroup || null,
      image_url: newImage.trim() || null,
      display_order: items.length,
    } as Record<string, unknown>)
    setNewName(''); setNewDesc(''); setNewAmount(''); setNewGroup(''); setNewImage('')
    setShowAddForm(false); setAddingGroup(null)
    setAddingSaving(false)
    load()
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setAddingGroupSaving(true)
    // Create a "pot" item for the group (open contribution pool for the group)
    await supabase.from('registry_pools').insert({
      event_id: id,
      title: `${newGroupName.trim()} Fund`,
      description: `Contribute to our ${newGroupName.trim()} collection`,
      target_amount: null,
      group_name: newGroupName.trim(),
      display_order: items.length,
    } as Record<string, unknown>)
    setNewGroupName('')
    setShowAddGroup(false)
    setAddingGroupSaving(false)
    load()
  }

  function startEdit(item: RegistryItem) {
    setEditingId(item.id)
    setEditName(item.title)
    setEditDesc(item.description ?? '')
    setEditAmount(item.target_amount ? String(item.target_amount / 100) : '')
    setEditImage(item.image_url ?? '')
    setEditGroup(item.group_name ?? '')
  }

  async function saveEdit(itemId: string) {
    setEditSaving(true)
    await supabase.from('registry_pools').update({
      title: editName.trim(),
      description: editDesc.trim() || null,
      target_amount: editAmount ? Math.round(parseFloat(editAmount) * 100) : null,
      image_url: editImage.trim() || null,
      group_name: editGroup.trim() || null,
    } as Record<string, unknown>).eq('id', itemId)
    setEditingId(null); setEditSaving(false); load()
  }

  async function deleteItem(itemId: string) {
    await supabase.from('registry_pools').delete().eq('id', itemId)
    setItems(prev => prev.filter(x => x.id !== itemId))
  }

  function saveSettings(updated: RegistrySettings) {
    setSettings(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { data: ev } = await supabase.from('events').select('content').eq('id', id).single()
      const content = (ev?.content as Record<string, unknown>) ?? {}
      await supabase.from('events').update({ content: { ...content, registry_settings: updated } } as Record<string, unknown>).eq('id', id)
    }, 800)
  }

  const openAddItem = (groupName?: string) => {
    setShowAddForm(true)
    setShowAddGroup(false)
    setAddingGroup(groupName ?? null)
    setNewGroup(groupName ?? '')
    setNewName(''); setNewDesc(''); setNewAmount(''); setNewImage('')
    setEditingId(null)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#FAFAF7' }}>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b shrink-0" style={{ background: 'white', borderColor: '#E8E3D9' }}>
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Registry Items</h1>
            <div className="hidden md:flex items-center gap-1 p-0.5 rounded-xl" style={{ background: '#F0EDE8' }}>
              {([
                { key: 'cards', icon: LayoutGrid },
                { key: 'list', icon: List },
              ] as const).map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: viewMode === key ? 'white' : 'transparent',
                    color: viewMode === key ? '#2C2B26' : '#8B8670',
                    boxShadow: viewMode === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Icon size={13} />
                  {key === 'cards' ? 'Cards' : 'List'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowAddGroup(true); setShowAddForm(false) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
              style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
            >
              <Plus size={13} /> Add group
            </button>
            <button
              onClick={() => openAddItem()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#2C2B26', color: 'white' }}
            >
              <Plus size={13} /> Add item
            </button>
            <button
              onClick={() => setSettingsOpen(o => !o)}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-xl border transition-colors"
              style={{
                borderColor: settingsOpen ? '#2C2B26' : '#E8E3D9',
                color: settingsOpen ? '#2C2B26' : '#8B8670',
                background: settingsOpen ? '#2C2B26' + '08' : 'white',
              }}
              title="Display settings"
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 max-w-4xl">

            {/* Add group form */}
            {showAddGroup && (
              <form onSubmit={addGroup} className="mb-6 rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E8E3D9' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>New group</p>
                  <button type="button" onClick={() => setShowAddGroup(false)} style={{ color: '#B5A98A' }}><X size={16} /></button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label>Group name *</Label>
                    <input autoFocus required className={inputCls} style={inputStyle} placeholder="e.g. Kitchen Reno, Honeymoon" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                    <p className="text-xs mt-1.5" style={{ color: '#B5A98A' }}>A group fund will be created automatically. You can add specific items to it too.</p>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" disabled={addingGroupSaving || !newGroupName.trim()} className="px-4 py-2 rounded-xl text-xs font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
                      {addingGroupSaving ? 'Creating…' : 'Create group'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Add item form */}
            {showAddForm && (
              <form onSubmit={addItem} className="mb-6 rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E8E3D9' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>
                    New item {addingGroup ? <span style={{ color: '#8B8670', fontWeight: 400 }}>— {addingGroup}</span> : ''}
                  </p>
                  <button type="button" onClick={() => { setShowAddForm(false); setAddingGroup(null) }} style={{ color: '#B5A98A' }}><X size={16} /></button>
                </div>
                <div className={`grid gap-3 ${viewMode === 'cards' ? 'grid-cols-2' : 'grid-cols-4'}`}>
                  <div className={viewMode === 'list' ? 'col-span-1' : 'col-span-2'}>
                    <Label>Name *</Label>
                    <input autoFocus required className={inputCls} style={inputStyle} placeholder="e.g. Coffee machine" value={newName} onChange={e => setNewName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Amount ($) <span style={{ color: '#C8BFA8', fontWeight: 400 }}>optional</span></Label>
                    <input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} placeholder="Open-ended if blank" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                  </div>
                  <div>
                    <Label>Group</Label>
                    <input list="groups-list" className={inputCls} style={inputStyle} placeholder="Assign to group" value={newGroup} onChange={e => setNewGroup(e.target.value)} />
                    <datalist id="groups-list">{groups.map(g => <option key={g} value={g} />)}</datalist>
                  </div>
                  <div className="col-span-2">
                    <Label>Description <span style={{ color: '#C8BFA8', fontWeight: 400 }}>optional</span></Label>
                    <input className={inputCls} style={inputStyle} placeholder="A note for guests" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Photo <span style={{ color: '#C8BFA8', fontWeight: 400 }}>optional</span></Label>
                    <ImageUploadInput value={newImage} onChange={setNewImage} eventId={id} supabase={supabase} />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="submit" disabled={addingSaving || !newName.trim()} className="px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5" style={{ background: '#2C2B26', color: 'white' }}>
                    {addingSaving ? <><Loader2 size={12} className="animate-spin" /> Adding…</> : 'Add item'}
                  </button>
                </div>
              </form>
            )}

            {/* Empty state */}
            {items.length === 0 && !showAddForm && !showAddGroup && (
              <div className="py-24 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'white', border: '1px solid #E8E3D9' }}>
                  <Gift size={24} style={{ color: '#B5A98A' }} />
                </div>
                <p className="text-base font-semibold mb-2" style={{ color: '#2C2B26' }}>No registry items yet</p>
                <p className="text-sm mb-6" style={{ color: '#8B8670' }}>Add a group (e.g. Kitchen Reno, Honeymoon) or individual items.</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => { setShowAddGroup(true); setShowAddForm(false) }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border font-medium transition-colors" style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}>
                    <Plus size={14} /> Add group
                  </button>
                  <button onClick={() => openAddItem()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
                    <Plus size={14} /> Add item
                  </button>
                </div>
              </div>
            )}

            {/* Items display */}
            {Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group} className="mb-8">
                {/* Group header */}
                <div className="flex items-center gap-3 mb-4">
                  {group !== '__ungrouped__' ? (
                    <>
                      <button onClick={() => toggleGroup(group)} className="flex items-center gap-2 text-left">
                        {collapsedGroups.has(group) ? <ChevronRight size={16} style={{ color: '#8B8670' }} /> : <ChevronDown size={16} style={{ color: '#8B8670' }} />}
                        <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>{group}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#8B8670' }}>{groupItems.length} item{groupItems.length !== 1 ? 's' : ''}</span>
                      </button>
                      <button
                        onClick={() => openAddItem(group)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-colors"
                        style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
                      >
                        <Plus size={11} /> Add to {group}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#B5A98A' }}>Ungrouped items</span>
                  )}
                </div>

                {/* Items grid/list */}
                {!collapsedGroups.has(group) && (
                  viewMode === 'cards' ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {groupItems.map(item => {
                        const raised = raisedFor(item.id)
                        const progress = item.target_amount ? Math.min((raised / item.target_amount) * 100, 100) : 0
                        const isEditing = editingId === item.id
                        return (
                          <div key={item.id} className="rounded-2xl border overflow-hidden group" style={{ borderColor: '#E8E3D9', background: 'white' }}>
                            {/* Image area */}
                            {item.image_url ? (
                              <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                            ) : (
                              <div className="h-36 flex items-center justify-center" style={{ background: '#F0EDE8' }}>
                                <Gift size={20} style={{ color: '#C8BFA8' }} />
                              </div>
                            )}
                            {isEditing ? (
                              <div className="p-3 flex flex-col gap-2 border-t" style={{ borderColor: '#F0EDE8', background: '#FAFAF7' }}>
                                <div><Label>Name</Label><input className={inputCls} style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} /></div>
                                <div><Label>Description</Label><input className={inputCls} style={inputStyle} placeholder="Optional" value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
                                <div><Label>Amount ($)</Label><input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} placeholder="Leave blank for open-ended" value={editAmount} onChange={e => setEditAmount(e.target.value)} /></div>
                                <div><Label>Group</Label><input list="edit-groups-list" className={inputCls} style={inputStyle} placeholder="Group name" value={editGroup} onChange={e => setEditGroup(e.target.value)} /><datalist id="edit-groups-list">{groups.map(g => <option key={g} value={g} />)}</datalist></div>
                                <div><Label>Photo</Label><ImageUploadInput value={editImage} onChange={setEditImage} eventId={id} supabase={supabase} /></div>
                                <div className="flex gap-2 pt-1">
                                  <button onClick={() => saveEdit(item.id)} disabled={editSaving} className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: '#2C2B26', color: 'white' }}>
                                    {editSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} {editSaving ? 'Saving…' : 'Save'}
                                  </button>
                                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: '#8B8670' }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <p className="font-medium text-sm leading-snug" style={{ color: '#2C2B26' }}>{item.title}</p>
                                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button onClick={() => startEdit(item)} className="p-1 rounded-md hover:bg-[#F0EDE8] transition-colors" style={{ color: '#B5A98A' }}><Pencil size={12} /></button>
                                    <button onClick={() => deleteItem(item.id)} className="p-1 rounded-md hover:bg-red-50 transition-colors" style={{ color: '#D4CCBC' }} onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}><Trash2 size={12} /></button>
                                  </div>
                                </div>
                                {item.description && <p className="text-xs mb-2 leading-relaxed" style={{ color: '#8B8670' }}>{item.description}</p>}
                                {settings.show_amounts && (
                                  <p className="text-xs font-medium mb-2" style={{ color: '#8B8670' }}>
                                    {item.target_amount ? formatCurrency(item.target_amount) : 'Any amount'}
                                    {raised > 0 && <span style={{ color: '#4CAF50' }}> · {progressLabel(item)}</span>}
                                  </p>
                                )}
                                {item.target_amount !== null && (
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 100 ? '#4CAF50' : '#8B8670' }} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* List / spreadsheet view */
                    <div className="rounded-2xl overflow-hidden border" style={{ background: 'white', borderColor: '#E8E3D9' }}>
                      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#FAFAF7', borderBottom: '1px solid #E8E3D9' }}>
                            <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: '#B5A98A' }}>Item</th>
                            <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: '#B5A98A' }}>Description</th>
                            <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: '#B5A98A' }}>Amount</th>
                            <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: '#B5A98A' }}>Raised</th>
                            <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: '#B5A98A' }}>Group</th>
                            <th className="px-4 py-3 w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupItems.map((item, idx) => {
                            const raised = raisedFor(item.id)
                            const isEditing = editingId === item.id
                            return (
                              <tr
                                key={item.id}
                                className="group transition-colors"
                                style={{ background: 'white', borderTop: idx > 0 ? '1px solid #E8E3D9' : undefined }}
                                onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(44,43,38,0.02)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'white' }}
                              >
                                {isEditing ? (
                                  <td colSpan={6} className="px-4 py-3">
                                    <div className="grid grid-cols-5 gap-2">
                                      <div><input className={inputCls} style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Name" /></div>
                                      <div><input className={inputCls} style={inputStyle} value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" /></div>
                                      <div><input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="Amount" /></div>
                                      <div><input list="edit-groups-list2" className={inputCls} style={inputStyle} value={editGroup} onChange={e => setEditGroup(e.target.value)} placeholder="Group" /><datalist id="edit-groups-list2">{groups.map(g => <option key={g} value={g} />)}</datalist></div>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => saveEdit(item.id)} disabled={editSaving} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
                                          {editSaving ? '…' : 'Save'}
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="px-2 py-2 rounded-xl text-xs" style={{ color: '#8B8670' }}>✕</button>
                                      </div>
                                    </div>
                                  </td>
                                ) : (
                                  <>
                                    <td className="px-4 py-3 font-medium" style={{ color: '#2C2B26' }}>{item.title}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: '#8B8670' }}>{item.description || <span style={{ color: '#D4CCBC' }}>—</span>}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: '#8B8670' }}>{item.target_amount ? formatCurrency(item.target_amount) : <span style={{ color: '#D4CCBC' }}>Open</span>}</td>
                                    <td className="px-4 py-3 text-xs" style={{ color: raised > 0 ? '#4CAF50' : '#D4CCBC' }}>{raised > 0 ? formatCurrency(raised) : '—'}</td>
                                    <td className="px-4 py-3">
                                      {item.group_name && <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: '#F0EDE8', color: '#8B8670' }}>{item.group_name}</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-[#F0EDE8] transition-colors" style={{ color: '#B5A98A' }}><Pencil size={13} /></button>
                                        <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#D4CCBC' }} onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')} onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}><Trash2 size={13} /></button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col h-full border-l overflow-hidden shrink-0"
        style={{
          width: settingsOpen ? 300 : 0,
          transition: 'width 0.25s ease',
          background: 'white',
          borderColor: '#E8E3D9',
          minWidth: 0,
        }}
      >

        {/* Header */}
        <div className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Registry</span>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B5A98A' }}>
              <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              {totalRaised > 0 && <span>· {formatCurrency(totalRaised)} raised</span>}
            </div>
          </div>

          {/* Display settings */}
          <div className="mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#8B8670' }}>Show amounts to guests</span>
              <Toggle on={settings.show_amounts} onChange={v => saveSettings({ ...settings, show_amounts: v })} />
            </div>
            {settings.show_amounts && (
              <div className="rounded-xl border overflow-hidden flex" style={{ borderColor: '#E8E3D9' }}>
                {([
                  { label: '$ remaining', value: 'remaining' },
                  { label: '% funded', value: 'percentage' },
                  { label: 'X / Y', value: 'current_goal' },
                ] as const).map(({ label, value }, idx, arr) => (
                  <button
                    key={value}
                    onClick={() => saveSettings({ ...settings, progress_display: value })}
                    className="flex-1 py-2 text-xs font-medium text-center transition-colors"
                    style={{
                      background: settings.progress_display === value ? '#2C2B26' : 'white',
                      color: settings.progress_display === value ? 'white' : '#8B8670',
                      borderRight: idx < arr.length - 1 ? '1px solid #E8E3D9' : undefined,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-3">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <Gift size={20} className="mx-auto mb-2" style={{ color: '#C8BFA8' }} />
                <p className="text-xs" style={{ color: '#B5A98A' }}>Items you add will appear here</p>
              </div>
            ) : Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group}>
                {group !== '__ungrouped__' && (
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: '#B5A98A' }}>{group}</p>
                )}
                {groupItems.map(item => {
                  const raised = raisedFor(item.id)
                  const progress = item.target_amount ? Math.min((raised / item.target_amount) * 100, 100) : 0
                  return (
                    <div key={item.id} className="rounded-xl border overflow-hidden mb-2" style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}>
                      {item.image_url && (
                        <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                      )}
                      <div className="p-3">
                        <p className="text-xs font-medium mb-0.5" style={{ color: '#2C2B26' }}>{item.title}</p>
                        {settings.show_amounts && item.target_amount && (
                          <p className="text-xs mb-1.5" style={{ color: '#8B8670' }}>{formatCurrency(item.target_amount)}</p>
                        )}
                        {item.target_amount !== null && (
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E8E3D9' }}>
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#8B8670' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
