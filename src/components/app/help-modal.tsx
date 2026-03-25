'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Phone } from 'lucide-react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="max-w-md w-full mx-4 rounded-3xl p-8 shadow-2xl relative"
        style={{ background: 'white' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-lg font-light leading-none transition-colors"
          style={{ color: '#B5A98A' }}
          aria-label="Close"
        >
          ×
        </button>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #2C2B26 0%, #4A4740 100%)' }}
        >
          <Phone size={28} color="white" />
        </div>
        <h2 className="text-xl font-semibold text-center mb-2" style={{ color: '#2C2B26' }}>
          We&rsquo;re here to help
        </h2>
        <p className="text-sm text-center mb-8" style={{ color: '#8B8670' }}>
          Our team is available to help you plan your perfect event.
        </p>
        <a
          href="tel:+61447455132"
          className="flex flex-col items-center gap-1 p-4 rounded-2xl border transition-colors"
          style={{ borderColor: '#E8E3D9', background: '#FAFAF7', textDecoration: 'none' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>+61 447 455 132</span>
          <span className="text-xs" style={{ color: '#8B8670' }}>Mon–Fri, 9am–6pm AEST</span>
        </a>
      </div>
    </div>,
    document.body
  )
}
