export type EventType = 'wedding' | 'baby_shower' | 'mitzvah' | 'housewarming' | 'birthday'
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

export interface WeddingPartyMember {
  id: string
  role: 'maid_of_honour' | 'best_man' | 'bridesmaid' | 'groomsman' | 'ring_bearer' | 'flower_person' | 'other'
  name: string
  photo_url?: string
  story?: string
}

export interface TravelCard {
  id: string
  type: 'hotel' | 'car_rental' | 'note'
  name?: string
  address?: string
  website?: string
  notes?: string
  button_text?: string
}

export interface PlacedSticker {
  id: string        // unique instance id
  src: string       // path e.g. '/stickers/florals/rose.svg'
  x: number         // % of preview width  (0–100)
  y: number         // % of preview height (0–100)
  width: number     // % of preview width
  rotation: number  // degrees
  opacity: number   // 0–1
  color: string     // hex color applied directly to SVG fill
}

export interface EventContent {
  welcome?: {
    greeting?: string
    show_rsvp?: boolean
    rsvp_deadline?: string
    rsvp_button_text?: string
  }
  our_story?: {
    introduction?: string
    story?: string
    images?: string[]
    // legacy fields kept for compatibility
    text?: string
    photo_url?: string
  }
  schedule?: ScheduleItem[]
  attire?: {
    dress_code?: string
    notes?: string
  }
  wedding_party?: {
    introduction?: string
    members?: WeddingPartyMember[]
  }
  travel?: {
    notes?: string
    cards?: TravelCard[]
    // legacy
    hotels?: HotelItem[]
  }
  registry?: {
    note?: string
    button_text?: string
  }
  faq?: FaqItem[]
  _palette?: { primary: string; bg: string }
  _theme?: string         // theme id (see lib/themes.ts)
  _heroLayout?: 'centered' | 'full-bleed' | 'split' | 'illustrated'
  _font?: string          // legacy: single font fallback
  _displayFont?: string   // heading / display font (names, section titles)
  _bodyFont?: string      // body / paragraph font
  _section_layouts?: Record<string, string>  // sectionId → layoutVariantId
  _section_order?: string[]
  _hidden_sections?: string[]
  _stickers?: PlacedSticker[]
  custom_sections?: Array<{ id: string; title: string; text?: string; images?: string[] }>
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
  group_name: string | null
  display_order: number | null
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
  first_name: string | null
  last_name: string | null
  email: string
  phone: string | null
  rsvp_status: RsvpStatus
  meal_preference: string | null
  plus_one: boolean
  message: string | null
  note: string | null
  tags: string[]
  invitation_sent_at: string | null
  responded_at: string | null
  created_at: string
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  baby_shower: 'Baby Shower',
  mitzvah: 'Bar / Bat Mitzvah',
  housewarming: 'Housewarming',
  birthday: 'Birthday',
}

export const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  wedding: 'Celebrate your big day and give guests a meaningful way to contribute',
  baby_shower: 'Welcome your little one with help from the people who love you most',
  mitzvah: 'Mark this milestone with heartfelt gifts from family and friends',
  housewarming: 'Step into your new home with a little help from those who care',
  birthday: 'Celebrate another trip around the sun with gifts that actually matter',
}

/** @deprecated use EVENT_TYPE_ICON_NAMES for lucide icons */
export const EVENT_TYPE_EMOJIS: Record<EventType, string> = {
  wedding: '💍',
  baby_shower: '🍼',
  mitzvah: '✡️',
  housewarming: '🏡',
  birthday: '🎂',
}

// Lucide icon names for each event type — import from lucide-react at usage site
export const EVENT_TYPE_ICON_NAMES: Record<EventType, string> = {
  wedding:      'Heart',
  baby_shower:  'Sparkles',
  mitzvah:      'Star',
  housewarming: 'Home',
  birthday:     'Gift',
}

export const EVENT_TYPE_COLORS: Record<EventType, { primary: string; accent: string }> = {
  wedding:      { primary: '#2C2B26', accent: '#B5A98A' },
  baby_shower:  { primary: '#2C2B26', accent: '#6B7A5E' },
  mitzvah:      { primary: '#2C2B26', accent: '#C8BFA8' },
  housewarming: { primary: '#4A3728', accent: '#B5A98A' },
  birthday:     { primary: '#2C2B26', accent: '#8B8670' },
}

export const JOYABL_FEE_RATE = 0.0498 // 4.98%
/** @deprecated use JOYABL_FEE_RATE */
export const FOND_FEE_RATE = JOYABL_FEE_RATE

export function calculateFee(amountPence: number): number {
  return Math.round(amountPence * JOYABL_FEE_RATE)
}

export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
