import {
  Cormorant_Garamond,
  Crimson_Text,
  DM_Serif_Display,
  EB_Garamond,
  Great_Vibes,
  Italiana,
  Josefin_Sans,
  Libre_Baskerville,
  Lora,
  Montserrat,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Raleway,
} from 'next/font/google'

export const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
})

export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair-display',
  weight: ['400', '500', '600', '700'],
})

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cormorant-garamond',
  weight: ['300', '400', '500', '600', '700'],
})

export const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
})

export const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-eb-garamond',
  weight: ['400', '500', '600', '700'],
})

export const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-libre-baskerville',
  weight: ['400', '700'],
})

export const crimsonText = Crimson_Text({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-crimson-text',
  weight: ['400', '600', '700'],
})

export const josefinSans = Josefin_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-josefin-sans',
  weight: ['300', '400', '500', '600', '700'],
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
})

export const raleway = Raleway({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-raleway',
  weight: ['300', '400', '500', '600', '700'],
})

export const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif-display',
  weight: ['400'],
})

export const italiana = Italiana({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-italiana',
  weight: ['400'],
})

export const greatVibes = Great_Vibes({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-great-vibes',
  weight: ['400'],
})

export const siteFontVariables = [
  jakartaSans.variable,
  playfairDisplay.variable,
  cormorantGaramond.variable,
  lora.variable,
  ebGaramond.variable,
  libreBaskerville.variable,
  crimsonText.variable,
  josefinSans.variable,
  montserrat.variable,
  raleway.variable,
  dmSerifDisplay.variable,
  italiana.variable,
  greatVibes.variable,
].join(' ')
