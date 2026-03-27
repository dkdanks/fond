'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { ImageAdjustment } from '@/types'
import { getImageFrameStyle, normalizeImageAdjustment } from '@/lib/image-presentation'

interface ImageAdjustDialogProps {
  open: boolean
  imageUrl: string
  title: string
  value?: Partial<ImageAdjustment> | null
  onSave: (value: ImageAdjustment) => void
  onClose: () => void
}

export function ImageAdjustDialog({
  open,
  imageUrl,
  title,
  value,
  onSave,
  onClose,
}: ImageAdjustDialogProps) {
  const frameRef = useRef<HTMLDivElement | null>(null)
  const normalizedValue = useMemo(() => normalizeImageAdjustment(value), [value])
  const [draft, setDraft] = useState<ImageAdjustment>(() => normalizedValue)
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) return
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, open])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  function updateDraft(next: Partial<ImageAdjustment>) {
    const merged = normalizeImageAdjustment({ ...draft, ...next })
    setDraft(merged)
  }

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX, event.clientY)
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragOffsetRef.current || !frameRef.current) return
    updateFromPointer(event.clientX, event.clientY)
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragOffsetRef.current = null
  }

  function updateFromPointer(clientX: number, clientY: number) {
    if (!frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const nextX = ((clientX - rect.left) / rect.width) * 100
    const nextY = ((clientY - rect.top) / rect.height) * 100
    updateDraft({ x: nextX, y: nextY })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(44,43,38,0.38)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close image adjuster"
      />

      <div
        className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-[28px] border"
        style={{ background: 'rgba(255,255,255,0.98)', borderColor: '#E8E3D9', boxShadow: '0 24px 80px rgba(44,43,38,0.18)' }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: '#F0EDE8' }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#2C2B26' }}>{title}</p>
            <p className="text-xs" style={{ color: '#8B8670' }}>Drag to set the focal point, then fine-tune with zoom.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#F5F0E8]"
            style={{ color: '#8B8670' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div
            ref={frameRef}
            className="relative aspect-square overflow-hidden rounded-[24px] border"
            style={{
              ...getImageFrameStyle(imageUrl, draft),
              borderColor: '#E8E3D9',
              backgroundColor: '#F5F0E8',
              cursor: 'grab',
            }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div
              className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
              style={{
                left: `${draft.x}%`,
                top: `${draft.y}%`,
                boxShadow: '0 4px 10px rgba(44,43,38,0.2)',
              }}
            >
              <div className="absolute inset-[4px] rounded-full" style={{ background: '#2C2B26' }} />
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-[24px] border p-4" style={{ borderColor: '#F0EDE8', background: '#FCFBF8' }}>
            <SliderRow
              label="Zoom"
              value={draft.zoom}
              min={1}
              max={2.5}
              step={0.01}
              display={`${draft.zoom.toFixed(2)}x`}
              onChange={next => updateDraft({ zoom: next })}
            />
            <SliderRow
              label="Horizontal"
              value={draft.x}
              min={0}
              max={100}
              step={1}
              display={`${Math.round(draft.x)}%`}
              onChange={next => updateDraft({ x: next })}
            />
            <SliderRow
              label="Vertical"
              value={draft.y}
              min={0}
              max={100}
              step={1}
              display={`${Math.round(draft.y)}%`}
              onChange={next => updateDraft({ y: next })}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: '#F0EDE8' }}>
            <button
              type="button"
              onClick={() => setDraft(normalizedValue)}
              className="rounded-xl px-3 py-2 text-xs font-medium transition-colors"
              style={{ color: '#8B8670', background: '#FAFAF7' }}
            >
              Reset
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-3 py-2 text-xs font-medium transition-colors"
                style={{ color: '#8B8670', background: '#FAFAF7' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(draft)
                  onClose()
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold transition-colors"
                style={{ color: 'white', background: '#2C2B26' }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (next: number) => void
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span style={{ color: '#2C2B26' }}>{label}</span>
        <span style={{ color: '#8B8670' }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="h-2 w-full appearance-none rounded-full"
        style={{ background: 'linear-gradient(90deg, #E8E3D9 0%, #D8D0C3 100%)' }}
      />
    </label>
  )
}
