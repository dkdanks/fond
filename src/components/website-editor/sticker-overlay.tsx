import type { PlacedSticker } from '@/types'
import { StickerImage } from './sticker-image'

interface Props {
  stickers: PlacedSticker[]
}

export function StickerOverlay({ stickers }: Props) {
  if (stickers.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      {stickers.map(s => (
        <StickerImage
          key={s.id}
          src={s.src}
          color={s.color}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.width}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            opacity: s.opacity,
            userSelect: 'none',
          }}
        />
      ))}
    </div>
  )
}
