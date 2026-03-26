import type { Guest } from '@/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HEADER_RE = /^(name|email|guest|first.?name|last.?name)/i

export type ParsedRow = { name: string; email: string; error?: string }
export type ParsedCsvRow = { first_name: string; last_name: string; email: string; phone: string }
export type RsvpStatus = 'attending' | 'declined' | 'pending'
export type AddMode = 'none' | 'single' | 'paste' | 'csv'
export type Filter = 'all' | 'attending' | 'declined' | 'pending'

export function parseGuestList(raw: string): ParsedRow[] {
  return raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).flatMap((line): ParsedRow[] => {
    if (HEADER_RE.test(line)) return []
    const parts = line.includes('\t')
      ? line.split('\t').map(part => part.trim().replace(/^"|"$/g, ''))
      : line.split(',').map(part => part.trim().replace(/^"|"$/g, ''))
    const emailIdx = parts.findIndex(part => EMAIL_RE.test(part))
    if (emailIdx === -1) return [{ name: line, email: '', error: 'No valid email found' }]
    const email = parts[emailIdx]
    const name = parts.filter((_, idx) => idx !== emailIdx).join(', ').trim() || email.split('@')[0]
    return [{ name, email }]
  })
}

export function parseCsvGuests(raw: string): ParsedCsvRow[] {
  return raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).flatMap((line): ParsedCsvRow[] => {
    const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''))
    if (parts.length < 2) return []
    return [{
      first_name: parts[0] ?? '',
      last_name: parts[1] ?? '',
      email: parts[2] ?? '',
      phone: parts[3] ?? '',
    }]
  })
}

function parseRsvpAnswers(message: string | null): Record<string, string> {
  if (!message) return {}
  return Object.fromEntries(
    message.split('\n').filter(Boolean).map(line => {
      const idx = line.indexOf(': ')
      return idx > -1 ? [line.slice(0, idx), line.slice(idx + 2)] : ['Message', line]
    })
  )
}

export function exportGuestsCsv(guests: Guest[]) {
  const questionHeaders: string[] = []
  const seenQuestions = new Set<string>()

  for (const guest of guests) {
    for (const question of Object.keys(parseRsvpAnswers(guest.message ?? null))) {
      if (!seenQuestions.has(question)) {
        seenQuestions.add(question)
        questionHeaders.push(question)
      }
    }
  }

  const baseHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'RSVP Status', 'Plus One', 'Tags', 'Note', 'Invited At']
  const headers = [...baseHeaders, ...questionHeaders]

  const rows = guests.map(guest => {
    const answers = parseRsvpAnswers(guest.message ?? null)
    return [
      guest.first_name ?? guest.name.split(' ')[0],
      guest.last_name ?? guest.name.split(' ').slice(1).join(' '),
      guest.email,
      guest.phone ?? '',
      guest.rsvp_status,
      guest.plus_one ? 'Yes' : 'No',
      (guest.tags ?? []).join('; '),
      guest.note ?? '',
      guest.invitation_sent_at ? new Date(guest.invitation_sent_at).toLocaleDateString() : '',
      ...questionHeaders.map(question => answers[question] ?? ''),
    ]
  })

  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'guests.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}
