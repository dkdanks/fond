'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronDown, ChevronRight, GripVertical, Plus, Trash2, Monitor, Smartphone,
  Share2, X, Check, Loader2, Eye, EyeOff, ImageIcon,
  Home, BookOpen, CalendarDays, Users, Shirt, MapPin, Gift, HelpCircle, Crown
} from 'lucide-react'
import type {
  Event, EventContent, EventType, ScheduleItem, FaqItem,
  WeddingPartyMember, TravelCard
} from '@/types'
import { formatDate } from '@/lib/utils'

// ─── Constants ──────────────────────────────────────────────────────────────

const PALETTES = [
  { name: 'Forest',  primary: '#2D4A3E', bg: '#EBF2EC' },
  { name: 'Blush',   primary: '#7B3654', bg: '#FDF0F5' },
  { name: 'Navy',    primary: '#1B3A5C', bg: '#EFF4FA' },
  { name: 'Slate',   primary: '#334155', bg: '#F1F5F9' },
  { name: 'Earth',   primary: '#4A3728', bg: '#F5EDE0' },
  { name: 'Sage',    primary: '#3D5A48', bg: '#EFF5F0' },
  { name: 'Noir',    primary: '#1A1A1A', bg: '#FAFAFA' },
  { name: 'Custom',  primary: '#2C2B26', bg: '#FAFAF7' },
]

const FONTS = [
  { name: 'Playfair', value: 'Playfair Display', class: 'font-playfair' },
  { name: 'Cormorant', value: 'Cormorant Garamond', class: 'font-cormorant' },
  { name: 'Lora', value: 'Lora', class: 'font-lora' },
  { name: 'EB Garamond', value: 'EB Garamond', class: 'font-garamond' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville', class: 'font-baskerville' },
  { name: 'Crimson Text', value: 'Crimson Text', class: 'font-crimson' },
  { name: 'Josefin Sans', value: 'Josefin Sans', class: 'font-josefin' },
  { name: 'Montserrat', value: 'Montserrat', class: 'font-montserrat' },
  { name: 'Raleway', value: 'Raleway', class: 'font-raleway' },
  { name: 'DM Serif Display', value: 'DM Serif Display', class: 'font-dm-serif' },
  { name: 'Italiana', value: 'Italiana', class: 'font-italiana' },
  { name: 'Great Vibes', value: 'Great Vibes', class: 'font-great-vibes' },
]

type SectionKey = 'welcome' | 'story' | 'schedule' | 'wedding_party' | 'attire' | 'travel' | 'registry' | 'faq'

const SECTIONS_BY_TYPE: Record<EventType, SectionKey[]> = {
  wedding:      ['welcome', 'story', 'schedule', 'wedding_party', 'attire', 'travel', 'registry', 'faq'],
  baby_shower:  ['welcome', 'story', 'schedule', 'registry', 'faq'],
  birthday:     ['welcome', 'schedule', 'registry', 'faq'],
  mitzvah:      ['welcome', 'story', 'schedule', 'attire', 'travel', 'registry', 'faq'],
  housewarming: ['welcome', 'schedule', 'registry', 'faq'],
}

const SECTION_LABELS: Record<SectionKey, string> = {
  welcome:       'Welcome',
  story:         'Our Story',
  schedule:      'Schedule',
  wedding_party: 'Wedding Party',
  attire:        'Attire',
  travel:        'Travel',
  registry:      'Registry',
  faq:           'FAQ',
}

const SECTION_ICONS: Record<SectionKey, React.ElementType> = {
  welcome:       Home,
  story:         BookOpen,
  schedule:      CalendarDays,
  wedding_party: Crown,
  attire:        Shirt,
  travel:        MapPin,
  registry:      Gift,
  faq:           HelpCircle,
}

const SCHEDULE_SUGGESTIONS = [
  'Ceremony', 'Reception', 'Wedding Breakfast', 'Dinner', 'Luncheon',
  'Rehearsal Dinner', 'After Party', 'Day-after Brunch',
]
const DRESS_CODES = [
  'Black tie', 'Black tie optional', 'Cocktail', 'Smart casual',
  'Casual', 'Garden party', 'Beach formal',
]
const PARTY_ROLES: WeddingPartyMember['role'][] = [
  'maid_of_honour', 'best_man', 'bridesmaid', 'groomsman',
  'ring_bearer', 'flower_person', 'other',
]
const ROLE_LABELS: Record<WeddingPartyMember['role'], string> = {
  maid_of_honour: 'Maid of Honour',
  best_man:       'Best Man',
  bridesmaid:     'Bridesmaid',
  groomsman:      'Groomsman',
  ring_bearer:    'Ring Bearer',
  flower_person:  'Flower Person',
  other:          'Other',
}

function uid() { return Math.random().toString(36).slice(2, 10) }

// ─── Small helpers ───────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className="w-10 h-6 rounded-full relative cursor-pointer transition-colors shrink-0"
      style={{ background: on ? '#2C2B26' : '#E8E3D9' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }
const textareaCls = 'w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none transition-colors focus:border-[#2C2B26]'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>
      {children}
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// ─── Image Upload Input ───────────────────────────────────────────────────────

function ImageUploadInput({ value, onChange, placeholder = 'https://…', eventId, supabase }: {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  eventId: string
  supabase: ReturnType<typeof createClient>
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
      const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(data.path)
      onChange(publicUrl)
    } catch {
      // Fall back to URL input
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
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#8B8670', background: '#FAFAF7' }}
        title="Upload from device"
      >
        {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
      </button>
    </div>
  )
}

// ─── Event Preview ───────────────────────────────────────────────────────────

interface PreviewProps {
  event: Event
  content: EventContent
  primaryColor: string
  bgColor: string
  font: string
  hiddenSections: string[]
  sectionOrder: string[]
  onSectionClick: (s: string) => void
}

function PhotoGrid({ images }: { images: string[] }) {
  const imgs = images.filter(Boolean)
  if (imgs.length === 0) return null
  if (imgs.length === 1) {
    return (
      <div className="mt-10">
        <div className="aspect-[16/9] rounded-2xl bg-cover bg-center w-full" style={{ backgroundImage: `url(${imgs[0]})` }} />
      </div>
    )
  }
  if (imgs.length === 2) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-3">
        {imgs.map((img, i) => (
          <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
        ))}
      </div>
    )
  }
  if (imgs.length === 3) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-3">
        <div className="row-span-2 aspect-[3/4] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${imgs[0]})` }} />
        <div className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${imgs[1]})` }} />
        <div className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${imgs[2]})` }} />
      </div>
    )
  }
  // 4+: 2x2 grid
  return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      {imgs.slice(0, 4).map((img, i) => (
        <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
      ))}
    </div>
  )
}

function EventPreview({ event, content, primaryColor, bgColor, font, hiddenSections, sectionOrder, onSectionClick }: PreviewProps) {
  const c = content
  const hasStory = c.our_story?.introduction || c.our_story?.story
  const hasSchedule = c.schedule && c.schedule.length > 0
  const hasParty = c.wedding_party?.members && c.wedding_party.members.length > 0
  const hasAttire = c.attire?.dress_code || c.attire?.notes
  const hasTravel = c.travel?.notes || (c.travel?.cards && c.travel.cards.length > 0)
  const hasFaq = c.faq && c.faq.length > 0
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const sectionClick = (s: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onSectionClick(s)
  }

  const isHidden = (s: string) => hiddenSections.includes(s)

  return (
    <div style={{ fontFamily: `'${font}', serif`, background: bgColor, color: primaryColor }}>
      {/* Inject Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Hero */}
      {!isHidden('welcome') && (
        <section
          onClick={sectionClick('welcome')}
          className="cursor-pointer group relative px-8 py-20 text-center"
          style={{ background: bgColor }}
          title="Click to edit Welcome"
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"
            style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
          />
          <h1 className="text-4xl font-semibold mb-3" style={{ letterSpacing: '-0.02em' }}>{event.title}</h1>
          {(event.date || event.location) && (
            <p className="text-sm mb-8 opacity-60">
              {event.date && formatDate(event.date)}
              {event.date && event.location && ' · '}
              {event.location}
            </p>
          )}
          {c.welcome?.greeting && (
            <p className="text-lg leading-relaxed max-w-xl mx-auto mb-10 opacity-80" style={{ fontStyle: 'italic' }}>
              {c.welcome.greeting}
            </p>
          )}
          {c.welcome?.show_rsvp !== false && (
            <div className="flex items-center justify-center gap-4">
              <button
                className="px-8 py-3 rounded-full text-sm font-medium"
                style={{ background: primaryColor, color: bgColor }}
              >
                {c.welcome?.rsvp_button_text || 'RSVP'}
              </button>
              {c.welcome?.rsvp_deadline && (
                <p className="text-xs opacity-50">Deadline: {formatDate(c.welcome.rsvp_deadline)}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Render non-welcome sections in sectionOrder */}
      {sectionOrder.filter(k => k !== 'welcome').map(key => {
        if (isHidden(key as SectionKey)) return null

        if (key === 'story') {
          if (!hasStory) return null
          return (
            <section key="story"
              onClick={sectionClick('story')}
              className="cursor-pointer group relative px-8 py-16 border-t"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit Our Story"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">Our Story</p>
              <div className="max-w-2xl mx-auto">
                {c.our_story?.introduction && (
                  <p className="text-lg leading-relaxed mb-6 font-medium">{c.our_story.introduction}</p>
                )}
                {c.our_story?.story && (
                  <p className="text-base leading-relaxed opacity-70">{c.our_story.story}</p>
                )}
                <PhotoGrid images={c.our_story?.images ?? []} />
              </div>
            </section>
          )
        }

        if (key === 'schedule') {
          if (!hasSchedule) return null
          return (
            <section key="schedule"
              onClick={sectionClick('schedule')}
              className="cursor-pointer group relative px-8 py-16 border-t"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit Schedule"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-10 opacity-40 text-center">Schedule</p>
              <div className="max-w-2xl mx-auto grid gap-8">
                {(c.schedule ?? []).map(item => (
                  <div key={item.id} className="flex gap-6">
                    <div className="text-right shrink-0 w-20">
                      <p className="text-sm font-medium opacity-50">{item.time}</p>
                    </div>
                    <div className="flex-1 border-l pl-6" style={{ borderColor: `${primaryColor}20` }}>
                      <p className="font-semibold mb-1">{item.title}</p>
                      {item.venue && <p className="text-sm opacity-60">{item.venue}</p>}
                      {item.address && <p className="text-xs opacity-40">{item.address}</p>}
                      {item.notes && <p className="text-sm mt-2 opacity-60 italic">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (key === 'wedding_party') {
          if (!hasParty) return null
          return (
            <section key="wedding_party"
              onClick={sectionClick('wedding_party')}
              className="cursor-pointer group relative px-8 py-16 border-t"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit Wedding Party"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-40 text-center">Wedding Party</p>
              {c.wedding_party?.introduction && (
                <p className="text-center text-base opacity-60 mb-10 max-w-lg mx-auto">{c.wedding_party.introduction}</p>
              )}
              <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto">
                {(c.wedding_party?.members ?? []).map(m => (
                  <div key={m.id} className="text-center">
                    <div
                      className="w-20 h-20 rounded-full mx-auto mb-3 bg-cover bg-center"
                      style={{
                        backgroundImage: m.photo_url ? `url(${m.photo_url})` : undefined,
                        background: m.photo_url ? undefined : `${primaryColor}15`,
                      }}
                    />
                    <p className="font-medium text-sm">{m.name || ROLE_LABELS[m.role]}</p>
                    <p className="text-xs opacity-40 mt-0.5">{ROLE_LABELS[m.role]}</p>
                    {m.story && <p className="text-xs opacity-50 mt-2 leading-relaxed px-1">{m.story}</p>}
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (key === 'attire') {
          if (!hasAttire) return null
          return (
            <section key="attire"
              onClick={sectionClick('attire')}
              className="cursor-pointer group relative px-8 py-16 border-t text-center"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit Attire"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-6 opacity-40">Attire</p>
              {c.attire?.dress_code && <p className="text-2xl font-semibold mb-3">{c.attire.dress_code}</p>}
              {c.attire?.notes && <p className="text-sm opacity-60 max-w-md mx-auto">{c.attire.notes}</p>}
            </section>
          )
        }

        if (key === 'travel') {
          if (!hasTravel) return null
          return (
            <section key="travel"
              onClick={sectionClick('travel')}
              className="cursor-pointer group relative px-8 py-16 border-t"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit Travel"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">Getting There</p>
              <div className="max-w-2xl mx-auto">
                {c.travel?.notes && <p className="text-base opacity-70 mb-8 leading-relaxed">{c.travel.notes}</p>}
                {c.travel?.cards && c.travel.cards.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {c.travel.cards.map(card => (
                      <div key={card.id} className="rounded-2xl p-5 border" style={{ borderColor: `${primaryColor}15` }}>
                        <p className="text-xs uppercase tracking-wide opacity-40 mb-2">
                          {card.type === 'hotel' ? 'Hotel' : card.type === 'car_rental' ? 'Car Rental' : 'Note'}
                        </p>
                        {card.name && <p className="font-semibold mb-1">{card.name}</p>}
                        {card.address && <p className="text-xs opacity-50 mb-2">{card.address}</p>}
                        {card.notes && <p className="text-sm opacity-60 mb-3">{card.notes}</p>}
                        {card.website && (
                          <a className="text-xs font-medium underline" style={{ color: primaryColor }}>
                            {card.button_text || 'Learn more'}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        }

        if (key === 'registry') {
          return (
            <section key="registry"
              onClick={sectionClick('registry')}
              className="cursor-pointer group relative px-8 py-16 border-t text-center"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit Registry"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-6 opacity-40">Registry</p>
              {c.registry?.note && (
                <p className="text-base opacity-70 max-w-xl mx-auto mb-8 leading-relaxed">{c.registry.note}</p>
              )}
              <button
                className="px-8 py-3 rounded-full text-sm font-medium border"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {c.registry?.button_text || 'View registry'}
              </button>
            </section>
          )
        }

        if (key === 'faq') {
          if (!hasFaq) return null
          return (
            <section key="faq"
              onClick={sectionClick('faq')}
              className="cursor-pointer group relative px-8 py-16 border-t"
              style={{ borderColor: `${primaryColor}15` }}
              title="Click to edit FAQ"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
              />
              <p className="text-xs font-semibold uppercase tracking-widest mb-10 opacity-40 text-center">FAQ</p>
              <div className="max-w-2xl mx-auto flex flex-col gap-0">
                {(c.faq ?? []).map(item => (
                  <div
                    key={item.id}
                    className="border-t py-5"
                    style={{ borderColor: `${primaryColor}15` }}
                    onClick={e => { e.stopPropagation(); setOpenFaq(openFaq === item.id ? null : item.id) }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.question}</p>
                      <ChevronDown
                        size={16}
                        className="transition-transform shrink-0 ml-4"
                        style={{ opacity: 0.4, transform: openFaq === item.id ? 'rotate(180deg)' : 'none' }}
                      />
                    </div>
                    {openFaq === item.id && (
                      <p className="text-sm mt-3 leading-relaxed" style={{ opacity: 0.65 }}>{item.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (key.startsWith('custom_')) {
          const customId = key.replace('custom_', '')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cs = (c as any).custom_sections?.find((s: any) => s.id === customId)
          if (!cs) return null
          return (
            <section key={key}
              onClick={e => { e.stopPropagation(); onSectionClick(key) }}
              className="cursor-pointer group relative px-8 py-16 border-t"
              style={{ borderColor: `${primaryColor}15` }}
              title={`Click to edit ${cs.title}`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">{cs.title}</p>
              <div className="max-w-2xl mx-auto">
                {cs.text && <p className="text-base leading-relaxed opacity-70">{cs.text}</p>}
                {cs.images?.filter(Boolean).length > 0 && (
                  <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cs.images.filter(Boolean).length, 2)}, 1fr)` }}>
                    {cs.images.filter(Boolean).map((img: string, i: number) => (
                      <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${img})` }} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        }

        return null
      })}

      {/* Footer */}
      <div className="py-8 text-center border-t" style={{ borderColor: `${primaryColor}10` }}>
        <p className="text-xs opacity-25">Powered by Joyabl</p>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function WebsiteEditorPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [content, setContent] = useState<EventContent>({})
  const [primaryColor, setPrimaryColor] = useState('#2C2B26')
  const [bgColor, setBgColor] = useState('#F5F0E8')
  const [paletteKey, setPaletteKey] = useState<string>('Forest')
  const [customPrimary, setCustomPrimary] = useState('#2C2B26')
  const [customBg, setCustomBg] = useState('#FAFAF7')
  const [font, setFont] = useState('Playfair Display')
  const [tab, setTab] = useState<'design' | 'content'>('design')
  const [activeSection, setActiveSection] = useState<string | null>('welcome')
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [showShare, setShowShare] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [passwordEnabled, setPasswordEnabled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<string[]>([])
  const [hiddenSections, setHiddenSections] = useState<string[]>([])
  const [dragItem, setDragItem] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [addingSectionTitle, setAddingSectionTitle] = useState('')
  const [showAddSection, setShowAddSection] = useState(false)
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPatch = useRef<Record<string, unknown>>({})
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Load
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('events').select('*').eq('id', id).single()
      if (!data) return
      setEvent(data as Event)
      setContent((data.content as EventContent) ?? {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedPalette = (data.content as any)?._palette
      const restoredPrimary = savedPalette?.primary ?? data.primary_color ?? '#2C2B26'
      const restoredBg = savedPalette?.bg ?? data.accent_color ?? '#F5F0E8'
      setPrimaryColor(restoredPrimary)
      setBgColor(restoredBg)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedPaletteKey = (data.content as any)?._paletteKey
      if (savedPaletteKey) {
        setPaletteKey(savedPaletteKey)
        if (savedPaletteKey === 'Custom') {
          setCustomPrimary(restoredPrimary)
          setCustomBg(restoredBg)
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedFont = (data.content as any)?._font
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFont(savedFont ?? (data as any).font_family ?? 'Playfair Display')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pw = (data as any).access_password ?? ''
      setSharePassword(pw)
      setPasswordEnabled(!!pw)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedOrder = (data.content as any)?._section_order
      setSectionOrder(savedOrder?.length ? savedOrder : SECTIONS_BY_TYPE[data.type as EventType] ?? SECTIONS_BY_TYPE.wedding)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedHidden = (data.content as any)?._hidden_sections
      setHiddenSections(savedHidden ?? [])
    }
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save (debounced 800ms) — accumulates patches
  function scheduleSave(patch: Record<string, unknown>) {
    pendingPatch.current = { ...pendingPatch.current, ...patch }
    setSaveState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const toSave = { ...pendingPatch.current }
      pendingPatch.current = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('events').update(toSave as any).eq('id', id)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    }, 800)
  }

  function updateContent(patch: Partial<EventContent>) {
    setContent(prev => {
      const next = { ...prev, ...patch }
      scheduleSave({ content: next })
      return next
    })
  }

  function setPalette(primary: string, bg: string, key: string) {
    setPrimaryColor(primary)
    setBgColor(bg)
    setPaletteKey(key)
    setContent(prev => {
      const next = { ...prev, _palette: { primary, bg }, _paletteKey: key }
      scheduleSave({ primary_color: primary, accent_color: bg, content: next })
      return next
    })
  }

  function setFontFamily(f: string) {
    setFont(f)
    setContent(prev => {
      const next = { ...prev, _font: f }
      scheduleSave({ font_family: f, content: next })
      return next
    })
  }

  function openSection(s: string) {
    setTab('content')
    setActiveSection(s as SectionKey)
    setTimeout(() => {
      sectionRefs.current[s]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function dropSection(onto: string) {
    if (!dragItem || dragItem === onto || onto === 'welcome') return
    setSectionOrder(prev => {
      const next = [...prev]
      const from = next.indexOf(dragItem)
      const to = next.indexOf(onto)
      // Never allow moving above welcome (index 0)
      const clampedTo = Math.max(1, to)
      next.splice(from, 1)
      next.splice(clampedTo, 0, dragItem)
      const newContent = { ...content, _section_order: next }
      pendingPatch.current = { ...pendingPatch.current, content: newContent }
      setSaveState('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const toSave = { ...pendingPatch.current }
        pendingPatch.current = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('events').update(toSave as any).eq('id', id)
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      }, 800)
      return next
    })
    setDragItem(null)
    setDragOver(null)
  }

  function toggleHidden(key: string) {
    setHiddenSections(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      const newContent = { ...content, _hidden_sections: next }
      pendingPatch.current = { ...pendingPatch.current, content: newContent }
      setSaveState('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const toSave = { ...pendingPatch.current }
        pendingPatch.current = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from('events').update(toSave as any).eq('id', id)
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      }, 800)
      return next
    })
  }

  async function saveShare() {
    try {
      const password = passwordEnabled ? sharePassword : null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('events').update({ access_password: password } as any).eq('id', id)
    } catch {
      // Column may not exist yet — fail silently
    }
    setShowShare(false)
  }

  function copyUrl() {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/e/${event?.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/e/${event?.slug}`

  // ── Schedule helpers ─────────────────────────────────────────────────────
  function addScheduleItem() {
    updateContent({
      schedule: [
        ...(content.schedule ?? []),
        { id: uid(), title: '', time: '', venue: '', address: '', notes: '' },
      ],
    })
  }
  function updateScheduleItem(idx: number, field: keyof ScheduleItem, val: string) {
    const items = [...(content.schedule ?? [])]
    items[idx] = { ...items[idx], [field]: val }
    updateContent({ schedule: items })
  }
  function removeScheduleItem(idx: number) {
    updateContent({ schedule: (content.schedule ?? []).filter((_, i) => i !== idx) })
  }

  // ── FAQ helpers ──────────────────────────────────────────────────────────
  function addFaq() {
    updateContent({ faq: [...(content.faq ?? []), { id: uid(), question: '', answer: '' }] })
  }
  function updateFaq(idx: number, field: keyof FaqItem, val: string) {
    const items = [...(content.faq ?? [])]
    items[idx] = { ...items[idx], [field]: val }
    updateContent({ faq: items })
  }
  function removeFaq(idx: number) {
    updateContent({ faq: (content.faq ?? []).filter((_, i) => i !== idx) })
  }

  // ── Travel helpers ───────────────────────────────────────────────────────
  function addTravelCard() {
    const cards = [...(content.travel?.cards ?? [])]
    cards.push({ id: uid(), type: 'hotel', name: '', address: '', website: '', notes: '', button_text: 'Learn more' })
    updateContent({ travel: { ...content.travel, cards } })
  }
  function updateTravelCard(idx: number, field: keyof TravelCard, val: string) {
    const cards = [...(content.travel?.cards ?? [])]
    cards[idx] = { ...cards[idx], [field]: val }
    updateContent({ travel: { ...content.travel, cards } })
  }
  function removeTravelCard(idx: number) {
    const cards = (content.travel?.cards ?? []).filter((_, i) => i !== idx)
    updateContent({ travel: { ...content.travel, cards } })
  }

  // ── Wedding party helpers ────────────────────────────────────────────────
  function updatePartyMember(idx: number, field: keyof WeddingPartyMember, val: string) {
    const members = [...(content.wedding_party?.members ?? [])]
    members[idx] = { ...members[idx], [field]: val }
    updateContent({ wedding_party: { ...content.wedding_party, members } })
  }
  function addPartyMember() {
    const members = [...(content.wedding_party?.members ?? [])]
    members.push({ id: uid(), role: 'other', name: '', photo_url: '', story: '' })
    updateContent({ wedding_party: { ...content.wedding_party, members } })
  }
  function removePartyMember(idx: number) {
    const members = (content.wedding_party?.members ?? []).filter((_, i) => i !== idx)
    updateContent({ wedding_party: { ...content.wedding_party, members } })
  }

  // ── Custom section helpers ───────────────────────────────────────────────
  function addCustomSection(title: string) {
    const id = uid()
    const newSection = { id, title, text: '', images: ['', '', '', ''] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = (content as any).custom_sections ?? []
    updateContent({ custom_sections: [...existing, newSection] } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    const newKey = `custom_${id}` as SectionKey
    setSectionOrder(prev => {
      const next = [...prev, newKey]
      setContent(c => {
        const updated = { ...c, _section_order: next }
        pendingPatch.current = { ...pendingPatch.current, content: updated }
        return updated
      })
      return next
    })
    setActiveSection(newKey)
  }

  function updateCustomSection(id: string, field: 'title' | 'text', value: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = (content as any).custom_sections ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = existing.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
    updateContent({ custom_sections: updated } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  function updateCustomSectionImage(id: string, imgIdx: number, url: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = (content as any).custom_sections ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = existing.map((s: any) => {
      if (s.id !== id) return s
      const images = [...(s.images ?? ['', '', '', ''])]
      images[imgIdx] = url
      return { ...s, images }
    })
    updateContent({ custom_sections: updated } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  function removeCustomSection(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing: any[] = (content as any).custom_sections ?? []
    updateContent({ custom_sections: existing.filter((s: any) => s.id !== id) } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    const key = `custom_${id}` as SectionKey
    setSectionOrder(prev => prev.filter(k => k !== key))
  }

  if (!event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={20} className="animate-spin" style={{ color: '#B5A98A' }} />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F5F0E8' }}>

      {/* ── PREVIEW (left, flex-1) ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
          style={{ background: 'white', borderColor: '#E8E3D9' }}
        >
          {/* Viewport toggle */}
          <div className="hidden md:flex items-center gap-1 p-0.5 rounded-xl" style={{ background: '#F5F0E8' }}>
            {(['desktop', 'mobile'] as const).map(v => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: viewport === v ? 'white' : 'transparent',
                  color: viewport === v ? '#2C2B26' : '#8B8670',
                  boxShadow: viewport === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {v === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
                {v === 'desktop' ? 'Desktop' : 'Mobile'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
              style={{ background: '#2C2B26', color: 'white' }}
              onClick={() => setMobileEditorOpen(true)}
            >
              Edit
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
            >
              <Share2 size={12} /> Share
            </button>
            <a
              href={eventUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: '#2C2B26', color: 'white' }}
            >
              <Eye size={12} /> Preview
            </a>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start" style={{ background: '#E8E3D9' }}>
          <div
            className="rounded-2xl shadow-2xl transition-all duration-300 w-full overflow-hidden"
            style={{ maxWidth: viewport === 'mobile' ? 390 : 900, background: bgColor }}
          >
            {/* Browser chrome bar */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 border-b"
              style={{ background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(0,0,0,0.06)' }}
            >
              <div className="flex gap-1.5">
                {['#FF5F57', '#FFBD2E', '#28CA41'].map(c => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div
                className="flex-1 mx-4 py-1 px-3 rounded-md text-xs text-center"
                style={{ background: 'rgba(0,0,0,0.04)', color: '#8B8670' }}
              >
                joyabl.com/e/{event.slug}
              </div>
            </div>

            <EventPreview
              event={event}
              content={content}
              primaryColor={primaryColor}
              bgColor={bgColor}
              font={font}
              hiddenSections={hiddenSections}
              sectionOrder={sectionOrder}
              onSectionClick={openSection}
            />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div
        className={[
          "flex flex-col border-l overflow-hidden",
          "md:relative md:shrink-0 md:h-full md:w-[300px] md:rounded-none",
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[82vh] md:max-h-none",
          "transition-transform duration-300 ease-in-out",
          mobileEditorOpen ? "translate-y-0" : "translate-y-full md:translate-y-0",
        ].join(' ')}
        style={{ background: 'white', borderColor: '#E8E3D9' }}
      >
        {/* Mobile drag handle */}
        <div
          className="md:hidden flex justify-center pt-3 pb-1 shrink-0 cursor-pointer"
          onClick={() => setMobileEditorOpen(false)}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: '#E8E3D9' }} />
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>Website</span>
            <span
              className="text-xs transition-all"
              style={{
                color: saveState === 'saving' ? '#B5A98A' : saveState === 'saved' ? '#4CAF50' : 'transparent',
              }}
            >
              {saveState === 'saving' ? 'Saving…' : 'Saved'}
            </span>
          </div>
          {/* Design / Content tabs */}
          <div className="flex gap-0 border-b" style={{ borderColor: '#F0EDE8' }}>
            {(['design', 'content'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2.5 text-sm font-medium capitalize transition-colors"
                style={{
                  color: tab === t ? '#2C2B26' : '#B5A98A',
                  borderBottom: tab === t ? '2px solid #2C2B26' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── DESIGN TAB ─────────────────────────────────────────────── */}
          {tab === 'design' && (
            <div className="p-4 flex flex-col gap-6">

              {/* Color palettes */}
              <div>
                <Label>Colour theme</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PALETTES.map(p => {
                    const active = paletteKey === p.name
                    const swatchPrimary = p.name === 'Custom' ? customPrimary : p.primary
                    const swatchBg = p.name === 'Custom' ? customBg : p.bg
                    return (
                      <button
                        key={p.name}
                        onClick={() => {
                          if (p.name === 'Custom') {
                            setPalette(customPrimary, customBg, 'Custom')
                          } else {
                            setPalette(p.primary, p.bg, p.name)
                          }
                        }}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="w-full h-10 rounded-xl overflow-hidden border-2 transition-all"
                          style={{ borderColor: active ? '#2C2B26' : 'transparent' }}
                        >
                          <div className="h-full flex">
                            <div className="flex-1" style={{ background: swatchPrimary }} />
                            <div className="flex-1" style={{ background: swatchBg }} />
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: active ? '#2C2B26' : '#B5A98A' }}>{p.name}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Custom color picker — shown only when Custom palette is active */}
                {paletteKey === 'Custom' && (
                  <div
                    className="rounded-2xl border p-4 mt-3"
                    style={{ background: 'white', borderColor: '#E8E3D9' }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {/* Text color */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs" style={{ color: '#8B8670' }}>Text color</span>
                        <input
                          type="color"
                          className="w-full h-20 rounded-xl cursor-pointer border-0 p-0"
                          value={customPrimary}
                          onChange={e => {
                            const val = e.target.value
                            setCustomPrimary(val)
                            setPalette(val, customBg, 'Custom')
                          }}
                        />
                        <input
                          type="text"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border text-center font-mono outline-none"
                          style={{ borderColor: '#E8E3D9', color: '#2C2B26' }}
                          value={customPrimary}
                          onChange={e => setCustomPrimary(e.target.value)}
                          onBlur={e => {
                            const val = e.target.value
                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                              setPalette(val, customBg, 'Custom')
                            }
                          }}
                        />
                      </div>
                      {/* Background color */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs" style={{ color: '#8B8670' }}>Page background</span>
                        <input
                          type="color"
                          className="w-full h-20 rounded-xl cursor-pointer border-0 p-0"
                          value={customBg}
                          onChange={e => {
                            const val = e.target.value
                            setCustomBg(val)
                            setPalette(customPrimary, val, 'Custom')
                          }}
                        />
                        <input
                          type="text"
                          className="w-full text-xs px-2 py-1.5 rounded-lg border text-center font-mono outline-none"
                          style={{ borderColor: '#E8E3D9', color: '#2C2B26' }}
                          value={customBg}
                          onChange={e => setCustomBg(e.target.value)}
                          onBlur={e => {
                            const val = e.target.value
                            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                              setPalette(customPrimary, val, 'Custom')
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t" style={{ borderColor: '#F0EDE8' }} />

              {/* Fonts */}
              <div>
                <Label>Font</Label>
                {/* Preload all fonts */}
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Cormorant+Garamond:wght@300;400;500&family=Lora:wght@400;500;600&family=EB+Garamond:wght@400;500&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;600&family=Josefin+Sans:wght@300;400;600&family=Montserrat:wght@300;400;500;600&family=Raleway:wght@300;400;500;600&family=DM+Serif+Display&family=Italiana&family=Great+Vibes&display=swap');`}</style>
                <div className="flex flex-col gap-1.5">
                  {FONTS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFontFamily(f.value)}
                      className="px-4 py-3 rounded-xl text-left transition-all text-sm"
                      style={{
                        fontFamily: `'${f.value}', serif`,
                        background: font === f.value ? '#2C2B26' : '#FAFAF7',
                        color: font === f.value ? 'white' : '#2C2B26',
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CONTENT TAB ────────────────────────────────────────────── */}
          {tab === 'content' && (
            <div className="flex flex-col">
              {sectionOrder.map(sectionKey => {
                const isOpen = activeSection === sectionKey
                const isHidden = hiddenSections.includes(sectionKey)
                const SectionIcon = SECTION_ICONS[sectionKey as SectionKey] ?? BookOpen
                const isDragging = dragItem === sectionKey
                const isDropTarget = dragOver === sectionKey && !isDragging

                // Custom section row
                if (sectionKey.startsWith('custom_')) {
                  const csId = sectionKey.replace('custom_', '')
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const cs = ((content as any).custom_sections ?? []).find((s: any) => s.id === csId)
                  if (!cs) return null
                  return (
                    <div
                      key={sectionKey}
                      ref={el => { sectionRefs.current[sectionKey] = el }}
                      className="border-b transition-colors"
                      style={{
                        borderColor: '#F0EDE8',
                        background: isDropTarget ? '#F5F0E8' : 'transparent',
                      }}
                      onDragOver={e => { e.preventDefault(); setDragOver(sectionKey) }}
                      onDrop={() => dropSection(sectionKey)}
                      onDragLeave={() => setDragOver(null)}
                    >
                      <div
                        draggable
                        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragItem(sectionKey) }}
                        onDragEnd={() => { setDragItem(null); setDragOver(null) }}
                        className="flex items-center hover:bg-[#FAFAF7] transition-colors select-none"
                        style={{ opacity: isDragging ? 0.4 : 1 }}
                      >
                        <div className="pl-3 pr-1 py-3.5 cursor-grab shrink-0" style={{ color: '#D4CCBC' }}>
                          <GripVertical size={14} />
                        </div>
                        <div className="pr-2 shrink-0" style={{ color: isHidden ? '#D4CCBC' : '#8B8670' }}>
                          <BookOpen size={14} />
                        </div>
                        <button
                          onClick={() => setActiveSection(isOpen ? null : sectionKey)}
                          className="flex-1 py-3.5 text-left text-sm font-medium"
                          style={{ color: isHidden ? '#C8BFA8' : '#2C2B26' }}
                        >
                          {cs.title}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); toggleHidden(sectionKey) }}
                          title={isHidden ? 'Show section' : 'Hide section'}
                          className="p-2 shrink-0 transition-colors"
                          style={{ color: isHidden ? '#C8BFA8' : '#D4CCBC' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8B8670' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isHidden ? '#C8BFA8' : '#D4CCBC' }}
                        >
                          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button
                          onClick={() => setActiveSection(isOpen ? null : sectionKey)}
                          className="pl-1 pr-3 py-3.5 shrink-0"
                        >
                          <ChevronRight
                            size={13}
                            style={{
                              color: '#C8BFA8',
                              transform: isOpen ? 'rotate(90deg)' : 'none',
                              transition: 'transform 150ms',
                            }}
                          />
                        </button>
                      </div>
                      {isOpen && (
                        <div className="px-4 pb-4 flex flex-col gap-4">
                          <Field label="Section title">
                            <input
                              className={inputCls}
                              style={inputStyle}
                              value={cs.title}
                              onChange={e => updateCustomSection(csId, 'title', e.target.value)}
                            />
                          </Field>
                          <Field label="Text">
                            <textarea
                              className={textareaCls}
                              style={{ ...inputStyle, minHeight: 100 }}
                              placeholder="Add some details…"
                              value={cs.text ?? ''}
                              onChange={e => updateCustomSection(csId, 'text', e.target.value)}
                            />
                          </Field>
                          <div>
                            <Label>Photos (up to 4)</Label>
                            <div className="flex flex-col gap-2">
                              {[0, 1, 2, 3].map(i => (
                                <ImageUploadInput
                                  key={i}
                                  value={cs.images?.[i] ?? ''}
                                  onChange={url => updateCustomSectionImage(csId, i, url)}
                                  placeholder="Image URL…"
                                  eventId={id}
                                  supabase={supabase}
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => removeCustomSection(csId)}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border transition-colors"
                            style={{ borderColor: '#FECACA', color: '#EF4444', background: '#FEF2F2' }}
                          >
                            <Trash2 size={12} /> Remove section
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <div
                    key={sectionKey}
                    ref={el => { sectionRefs.current[sectionKey] = el }}
                    className="border-b transition-colors"
                    style={{
                      borderColor: '#F0EDE8',
                      background: isDropTarget ? '#F5F0E8' : 'transparent',
                    }}
                    onDragOver={sectionKey !== 'welcome' ? e => { e.preventDefault(); setDragOver(sectionKey) } : undefined}
                    onDrop={sectionKey !== 'welcome' ? () => dropSection(sectionKey) : undefined}
                    onDragLeave={sectionKey !== 'welcome' ? () => setDragOver(null) : undefined}
                  >
                    {/* Accordion header */}
                    <div
                      draggable={sectionKey !== 'welcome'}
                      onDragStart={sectionKey !== 'welcome' ? e => { e.dataTransfer.effectAllowed = 'move'; setDragItem(sectionKey) } : undefined}
                      onDragEnd={sectionKey !== 'welcome' ? () => { setDragItem(null); setDragOver(null) } : undefined}
                      className="flex items-center hover:bg-[#FAFAF7] transition-colors select-none"
                      style={{ opacity: isDragging ? 0.4 : 1 }}
                    >
                      {/* Drag handle — hidden for welcome (always first) */}
                      <div
                        className="pl-3 pr-1 py-3.5 shrink-0"
                        style={{ color: '#D4CCBC', cursor: sectionKey === 'welcome' ? 'default' : 'grab', visibility: sectionKey === 'welcome' ? 'hidden' : 'visible' }}
                      >
                        <GripVertical size={14} />
                      </div>
                      {/* Section icon */}
                      <div className="pr-2 shrink-0" style={{ color: isHidden ? '#D4CCBC' : '#8B8670' }}>
                        <SectionIcon size={14} />
                      </div>
                      {/* Label */}
                      <button
                        onClick={() => setActiveSection(isOpen ? null : sectionKey)}
                        className="flex-1 py-3.5 text-left text-sm font-medium"
                        style={{ color: isHidden ? '#C8BFA8' : '#2C2B26' }}
                      >
                        {SECTION_LABELS[sectionKey as SectionKey]}
                      </button>
                      {/* Eye toggle */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleHidden(sectionKey) }}
                        title={isHidden ? 'Show section' : 'Hide section'}
                        className="p-2 shrink-0 transition-colors"
                        style={{ color: isHidden ? '#C8BFA8' : '#D4CCBC' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8B8670' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isHidden ? '#C8BFA8' : '#D4CCBC' }}
                      >
                        {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      {/* Expand chevron */}
                      <button
                        onClick={() => setActiveSection(isOpen ? null : sectionKey)}
                        className="pl-1 pr-3 py-3.5 shrink-0"
                      >
                        <ChevronRight
                          size={13}
                          style={{
                            color: '#C8BFA8',
                            transform: isOpen ? 'rotate(90deg)' : 'none',
                            transition: 'transform 150ms',
                          }}
                        />
                      </button>
                    </div>

                    {/* Section body */}
                    {isOpen && (
                      <div className="px-4 pb-4 flex flex-col gap-4">

                        {/* WELCOME */}
                        {sectionKey === 'welcome' && (
                          <>
                            <Field label="Page title">
                              <input
                                className={inputCls}
                                style={inputStyle}
                                value={event?.title ?? ''}
                                onChange={e => {
                                  if (!event) return
                                  setEvent(prev => prev ? { ...prev, title: e.target.value } : prev)
                                  scheduleSave({ title: e.target.value })
                                }}
                              />
                              <p className="text-xs mt-1" style={{ color: '#B5A98A' }}>The name shown at the top of your page</p>
                            </Field>
                            <Field label="Greeting message">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 100 }}
                                placeholder="A warm, personal intro for your guests…"
                                value={content.welcome?.greeting ?? ''}
                                onChange={e => updateContent({ welcome: { ...content.welcome, greeting: e.target.value } })}
                              />
                            </Field>
                            <Field label="RSVP button text">
                              <input
                                className={inputCls}
                                style={inputStyle}
                                placeholder="RSVP"
                                value={content.welcome?.rsvp_button_text ?? ''}
                                onChange={e => updateContent({ welcome: { ...content.welcome, rsvp_button_text: e.target.value } })}
                              />
                            </Field>
                            <Field label="RSVP deadline (optional)">
                              <input
                                type="date"
                                className={inputCls}
                                style={inputStyle}
                                min={new Date().toISOString().split('T')[0]}
                                max={event?.date ?? undefined}
                                value={content.welcome?.rsvp_deadline ?? ''}
                                onChange={e => updateContent({ welcome: { ...content.welcome, rsvp_deadline: e.target.value } })}
                              />
                              <p className="text-xs mt-1" style={{ color: '#B5A98A' }}>
                                {event?.date
                                  ? `Set a date before the event (${new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
                                  : 'Set a cut-off date for RSVPs'}
                              </p>
                            </Field>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Show RSVP button</p>
                                <p className="text-xs" style={{ color: '#8B8670' }}>Guests can RSVP from this button</p>
                              </div>
                              <Toggle
                                on={content.welcome?.show_rsvp !== false}
                                onChange={v => updateContent({ welcome: { ...content.welcome, show_rsvp: v } })}
                              />
                            </div>
                          </>
                        )}

                        {/* STORY */}
                        {sectionKey === 'story' && (
                          <>
                            <Field label="Introduction">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 72 }}
                                placeholder="A short opener — how you met, your first line…"
                                value={content.our_story?.introduction ?? ''}
                                onChange={e => updateContent({ our_story: { ...content.our_story, introduction: e.target.value } })}
                              />
                            </Field>
                            <Field label="Your story">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 120 }}
                                placeholder="The longer version — where you've been, what makes your relationship special…"
                                value={content.our_story?.story ?? ''}
                                onChange={e => updateContent({ our_story: { ...content.our_story, story: e.target.value } })}
                              />
                            </Field>
                            <div>
                              <Label>Photos (up to 4)</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {[0, 1, 2, 3].map(i => {
                                  const images = content.our_story?.images ?? []
                                  const url = images[i] ?? ''
                                  return (
                                    <div key={i} className="flex flex-col gap-1">
                                      <div
                                        className="aspect-square rounded-xl border flex items-center justify-center bg-cover bg-center overflow-hidden"
                                        style={{
                                          borderColor: '#E8E3D9',
                                          backgroundImage: url ? `url(${url})` : undefined,
                                          background: url ? undefined : '#FAFAF7',
                                        }}
                                      >
                                        {!url && <Plus size={16} style={{ color: '#C8BFA8' }} />}
                                      </div>
                                      <ImageUploadInput
                                        value={url}
                                        onChange={newUrl => {
                                          const imgs = [...(content.our_story?.images ?? ['', '', '', ''])]
                                          while (imgs.length < 4) imgs.push('')
                                          imgs[i] = newUrl
                                          updateContent({ our_story: { ...content.our_story, images: imgs } })
                                        }}
                                        placeholder="Image URL…"
                                        eventId={id}
                                        supabase={supabase}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </>
                        )}

                        {/* SCHEDULE */}
                        {sectionKey === 'schedule' && (
                          <>
                            {(content.schedule ?? []).map((item, idx) => (
                              <div
                                key={item.id}
                                className="rounded-xl border p-3 flex flex-col gap-2"
                                style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium" style={{ color: '#8B8670' }}>
                                    {item.title || `Event ${idx + 1}`}
                                  </span>
                                  <button
                                    onClick={() => removeScheduleItem(idx)}
                                    style={{ color: '#D4CCBC' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Name</label>
                                    <input
                                      className={inputCls}
                                      style={inputStyle}
                                      placeholder="Ceremony"
                                      value={item.title}
                                      onChange={e => updateScheduleItem(idx, 'title', e.target.value)}
                                    />
                                    {!item.title && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {SCHEDULE_SUGGESTIONS.slice(0, 4).map(s => (
                                          <button
                                            key={s}
                                            type="button"
                                            onClick={() => updateScheduleItem(idx, 'title', s)}
                                            className="px-2 py-0.5 rounded-md text-xs border transition-colors"
                                            style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
                                          >
                                            {s}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Time</label>
                                    <input
                                      className={inputCls}
                                      style={inputStyle}
                                      placeholder="3:00 PM"
                                      value={item.time ?? ''}
                                      onChange={e => updateScheduleItem(idx, 'time', e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Venue</label>
                                  <input
                                    className={inputCls}
                                    style={inputStyle}
                                    placeholder="Venue name"
                                    value={item.venue ?? ''}
                                    onChange={e => updateScheduleItem(idx, 'venue', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Address</label>
                                  <input
                                    className={inputCls}
                                    style={inputStyle}
                                    placeholder="123 Main St"
                                    value={item.address ?? ''}
                                    onChange={e => updateScheduleItem(idx, 'address', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Notes (optional)</label>
                                  <textarea
                                    className={textareaCls}
                                    style={{ ...inputStyle, minHeight: 56 }}
                                    placeholder="Arrive 10 min early…"
                                    value={item.notes ?? ''}
                                    onChange={e => updateScheduleItem(idx, 'notes', e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={addScheduleItem}
                              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
                              style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
                            >
                              <Plus size={12} /> Add event
                            </button>
                          </>
                        )}

                        {/* WEDDING PARTY */}
                        {sectionKey === 'wedding_party' && (
                          <>
                            <Field label="Introduction">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 72 }}
                                placeholder="A short intro to your crew…"
                                value={content.wedding_party?.introduction ?? ''}
                                onChange={e => updateContent({ wedding_party: { ...content.wedding_party, introduction: e.target.value } })}
                              />
                            </Field>
                            {(content.wedding_party?.members ?? []).map((m, idx) => (
                              <div
                                key={m.id}
                                className="rounded-xl border p-3 flex flex-col gap-2"
                                style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: '#F5F0E8', color: '#8B8670' }}
                                  >
                                    {ROLE_LABELS[m.role]}
                                  </span>
                                  <button
                                    onClick={() => removePartyMember(idx)}
                                    style={{ color: '#D4CCBC' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Name</label>
                                    <input
                                      className={inputCls}
                                      style={inputStyle}
                                      placeholder="Jane"
                                      value={m.name}
                                      onChange={e => updatePartyMember(idx, 'name', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Role</label>
                                    <select
                                      className={inputCls}
                                      style={inputStyle}
                                      value={m.role}
                                      onChange={e => updatePartyMember(idx, 'role', e.target.value)}
                                    >
                                      {PARTY_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Photo</label>
                                  <ImageUploadInput
                                    value={m.photo_url ?? ''}
                                    onChange={url => updatePartyMember(idx, 'photo_url', url)}
                                    placeholder="https://…"
                                    eventId={id}
                                    supabase={supabase}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Story (optional)</label>
                                  <textarea
                                    className={textareaCls}
                                    style={{ ...inputStyle, minHeight: 56 }}
                                    placeholder="A little about this person…"
                                    value={m.story ?? ''}
                                    onChange={e => updatePartyMember(idx, 'story', e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={addPartyMember}
                              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
                              style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
                            >
                              <Plus size={12} /> Add person
                            </button>
                          </>
                        )}

                        {/* ATTIRE */}
                        {sectionKey === 'attire' && (
                          <>
                            <Field label="Dress code">
                              <input
                                list="dress-codes"
                                className={inputCls}
                                style={inputStyle}
                                placeholder="Smart casual"
                                value={content.attire?.dress_code ?? ''}
                                onChange={e => updateContent({ attire: { ...content.attire, dress_code: e.target.value } })}
                              />
                              <datalist id="dress-codes">
                                {DRESS_CODES.map(d => <option key={d} value={d} />)}
                              </datalist>
                            </Field>
                            <Field label="Additional notes (optional)">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 80 }}
                                placeholder="The ceremony is outdoors — we recommend layers…"
                                value={content.attire?.notes ?? ''}
                                onChange={e => updateContent({ attire: { ...content.attire, notes: e.target.value } })}
                              />
                            </Field>
                          </>
                        )}

                        {/* TRAVEL */}
                        {sectionKey === 'travel' && (
                          <>
                            <Field label="General notes">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 80 }}
                                placeholder="Parking, transport, getting around…"
                                value={content.travel?.notes ?? ''}
                                onChange={e => updateContent({ travel: { ...content.travel, notes: e.target.value } })}
                              />
                            </Field>
                            {(content.travel?.cards ?? []).map((card, idx) => (
                              <div
                                key={card.id}
                                className="rounded-xl border p-3 flex flex-col gap-2"
                                style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
                              >
                                <div className="flex items-center justify-between">
                                  <select
                                    className="text-xs px-2 py-1 rounded-lg border outline-none"
                                    style={{ borderColor: '#E8E3D9', background: 'white', color: '#8B8670' }}
                                    value={card.type}
                                    onChange={e => updateTravelCard(idx, 'type', e.target.value)}
                                  >
                                    <option value="hotel">Hotel</option>
                                    <option value="car_rental">Car rental</option>
                                    <option value="note">Note</option>
                                  </select>
                                  <button
                                    onClick={() => removeTravelCard(idx)}
                                    style={{ color: '#D4CCBC' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                {card.type !== 'note' && (
                                  <>
                                    <div>
                                      <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Name</label>
                                      <input
                                        className={inputCls}
                                        style={inputStyle}
                                        placeholder="The Grand Hotel"
                                        value={card.name ?? ''}
                                        onChange={e => updateTravelCard(idx, 'name', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Address</label>
                                      <input
                                        className={inputCls}
                                        style={inputStyle}
                                        placeholder="123 Main St"
                                        value={card.address ?? ''}
                                        onChange={e => updateTravelCard(idx, 'address', e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Website</label>
                                      <input
                                        className={inputCls}
                                        style={inputStyle}
                                        placeholder="https://…"
                                        value={card.website ?? ''}
                                        onChange={e => updateTravelCard(idx, 'website', e.target.value)}
                                      />
                                    </div>
                                  </>
                                )}
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Notes</label>
                                  <textarea
                                    className={textareaCls}
                                    style={{ ...inputStyle, minHeight: 56 }}
                                    placeholder="Use code WEDDING25 for 15% off…"
                                    value={card.notes ?? ''}
                                    onChange={e => updateTravelCard(idx, 'notes', e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={addTravelCard}
                              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
                              style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
                            >
                              <Plus size={12} /> Add card
                            </button>
                          </>
                        )}

                        {/* REGISTRY */}
                        {sectionKey === 'registry' && (
                          <>
                            <Field label="Registry note">
                              <textarea
                                className={textareaCls}
                                style={{ ...inputStyle, minHeight: 100 }}
                                placeholder="A short, warm message about your registry…"
                                value={content.registry?.note ?? ''}
                                onChange={e => updateContent({ registry: { ...content.registry, note: e.target.value } })}
                              />
                            </Field>
                            <Field label="Button text">
                              <input
                                className={inputCls}
                                style={inputStyle}
                                placeholder="View registry"
                                value={content.registry?.button_text ?? ''}
                                onChange={e => updateContent({ registry: { ...content.registry, button_text: e.target.value } })}
                              />
                            </Field>
                          </>
                        )}

                        {/* FAQ */}
                        {sectionKey === 'faq' && (
                          <>
                            {(content.faq ?? []).map((item, idx) => (
                              <div
                                key={item.id}
                                className="rounded-xl border p-3 flex flex-col gap-2"
                                style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium" style={{ color: '#8B8670' }}>Q{idx + 1}</span>
                                  <button
                                    onClick={() => removeFaq(idx)}
                                    style={{ color: '#D4CCBC' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Question</label>
                                  <input
                                    className={inputCls}
                                    style={inputStyle}
                                    placeholder="Can I bring children?"
                                    value={item.question}
                                    onChange={e => updateFaq(idx, 'question', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Answer</label>
                                  <textarea
                                    className={textareaCls}
                                    style={{ ...inputStyle, minHeight: 64 }}
                                    placeholder="We love your little ones, but…"
                                    value={item.answer}
                                    onChange={e => updateFaq(idx, 'answer', e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={addFaq}
                              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
                              style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
                            >
                              <Plus size={12} /> Add question
                            </button>
                          </>
                        )}

                      </div>
                    )}
                  </div>
                )
              })}
              {/* Add section */}
              {!showAddSection ? (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-t transition-colors hover:bg-[#FAFAF7]"
                  style={{ borderColor: '#F0EDE8', color: '#8B8670' }}
                >
                  <Plus size={12} /> Add section
                </button>
              ) : (
                <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: '#F0EDE8' }}>
                  <p className="text-xs font-medium" style={{ color: '#2C2B26' }}>New section</p>
                  <input
                    autoFocus
                    className={inputCls}
                    style={inputStyle}
                    placeholder="Section name, e.g. Accommodation"
                    value={addingSectionTitle}
                    onChange={e => setAddingSectionTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && addingSectionTitle.trim()) {
                        addCustomSection(addingSectionTitle.trim())
                        setAddingSectionTitle('')
                        setShowAddSection(false)
                      }
                      if (e.key === 'Escape') {
                        setShowAddSection(false)
                        setAddingSectionTitle('')
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (addingSectionTitle.trim()) {
                          addCustomSection(addingSectionTitle.trim())
                          setAddingSectionTitle('')
                        }
                        setShowAddSection(false)
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ background: '#2C2B26', color: 'white' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddSection(false); setAddingSectionTitle('') }}
                      className="px-4 py-2 rounded-xl text-xs"
                      style={{ color: '#8B8670' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE BACKDROP ─────────────────────────────────────────────── */}
      {mobileEditorOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setMobileEditorOpen(false)}
        />
      )}

      {/* ── SHARE MODAL ─────────────────────────────────────────────────── */}
      {showShare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowShare(false) }}
        >
          <div className="rounded-3xl p-8 w-full max-w-md shadow-2xl" style={{ background: 'white' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: '#2C2B26' }}>Share your page</h2>
              <button onClick={() => setShowShare(false)} style={{ color: '#B5A98A' }}>
                <X size={18} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Your event link</p>
              <div
                className="flex items-center gap-2 p-3 rounded-xl border"
                style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
              >
                <span className="flex-1 text-sm font-mono truncate" style={{ color: '#2C2B26' }}>{eventUrl}</span>
                <button
                  onClick={copyUrl}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: copied ? '#4CAF50' : '#2C2B26', color: 'white' }}
                >
                  {copied ? <><Check size={11} /> Copied!</> : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Password protection</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8B8670' }}>Require a password to view your page</p>
                </div>
                <Toggle
                  on={passwordEnabled}
                  onChange={v => { setPasswordEnabled(v); if (!v) setSharePassword('') }}
                />
              </div>
              {passwordEnabled && (
                <input
                  type="password"
                  className={inputCls}
                  style={inputStyle}
                  placeholder="Enter a password"
                  value={sharePassword}
                  onChange={e => setSharePassword(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            <button
              onClick={saveShare}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: '#2C2B26', color: 'white' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
