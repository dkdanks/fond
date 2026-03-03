'use client'

import { useEffect, useRef } from 'react'

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: -200, y: -200 })
  const pos = useRef({ x: -200, y: -200 })

  useEffect(() => {
    // Only activate on devices with a fine pointer (mouse), not touch screens
    if (!window.matchMedia('(pointer: fine)').matches) return

    function onMove(e: MouseEvent) {
      mouse.current = { x: e.clientX, y: e.clientY }
    }
    document.addEventListener('mousemove', onMove)

    let raf: number
    function loop() {
      // Lerp: dot moves 13% of remaining distance each frame → trailing feel
      pos.current.x += (mouse.current.x - pos.current.x) * 0.13
      pos.current.y += (mouse.current.y - pos.current.y) * 0.13

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={dotRef}
      className="fixed top-0 left-0 z-[9999] pointer-events-none"
      style={{ transform: 'translate(-200px, -200px)' }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#1C1C1C',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  )
}
