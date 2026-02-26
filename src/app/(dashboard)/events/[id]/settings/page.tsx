'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Event } from '@/types'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

const ACCENT_PRESETS = ['#C9A96E', '#D4956A', '#A8C5B8', '#D4AF37', '#E8A0A0', '#A0B4E8', '#B4A0E8', '#A0E8B4']

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [accentColor, setAccentColor] = useState('#C9A96E')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    supabase.from('events').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setEvent(data)
        setTitle(data.title)
        setDate(data.date ?? '')
        setLocation(data.location ?? '')
        setDescription(data.description ?? '')
        setAccentColor(data.accent_color)
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('events').update({
      title, date: date || null, location: location || null,
      description: description || null, accent_color: accentColor,
    }).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDelete() {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await supabase.from('events').delete().eq('id', id)
    router.push('/dashboard')
  }

  if (!event) return <p className="text-sm" style={{ color: '#9CA3AF' }}>Loading…</p>

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-8" style={{ color: '#1C1C1C' }}>Settings</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <Input label="Event title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="London, UK" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Description</label>
          <textarea
            className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
            style={{ borderColor: '#E5E5E4', minHeight: 80 }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Accent colour</label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAccentColor(color)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  background: color,
                  outline: accentColor === color ? `3px solid ${color}` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save changes'}
          </Button>
        </div>
      </form>

      <div className="mt-12 pt-8 border-t" style={{ borderColor: '#E5E5E4' }}>
        <h2 className="text-sm font-medium mb-2" style={{ color: '#1C1C1C' }}>Danger zone</h2>
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
          Deleting this event will remove all guests, contributions, and registry data. This cannot be undone.
        </p>
        <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:bg-red-50 hover:text-red-600">
          <Trash2 size={14} />
          Delete event
        </Button>
      </div>
    </div>
  )
}
