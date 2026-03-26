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
