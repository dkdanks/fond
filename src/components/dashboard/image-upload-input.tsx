'use client'

import { useRef, useState } from 'react'
import { AlertCircle, ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ImageUploadProfile, UploadedImageAsset } from '@/types'
import { IMAGE_UPLOAD_PROFILES, prepareImageUpload } from '@/lib/image-upload'

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

export function ImageUploadInput({
  value,
  onChange,
  eventId,
  supabase,
  placeholder = 'https://… or upload',
  showPreview = false,
  profile = 'section',
  onUploadComplete,
}: {
  value: string
  onChange: (url: string) => void
  eventId: string
  supabase: ReturnType<typeof createClient>
  placeholder?: string
  showPreview?: boolean
  profile?: ImageUploadProfile
  onUploadComplete?: (asset: UploadedImageAsset) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'optimizing' | 'uploading'>('idle')
  const [error, setError] = useState<string | null>(null)
  const uploading = status !== 'idle'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setStatus('optimizing')
    try {
      const prepared = await prepareImageUpload(file, { eventId, profile })
      setStatus('uploading')
      const { data, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(prepared.path, prepared.file, {
          upsert: false,
          cacheControl: '31536000',
          contentType: prepared.file.type,
        })

      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('event-images').getPublicUrl(data.path)
      onChange(publicData.publicUrl)
      onUploadComplete?.({
        ...prepared.asset,
        url: publicData.publicUrl,
      })
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Upload failed. Please try again.'
      setError(
        message.toLowerCase().includes('bucket')
          ? 'Image uploads are not configured yet. The event-images storage bucket needs to be created in Supabase.'
          : message
      )
    } finally {
      setStatus('idle')
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          className={`${inputCls} flex-1`}
          style={inputStyle}
          placeholder={placeholder}
          value={value}
          onChange={e => {
            setError(null)
            onChange(e.target.value)
          }}
        />
        {showPreview && value && (
          <div
            className="w-8 h-8 rounded-lg shrink-0 bg-cover bg-center border"
            style={{ backgroundImage: `url(${value})`, borderColor: '#E8E3D9' }}
          />
        )}
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="shrink-0 px-2.5 py-2 rounded-xl text-xs border transition-colors"
          style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FAFAF7' }}
          title={`Upload ${IMAGE_UPLOAD_PROFILES[profile].label.toLowerCase()}`}
        >
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
        </button>
      </div>

      {(error || uploading) && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: error ? '#B42318' : '#8B8670' }}>
          {error ? <AlertCircle size={12} /> : <Loader2 size={12} className="animate-spin" />}
          <span>
            {error
              ? error
              : status === 'optimizing'
                ? `Preparing ${IMAGE_UPLOAD_PROFILES[profile].label.toLowerCase()}...`
                : 'Uploading image...'}
          </span>
        </div>
      )}
    </div>
  )
}
