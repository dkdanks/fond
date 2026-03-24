import { Heart, Sparkles, Star, Home, Gift } from 'lucide-react'
import type { EventType } from '@/types'
import { EVENT_TYPE_COLORS } from '@/types'

const ICONS: Record<EventType, React.ComponentType<{ size?: number; color?: string }>> = {
  wedding:      Heart,
  baby_shower:  Sparkles,
  mitzvah:      Star,
  housewarming: Home,
  birthday:     Gift,
}

interface EventTypeIconProps {
  type: EventType
  size?: 'sm' | 'md' | 'lg'
}

export function EventTypeIcon({ type, size = 'md' }: EventTypeIconProps) {
  const Icon = ICONS[type]
  const accent = EVENT_TYPE_COLORS[type].accent

  const dims = { sm: 32, md: 40, lg: 52 }[size]
  const iconSize = { sm: 13, md: 16, lg: 22 }[size]
  const radius = { sm: 8, md: 10, lg: 14 }[size]

  return (
    <div
      style={{
        width: dims,
        height: dims,
        borderRadius: radius,
        background: `${accent}22`,
        border: `1px solid ${accent}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={iconSize} color={accent} />
    </div>
  )
}
