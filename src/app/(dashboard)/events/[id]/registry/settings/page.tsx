'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardPage, DashboardPageHeader, DashboardSaveStatus } from '@/components/dashboard/page-layout'
import { DashboardCard, DashboardCardDescription, DashboardCardTitle } from '@/components/dashboard/surface'
import { RegistryToggle as Toggle } from '@/components/registry/forms'

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

export default function RegistrySettingsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [settings, setSettings] = useState<RegistrySettings>(DEFAULT_SETTINGS)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      const { data } = await supabase.from('events').select('content').eq('id', id).single()
      if (cancelled || !data?.content) return

      const s = (data.content as Record<string, unknown>)?.registry_settings as Partial<RegistrySettings> | undefined
      if (s) setSettings({ ...DEFAULT_SETTINGS, ...s })
    }

    void loadSettings()

    return () => {
      cancelled = true
    }
  }, [id, supabase])

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
    <DashboardPage width="narrow" className="md:px-8">
      <DashboardPageHeader
        title="Registry settings"
        description="Configure how your registry appears to guests"
        actions={<DashboardSaveStatus state={saveState} />}
      />

      <DashboardCard className="divide-y">
        {/* Show amounts */}
        <div className="flex items-start justify-between gap-4 p-6">
          <div>
            <DashboardCardTitle className="mb-0.5">Show amounts to guests</DashboardCardTitle>
            <DashboardCardDescription>Display dollar values on your registry page</DashboardCardDescription>
          </div>
          <Toggle on={settings.show_amounts} onChange={v => save({ ...settings, show_amounts: v })} />
        </div>

        {/* Progress display */}
        <div className="p-6">
          <DashboardCardTitle className="mb-4">Progress display</DashboardCardTitle>
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
                  <DashboardCardTitle>{label}</DashboardCardTitle>
                  <DashboardCardDescription>{sub}</DashboardCardDescription>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payout details */}
        <div className="p-6">
          <DashboardCardTitle className="mb-1">Payout details</DashboardCardTitle>
          <DashboardCardDescription className="mb-3">
            How you&apos;d like to receive funds — bank details, PayID, etc. Visible only to you.
          </DashboardCardDescription>
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
            <DashboardCardTitle className="mb-0.5">Currency</DashboardCardTitle>
            <DashboardCardDescription>All amounts are displayed in this currency</DashboardCardDescription>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium"
            style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: '#FAFAF7' }}
          >
            AUD — Australian Dollar
          </div>
        </div>
      </DashboardCard>
    </DashboardPage>
  )
}
