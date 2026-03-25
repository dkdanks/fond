import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RsvpForm, { type RsvpQuestion } from './rsvp-form'

const DEFAULT_QUESTIONS: RsvpQuestion[] = [
  { id: 'attend', question: 'Will you be attending?', type: 'yes_no', required: true },
]

export default async function RsvpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase
    .from('events')
    .select('id, title, content, primary_color, accent_color')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!ev) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content = (ev.content ?? {}) as Record<string, any>
  const palette = content._palette as Record<string, string> | undefined
  const primaryColor = palette?.primary ?? ev.primary_color ?? '#2C2B26'
  const bgColor = palette?.bg ?? ev.accent_color ?? '#F5F0E8'
  const font = (content._font as string | undefined) ?? 'Inter'
  const questions: RsvpQuestion[] =
    Array.isArray(content.rsvp_questions) && content.rsvp_questions.length > 0
      ? content.rsvp_questions
      : DEFAULT_QUESTIONS

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600&display=swap');`}</style>
      <Suspense>
        <RsvpForm
          slug={slug}
          eventId={ev.id}
          eventTitle={ev.title ?? ''}
          questions={questions}
          primaryColor={primaryColor}
          bgColor={bgColor}
          font={font}
        />
      </Suspense>
    </>
  )
}
