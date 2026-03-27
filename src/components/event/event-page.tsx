'use client'

import { useRef } from 'react'
import Link from 'next/link'
import type { Event, EventContent, PlacedSticker, WeddingPartyMember } from '@/types'
import { StickerCanvas } from '@/components/website-editor/sticker-canvas'
import { StickerOverlay } from '@/components/website-editor/sticker-overlay'
import { resolveFontFamily } from '@/lib/font-family'
import { customSectionImageAdjustmentKey, getImageFrameStyle, heroImageAdjustmentKey, storyImageAdjustmentKey, weddingPartyImageAdjustmentKey } from '@/lib/image-presentation'
import { getLegacyPageStickers, getSectionStickers } from '@/lib/stickers'
import { formatDate } from '@/lib/utils'

type SectionKey = 'welcome' | 'story' | 'schedule' | 'wedding_party' | 'attire' | 'travel' | 'registry' | 'faq'

const SECTIONS_BY_TYPE: Record<string, SectionKey[]> = {
  wedding: ['welcome', 'story', 'schedule', 'wedding_party', 'attire', 'travel', 'registry', 'faq'],
  baby_shower: ['welcome', 'story', 'schedule', 'registry', 'faq'],
  birthday: ['welcome', 'schedule', 'registry', 'faq'],
  mitzvah: ['welcome', 'story', 'schedule', 'attire', 'travel', 'registry', 'faq'],
  housewarming: ['welcome', 'schedule', 'registry', 'faq'],
}

const ROLE_LABELS: Record<WeddingPartyMember['role'], string> = {
  maid_of_honour: 'Maid of Honour',
  best_man: 'Best Man',
  bridesmaid: 'Bridesmaid',
  groomsman: 'Groomsman',
  ring_bearer: 'Ring Bearer',
  flower_person: 'Flower Person',
  other: 'Other',
}

function PhotoGrid({
  images,
  adjustments,
  keyPrefix,
}: {
  images: string[]
  adjustments?: Record<string, import('@/types').ImageAdjustment>
  keyPrefix: (index: number) => string
}) {
  const imgs = images.filter(Boolean)
  if (imgs.length === 0) return null
  if (imgs.length === 1) {
    return (
      <div className="mt-10">
        <div className="aspect-[16/9] w-full rounded-2xl bg-cover bg-center" style={getImageFrameStyle(imgs[0], adjustments?.[keyPrefix(0)])} />
      </div>
    )
  }
  if (imgs.length === 2) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-3">
        {imgs.map((img, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={getImageFrameStyle(img, adjustments?.[keyPrefix(i)])} />)}
      </div>
    )
  }
  if (imgs.length === 3) {
    return (
      <div className="mt-10 grid grid-cols-2 gap-3">
        <div className="row-span-2 aspect-[3/4] rounded-2xl bg-cover bg-center" style={getImageFrameStyle(imgs[0], adjustments?.[keyPrefix(0)])} />
        <div className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={getImageFrameStyle(imgs[1], adjustments?.[keyPrefix(1)])} />
        <div className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={getImageFrameStyle(imgs[2], adjustments?.[keyPrefix(2)])} />
      </div>
    )
  }
  return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      {imgs.slice(0, 4).map((img, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={getImageFrameStyle(img, adjustments?.[keyPrefix(i)])} />)}
    </div>
  )
}

interface EventPageProps {
  event: Event
  rsvpHref: string
  registryHref: string
  topPaddingClassName?: string
  editor?: {
    activeStickerSection: string
    onSectionStickersChange: (sectionKey: string, nextStickers: PlacedSticker[]) => void
    onSectionClick: (sectionKey: string) => void
    onSectionSpacingChange?: (sectionKey: string, spacing: number) => void
    sectionLayerRefs: { current: Record<string, HTMLDivElement | null> }
  }
}

const MAX_SECTION_SPACING = 240

function SectionSpacingHandle({
  sectionKey,
  value,
  primaryColor,
  onChange,
}: {
  sectionKey: string
  value: number
  primaryColor: string
  onChange?: (sectionKey: string, spacing: number) => void
}) {
  const startY = useRef(0)
  const startValue = useRef(0)

  if (!onChange) return null

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!onChange) return

    event.preventDefault()
    event.stopPropagation()
    startY.current = event.clientY
    startValue.current = value
    const handleChange = onChange

    const onMove = (nextEvent: PointerEvent) => {
      const delta = nextEvent.clientY - startY.current
      const nextValue = Math.max(0, Math.min(MAX_SECTION_SPACING, startValue.current + delta))
      handleChange(sectionKey, Math.round(nextValue))
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 flex translate-y-1/2 justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
      <button
        type="button"
        onClick={event => event.stopPropagation()}
        onPointerDown={onPointerDown}
        className="rounded-full transition-all"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: `1px solid ${primaryColor}18`,
          boxShadow: value > 0 ? '0 14px 32px rgba(44,43,38,0.12)' : '0 10px 22px rgba(44,43,38,0.08)',
          backdropFilter: 'blur(14px)',
        }}
        title="Drag down to add space for stickers"
      >
        <div className="flex flex-col items-center gap-1 px-3 py-2">
          <span className="block h-[2px] rounded-full" style={{ width: value > 0 ? 22 : 18, background: primaryColor, opacity: value > 0 ? 0.75 : 0.5 }} />
          <span className="block h-[2px] rounded-full" style={{ width: value > 0 ? 14 : 10, background: primaryColor, opacity: value > 0 ? 0.45 : 0.25 }} />
        </div>
      </button>
    </div>
  )
}

export function EventPage({
  event,
  rsvpHref,
  registryHref,
  topPaddingClassName,
  editor,
}: EventPageProps) {
  const content: EventContent = event.content ?? {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedPalette = (content as any)._palette
  const primaryColor = savedPalette?.primary ?? event.primary_color ?? '#2C2B26'
  const bgColor = savedPalette?.bg ?? event.accent_color ?? '#F5F0E8'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedFont = (content as any)._font
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayFont = (content as any)._displayFont ?? savedFont ?? (event as any).font_family ?? 'Cormorant Garamond'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bodyFont = (content as any)._bodyFont ?? 'Lora'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heroLayout: 'centered' | 'full-bleed' | 'split' | 'illustrated' = (content as any)._heroLayout ?? 'centered'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionLayouts: Record<string, string> = (content as any)._section_layouts ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placedStickers = ((content as any)._stickers ?? []) as PlacedSticker[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionSpacing: Record<string, number> = (content as any)._section_spacing ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedOrder = (content as any)._section_order as SectionKey[] | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imageAdjustments = (content as any)._image_adjustments ?? {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiddenSections = new Set<string>((content as any)._hidden_sections ?? [])
  const defaultOrder = SECTIONS_BY_TYPE[event.type] ?? SECTIONS_BY_TYPE.wedding
  const sectionOrder = savedOrder?.length ? savedOrder : defaultOrder

  const c = content
  const hasStory = c.our_story?.introduction || c.our_story?.story
  const hasSchedule = c.schedule && c.schedule.length > 0
  const hasParty = c.wedding_party?.members && c.wedding_party.members.length > 0
  const hasAttire = c.attire?.dress_code || c.attire?.notes
  const hasTravel = c.travel?.notes || (c.travel?.cards && c.travel.cards.length > 0)
  const hasFaq = c.faq && c.faq.length > 0
  const spacingFor = (sectionKey: string) => Math.max(0, Math.min(240, sectionSpacing[sectionKey] ?? 0))
  const legacyPageStickers = getLegacyPageStickers(placedStickers)
  const isEditable = Boolean(editor)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rsvpButtonText = (c.welcome as any)?.rsvp_button_text as string | undefined

  function renderSection(key: string) {
    if (hiddenSections.has(key)) return null

    switch (key) {
      case 'welcome':
        return null
      case 'story':
        if (!hasStory) return null
        return (
          <section key="story" className="border-t px-4 py-10 md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest opacity-40">Our Story</p>
            {(sectionLayouts.story ?? 'stacked') === 'side-photo' ? (
              <div className="mx-auto grid max-w-4xl items-start gap-10 md:grid-cols-2">
                <div>
                  {c.our_story?.introduction && <p className="mb-6 text-lg font-medium leading-relaxed" style={{ fontFamily: `'${displayFont}', serif` }}>{c.our_story.introduction}</p>}
                  {c.our_story?.story && <p className="text-base leading-relaxed opacity-70">{c.our_story.story}</p>}
                </div>
                <PhotoGrid images={c.our_story?.images ?? []} adjustments={imageAdjustments} keyPrefix={storyImageAdjustmentKey} />
              </div>
            ) : (
              <div className="mx-auto max-w-2xl">
                {c.our_story?.introduction && <p className="mb-6 text-lg font-medium leading-relaxed" style={{ fontFamily: `'${displayFont}', serif` }}>{c.our_story.introduction}</p>}
                {c.our_story?.story && <p className="text-base leading-relaxed opacity-70">{c.our_story.story}</p>}
                <PhotoGrid images={c.our_story?.images ?? []} adjustments={imageAdjustments} keyPrefix={storyImageAdjustmentKey} />
              </div>
            )}
          </section>
        )
      case 'schedule':
        if (!hasSchedule) return null
        return (
          <section key="schedule" className="border-t px-4 py-10 md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest opacity-40">Schedule</p>
            {(sectionLayouts.schedule ?? 'timeline') === 'cards' ? (
              <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
                {(c.schedule ?? []).map(item => (
                  <div key={item.id} className="rounded-2xl border p-5" style={{ borderColor: `${primaryColor}15` }}>
                    {item.time && <p className="mb-2 text-xs font-medium opacity-40">{item.time}</p>}
                    <p className="mb-1 font-semibold">{item.title}</p>
                    {item.venue && <p className="text-sm opacity-60">{item.venue}</p>}
                    {item.address && <p className="text-xs opacity-40">{item.address}</p>}
                    {item.notes && <p className="mt-2 text-sm italic opacity-60">{item.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mx-auto grid max-w-2xl gap-8">
                {(c.schedule ?? []).map(item => (
                  <div key={item.id} className="flex gap-6">
                    <div className="w-20 shrink-0 text-right">
                      <p className="text-sm font-medium opacity-50">{item.time}</p>
                    </div>
                    <div className="flex-1 border-l pl-6" style={{ borderColor: `${primaryColor}20` }}>
                      <p className="mb-1 font-semibold">{item.title}</p>
                      {item.venue && <p className="text-sm opacity-60">{item.venue}</p>}
                      {item.address && <p className="text-xs opacity-40">{item.address}</p>}
                      {item.notes && <p className="mt-2 text-sm italic opacity-60">{item.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      case 'wedding_party':
        if (!hasParty) return null
        return (
          <section key="wedding_party" className="border-t px-4 py-10 md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest opacity-40">Wedding Party</p>
            {c.wedding_party?.introduction && <p className="mx-auto mb-10 max-w-lg text-center text-base opacity-60">{c.wedding_party.introduction}</p>}
            {(sectionLayouts.wedding_party ?? 'grid-4') === 'grid-2' ? (
              <div className="mx-auto grid max-w-2xl gap-8 md:grid-cols-2">
                {(c.wedding_party?.members ?? []).map(m => (
                  <div key={m.id} className="flex items-start gap-5">
                    <div className="h-24 w-24 shrink-0 rounded-2xl bg-cover bg-center" style={m.photo_url ? getImageFrameStyle(m.photo_url, imageAdjustments[weddingPartyImageAdjustmentKey(m.id)]) : { background: `${primaryColor}15` }} />
                    <div className="pt-1">
                      <p className="font-medium">{m.name || ROLE_LABELS[m.role]}</p>
                      <p className="mb-2 mt-0.5 text-xs opacity-40">{ROLE_LABELS[m.role]}</p>
                      {m.story && <p className="text-sm leading-relaxed opacity-60">{m.story}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
                {(c.wedding_party?.members ?? []).map(m => (
                  <div key={m.id} className="text-center">
                    <div className="mx-auto mb-3 h-20 w-20 rounded-full bg-cover bg-center" style={m.photo_url ? getImageFrameStyle(m.photo_url, imageAdjustments[weddingPartyImageAdjustmentKey(m.id)]) : { background: `${primaryColor}15` }} />
                    <p className="text-sm font-medium">{m.name || ROLE_LABELS[m.role]}</p>
                    <p className="mt-0.5 text-xs opacity-40">{ROLE_LABELS[m.role]}</p>
                    {m.story && <p className="mt-2 px-1 text-xs leading-relaxed opacity-50">{m.story}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      case 'attire':
        if (!hasAttire) return null
        return (
          <section key="attire" className="border-t px-4 py-10 text-center md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest opacity-40">Attire</p>
            {c.attire?.dress_code && <p className="mb-3 text-2xl font-semibold">{c.attire.dress_code}</p>}
            {c.attire?.notes && <p className="mx-auto max-w-md text-sm opacity-60">{c.attire.notes}</p>}
          </section>
        )
      case 'travel':
        if (!hasTravel) return null
        return (
          <section key="travel" className="border-t px-4 py-10 md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest opacity-40">Getting There</p>
            <div className="mx-auto max-w-2xl">
              {c.travel?.notes && <p className="mb-8 text-base leading-relaxed opacity-70">{c.travel.notes}</p>}
              {c.travel?.cards && c.travel.cards.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {c.travel.cards.map(card => (
                    <div key={card.id} className="rounded-2xl border p-5" style={{ borderColor: `${primaryColor}15` }}>
                      <p className="mb-2 text-xs uppercase tracking-wide opacity-40">{card.type === 'hotel' ? 'Hotel' : card.type === 'car_rental' ? 'Car Rental' : 'Note'}</p>
                      {card.name && <p className="mb-1 font-semibold">{card.name}</p>}
                      {card.address && <p className="mb-2 text-xs opacity-50">{card.address}</p>}
                      {card.notes && <p className="mb-3 text-sm opacity-60">{card.notes}</p>}
                      {card.website && <a href={card.website} target="_blank" rel="noopener noreferrer" className="text-xs font-medium underline">{card.button_text || 'Learn more'}</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      case 'registry': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registryContent = c.registry as any
        const buttonText = registryContent?.button_text || 'View registry'
        const note = registryContent?.note
        return (
          <section key="registry" className="border-t px-4 py-10 text-center md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest opacity-40">Registry</p>
            {note && <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed opacity-70">{note}</p>}
            {isEditable ? (
              <button
                type="button"
                className="inline-block rounded-full border px-8 py-3 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {buttonText}
              </button>
            ) : (
              <Link href={registryHref} className="inline-block rounded-full border px-8 py-3 text-sm font-medium transition-opacity hover:opacity-70" style={{ borderColor: primaryColor, color: primaryColor }}>
                {buttonText}
              </Link>
            )}
          </section>
        )
      }
      case 'faq':
        if (!hasFaq) return null
        return (
          <section key="faq" className="border-t px-4 py-10 md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
            <p className="mb-10 text-center text-xs font-semibold uppercase tracking-widest opacity-40">FAQ</p>
            {(sectionLayouts.faq ?? 'accordion') === 'open' ? (
              <div className="mx-auto flex max-w-2xl flex-col gap-8">
                {(c.faq ?? []).map(item => (
                  <div key={item.id}>
                    <p className="mb-2 font-medium">{item.question}</p>
                    <p className="text-sm leading-relaxed" style={{ opacity: 0.65 }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col gap-0">
                {(c.faq ?? []).map(item => (
                  <div key={item.id} className="border-t pb-5 pt-5" style={{ borderColor: `${primaryColor}15` }}>
                    <p className="mb-2 font-medium">{item.question}</p>
                    <p className="text-sm leading-relaxed" style={{ opacity: 0.65 }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      default:
        if (key.startsWith('custom_')) {
          const csId = key.replace('custom_', '')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cs = (content as any).custom_sections?.find((s: any) => s.id === csId)
          if (!cs) return null
          return (
            <section key={key} className="border-t px-4 py-10 md:px-8 md:py-16" style={{ borderColor: `${primaryColor}15` }}>
              <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest opacity-40">{cs.title}</p>
              <div className="mx-auto max-w-2xl">
                {cs.text && <p className="text-base leading-relaxed opacity-70">{cs.text}</p>}
                {cs.images?.filter(Boolean).length > 0 && (
                  <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cs.images.filter(Boolean).length, 2)}, 1fr)` }}>
                    {cs.images.filter(Boolean).map((img: string, i: number) => (
                      <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={getImageFrameStyle(img, imageAdjustments[customSectionImageAdjustmentKey(csId, i)])} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        }
        return null
    }
  }

  const locationEl = event.location && (
    isEditable ? (
      <span>{event.location}</span>
    ) : (
      <a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline" style={{ color: 'inherit' }}>
        {event.location}
      </a>
    )
  )
  const metaLine = (event.date || event.location) && (
    <p className="text-sm opacity-60">
      {event.date && formatDate(event.date)}
      {event.date && event.location && ' · '}
      {locationEl}
    </p>
  )
  const rsvpBar = c.welcome?.show_rsvp !== false && (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {isEditable ? (
        <button type="button" className="rounded-full px-8 py-3 text-sm font-medium" style={{ background: primaryColor, color: bgColor }}>
          {rsvpButtonText || 'RSVP'}
        </button>
      ) : (
        <Link href={rsvpHref} className="rounded-full px-8 py-3 text-sm font-medium" style={{ background: primaryColor, color: bgColor }}>
          {rsvpButtonText || 'RSVP'}
        </Link>
      )}
      {c.welcome?.rsvp_deadline && <p className="text-xs opacity-50">Deadline: {formatDate(c.welcome.rsvp_deadline)}</p>}
    </div>
  )

  function renderSectionLayer(
    sectionKey: string,
    node: React.ReactNode,
    options?: { title?: string; handleColor?: string }
  ) {
    const spacing = spacingFor(sectionKey)
    const sectionStickers = getSectionStickers(placedStickers, sectionKey)
    const overlay = editor && editor.activeStickerSection === sectionKey
      ? (
        <StickerCanvas
          stickers={sectionStickers}
          onChange={next => editor.onSectionStickersChange(sectionKey, next)}
          primaryColor={primaryColor}
        />
      )
      : <StickerOverlay stickers={sectionStickers} />

    return (
      <div
        className={isEditable ? 'group relative cursor-pointer overflow-visible' : 'relative overflow-visible'}
        onClick={editor ? event => {
          event.stopPropagation()
          editor.onSectionClick(sectionKey)
        } : undefined}
        title={options?.title}
        ref={editor ? element => { editor.sectionLayerRefs.current[sectionKey] = element } : undefined}
      >
        {editor && (
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
            style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }}
          />
        )}
        {node}
        {overlay}
        {spacing > 0 && <div style={{ height: spacing }} />}
        {editor && (
          <SectionSpacingHandle
            sectionKey={sectionKey}
            value={spacing}
            primaryColor={options?.handleColor ?? primaryColor}
            onChange={editor.onSectionSpacingChange}
          />
        )}
      </div>
    )
  }

  return (
    <div className={['relative', topPaddingClassName ?? ''].join(' ')} style={{ fontFamily: resolveFontFamily(bodyFont), background: bgColor, color: primaryColor, minHeight: '100vh' }}>
      {!hiddenSections.has('welcome') && (() => {
        if (heroLayout === 'full-bleed') {
          const coverUrl = event.cover_image_url
          const coverStyle = coverUrl ? getImageFrameStyle(coverUrl, imageAdjustments[heroImageAdjustmentKey()]) : undefined
          return renderSectionLayer('welcome', (
            <section className="relative flex min-h-[55vh] flex-col items-center justify-center text-center" style={{ background: coverUrl ? undefined : primaryColor, color: 'white' }}>
              {coverUrl && <div className="absolute inset-0" style={{ ...coverStyle, backgroundColor: primaryColor }} />}
              {coverUrl && <div className="absolute inset-0 bg-black/45" />}
              <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-20">
                <h1 className="text-4xl font-semibold md:text-5xl" style={{ fontFamily: `'${displayFont}', serif`, letterSpacing: '-0.02em' }}>{event.title}</h1>
                {metaLine && <div style={{ opacity: 0.8 }}>{metaLine}</div>}
                {c.welcome?.greeting && <p className="max-w-xl text-lg leading-relaxed opacity-90" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
                {rsvpBar}
              </div>
            </section>
          ), { title: 'Click to edit Welcome', handleColor: bgColor })
        }
        if (heroLayout === 'split') {
          const coverUrl = event.cover_image_url
          return renderSectionLayer('welcome', (
            <section className="flex min-h-[55vh] flex-col md:flex-row" style={{ background: bgColor }}>
              <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-16 md:px-10">
                <h1 className="text-3xl font-semibold leading-tight md:text-4xl" style={{ fontFamily: `'${displayFont}', serif`, letterSpacing: '-0.02em' }}>{event.title}</h1>
                {metaLine}
                {c.welcome?.greeting && <p className="text-base leading-relaxed opacity-80" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
                {rsvpBar && <div className="flex justify-start">{rsvpBar}</div>}
              </div>
              <div className="h-64 md:h-auto md:flex-1" style={coverUrl ? getImageFrameStyle(coverUrl, imageAdjustments[heroImageAdjustmentKey()]) : { background: `${primaryColor}15` }} />
            </section>
          ), { title: 'Click to edit Welcome' })
        }
        if (heroLayout === 'illustrated') {
          return renderSectionLayer('welcome', (
            <section className="px-4 py-20 text-center md:px-8 md:py-24" style={{ background: bgColor }}>
              <div className="mb-8 flex items-center justify-center gap-3 opacity-30"><div className="h-px max-w-24 flex-1" style={{ background: primaryColor }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: primaryColor }} /><div className="h-px max-w-24 flex-1" style={{ background: primaryColor }} /></div>
              <h1 className="mb-4 text-4xl font-semibold md:text-5xl" style={{ fontFamily: `'${displayFont}', serif`, letterSpacing: '-0.01em' }}>{event.title}</h1>
              {metaLine && <div className="mb-4">{metaLine}</div>}
              <div className="my-6 flex items-center justify-center gap-3 opacity-30"><div className="h-px max-w-24 flex-1" style={{ background: primaryColor }} /><div className="h-1.5 w-1.5 rounded-full" style={{ background: primaryColor }} /><div className="h-px max-w-24 flex-1" style={{ background: primaryColor }} /></div>
              {c.welcome?.greeting && <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed opacity-80" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
              {rsvpBar}
            </section>
          ), { title: 'Click to edit Welcome' })
        }
        return renderSectionLayer('welcome', (
          <section className="px-4 py-12 text-center md:px-8 md:py-20" style={{ background: bgColor }}>
            <h1 className="mb-3 text-3xl font-semibold md:text-4xl" style={{ letterSpacing: '-0.02em', fontFamily: `'${displayFont}', serif` }}>{event.title}</h1>
            {metaLine && <div className="mb-8">{metaLine}</div>}
            {c.welcome?.greeting && <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed opacity-80" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
            {rsvpBar}
          </section>
        ), { title: 'Click to edit Welcome' })
      })()}

      {sectionOrder.map(key => {
        const node = renderSection(key)
        if (!node) return null
        return (
          <div key={key}>
            {renderSectionLayer(key, node, { title: `Click to edit ${key.replace(/_/g, ' ')}` })}
          </div>
        )
      })}

      <StickerOverlay stickers={legacyPageStickers} />

      <div className="border-t py-8 text-center" style={{ borderColor: `${primaryColor}10` }}>
        <p className="text-xs opacity-25">Powered by Joyabl</p>
      </div>
    </div>
  )
}
