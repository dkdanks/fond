const FONT_VARIABLES: Record<string, string> = {
  'Plus Jakarta Sans': 'var(--font-jakarta)',
  'Playfair Display': 'var(--font-playfair-display)',
  'Cormorant Garamond': 'var(--font-cormorant-garamond)',
  Lora: 'var(--font-lora)',
  'EB Garamond': 'var(--font-eb-garamond)',
  'Libre Baskerville': 'var(--font-libre-baskerville)',
  'Crimson Text': 'var(--font-crimson-text)',
  'Josefin Sans': 'var(--font-josefin-sans)',
  Montserrat: 'var(--font-montserrat)',
  Raleway: 'var(--font-raleway)',
  'DM Serif Display': 'var(--font-dm-serif-display)',
  Italiana: 'var(--font-italiana)',
  'Great Vibes': 'var(--font-great-vibes)',
}

export function resolveFontFamily(fontName: string | null | undefined, fallback = 'serif') {
  if (!fontName) return fallback
  return `${FONT_VARIABLES[fontName] ?? fontName}, ${fallback}`
}
