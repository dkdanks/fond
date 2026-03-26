import { cn } from '@/lib/utils'

export function DashboardPage({
  children,
  className,
  width = 'default',
}: {
  children: React.ReactNode
  className?: string
  width?: 'narrow' | 'default' | 'wide' | 'full'
}) {
  const widthClass = width === 'narrow'
    ? 'max-w-3xl'
    : width === 'wide'
      ? 'max-w-7xl'
      : width === 'full'
        ? 'max-w-none'
        : 'max-w-5xl'

  return (
    <div className={cn('px-4 py-6 md:px-8 md:py-8 mx-auto', widthClass, className)}>
      {children}
    </div>
  )
}

export function DashboardPageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-8', className)}>
      <div>
        <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm" style={{ color: '#8B8670' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}

export function DashboardEmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn('rounded-2xl border-2 border-dashed p-12 text-center', className)}
      style={{ borderColor: '#E5E5E4' }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: '#2C2B26' }}>
        {title}
      </p>
      {description && (
        <p className="text-sm" style={{ color: '#8B8670' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function DashboardErrorState({
  message,
  onRetry,
  actionLabel = 'Try again',
  className,
}: {
  message: React.ReactNode
  onRetry?: () => void
  actionLabel?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-24 text-center px-4', className)}>
      <p className="text-sm mb-4" style={{ color: '#8B8670' }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#2C2B26', color: '#FAFAF7' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function DashboardSectionLabel({
  children,
  tone = 'muted',
  className,
}: {
  children: React.ReactNode
  tone?: 'muted' | 'danger'
  className?: string
}) {
  return (
    <p
      className={cn('text-xs font-semibold uppercase tracking-wide mb-4', className)}
      style={{ color: tone === 'danger' ? '#EF4444' : '#B5A98A', opacity: tone === 'danger' ? 0.7 : 1 }}
    >
      {children}
    </p>
  )
}

export function DashboardSaveStatus({
  state,
}: {
  state: 'idle' | 'saving' | 'saved'
}) {
  return (
    <span
      className="text-xs transition-all"
      style={{
        color: state === 'saving' ? '#B5A98A' : state === 'saved' ? '#4CAF50' : 'transparent',
      }}
    >
      {state === 'saving' ? 'Saving…' : 'Saved'}
    </span>
  )
}
