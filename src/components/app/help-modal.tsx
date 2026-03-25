'use client'

import { Phone } from 'lucide-react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null

  return (
    <div
      className="bg-black/40 backdrop-blur-sm fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="max-w-md w-full mx-4 rounded-3xl p-8 shadow-2xl relative"
        style={{ background: 'white' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors text-lg font-light leading-none"
          style={{ color: '#B5A98A' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F0E8' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          aria-label="Close"
        >
          ×
        </button>

        {/* Decorative icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #2C2B26 0%, #4A4740 100%)' }}
        >
          <Phone size={28} color="white" />
        </div>

        {/* Heading */}
        <h2 className="text-xl font-semibold text-center mb-2" style={{ color: '#2C2B26' }}>
          We&rsquo;re here to help
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-center mb-8" style={{ color: '#8B8670' }}>
          Our team is available to help you plan your perfect event.
        </p>

        {/* Contact card */}
        <a
          href="tel:+61447455132"
          className="flex flex-col items-center gap-1 p-4 rounded-2xl border transition-colors block mb-6"
          style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2C2B26' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E8E3D9' }}
        >
          <div className="flex items-center gap-2">
            <Phone size={14} style={{ color: '#B5A98A' }} />
            <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>+61 447 455 132</span>
          </div>
          <span className="text-xs" style={{ color: '#8B8670' }}>Mon–Fri, 9am–6pm AEST</span>
        </a>


      </div>
    </div>
  )
}
