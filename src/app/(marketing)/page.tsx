import { FooterType } from '@/components/marketing/footer-type'
import { HeroSection } from '@/components/marketing/hero-section'
import { LandingSections } from '@/components/marketing/landing-sections'
import { Navbar } from '@/components/marketing/navbar'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <Navbar />
      <HeroSection />
      <LandingSections />

      {/* ── Footer ── */}
      <footer className="border-t" style={{ borderColor: '#D4CCBC' }}>
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <Link href="/#how-it-works" style={{ color: '#6B6255', textDecoration: 'none' }}>
              How it works
            </Link>
            <Link href="/#pricing" style={{ color: '#6B6255', textDecoration: 'none' }}>
              Pricing
            </Link>
            <Link href="/#faq" style={{ color: '#6B6255', textDecoration: 'none' }}>
              FAQ
            </Link>
            <a href="mailto:hello@joyabl.com" style={{ color: '#6B6255', textDecoration: 'none' }}>
              Contact
            </a>
          </div>
        </div>
        <FooterType />
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-xs" style={{ color: '#B5A98A' }}>© {new Date().getFullYear()} Joyabl</p>
        </div>
      </footer>
    </div>
  )
}
