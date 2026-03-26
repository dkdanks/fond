import {
  BookOpen,
  CalendarDays,
  Crown,
  Gift,
  HelpCircle,
  Home,
  MapPin,
  Shirt,
} from 'lucide-react'
import type { EventType, WeddingPartyMember } from '@/types'

export const PALETTES = [
  { name: 'Forest', primary: '#2D4A3E', bg: '#EBF2EC' },
  { name: 'Blush', primary: '#7B3654', bg: '#FDF0F5' },
  { name: 'Navy', primary: '#1B3A5C', bg: '#EFF4FA' },
  { name: 'Slate', primary: '#334155', bg: '#F1F5F9' },
  { name: 'Earth', primary: '#4A3728', bg: '#F5EDE0' },
  { name: 'Sage', primary: '#3D5A48', bg: '#EFF5F0' },
  { name: 'Noir', primary: '#1A1A1A', bg: '#FAFAFA' },
  { name: 'Custom', primary: '#2C2B26', bg: '#FAFAF7' },
] as const

export const FONTS = [
  { name: 'Playfair', value: 'Playfair Display', class: 'font-playfair' },
  { name: 'Cormorant', value: 'Cormorant Garamond', class: 'font-cormorant' },
  { name: 'Lora', value: 'Lora', class: 'font-lora' },
  { name: 'EB Garamond', value: 'EB Garamond', class: 'font-garamond' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville', class: 'font-baskerville' },
  { name: 'Crimson Text', value: 'Crimson Text', class: 'font-crimson' },
  { name: 'Josefin Sans', value: 'Josefin Sans', class: 'font-josefin' },
  { name: 'Montserrat', value: 'Montserrat', class: 'font-montserrat' },
  { name: 'Raleway', value: 'Raleway', class: 'font-raleway' },
  { name: 'DM Serif Display', value: 'DM Serif Display', class: 'font-dm-serif' },
  { name: 'Italiana', value: 'Italiana', class: 'font-italiana' },
  { name: 'Great Vibes', value: 'Great Vibes', class: 'font-great-vibes' },
] as const

export type SectionKey = 'welcome' | 'story' | 'schedule' | 'wedding_party' | 'attire' | 'travel' | 'registry' | 'faq'

export const SECTIONS_BY_TYPE: Record<EventType, SectionKey[]> = {
  wedding: ['welcome', 'story', 'schedule', 'wedding_party', 'attire', 'travel', 'registry', 'faq'],
  baby_shower: ['welcome', 'story', 'schedule', 'registry', 'faq'],
  birthday: ['welcome', 'schedule', 'registry', 'faq'],
  mitzvah: ['welcome', 'story', 'schedule', 'attire', 'travel', 'registry', 'faq'],
  housewarming: ['welcome', 'schedule', 'registry', 'faq'],
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  welcome: 'Welcome',
  story: 'Our Story',
  schedule: 'Schedule',
  wedding_party: 'Wedding Party',
  attire: 'Attire',
  travel: 'Travel',
  registry: 'Registry',
  faq: 'FAQ',
}

export const SECTION_ICONS: Record<SectionKey, React.ElementType> = {
  welcome: Home,
  story: BookOpen,
  schedule: CalendarDays,
  wedding_party: Crown,
  attire: Shirt,
  travel: MapPin,
  registry: Gift,
  faq: HelpCircle,
}

export const SCHEDULE_SUGGESTIONS = [
  'Ceremony', 'Reception', 'Wedding Breakfast', 'Dinner', 'Luncheon',
  'Rehearsal Dinner', 'After Party', 'Day-after Brunch',
]

export const DRESS_CODES = [
  'Black tie', 'Black tie optional', 'Cocktail', 'Smart casual',
  'Casual', 'Garden party', 'Beach formal',
]

export const PARTY_ROLES: WeddingPartyMember['role'][] = [
  'maid_of_honour', 'best_man', 'bridesmaid', 'groomsman',
  'ring_bearer', 'flower_person', 'other',
]

export const ROLE_LABELS: Record<WeddingPartyMember['role'], string> = {
  maid_of_honour: 'Maid of Honour',
  best_man: 'Best Man',
  bridesmaid: 'Bridesmaid',
  groomsman: 'Groomsman',
  ring_bearer: 'Ring Bearer',
  flower_person: 'Flower Person',
  other: 'Other',
}
