'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ImageUploadInput } from '@/components/dashboard/image-upload-input'
import { EventPreview } from '@/components/website-editor/preview'
import { PreviewToolbar } from '@/components/website-editor/preview-toolbar'
import { SectionAccordionItem } from '@/components/website-editor/section-accordion-item'
import {
  AttireSectionEditor,
  FaqSectionEditor,
  RegistrySectionEditor,
  ScheduleSectionEditor,
  StorySectionEditor,
  TravelSectionEditor,
  WelcomeSectionEditor,
  WeddingPartySectionEditor,
} from '@/components/website-editor/section-editors'
import {
  editorInputCls as inputCls,
  editorInputStyle as inputStyle,
  editorTextareaCls as textareaCls,
  Field,
  Label,
  Toggle,
} from '@/components/website-editor/primitives'
import {
  FONTS,
  PALETTES,
  SECTION_ICONS,
  SECTION_LABELS,
  SECTIONS_BY_TYPE,
  type SectionKey,
} from '@/components/website-editor/config'
import {
  Plus, Trash2, X, Check, Loader2, BookOpen,
} from 'lucide-react'
import type {
  Event, EventContent, EventType, ScheduleItem, FaqItem,
  WeddingPartyMember, TravelCard
} from '@/types'

function uid() { return Math.random().toString(36).slice(2, 10) }

// ─── Small helpers ───────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (!mobileEditorOpen) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setMobileEditorOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileEditorOpen])

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

        <PreviewToolbar
          id={id}
          viewport={viewport}
          onViewportChange={setViewport}
          onOpenShare={() => setShowShare(true)}
          onOpenMobileEditor={() => setMobileEditorOpen(true)}
        />

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
                    <SectionAccordionItem
                      key={sectionKey}
                      itemKey={sectionKey}
                      itemRef={el => { sectionRefs.current[sectionKey] = el }}
                      label={cs.title}
                      icon={<BookOpen size={14} />}
                      isOpen={isOpen}
                      isHidden={isHidden}
                      isDragging={isDragging}
                      isDropTarget={isDropTarget}
                      onToggleOpen={() => setActiveSection(isOpen ? null : sectionKey)}
                      onToggleHidden={() => toggleHidden(sectionKey)}
                      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragItem(sectionKey) }}
                      onDragEnd={() => { setDragItem(null); setDragOver(null) }}
                      onDragOver={e => { e.preventDefault(); setDragOver(sectionKey) }}
                      onDrop={() => dropSection(sectionKey)}
                      onDragLeave={() => setDragOver(null)}
                    >
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
                              showPreview
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
                    </SectionAccordionItem>
                  )
                }
                return (
                  <SectionAccordionItem
                    key={sectionKey}
                    itemKey={sectionKey}
                    itemRef={el => { sectionRefs.current[sectionKey] = el }}
                    label={SECTION_LABELS[sectionKey as SectionKey]}
                    icon={<SectionIcon size={14} />}
                    isOpen={isOpen}
                    isHidden={isHidden}
                    isDragging={isDragging}
                    isDropTarget={isDropTarget}
                    draggable={sectionKey !== 'welcome'}
                    allowDrop={sectionKey !== 'welcome'}
                    onToggleOpen={() => setActiveSection(isOpen ? null : sectionKey)}
                    onToggleHidden={() => toggleHidden(sectionKey)}
                    onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragItem(sectionKey) }}
                    onDragEnd={() => { setDragItem(null); setDragOver(null) }}
                    onDragOver={e => { e.preventDefault(); setDragOver(sectionKey) }}
                    onDrop={() => dropSection(sectionKey)}
                    onDragLeave={() => setDragOver(null)}
                  >
                        {/* WELCOME */}
                        {sectionKey === 'welcome' && (
                          <WelcomeSectionEditor
                            title={event?.title ?? ''}
                            eventDate={event?.date}
                            welcome={content.welcome}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onTitleChange={value => {
                              if (!event) return
                              setEvent(prev => prev ? { ...prev, title: value } : prev)
                              scheduleSave({ title: value })
                            }}
                            onWelcomeChange={welcome => updateContent({ welcome })}
                          />
                        )}

                        {/* STORY */}
                        {sectionKey === 'story' && (
                          <StorySectionEditor
                            story={content.our_story}
                            eventId={id}
                            supabase={supabase}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onChange={our_story => updateContent({ our_story })}
                          />
                        )}

                        {/* SCHEDULE */}
                        {sectionKey === 'schedule' && (
                          <ScheduleSectionEditor
                            items={content.schedule ?? []}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onAdd={addScheduleItem}
                            onUpdate={updateScheduleItem}
                            onRemove={removeScheduleItem}
                          />
                        )}

                        {/* WEDDING PARTY */}
                        {sectionKey === 'wedding_party' && (
                          <WeddingPartySectionEditor
                            intro={content.wedding_party?.introduction ?? ''}
                            members={content.wedding_party?.members ?? []}
                            eventId={id}
                            supabase={supabase}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onIntroChange={value => updateContent({ wedding_party: { ...content.wedding_party, introduction: value } })}
                            onAdd={addPartyMember}
                            onUpdate={updatePartyMember}
                            onRemove={removePartyMember}
                          />
                        )}

                        {/* ATTIRE */}
                        {sectionKey === 'attire' && (
                          <AttireSectionEditor
                            attire={content.attire}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onChange={attire => updateContent({ attire })}
                          />
                        )}

                        {/* TRAVEL */}
                        {sectionKey === 'travel' && (
                          <TravelSectionEditor
                            notes={content.travel?.notes ?? ''}
                            cards={content.travel?.cards ?? []}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onNotesChange={value => updateContent({ travel: { ...content.travel, notes: value } })}
                            onAdd={addTravelCard}
                            onUpdate={updateTravelCard}
                            onRemove={removeTravelCard}
                          />
                        )}

                        {/* REGISTRY */}
                        {sectionKey === 'registry' && (
                          <RegistrySectionEditor
                            registry={content.registry}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onChange={registry => updateContent({ registry })}
                          />
                        )}

                        {/* FAQ */}
                        {sectionKey === 'faq' && (
                          <FaqSectionEditor
                            items={content.faq ?? []}
                            inputClassName={inputCls}
                            textareaClassName={textareaCls}
                            inputStyle={inputStyle}
                            onAdd={addFaq}
                            onUpdate={updateFaq}
                            onRemove={removeFaq}
                          />
                        )}

                    </SectionAccordionItem>
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
