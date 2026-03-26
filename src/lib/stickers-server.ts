import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import { formatStickerLabel, type StickerCatalog, type StickerCategory, type StickerDef } from '@/lib/stickers'

const STICKERS_DIR = path.join(process.cwd(), 'public', 'stickers')

function createStickerId(categoryId: string, fileName: string): string {
  const baseName = fileName.replace(/\.svg$/i, '')
  return `${categoryId}-${baseName}`
}

async function getStickerFiles(categoryId: string): Promise<StickerDef[]> {
  const categoryDir = path.join(STICKERS_DIR, categoryId)
  const entries = await readdir(categoryDir, { withFileTypes: true })

  return entries
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => {
      const baseName = entry.name.replace(/\.svg$/i, '')
      return {
        id: createStickerId(categoryId, entry.name),
        name: formatStickerLabel(baseName),
        category: categoryId,
        src: `/stickers/${categoryId}/${entry.name}`,
      }
    })
}

export const getStickerCatalog = cache(async (): Promise<StickerCatalog> => {
  const entries = await readdir(STICKERS_DIR, { withFileTypes: true })

  const categoryIds = entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b))

  const categories: StickerCategory[] = categoryIds.map(categoryId => ({
    id: categoryId,
    label: formatStickerLabel(categoryId),
  }))

  const stickerGroups = await Promise.all(categoryIds.map(getStickerFiles))

  return {
    categories,
    stickers: stickerGroups.flat(),
  }
})
