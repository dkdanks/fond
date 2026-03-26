'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Trash2, Copy } from 'lucide-react'
import type { PlacedSticker } from '@/types'
import { StickerImage } from './sticker-image'

interface Props {
  stickers: PlacedSticker[]
  onChange: (stickers: PlacedSticker[]) => void
  primaryColor: string
}

type Handle = 'nw' | 'ne' | 'se' | 'sw' | 'rotate'

interface DragState {
  type: 'move' | 'resize' | 'rotate'
  stickerId: string
  handle?: Handle
  startX: number
  startY: number
  startStickerX: number
  startStickerY: number
  startWidth: number
  startRotation: number
  containerW: number
  containerH: number
}

export function StickerCanvas({ stickers, onChange, primaryColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)

  // Keep ref in sync for event handlers
  useEffect(() => { dragRef.current = drag }, [drag])

  // Deselect on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedId(null)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        // Only delete if not in an input
        if (document.activeElement?.tagName === 'INPUT') return
        onChange(stickers.filter(s => s.id !== selectedId))
        setSelectedId(null)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectedId, stickers, onChange])

  // Stable ref that always holds the latest move handler — avoids re-registering on every render
  const moveHandlerRef = useRef<(e: PointerEvent) => void>(() => {})

  useEffect(() => {
    moveHandlerRef.current = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d || !containerRef.current) return
      const dx = ((e.clientX - d.startX) / d.containerW) * 100
      const dy = ((e.clientY - d.startY) / d.containerH) * 100
      onChange(
        stickers.map(s => {
          if (s.id !== d.stickerId) return s
          if (d.type === 'move') {
            return { ...s, x: Math.max(0, Math.min(100, d.startStickerX + dx)), y: Math.max(0, Math.min(100, d.startStickerY + dy)) }
          }
          if (d.type === 'resize') {
            return { ...s, width: Math.max(4, Math.min(80, d.startWidth * (1 + (dx - dy) * 0.01))) }
          }
          if (d.type === 'rotate') {
            const rect = containerRef.current!.getBoundingClientRect()
            const cx = rect.left + (d.startStickerX / 100) * rect.width
            const cy = rect.top + (d.startStickerY / 100) * rect.height
            return { ...s, rotation: Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90 }
          }
          return s
        })
      )
    }
  }, [stickers, onChange])

  function startDrag(
    e: React.PointerEvent,
    stickerId: string,
    type: DragState['type'],
    handle?: Handle
  ) {
    e.stopPropagation()
    e.preventDefault()
    const sticker = stickers.find(s => s.id === stickerId)
    if (!sticker || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const state: DragState = {
      type,
      stickerId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startStickerX: sticker.x,
      startStickerY: sticker.y,
      startWidth: sticker.width,
      startRotation: sticker.rotation,
      containerW: rect.width,
      containerH: rect.height,
    }
    setDrag(state)
    dragRef.current = state

    // Create per-session stable closures so removeEventListener can find them
    const move = (ev: PointerEvent) => moveHandlerRef.current(ev)
    const up = () => {
      setDrag(null)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  function updateSticker(id: string, patch: Partial<PlacedSticker>) {
    onChange(stickers.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  function duplicateSticker(id: string) {
    const s = stickers.find(s => s.id === id)
    if (!s) return
    const newS: PlacedSticker = {
      ...s,
      id: Math.random().toString(36).slice(2, 10),
      x: s.x + 3,
      y: s.y + 3,
    }
    onChange([...stickers, newS])
    setSelectedId(newS.id)
  }

  const selected = stickers.find(s => s.id === selectedId)

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: stickers.length === 0 && !selectedId ? 'none' : 'auto' }}
      onClick={() => setSelectedId(null)}
    >
      {stickers.map(sticker => (
        <StickerItem
          key={sticker.id}
          sticker={sticker}
          isSelected={sticker.id === selectedId}
          isDragging={drag?.stickerId === sticker.id}
          primaryColor={primaryColor}
          onSelect={() => setSelectedId(sticker.id)}
          onStartMove={e => { setSelectedId(sticker.id); startDrag(e, sticker.id, 'move') }}
          onStartResize={e => startDrag(e, sticker.id, 'resize')}
          onStartRotate={e => startDrag(e, sticker.id, 'rotate')}
        />
      ))}

      {/* Floating controls for selected sticker */}
      {selected && (
        <StickerControls
          sticker={selected}
          onUpdate={patch => updateSticker(selected.id, patch)}
          onDuplicate={() => duplicateSticker(selected.id)}
          onDelete={() => {
            onChange(stickers.filter(s => s.id !== selected.id))
            setSelectedId(null)
          }}
          primaryColor={primaryColor}
        />
      )}
    </div>
  )
}

// ─── Sticker item ────────────────────────────────────────────────────────────

interface StickerItemProps {
  sticker: PlacedSticker
  isSelected: boolean
  isDragging: boolean
  primaryColor: string
  onSelect: () => void
  onStartMove: (e: React.PointerEvent) => void
  onStartResize: (e: React.PointerEvent) => void
  onStartRotate: (e: React.PointerEvent) => void
}

function StickerItem({
  sticker,
  isSelected,
  isDragging,
  primaryColor,
  onSelect,
  onStartMove,
  onStartResize,
  onStartRotate,
}: StickerItemProps) {
  const HANDLE_SIZE = 10

  return (
    <div
      style={{
        position: 'absolute',
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: `${sticker.width}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        opacity: sticker.opacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'opacity 150ms ease',
        // Selection ring
        outline: isSelected ? `2px solid ${primaryColor}` : '2px solid transparent',
        outlineOffset: '4px',
        borderRadius: '4px',
      }}
      onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerDown={onStartMove}
    >
      <StickerImage
        src={sticker.src}
        color={sticker.color}
        className="w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* Handles — only when selected */}
      {isSelected && (
        <>
          {/* Corner resize handle (SE) */}
          <div
            onPointerDown={e => { e.stopPropagation(); onStartResize(e) }}
            style={{
              position: 'absolute',
              right: -HANDLE_SIZE / 2,
              bottom: -HANDLE_SIZE / 2,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: '50%',
              background: 'white',
              border: `2px solid ${primaryColor}`,
              cursor: 'se-resize',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          />
          {/* Rotate handle — above center */}
          <div
            onPointerDown={e => { e.stopPropagation(); onStartRotate(e) }}
            style={{
              position: 'absolute',
              left: '50%',
              top: -24,
              transform: 'translateX(-50%)',
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              borderRadius: '50%',
              background: primaryColor,
              cursor: 'grab',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
          >
            <RotateCcw
              size={6}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
                color: 'white',
              }}
            />
          </div>
          {/* Connecting line from rotate handle to element */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: -16,
              width: 1,
              height: 16,
              background: primaryColor,
              opacity: 0.4,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  )
}

// ─── Sticker controls (floating toolbar) ─────────────────────────────────────

interface ControlsProps {
  sticker: PlacedSticker
  primaryColor: string
  onUpdate: (patch: Partial<PlacedSticker>) => void
  onDuplicate: () => void
  onDelete: () => void
}

function StickerControls({ sticker, primaryColor, onUpdate, onDuplicate, onDelete }: ControlsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${sticker.x}%`,
        top: `${Math.max(4, sticker.y - sticker.width * 0.6 - 6)}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: 10,
        pointerEvents: 'auto',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        className="flex items-center gap-0 rounded-2xl shadow-xl border overflow-hidden"
        style={{
          background: 'white',
          borderColor: 'rgba(44,43,38,0.1)',
          animation: 'stickerControlsIn 200ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes stickerControlsIn {
            from { opacity: 0; transform: scale(0.85) translateY(4px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Color picker */}
        <label
          className="relative flex items-center justify-center w-8 h-8 cursor-pointer transition-colors hover:bg-[#FAFAF7]"
          title="Colour"
        >
          <div
            className="w-4 h-4 rounded-full border-2"
            style={{ background: sticker.color, borderColor: 'rgba(0,0,0,0.12)' }}
          />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            value={sticker.color}
            onChange={e => onUpdate({ color: e.target.value })}
          />
        </label>

        <div className="w-px h-5 self-center" style={{ background: '#F0EDE8' }} />

        {/* Opacity slider */}
        <div className="flex items-center gap-1.5 px-2.5" title="Opacity">
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={sticker.opacity}
            onChange={e => onUpdate({ opacity: Number(e.target.value) })}
            className="w-16 h-1 appearance-none rounded-full cursor-pointer"
            style={{ accentColor: primaryColor }}
          />
        </div>

        <div className="w-px h-5 self-center" style={{ background: '#F0EDE8' }} />

        {/* Duplicate */}
        <button
          onClick={onDuplicate}
          className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[#FAFAF7]"
          title="Duplicate"
        >
          <Copy size={12} style={{ color: '#8B8670' }} />
        </button>

        <div className="w-px h-5 self-center" style={{ background: '#F0EDE8' }} />

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-[#FEF2F2]"
          title="Delete"
        >
          <Trash2 size={12} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  )
}

