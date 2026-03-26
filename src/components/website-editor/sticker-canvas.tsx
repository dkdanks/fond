'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { ColorPickerPopover } from '@/components/ui/color-picker-popover'
import type { PlacedSticker } from '@/types'
import { StickerImage } from './sticker-image'

interface Props {
  stickers: PlacedSticker[]
  onChange: (stickers: PlacedSticker[]) => void
  primaryColor: string
}

type Handle = 'nw' | 'ne' | 'se' | 'sw' | 'rotate'
type Corner = 'nw' | 'ne' | 'se' | 'sw'

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
  startPointerAngle: number
  startPointerDistance: number
  containerW: number
  containerH: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createStickerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `sticker-${Date.now().toString(36)}-${performance.now().toString(36).replace('.', '')}`
}

function svgCursor(svg: string, x = 9, y = 9, fallback = 'move') {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, ${fallback}`
}

function resizeCursor(rotation: number, fallback: string) {
  const svg = `<svg width="19" height="19" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${rotation} 12.5 12.5)"><path d="M3.06247 9.01249L3.08747 3.01254L9.08741 3.03753" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.0373 15.0873L21.0123 21.0873L15.0124 21.0623" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.08747 3.01255L10.0582 10.0416" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.0123 21.0873L14.0416 14.0582" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.06247 9.01249L3.08747 3.01254L9.08741 3.03753" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.0373 15.0873L21.0123 21.0873L15.0124 21.0623" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.08747 3.01255L10.0582 10.0416" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21.0123 21.0873L14.0416 14.0582" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`
  return svgCursor(svg, 9, 9, fallback)
}

function rotateCursor(rotation: number) {
  const svg = `<svg width="18" height="18" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(${rotation} 10.5 10)"><path d="M19.3768 15.0068L15.0534 18.5409L11.602 15.0068" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.7713 4.49976L7.61438 4.78989C11.8393 5.043 15.136 8.5431 15.136 12.7756V17.2561" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.53416 8.06784L1.00001 4.53383L4.53409 0.999881" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.3768 15.0068L15.0534 18.5409L11.602 15.0068" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.7713 4.49976L7.61438 4.78989C11.8393 5.043 15.136 8.5431 15.136 12.7756V17.2561" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.53416 8.06784L1.00001 4.53383L4.53409 0.999881" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`
  return svgCursor(svg, 8, 8, 'grab')
}

function getCornerVisualPosition(corner: Corner): React.CSSProperties {
  switch (corner) {
    case 'nw':
      return { left: -12.5, top: -12.5 }
    case 'ne':
      return { right: -12.5, top: -12.5 }
    case 'se':
      return { right: -12.5, bottom: -12.5 }
    case 'sw':
      return { left: -12.5, bottom: -12.5 }
  }
}

function getCornerHotspotPosition(corner: Corner): React.CSSProperties {
  switch (corner) {
    case 'nw':
      return { left: -12, top: -12 }
    case 'ne':
      return { right: -12, top: -12 }
    case 'se':
      return { right: -12, bottom: -12 }
    case 'sw':
      return { left: -12, bottom: -12 }
  }
}

function getResizeCursor(stickerRotation: number, corner: Corner) {
  const base = corner === 'nw' || corner === 'se' ? 0 : 90
  const fallback = corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize'
  return resizeCursor(base + stickerRotation, fallback)
}

function getRotateCursor(stickerRotation: number, corner: Corner) {
  const base = { ne: 0, se: 90, sw: 180, nw: 270 }[corner]
  return rotateCursor(base + stickerRotation)
}

function getDimensionBadgePosition(rotation: number): React.CSSProperties {
  const normalized = ((rotation % 360) + 360) % 360
  if (normalized <= 45 || normalized > 315) {
    return { left: '50%', bottom: -34, transform: 'translateX(-50%)' }
  }
  if (normalized <= 135) {
    return { left: -34, top: '50%', transform: 'translateY(-50%)' }
  }
  if (normalized <= 225) {
    return { left: '50%', top: -34, transform: 'translateX(-50%)' }
  }
  return { right: -34, top: '50%', transform: 'translateY(-50%)' }
}

export function StickerCanvas({ stickers, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const SNAP_THRESHOLD = 0.8

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

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-sticker-ui="true"]')) return
      setSelectedId(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

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
            const overflowAllowance = s.width / 2
            let nextX = clamp(d.startStickerX + dx, -overflowAllowance, 100 + overflowAllowance)
            const nextY = clamp(d.startStickerY + dy, -overflowAllowance, 100 + overflowAllowance)

            if (Math.abs(nextX - 50) <= SNAP_THRESHOLD) nextX = 50
            return { ...s, x: nextX, y: nextY }
          }
          if (d.type === 'resize') {
            const rect = containerRef.current!.getBoundingClientRect()
            const cx = rect.left + (d.startStickerX / 100) * rect.width
            const cy = rect.top + (d.startStickerY / 100) * rect.height
            const distance = Math.max(12, Math.hypot(e.clientX - cx, e.clientY - cy))
            const scale = distance / Math.max(d.startPointerDistance, 12)
            return { ...s, width: Math.max(4, Math.min(80, d.startWidth * scale)) }
          }
          if (d.type === 'rotate') {
            const rect = containerRef.current!.getBoundingClientRect()
            const cx = rect.left + (d.startStickerX / 100) * rect.width
            const cy = rect.top + (d.startStickerY / 100) * rect.height
            const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
            return { ...s, rotation: d.startRotation + (currentAngle - d.startPointerAngle) }
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
    const centerX = rect.left + (sticker.x / 100) * rect.width
    const centerY = rect.top + (sticker.y / 100) * rect.height
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
      startPointerAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI),
      startPointerDistance: Math.hypot(e.clientX - centerX, e.clientY - centerY),
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
      id: createStickerId(),
      x: s.x + 3,
      y: s.y + 3,
    }
    onChange([...stickers, newS])
    setSelectedId(newS.id)
  }

  const selectedSticker = stickers.find(sticker => sticker.id === selectedId) ?? null
  const showVerticalGuide =
    drag?.type === 'move' &&
    drag.stickerId === selectedSticker?.id &&
    selectedSticker !== null &&
    selectedSticker.x === 50
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-visible"
      style={{ pointerEvents: 'none' }}
    >
      {showVerticalGuide && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            transform: 'translateX(-0.5px)',
            background: '#111111',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {stickers.map(sticker => (
        <StickerItem
          key={sticker.id}
          sticker={sticker}
          isSelected={sticker.id === selectedId}
          isDragging={drag?.stickerId === sticker.id}
          onSelect={() => setSelectedId(sticker.id)}
          onStartMove={e => { setSelectedId(sticker.id); startDrag(e, sticker.id, 'move') }}
          onStartResize={e => startDrag(e, sticker.id, 'resize')}
          onStartRotate={e => startDrag(e, sticker.id, 'rotate')}
        />
      ))}

      <StickerControls
        key={selectedSticker?.id ?? 'no-sticker'}
        sticker={selectedSticker}
        onUpdate={patch => {
          if (!selectedSticker) return
          updateSticker(selectedSticker.id, patch)
        }}
        onDuplicate={() => {
          if (!selectedSticker) return
          duplicateSticker(selectedSticker.id)
        }}
        onDelete={() => {
          if (!selectedSticker) return
          onChange(stickers.filter(sticker => sticker.id !== selectedSticker.id))
          setSelectedId(null)
        }}
      />
    </div>
  )
}

// ─── Sticker item ────────────────────────────────────────────────────────────

interface StickerItemProps {
  sticker: PlacedSticker
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onStartMove: (e: React.PointerEvent) => void
  onStartResize: (e: React.PointerEvent) => void
  onStartRotate: (e: React.PointerEvent) => void
}

function StickerItem({
  sticker,
  isSelected,
  isDragging,
  onSelect,
  onStartMove,
  onStartResize,
  onStartRotate,
}: StickerItemProps) {
  const corners: Corner[] = ['nw', 'ne', 'se', 'sw']
  const outlineColor = '#111111'

  return (
    <div
      data-sticker-ui="true"
      style={{
        position: 'absolute',
        left: `${sticker.x}%`,
        top: `${sticker.y}%`,
        width: `${sticker.width}%`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        pointerEvents: 'auto',
        transition: isDragging ? 'none' : 'filter 150ms ease',
        filter: isSelected ? 'drop-shadow(0 18px 30px rgba(44,43,38,0.18))' : 'none',
      }}
      onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerDown={onStartMove}
    >
      <StickerImage
        src={sticker.src}
        color={sticker.color}
        className="w-full h-full"
        style={{ pointerEvents: 'none', opacity: sticker.opacity, transition: 'opacity 150ms ease' }}
      />

      {/* Handles — only when selected */}
      {isSelected && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: 0,
              border: `1px solid ${outlineColor}`,
              pointerEvents: 'none',
              boxShadow: 'none',
            }}
          />

          {corners.map(corner => (
            <div key={`resize-${corner}`}>
              <div
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  background: '#FFFFFF',
                  border: `1px solid ${outlineColor}`,
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  zIndex: 1,
                  ...getCornerVisualPosition(corner),
                }}
              />
              <div
                onPointerDown={e => { e.stopPropagation(); onStartResize(e) }}
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  cursor: getResizeCursor(sticker.rotation, corner),
                  ...getCornerHotspotPosition(corner),
                }}
              />
              <div
                onPointerDown={e => { e.stopPropagation(); onStartRotate(e) }}
                style={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  cursor: getRotateCursor(sticker.rotation, corner),
                  ...getRotateHotspotPosition(corner),
                }}
              />
            </div>
          ))}

          <div
            style={{
              position: 'absolute',
              ...getDimensionBadgePosition(sticker.rotation),
              padding: '2px 8px',
              borderRadius: 6,
              background: '#111111',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1.35,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {`${Math.round(sticker.width * 10)} x ${Math.round(sticker.width * 10)}`}
          </div>
        </>
      )}
    </div>
  )
}

function getRotateHotspotPosition(corner: Corner): React.CSSProperties {
  switch (corner) {
    case 'nw':
      return { left: -26, top: -26 }
    case 'ne':
      return { right: -26, top: -26 }
    case 'se':
      return { right: -26, bottom: -26 }
    case 'sw':
      return { left: -26, bottom: -26 }
  }
}

// ─── Sticker controls (floating toolbar) ─────────────────────────────────────

interface ControlsProps {
  sticker: PlacedSticker | null
  onUpdate: (patch: Partial<PlacedSticker>) => void
  onDuplicate: () => void
  onDelete: () => void
}

function StickerControls({ sticker, onUpdate, onDuplicate, onDelete }: ControlsProps) {
  if (!sticker) return null

  return (
    <div
      data-sticker-ui="true"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 20,
        transform: 'translateX(-50%)',
        zIndex: 70,
        pointerEvents: 'auto',
      }}
      onClick={event => event.stopPropagation()}
      onPointerDown={event => event.stopPropagation()}
    >
      <div
        className="flex items-center gap-0 rounded-[28px] border overflow-visible"
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderColor: 'rgba(44,43,38,0.08)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 18px 40px rgba(44,43,38,0.14)',
          padding: '6px 8px',
          animation: 'stickerControlsIn 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <style>{`
          @keyframes stickerControlsIn {
            from { opacity: 0; transform: translateY(18px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }

        `}</style>

        <ColorPickerPopover
          value={sticker.color}
          onChange={value => onUpdate({ color: value })}
          alpha={sticker.opacity}
          onAlphaChange={value => onUpdate({ opacity: value })}
          title="Custom"
          subtitle="Sticker colour"
          placement="top"
          triggerAriaLabel="Choose sticker colour"
          triggerClassName="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#FAFAF7]"
          renderTrigger={({ value }) => (
            <div
              className="h-6 w-6 rounded-full border-2"
              style={{ background: value, borderColor: 'rgba(44,43,38,0.12)', boxShadow: '0 2px 8px rgba(44,43,38,0.15)' }}
            />
          )}
        />

        <div className="w-px h-6 self-center" style={{ background: '#EFE8DD' }} />

        <button
          onClick={onDuplicate}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-[#FAFAF7]"
          title="Duplicate"
        >
          <Copy size={15} style={{ color: '#8B8670' }} />
        </button>

        <div className="w-px h-6 self-center" style={{ background: '#EFE8DD' }} />

        <button
          onClick={onDelete}
          className="flex items-center justify-center w-10 h-10 rounded-full transition-colors hover:bg-[#FEF2F2]"
          title="Delete"
        >
          <Trash2 size={15} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  )
}
