import type { PlacedSticker } from '@/types'
import { resolveStickerPlacement, type StickerViewport } from '@/lib/stickers'
import { StickerImage } from './sticker-image'

interface Props {
  stickers: PlacedSticker[]
  viewport?: StickerViewport
}

export function StickerOverlay({ stickers, viewport = 'desktop' }: Props) {
  if (stickers.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      {stickers.map(sticker => {
        const placement = resolveStickerPlacement(sticker, viewport)
        return (
          <StickerImage
            key={sticker.id}
            src={sticker.src}
            color={sticker.color}
            style={{
              position: 'absolute',
              left: `${placement.x}%`,
              top: `${placement.y}%`,
              width: `${placement.width}%`,
              transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
              opacity: sticker.opacity,
              userSelect: 'none',
            }}
          />
        )
      })}
    </div>
  )
}
