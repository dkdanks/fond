'use client'

import { useRef, useState } from 'react'

export function FooterType() {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  function onMouseMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function onMouseLeave() {
    setPos(null)
  }

  const backgroundImage = pos
    ? `radial-gradient(circle 220px at ${pos.x}px ${pos.y}px, #C9A96E 0%, #2C2B26 60%)`
    : `linear-gradient(#3D3928, #3D3928)`

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="font-medium tracking-tighter leading-none select-none text-center w-full"
      style={{
        fontSize: 'clamp(80px, 22vw, 260px)',
        paddingTop: '2vw',
        paddingBottom: '1vw',
        backgroundImage,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      joyabl
    </div>
  )
}
