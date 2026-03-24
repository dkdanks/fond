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
    ? `radial-gradient(circle 180px at ${pos.x}px ${pos.y}px, #919191 0%, #282828 70%)`
    : `radial-gradient(circle 0px at -9999px -9999px, #919191, #282828)`

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="font-semibold tracking-tighter leading-none select-none text-center overflow-hidden w-full"
      style={{
        fontSize: 'clamp(80px, 22vw, 260px)',
        paddingTop: '2vw',
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
