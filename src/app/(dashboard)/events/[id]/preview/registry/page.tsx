'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type RegistryPool } from '@/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface FundProgress {
  [poolId: string]: number
}

// ── Fund Card ─────────────────────────────────────────────────────────────────
function FundCard({
  fund,
  raised,
  pct,
  primaryColor,
  onContributeClick,
}: {
  fund: RegistryPool
  raised: number
  pct: number | null
  primaryColor: string
  onContributeClick: () => void
}) {
  return (
    <div
      className="text-left w-full rounded-2xl p-5 border"
      style={{ background: 'white', borderColor: `${primaryColor}18` }}
    >
      {fund.image_url && (
        <div
          className="w-full aspect-[16/9] rounded-xl bg-cover bg-center mb-4"
          style={{ backgroundImage: `url(${fund.image_url})` }}
        />
      )}
      <p className="text-xs font-medium mb-2.5 opacity-50" style={{ color: primaryColor }}>
        {fund.group_name ?? 'Gift fund'}
      </p>
      <p className="font-semibold text-base mb-1 leading-snug" style={{ color: primaryColor, letterSpacing: '-0.01em' }}>
        {fund.title}
      </p>
      {fund.description && (
        <p className="text-xs mb-3 opacity-55 leading-relaxed line-clamp-2" style={{ color: primaryColor }}>
          {fund.description}
        </p>
      )}
      {fund.target_amount && pct !== null ? (
        <div className="mt-3 mb-4">
          <div className="h-1 rounded-full overflow-hidden mb-1.5" style={{ background: `${primaryColor}12` }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: primaryColor }} />
          </div>
          <p className="text-xs opacity-35" style={{ color: primaryColor }}>
            {pct}% funded · ${(raised / 100).toFixed(0)} raised
            {fund.target_amount ? ` of $${(fund.target_amount / 100).toFixed(0)}` : ''}
          </p>
        </div>
      ) : null}
      <button
        onClick={onContributeClick}
        className="mt-3 w-full py-2.5 rounded-full text-sm font-medium border transition-opacity hover:opacity-70"
        style={{ borderColor: primaryColor, color: primaryColor }}
      >
        Contribute
      </button>
    </div>
  )
}

// ── Preview toast ─────────────────────────────────────────────────────────────
function PreviewToast({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [visible, onClose])

  if (!visible) return null
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg z-50"
      style={{ background: '#2C2B26', color: '#FAFAF7' }}
    >
      Payments are disabled in preview mode
    </div>
  )
}

// ── Main registry preview page ────────────────────────────────────────────────
export default function PreviewRegistryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [primaryColor, setPrimaryColor] = useState('#2C2B26')
  const [bgColor, setBgColor] = useState('#F5F0E8')
  const [font, setFont] = useState('Inter')
  const [eventTitle, setEventTitle] = useState('')
  const [funds, setFunds] = useState<RegistryPool[]>([])
  const [progress, setProgress] = useState<FundProgress>({})
  const [loading, setLoading] = useState(true)
  const [toastVisible, setToastVisible] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: ev } = await supabase
        .from('events')
        .select('id, title, content, primary_color, accent_color')
        .eq('id', id)
        .single()
      if (!ev) { setLoading(false); return }
      setEventTitle(ev.title ?? '')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedPalette = (ev.content as any)?._palette
      setPrimaryColor(savedPalette?.primary ?? ev.primary_color ?? '#2C2B26')
      setBgColor(savedPalette?.bg ?? ev.accent_color ?? '#F5F0E8')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedFont = (ev.content as any)?._font
      setFont(savedFont ?? 'Inter')

      const [{ data: poolData }, { data: contribData }] = await Promise.all([
        supabase.from('registry_pools').select('*').eq('event_id', id).order('display_order').order('created_at'),
        supabase.from('contributions').select('pool_id, amount, status').eq('event_id', id).eq('status', 'succeeded'),
      ])
      setFunds(poolData ?? [])

      const prog: FundProgress = {}
      for (const c of contribData ?? []) {
        if (c.pool_id) prog[c.pool_id] = (prog[c.pool_id] ?? 0) + c.amount
      }
      setProgress(prog)
      setLoading(false)
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleContributeClick() {
    setToastVisible(true)
  }

  // Group funds by group_name; ungrouped first
  const grouped: Record<string, RegistryPool[]> = {}
  for (const fund of funds) {
    const key = fund.group_name ?? '__ungrouped__'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(fund)
  }
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === '__ungrouped__') return -1
    if (b === '__ungrouped__') return 1
    return a.localeCompare(b)
  })

  return (
    <div className="min-h-screen" style={{ background: bgColor, fontFamily: `'${font}', serif`, color: primaryColor }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap');`}</style>

      {/* Preview banner */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-xs"
        style={{ background: '#2C2B26', color: '#FAFAF7' }}
      >
        <span>Preview mode — this is how your guests will see it</span>
        <a href={`/events/${id}/registry`} className="underline opacity-70 hover:opacity-100">← Back to editor</a>
      </div>

      {/* Nav */}
      <nav
        className="px-6 py-3.5 border-b flex items-center gap-3 sticky top-9 z-10"
        style={{ borderColor: `${primaryColor}12`, background: bgColor }}
      >
        <Link
          href={`/events/${id}/preview`}
          className="flex items-center gap-1.5 text-sm opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: primaryColor }}
        >
          <ArrowLeft size={14} /> Back
        </Link>
        <span className="text-sm font-medium opacity-70" style={{ color: primaryColor }}>Registry</span>
      </nav>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }} />
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="px-4 py-10 md:px-8 md:py-16 text-center border-b" style={{ borderColor: `${primaryColor}12` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-35" style={{ color: primaryColor }}>Registry</p>
            <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ color: primaryColor, letterSpacing: '-0.03em' }}>
              {eventTitle}
            </h1>
            <p className="text-sm opacity-50" style={{ color: primaryColor }}>
              Choose a gift or contribute to any of our funds below
            </p>
          </div>

          {/* Grid */}
          <div className="px-4 md:px-12 py-8 md:py-10 max-w-6xl mx-auto">
            {/* "Give a general gift" banner */}
            <button
              onClick={handleContributeClick}
              className="w-full mb-10 flex items-center justify-between px-8 py-6 rounded-2xl transition-all hover:shadow-sm"
              style={{ background: 'white', border: `1px solid ${primaryColor}15` }}
            >
              <div>
                <p className="font-semibold text-base mb-0.5" style={{ color: primaryColor }}>Give a general gift</p>
                <p className="text-sm opacity-50" style={{ color: primaryColor }}>Let the couple decide where your gift goes.</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ background: `${primaryColor}10`, color: primaryColor }}>→</div>
            </button>

            {funds.length === 0 ? (
              <p className="text-center opacity-40 text-sm py-8" style={{ color: primaryColor }}>No registry funds added yet.</p>
            ) : (
              sortedGroups.map(([groupName, groupFunds]) => (
                <div key={groupName} className="mb-12">
                  {groupName !== '__ungrouped__' && (
                    <h2 className="text-xl font-semibold mb-6" style={{ color: primaryColor, letterSpacing: '-0.02em' }}>
                      {groupName}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {groupFunds.map(fund => {
                      const raised = progress[fund.id] ?? 0
                      const pct = fund.target_amount ? Math.min(Math.round((raised / fund.target_amount) * 100), 100) : null
                      return (
                        <FundCard
                          key={fund.id}
                          fund={fund}
                          raised={raised}
                          pct={pct}
                          primaryColor={primaryColor}
                          onContributeClick={handleContributeClick}
                        />
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <PreviewToast visible={toastVisible} onClose={() => setToastVisible(false)} />
    </div>
  )
}
