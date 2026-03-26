import { NextResponse } from 'next/server'
import { getStickerCatalog } from '@/lib/stickers-server'

export const revalidate = 3600

export async function GET() {
  const catalog = await getStickerCatalog()
  return NextResponse.json(catalog)
}
