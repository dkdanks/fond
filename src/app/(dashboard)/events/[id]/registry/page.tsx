'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Trash2, ImageIcon, Gift,
  LayoutGrid, Settings, X, Check, Loader2, Pencil,
} from 'lucide-react'
import { formatCurrency, type RegistryPool, type Contribution } from '@/types'

interface RegistrySettings {
  show_amounts: boolean
  progress_display: 'percentage' | 'dollar' | 'remaining' | 'current_goal'
  payout_details: string
}

const DEFAULT_SETTINGS: RegistrySettings = {
  show_amounts: true,
  progress_display: 'percentage',
  payout_details: '',
}

interface RegistryItem extends RegistryPool {
  group_name: string | null
  display_order: number | null
}

// ─── Small helpers ────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>{children}</label>
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className="w-10 h-6 rounded-full relative cursor-pointer transition-colors shrink-0"
      style={{ background: on ? '#2C2B26' : '#E8E3D9' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

function ImageUploadInput({ value, onChange, eventId, supabase }: {
  value: string
  onChange: (url: string) => void
  eventId: string
  supabase: ReturnType<typeof createClient>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { data, error } = await supabase.storage.from('event-images').upload(path, file, { upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path)
      onChange(publicUrl)
    } catch { /* fall back to URL */ } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className={`${inputCls} flex-1`}
        style={inputStyle}
        placeholder="https://… or upload"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <div className="w-8 h-8 rounded-lg shrink-0 bg-cover bg-center border" style={{ backgroundImage: `url(${value})`, borderColor: '#E8E3D9' }} />
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="shrink-0 px-2.5 py-2 rounded-xl text-xs border transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FAFAF7' }}
        title="Upload from device"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RegistryPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [items, setItems] = useState<RegistryItem[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [settings, setSettings] = useState<RegistrySettings>(DEFAULT_SETTINGS)
  const [leftTab, setLeftTab] = useState<'items' | 'settings'>('items')
  const [rightTab, setRightTab] = useState<'preview' | 'contributions'>('preview')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Add form
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newGroup, setNewGroup] = useState('')
  const [newImage, setNewImage] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  // Edit form (inline)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editImage, setEditImage] = useState('')
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

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAddingSaving(true)
    await supabase.from('registry_pools').insert({
      event_id: id,
      title: newName.trim(),
      description: newDesc.trim() || null,
      target_amount: newAmount ? Math.round(parseFloat(newAmount) * 100) : null,
      group_name: newGroup.trim() || null,
      image_url: newImage.trim() || null,
      display_order: items.length,
    } as Record<string, unknown>)
    setNewName(''); setNewDesc(''); setNewAmount(''); setNewGroup(''); setNewImage('')
    setShowAddForm(false)
    setAddingSaving(false)
    load()
  }

  function startEdit(item: RegistryItem) {
    setEditingId(item.id)
    setEditName(item.title)
    setEditDesc(item.description ?? '')
    setEditAmount(item.target_amount ? String(item.target_amount / 100) : '')
    setEditImage(item.image_url ?? '')
  }

  async function saveEdit(itemId: string) {
    setEditSaving(true)
    await supabase.from('registry_pools').update({
      title: editName.trim(),
      description: editDesc.trim() || null,
      target_amount: editAmount ? Math.round(parseFloat(editAmount) * 100) : null,
      image_url: editImage.trim() || null,
    } as Record<string, unknown>).eq('id', itemId)
    setEditingId(null)
    setEditSaving(false)
    load()
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
      await supabase.from('events').update({
        content: { ...content, registry_settings: updated },
      } as Record<string, unknown>).eq('id', id)
    }, 800)
  }

  // Derived
  const groups = Array.from(new Set(items.map(i => i.group_name).filter((g): g is string => g !== null)))
  const totalRequested = items.reduce((sum, i) => sum + (i.target_amount ?? 0), 0)
  const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0)
  const fundedItems = items.filter(item => {
    const raised = raisedFor(item.id)
    return item.target_amount !== null && raised >= item.target_amount
  }).length

  function raisedFor(itemId: string) {
    return contributions.filter(c => c.pool_id === itemId).reduce((s, c) => s + c.amount, 0)
  }

  function progressLabel(item: RegistryItem): string | null {
    const raised = raisedFor(item.id)
    if (!item.target_amount) return null
    const pct = Math.min(Math.round((raised / item.target_amount) * 100), 100)
    switch (settings.progress_display) {
      case 'percentage': return `${pct}%`
      case 'dollar': return formatCurrency(raised)
      case 'remaining': return `${formatCurrency(Math.max(0, item.target_amount - raised))} remaining`
      case 'current_goal': return `${formatCurrency(raised)} / ${formatCurrency(item.target_amount)}`
      default: return `${pct}%`
    }
  }

  const grouped: Record<string, RegistryItem[]> = {}
  items.forEach(item => {
    const g = item.group_name ?? '__ungrouped__'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(item)
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F0E8' }}>

      {/* ── LEFT PANEL ── */}
      <div
        className="flex flex-col shrink-0 h-full border-r overflow-hidden"
        style={{ width: 300, background: 'white', borderColor: '#E8E3D9' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Registry</span>
            {leftTab === 'items' && (
              <button
                onClick={() => { setShowAddForm(o => !o); setEditingId(null) }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: showAddForm ? '#F5F0E8' : '#2C2B26',
                  color: showAddForm ? '#8B8670' : 'white',
                }}
              >
                {showAddForm ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Add item</>}
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: '#F0EDE8' }}>
            {([
              { key: 'items', icon: LayoutGrid, label: 'Items' },
              { key: 'settings', icon: Settings, label: 'Settings' },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setLeftTab(key)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  color: leftTab === key ? '#2C2B26' : '#B5A98A',
                  borderBottom: leftTab === key ? '2px solid #2C2B26' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── ITEMS TAB ── */}
          {leftTab === 'items' && (
            <div className="p-4 flex flex-col gap-3">

              {/* Add item form */}
              {showAddForm && (
                <form
                  onSubmit={addItem}
                  className="rounded-2xl border p-4 flex flex-col gap-3"
                  style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
                >
                  <p className="text-xs font-semibold" style={{ color: '#2C2B26' }}>New item</p>

                  <div>
                    <Label>Name *</Label>
                    <input
                      autoFocus
                      required
                      className={inputCls}
                      style={inputStyle}
                      placeholder="e.g. Coffee machine"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Description <span style={{ color: '#C8BFA8', fontWeight: 400 }}>(optional)</span></Label>
                    <input
                      className={inputCls}
                      style={inputStyle}
                      placeholder="A short note for guests"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Amount ($)</Label>
                      <input
                        type="number" min="1" step="0.01"
                        className={inputCls} style={inputStyle}
                        placeholder="150"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Group</Label>
                      <input
                        list="groups-list"
                        className={inputCls} style={inputStyle}
                        placeholder="e.g. Kitchen"
                        value={newGroup}
                        onChange={e => setNewGroup(e.target.value)}
                      />
                      <datalist id="groups-list">
                        {groups.map(g => <option key={g} value={g} />)}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <Label>Image <span style={{ color: '#C8BFA8', fontWeight: 400 }}>(optional)</span></Label>
                    <ImageUploadInput
                      value={newImage}
                      onChange={setNewImage}
                      eventId={id}
                      supabase={supabase}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addingSaving}
                    className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    style={{ background: '#2C2B26', color: 'white' }}
                  >
                    {addingSaving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : 'Add item'}
                  </button>
                </form>
              )}

              {/* Items list */}
              {items.length === 0 && !showAddForm ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#F5F0E8' }}>
                    <Gift size={18} style={{ color: '#B5A98A' }} />
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>No items yet</p>
                  <p className="text-xs" style={{ color: '#8B8670' }}>Add your first registry item above.</p>
                </div>
              ) : (
                Object.entries(grouped).map(([group, groupItems]) => (
                  <div key={group}>
                    {group !== '__ungrouped__' && (
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: '#B5A98A' }}>
                        {group}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      {groupItems.map(item => {
                        const raised = raisedFor(item.id)
                        const progress = item.target_amount ? Math.min((raised / item.target_amount) * 100, 100) : 0
                        const isEditing = editingId === item.id

                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border overflow-hidden"
                            style={{ borderColor: '#E8E3D9', background: 'white' }}
                          >
                            {/* Item row */}
                            <div className="group flex items-center gap-3 p-3 hover:bg-[#FAFAF7] transition-colors">
                              <div
                                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                                style={
                                  item.image_url
                                    ? { backgroundImage: `url(${item.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                    : { background: '#F5F0E8' }
                                }
                              >
                                {!item.image_url && <ImageIcon size={14} style={{ color: '#C8BFA8' }} />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: '#2C2B26' }}>{item.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.target_amount !== null && (
                                    <span className="text-xs" style={{ color: '#8B8670' }}>{formatCurrency(item.target_amount)}</span>
                                  )}
                                  {item.group_name && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: '#F5F0E8', color: '#8B8670' }}>
                                      {item.group_name}
                                    </span>
                                  )}
                                </div>
                                {item.target_amount !== null && raised > 0 && (
                                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#F0EDE8' }}>
                                    <div className="h-full rounded-full" style={{ width: `${progress}%`, background: '#8B8670' }} />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => isEditing ? setEditingId(null) : startEdit(item)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-[#F0EDE8]"
                                  style={{ color: '#B5A98A' }}
                                  title="Edit"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                                  style={{ color: '#D4CCBC' }}
                                  onMouseEnter={e => { e.currentTarget.style.color = '#EF4444' }}
                                  onMouseLeave={e => { e.currentTarget.style.color = '#D4CCBC' }}
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Inline edit form */}
                            {isEditing && (
                              <div className="px-3 pb-3 flex flex-col gap-2.5 border-t" style={{ borderColor: '#F0EDE8', background: '#FAFAF7' }}>
                                <div className="pt-3">
                                  <Label>Name</Label>
                                  <input className={inputCls} style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <input className={inputCls} style={inputStyle} placeholder="Optional note" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Amount ($)</Label>
                                  <input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} placeholder="Leave blank for open-ended" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                                </div>
                                <div>
                                  <Label>Image</Label>
                                  <ImageUploadInput value={editImage} onChange={setEditImage} eventId={id} supabase={supabase} />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => saveEdit(item.id)}
                                    disabled={editSaving}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                                    style={{ background: '#2C2B26', color: 'white' }}
                                  >
                                    {editSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                    {editSaving ? 'Saving…' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs"
                                    style={{ color: '#8B8670' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {leftTab === 'settings' && (
            <div className="p-4 flex flex-col gap-5">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Show amounts to guests</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8B8670' }}>Display dollar values on your registry</p>
                </div>
                <Toggle on={settings.show_amounts} onChange={v => saveSettings({ ...settings, show_amounts: v })} />
              </div>

              <div className="border-t" style={{ borderColor: '#F0EDE8' }} />

              <div>
                <p className="text-sm font-medium mb-3" style={{ color: '#2C2B26' }}>Progress display</p>
                <div className="flex flex-col gap-2">
                  {([
                    { val: 'percentage', label: 'Percentage', sub: 'e.g. 45%' },
                    { val: 'dollar', label: 'Dollar amount raised', sub: 'e.g. $450 raised' },
                    { val: 'remaining', label: 'Remaining balance', sub: 'e.g. $550 remaining' },
                    { val: 'current_goal', label: 'Current / Goal', sub: 'e.g. $450 / $1,000' },
                  ] as const).map(({ val, label, sub }) => (
                    <button
                      key={val}
                      onClick={() => saveSettings({ ...settings, progress_display: val })}
                      className="flex items-start gap-3 p-3 rounded-xl border text-left transition-all"
                      style={{
                        borderColor: settings.progress_display === val ? '#2C2B26' : '#E8E3D9',
                        background: settings.progress_display === val ? '#F5F0E8' : 'white',
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                        style={{ borderColor: settings.progress_display === val ? '#2C2B26' : '#D4CCBC' }}
                      >
                        {settings.progress_display === val && <div className="w-2 h-2 rounded-full" style={{ background: '#2C2B26' }} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>{label}</p>
                        <p className="text-xs" style={{ color: '#8B8670' }}>{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t" style={{ borderColor: '#F0EDE8' }} />

              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>Payout details</p>
                <p className="text-xs mb-3" style={{ color: '#8B8670' }}>Where contributions will be sent</p>
                <input
                  className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]"
                  style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                  placeholder="e.g. BSB 012-345, Acc 123456789"
                  value={settings.payout_details}
                  onChange={e => saveSettings({ ...settings, payout_details: e.target.value })}
                />
              </div>

              <div className="border-t" style={{ borderColor: '#F0EDE8' }} />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Currency</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8B8670' }}>Multi-currency coming soon</p>
                </div>
                <span className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ background: '#F5F0E8', color: '#8B8670' }}>
                  AUD
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Stats bar */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          <div className="flex items-center gap-6">
            {[
              { label: 'Requested', value: formatCurrency(totalRequested) },
              { label: 'Raised', value: formatCurrency(totalRaised) },
              { label: 'Items', value: String(items.length) },
              { label: 'Funded', value: String(fundedItems) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs" style={{ color: '#B5A98A' }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Preview / Contributions tabs */}
          <div className="flex gap-0 p-0.5 rounded-xl" style={{ background: '#F5F0E8' }}>
            {(['preview', 'contributions'] as const).map(t => (
              <button
                key={t}
                onClick={() => setRightTab(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: rightTab === t ? 'white' : 'transparent',
                  color: rightTab === t ? '#2C2B26' : '#8B8670',
                  boxShadow: rightTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {t === 'contributions'
                  ? `Contributions${contributions.length > 0 ? ` (${contributions.length})` : ''}`
                  : 'Preview'}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {rightTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start" style={{ background: '#E8E3D9' }}>
            <div className="w-full rounded-2xl overflow-hidden shadow-xl" style={{ background: '#FAFAF7', maxWidth: 700 }}>
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex gap-1.5">
                  {['#FF5F57', '#FFBD2E', '#28CA41'].map(c => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 mx-4 py-1 px-3 rounded-md text-xs text-center" style={{ background: 'rgba(0,0,0,0.04)', color: '#8B8670' }}>
                  joyabl.com/e/…/registry
                </div>
              </div>

              {/* Registry content */}
              <div className="px-8 py-10 text-center border-b" style={{ borderColor: 'rgba(44,43,38,0.08)' }}>
                <h2 className="text-2xl font-semibold mb-2" style={{ color: '#2C2B26' }}>Registry</h2>
                <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: '#8B8670' }}>
                  Choose something to contribute to below.
                </p>
              </div>

              <div className="p-6">
                {items.length === 0 ? (
                  <div className="py-16 text-center">
                    <Gift size={24} className="mx-auto mb-3" style={{ color: '#C8BFA8' }} />
                    <p className="text-sm" style={{ color: '#B5A98A' }}>No items added yet</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([group, groupItems]) => (
                    <div key={group} className="mb-8 last:mb-0">
                      {group !== '__ungrouped__' && (
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8B8670' }}>
                          {group}
                        </h3>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        {groupItems.map(item => {
                          const raised = raisedFor(item.id)
                          const progress = item.target_amount ? Math.min((raised / item.target_amount) * 100, 100) : 0
                          return (
                            <div key={item.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(44,43,38,0.08)', background: 'white' }}>
                              {item.image_url ? (
                                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                              ) : (
                                <div className="h-40 flex items-center justify-center" style={{ background: '#F5F0E8' }}>
                                  <Gift size={24} style={{ color: '#C8BFA8' }} />
                                </div>
                              )}
                              <div className="p-4">
                                <p className="font-medium text-sm mb-1" style={{ color: '#2C2B26' }}>{item.title}</p>
                                {item.description && (
                                  <p className="text-xs mb-2 leading-relaxed" style={{ color: '#8B8670' }}>{item.description}</p>
                                )}
                                {settings.show_amounts && item.target_amount !== null && (
                                  <p className="text-xs mb-2.5" style={{ color: '#8B8670' }}>{progressLabel(item)}</p>
                                )}
                                {item.target_amount !== null && (
                                  <div className="h-1.5 rounded-full mb-3 overflow-hidden" style={{ background: '#F0EDE8' }}>
                                    <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#8B8670' }} />
                                  </div>
                                )}
                                <button className="w-full py-2 rounded-xl text-xs font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
                                  Contribute
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contributions */}
        {rightTab === 'contributions' && (
          <div className="flex-1 overflow-y-auto p-6">
            {contributions.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-16 text-center" style={{ borderColor: '#D4CCBC' }}>
                <Gift size={24} className="mx-auto mb-3" style={{ color: '#C8BFA8' }} />
                <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>No contributions yet</p>
                <p className="text-xs" style={{ color: '#8B8670' }}>Share your event page to start receiving gifts.</p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ background: 'white', borderColor: '#E8E3D9' }}>
                <div
                  className="grid grid-cols-[1fr_1fr_120px_100px] px-5 py-3 border-b text-xs font-medium"
                  style={{ borderColor: '#F5F0E8', color: '#B5A98A', background: '#FAFAF7' }}
                >
                  <span>From</span>
                  <span>Item</span>
                  <span>Date</span>
                  <span className="text-right">Amount</span>
                </div>
                {contributions.map(c => {
                  const item = items.find(i => i.id === c.pool_id)
                  return (
                    <div
                      key={c.id}
                      className="grid grid-cols-[1fr_1fr_120px_100px] px-5 py-3.5 border-b last:border-b-0 items-center"
                      style={{ borderColor: '#F5F0E8' }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>{c.contributor_name}</p>
                        {c.message && <p className="text-xs italic" style={{ color: '#8B8670' }}>&ldquo;{c.message}&rdquo;</p>}
                      </div>
                      <span className="text-sm" style={{ color: '#8B8670' }}>{item?.title ?? 'Anything'}</span>
                      <span className="text-xs" style={{ color: '#B5A98A' }}>
                        {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-sm font-semibold text-right" style={{ color: '#2C2B26' }}>{formatCurrency(c.amount)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
