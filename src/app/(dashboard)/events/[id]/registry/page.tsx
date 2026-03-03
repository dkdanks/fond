'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, type RegistryPool, type Contribution } from '@/types'
import { ArrowLeft, Plus, Trash2, ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function RegistryPage() {
  const { id } = useParams<{ id: string }>()
  const [funds, setFunds] = useState<RegistryPool[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [showForm, setShowForm] = useState(false)

  // New fund form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  async function load() {
    const [{ data: poolData }, { data: contribData }] = await Promise.all([
      supabase.from('registry_pools').select('*').eq('event_id', id).order('created_at'),
      supabase.from('contributions').select('*').eq('event_id', id).order('created_at', { ascending: false }),
    ])
    setFunds(poolData ?? [])
    setContributions(contribData ?? [])
  }

  useEffect(() => { load() }, [])

  async function addFund(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('registry_pools').insert({
      event_id: id,
      title,
      description: description || null,
      image_url: imageUrl || null,
      target_amount: targetAmount ? Math.round(parseFloat(targetAmount) * 100) : null,
    })
    setTitle(''); setDescription(''); setImageUrl(''); setTargetAmount('')
    setShowForm(false); setSaving(false)
    load()
  }

  async function deleteFund(fundId: string) {
    await supabase.from('registry_pools').delete().eq('id', fundId)
    load()
  }

  const totalRaised = contributions.reduce((sum, c) => sum + c.amount, 0)
  const totalFees = contributions.reduce((sum, c) => sum + c.fee_amount, 0)

  function raisedForFund(fundId: string) {
    return contributions.filter((c) => c.pool_id === fundId).reduce((sum, c) => sum + c.amount, 0)
  }

  function fundTitle(poolId: string | null) {
    if (!poolId) return 'Anything'
    return funds.find((f) => f.id === poolId)?.title ?? 'Unknown fund'
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: '#1C1C1C' }}>Registry</h1>
        <Button size="sm" onClick={() => setShowForm((o) => !o)}>
          <Plus size={14} /> Add fund
        </Button>
      </div>

      {/* Add fund form */}
      {showForm && (
        <form
          onSubmit={addFund}
          className="rounded-2xl border p-5 mb-6"
          style={{ background: 'white', borderColor: '#E5E5E4' }}
        >
          <p className="text-sm font-medium mb-4" style={{ color: '#1C1C1C' }}>New fund</p>
          <div className="flex flex-col gap-4 mb-4">
            <Input
              label="Name"
              placeholder="e.g. Honeymoon, Fit out the house"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Description (optional)</label>
              <textarea
                className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                style={{ borderColor: '#E5E5E4', minHeight: 72 }}
                placeholder="Tell guests what this fund is for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Input
              label="Photo URL (optional)"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              type="url"
            />
            <Input
              label="Target amount (optional)"
              placeholder="e.g. 2000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              type="number"
              min="1"
              step="0.01"
            />
          </div>

          {/* Photo preview */}
          {imageUrl && (
            <div
              className="w-full h-32 rounded-xl mb-4 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})`, background: imageUrl ? undefined : '#F4F4F3' }}
            />
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Add fund'}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Funds */}
      {funds.length === 0 && !showForm ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center mb-6"
          style={{ borderColor: '#E5E5E4' }}
        >
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            No funds yet. Add your first gift fund above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-8">
          {funds.map((fund) => {
            const raised = raisedForFund(fund.id)
            const progress = fund.target_amount ? Math.min((raised / fund.target_amount) * 100, 100) : null

            return (
              <div
                key={fund.id}
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'white', borderColor: '#E5E5E4' }}
              >
                {fund.image_url ? (
                  <div
                    className="w-full h-36 bg-cover bg-center"
                    style={{ backgroundImage: `url(${fund.image_url})` }}
                  />
                ) : (
                  <div
                    className="w-full h-20 flex items-center justify-center"
                    style={{ background: '#F4F4F3' }}
                  >
                    <ImageIcon size={20} style={{ color: '#D1D5DB' }} />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-medium" style={{ color: '#1C1C1C' }}>{fund.title}</h3>
                    <button
                      onClick={() => deleteFund(fund.id)}
                      className="text-[#9CA3AF] hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {fund.description && (
                    <p className="text-xs mb-3" style={{ color: '#6B7280' }}>{fund.description}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
                      {formatCurrency(raised)} raised
                    </span>
                    {fund.target_amount && (
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>
                        of {formatCurrency(fund.target_amount)} goal
                      </span>
                    )}
                  </div>
                  {progress !== null && (
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#F4F4F3' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: '#C9A96E' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Overall stats */}
      {contributions.length > 0 && (
        <div
          className="rounded-2xl border p-5 mb-6"
          style={{ background: 'white', borderColor: '#E5E5E4' }}
        >
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total received', value: formatCurrency(totalRaised) },
              { label: 'Fond fees (4.5%)', value: formatCurrency(totalFees), muted: true },
              { label: 'You receive', value: formatCurrency(totalRaised - totalFees) },
            ].map(({ label, value, muted }) => (
              <div key={label}>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{label}</p>
                <p className="text-xl font-semibold" style={{ color: muted ? '#6B7280' : '#1C1C1C' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contributions */}
      <h2 className="text-sm font-medium mb-3" style={{ color: '#6B7280' }}>
        {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
      </h2>

      {contributions.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: '#E5E5E4' }}
        >
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            No contributions yet. Share your event page to start receiving gifts.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {contributions.map((c) => (
            <div
              key={c.id}
              className="flex items-start justify-between rounded-2xl border px-5 py-4"
              style={{ background: 'white', borderColor: '#E5E5E4' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: '#1C1C1C' }}>{c.contributor_name}</p>
                {c.message && (
                  <p className="text-xs mt-0.5 italic" style={{ color: '#6B7280' }}>&ldquo;{c.message}&rdquo;</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: '#F4F4F3', color: '#6B7280' }}>
                    {fundTitle(c.pool_id)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: '#1C1C1C' }}>{formatCurrency(c.amount)}</p>
                <Badge variant={c.status === 'completed' ? 'success' : 'warning'} className="mt-1">
                  {c.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
