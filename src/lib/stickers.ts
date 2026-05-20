export interface StickerDef {
  id: string
  name: string
  category: string
  src: string
}

export interface StickerCategory {
  id: string
  label: string
}

export interface StickerCatalog {
  categories: StickerCategory[]
  stickers: StickerDef[]
}

export interface StickerLike {
  sectionId?: string
}

export interface StickerPlacement {
  x: number
  y: number
  width: number
  rotation: number
}

export type StickerViewport = 'desktop' | 'mobile'

export function formatStickerLabel(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function stickersByCategory(stickers: StickerDef[], categoryId: string): StickerDef[] {
  return stickers.filter(sticker => sticker.category === categoryId)
}

export function getSectionStickers<T extends StickerLike>(stickers: T[], sectionId: string): T[] {
  return stickers.filter(sticker => sticker.sectionId === sectionId)
}

export function getLegacyPageStickers<T extends StickerLike>(stickers: T[]): T[] {
  return stickers.filter(sticker => !sticker.sectionId)
}

export function mergeSectionStickers<T extends StickerLike>(
  allStickers: T[],
  sectionId: string,
  nextSectionStickers: T[],
): T[] {
  return [
    ...allStickers.filter(sticker => sticker.sectionId !== sectionId),
    ...nextSectionStickers.map(sticker => ({ ...sticker, sectionId })),
  ]
}

export function resolveStickerPlacement<
  T extends {
    x: number
    y: number
    width: number
    rotation: number
    mobileX?: number
    mobileY?: number
    mobileWidth?: number
    mobileRotation?: number
    mobileDetached?: boolean
  },
>(sticker: T, viewport: StickerViewport): StickerPlacement {
  if (viewport === 'mobile') {
    return {
      x: sticker.mobileDetached ? (sticker.mobileX ?? sticker.x) : sticker.x,
      y: sticker.mobileDetached ? (sticker.mobileY ?? sticker.y) : sticker.y,
      width: sticker.mobileDetached ? (sticker.mobileWidth ?? sticker.width) : sticker.width,
      rotation: sticker.mobileDetached ? (sticker.mobileRotation ?? sticker.rotation) : sticker.rotation,
    }
  }

  return {
    x: sticker.x,
    y: sticker.y,
    width: sticker.width,
    rotation: sticker.rotation,
  }
}

export function applyStickerPlacementPatch<
  T extends {
    x: number
    y: number
    width: number
    rotation: number
    mobileX?: number
    mobileY?: number
    mobileWidth?: number
    mobileRotation?: number
    mobileDetached?: boolean
  },
>(sticker: T, viewport: StickerViewport, patch: Partial<StickerPlacement>): T {
  if (viewport === 'mobile') {
    return {
      ...sticker,
      mobileDetached: true,
      mobileX: patch.x ?? resolveStickerPlacement(sticker, 'mobile').x,
      mobileY: patch.y ?? resolveStickerPlacement(sticker, 'mobile').y,
      mobileWidth: patch.width ?? resolveStickerPlacement(sticker, 'mobile').width,
      mobileRotation: patch.rotation ?? resolveStickerPlacement(sticker, 'mobile').rotation,
    }
  }

  const nextDesktop = {
    x: patch.x ?? sticker.x,
    y: patch.y ?? sticker.y,
    width: patch.width ?? sticker.width,
    rotation: patch.rotation ?? sticker.rotation,
  }

  if (sticker.mobileDetached) {
    return {
      ...sticker,
      ...nextDesktop,
    }
  }

  return {
    ...sticker,
    ...nextDesktop,
    mobileX: nextDesktop.x,
    mobileY: nextDesktop.y,
    mobileWidth: nextDesktop.width,
    mobileRotation: nextDesktop.rotation,
  }
}
