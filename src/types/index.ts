export type EventType = 'wedding' | 'baby_shower' | 'mitzvah' | 'housewarming'
export type RsvpStatus = 'pending' | 'attending' | 'declined'
export type ContributionStatus = 'pending' | 'completed' | 'refunded'
export type EventStatus = 'draft' | 'published'

export interface Profile {
  id: string
  name: string | null
  email: string | null
  created_at: string
}

export interface ScheduleItem {
  id: string
  title: string
  time?: string
  venue?: string
  address?: string
  notes?: string
}

export interface HotelItem {
  id: string
  name: string
  url?: string
  notes?: string
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

export interface EventContent {
  our_story?: {
    text?: string
    photo_url?: string
  }
  schedule?: ScheduleItem[]
  attire?: {
    dress_code?: string
    notes?: string
  }
  travel?: {
    notes?: string
    hotels?: HotelItem[]
  }
  faq?: FaqItem[]
}

export interface Event {
  id: string
  user_id: string
  type: EventType
  title: string
  slug: string
  date: string | null
  location: string | null
  description: string | null
  cover_image_url: string | null
  primary_color: string
  accent_color: string
  status: EventStatus
  content: EventContent | null
  created_at: string
}

export interface RegistryPool {
  id: string
  event_id: string
  title: string
  description: string | null
  image_url: string | null
  target_amount: number | null
  created_at: string
}

export interface Contribution {
  id: string
  event_id: string
  pool_id: string | null
  contributor_name: string
  contributor_email: string | null
  message: string | null
  amount: number
  fee_amount: number
  status: ContributionStatus
  stripe_payment_intent_id: string | null
  created_at: string
}

export interface Guest {
  id: string
  event_id: string
  name: string
  email: string
  rsvp_status: RsvpStatus
  meal_preference: string | null
  plus_one: boolean
  message: string | null
  invitation_sent_at: string | null
  responded_at: string | null
  created_at: string
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  baby_shower: 'Baby Shower',
  mitzvah: 'Mitzvah',
  housewarming: 'Housewarming',
}

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  wedding: 'Celebrate your big day and give guests a meaningful way to contribute',
  baby_shower: 'Welcome your little one with help from the people who love you most',
  mitzvah: 'Mark this milestone with heartfelt gifts from family and friends',
  housewarming: 'Step into your new home with a little help from those who care',
}

export const EVENT_TYPE_EMOJIS: Record<EventType, string> = {
  wedding: '💍',
  baby_shower: '🍼',
  mitzvah: '✡️',
  housewarming: '🏡',
}

export const EVENT_TYPE_COLORS: Record<EventType, { primary: string; accent: string }> = {
  wedding: { primary: '#1C1C1C', accent: '#C9A96E' },
  baby_shower: { primary: '#2D4A3E', accent: '#A8C5B8' },
  mitzvah: { primary: '#1E2B5E', accent: '#D4AF37' },
  housewarming: { primary: '#3D2B1F', accent: '#D4956A' },
}

export const FOND_FEE_RATE = 0.045 // 4.5%

export function calculateFee(amountPence: number): number {
  return Math.round(amountPence * FOND_FEE_RATE)
}

export function formatCurrency(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}
