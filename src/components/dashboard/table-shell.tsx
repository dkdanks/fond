import { cn } from '@/lib/utils'

export function DashboardTableFrame({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('rounded-2xl border overflow-hidden', className)}
      style={{ background: 'white', borderColor: '#E8E3D9' }}
    >
      {children}
    </div>
  )
}

export function DashboardTableScroll({
  children,
  className,
  maxHeight,
}: {
  children: React.ReactNode
  className?: string
  maxHeight?: string
}) {
  return (
    <div
      className={cn('overflow-auto', className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {children}
    </div>
  )
}
