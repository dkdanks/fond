import { cn } from '@/lib/utils'

export function DashboardCard({
  children,
  className,
  tone = 'default',
  style,
}: {
  children: React.ReactNode
  className?: string
  tone?: 'default' | 'muted' | 'highlight'
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cn('rounded-2xl border', className)}
      style={{
        background: tone === 'highlight' ? '#F5F0E8' : tone === 'muted' ? '#FAFAF7' : 'white',
        borderColor: tone === 'highlight' ? '#D4CCBC' : '#E8E3D9',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function DashboardStatCard({
  label,
  value,
  sub,
  highlight = false,
  className,
}: {
  label: string
  value: React.ReactNode
  sub: React.ReactNode
  highlight?: boolean
  className?: string
}) {
  return (
    <DashboardCard tone={highlight ? 'highlight' : 'default'} className={cn('p-3 md:p-5', className)}>
      <p className="text-xs mb-1.5 md:mb-2 font-medium" style={{ color: '#B5A98A' }}>
        {label}
      </p>
      <p className="text-xl md:text-2xl font-semibold mb-0.5 md:mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: '#8B8670' }}>
        {sub}
      </p>
    </DashboardCard>
  )
}

export function DashboardCardTitle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <p className={cn('text-sm font-medium', className)} style={{ color: '#2C2B26', ...style }}>
      {children}
    </p>
  )
}

export function DashboardCardDescription({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <p className={cn('text-xs', className)} style={{ color: '#8B8670', ...style }}>
      {children}
    </p>
  )
}
