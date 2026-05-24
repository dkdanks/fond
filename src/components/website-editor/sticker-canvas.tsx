'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { ColorPickerPopover } from '@/components/ui/color-picker-popover'
import { applyStickerPlacementPatch, resolveStickerPlacement, type StickerViewport } from '@/lib/stickers'
import type { PlacedSticker } from '@/types'
import { StickerImage } from './sticker-image'

interface Props {
  stickers: PlacedSticker[]
  onChange: (stickers: PlacedSticker[]) => void
  primaryColor: string
  viewport: StickerViewport
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onBeginChange?: (stickers: PlacedSticker[]) => void
}

type Corner = 'nw' | 'ne' | 'se' | 'sw'

interface DragState {
  type: 'move' | 'resize' | 'rotate'
  stickerId: string
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

export function StickerCanvas({
  stickers,
  onChange,
  viewport,
  selectedId = null,
  onSelect,
  onBeginChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const SNAP_THRESHOLD = 0.8

  useEffect(() => {
    dragRef.current = drag
  }, [drag])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onSelect?.(null)
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onSelect])

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-sticker-ui="true"]')) return
      onSelect?.(null)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [onSelect])

  const moveHandlerRef = useRef<(event: PointerEvent) => void>(() => {})

  useEffect(() => {
    moveHandlerRef.current = (event: PointerEvent) => {
      const currentDrag = dragRef.current
      if (!currentDrag || !containerRef.current) return
      const dx = ((event.clientX - currentDrag.startX) / currentDrag.containerW) * 100
      const dy = ((event.clientY - currentDrag.startY) / currentDrag.containerH) * 100

      onChange(
        stickers.map(sticker => {
          if (sticker.id !== currentDrag.stickerId) return sticker
          const placement = resolveStickerPlacement(sticker, viewport)

          if (currentDrag.type === 'move') {
            const overflowAllowance = placement.width / 2
            let nextX = clamp(currentDrag.startStickerX + dx, -overflowAllowance, 100 + overflowAllowance)
            const nextY = clamp(currentDrag.startStickerY + dy, -overflowAllowance, 100 + overflowAllowance)

            if (Math.abs(nextX - 50) <= SNAP_THRESHOLD) nextX = 50
            return applyStickerPlacementPatch(sticker, viewport, { x: nextX, y: nextY })
          }

          if (currentDrag.type === 'resize') {
            const container = containerRef.current
            if (!container) return sticker
            const rect = container.getBoundingClientRect()
            const cx = rect.left + (currentDrag.startStickerX / 100) * rect.width
            const cy = rect.top + (currentDrag.startStickerY / 100) * rect.height
            const distance = Math.max(12, Math.hypot(event.clientX - cx, event.clientY - cy))
            const scale = distance / Math.max(currentDrag.startPointerDistance, 12)
            return applyStickerPlacementPatch(sticker, viewport, {
              width: Math.max(4, Math.min(80, currentDrag.startWidth * scale)),
            })
          }

          if (currentDrag.type === 'rotate') {
            const container = containerRef.current
            if (!container) return sticker
            const rect = container.getBoundingClientRect()
            const cx = rect.left + (currentDrag.startStickerX / 100) * rect.width
            const cy = rect.top + (currentDrag.startStickerY / 100) * rect.height
            const currentAngle = Math.atan2(event.clientY - cy, event.clientX - cx) * (180 / Math.PI)
            return applyStickerPlacementPatch(sticker, viewport, {
              rotation: currentDrag.startRotation + (currentAngle - currentDrag.startPointerAngle),
            })
          }

          return sticker
        })
      )
    }
  }, [onChange, stickers, viewport])

  function beginChange() {
    onBeginChange?.(stickers)
  }

  function startDrag(
    event: React.PointerEvent,
    stickerId: string,
    type: DragState['type'],
  ) {
    event.stopPropagation()
    event.preventDefault()
    const sticker = stickers.find(item => item.id === stickerId)
    if (!sticker || !containerRef.current) return

    beginChange()
    onSelect?.(stickerId)

    const placement = resolveStickerPlacement(sticker, viewport)
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + (placement.x / 100) * rect.width
    const centerY = rect.top + (placement.y / 100) * rect.height
    const state: DragState = {
      type,
      stickerId,
      startX: event.clientX,
      startY: event.clientY,
      startStickerX: placement.x,
      startStickerY: placement.y,
      startWidth: placement.width,
      startRotation: placement.rotation,
      startPointerAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI),
      startPointerDistance: Math.hypot(event.clientX - centerX, event.clientY - centerY),
      containerW: rect.width,
      containerH: rect.height,
    }

    setDrag(state)
    dragRef.current = state

    const move = (nextEvent: PointerEvent) => moveHandlerRef.current(nextEvent)
    const up = () => {
      setDrag(null)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }

    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
  }

  function updateSticker(id: string, patch: Partial<PlacedSticker>) {
    beginChange()
    onChange(stickers.map(sticker => sticker.id === id ? { ...sticker, ...patch } : sticker))
  }

  function duplicateSticker(id: string) {
    const sticker = stickers.find(item => item.id === id)
    if (!sticker) return
    beginChange()

    const desktopPlacement = resolveStickerPlacement(sticker, 'desktop')
    const mobilePlacement = resolveStickerPlacement(sticker, 'mobile')
    const nextSticker: PlacedSticker = {
      ...sticker,
      id: createStickerId(),
      x: desktopPlacement.x + 3,
      y: desktopPlacement.y + 3,
      width: desktopPlacement.width,
      rotation: desktopPlacement.rotation,
      mobileX: mobilePlacement.x + 3,
      mobileY: mobilePlacement.y + 3,
      mobileWidth: mobilePlacement.width,
      mobileRotation: mobilePlacement.rotation,
    }

    onChange([...stickers, nextSticker])
    onSelect?.(nextSticker.id)
  }

  const selectedSticker = stickers.find(sticker => sticker.id === selectedId) ?? null
  const selectedPlacement = selectedSticker ? resolveStickerPlacement(selectedSticker, viewport) : null
  const showVerticalGuide =
    drag?.type === 'move' &&
    drag.stickerId === selectedSticker?.id &&
    selectedPlacement !== null &&
    selectedPlacement.x === 50

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
          viewport={viewport}
          isSelected={sticker.id === selectedId}
          isDragging={drag?.stickerId === sticker.id}
          onSelect={() => onSelect?.(sticker.id)}
          onStartMove={event => startDrag(event, sticker.id, 'move')}
          onStartResize={event => startDrag(event, sticker.id, 'resize')}
          onStartRotate={event => startDrag(event, sticker.id, 'rotate')}
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
          beginChange()
          onChange(stickers.filter(sticker => sticker.id !== selectedSticker.id))
          onSelect?.(null)
        }}
      />
    </div>
  )
}

interface StickerItemProps {
  sticker: PlacedSticker
  viewport: StickerViewport
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onStartMove: (event: React.PointerEvent) => void
  onStartResize: (event: React.PointerEvent) => void
  onStartRotate: (event: React.PointerEvent) => void
}

function StickerItem({
  sticker,
  viewport,
  isSelected,
  isDragging,
  onSelect,
  onStartMove,
  onStartResize,
  onStartRotate,
}: StickerItemProps) {
  const placement = resolveStickerPlacement(sticker, viewport)
  const corners: Corner[] = ['nw', 'ne', 'se', 'sw']
  const outlineColor = '#111111'

  return (
    <div
      data-sticker-ui="true"
      style={{
        position: 'absolute',
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${placement.width}%`,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        pointerEvents: 'auto',
        transition: isDragging ? 'none' : 'filter 150ms ease',
        filter: isSelected ? 'drop-shadow(0 18px 30px rgba(44,43,38,0.18))' : 'none',
      }}
      onClick={event => { event.stopPropagation(); onSelect() }}
      onPointerDown={onStartMove}
    >
      <StickerImage
        src={sticker.src}
        color={sticker.color}
        className="w-full h-full"
        style={{ pointerEvents: 'none', opacity: sticker.opacity, transition: 'opacity 150ms ease' }}
      />

      {isSelected && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: 0,
              border: `1px solid ${outlineColor}`,
              pointerEvents: 'none',
            }}
          />

          {corners.map(corner => (
            <div key={`${sticker.id}-${corner}`}>
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
                onPointerDown={event => { event.stopPropagation(); onStartResize(event) }}
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  cursor: getResizeCursor(placement.rotation, corner),
                  ...getCornerHotspotPosition(corner),
                }}
              />
              <div
                onPointerDown={event => { event.stopPropagation(); onStartRotate(event) }}
                style={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  cursor: getRotateCursor(placement.rotation, corner),
                  ...getRotateHotspotPosition(corner),
                }}
              />
            </div>
          ))}

          <div
            style={{
              position: 'absolute',
              ...getDimensionBadgePosition(placement.rotation),
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
            {`${Math.round(placement.width * 10)} x ${Math.round(placement.width * 10)}`}
          </div>
        </>
      )}
    </div>
  )
}

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
        className="flex items-center gap-0 overflow-visible rounded-[28px] border"
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

        <div className="h-6 w-px self-center" style={{ background: '#EFE8DD' }} />

        <button
          onClick={onDuplicate}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#FAFAF7]"
          title="Duplicate"
        >
          <Copy size={15} style={{ color: '#8B8670' }} />
        </button>

        <div className="h-6 w-px self-center" style={{ background: '#EFE8DD' }} />

        <button
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[#FEF2F2]"
          title="Delete"
        >
          <Trash2 size={15} style={{ color: '#EF4444' }} />
        </button>
      </div>
    </div>
  )
}
