'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Event, EventContent } from '@/types'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS, type SectionKey } from '@/components/website-editor/config'

export interface PreviewProps {
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

  return (
    <div className="mt-10 grid grid-cols-2 gap-3">
      {imgs.slice(0, 4).map((img, i) => (
        <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
      ))}
    </div>
  )
}

export function EventPreview({
  event,
  content,
  primaryColor,
  bgColor,
  font,
  hiddenSections,
  sectionOrder,
  onSectionClick,
}: PreviewProps) {
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700&display=swap');`}</style>

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

      {sectionOrder.filter(k => k !== 'welcome').map(key => {
        if (isHidden(key as SectionKey)) return null

        if (key === 'story') {
          if (!hasStory) return null
          return (
            <section key="story" onClick={sectionClick('story')} className="cursor-pointer group relative px-8 py-16 border-t" style={{ borderColor: `${primaryColor}15` }} title="Click to edit Our Story">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">Our Story</p>
              <div className="max-w-2xl mx-auto">
                {c.our_story?.introduction && <p className="text-lg leading-relaxed mb-6 font-medium">{c.our_story.introduction}</p>}
                {c.our_story?.story && <p className="text-base leading-relaxed opacity-70">{c.our_story.story}</p>}
                <PhotoGrid images={c.our_story?.images ?? []} />
              </div>
            </section>
          )
        }

        if (key === 'schedule') {
          if (!hasSchedule) return null
          return (
            <section key="schedule" onClick={sectionClick('schedule')} className="cursor-pointer group relative px-8 py-16 border-t" style={{ borderColor: `${primaryColor}15` }} title="Click to edit Schedule">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
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
            <section key="wedding_party" onClick={sectionClick('wedding_party')} className="cursor-pointer group relative px-8 py-16 border-t" style={{ borderColor: `${primaryColor}15` }} title="Click to edit Wedding Party">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-40 text-center">Wedding Party</p>
              {c.wedding_party?.introduction && <p className="text-center text-base opacity-60 mb-10 max-w-lg mx-auto">{c.wedding_party.introduction}</p>}
              <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto">
                {(c.wedding_party?.members ?? []).map(m => (
                  <div key={m.id} className="text-center">
                    <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-cover bg-center" style={{ backgroundImage: m.photo_url ? `url(${m.photo_url})` : undefined, background: m.photo_url ? undefined : `${primaryColor}15` }} />
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
            <section key="attire" onClick={sectionClick('attire')} className="cursor-pointer group relative px-8 py-16 border-t text-center" style={{ borderColor: `${primaryColor}15` }} title="Click to edit Attire">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-6 opacity-40">Attire</p>
              {c.attire?.dress_code && <p className="text-2xl font-semibold mb-3">{c.attire.dress_code}</p>}
              {c.attire?.notes && <p className="text-sm opacity-60 max-w-md mx-auto">{c.attire.notes}</p>}
            </section>
          )
        }

        if (key === 'travel') {
          if (!hasTravel) return null
          return (
            <section key="travel" onClick={sectionClick('travel')} className="cursor-pointer group relative px-8 py-16 border-t" style={{ borderColor: `${primaryColor}15` }} title="Click to edit Travel">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">Getting There</p>
              <div className="max-w-2xl mx-auto">
                {c.travel?.notes && <p className="text-base opacity-70 mb-8 leading-relaxed">{c.travel.notes}</p>}
                {c.travel?.cards && c.travel.cards.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {c.travel.cards.map(card => (
                      <div key={card.id} className="rounded-2xl p-5 border" style={{ borderColor: `${primaryColor}15` }}>
                        <p className="text-xs uppercase tracking-wide opacity-40 mb-2">{card.type === 'hotel' ? 'Hotel' : card.type === 'car_rental' ? 'Car Rental' : 'Note'}</p>
                        {card.name && <p className="font-semibold mb-1">{card.name}</p>}
                        {card.address && <p className="text-xs opacity-50 mb-2">{card.address}</p>}
                        {card.notes && <p className="text-sm opacity-60 mb-3">{card.notes}</p>}
                        {card.website && <a className="text-xs font-medium underline" style={{ color: primaryColor }}>{card.button_text || 'Learn more'}</a>}
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
            <section key="registry" onClick={sectionClick('registry')} className="cursor-pointer group relative px-8 py-16 border-t text-center" style={{ borderColor: `${primaryColor}15` }} title="Click to edit Registry">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-6 opacity-40">Registry</p>
              {c.registry?.note && <p className="text-base opacity-70 max-w-xl mx-auto mb-8 leading-relaxed">{c.registry.note}</p>}
              <button className="px-8 py-3 rounded-full text-sm font-medium border" style={{ borderColor: primaryColor, color: primaryColor }}>
                {c.registry?.button_text || 'View registry'}
              </button>
            </section>
          )
        }

        if (key === 'faq') {
          if (!hasFaq) return null
          return (
            <section key="faq" onClick={sectionClick('faq')} className="cursor-pointer group relative px-8 py-16 border-t" style={{ borderColor: `${primaryColor}15` }} title="Click to edit FAQ">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-10 opacity-40 text-center">FAQ</p>
              <div className="max-w-2xl mx-auto flex flex-col gap-0">
                {(c.faq ?? []).map(item => (
                  <div key={item.id} className="border-t py-5" style={{ borderColor: `${primaryColor}15` }} onClick={e => { e.stopPropagation(); setOpenFaq(openFaq === item.id ? null : item.id) }}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.question}</p>
                      <ChevronDown size={16} className="transition-transform shrink-0 ml-4" style={{ opacity: 0.4, transform: openFaq === item.id ? 'rotate(180deg)' : 'none' }} />
                    </div>
                    {openFaq === item.id && <p className="text-sm mt-3 leading-relaxed" style={{ opacity: 0.65 }}>{item.answer}</p>}
                  </div>
                ))}
              </div>
            </section>
          )
        }

        if (key.startsWith('custom_')) {
          const customId = key.replace('custom_', '')
          const cs = content.custom_sections?.find(section => section.id === customId)
          if (!cs) return null
          return (
            <section key={key} onClick={e => { e.stopPropagation(); onSectionClick(key) }} className="cursor-pointer group relative px-8 py-16 border-t" style={{ borderColor: `${primaryColor}15` }} title={`Click to edit ${cs.title}`}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ outline: `2px solid ${primaryColor}`, outlineOffset: -2 }} />
              <p className="text-xs font-semibold uppercase tracking-widest mb-8 opacity-40 text-center">{cs.title}</p>
              <div className="max-w-2xl mx-auto">
                {cs.text && <p className="text-base leading-relaxed opacity-70">{cs.text}</p>}
                {cs.images?.filter(Boolean).length ? (
                  <div className="mt-8 grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cs.images.filter(Boolean).length, 2)}, 1fr)` }}>
                    {cs.images.filter(Boolean).map((img, i) => (
                      <div key={i} className="aspect-[4/3] rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          )
        }

        return null
      })}

      <div className="py-8 text-center border-t" style={{ borderColor: `${primaryColor}10` }}>
        <p className="text-xs opacity-25">Powered by Joyabl</p>
      </div>
    </div>
  )
}
