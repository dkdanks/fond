'use client'

import type { CSSProperties } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ImageUploadInput } from '@/components/dashboard/image-upload-input'
import { Field, Label, Toggle } from '@/components/website-editor/primitives'
import { DRESS_CODES, PARTY_ROLES, ROLE_LABELS, SCHEDULE_SUGGESTIONS } from '@/components/website-editor/config'
import { createClient } from '@/lib/supabase/client'
import type { EventContent, FaqItem, ScheduleItem, TravelCard, WeddingPartyMember } from '@/types'

type SharedEditorProps = {
  inputClassName: string
  textareaClassName: string
  inputStyle: CSSProperties
}

type WelcomeSectionEditorProps = SharedEditorProps & {
  title: string
  eventDate?: string
  welcome: EventContent['welcome']
  onTitleChange: (value: string) => void
  onWelcomeChange: (welcome: NonNullable<EventContent['welcome']>) => void
}

export function WelcomeSectionEditor({
  title,
  eventDate,
  welcome,
  inputClassName,
  textareaClassName,
  inputStyle,
  onTitleChange,
  onWelcomeChange,
}: WelcomeSectionEditorProps) {
  return (
    <>
      <Field label="Page title">
        <input
          className={inputClassName}
          style={inputStyle}
          value={title}
          onChange={event => onTitleChange(event.target.value)}
        />
        <p className="text-xs mt-1" style={{ color: '#B5A98A' }}>The name shown at the top of your page</p>
      </Field>
      <Field label="Greeting message">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 100 }}
          placeholder="A warm, personal intro for your guests…"
          value={welcome?.greeting ?? ''}
          onChange={event => onWelcomeChange({ ...welcome, greeting: event.target.value })}
        />
      </Field>
      <Field label="RSVP button text">
        <input
          className={inputClassName}
          style={inputStyle}
          placeholder="RSVP"
          value={welcome?.rsvp_button_text ?? ''}
          onChange={event => onWelcomeChange({ ...welcome, rsvp_button_text: event.target.value })}
        />
      </Field>
      <Field label="RSVP deadline (optional)">
        <input
          type="date"
          className={inputClassName}
          style={inputStyle}
          min={new Date().toISOString().split('T')[0]}
          max={eventDate ?? undefined}
          value={welcome?.rsvp_deadline ?? ''}
          onChange={event => onWelcomeChange({ ...welcome, rsvp_deadline: event.target.value })}
        />
        <p className="text-xs mt-1" style={{ color: '#B5A98A' }}>
          {eventDate
            ? `Set a date before the event (${new Date(eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
            : 'Set a cut-off date for RSVPs'}
        </p>
      </Field>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Show RSVP button</p>
          <p className="text-xs" style={{ color: '#8B8670' }}>Guests can RSVP from this button</p>
        </div>
        <Toggle
          on={welcome?.show_rsvp !== false}
          onChange={value => onWelcomeChange({ ...welcome, show_rsvp: value })}
        />
      </div>
    </>
  )
}

type StorySectionEditorProps = SharedEditorProps & {
  story: EventContent['our_story']
  eventId: string
  supabase: ReturnType<typeof createClient>
  onChange: (story: NonNullable<EventContent['our_story']>) => void
}

export function StorySectionEditor({
  story,
  eventId,
  supabase,
  inputStyle,
  textareaClassName,
  onChange,
}: StorySectionEditorProps) {
  return (
    <>
      <Field label="Introduction">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 72 }}
          placeholder="A short opener - how you met, your first line…"
          value={story?.introduction ?? ''}
          onChange={event => onChange({ ...story, introduction: event.target.value })}
        />
      </Field>
      <Field label="Your story">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 120 }}
          placeholder="The longer version - where you've been, what makes your relationship special…"
          value={story?.story ?? ''}
          onChange={event => onChange({ ...story, story: event.target.value })}
        />
      </Field>
      <div>
        <Label>Photos (up to 4)</Label>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map(index => {
            const images = story?.images ?? []
            const url = images[index] ?? ''
            return (
              <div key={index} className="flex flex-col gap-1">
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
                    const nextImages = [...(story?.images ?? ['', '', '', ''])]
                    while (nextImages.length < 4) nextImages.push('')
                    nextImages[index] = newUrl
                    onChange({ ...story, images: nextImages })
                  }}
                  placeholder="Image URL…"
                  eventId={eventId}
                  supabase={supabase}
                  profile="section"
                  showPreview
                />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

type ScheduleSectionEditorProps = SharedEditorProps & {
  items: ScheduleItem[]
  onAdd: () => void
  onUpdate: (idx: number, field: keyof ScheduleItem, value: string) => void
  onRemove: (idx: number) => void
}

export function ScheduleSectionEditor({
  items,
  inputClassName,
  textareaClassName,
  inputStyle,
  onAdd,
  onUpdate,
  onRemove,
}: ScheduleSectionEditorProps) {
  return (
    <>
      {items.map((item, idx) => (
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
              onClick={() => onRemove(idx)}
              style={{ color: '#D4CCBC' }}
              onMouseEnter={event => { event.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={event => { event.currentTarget.style.color = '#D4CCBC' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Name</label>
              <input
                className={inputClassName}
                style={inputStyle}
                placeholder="Ceremony"
                value={item.title}
                onChange={event => onUpdate(idx, 'title', event.target.value)}
              />
              {!item.title && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SCHEDULE_SUGGESTIONS.slice(0, 4).map(suggestion => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => onUpdate(idx, 'title', suggestion)}
                      className="px-2 py-0.5 rounded-md text-xs border transition-colors"
                      style={{ borderColor: '#E8E3D9', color: '#8B8670', background: 'white' }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Time</label>
              <input
                className={inputClassName}
                style={inputStyle}
                placeholder="3:00 PM"
                value={item.time ?? ''}
                onChange={event => onUpdate(idx, 'time', event.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Venue</label>
            <input
              className={inputClassName}
              style={inputStyle}
              placeholder="Venue name"
              value={item.venue ?? ''}
              onChange={event => onUpdate(idx, 'venue', event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Address</label>
            <input
              className={inputClassName}
              style={inputStyle}
              placeholder="123 Main St"
              value={item.address ?? ''}
              onChange={event => onUpdate(idx, 'address', event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Notes (optional)</label>
            <textarea
              className={textareaClassName}
              style={{ ...inputStyle, minHeight: 56 }}
              placeholder="Arrive 10 min early…"
              value={item.notes ?? ''}
              onChange={event => onUpdate(idx, 'notes', event.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
      >
        <Plus size={12} /> Add event
      </button>
    </>
  )
}

type WeddingPartySectionEditorProps = SharedEditorProps & {
  intro: string
  members: WeddingPartyMember[]
  eventId: string
  supabase: ReturnType<typeof createClient>
  onIntroChange: (value: string) => void
  onAdd: () => void
  onUpdate: (idx: number, field: keyof WeddingPartyMember, value: string) => void
  onRemove: (idx: number) => void
}

export function WeddingPartySectionEditor({
  intro,
  members,
  eventId,
  supabase,
  inputClassName,
  textareaClassName,
  inputStyle,
  onIntroChange,
  onAdd,
  onUpdate,
  onRemove,
}: WeddingPartySectionEditorProps) {
  return (
    <>
      <Field label="Introduction">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 72 }}
          placeholder="A short intro to your crew…"
          value={intro}
          onChange={event => onIntroChange(event.target.value)}
        />
      </Field>
      {members.map((member, idx) => (
        <div
          key={member.id}
          className="rounded-xl border p-3 flex flex-col gap-2"
          style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#F5F0E8', color: '#8B8670' }}
            >
              {ROLE_LABELS[member.role]}
            </span>
            <button
              onClick={() => onRemove(idx)}
              style={{ color: '#D4CCBC' }}
              onMouseEnter={event => { event.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={event => { event.currentTarget.style.color = '#D4CCBC' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Name</label>
              <input
                className={inputClassName}
                style={inputStyle}
                placeholder="Jane"
                value={member.name}
                onChange={event => onUpdate(idx, 'name', event.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Role</label>
              <select
                className={inputClassName}
                style={inputStyle}
                value={member.role}
                onChange={event => onUpdate(idx, 'role', event.target.value)}
              >
                {PARTY_ROLES.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Photo</label>
            <ImageUploadInput
              value={member.photo_url ?? ''}
              onChange={url => onUpdate(idx, 'photo_url', url)}
              placeholder="https://…"
              eventId={eventId}
              supabase={supabase}
              profile="avatar"
              showPreview
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Story (optional)</label>
            <textarea
              className={textareaClassName}
              style={{ ...inputStyle, minHeight: 56 }}
              placeholder="A little about this person…"
              value={member.story ?? ''}
              onChange={event => onUpdate(idx, 'story', event.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
      >
        <Plus size={12} /> Add person
      </button>
    </>
  )
}

type TravelSectionEditorProps = SharedEditorProps & {
  notes: string
  cards: TravelCard[]
  onNotesChange: (value: string) => void
  onAdd: () => void
  onUpdate: (idx: number, field: keyof TravelCard, value: string) => void
  onRemove: (idx: number) => void
}

export function TravelSectionEditor({
  notes,
  cards,
  inputClassName,
  textareaClassName,
  inputStyle,
  onNotesChange,
  onAdd,
  onUpdate,
  onRemove,
}: TravelSectionEditorProps) {
  return (
    <>
      <Field label="General notes">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 80 }}
          placeholder="Parking, transport, getting around…"
          value={notes}
          onChange={event => onNotesChange(event.target.value)}
        />
      </Field>
      {cards.map((card, idx) => (
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
              onChange={event => onUpdate(idx, 'type', event.target.value)}
            >
              <option value="hotel">Hotel</option>
              <option value="car_rental">Car rental</option>
              <option value="note">Note</option>
            </select>
            <button
              onClick={() => onRemove(idx)}
              style={{ color: '#D4CCBC' }}
              onMouseEnter={event => { event.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={event => { event.currentTarget.style.color = '#D4CCBC' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          {card.type !== 'note' && (
            <>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Name</label>
                <input
                  className={inputClassName}
                  style={inputStyle}
                  placeholder="The Grand Hotel"
                  value={card.name ?? ''}
                  onChange={event => onUpdate(idx, 'name', event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Address</label>
                <input
                  className={inputClassName}
                  style={inputStyle}
                  placeholder="123 Main St"
                  value={card.address ?? ''}
                  onChange={event => onUpdate(idx, 'address', event.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Website</label>
                <input
                  className={inputClassName}
                  style={inputStyle}
                  placeholder="https://…"
                  value={card.website ?? ''}
                  onChange={event => onUpdate(idx, 'website', event.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Notes</label>
            <textarea
              className={textareaClassName}
              style={{ ...inputStyle, minHeight: 56 }}
              placeholder="Use code WEDDING25 for 15% off…"
              value={card.notes ?? ''}
              onChange={event => onUpdate(idx, 'notes', event.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
      >
        <Plus size={12} /> Add card
      </button>
    </>
  )
}

type AttireSectionEditorProps = SharedEditorProps & {
  attire: EventContent['attire']
  onChange: (attire: NonNullable<EventContent['attire']>) => void
}

export function AttireSectionEditor({
  attire,
  inputClassName,
  textareaClassName,
  inputStyle,
  onChange,
}: AttireSectionEditorProps) {
  return (
    <>
      <Field label="Dress code">
        <input
          list="dress-codes"
          className={inputClassName}
          style={inputStyle}
          placeholder="Smart casual"
          value={attire?.dress_code ?? ''}
          onChange={event => onChange({ ...attire, dress_code: event.target.value })}
        />
        <datalist id="dress-codes">
          {DRESS_CODES.map(code => <option key={code} value={code} />)}
        </datalist>
      </Field>
      <Field label="Additional notes (optional)">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 80 }}
          placeholder="The ceremony is outdoors - we recommend layers…"
          value={attire?.notes ?? ''}
          onChange={event => onChange({ ...attire, notes: event.target.value })}
        />
      </Field>
    </>
  )
}

type RegistrySectionEditorProps = SharedEditorProps & {
  registry: EventContent['registry']
  onChange: (registry: NonNullable<EventContent['registry']>) => void
}

export function RegistrySectionEditor({
  registry,
  inputClassName,
  textareaClassName,
  inputStyle,
  onChange,
}: RegistrySectionEditorProps) {
  return (
    <>
      <Field label="Registry note">
        <textarea
          className={textareaClassName}
          style={{ ...inputStyle, minHeight: 100 }}
          placeholder="A short, warm message about your registry…"
          value={registry?.note ?? ''}
          onChange={event => onChange({ ...registry, note: event.target.value })}
        />
      </Field>
      <Field label="Button text">
        <input
          className={inputClassName}
          style={inputStyle}
          placeholder="View registry"
          value={registry?.button_text ?? ''}
          onChange={event => onChange({ ...registry, button_text: event.target.value })}
        />
      </Field>
    </>
  )
}

type FaqSectionEditorProps = SharedEditorProps & {
  items: FaqItem[]
  onAdd: () => void
  onUpdate: (idx: number, field: keyof FaqItem, value: string) => void
  onRemove: (idx: number) => void
}

export function FaqSectionEditor({
  items,
  inputClassName,
  textareaClassName,
  inputStyle,
  onAdd,
  onUpdate,
  onRemove,
}: FaqSectionEditorProps) {
  return (
    <>
      {items.map((item, idx) => (
        <div
          key={item.id}
          className="rounded-xl border p-3 flex flex-col gap-2"
          style={{ borderColor: '#E8E3D9', background: '#FAFAF7' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: '#8B8670' }}>Q{idx + 1}</span>
            <button
              onClick={() => onRemove(idx)}
              style={{ color: '#D4CCBC' }}
              onMouseEnter={event => { event.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={event => { event.currentTarget.style.color = '#D4CCBC' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Question</label>
            <input
              className={inputClassName}
              style={inputStyle}
              placeholder="Can I bring children?"
              value={item.question}
              onChange={event => onUpdate(idx, 'question', event.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: '#B5A98A' }}>Answer</label>
            <textarea
              className={textareaClassName}
              style={{ ...inputStyle, minHeight: 64 }}
              placeholder="We love your little ones, but…"
              value={item.answer}
              onChange={event => onUpdate(idx, 'answer', event.target.value)}
            />
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-xs transition-colors"
        style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
      >
        <Plus size={12} /> Add question
      </button>
    </>
  )
}
