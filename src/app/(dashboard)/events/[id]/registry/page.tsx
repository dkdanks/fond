'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { guardEvent } from '@/lib/event-guard'
import { AddGroupForm, AddItemForm, RegistryEmptyState } from '@/components/registry/forms'
import { RegistryItemsDisplay, type RegistryItem, type RegistrySettings } from '@/components/registry/items-display'
import { RegistrySettingsPanel } from '@/components/registry/settings-panel'
import {
  Plus, LayoutGrid, List, SlidersHorizontal
} from 'lucide-react'
import { formatCurrency, type Contribution } from '@/types'

const DEFAULT_SETTINGS: RegistrySettings = {
  show_amounts: true,
  progress_display: 'percentage',
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
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape' && settingsOpen) setSettingsOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [settingsOpen])

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

  useEffect(() => {
    let cancelled = false

    async function loadRegistry() {
      const userId = await guardEvent(id)
      if (cancelled) return

      if (!userId) {
        return
      }

      const [{ data: poolData }, { data: contribData }, { data: eventData }] = await Promise.all([
        supabase.from('registry_pools').select('*').eq('event_id', id).order('display_order').order('created_at'),
        supabase.from('contributions').select('*').eq('event_id', id).eq('status', 'completed'),
        supabase.from('events').select('content').eq('id', id).single(),
      ])
      if (cancelled) return

      setItems((poolData ?? []) as RegistryItem[])
      setContributions(contribData ?? [])
      if (eventData?.content) {
        const s = (eventData.content as Record<string, unknown>)?.registry_settings as Partial<RegistrySettings> | undefined
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...s })
      }
    }

    void loadRegistry()

    return () => {
      cancelled = true
    }
  }, [id, reloadKey, supabase])

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
  const grouped: Record<string, RegistryItem[]> = {}
  items.forEach(item => {
    const g = item.group_name ?? '__ungrouped__'
    if (!grouped[g]) grouped[g] = []
    grouped[g].push(item)
  })

  function toggleGroup(g: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
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
    setReloadKey(key => key + 1)
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
    setReloadKey(key => key + 1)
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
    setEditingId(null); setEditSaving(false)
    setReloadKey(key => key + 1)
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
                background: settingsOpen ? 'rgba(44,43,38,0.06)' : 'white',
              }}
              title="Display settings"
            >
              <SlidersHorizontal size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl">

            <AddGroupForm
              show={showAddGroup}
              newGroupName={newGroupName}
              addingGroupSaving={addingGroupSaving}
              onSubmit={addGroup}
              onClose={() => setShowAddGroup(false)}
              onGroupNameChange={setNewGroupName}
            />

            <AddItemForm
              show={showAddForm}
              addingGroup={addingGroup}
              viewMode={viewMode}
              groups={groups}
              newName={newName}
              newDesc={newDesc}
              newAmount={newAmount}
              newGroup={newGroup}
              newImage={newImage}
              addingSaving={addingSaving}
              eventId={id}
              supabase={supabase}
              onSubmit={addItem}
              onClose={() => { setShowAddForm(false); setAddingGroup(null) }}
              onNameChange={setNewName}
              onDescChange={setNewDesc}
              onAmountChange={setNewAmount}
              onGroupChange={setNewGroup}
              onImageChange={setNewImage}
            />

            {items.length === 0 && !showAddForm && !showAddGroup && (
              <RegistryEmptyState
                onAddGroup={() => { setShowAddGroup(true); setShowAddForm(false) }}
                onAddItem={() => openAddItem()}
              />
            )}

            <RegistryItemsDisplay
              grouped={grouped}
              collapsedGroups={collapsedGroups}
              viewMode={viewMode}
              groups={groups}
              settings={settings}
              contributions={contributions}
              editingId={editingId}
              editName={editName}
              editDesc={editDesc}
              editAmount={editAmount}
              editImage={editImage}
              editGroup={editGroup}
              editSaving={editSaving}
              eventId={id}
              supabase={supabase}
              onToggleGroup={toggleGroup}
              onOpenAddItem={openAddItem}
              onStartEdit={startEdit}
              onDeleteItem={deleteItem}
              onSaveEdit={saveEdit}
              onCancelEdit={() => setEditingId(null)}
              onEditNameChange={setEditName}
              onEditDescChange={setEditDesc}
              onEditAmountChange={setEditAmount}
              onEditImageChange={setEditImage}
              onEditGroupChange={setEditGroup}
              progressLabel={progressLabel}
              raisedFor={raisedFor}
            />
          </div>
        </div>
      </div>

      <RegistrySettingsPanel
        items={items}
        grouped={grouped}
        contributions={contributions}
        settings={settings}
        settingsOpen={settingsOpen}
        onToggleOpen={() => setSettingsOpen(open => !open)}
        onClose={() => setSettingsOpen(false)}
        onSaveSettings={saveSettings}
      />
    </div>
  )
}
