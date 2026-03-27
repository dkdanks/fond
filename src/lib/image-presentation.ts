import type { CSSProperties } from 'react'
import type { ImageAdjustment } from '@/types'

export const DEFAULT_IMAGE_ADJUSTMENT: ImageAdjustment = {
  x: 50,
  y: 50,
  zoom: 1,
}

export function normalizeImageAdjustment(adjustment?: Partial<ImageAdjustment> | null): ImageAdjustment {
  return {
    x: clamp(adjustment?.x ?? DEFAULT_IMAGE_ADJUSTMENT.x, 0, 100),
    y: clamp(adjustment?.y ?? DEFAULT_IMAGE_ADJUSTMENT.y, 0, 100),
    zoom: clamp(adjustment?.zoom ?? DEFAULT_IMAGE_ADJUSTMENT.zoom, 1, 2.5),
  }
}

export function getImageFrameStyle(
  imageUrl?: string | null,
  adjustment?: Partial<ImageAdjustment> | null,
): CSSProperties {
  const normalized = normalizeImageAdjustment(adjustment)

  return {
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundPosition: `${normalized.x}% ${normalized.y}%`,
    backgroundSize: `${normalized.zoom * 100}%`,
    backgroundRepeat: 'no-repeat',
  }
}

export function storyImageAdjustmentKey(index: number) {
  return `story:${index}`
}

export function customSectionImageAdjustmentKey(sectionId: string, index: number) {
  return `custom:${sectionId}:${index}`
}

export function weddingPartyImageAdjustmentKey(memberId: string) {
  return `party:${memberId}`
}

export function heroImageAdjustmentKey() {
  return 'hero:cover'
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
