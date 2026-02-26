import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          {
            'bg-[#1C1C1C] text-white hover:bg-[#333] rounded-[10px]': variant === 'primary',
            'bg-white text-[#1C1C1C] border border-[#E5E5E4] hover:bg-[#F4F4F3] rounded-[10px]': variant === 'secondary',
            'text-[#6B7280] hover:text-[#1C1C1C] hover:bg-[#F4F4F3] rounded-[10px]': variant === 'ghost',
            'bg-[#C9A96E] text-white hover:bg-[#b8935a] rounded-[10px]': variant === 'gold',
          },
          {
            'text-sm px-3 py-1.5 gap-1.5': size === 'sm',
            'text-sm px-4 py-2.5 gap-2': size === 'md',
            'text-base px-6 py-3.5 gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
