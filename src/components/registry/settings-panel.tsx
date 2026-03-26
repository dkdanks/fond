'use client'

import { Gift, SlidersHorizontal } from 'lucide-react'
import { formatCurrency, type RegistryPool, type Contribution } from '@/types'
import { RegistryToggle } from '@/components/registry/forms'

interface RegistryItem extends RegistryPool {
  group_name: string | null
  display_order: number | null
}

interface RegistrySettings {
  show_amounts: boolean
  progress_display: 'percentage' | 'dollar' | 'remaining' | 'current_goal'
}

type SettingsPanelProps = {
  items: RegistryItem[]
  grouped: Record<string, RegistryItem[]>
  contributions: Contribution[]
  settings: RegistrySettings
  settingsOpen: boolean
  onToggleOpen: () => void
  onClose: () => void
  onSaveSettings: (settings: RegistrySettings) => void
}

export function RegistrySettingsPanel({
  items,
  grouped,
  contributions,
  settings,
  settingsOpen,
  onToggleOpen,
  onClose,
  onSaveSettings,
}: SettingsPanelProps) {
  const totalRaised = contributions.reduce((sum, contribution) => sum + contribution.amount, 0)

  return (
    <>
      <button
        className="md:hidden fixed top-3 right-3 z-40 w-9 h-9 rounded-xl flex items-center justify-center border transition-colors"
        style={{ background: '#FAFAF7', borderColor: '#E8E3D9', color: '#2C2B26' }}
        onClick={onToggleOpen}
        aria-label="Display settings"
      >
        <SlidersHorizontal size={15} />
      </button>

      {settingsOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={onClose}
        />
      )}

      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl border-t transition-transform duration-300 ease-in-out ${settingsOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ background: 'white', borderColor: '#E8E3D9', maxHeight: '75vh' }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-pointer" onClick={onClose}>
          <div className="w-10 h-1 rounded-full" style={{ background: '#E8E3D9' }} />
        </div>
        <div className="px-4 pt-2 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Display settings</span>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B5A98A' }}>
              <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              {totalRaised > 0 && <span>· {formatCurrency(totalRaised)} raised</span>}
            </div>
          </div>
          <SettingsControls settings={settings} onSaveSettings={onSaveSettings} compact={false} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pb-6 flex flex-col gap-2">
            <SettingsPreviewList items={items} grouped={grouped} contributions={contributions} settings={settings} mobile />
          </div>
        </div>
      </div>

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
        <div className="px-4 pt-4 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Registry</span>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B5A98A' }}>
              <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
              {totalRaised > 0 && <span>· {formatCurrency(totalRaised)} raised</span>}
            </div>
          </div>
          <SettingsControls settings={settings} onSaveSettings={onSaveSettings} compact />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 flex flex-col gap-3">
            <SettingsPreviewList items={items} grouped={grouped} contributions={contributions} settings={settings} mobile={false} />
          </div>
        </div>
      </div>
    </>
  )
}

function SettingsControls({
  settings,
  onSaveSettings,
  compact,
}: {
  settings: RegistrySettings
  onSaveSettings: (settings: RegistrySettings) => void
  compact: boolean
}) {
  return (
    <div className={`mb-${compact ? '3' : '4'} flex flex-col gap-${compact ? '2' : '3'}`}>
      <div className="flex items-center justify-between">
        <span className={compact ? 'text-xs' : 'text-sm'} style={{ color: '#8B8670' }}>Show amounts to guests</span>
        <RegistryToggle on={settings.show_amounts} onChange={value => onSaveSettings({ ...settings, show_amounts: value })} />
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
              onClick={() => onSaveSettings({ ...settings, progress_display: value })}
              className={`flex-1 ${compact ? 'py-2 text-xs' : 'py-2.5 text-sm'} font-medium text-center transition-colors`}
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
  )
}

function SettingsPreviewList({
  items,
  grouped,
  contributions,
  settings,
  mobile,
}: {
  items: RegistryItem[]
  grouped: Record<string, RegistryItem[]>
  contributions: Contribution[]
  settings: RegistrySettings
  mobile: boolean
}) {
  function raisedFor(itemId: string) {
    return contributions.filter(contribution => contribution.pool_id === itemId).reduce((sum, contribution) => sum + contribution.amount, 0)
  }

  if (items.length === 0) {
    return (
      <div className={mobile ? 'py-8 text-center' : 'py-12 text-center'}>
        <Gift size={mobile ? 18 : 20} className="mx-auto mb-2" style={{ color: '#C8BFA8' }} />
        <p className="text-xs" style={{ color: '#B5A98A' }}>Items you add will appear here</p>
      </div>
    )
  }

  return (
    <>
      {Object.entries(grouped).map(([group, groupItems]) => (
        <div key={group}>
          {group !== '__ungrouped__' && (
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 px-1" style={{ color: '#B5A98A' }}>{group}</p>
          )}
          {groupItems.map(item => {
            const raised = raisedFor(item.id)
            const progress = item.target_amount ? Math.min((raised / item.target_amount) * 100, 100) : 0
            return (
              <div key={item.id} className={`rounded-xl border overflow-hidden ${mobile ? '' : 'mb-2'}`} style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}>
                {!mobile && item.image_url && (
                  <div className="h-24 bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                )}
                <div className="p-3">
                  <p className={`${mobile ? 'text-sm' : 'text-xs'} font-medium mb-0.5`} style={{ color: '#2C2B26' }}>{item.title}</p>
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
    </>
  )
}
