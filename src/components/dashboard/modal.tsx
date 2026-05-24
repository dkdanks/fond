'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

export function DashboardModal({
  open,
  title,
  description,
  onClose,
  children,
  width = 'default',
}: {
  open: boolean
  title: string
  description?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  width?: 'default' | 'wide'
}) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ background: 'rgba(19, 18, 16, 0.46)' }}
      onClick={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`w-full rounded-[28px] border shadow-2xl ${
          width === 'wide' ? 'max-w-5xl' : 'max-w-2xl'
        }`}
        style={{ background: '#FAFAF7', borderColor: '#E8E3D9' }}
      >
        <div
          className="flex items-start justify-between gap-4 border-b px-5 py-5 md:px-6"
          style={{ borderColor: '#E8E3D9' }}
        >
          <div>
            <h2
              className="text-lg font-medium mb-1"
              style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm" style={{ color: '#8B8670' }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
            style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FFFFFF' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 py-5 md:px-6 md:py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
