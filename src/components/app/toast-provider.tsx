'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X, AlertCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  exiting?: boolean
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

const ICONS: Record<ToastType, React.ElementType> = {
  success: Check,
  error: AlertCircle,
  info: AlertCircle,
}

const ICON_COLORS: Record<ToastType, string> = {
  success: '#4CAF50',
  error: '#EF4444',
  info: '#B5A98A',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.type]
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg min-w-[260px] max-w-xs"
      style={{
        background: '#2C2B26',
        border: '1px solid rgba(255,255,255,0.08)',
        animation: toast.exiting ? 'toastOut 0.2s ease forwards' : 'toastIn 0.25s ease forwards',
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${ICON_COLORS[toast.type]}20` }}
      >
        <Icon size={11} style={{ color: ICON_COLORS[toast.type] }} />
      </div>
      <p className="text-sm flex-1 leading-snug" style={{ color: '#FAFAF7', letterSpacing: '-0.01em' }}>
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 transition-opacity hover:opacity-60"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => { setMounted(true) }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
  }, [])

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, type, message }])
    const t = setTimeout(() => dismiss(id), 3800)
    timers.current.set(id, t)
  }, [dismiss])

  const ctx: ToastContextValue = {
    success: (m) => add('success', m),
    error: (m) => add('error', m),
    info: (m) => add('info', m),
  }

  const portal = mounted ? createPortal(
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(4px) scale(0.97); }
        }
      `}</style>
      <div
        className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2 items-end"
        aria-live="polite"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </>,
    document.body
  ) : null

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {portal}
    </ToastContext.Provider>
  )
}
