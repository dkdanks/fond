'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Search } from 'lucide-react'
import { STICKER_CATEGORIES, STICKERS, stickersByCategory, type StickerDef } from '@/lib/stickers'
import { StickerImage } from './sticker-image'

interface Props {
  onAdd: (sticker: StickerDef) => void
  onClose: () => void
}

export function StickerBrowser({ onAdd, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(STICKER_CATEGORIES[0].id)
  const [query, setQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setMounted(true))
    searchRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const visibleStickers = query.trim()
    ? STICKERS.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    : stickersByCategory(activeCategory)

  function handleAdd(s: StickerDef) {
    onAdd(s)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        background: `rgba(0,0,0,${mounted ? 0.55 : 0})`,
        transition: 'background 300ms ease',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:w-auto sm:min-w-[580px] sm:max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{
          background: 'white',
          maxHeight: '85vh',
          transform: mounted ? 'translateY(0)' : 'translateY(40px)',
          opacity: mounted ? 1 : 0,
          transition: 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease',
          boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
          <div
            className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 rounded-2xl"
            style={{ background: '#F5F0E8' }}
          >
            <Search size={14} style={{ color: '#B5A98A' }} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stickers…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#2C2B26' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs rounded-full w-4 h-4 flex items-center justify-center"
                style={{ background: '#C8BFA8', color: 'white' }}
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-colors shrink-0"
            style={{ background: '#F5F0E8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EDE8DE')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F5F0E8')}
          >
            <X size={15} style={{ color: '#8B8670' }} />
          </button>
        </div>

        {/* Category tabs — hidden during search */}
        {!query && (
          <div className="flex gap-1 px-6 pb-3 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {STICKER_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all"
                style={{
                  background: activeCategory === cat.id ? '#2C2B26' : '#F5F0E8',
                  color: activeCategory === cat.id ? 'white' : '#8B8670',
                  transform: activeCategory === cat.id ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Sticker grid */}
        <div className="overflow-y-auto px-6 pb-8 flex-1" style={{ scrollbarWidth: 'none' }}>
          {visibleStickers.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#B5A98A' }}>No stickers found</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {visibleStickers.map((s, i) => (
                <StickerTile key={s.id} sticker={s} index={i} onAdd={handleAdd} />
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="shrink-0 px-6 py-3 text-center border-t"
          style={{ borderColor: '#F0EDE8' }}
        >
          <p className="text-xs" style={{ color: '#C8BFA8' }}>
            Click a sticker to place it · Drag to reposition · Scroll to resize
          </p>
        </div>
      </div>
    </div>
  )
}

function StickerTile({
  sticker,
  index,
  onAdd,
}: {
  sticker: StickerDef
  index: number
  onAdd: (s: StickerDef) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 35)
    return () => clearTimeout(t)
  }, [index])

  return (
    <button
      onClick={() => onAdd(sticker)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
      style={{
        background: hovered ? '#F5F0E8' : 'transparent',
        transform: visible
          ? hovered ? 'scale(1.08) translateY(-2px)' : 'scale(1)'
          : 'scale(0.8)',
        opacity: visible ? 1 : 0,
        transition: visible
          ? 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease, background 150ms ease'
          : 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 250ms ease',
        boxShadow: hovered ? '0 4px 16px rgba(44,43,38,0.1)' : 'none',
      }}
    >
      <StickerImage
        src={sticker.src}
        color="#2C2B26"
        className="w-14 h-14"
      />
      <span className="text-xs leading-tight text-center" style={{ color: '#8B8670' }}>
        {sticker.name}
      </span>
    </button>
  )
}
