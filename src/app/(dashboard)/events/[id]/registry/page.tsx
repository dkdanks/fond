'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { guardEvent } from '@/lib/event-guard'
import { AddGroupForm, AddItemForm, RegistryEmptyState, RegistryToggle } from '@/components/registry/forms'
import { RegistryItemsDisplay, type RegistryItem, type RegistrySettings } from '@/components/registry/items-display'
import { LayoutGrid, List, Plus } from 'lucide-react'
import { formatCurrency, type Contribution } from '@/types'
import { DashboardPage, DashboardPageHeader } from '@/components/dashboard/page-layout'
import { DashboardCard, DashboardCardDescription, DashboardCardTitle, DashboardStatCard } from '@/components/dashboard/surface'

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
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [reloadKey, setReloadKey] = useState(0)

  const [showAddForm, setShowAddForm] = useState(false)
  const [addingGroup, setAddingGroup] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newGroup, setNewGroup] = useState('')
  const [newImage, setNewImage] = useState('')
  const [addingSaving, setAddingSaving] = useState(false)

  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [addingGroupSaving, setAddingGroupSaving] = useState(false)

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
      if (cancelled || !userId) return

      const [{ data: poolData }, { data: contribData }, { data: eventData }] = await Promise.all([
        supabase.from('registry_pools').select('*').eq('event_id', id).order('display_order').order('created_at'),
        supabase.from('contributions').select('*').eq('event_id', id).eq('status', 'completed'),
        supabase.from('events').select('content').eq('id', id).single(),
      ])
      if (cancelled) return

      setItems((poolData ?? []) as RegistryItem[])
      setContributions(contribData ?? [])
      if (eventData?.content) {
        const saved = (eventData.content as Record<string, unknown>)?.registry_settings as Partial<RegistrySettings> | undefined
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved })
      }
    }

    void loadRegistry()

    return () => {
      cancelled = true
    }
  }, [id, reloadKey, supabase])

  function raisedFor(itemId: string) {
    return contributions.filter(c => c.pool_id === itemId).reduce((sum, contribution) => sum + contribution.amount, 0)
  }

  function progressLabel(item: RegistryItem): string | null {
    const raised = raisedFor(item.id)
    if (!item.target_amount) return raised > 0 ? `${formatCurrency(raised)} raised` : null
    const pct = Math.min(Math.round((raised / item.target_amount) * 100), 100)
    switch (settings.progress_display) {
      case 'percentage':
        return `${pct}%`
      case 'dollar':
        return formatCurrency(raised)
      case 'remaining':
        return `${formatCurrency(Math.max(0, item.target_amount - raised))} remaining`
      case 'current_goal':
        return `${formatCurrency(raised)} / ${formatCurrency(item.target_amount)}`
      default:
        return `${pct}%`
    }
  }

  const groups = Array.from(new Set(items.map(item => item.group_name).filter((group): group is string => group !== null)))
  const grouped: Record<string, RegistryItem[]> = {}
  items.forEach(item => {
    const group = item.group_name ?? '__ungrouped__'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(item)
  })

  function toggleGroup(group: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault()
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
    setNewName('')
    setNewDesc('')
    setNewAmount('')
    setNewGroup('')
    setNewImage('')
    setShowAddForm(false)
    setAddingGroup(null)
    setAddingSaving(false)
    setReloadKey(key => key + 1)
  }

  function startCollectionFlow(groupName: string) {
    const trimmed = groupName.trim()
    if (!trimmed) return
    setAddingGroupSaving(true)
    setTimeout(() => {
      setNewGroupName('')
      setShowAddGroup(false)
      setAddingGroup(trimmed)
      setNewGroup(trimmed)
      setShowAddForm(true)
      setAddingGroupSaving(false)
    }, 0)
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
    setEditingId(null)
    setEditSaving(false)
    setReloadKey(key => key + 1)
  }

  async function deleteItem(itemId: string) {
    await supabase.from('registry_pools').delete().eq('id', itemId)
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  function saveSettings(updated: RegistrySettings) {
    setSettings(updated)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { data: eventData } = await supabase.from('events').select('content').eq('id', id).single()
      const content = (eventData?.content as Record<string, unknown>) ?? {}
      await supabase
        .from('events')
        .update({ content: { ...content, registry_settings: updated } } as Record<string, unknown>)
        .eq('id', id)
    }, 800)
  }

  function openAddFund(groupName?: string) {
    setShowAddForm(true)
    setShowAddGroup(false)
    setAddingGroup(groupName ?? null)
    setNewGroup(groupName ?? '')
    setNewName('')
    setNewDesc('')
    setNewAmount('')
    setNewImage('')
    setEditingId(null)
  }

  const totalRaised = contributions.reduce((sum, contribution) => sum + contribution.amount, 0)
  const targetedCount = items.filter(item => item.target_amount !== null).length

  return (
    <DashboardPage width="wide">
      <DashboardPageHeader
        title="Registry"
        description="Create flexible funds guests can contribute to, then organise them into collections if you need to."
        actions={
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}>
              {([
                { key: 'cards', label: 'Cards', icon: LayoutGrid },
                { key: 'list', label: 'List', icon: List },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    background: viewMode === key ? '#2C2B26' : 'transparent',
                    color: viewMode === key ? '#FFFFFF' : '#8B8670',
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowAddGroup(true); setShowAddForm(false) }}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium"
              style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FFFFFF' }}
            >
              <Plus size={13} /> Add collection
            </button>
            <button
              onClick={() => openAddFund()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ background: '#2C2B26', color: '#FFFFFF' }}
            >
              <Plus size={13} /> Add fund
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-6">
        <DashboardStatCard label="Funds" value={String(items.length)} sub="Guests contribute to these" />
        <DashboardStatCard label="Collections" value={String(groups.length)} sub="Optional organisation" />
        <DashboardStatCard label="Raised" value={formatCurrency(totalRaised)} sub="Completed contributions" />
        <DashboardStatCard label="With targets" value={String(targetedCount)} sub="Trackable progress" />
      </div>

      <DashboardCard className="p-5 mb-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <DashboardCardTitle className="mb-1">How guests will see this</DashboardCardTitle>
            <DashboardCardDescription className="text-sm leading-6">
              Most modern registries blend specific funds with broader cash goals. Keep the setup simple here: each fund has a clear title, optional note, target if you want one, and an optional collection to keep related funds together.
            </DashboardCardDescription>
          </div>
          <div className="flex flex-col gap-4 lg:min-w-[360px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Show amounts to guests</p>
                <p className="text-xs" style={{ color: '#8B8670' }}>Hide totals if you want a softer presentation.</p>
              </div>
              <RegistryToggle on={settings.show_amounts} onChange={value => saveSettings({ ...settings, show_amounts: value })} />
            </div>
            {settings.show_amounts && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Progress style</p>
                <div className="rounded-xl border overflow-hidden flex" style={{ borderColor: '#E8E3D9' }}>
                  {([
                    { label: '$ remaining', value: 'remaining' },
                    { label: '% funded', value: 'percentage' },
                    { label: 'Raised / target', value: 'current_goal' },
                  ] as const).map(({ label, value }, idx, arr) => (
                    <button
                      key={value}
                      onClick={() => saveSettings({ ...settings, progress_display: value })}
                      className="flex-1 py-2.5 text-xs font-medium transition-colors"
                      style={{
                        background: settings.progress_display === value ? '#2C2B26' : '#FFFFFF',
                        color: settings.progress_display === value ? '#FFFFFF' : '#8B8670',
                        borderRight: idx < arr.length - 1 ? '1px solid #E8E3D9' : undefined,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardCard>

      <div className="flex items-center justify-between gap-3 mb-5 md:hidden">
        <div className="flex items-center gap-1 rounded-xl border p-1" style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}>
          {([
            { key: 'cards', icon: LayoutGrid },
            { key: 'list', icon: List },
          ] as const).map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: viewMode === key ? '#2C2B26' : 'transparent',
                color: viewMode === key ? '#FFFFFF' : '#8B8670',
              }}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAddGroup(true); setShowAddForm(false) }}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FFFFFF' }}
          >
            <Plus size={13} /> Collection
          </button>
          <button
            onClick={() => openAddFund()}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold"
            style={{ background: '#2C2B26', color: '#FFFFFF' }}
          >
            <Plus size={13} /> Fund
          </button>
        </div>
      </div>

      <AddGroupForm
        show={showAddGroup}
        newGroupName={newGroupName}
        addingGroupSaving={addingGroupSaving}
        onSubmit={startCollectionFlow}
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

      {items.length === 0 && !showAddForm && !showAddGroup ? (
        <RegistryEmptyState
          onAddGroup={() => { setShowAddGroup(true); setShowAddForm(false) }}
          onAddItem={() => openAddFund()}
        />
      ) : (
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
          onOpenAddItem={openAddFund}
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
      )}
    </DashboardPage>
  )
}
