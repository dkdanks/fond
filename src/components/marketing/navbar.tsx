'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [introVisible, setIntroVisible] = useState(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    // Match hero intro: phase switches at 3200ms, fades over ~1s
    const t = setTimeout(() => setIntroVisible(false), 3200)
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t) }
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        borderBottom: `1px solid ${scrolled ? '#D4CCBC' : 'transparent'}`,
        background: scrolled ? 'rgba(250,250,247,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        opacity: introVisible && !scrolled ? 0 : 1,
        pointerEvents: introVisible && !scrolled ? 'none' : 'auto',
        transition: 'background 0.5s ease, border-color 0.5s ease, opacity 0.9s ease',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        maxWidth: 1152,
        margin: '0 auto',
      }}>
        <span style={{
          fontWeight: 500,
          fontSize: 18,
          letterSpacing: '-0.07em',
          color: scrolled ? '#2C2B26' : '#FFFFFF',
          transition: 'color 0.5s ease',
        }}>
          joyabl
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/login"
            style={{
              fontSize: 14,
              color: scrolled ? '#8B8670' : 'rgba(255,255,255,0.8)',
              textDecoration: 'none',
              transition: 'color 0.5s ease',
            }}
          >
            Log in
          </Link>
          <Link
            href="/start"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.5s ease, border-color 0.5s ease, color 0.5s ease, backdrop-filter 0.5s ease',
              ...(scrolled ? {
                background: '#2C2B26',
                border: '1px solid #2C2B26',
                color: '#FAFAF7',
              } : {
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#FFFFFF',
                backdropFilter: 'blur(8px)',
              }),
            }}
          >
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
