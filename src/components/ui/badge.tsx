import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'muted' | 'gold'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-[#1C1C1C] text-white': variant === 'default',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-amber-100 text-amber-700': variant === 'warning',
          'bg-[#F4F4F3] text-[#6B7280]': variant === 'muted',
          'bg-[#F5EDD9] text-[#8B6914]': variant === 'gold',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
