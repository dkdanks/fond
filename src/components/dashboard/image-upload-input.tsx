'use client'

import { useRef, useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

export function ImageUploadInput({
  value,
  onChange,
  eventId,
  supabase,
  placeholder = 'https://… or upload',
  showPreview = false,
}: {
  value: string
  onChange: (url: string) => void
  eventId: string
  supabase: ReturnType<typeof createClient>
  placeholder?: string
  showPreview?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const path = `${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { data, error } = await supabase.storage.from('event-images').upload(path, file, { upsert: false })
      if (error) throw error
      const { data: publicData } = supabase.storage.from('event-images').getPublicUrl(data.path)
      onChange(publicData.publicUrl)
    } catch {
      // Fall back to manual URL input if upload fails.
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className={`${inputCls} flex-1`}
        style={inputStyle}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {showPreview && value && (
        <div
          className="w-8 h-8 rounded-lg shrink-0 bg-cover bg-center border"
          style={{ backgroundImage: `url(${value})`, borderColor: '#E8E3D9' }}
        />
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="shrink-0 px-2.5 py-2 rounded-xl text-xs border transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FAFAF7' }}
        title="Upload photo"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
      </button>
    </div>
  )
}
