'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react'
import Link from 'next/link'
import type { EventContent, ScheduleItem, HotelItem, FaqItem } from '@/types'

type Tab = 'story' | 'schedule' | 'attire' | 'travel' | 'faq'

const TABS: { key: Tab; label: string }[] = [
  { key: 'story', label: 'Our story' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'attire', label: 'Attire' },
  { key: 'travel', label: 'Travel & stays' },
  { key: 'faq', label: 'FAQ' },
]

const SCHEDULE_SUGGESTIONS = ['Ceremony', 'Wedding breakfast', 'Reception', 'Luncheon', 'Rehearsal dinner', 'After party', 'Day-after brunch']

function uid() {
  return Math.random().toString(36).slice(2)
}

export default function WebsitePage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('story')
  const [content, setContent] = useState<EventContent>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Tab | null>(null)

  // Story
  const [storyText, setStoryText] = useState('')
  const [storyPhoto, setStoryPhoto] = useState('')

  // Schedule
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  // Attire
  const [dressCode, setDressCode] = useState('')
  const [attireNotes, setAttireNotes] = useState('')

  // Travel
  const [travelNotes, setTravelNotes] = useState('')
  const [hotels, setHotels] = useState<HotelItem[]>([])

  // FAQ
  const [faq, setFaq] = useState<FaqItem[]>([])

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('events').select('content').eq('id', id).single()
      if (!data?.content) return
      const c: EventContent = data.content
      setContent(c)
      setStoryText(c.our_story?.text ?? '')
      setStoryPhoto(c.our_story?.photo_url ?? '')
      setSchedule(c.schedule ?? [])
      setDressCode(c.attire?.dress_code ?? '')
      setAttireNotes(c.attire?.notes ?? '')
      setTravelNotes(c.travel?.notes ?? '')
      setHotels(c.travel?.hotels ?? [])
      setFaq(c.faq ?? [])
    }
    load()
  }, [id])

  async function save(section: Tab, patch: Partial<EventContent>) {
    setSaving(true)
    const updated = { ...content, ...patch }
    await supabase.from('events').update({ content: updated }).eq('id', id)
    setContent(updated)
    setSaving(false)
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  // Schedule helpers
  function addScheduleItem() {
    setSchedule((s) => [...s, { id: uid(), title: '', time: '', venue: '', address: '', notes: '' }])
  }
  function updateScheduleItem(idx: number, field: keyof ScheduleItem, value: string) {
    setSchedule((s) => s.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function removeScheduleItem(idx: number) {
    setSchedule((s) => s.filter((_, i) => i !== idx))
  }

  // Hotel helpers
  function addHotel() {
    setHotels((h) => [...h, { id: uid(), name: '', url: '', notes: '' }])
  }
  function updateHotel(idx: number, field: keyof HotelItem, value: string) {
    setHotels((h) => h.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function removeHotel(idx: number) {
    setHotels((h) => h.filter((_, i) => i !== idx))
  }

  // FAQ helpers
  function addFaq() {
    setFaq((f) => [...f, { id: uid(), question: '', answer: '' }])
  }
  function updateFaq(idx: number, field: keyof FaqItem, value: string) {
    setFaq((f) => f.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }
  function removeFaq(idx: number) {
    setFaq((f) => f.filter((_, i) => i !== idx))
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={14} /> Back</Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: '#1C1C1C' }}>Page content</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Add rich information for your guests — your story, the day's schedule, travel tips, and more.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-8 overflow-x-auto" style={{ borderColor: '#E5E5E4' }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0"
            style={{
              color: tab === key ? '#1C1C1C' : '#9CA3AF',
              borderBottom: tab === key ? '2px solid #1C1C1C' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Our Story */}
      {tab === 'story' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Your story</label>
            <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>
              How you met, the proposal, what makes your relationship special. Guests love this.
            </p>
            <textarea
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
              style={{ borderColor: '#E5E5E4', minHeight: 200 }}
              placeholder="We met at a mutual friend's dinner in October 2019, and by the end of the night we both knew something special had started..."
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
            />
          </div>
          <Input
            label="Photo URL (optional)"
            placeholder="https://... — paste a link to a photo of the two of you"
            value={storyPhoto}
            onChange={(e) => setStoryPhoto(e.target.value)}
            type="url"
          />
          {storyPhoto && (
            <div
              className="w-full h-48 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${storyPhoto})` }}
            />
          )}
          <SaveButton
            saving={saving}
            saved={saved === 'story'}
            onClick={() => save('story', { our_story: { text: storyText || undefined, photo_url: storyPhoto || undefined } })}
          />
        </div>
      )}

      {/* Schedule */}
      {tab === 'schedule' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Add each part of your day — ceremony, reception, dinner, after party. Guests will see these in order.
          </p>

          {schedule.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-2xl border p-5"
              style={{ background: 'white', borderColor: '#E5E5E4' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
                  {item.title || `Event ${idx + 1}`}
                </span>
                <button onClick={() => removeScheduleItem(idx)} className="text-[#9CA3AF] hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Name</label>
                  <input
                    list={`schedule-suggestions-${idx}`}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all"
                    style={{ borderColor: '#E5E5E4' }}
                    placeholder="Ceremony"
                    value={item.title}
                    onChange={(e) => updateScheduleItem(idx, 'title', e.target.value)}
                  />
                  <datalist id={`schedule-suggestions-${idx}`}>
                    {SCHEDULE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Time"
                    placeholder="e.g. 3:00 PM"
                    value={item.time ?? ''}
                    onChange={(e) => updateScheduleItem(idx, 'time', e.target.value)}
                  />
                  <Input
                    label="Venue"
                    placeholder="St Paul's Cathedral"
                    value={item.venue ?? ''}
                    onChange={(e) => updateScheduleItem(idx, 'venue', e.target.value)}
                  />
                </div>
                <Input
                  label="Address"
                  placeholder="St. Paul's Churchyard, London EC4M 8AD"
                  value={item.address ?? ''}
                  onChange={(e) => updateScheduleItem(idx, 'address', e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Notes (optional)</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                    style={{ borderColor: '#E5E5E4', minHeight: 72 }}
                    placeholder="Please arrive 15 minutes early. No confetti inside the church."
                    value={item.notes ?? ''}
                    onChange={(e) => updateScheduleItem(idx, 'notes', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addScheduleItem}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed text-sm transition-colors w-full justify-center"
            style={{ borderColor: '#E5E5E4', color: '#9CA3AF' }}
          >
            <Plus size={14} /> Add event
          </button>

          <SaveButton
            saving={saving}
            saved={saved === 'schedule'}
            onClick={() => save('schedule', { schedule })}
          />
        </div>
      )}

      {/* Attire */}
      {tab === 'attire' && (
        <div className="flex flex-col gap-5">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Let guests know what to wear so nobody shows up in jeans or a ball gown by mistake.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Dress code</label>
            <input
              list="dress-code-suggestions"
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all"
              style={{ borderColor: '#E5E5E4' }}
              placeholder="Black tie"
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
            />
            <datalist id="dress-code-suggestions">
              {['Black tie', 'Black tie optional', 'Cocktail', 'Smart casual', 'Casual', 'Beach formal', 'Garden party'].map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Additional notes (optional)</label>
            <textarea
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
              style={{ borderColor: '#E5E5E4', minHeight: 100 }}
              placeholder="The ceremony is outdoors, so we recommend bringing a jacket. Please avoid wearing white or ivory."
              value={attireNotes}
              onChange={(e) => setAttireNotes(e.target.value)}
            />
          </div>
          <SaveButton
            saving={saving}
            saved={saved === 'attire'}
            onClick={() => save('attire', { attire: { dress_code: dressCode || undefined, notes: attireNotes || undefined } })}
          />
        </div>
      )}

      {/* Travel */}
      {tab === 'travel' && (
        <div className="flex flex-col gap-5">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Help guests get there and find somewhere to stay — especially useful if you have out-of-town guests.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Getting there</label>
            <textarea
              className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
              style={{ borderColor: '#E5E5E4', minHeight: 120 }}
              placeholder="Free parking is available at the venue. The nearest train station is London Paddington, a 10-minute taxi ride away. We recommend guests from outside London arrive the night before."
              value={travelNotes}
              onChange={(e) => setTravelNotes(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-3" style={{ color: '#1C1C1C' }}>Recommended hotels</p>
            <div className="flex flex-col gap-3">
              {hotels.map((hotel, idx) => (
                <div
                  key={hotel.id}
                  className="rounded-2xl border p-4"
                  style={{ background: 'white', borderColor: '#E5E5E4' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>
                      {hotel.name || `Hotel ${idx + 1}`}
                    </span>
                    <button onClick={() => removeHotel(idx)} className="text-[#9CA3AF] hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Hotel name"
                      placeholder="The Grand Hotel"
                      value={hotel.name}
                      onChange={(e) => updateHotel(idx, 'name', e.target.value)}
                    />
                    <Input
                      label="Website (optional)"
                      placeholder="https://..."
                      value={hotel.url ?? ''}
                      onChange={(e) => updateHotel(idx, 'url', e.target.value)}
                      type="url"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Notes (optional)</label>
                      <textarea
                        className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                        style={{ borderColor: '#E5E5E4', minHeight: 64 }}
                        placeholder="Use code WEDDING2025 for 15% off. 5 minutes from the venue."
                        value={hotel.notes ?? ''}
                        onChange={(e) => updateHotel(idx, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={addHotel}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed text-sm transition-colors w-full justify-center"
                style={{ borderColor: '#E5E5E4', color: '#9CA3AF' }}
              >
                <Plus size={14} /> Add hotel
              </button>
            </div>
          </div>

          <SaveButton
            saving={saving}
            saved={saved === 'travel'}
            onClick={() => save('travel', { travel: { notes: travelNotes || undefined, hotels: hotels.length ? hotels : undefined } })}
          />
        </div>
      )}

      {/* FAQ */}
      {tab === 'faq' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Answer the questions guests always ask — children, parking, dietary requirements, plus-ones.
          </p>

          {faq.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-2xl border p-5"
              style={{ background: 'white', borderColor: '#E5E5E4' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Question {idx + 1}</span>
                <button onClick={() => removeFaq(idx)} className="text-[#9CA3AF] hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  label="Question"
                  placeholder="Can I bring my children?"
                  value={item.question}
                  onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium" style={{ color: '#1C1C1C' }}>Answer</label>
                  <textarea
                    className="w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] outline-none transition-all resize-none"
                    style={{ borderColor: '#E5E5E4', minHeight: 80 }}
                    placeholder="We love your little ones, but this is an adults-only celebration. We hope you can still join us!"
                    value={item.answer}
                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addFaq}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed text-sm transition-colors w-full justify-center"
            style={{ borderColor: '#E5E5E4', color: '#9CA3AF' }}
          >
            <Plus size={14} /> Add question
          </button>

          <SaveButton
            saving={saving}
            saved={saved === 'faq'}
            onClick={() => save('faq', { faq: faq.length ? faq : undefined })}
          />
        </div>
      )}
    </div>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={saving} size="sm" variant={saved ? 'secondary' : 'primary'}>
      {saved ? <><Check size={14} /> Saved</> : saving ? 'Saving…' : 'Save'}
    </Button>
  )
}
