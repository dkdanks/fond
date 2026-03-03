'use client'

import { useState } from 'react'

const TABS = ['Our story', 'The day', 'Attire', 'Gift funds'] as const
type Tab = typeof TABS[number]

export function ProductPreview() {
  const [tab, setTab] = useState<Tab>('Our story')
  const [interacted, setInteracted] = useState(false)

  function handleTab(t: Tab) {
    setTab(t)
    setInteracted(true)
  }

  return (
    <div className="mt-16 rounded-3xl overflow-hidden border shadow-sm" style={{ borderColor: '#E5E5E4', background: 'white' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#F4F4F3', background: '#FAFAF9' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E5E5E4' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E5E5E4' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#E5E5E4' }} />
        </div>
        <div
          className="text-xs px-3 py-1 rounded-md mx-auto"
          style={{ background: 'white', color: '#9CA3AF', border: '1px solid #E5E5E4' }}
        >
          fond.app/e/sarah-and-james
        </div>
      </div>

      {/* Event header */}
      <div className="px-8 pt-8 pb-0" style={{ background: '#FAFAF9' }}>
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-6">
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#C9A96E' }}>Wedding</p>
            <h2 className="text-2xl font-semibold mb-1" style={{ color: '#1C1C1C' }}>Sarah & James</h2>
            <p className="text-sm mb-5" style={{ color: '#9CA3AF' }}>14 June 2025 · The Orangery, Kew Gardens</p>
            <div className="flex gap-3 justify-center">
              <div className="px-4 py-2 rounded-[10px] text-xs font-medium" style={{ background: '#1C1C1C', color: 'white' }}>RSVP</div>
              <div className="px-4 py-2 rounded-[10px] text-xs font-medium" style={{ background: '#C9A96E', color: 'white' }}>Give a gift</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b" style={{ borderColor: '#E5E5E4' }}>
            {TABS.map((t) => {
              const isActive = tab === t
              const shouldPulse = !interacted && !isActive
              return (
                <button
                  key={t}
                  onClick={() => handleTab(t)}
                  className={`px-3 py-2 text-xs font-medium transition-colors relative${shouldPulse ? ' animate-pulse' : ''}`}
                  style={{ color: isActive ? '#1C1C1C' : '#9CA3AF' }}
                >
                  {t}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: '#C9A96E' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-8 pb-8 pt-6" style={{ background: '#FAFAF9', minHeight: 220 }}>
        <div className="max-w-xl mx-auto">

          {tab === 'Our story' && (
            <div className="grid grid-cols-5 gap-6 items-start">
              <div className="col-span-3">
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  We met on a rainy Tuesday in Edinburgh at a tiny bookshop neither of us meant to walk into. James had his nose in a travel memoir. Sarah was looking for something entirely different and ended up with a copy of the same book.
                </p>
                <p className="text-sm leading-relaxed mt-3" style={{ color: '#6B7280' }}>
                  That was four years ago. We've since moved cities, adopted a dog named Biscuit, and somehow talked each other into this.
                </p>
              </div>
              <div className="col-span-2">
                <img
                  src="/images/couple.jpg"
                  alt="Sarah and James"
                  className="w-full rounded-xl object-cover"
                  style={{ height: 160, objectPosition: 'center 30%' }}
                />
              </div>
            </div>
          )}

          {tab === 'The day' && (
            <div>
              <div className="flex flex-col gap-0">
                {[
                  { time: '2:00 pm', title: 'Ceremony', venue: 'The Orangery, Kew Gardens' },
                  { time: '3:30 pm', title: 'Drinks & canapés', venue: 'The Terrace' },
                  { time: '6:00 pm', title: 'Wedding breakfast', venue: 'The Great Hall' },
                  { time: '9:00 pm', title: 'Evening reception', venue: 'The Great Hall' },
                ].map((item, idx, arr) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: '#C9A96E' }} />
                      {idx < arr.length - 1 && (
                        <div className="w-px flex-1 mt-1" style={{ background: '#E5E5E4', minHeight: 32 }} />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium" style={{ color: '#1C1C1C' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.time} · {item.venue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Attire' && (
            <div>
              <p className="text-xl font-semibold mb-4" style={{ color: '#1C1C1C' }}>Black tie</p>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                We'd love for guests to dress up with us. Suits and floor-length gowns preferred — but most importantly, something you feel wonderful in. The venue can be cool in the evening, so a layer is advisable.
              </p>
              <div className="mt-5 rounded-xl p-4" style={{ background: 'white', border: '1px solid #E5E5E4' }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#1C1C1C' }}>A note on colour</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>We'd prefer guests avoid ivory or white — other than that, anything goes.</p>
              </div>
            </div>
          )}

          {tab === 'Gift funds' && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Honeymoon', sub: 'Two weeks in Japan', raised: 1240, target: 3000, img: '/images/jet.jpg', pos: 'center 40%' },
                  { label: 'Our first home', sub: 'Kitchen renovation', raised: 890, target: 2500, img: '/images/cabin.jpg', pos: 'center 60%' },
                ].map((fund) => (
                  <div key={fund.label} className="rounded-xl border overflow-hidden" style={{ background: 'white', borderColor: '#E5E5E4' }}>
                    <div className="h-20 overflow-hidden">
                      <img
                        src={fund.img}
                        alt={fund.label}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: fund.pos }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-xs mb-0.5" style={{ color: '#1C1C1C' }}>{fund.label}</p>
                      <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{fund.sub}</p>
                      <div className="h-1 rounded-full" style={{ background: '#F4F4F3' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.round((fund.raised / fund.target) * 100)}%`, background: '#C9A96E' }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>£{fund.raised} raised</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
