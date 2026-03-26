'use client'

import { useState } from 'react'
import type { ElementType } from 'react'
import { ChevronLeft, ChevronRight, Gift, Heart, House, Loader2, Sparkles, Star } from 'lucide-react'
import type { EventType } from '@/types'

export const EVENT_TYPES: { type: EventType; label: string; description: string; icon: ElementType }[] = [
  { type: 'wedding', label: 'Wedding', description: 'For the big day', icon: Heart },
  { type: 'baby_shower', label: 'Baby Shower', description: 'Welcome your little one', icon: Sparkles },
  { type: 'mitzvah', label: 'Bar / Bat Mitzvah', description: 'Mark this milestone', icon: Star },
  { type: 'housewarming', label: 'Housewarming', description: 'Celebrate a new home', icon: House },
  { type: 'birthday', label: 'Birthday', description: 'Another trip around the sun', icon: Gift },
]

export function CalendarPicker({ selected, onChange }: { selected: string; onChange: (date: string) => void }) {
  const today = new Date()
  const [viewing, setViewing] = useState({
    year: selected ? new Date(selected).getFullYear() : today.getFullYear(),
    month: selected ? new Date(selected).getMonth() : today.getMonth(),
  })

  const firstDay = new Date(viewing.year, viewing.month, 1).getDay()
  const daysInMonth = new Date(viewing.year, viewing.month + 1, 0).getDate()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  function prevMonth() {
    setViewing(value => value.month === 0 ? { year: value.year - 1, month: 11 } : { ...value, month: value.month - 1 })
  }

  function nextMonth() {
    setViewing(value => value.month === 11 ? { year: value.year + 1, month: 0 } : { ...value, month: value.month + 1 })
  }

  function selectDay(day: number) {
    const nextDate = new Date(viewing.year, viewing.month, day)
    onChange(nextDate.toISOString().split('T')[0])
  }

  const selectedDay = selected ? new Date(selected) : null
  const isSelected = (day: number) => {
    if (!selectedDay) return false
    return selectedDay.getFullYear() === viewing.year &&
      selectedDay.getMonth() === viewing.month &&
      selectedDay.getDate() === day
  }

  const isPast = (day: number) => {
    const nextDate = new Date(viewing.year, viewing.month, day)
    nextDate.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return nextDate < now
  }

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <div className="rounded-2xl border p-5 select-none" style={{ background: 'white', borderColor: '#E8E3D9', maxWidth: 320 }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5">
          <ChevronLeft size={16} style={{ color: '#8B8670' }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: '#2C2B26' }}>
          {monthNames[viewing.month]} {viewing.year}
        </span>
        <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5">
          <ChevronRight size={16} style={{ color: '#8B8670' }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0 mb-1">
        {days.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium" style={{ color: '#B5A98A' }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, index) => (
          <div key={index} className="h-9 flex items-center justify-center">
            {day !== null && (
              <button
                onClick={() => !isPast(day) && selectDay(day)}
                disabled={isPast(day)}
                className="w-9 h-9 rounded-lg text-sm flex items-center justify-center transition-all"
                style={{
                  background: isSelected(day) ? '#2C2B26' : 'transparent',
                  color: isSelected(day) ? 'white' : isPast(day) ? '#D4CCBC' : '#2C2B26',
                  cursor: isPast(day) ? 'default' : 'pointer',
                  fontWeight: isSelected(day) ? 600 : 400,
                }}
                onMouseEnter={event => { if (!isSelected(day) && !isPast(day)) event.currentTarget.style.background = 'rgba(44,43,38,0.06)' }}
                onMouseLeave={event => { if (!isSelected(day)) event.currentTarget.style.background = 'transparent' }}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function EventTypeStep({
  selectedType,
  canContinue,
  onSelectType,
  onContinue,
}: {
  selectedType: EventType
  canContinue: boolean
  onSelectType: (type: EventType) => void
  onContinue: () => void
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
        What are you celebrating?
      </h1>
      <p className="text-base mb-10" style={{ color: '#8B8670' }}>
        Choose and we&rsquo;ll set everything up for you.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-10">
        {EVENT_TYPES.map(({ type, label, description, icon: Icon }) => {
          const selected = selectedType === type
          return (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              className="text-left rounded-2xl p-5 border-2 transition-all"
              style={{
                borderColor: selected ? '#2C2B26' : '#E8E3D9',
                background: selected ? 'rgba(44,43,38,0.06)' : 'white',
              }}
            >
              <div
                className="mb-3 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: selected ? '#2C2B26' : '#F0EDE8' }}
              >
                <Icon size={16} style={{ color: selected ? 'white' : '#8B8670' }} />
              </div>
              <div className="font-semibold text-sm mb-0.5" style={{ color: '#2C2B26' }}>{label}</div>
              <div className="text-xs" style={{ color: '#8B8670' }}>{description}</div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: canContinue ? '#2C2B26' : '#E8E3D9', color: canContinue ? 'white' : '#B5A98A' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export function NamesStep({
  type,
  hostName,
  partnerName,
  title,
  canContinue,
  onHostNameChange,
  onPartnerNameChange,
  onBack,
  onContinue,
}: {
  type: EventType
  hostName: string
  partnerName: string
  title: string
  canContinue: boolean
  onHostNameChange: (value: string) => void
  onPartnerNameChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
        {type === 'wedding' ? "Let's start with your names." : "What's your name?"}
      </h1>
      <p className="text-base mb-10" style={{ color: '#8B8670' }}>
        {type === 'wedding' ? "We'll use these across your page." : "We'll personalise your page for you."}
      </p>

      {type === 'wedding' ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>First partner</label>
            <input
              autoFocus
              className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
              style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
              placeholder="e.g. Sarah"
              value={hostName}
              onChange={event => onHostNameChange(event.target.value)}
              onFocus={event => { event.currentTarget.style.borderColor = '#2C2B26' }}
              onBlur={event => { event.currentTarget.style.borderColor = '#E8E3D9' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Second partner</label>
            <input
              className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
              style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
              placeholder="e.g. Tom"
              value={partnerName}
              onChange={event => onPartnerNameChange(event.target.value)}
              onFocus={event => { event.currentTarget.style.borderColor = '#2C2B26' }}
              onBlur={event => { event.currentTarget.style.borderColor = '#E8E3D9' }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>Your first name</label>
          <input
            autoFocus
            className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
            style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26' }}
            placeholder={
              type === 'birthday' ? 'e.g. Alex' :
              type === 'baby_shower' ? 'e.g. Emma' :
              type === 'mitzvah' ? 'e.g. Noah' :
              'e.g. The Smiths'
            }
            value={hostName}
            onChange={event => onHostNameChange(event.target.value)}
            onFocus={event => { event.currentTarget.style.borderColor = '#2C2B26' }}
            onBlur={event => { event.currentTarget.style.borderColor = '#E8E3D9' }}
          />
        </div>
      )}

      {title ? (
        <div className="mb-10 px-4 py-3 rounded-xl" style={{ background: '#F0EDE8' }}>
          <p className="text-xs mb-0.5" style={{ color: '#B5A98A' }}>Your page will be called</p>
          <p className="font-semibold" style={{ color: '#2C2B26' }}>{title}</p>
          <p className="text-xs mt-1" style={{ color: '#B5A98A' }}>You can change this any time from the website builder.</p>
        </div>
      ) : (
        <div className="mb-10" />
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-3 rounded-xl text-sm transition-colors" style={{ color: '#8B8670' }}>
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: canContinue ? '#2C2B26' : '#E8E3D9', color: canContinue ? 'white' : '#B5A98A' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export function DetailsStep({
  title,
  date,
  dateUndecided,
  location,
  onDateChange,
  onToggleDateUndecided,
  onLocationChange,
  onBack,
  onContinue,
}: {
  title: string
  date: string
  dateUndecided: boolean
  location: string
  onDateChange: (value: string) => void
  onToggleDateUndecided: () => void
  onLocationChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
        {title ? `${title}.` : 'When is the big day?'}
      </h1>
      <p className="text-base mb-8" style={{ color: '#8B8670' }}>
        When is it? You can always update this later.
      </p>

      <div className={`mb-6 transition-opacity ${dateUndecided ? 'opacity-40 pointer-events-none' : ''}`}>
        <CalendarPicker selected={date} onChange={onDateChange} />
      </div>

      <label className="flex items-center gap-3 mb-8 cursor-pointer select-none">
        <div
          className="w-11 h-6 rounded-full transition-colors relative"
          style={{ background: dateUndecided ? '#2C2B26' : '#E8E3D9' }}
          onClick={onToggleDateUndecided}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ transform: dateUndecided ? 'translateX(21px)' : 'translateX(2px)' }}
          />
        </div>
        <span className="text-sm" style={{ color: '#2C2B26' }}>We haven&rsquo;t decided yet</span>
      </label>

      <div className="mb-10">
        <label className="block text-xs font-medium mb-2" style={{ color: '#8B8670' }}>
          Where is it? <span style={{ color: '#B5A98A' }}>(optional)</span>
        </label>
        <input
          className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-all"
          style={{ borderColor: '#E8E3D9', background: 'white', color: '#2C2B26', maxWidth: 320 }}
          placeholder="e.g. Sydney, Australia"
          value={location}
          onChange={event => onLocationChange(event.target.value)}
          onFocus={event => { event.currentTarget.style.borderColor = '#2C2B26' }}
          onBlur={event => { event.currentTarget.style.borderColor = '#E8E3D9' }}
        />
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-3 rounded-xl text-sm transition-colors" style={{ color: '#8B8670' }}>Back</button>
        <button
          onClick={onContinue}
          className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ background: '#2C2B26', color: 'white' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export function SlugStep({
  slug,
  slugStatus,
  suggestions,
  creating,
  canCreate,
  onSlugChange,
  onSelectSuggestion,
  onBack,
  onCreate,
}: {
  slug: string
  slugStatus: 'idle' | 'checking' | 'available' | 'taken'
  suggestions: string[]
  creating: boolean
  canCreate: boolean
  onSlugChange: (value: string) => void
  onSelectSuggestion: (value: string) => void
  onBack: () => void
  onCreate: () => void
}) {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2" style={{ color: '#2C2B26' }}>
        Choose your URL.
      </h1>
      <p className="text-base mb-10" style={{ color: '#8B8670' }}>
        This is the link you&rsquo;ll share with your guests.
      </p>

      <div className="mb-6">
        <div
          className="flex items-center rounded-xl border overflow-hidden"
          style={{ borderColor: '#E8E3D9', background: 'white' }}
        >
          <span className="pl-4 pr-1 text-sm shrink-0" style={{ color: '#B5A98A' }}>
            joyabl.com/
          </span>
          <input
            autoFocus
            className="flex-1 py-3 pr-3 text-sm outline-none font-medium"
            style={{ color: '#2C2B26', background: 'transparent' }}
            placeholder="your-url"
            value={slug}
            onChange={event => onSlugChange(event.target.value)}
          />
          <div className="pr-4 pl-2 flex items-center gap-1.5 shrink-0">
            {slugStatus === 'checking' && <Loader2 size={14} className="animate-spin" style={{ color: '#B5A98A' }} />}
            {slugStatus === 'available' && (
              <>
                <div className="w-2 h-2 rounded-full" style={{ background: '#4CAF50' }} />
                <span className="text-xs" style={{ color: '#4CAF50' }}>Available</span>
              </>
            )}
            {slugStatus === 'taken' && (
              <>
                <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
                <span className="text-xs" style={{ color: '#EF4444' }}>Taken</span>
              </>
            )}
          </div>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-10">
          {suggestions.map(suggestion => (
            <button
              key={suggestion}
              onClick={() => onSelectSuggestion(suggestion)}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all"
              style={{
                borderColor: slug === suggestion ? '#2C2B26' : '#E8E3D9',
                background: slug === suggestion ? 'rgba(44,43,38,0.06)' : 'white',
                color: '#2C2B26',
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-10" />
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="px-5 py-3 rounded-xl text-sm transition-colors" style={{ color: '#8B8670' }}>Back</button>
        <button
          onClick={onCreate}
          disabled={!canCreate || creating}
          className="px-7 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          style={{ background: canCreate ? '#2C2B26' : '#E8E3D9', color: canCreate ? 'white' : '#B5A98A' }}
        >
          {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create your page'}
        </button>
      </div>
    </div>
  )
}
