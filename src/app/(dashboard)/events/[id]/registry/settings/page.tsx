'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className="w-10 h-6 rounded-full transition-colors relative shrink-0 mt-0.5 cursor-pointer"
      style={{ background: on ? '#2C2B26' : '#E8E3D9' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(17px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

export default function RegistrySettingsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [settings, setSettings] = useState<RegistrySettings>(DEFAULT_SETTINGS)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('content').eq('id', id).single()
    if (data?.content) {
      const s = (data.content as Record<string, unknown>)?.registry_settings as Partial<RegistrySettings> | undefined
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s })
    }
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  function save(updated: RegistrySettings) {
    setSettings(updated)
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { data: ev } = await supabase.from('events').select('content').eq('id', id).single()
      const content = (ev?.content as Record<string, unknown>) ?? {}
      await supabase.from('events').update({
        content: { ...content, registry_settings: updated },
      } as Record<string, unknown>).eq('id', id)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    }, 800)
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>
            Registry settings
          </h1>
          <p className="text-sm" style={{ color: '#8B8670' }}>Configure how your registry appears to guests</p>
        </div>
        <span
          className="text-xs transition-all"
          style={{
            color: saveState === 'saving' ? '#B5A98A' : saveState === 'saved' ? '#4CAF50' : 'transparent',
          }}
        >
          {saveState === 'saving' ? 'Saving…' : 'Saved'}
        </span>
      </div>

      <div
        className="rounded-2xl border divide-y"
        style={{ background: 'white', borderColor: '#E8E3D9' }}
      >
        {/* Show amounts */}
        <div className="flex items-start justify-between gap-4 p-6">
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: '#2C2B26' }}>Show amounts to guests</p>
            <p className="text-xs" style={{ color: '#8B8670' }}>Display dollar values on your registry page</p>
          </div>
          <Toggle on={settings.show_amounts} onChange={v => save({ ...settings, show_amounts: v })} />
        </div>

        {/* Progress display */}
        <div className="p-6">
          <p className="text-sm font-medium mb-4" style={{ color: '#2C2B26' }}>Progress display</p>
          <div className="flex flex-col gap-2">
            {([
              { val: 'percentage', label: 'Percentage', sub: 'e.g. 45%' },
              { val: 'dollar', label: 'Dollar amount raised', sub: 'e.g. $450 raised' },
              { val: 'remaining', label: 'Remaining balance', sub: 'e.g. $550 remaining' },
              { val: 'current_goal', label: 'Current / Goal', sub: 'e.g. $450 / $1,000' },
            ] as const).map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => save({ ...settings, progress_display: val })}
                className="flex items-start gap-3 p-4 rounded-xl border text-left transition-all"
                style={{
                  borderColor: settings.progress_display === val ? '#2C2B26' : '#E8E3D9',
                  background: settings.progress_display === val ? '#F5F0E8' : '#FAFAF7',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  style={{ borderColor: settings.progress_display === val ? '#2C2B26' : '#D4CCBC' }}
                >
                  {settings.progress_display === val && (
                    <div className="w-2 h-2 rounded-full" style={{ background: '#2C2B26' }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>{label}</p>
                  <p className="text-xs" style={{ color: '#8B8670' }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payout details */}
        <div className="p-6">
          <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>Payout details</p>
          <p className="text-xs mb-3" style={{ color: '#8B8670' }}>
            How you&apos;d like to receive funds — bank details, PayID, etc. Visible only to you.
          </p>
          <textarea
            className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none"
            style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26', minHeight: 100 }}
            placeholder="BSB: 000-000, Account: 00000000&#10;or PayID: you@email.com"
            value={settings.payout_details}
            onChange={e => save({ ...settings, payout_details: e.target.value })}
          />
        </div>

        {/* Currency */}
        <div className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium mb-0.5" style={{ color: '#2C2B26' }}>Currency</p>
            <p className="text-xs" style={{ color: '#8B8670' }}>All amounts are displayed in this currency</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: '#FAFAF7' }}
          >
            AUD — Australian Dollar
          </div>
        </div>
      </div>
    </div>
  )
}
