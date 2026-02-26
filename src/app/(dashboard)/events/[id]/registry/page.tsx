import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/types'
import { ArrowLeft } from 'lucide-react'

export default async function RegistryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: event } = await supabase.from('events').select('*').eq('id', id).eq('user_id', user.id).single()
  if (!event) notFound()

  const { data: pool } = await supabase.from('registry_pools').select('*').eq('event_id', id).single()

  const { data: contributions } = await supabase
    .from('contributions')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const totalRaised = contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0
  const totalFees = contributions?.reduce((sum, c) => sum + c.fee_amount, 0) ?? 0

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-6" style={{ color: '#1C1C1C' }}>Registry</h1>

      {/* Fund summary */}
      <div
        className="rounded-2xl border p-6 mb-6"
        style={{ background: 'white', borderColor: '#E5E5E4' }}
      >
        <h2 className="font-semibold mb-1" style={{ color: '#1C1C1C' }}>
          {pool?.title ?? 'Gift Fund'}
        </h2>
        {pool?.description && (
          <p className="text-sm mb-4" style={{ color: '#6B7280' }}>{pool.description}</p>
        )}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Total received</p>
            <p className="text-xl font-semibold" style={{ color: '#1C1C1C' }}>{formatCurrency(totalRaised)}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Fond fees (4.5%)</p>
            <p className="text-xl font-semibold" style={{ color: '#6B7280' }}>{formatCurrency(totalFees)}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>You receive</p>
            <p className="text-xl font-semibold" style={{ color: '#1C1C1C' }}>{formatCurrency(totalRaised - totalFees)}</p>
          </div>
        </div>
      </div>

      {/* Contributions list */}
      <h2 className="font-medium text-sm mb-3" style={{ color: '#6B7280' }}>
        {contributions?.length ?? 0} contribution{contributions?.length !== 1 ? 's' : ''}
      </h2>

      {!contributions || contributions.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: '#E5E5E4' }}
        >
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            No contributions yet. Share your event page with guests to start receiving gifts.
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
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
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
