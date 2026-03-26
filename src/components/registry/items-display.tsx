'use client'

import { Check, ChevronDown, ChevronRight, Gift, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { ImageUploadInput } from '@/components/dashboard/image-upload-input'
import { RegistryLabel } from '@/components/registry/forms'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, type RegistryPool, type Contribution } from '@/types'

export interface RegistryItem extends RegistryPool {
  group_name: string | null
  display_order: number | null
}

export interface RegistrySettings {
  show_amounts: boolean
  progress_display: 'percentage' | 'dollar' | 'remaining' | 'current_goal'
}

type ViewMode = 'cards' | 'list'

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

type RegistryItemsDisplayProps = {
  grouped: Record<string, RegistryItem[]>
  collapsedGroups: Set<string>
  viewMode: ViewMode
  groups: string[]
  settings: RegistrySettings
  contributions: Contribution[]
  editingId: string | null
  editName: string
  editDesc: string
  editAmount: string
  editImage: string
  editGroup: string
  editSaving: boolean
  eventId: string
  supabase: ReturnType<typeof createClient>
  onToggleGroup: (group: string) => void
  onOpenAddItem: (groupName?: string) => void
  onStartEdit: (item: RegistryItem) => void
  onDeleteItem: (itemId: string) => void
  onSaveEdit: (itemId: string) => void
  onCancelEdit: () => void
  onEditNameChange: (value: string) => void
  onEditDescChange: (value: string) => void
  onEditAmountChange: (value: string) => void
  onEditImageChange: (value: string) => void
  onEditGroupChange: (value: string) => void
  progressLabel: (item: RegistryItem) => string | null
  raisedFor: (itemId: string) => number
}

export function RegistryItemsDisplay({
  grouped,
  collapsedGroups,
  viewMode,
  groups,
  settings,
  editingId,
  editName,
  editDesc,
  editAmount,
  editImage,
  editGroup,
  editSaving,
  eventId,
  supabase,
  onToggleGroup,
  onOpenAddItem,
  onStartEdit,
  onDeleteItem,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onEditDescChange,
  onEditAmountChange,
  onEditImageChange,
  onEditGroupChange,
  progressLabel,
  raisedFor,
}: RegistryItemsDisplayProps) {
  return (
    <>
      {Object.entries(grouped).map(([group, groupItems]) => (
        <div key={group} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {group !== '__ungrouped__' ? (
              <>
                <button onClick={() => onToggleGroup(group)} className="flex items-center gap-2 text-left">
                  {collapsedGroups.has(group) ? <ChevronRight size={16} style={{ color: '#8B8670' }} /> : <ChevronDown size={16} style={{ color: '#8B8670' }} />}
                  <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>{group}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F0EDE8', color: '#8B8670' }}>{groupItems.length} item{groupItems.length !== 1 ? 's' : ''}</span>
                </button>
                <button
                  onClick={() => onOpenAddItem(group)}
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

          {!collapsedGroups.has(group) && (
            viewMode === 'cards' ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {groupItems.map(item => {
                  const raised = raisedFor(item.id)
                  const progress = item.target_amount ? Math.min((raised / item.target_amount) * 100, 100) : 0
                  const isEditing = editingId === item.id
                  return (
                    <div key={item.id} className="rounded-2xl border overflow-hidden group" style={{ borderColor: '#E8E3D9', background: 'white' }}>
                      {item.image_url ? (
                        <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                      ) : (
                        <div className="h-36 flex items-center justify-center" style={{ background: '#F0EDE8' }}>
                          <Gift size={20} style={{ color: '#C8BFA8' }} />
                        </div>
                      )}
                      {isEditing ? (
                        <div className="p-3 flex flex-col gap-2 border-t" style={{ borderColor: '#F0EDE8', background: '#FAFAF7' }}>
                          <div><RegistryLabel>Name</RegistryLabel><input className={inputCls} style={inputStyle} value={editName} onChange={event => onEditNameChange(event.target.value)} /></div>
                          <div><RegistryLabel>Description</RegistryLabel><input className={inputCls} style={inputStyle} placeholder="Optional" value={editDesc} onChange={event => onEditDescChange(event.target.value)} /></div>
                          <div><RegistryLabel>Amount ($)</RegistryLabel><input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} placeholder="Leave blank for open-ended" value={editAmount} onChange={event => onEditAmountChange(event.target.value)} /></div>
                          <div><RegistryLabel>Group</RegistryLabel><input list="edit-groups-list" className={inputCls} style={inputStyle} placeholder="Group name" value={editGroup} onChange={event => onEditGroupChange(event.target.value)} /><datalist id="edit-groups-list">{groups.map(groupName => <option key={groupName} value={groupName} />)}</datalist></div>
                          <div><RegistryLabel>Photo</RegistryLabel><ImageUploadInput value={editImage} onChange={onEditImageChange} eventId={eventId} supabase={supabase} showPreview /></div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => onSaveEdit(item.id)} disabled={editSaving} className="flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1" style={{ background: '#2C2B26', color: 'white' }}>
                              {editSaving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} {editSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={onCancelEdit} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: '#8B8670' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm leading-snug" style={{ color: '#2C2B26' }}>{item.title}</p>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => onStartEdit(item)} className="p-1 rounded-md hover:bg-[#F0EDE8] transition-colors" style={{ color: '#B5A98A' }}><Pencil size={12} /></button>
                              <button onClick={() => onDeleteItem(item.id)} className="p-1 rounded-md hover:bg-red-50 transition-colors" style={{ color: '#D4CCBC' }} onMouseEnter={event => { event.currentTarget.style.color = '#EF4444' }} onMouseLeave={event => { event.currentTarget.style.color = '#D4CCBC' }}><Trash2 size={12} /></button>
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
                          onMouseEnter={event => { if (!isEditing) event.currentTarget.style.background = 'rgba(44,43,38,0.02)' }}
                          onMouseLeave={event => { event.currentTarget.style.background = 'white' }}
                        >
                          {isEditing ? (
                            <td colSpan={6} className="px-4 py-3">
                              <div className="grid grid-cols-5 gap-2">
                                <div><input className={inputCls} style={inputStyle} value={editName} onChange={event => onEditNameChange(event.target.value)} placeholder="Name" /></div>
                                <div><input className={inputCls} style={inputStyle} value={editDesc} onChange={event => onEditDescChange(event.target.value)} placeholder="Description" /></div>
                                <div><input type="number" min="1" step="0.01" className={inputCls} style={inputStyle} value={editAmount} onChange={event => onEditAmountChange(event.target.value)} placeholder="Amount" /></div>
                                <div><input list="edit-groups-list2" className={inputCls} style={inputStyle} value={editGroup} onChange={event => onEditGroupChange(event.target.value)} placeholder="Group" /><datalist id="edit-groups-list2">{groups.map(groupName => <option key={groupName} value={groupName} />)}</datalist></div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => onSaveEdit(item.id)} disabled={editSaving} className="flex-1 py-2 rounded-xl text-xs font-semibold" style={{ background: '#2C2B26', color: 'white' }}>
                                    {editSaving ? '…' : 'Save'}
                                  </button>
                                  <button onClick={onCancelEdit} className="px-2 py-2 rounded-xl text-xs" style={{ color: '#8B8670' }}>✕</button>
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
                                  <button onClick={() => onStartEdit(item)} className="p-1.5 rounded-lg hover:bg-[#F0EDE8] transition-colors" style={{ color: '#B5A98A' }}><Pencil size={13} /></button>
                                  <button onClick={() => onDeleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#D4CCBC' }} onMouseEnter={event => { event.currentTarget.style.color = '#EF4444' }} onMouseLeave={event => { event.currentTarget.style.color = '#D4CCBC' }}><Trash2 size={13} /></button>
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
    </>
  )
}
