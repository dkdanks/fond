'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DashboardPage, DashboardPageHeader, DashboardSectionLabel } from '@/components/dashboard/page-layout'
import { DashboardCard } from '@/components/dashboard/surface'
import { guardEvent } from '@/lib/event-guard'
import type { Event, EventType } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'
import { Trash2 } from 'lucide-react'

type GoogleAutocomplete = {
  getPlace: () => { formatted_address?: string; name?: string } | undefined
  addListener: (eventName: string, handler: () => void) => void
}

type GoogleMapsPlaces = {
  Autocomplete: new (
    input: HTMLInputElement,
    options: { types: string[] }
  ) => GoogleAutocomplete
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: GoogleMapsPlaces
      }
    }
  }
}

const TIMEZONES = [
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Pacific/Auckland',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
]

const inputCls = 'w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }
const labelStyle: React.CSSProperties = { color: '#8B8670' }
const cardStyle: React.CSSProperties = { background: 'white', borderColor: '#E8E3D9' }

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [timezone, setTimezone] = useState('Australia/Sydney')
  const [hostName, setHostName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null)

  const autoSave = useCallback(async (patch: Record<string, unknown>) => {
    await supabase.from('events').update(patch as Record<string, unknown>).eq('id', id)
  }, [id, supabase])

  const autoSaveContent = useCallback(async (contentPatch: Record<string, unknown>) => {
    const { data: ev } = await supabase.from('events').select('content').eq('id', id).single()
    const existing = (ev?.content as Record<string, unknown>) ?? {}
    await supabase.from('events').update({ content: { ...existing, ...contentPatch } } as Record<string, unknown>).eq('id', id)
  }, [id, supabase])

  const initAutocomplete = useCallback(() => {
    const googleMaps = window.google?.maps?.places
    if (!googleMaps || !locationInputRef.current || autocompleteRef.current) return

    try {
      autocompleteRef.current = new googleMaps.Autocomplete(locationInputRef.current, {
        types: ['geocode', 'establishment'],
      })
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        const addr = place?.formatted_address ?? place?.name ?? ''
        if (addr) {
          setLocation(addr)
          void autoSave({ location: addr })
        }
      })
    } catch {
      // Google Maps may still be booting; retry on the next effect pass.
    }
  }, [autoSave])

  // Load event
  useEffect(() => {
    async function load() {
      const userId = await guardEvent(id)
      if (!userId) {
        return
      }
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      if (data) {
        setEvent(data)
        setTitle(data.title ?? '')
        const dt = data.date ?? ''
        if (dt.includes('T')) {
          setDate(dt.split('T')[0])
          setTime(dt.split('T')[1]?.slice(0, 5) ?? '')
        } else {
          setDate(dt)
        }
        setLocation(data.location ?? '')
        const content = data.content as Record<string, unknown> | null
        setTimezone((content?.timezone as string) ?? 'Australia/Sydney')
        setHostName((content?.host_name as string) ?? '')
        setSlug(data.slug ?? '')
      }
    }
    load()
  }, [id, supabase])

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return // gracefully skip if no API key
    if (document.getElementById('google-maps-script')) {
      initAutocomplete()
      return
    }
    const script = document.createElement('script')
    script.id = 'google-maps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => initAutocomplete()
    document.head.appendChild(script)
  }, [initAutocomplete])

  // Re-init if input appears after script already loaded
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return
    if (window.google?.maps?.places && locationInputRef.current && !autocompleteRef.current) {
      initAutocomplete()
    }
  }, [event, initAutocomplete])

  function flashSaved(field: string) {
    setSavedField(field)
    setTimeout(() => setSavedField(f => (f === field ? null : f)), 2000)
  }

  // Slug availability check (debounced)
  const checkSlug = useCallback((value: string) => {
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    if (!value || value === event?.slug) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    slugDebounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(value)}&exclude=${id}`)
      const json = await res.json()
      setSlugStatus(json.available ? 'available' : 'taken')
    }, 500)
  }, [event?.slug, id])

  async function handleSlugBlur() {
    if (!slug || slug === event?.slug) return
    const isValid = /^[a-z0-9-]{3,}$/.test(slug)
    if (!isValid) return
    if (slugStatus === 'taken' || slugStatus === 'checking') return
    await autoSave({ slug })
    setEvent(prev => prev ? { ...prev, slug } : prev)
    flashSaved('slug')
  }

  async function handleStatusToggle() {
    if (!event) return
    const newStatus = event.status === 'published' ? 'draft' : 'published'
    await autoSave({ status: newStatus })
    setEvent(prev => prev ? { ...prev, status: newStatus } : prev)
    flashSaved('status')
  }

  async function handleDelete() {
    await supabase.from('events').delete().eq('id', id)
    router.push('/dashboard')
  }

  const slugValid = /^[a-z0-9-]{3,}$/.test(slug)

  if (!event) return <p className="text-sm px-8 py-8" style={{ color: '#B5A98A' }}>Loading…</p>

  return (
    <DashboardPage width="narrow" className="md:px-8">
      <DashboardPageHeader title="Settings" />

      {/* Event details */}
      <DashboardSectionLabel>Event details</DashboardSectionLabel>
      <DashboardCard className="p-6 mb-4" style={cardStyle as never}>
        {/* Title */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Event title</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={async () => {
              if (title !== event.title) {
                await autoSave({ title })
                setEvent(prev => prev ? { ...prev, title } : prev)
                flashSaved('title')
              }
            }}
          />
          {savedField === 'title' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
        </div>

        {/* Event type — read only badge */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Event type</label>
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: '#F5F0E8', color: '#8B8670', border: '1px solid #E8E3D9' }}
          >
            {EVENT_TYPE_LABELS[event.type as EventType]}
          </span>
        </div>

        {/* Date + time */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Date</label>
            <input
              type="date"
              className={inputCls}
              style={inputStyle}
              value={date}
              onChange={e => setDate(e.target.value)}
              onBlur={async () => {
                const combined = date ? (time ? `${date}T${time}:00` : date) : null
                await autoSave({ date: combined })
                flashSaved('date')
              }}
            />
            {savedField === 'date' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Time</label>
            <input
              type="time"
              className={inputCls}
              style={inputStyle}
              value={time}
              onChange={e => setTime(e.target.value)}
              onBlur={async () => {
                const combined = date ? (time ? `${date}T${time}:00` : date) : null
                await autoSave({ date: combined })
                flashSaved('time')
              }}
            />
            {savedField === 'time' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
          </div>
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Location</label>
          <input
            ref={locationInputRef}
            className={inputCls}
            style={inputStyle}
            value={location}
            onChange={e => setLocation(e.target.value)}
            onBlur={async () => {
              if (location !== event.location) {
                await autoSave({ location: location || null })
                flashSaved('location')
              }
            }}
            placeholder="Start typing an address…"
          />
          {savedField === 'location' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Timezone</label>
          <select
            className={inputCls}
            style={inputStyle}
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            onBlur={async () => {
              await autoSaveContent({ timezone })
              flashSaved('timezone')
            }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          {savedField === 'timezone' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
        </div>
      </DashboardCard>

      {/* Host */}
      <DashboardSectionLabel className="mt-6">Host</DashboardSectionLabel>
      <DashboardCard className="p-6 mb-4" style={cardStyle as never}>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Host name</label>
          <input
            className={inputCls}
            style={inputStyle}
            value={hostName}
            onChange={e => setHostName(e.target.value)}
            onBlur={async () => {
              await autoSaveContent({ host_name: hostName })
              flashSaved('hostName')
            }}
            placeholder="The name shown to guests"
          />
          {savedField === 'hostName' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
        </div>
      </DashboardCard>

      {/* URL & slug */}
      <DashboardSectionLabel className="mt-6">Event URL</DashboardSectionLabel>
      <DashboardCard className="p-6 mb-4" style={cardStyle as never}>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Shareable slug</label>
          <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}>
            <span className="px-3 py-2.5 text-sm shrink-0" style={{ color: '#B5A98A', borderRight: '1px solid #E8E3D9' }}>
              yourdomain.com/e/
            </span>
            <input
              className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent"
              style={{ color: '#2C2B26' }}
              value={slug}
              onChange={e => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                setSlug(val)
                checkSlug(val)
              }}
              onBlur={handleSlugBlur}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs" style={{ color: '#B5A98A' }}>
              Only lowercase letters, numbers, and hyphens. Min 3 characters.
            </p>
            {slug && slug !== event.slug && (
              <span className="text-xs font-medium" style={{
                color: slugStatus === 'available' ? '#4CAF50'
                  : slugStatus === 'taken' ? '#EF4444'
                  : '#B5A98A'
              }}>
                {slugStatus === 'checking' ? 'Checking…'
                  : slugStatus === 'available' ? 'Available'
                  : slugStatus === 'taken' ? 'Taken'
                  : null}
              </span>
            )}
          </div>
          {!slugValid && slug.length > 0 && (
            <p className="text-xs mt-1" style={{ color: '#EF4444' }}>Slug must be at least 3 characters and use only lowercase letters, numbers, and hyphens.</p>
          )}
          {savedField === 'slug' && <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>Saved</p>}
        </div>
      </DashboardCard>

      {/* Publish / Draft toggle */}
      <DashboardSectionLabel className="mt-6">Visibility</DashboardSectionLabel>
      <DashboardCard className="p-6 mb-4" style={cardStyle as never}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>
              {event.status === 'published' ? 'Live' : 'Draft'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#8B8670' }}>
              {event.status === 'published'
                ? 'Your event page is visible to guests.'
                : 'Your event is not visible to guests yet.'}
            </p>
          </div>
          <button
            onClick={handleStatusToggle}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={event.status === 'published'
              ? { background: '#F5F0E8', color: '#8B8670', border: '1px solid #E8E3D9' }
              : { background: '#2C2B26', color: 'white' }
            }
          >
            {event.status === 'published' ? 'Draft (take offline)' : 'Make live'}
          </button>
        </div>
        {savedField === 'status' && <p className="text-xs mt-3" style={{ color: '#4CAF50' }}>Saved</p>}
      </DashboardCard>

      {/* Danger zone */}
      <DashboardSectionLabel tone="danger" className="mt-6">Danger zone</DashboardSectionLabel>
      <div className="rounded-2xl border p-6 mb-4" style={{ background: 'white', borderColor: '#FECACA' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Delete event</p>
            <p className="text-xs mt-0.5" style={{ color: '#8B8670' }}>Permanently remove this event and all its data.</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
        >
          <div className="rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl" style={{ background: 'white' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#2C2B26' }}>
              Delete &ldquo;{event.title}&rdquo;?
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8B8670' }}>
              This will permanently delete the event, all guests, contributions, and all associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FAFAF7' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: '#EF4444', color: 'white' }}
              >
                Delete event
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  )
}
