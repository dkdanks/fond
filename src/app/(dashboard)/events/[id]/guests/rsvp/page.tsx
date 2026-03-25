'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, GripVertical, Check, ChevronDown } from 'lucide-react'

interface RsvpQuestion {
  id: string
  question: string
  type: 'yes_no' | 'text' | 'dropdown'
  options?: string[]
  required: boolean
}

function uid() { return Math.random().toString(36).slice(2, 10) }

const DEFAULT_QUESTIONS: RsvpQuestion[] = [
  { id: 'attend', question: 'Will you be attending?', type: 'yes_no', required: true },
]

const COMMON_QUESTIONS = [
  { question: 'Dietary requirements', type: 'text' as const },
  { question: 'Song request', type: 'text' as const },
  { question: 'Meal preference', type: 'dropdown' as const, options: ['Chicken', 'Fish', 'Vegetarian', 'Vegan'] },
  { question: 'Will you need accommodation?', type: 'yes_no' as const },
  { question: 'How did you meet the couple?', type: 'text' as const },
]

const inputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
const inputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }

export default function RsvpPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [questions, setQuestions] = useState<RsvpQuestion[]>(DEFAULT_QUESTIONS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newOption, setNewOption] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('content').eq('id', id).single()
    const content = data?.content as Record<string, unknown> | null
    if (content?.rsvp_questions) {
      setQuestions(content.rsvp_questions as RsvpQuestion[])
    }
  }, [id, supabase])

  useEffect(() => { load() }, [load])

  async function save(qs: RsvpQuestion[]) {
    setSaving(true)
    const { data: ev } = await supabase.from('events').select('content').eq('id', id).single()
    const existing = (ev?.content as Record<string, unknown>) ?? {}
    await supabase.from('events').update({
      content: { ...existing, rsvp_questions: qs },
    } as Record<string, unknown>).eq('id', id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addQuestion(preset?: typeof COMMON_QUESTIONS[number]) {
    const newQ: RsvpQuestion = preset
      ? { id: uid(), question: preset.question, type: preset.type, options: preset.options, required: false }
      : { id: uid(), question: '', type: 'text', required: false }
    const updated = [...questions, newQ]
    setQuestions(updated)
    save(updated)
  }

  function updateQuestion(qid: string, patch: Partial<RsvpQuestion>) {
    const updated = questions.map(q => q.id === qid ? { ...q, ...patch } : q)
    setQuestions(updated)
    save(updated)
  }

  function removeQuestion(qid: string) {
    const updated = questions.filter(q => q.id !== qid)
    setQuestions(updated)
    save(updated)
  }

  function addOption(qid: string) {
    const val = (newOption[qid] ?? '').trim()
    if (!val) return
    const q = questions.find(q => q.id === qid)
    if (!q) return
    const updated = [...(q.options ?? []), val]
    updateQuestion(qid, { options: updated })
    setNewOption(prev => ({ ...prev, [qid]: '' }))
  }

  function removeOption(qid: string, opt: string) {
    const q = questions.find(q => q.id === qid)
    if (!q) return
    updateQuestion(qid, { options: (q.options ?? []).filter(o => o !== opt) })
  }

  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold" style={{ color: '#2C2B26', letterSpacing: '-0.02em' }}>RSVP</h1>
        <span className="text-xs transition-all" style={{ color: saving ? '#B5A98A' : saved ? '#4CAF50' : 'transparent' }}>
          {saving ? 'Saving…' : 'Saved'}
        </span>
      </div>
      <p className="text-sm mb-8" style={{ color: '#8B8670' }}>
        Configure the questions your guests will answer when they RSVP.
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-2xl border p-4 flex flex-col gap-3"
            style={{ background: 'white', borderColor: '#E8E3D9' }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <input
                  className={inputCls}
                  style={{ ...inputStyle, fontWeight: 500 }}
                  value={q.question}
                  onChange={e => updateQuestion(q.id, { question: e.target.value })}
                  placeholder="Your question…"
                  disabled={idx === 0}
                />
                {idx === 0 && (
                  <p className="text-xs" style={{ color: '#B5A98A' }}>This question is required and cannot be changed.</p>
                )}
              </div>
              {idx > 0 && (
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="mt-1 p-1.5 rounded-lg transition-colors shrink-0"
                  style={{ color: '#D4CCBC' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = '#FEF2F2' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#D4CCBC'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {idx > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: '#8B8670' }}>Response type</label>
                  <select
                    className={inputCls}
                    style={inputStyle}
                    value={q.type}
                    onChange={e => updateQuestion(q.id, { type: e.target.value as RsvpQuestion['type'] })}
                  >
                    <option value="yes_no">Yes / No</option>
                    <option value="text">Free text</option>
                    <option value="dropdown">Multiple choice</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs" style={{ color: '#2C2B26' }}>
                    <div
                      className="w-9 h-5 rounded-full relative transition-colors"
                      style={{ background: q.required ? '#2C2B26' : '#E8E3D9' }}
                      onClick={() => updateQuestion(q.id, { required: !q.required })}
                    >
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                        style={{ transform: q.required ? 'translateX(17px)' : 'translateX(2px)' }} />
                    </div>
                    Required
                  </label>
                </div>
              </div>
            )}
            {q.type === 'dropdown' && idx > 0 && (
              <div>
                <label className="block text-xs mb-2" style={{ color: '#8B8670' }}>Options</label>
                <div className="flex flex-col gap-1 mb-2">
                  {(q.options ?? []).map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <span className="flex-1 text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}>{opt}</span>
                      <button onClick={() => removeOption(q.id, opt)} style={{ color: '#D4CCBC' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#D4CCBC')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg border outline-none focus:border-[#2C2B26]"
                    style={{ borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }}
                    placeholder="Add option…"
                    value={newOption[q.id] ?? ''}
                    onChange={e => setNewOption(prev => ({ ...prev, [q.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption(q.id))}
                  />
                  <button
                    onClick={() => addOption(q.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: '#2C2B26', color: 'white' }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add question */}
      <div className="mb-6">
        {(() => {
          const availableCommon = COMMON_QUESTIONS.filter(
            cq => !questions.some(q => q.question === cq.question)
          )
          return availableCommon.length > 0 ? (
            <>
              <p className="text-xs font-medium mb-3" style={{ color: '#8B8670' }}>Common questions</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableCommon.map(cq => (
                  <button
                    key={cq.question}
                    onClick={() => addQuestion(cq)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all"
                    style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#2C2B26' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; (e.currentTarget as HTMLElement).style.borderColor = '#E8E3D9' }}
                  >
                    <Plus size={11} /> {cq.question}
                  </button>
                ))}
              </div>
            </>
          ) : null
        })()}
        <button
          onClick={() => addQuestion()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border-2 border-dashed transition-colors"
          style={{ borderColor: '#E8E3D9', color: '#B5A98A' }}
        >
          <Plus size={14} /> Add custom question
        </button>
      </div>

      <div className="p-4 rounded-2xl" style={{ background: '#F0EDE8' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#2C2B26' }}>How it works</p>
        <p className="text-xs leading-relaxed" style={{ color: '#8B8670' }}>
          These questions appear on your RSVP page when guests respond. Their answers will be shown in the guest list and can help you plan catering, seating and more.
        </p>
      </div>
    </div>
  )
}
