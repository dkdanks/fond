export type HeroLayout = 'centered' | 'full-bleed' | 'split' | 'illustrated'

export interface Theme {
  id: string
  name: string
  description: string
  displayFont: string
  bodyFont: string
  primary: string
  bg: string
  heroLayout: HeroLayout
}

export const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Timeless and sophisticated',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Lora',
    primary: '#2C2B26',
    bg: '#F5F0E8',
    heroLayout: 'centered',
  },
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Whimsical and heartfelt',
    displayFont: 'Great Vibes',
    bodyFont: 'Lora',
    primary: '#1B3A5C',
    bg: '#EFF4FA',
    heroLayout: 'centered',
  },
  {
    id: 'garden',
    name: 'Garden',
    description: 'Fresh and botanical',
    displayFont: 'Italiana',
    bodyFont: 'Crimson Text',
    primary: '#3D5A48',
    bg: '#EFF5F0',
    heroLayout: 'split',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Modern and striking',
    displayFont: 'Josefin Sans',
    bodyFont: 'Montserrat',
    primary: '#1A1A1A',
    bg: '#FAFAFA',
    heroLayout: 'full-bleed',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and understated',
    displayFont: 'Playfair Display',
    bodyFont: 'Raleway',
    primary: '#1A1A1A',
    bg: '#FAFAFA',
    heroLayout: 'centered',
  },
  {
    id: 'blush',
    name: 'Blush',
    description: 'Romantic and intimate',
    displayFont: 'DM Serif Display',
    bodyFont: 'EB Garamond',
    primary: '#7B3654',
    bg: '#FDF0F5',
    heroLayout: 'split',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Rich and earthy',
    displayFont: 'Libre Baskerville',
    bodyFont: 'Lora',
    primary: '#2D4A3E',
    bg: '#EBF2EC',
    heroLayout: 'full-bleed',
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Refined and contemporary',
    displayFont: 'Raleway',
    bodyFont: 'Montserrat',
    primary: '#334155',
    bg: '#F1F5F9',
    heroLayout: 'centered',
  },
]

export function getThemeById(id: string): Theme | undefined {
  return THEMES.find(t => t.id === id)
}
