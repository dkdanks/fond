'use client'

import { Eye, Monitor, Share2, Smartphone } from 'lucide-react'

export function PreviewToolbar({
  id,
  viewport,
  onViewportChange,
  onOpenShare,
  onOpenMobileEditor,
}: {
  id: string
  viewport: 'desktop' | 'mobile'
  onViewportChange: (viewport: 'desktop' | 'mobile') => void
  onOpenShare: () => void
  onOpenMobileEditor: () => void
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
      style={{ background: 'white', borderColor: '#E8E3D9' }}
    >
      <div className="hidden md:flex items-center gap-1 p-0.5 rounded-xl" style={{ background: '#F5F0E8' }}>
        {(['desktop', 'mobile'] as const).map(v => (
          <button
            key={v}
            onClick={() => onViewportChange(v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: viewport === v ? 'white' : 'transparent',
              color: viewport === v ? '#2C2B26' : '#8B8670',
              boxShadow: viewport === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {v === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
            {v === 'desktop' ? 'Desktop' : 'Mobile'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: '#2C2B26', color: 'white' }}
          onClick={onOpenMobileEditor}
        >
          Edit
        </button>
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
        >
          <Share2 size={12} /> Share
        </button>
        <a
          href={`/events/${id}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{ background: '#2C2B26', color: 'white' }}
        >
          <Eye size={12} /> Preview
        </a>
      </div>
    </div>
  )
}
