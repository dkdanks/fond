import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Event, EventContent, WeddingPartyMember } from '@/types'
import { formatDate } from '@/lib/utils'

// ─── Photo Grid ───────────────────────────────────────────────────────────────

function PhotoGrid({ images }: { images: string[] }) {
  const imgs = images.filter(Boolean)
  if (imgs.length === 0) return null
  if (imgs.length === 1) return (
    <div className="mt-10">
      <div className="aspect-[16/9] rounded-2xl bg-cover bg-center w-full" style={{ backgroundImage: `url(${imgs[0]})` }} />
    </div>
  )
  if (imgs.length === 2) return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      {imgs.map((img, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />)}
    </div>
  )
  if (imgs.length === 3) return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      <div className="row-span-2 aspect-[3/4] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${imgs[0]})` }} />
      <div className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${imgs[1]})` }} />
      <div className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${imgs[2]})` }} />
    </div>
  )
  return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      {imgs.slice(0, 4).map((img, i) => <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />)}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

type SectionKey = 'welcome' | 'story' | 'schedule' | 'wedding_party' | 'attire' | 'travel' | 'registry' | 'faq'

const SECTIONS_BY_TYPE: Record<string, SectionKey[]> = {
  wedding:      ['welcome', 'story', 'schedule', 'wedding_party', 'attire', 'travel', 'registry', 'faq'],
  baby_shower:  ['welcome', 'story', 'schedule', 'registry', 'faq'],
  birthday:     ['welcome', 'schedule', 'registry', 'faq'],
  mitzvah:      ['welcome', 'story', 'schedule', 'attire', 'travel', 'registry', 'faq'],
  housewarming: ['welcome', 'schedule', 'registry', 'faq'],
}

const ROLE_LABELS: Record<WeddingPartyMember['role'], string> = {
  maid_of_honour: 'Maid of Honour',
  best_man:       'Best Man',
  bridesmaid:     'Bridesmaid',
  groomsman:      'Groomsman',
  ring_bearer:    'Ring Bearer',
  flower_person:  'Flower Person',
  other:          'Other',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PreviewEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: eventData } = await supabase
    .from('events')
    .select('*, access_password')
    .eq('id', id)
    .single()

  if (!eventData) {
    return (
      <div style={{ fontFamily: 'Inter, sans-serif', background: '#FAFAF7', color: '#2C2B26', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Event not found</p>
          <p style={{ fontSize: '0.875rem', opacity: 0.5 }}>This event may have been deleted or you may not have access.</p>
          <a href="/events" style={{ display: 'inline-block', marginTop: '1.5rem', fontSize: '0.875rem', textDecoration: 'underline', opacity: 0.6 }}>Back to events</a>
        </div>
      </div>
    )
  }

  const event = eventData as Event
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

  // Section order + hidden
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedOrder = (content as any)._section_order as SectionKey[] | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiddenSections = new Set<string>((content as any)._hidden_sections ?? [])
  const defaultOrder = SECTIONS_BY_TYPE[event.type] ?? SECTIONS_BY_TYPE.wedding
  const sectionOrder = savedOrder?.length ? savedOrder : defaultOrder

  // Content helpers
  const c = content
  const hasStory = c.our_story?.introduction || c.our_story?.story
  const hasSchedule = c.schedule && c.schedule.length > 0
  const hasParty = c.wedding_party?.members && c.wedding_party.members.length > 0
  const hasAttire = c.attire?.dress_code || c.attire?.notes
  const hasTravel = c.travel?.notes || (c.travel?.cards && c.travel.cards.length > 0)
  const hasFaq = c.faq && c.faq.length > 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rsvpButtonText = (c.welcome as any)?.rsvp_button_text as string | undefined

  function renderSection(key: string) {
    if (hiddenSections.has(key)) return null

    switch (key) {
      case 'welcome':
        // Welcome / Hero is always rendered separately outside the loop
        return null

      case 'story':
        if (!hasStory) return null
        return (
          <section key="story" className="px-4 py-10 md:px-8 md:py-16 border-t" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">Our Story</p>
            {(sectionLayouts['story'] ?? 'stacked') === 'side-photo' ? (
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-start">
                <div>
                  {c.our_story?.introduction && (
                    <p className="text-lg leading-relaxed mb-6 font-medium" style={{ fontFamily: `'${displayFont}', serif` }}>{c.our_story.introduction}</p>
                  )}
                  {c.our_story?.story && (
                    <p className="text-base leading-relaxed opacity-70">{c.our_story.story}</p>
                  )}
                </div>
                <PhotoGrid images={c.our_story?.images ?? []} />
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                {c.our_story?.introduction && (
                  <p className="text-lg leading-relaxed mb-6 font-medium" style={{ fontFamily: `'${displayFont}', serif` }}>{c.our_story.introduction}</p>
                )}
                {c.our_story?.story && (
                  <p className="text-base leading-relaxed opacity-70">{c.our_story.story}</p>
                )}
                <PhotoGrid images={c.our_story?.images ?? []} />
              </div>
            )}
          </section>
        )

      case 'schedule':
        if (!hasSchedule) return null
        return (
          <section key="schedule" className="px-4 py-10 md:px-8 md:py-16 border-t" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-10 opacity-40 text-center">Schedule</p>
            {(sectionLayouts['schedule'] ?? 'timeline') === 'cards' ? (
              <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
                {(c.schedule ?? []).map(item => (
                  <div key={item.id} className="p-5 rounded-2xl border" style={{ borderColor: `${primaryColor}15` }}>
                    {item.time && <p className="text-xs font-medium opacity-40 mb-2">{item.time}</p>}
                    <p className="font-semibold mb-1">{item.title}</p>
                    {item.venue && <p className="text-sm opacity-60">{item.venue}</p>}
                    {item.address && <p className="text-xs opacity-40">{item.address}</p>}
                    {item.notes && <p className="text-sm mt-2 opacity-60 italic">{item.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </section>
        )

      case 'wedding_party':
        if (!hasParty) return null
        return (
          <section key="wedding_party" className="px-4 py-10 md:px-8 md:py-16 border-t" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-40 text-center">Wedding Party</p>
            {c.wedding_party?.introduction && (
              <p className="text-center text-base opacity-60 mb-10 max-w-lg mx-auto">{c.wedding_party.introduction}</p>
            )}
            {(sectionLayouts['wedding_party'] ?? 'grid-4') === 'grid-2' ? (
              <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                {(c.wedding_party?.members ?? []).map(m => (
                  <div key={m.id} className="flex gap-5 items-start">
                    <div
                      className="w-24 h-24 rounded-2xl shrink-0 bg-cover bg-center"
                      style={{
                        backgroundImage: m.photo_url ? `url(${m.photo_url})` : undefined,
                        background: m.photo_url ? undefined : `${primaryColor}15`,
                      }}
                    />
                    <div className="pt-1">
                      <p className="font-medium">{m.name || ROLE_LABELS[m.role]}</p>
                      <p className="text-xs opacity-40 mt-0.5 mb-2">{ROLE_LABELS[m.role]}</p>
                      {m.story && <p className="text-sm opacity-60 leading-relaxed">{m.story}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
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
            )}
          </section>
        )

      case 'attire':
        if (!hasAttire) return null
        return (
          <section key="attire" className="px-4 py-10 md:px-8 md:py-16 border-t text-center" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-6 opacity-40">Attire</p>
            {c.attire?.dress_code && <p className="text-2xl font-semibold mb-3">{c.attire.dress_code}</p>}
            {c.attire?.notes && <p className="text-sm opacity-60 max-w-md mx-auto">{c.attire.notes}</p>}
          </section>
        )

      case 'travel':
        if (!hasTravel) return null
        return (
          <section key="travel" className="px-4 py-10 md:px-8 md:py-16 border-t" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">Getting There</p>
            <div className="max-w-2xl mx-auto">
              {c.travel?.notes && (
                <p className="text-base opacity-70 mb-8 leading-relaxed">{c.travel.notes}</p>
              )}
              {c.travel?.cards && c.travel.cards.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {c.travel.cards.map(card => (
                    <div key={card.id} className="rounded-2xl p-5 border" style={{ borderColor: `${primaryColor}15` }}>
                      <p className="text-xs uppercase tracking-wide opacity-40 mb-2">
                        {card.type === 'hotel' ? 'Hotel' : card.type === 'car_rental' ? 'Car Rental' : 'Note'}
                      </p>
                      {card.name && <p className="font-semibold mb-1">{card.name}</p>}
                      {card.address && <p className="text-xs opacity-50 mb-2">{card.address}</p>}
                      {card.notes && <p className="text-sm opacity-60 mb-3">{card.notes}</p>}
                      {card.website && (
                        <a
                          href={card.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium underline"
                        >
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

      case 'registry': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registryContent = c.registry as any
        const buttonText = registryContent?.button_text || 'View registry'
        const note = registryContent?.note
        return (
          <section key="registry" className="px-4 py-10 md:px-8 md:py-16 text-center border-t" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-6 opacity-40">Registry</p>
            {note && (
              <p className="text-base opacity-70 max-w-xl mx-auto mb-8 leading-relaxed">{note}</p>
            )}
            <Link
              href={`/events/${id}/preview/registry`}
              className="inline-block px-8 py-3 rounded-full text-sm font-medium border transition-opacity hover:opacity-70"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              {buttonText}
            </Link>
          </section>
        )
      }

      case 'faq':
        if (!hasFaq) return null
        return (
          <section key="faq" className="px-4 py-10 md:px-8 md:py-16 border-t" style={{ borderColor: `${primaryColor}15` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-10 opacity-40 text-center">FAQ</p>
            {(sectionLayouts['faq'] ?? 'accordion') === 'open' ? (
              <div className="max-w-2xl mx-auto flex flex-col gap-8">
                {(c.faq ?? []).map(item => (
                  <div key={item.id}>
                    <p className="font-medium mb-2">{item.question}</p>
                    <p className="text-sm leading-relaxed" style={{ opacity: 0.65 }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-2xl mx-auto flex flex-col gap-0">
                {(c.faq ?? []).map(item => (
                  <div
                    key={item.id}
                    className="border-t pt-5 pb-5"
                    style={{ borderColor: `${primaryColor}15` }}
                  >
                    <p className="font-medium mb-2">{item.question}</p>
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
            <section key={key} className="px-4 py-10 md:px-8 md:py-16 border-t" style={{ borderColor: `${primaryColor}15` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">{cs.title}</p>
              <div className="max-w-2xl mx-auto">
                {cs.text && <p className="text-base leading-relaxed opacity-70">{cs.text}</p>}
                {cs.images?.filter(Boolean).length > 0 && (
                  <div className="mt-8 grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${Math.min(cs.images.filter(Boolean).length, 2)}, 1fr)` }}>
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
    }
  }

  return (
    <>
      {/* Preview banner */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-xs"
        style={{ background: '#2C2B26', color: '#FAFAF7' }}
      >
        <span>Preview mode — this is how your guests will see it</span>
        <a href={`/events/${id}/website`} className="underline opacity-70 hover:opacity-100">← Back to editor</a>
      </div>

      <div className="pt-9" style={{ fontFamily: `'${bodyFont}', serif`, background: bgColor, color: primaryColor, minHeight: '100vh' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(displayFont)}:wght@300;400;500;600;700&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600;700&display=swap');`}</style>

        {/* Hero / Welcome */}
        {!hiddenSections.has('welcome') && (() => {
          const locationEl = event.location && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline" style={{ color: 'inherit' }}>
              {event.location}
            </a>
          )
          const metaLine = (event.date || event.location) && (
            <p className="text-sm opacity-60">{event.date && formatDate(event.date)}{event.date && event.location && ' · '}{locationEl}</p>
          )
          const rsvpBar = c.welcome?.show_rsvp !== false && (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href={`/e/${event.slug}/rsvp`} className="px-8 py-3 rounded-full text-sm font-medium" style={{ background: primaryColor, color: bgColor }}>
                {rsvpButtonText || 'RSVP'}
              </Link>
              {c.welcome?.rsvp_deadline && <p className="text-xs opacity-50">Deadline: {formatDate(c.welcome.rsvp_deadline)}</p>}
            </div>
          )

          if (heroLayout === 'full-bleed') {
            const coverUrl = event.cover_image_url
            return (
              <section className="relative min-h-[55vh] flex flex-col items-center justify-center text-center" style={{ background: coverUrl ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${coverUrl}) center/cover no-repeat` : primaryColor, color: 'white' }}>
                <div className="px-6 py-20 flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
                  <h1 className="text-4xl md:text-5xl font-semibold" style={{ fontFamily: `'${displayFont}', serif`, letterSpacing: '-0.02em' }}>{event.title}</h1>
                  {metaLine && <div style={{ opacity: 0.8 }}>{metaLine}</div>}
                  {c.welcome?.greeting && <p className="text-lg leading-relaxed max-w-xl opacity-90" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
                  {rsvpBar}
                </div>
              </section>
            )
          }
          if (heroLayout === 'split') {
            const coverUrl = event.cover_image_url
            return (
              <section className="flex flex-col md:flex-row min-h-[55vh]" style={{ background: bgColor }}>
                <div className="flex-1 flex flex-col justify-center px-6 py-16 md:px-10 gap-6">
                  <h1 className="text-3xl md:text-4xl font-semibold leading-tight" style={{ fontFamily: `'${displayFont}', serif`, letterSpacing: '-0.02em' }}>{event.title}</h1>
                  {metaLine}
                  {c.welcome?.greeting && <p className="text-base leading-relaxed opacity-80" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
                  {rsvpBar && <div className="flex justify-start">{rsvpBar}</div>}
                </div>
                <div className="md:flex-1 h-64 md:h-auto" style={{ background: coverUrl ? `url(${coverUrl}) center/cover no-repeat` : `${primaryColor}15` }} />
              </section>
            )
          }
          if (heroLayout === 'illustrated') {
            return (
              <section className="px-4 py-20 md:px-8 md:py-24 text-center" style={{ background: bgColor }}>
                <div className="mb-8 flex items-center justify-center gap-3 opacity-30"><div className="h-px flex-1 max-w-24" style={{ background: primaryColor }} /><div className="w-1.5 h-1.5 rounded-full" style={{ background: primaryColor }} /><div className="h-px flex-1 max-w-24" style={{ background: primaryColor }} /></div>
                <h1 className="text-4xl md:text-5xl font-semibold mb-4" style={{ fontFamily: `'${displayFont}', serif`, letterSpacing: '-0.01em' }}>{event.title}</h1>
                {metaLine && <div className="mb-4">{metaLine}</div>}
                <div className="my-6 flex items-center justify-center gap-3 opacity-30"><div className="h-px flex-1 max-w-24" style={{ background: primaryColor }} /><div className="w-1.5 h-1.5 rounded-full" style={{ background: primaryColor }} /><div className="h-px flex-1 max-w-24" style={{ background: primaryColor }} /></div>
                {c.welcome?.greeting && <p className="text-lg leading-relaxed max-w-xl mx-auto mb-10 opacity-80" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
                {rsvpBar}
              </section>
            )
          }
          return (
            <section className="px-4 py-12 md:px-8 md:py-20 text-center" style={{ background: bgColor }}>
              <h1 className="text-3xl md:text-4xl font-semibold mb-3" style={{ letterSpacing: '-0.02em', fontFamily: `'${displayFont}', serif` }}>{event.title}</h1>
              {metaLine && <div className="mb-8">{metaLine}</div>}
              {c.welcome?.greeting && <p className="text-lg leading-relaxed max-w-xl mx-auto mb-10 opacity-80" style={{ fontStyle: 'italic', fontFamily: `'${displayFont}', serif` }}>{c.welcome.greeting}</p>}
              {rsvpBar}
            </section>
          )
        })()}

        {/* Sections in order */}
        {sectionOrder.map(key => renderSection(key))}

        {/* Footer */}
        <div className="py-8 text-center border-t" style={{ borderColor: `${primaryColor}10` }}>
          <p className="text-xs opacity-25">Powered by Joyabl</p>
        </div>
      </div>
    </>
  )
}
