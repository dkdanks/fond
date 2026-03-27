import type { ImageUploadProfile, UploadedImageAsset } from '@/types'

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

export const IMAGE_UPLOAD_PROFILES: Record<ImageUploadProfile, {
  maxWidth: number
  maxHeight: number
  quality: number
  label: string
}> = {
  hero: {
    maxWidth: 2800,
    maxHeight: 2800,
    quality: 0.9,
    label: 'Hero image',
  },
  section: {
    maxWidth: 1800,
    maxHeight: 1800,
    quality: 0.88,
    label: 'Section image',
  },
  avatar: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.86,
    label: 'Portrait',
  },
  card: {
    maxWidth: 1400,
    maxHeight: 1400,
    quality: 0.86,
    label: 'Card image',
  },
}

export interface PreparedImageUpload {
  file: File
  path: string
  asset: Omit<UploadedImageAsset, 'url'>
}

function sanitizeFilename(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'image'
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('We could not read that image. Try a JPG, PNG, or WebP file.'))
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('We could not prepare that image for upload.'))
        return
      }
      resolve(blob)
    }, type, quality)
  })
}

export async function prepareImageUpload(
  file: File,
  {
    eventId,
    profile,
  }: {
    eventId: string
    profile: ImageUploadProfile
  }
): Promise<PreparedImageUpload> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  if (file.type === 'image/svg+xml') {
    throw new Error('SVG uploads are not supported for photos yet. Please use a JPG, PNG, or WebP image.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('That file is too large. Please choose an image smaller than 25 MB.')
  }

  const config = IMAGE_UPLOAD_PROFILES[profile]
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height

    if (!sourceWidth || !sourceHeight) {
      throw new Error('We could not read the dimensions of that image.')
    }

    const scale = Math.min(
      1,
      config.maxWidth / sourceWidth,
      config.maxHeight / sourceHeight,
    )

    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Your browser could not prepare that image.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    const blob = await canvasToBlob(canvas, 'image/webp', config.quality)
    const filename = `${sanitizeFilename(file.name)}.webp`
    const uploadFile = new File([blob], filename, { type: 'image/webp' })
    const path = `${eventId}/${profile}/${Date.now()}-${filename}`

    return {
      file: uploadFile,
      path,
      asset: {
        path,
        width,
        height,
        bytes: uploadFile.size,
        content_type: uploadFile.type,
        original_name: file.name,
        profile,
      },
    }
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('We could not prepare that image for upload.')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
