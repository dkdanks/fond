'use client'

import Link from 'next/link'
import { useState } from 'react'

interface EventTypeCardProps {
  label: string
  description: string
  href: string
  accent: string
}

export function EventTypeCard({ label, description, href, accent }: EventTypeCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '20px 28px',
        borderRadius: 14,
        border: `1.5px solid ${hovered ? 'transparent' : '#D4CCBC'}`,
        background: hovered ? accent : 'transparent',
        textDecoration: 'none',
        cursor: 'pointer',
        minWidth: 148,
        transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: '#2C2B26',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          color: '#8B8670',
          textAlign: 'center',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}
      >
        {description}
      </span>
    </Link>
  )
}
