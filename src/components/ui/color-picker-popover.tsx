'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pipette } from 'lucide-react'

interface ColorPickerPopoverProps {
  value: string
  onChange: (value: string) => void
  alpha?: number
  onAlphaChange?: (value: number) => void
  title?: string
  subtitle?: string
  placement?: 'top' | 'bottom'
  align?: 'start' | 'end'
  triggerClassName?: string
  panelClassName?: string
  triggerAriaLabel?: string
  renderTrigger?: (args: { value: string; open: boolean }) => React.ReactNode
}

interface HsvColor {
  h: number
  s: number
  v: number
}

interface RgbColor {
  r: number
  g: number
  b: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeHex(value: string) {
  const cleaned = value.trim().replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  if (cleaned.length === 3) {
    return `#${cleaned.split('').map(char => char + char).join('')}`.toUpperCase()
  }
  return `#${cleaned.padEnd(6, '0')}`.toUpperCase()
}

function hexToRgb(hex: string): RgbColor {
  const normalized = normalizeHex(hex).slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b]
    .map(channel => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === red) h = ((green - blue) / delta) % 6
    else if (max === green) h = (blue - red) / delta + 2
    else h = (red - green) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const hue = ((h % 360) + 360) % 360
  const chroma = v * s
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const match = v - chroma

  let red = 0
  let green = 0
  let blue = 0

  if (hue < 60) [red, green, blue] = [chroma, x, 0]
  else if (hue < 120) [red, green, blue] = [x, chroma, 0]
  else if (hue < 180) [red, green, blue] = [0, chroma, x]
  else if (hue < 240) [red, green, blue] = [0, x, chroma]
  else if (hue < 300) [red, green, blue] = [x, 0, chroma]
  else [red, green, blue] = [chroma, 0, x]

  return {
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  }
}

function checkerboard() {
  return {
    backgroundImage:
      'linear-gradient(45deg, rgba(0,0,0,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.08) 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  } as const
}

function EyeDropperIcon() {
  return <Pipette size={18} strokeWidth={2} />
}

export function ColorPickerPopover({
  value,
  onChange,
  alpha = 1,
  onAlphaChange,
  title = 'Custom',
  subtitle = 'Choose a colour',
  placement = 'top',
  align = 'start',
  triggerClassName,
  panelClassName,
  triggerAriaLabel = 'Open colour picker',
  renderTrigger,
}: ColorPickerPopoverProps) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const squareRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const alphaRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 })
  const [hexInput, setHexInput] = useState(normalizeHex(value).slice(1))
  const [alphaInput, setAlphaInput] = useState(String(Math.round(alpha * 100)))
  const [color, setColor] = useState<HsvColor>(() => rgbToHsv(hexToRgb(value)))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setColor(rgbToHsv(hexToRgb(value)))
    setHexInput(normalizeHex(value).slice(1))
  }, [value])

  useEffect(() => {
    setAlphaInput(String(Math.round(clamp(alpha, 0, 1) * 100)))
  }, [alpha])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open || !mounted) return

    function updatePosition() {
      const triggerRect = triggerRef.current?.getBoundingClientRect()
      const panelRect = panelRef.current?.getBoundingClientRect()
      if (!triggerRect) return

      const panelWidth = panelRect?.width ?? 320
      const panelHeight = panelRect?.height ?? 380
      const viewportPadding = 16

      let left = align === 'end' ? triggerRect.right - panelWidth : triggerRect.left
      left = clamp(left, viewportPadding, window.innerWidth - panelWidth - viewportPadding)

      let top = placement === 'top'
        ? triggerRect.top - panelHeight - 18
        : triggerRect.bottom + 18

      top = clamp(top, viewportPadding, window.innerHeight - panelHeight - viewportPadding)

      setPanelPosition({ top, left })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [align, mounted, open, placement])

  const currentHex = useMemo(() => rgbToHex(hsvToRgb(color)), [color])
  const pureHue = useMemo(() => rgbToHex(hsvToRgb({ h: color.h, s: 1, v: 1 })), [color.h])
  const rgbaPreview = useMemo(() => {
    const rgb = hexToRgb(currentHex)
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`
  }, [alpha, currentHex])

  function commitColor(next: HsvColor) {
    setColor(next)
    const hex = rgbToHex(hsvToRgb(next))
    setHexInput(hex.slice(1))
    onChange(hex)
  }

  function updateSquare(clientX: number, clientY: number) {
    const rect = squareRef.current?.getBoundingClientRect()
    if (!rect) return
    const s = clamp((clientX - rect.left) / rect.width, 0, 1)
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1)
    commitColor({ ...color, s, v })
  }

  function updateHue(clientX: number) {
    const rect = hueRef.current?.getBoundingClientRect()
    if (!rect) return
    const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 360)
    commitColor({ ...color, h })
  }

  function updateAlpha(clientX: number) {
    if (!onAlphaChange) return
    const rect = alphaRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = clamp((clientX - rect.left) / rect.width, 0, 1)
    onAlphaChange(next)
    setAlphaInput(String(Math.round(next * 100)))
  }

  function startDrag(
    event: React.PointerEvent,
    updater: (clientX: number, clientY: number) => void,
  ) {
    event.preventDefault()
    updater(event.clientX, event.clientY)

    function onMove(moveEvent: PointerEvent) {
      updater(moveEvent.clientX, moveEvent.clientY)
    }

    function onUp() {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  function commitHexInput() {
    const nextHex = normalizeHex(hexInput)
    setHexInput(nextHex.slice(1))
    onChange(nextHex)
    setColor(rgbToHsv(hexToRgb(nextHex)))
  }

  function commitAlphaInput() {
    if (!onAlphaChange) return
    const next = clamp(Number.parseInt(alphaInput || '0', 10) || 0, 0, 100)
    setAlphaInput(String(next))
    onAlphaChange(next / 100)
  }

  return (
    <div className="relative" data-color-picker="true" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerAriaLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(current => !current)}
        className={triggerClassName}
      >
        {renderTrigger ? renderTrigger({ value, open }) : (
          <div
            className="h-10 w-10 rounded-2xl border shadow-sm"
            style={{ background: value, borderColor: 'rgba(44,43,38,0.12)' }}
          />
        )}
      </button>

      {open && mounted && createPortal(
        <div
          id={panelId}
          ref={panelRef}
          className={[
            'fixed z-[140] w-[292px] max-w-[calc(100vw-32px)] rounded-[20px] border bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)]',
            panelClassName ?? '',
          ].join(' ')}
          style={{
            top: panelPosition.top,
            left: panelPosition.left,
            borderColor: '#E5E0D8',
            animation: 'colorPanelIn 180ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <style>{`
            @keyframes colorPanelIn {
              from { opacity: 0; transform: translateY(10px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div className="sr-only">
            <div>{title}</div>
            <div>{subtitle}</div>
          </div>

          <div
            ref={squareRef}
            onPointerDown={event => startDrag(event, updateSquare)}
            className="relative aspect-square w-full cursor-crosshair overflow-hidden rounded-[14px] border"
            style={{
              borderColor: '#DDD7CE',
              background: `linear-gradient(180deg, transparent 0%, #000000 100%), linear-gradient(90deg, #FFFFFF 0%, ${pureHue} 100%)`,
            }}
          >
            <div
              className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-white shadow-[0_2px_10px_rgba(0,0,0,0.16)]"
              style={{
                left: `${color.s * 100}%`,
                top: `${(1 - color.v) * 100}%`,
                background: currentHex,
              }}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#4E4B43] transition-colors hover:bg-[#F6F3EE]"
              title="Eyedropper"
            >
              <EyeDropperIcon />
            </button>

            <div
              ref={hueRef}
              onPointerDown={event => startDrag(event, clientX => updateHue(clientX))}
              className="relative h-[24px] flex-1 rounded-full border"
              style={{
                borderColor: '#DDD7CE',
                background: 'linear-gradient(90deg, #FF0000 0%, #FFFF00 16.66%, #00FF00 33.33%, #00FFFF 50%, #0000FF 66.66%, #FF00FF 83.33%, #FF0000 100%)',
              }}
            >
              <div
                className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-white shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
                style={{ left: `${(color.h / 360) * 100}%`, background: pureHue }}
              />
            </div>
          </div>

          {onAlphaChange && (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full" style={checkerboard()} />
              <div
                ref={alphaRef}
                onPointerDown={event => startDrag(event, clientX => updateAlpha(clientX))}
                className="relative h-[24px] flex-1 overflow-hidden rounded-full border"
                style={{
                  ...checkerboard(),
                  borderColor: '#DDD7CE',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${currentHex} 100%)` }}
                />
                <div
                  className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-white shadow-[0_2px_10px_rgba(0,0,0,0.14)]"
                  style={{ left: `${clamp(alpha, 0, 1) * 100}%`, background: rgbaPreview }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-[74px_1fr_80px] gap-3">
            <div className="overflow-hidden rounded-[14px] border bg-white" style={{ borderColor: '#E0DBD2' }}>
              <div className="px-3 py-2.5 text-[15px] font-medium text-[#2C2B26]">
                <span>Hex</span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border bg-[#F8F6F1]" style={{ borderColor: '#E0DBD2' }}>
              <input
                value={hexInput}
                onChange={event => setHexInput(event.target.value.toUpperCase())}
                onBlur={commitHexInput}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    commitHexInput()
                  }
                }}
                className="w-full bg-transparent px-3 py-2.5 text-[15px] font-medium tracking-[0.02em] text-[#2C2B26] outline-none"
              />
            </div>

            <div className="overflow-hidden rounded-[14px] border bg-[#F8F6F1]" style={{ borderColor: '#E0DBD2' }}>
              <div className="flex items-center">
                <input
                  value={alphaInput}
                  onChange={event => setAlphaInput(event.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  onBlur={commitAlphaInput}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      commitAlphaInput()
                    }
                  }}
                  className="w-full bg-transparent px-3 py-2.5 text-[15px] font-medium text-[#2C2B26] outline-none"
                  disabled={!onAlphaChange}
                />
                <span className="pr-3 text-[15px] text-[#8A867C]">%</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
