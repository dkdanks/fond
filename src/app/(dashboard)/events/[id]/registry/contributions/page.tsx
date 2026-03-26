'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { guardEvent } from '@/lib/event-guard'
import { formatCurrency, type Contribution } from '@/types'
import { Mail, Check, X, Search, CheckCircle2, Clock } from 'lucide-react'
import { useToast } from '@/components/app/toast-provider'
import { SkeletonRow } from '@/components/app/skeleton'
import { Pagination } from '@/components/app/pagination'
import { DashboardErrorState, DashboardPage, DashboardPageHeader } from '@/components/dashboard/page-layout'
import { DashboardCardDescription, DashboardCardTitle, DashboardStatCard } from '@/components/dashboard/surface'

const PAGE_SIZE = 25

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'not_thanked' | 'thanked'

interface Pool {
  id: string
  title: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'Tab') return
  const focusable = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.hasAttribute('disabled'))
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus() }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}

// ─── Thank-you Modal ─────────────────────────────────────────────────────────

interface ThankModalProps {
  contributions: Contribution[]
  onClose: () => void
  onSend: (ids: string[]) => void
  primaryColor?: string
}

function ThankModal({ contributions, onClose, onSend, primaryColor = '#2C2B26' }: ThankModalProps) {
  const defaultMsg =
    contributions.length === 1
      ? `Thank you so much for your generous gift of ${formatCurrency(contributions[0].amount)}. Your support means the world to us.`
      : `Thank you so much for your generous gift. Your support means the world to us.`

  const [message, setMessage] = useState(defaultMsg)

  function handleSend() {
    // TODO: wire to a thank-you email API endpoint when available
    onSend(contributions.map(c => c.id))
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{ background: 'white', border: '1px solid #E8E3D9' }}
        onKeyDown={trapFocus}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: '#B5A98A' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#F5F0E8')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={16} />
        </button>

        <h2 className="text-base font-semibold mb-1" style={{ color: '#2C2B26' }}>
          Send thank you email
        </h2>
        <p className="text-xs mb-5" style={{ color: '#8B8670' }}>
          {contributions.length === 1
            ? `To ${contributions[0].contributor_name}`
            : `To ${contributions.length} contributors`}
        </p>

        {/* Recipient list */}
        <div className="mb-4 flex flex-col gap-1.5">
          {contributions.map(c => (
            <div
              key={c.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm"
              style={{ background: '#FAFAF7', border: '1px solid #F0EDE8' }}
            >
              <span style={{ color: '#2C2B26' }}>{c.contributor_name}</span>
              <span className="font-medium" style={{ color: '#8B8670' }}>
                {formatCurrency(c.amount)}
              </span>
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>
            Message
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            autoFocus
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none resize-none"
            style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: primaryColor, color: 'white' }}
          >
            <Check size={14} /> Mark as thanked
          </button>
          <button
            onClick={onClose}
            className="text-sm transition-colors"
            style={{ color: '#8B8670' }}
          >
            Cancel
          </button>
        </div>

        <p className="text-xs mt-3" style={{ color: '#B5A98A' }}>
          Email sending will be available soon. For now this marks them as thanked.
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContributionsPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const toast = useToast()

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  // Stats for the full dataset (not current page)
  const [statsTotalCount, setStatsTotalCount] = useState(0)
  const [statsTotalAmount, setStatsTotalAmount] = useState(0)
  const [statsThankedCount, setStatsThankedCount] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [thankModal, setThankModal] = useState<Contribution[] | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const thankTriggerRef = useRef<HTMLElement | null>(null)

  // Thanked state: use thanked_at from DB if available, else localStorage
  const [thankedIds, setThankedIds] = useState<Set<string>>(new Set())
  const lsKey = `thanked-${id}`

  // Stable load — all params explicit so useCallback deps stay minimal
  const load = useCallback(async (p: number, s: string) => {
    setLoading(true)
    setError(null)
    const userId = await guardEvent(id)
    if (!userId) {
      setError('You do not have access to this event.')
      setLoading(false)
      return
    }
    try {
      let query = supabase
        .from('contributions')
        .select('*', { count: 'exact' })
        .eq('event_id', id)
        .order('created_at', { ascending: false })

      if (s.trim()) {
        query = query.or(
          `contributor_name.ilike.%${s.trim()}%,contributor_email.ilike.%${s.trim()}%`
        )
      }

      query = query.range((p - 1) * PAGE_SIZE, p * PAGE_SIZE - 1)

      const [{ data: contribs, error: err1, count }, { data: poolData, error: err2 }] = await Promise.all([
        query,
        supabase.from('registry_pools').select('id, title').eq('event_id', id),
      ])
      if (err1) throw err1
      if (err2) throw err2

      const rows = (contribs ?? []) as Contribution[]
      setContributions(rows)
      setPools((poolData ?? []) as Pool[])
      setTotal(count ?? 0)

      // Stats: fetch full table for accurate counts/amounts
      const { data: allContribsData } = await supabase
        .from('contributions')
        .select('id, amount')
        .eq('event_id', id)

      const allContribs = allContribsData ?? []
      setStatsTotalCount(allContribs.length)
      setStatsTotalAmount(allContribs.reduce((sum, c) => sum + (c.amount ?? 0), 0))

      // Build thanked set: prefer thanked_at column, fall back to localStorage
      const dbThanked = new Set(
        rows
          .filter(c => (c as Contribution & { thanked_at?: string | null }).thanked_at)
          .map(c => c.id)
      )
      const lsRaw = typeof window !== 'undefined' ? localStorage.getItem(lsKey) : null
      const lsThanked: string[] = lsRaw ? JSON.parse(lsRaw) : []
      const combined = new Set([...dbThanked, ...lsThanked])
      setThankedIds(combined)
      setStatsThankedCount(
        allContribs.filter(c => combined.has(c.id)).length
      )
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Initial load
  useEffect(() => { load(1, '') }, [load])

  // Reload when page changes; clear selection
  const isFirstPageRender = useRef(true)
  useEffect(() => {
    if (isFirstPageRender.current) { isFirstPageRender.current = false; return }
    setSelected(new Set())
    load(page, search)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Reload when filter changes, reset page to 1
  // Note: thanked filter is applied client-side since it depends on local thankedIds state
  const isFirstFilterRender = useRef(true)
  useEffect(() => {
    if (isFirstFilterRender.current) { isFirstFilterRender.current = false; return }
    setPage(1)
    load(1, search)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Debounced search: reset page to 1 and reload
  const isFirstSearchRender = useRef(true)
  useEffect(() => {
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return }
    const timer = setTimeout(() => {
      setPage(1)
      load(1, search)
    }, 300)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    if (!thankModal) {
      thankTriggerRef.current?.focus()
    }
  }, [thankModal])

  // ─── Derived data ────────────────────────────────────────────────────────

  const poolMap = Object.fromEntries(pools.map(p => [p.id, p.title]))

  // contributions IS the current page (filtered by search server-side)
  // Client-side thanked filter applied on top of the page slice
  const filtered = filter === 'all'
    ? contributions
    : contributions.filter(c => {
        const isThanked = thankedIds.has(c.id)
        if (filter === 'thanked') return isThanked
        if (filter === 'not_thanked') return !isThanked
        return true
      })

  // Stats use full-dataset counts from server
  const totalAmount = statsTotalAmount
  const thankedCount = statsThankedCount
  const notThankedCount = statsTotalCount - statsThankedCount

  // ─── Selection helpers ───────────────────────────────────────────────────

  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Thanking ────────────────────────────────────────────────────────────

  function markThanked(ids: string[]) {
    setThankedIds(prev => {
      const next = new Set([...prev, ...ids])
      localStorage.setItem(lsKey, JSON.stringify([...next]))
      return next
    })
    setSelected(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
    toast.success(`Marked ${ids.length} as thanked`)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const stats = [
    { label: 'Total contributions', value: String(statsTotalCount) },
    { label: 'Total amount', value: formatCurrency(totalAmount) },
    { label: 'Thanked', value: String(thankedCount) },
    { label: 'Not yet thanked', value: String(notThankedCount) },
  ]

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Contributions"
        description="Track gift contributions and send thank-you notes."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map(({ label, value }) => (
          <DashboardStatCard
            key={label}
            label={label}
            value={value}
            sub=""
            className="[&>p:last-child]:hidden"
          />
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#F0EDE8' }}>
          {([
            { key: 'all', label: 'All' },
            { key: 'not_thanked', label: 'Not Thanked' },
            { key: 'thanked', label: 'Thanked' },
          ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === key ? 'white' : 'transparent',
                color: filter === key ? '#2C2B26' : '#8B8670',
                boxShadow: filter === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B5A98A' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contributors…"
            className="pl-8 pr-3.5 py-2 text-sm rounded-xl border outline-none"
            style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26', width: 220 }}
          />
        </div>
      </div>

      {/* Table */}
      {error ? (
        <DashboardErrorState message={error} onRetry={() => void load(page, search)} />
      ) : (
      <div className="rounded-2xl border overflow-x-auto" style={{ background: 'white', borderColor: '#E8E3D9' }}>
        {loading ? (
          <table className="w-full text-sm" style={{ minWidth: 680 }}>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F5F0E8' }}>
              <Mail size={20} style={{ color: '#B5A98A' }} />
            </div>
            <DashboardCardTitle className="mb-1">No contributions yet</DashboardCardTitle>
            <DashboardCardDescription style={{ color: '#B5A98A' }}>
              {search ? 'No results match your search.' : 'Contributions will appear here once guests start gifting.'}
            </DashboardCardDescription>
          </div>
        ) : (
          <table className="w-full text-sm" style={{ minWidth: 680 }}>
            <thead>
              <tr className="sticky top-0 z-10" style={{ borderBottom: '1px solid #F0EDE8', background: 'white' }}>
                <th className="w-10 pl-5 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#2C2B26' }}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8B8670' }}>Contributor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8B8670' }}>Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8B8670' }}>Fund</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8B8670' }}>Message</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8B8670' }}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8B8670' }}>Date</th>
                <th className="w-16 pr-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const isThanked = thankedIds.has(c.id)
                const isSelected = selected.has(c.id)
                const isLast = i === filtered.length - 1

                return (
                  <tr
                    key={c.id}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid #F0EDE8',
                      background: isSelected ? '#FAFAF7' : hoveredRow === c.id ? '#FDFCFB' : 'white',
                    }}
                  >
                    <td className="pl-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{ accentColor: '#2C2B26' }}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium" style={{ color: '#2C2B26' }}>{c.contributor_name}</p>
                      {c.contributor_email && (
                        <p className="text-xs mt-0.5" style={{ color: '#B5A98A' }}>{c.contributor_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold" style={{ color: '#2C2B26' }}>
                        {formatCurrency(c.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: '#8B8670' }}>
                        {c.pool_id ? (poolMap[c.pool_id] ?? '—') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      {c.message ? (
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: '#8B8670', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}
                        >
                          {c.message}
                        </p>
                      ) : (
                        <span className="text-xs" style={{ color: '#D4CCBC' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {isThanked ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: '#F0FDF4', color: '#16A34A' }}
                        >
                          <CheckCircle2 size={11} /> Thanked
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: '#FFFBEB', color: '#D97706' }}
                        >
                          <Clock size={11} /> Not thanked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: '#B5A98A' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </td>
                    <td className="pr-4 py-3.5 text-right">
                      {hoveredRow === c.id && !isThanked && (
                        <button
                          onClick={() => {
                            thankTriggerRef.current = document.activeElement as HTMLElement
                            setThankModal([c])
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: '#F5F0E8', color: '#2C2B26' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#EDE8DE')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#F5F0E8')}
                        >
                          <Mail size={11} /> Thank
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      </div>
      )}

      {/* Floating multi-select bar */}
      {selected.size > 0 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-5 py-3.5 rounded-2xl shadow-xl z-40"
          style={{ background: '#2C2B26', color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        >
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <button
            onClick={() => {
              thankTriggerRef.current = document.activeElement as HTMLElement
              const selectedContribs = contributions.filter(c => selected.has(c.id))
              setThankModal(selectedContribs)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'white', color: '#2C2B26' }}
          >
            <Mail size={13} /> Send thank you
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Thank-you modal */}
      {thankModal && (
        <ThankModal
          contributions={thankModal}
          onClose={() => setThankModal(null)}
          onSend={ids => markThanked(ids)}
        />
      )}
    </DashboardPage>
  )
}
