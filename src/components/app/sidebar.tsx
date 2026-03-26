'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  House, LayoutTemplate, Gift, Users,
  Settings, HelpCircle, UserCircle, ChevronLeft, ChevronRight, LogOut, Menu, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HelpModal } from '@/components/app/help-modal'

interface SidebarProps {
  eventId: string
  userEmail?: string | null
}

interface SubItem {
  href: string
  label: string
}

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  sub: SubItem[]
}

const navStructure = (eventId: string): NavItem[] => [
  {
    href: `/events/${eventId}/home`,
    icon: House,
    label: 'Home',
    sub: [],
  },
  {
    href: `/events/${eventId}/website`,
    icon: LayoutTemplate,
    label: 'Website',
    sub: [],
  },
  {
    href: `/events/${eventId}/registry`,
    icon: Gift,
    label: 'Registry',
    sub: [
      { href: `/events/${eventId}/registry`, label: 'Items' },
      { href: `/events/${eventId}/registry/contributions`, label: 'Contributions' },
      { href: `/events/${eventId}/registry/payments`, label: 'Payouts' },
    ],
  },
  {
    href: `/events/${eventId}/guests`,
    icon: Users,
    label: 'Guests',
    sub: [
      { href: `/events/${eventId}/guests`, label: 'Guest List' },
      { href: `/events/${eventId}/guests/rsvp`, label: 'RSVP' },
      { href: `/events/${eventId}/guests/emails`, label: 'Emails' },
    ],
  },
]

export function AppSidebar({ eventId, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navContent = (
    <>
      {/* Logo + close (mobile) / collapse (desktop) */}
      <div
        className="flex items-center h-14 px-3 border-b shrink-0"
        style={{ borderColor: '#E8E3D9' }}
      >
        {!collapsed && (
          <span
            className="flex-1 text-sm font-semibold tracking-tight ml-1"
            style={{ color: '#2C2B26', letterSpacing: '-0.04em' }}
          >
            joyabl
          </span>
        )}
        {collapsed && <div className="flex-1" />}

        {/* Mobile: close drawer */}
        <button
          className="md:hidden w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: '#8B8670' }}
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={14} />
        </button>

        {/* Desktop: collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden md:flex w-7 h-7 rounded-md items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: '#8B8670' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
        {navStructure(eventId).map(({ href, icon: Icon, label, sub }) => {
          const sectionActive = pathname === href || pathname.startsWith(href + '/')
          const parentActive = sectionActive

          return (
            <div key={href}>
              <Link
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: parentActive && sub.length === 0 ? '#2C2B26' : 'transparent',
                  color: parentActive ? '#2C2B26' : '#8B8670',
                  minHeight: 36,
                }}
                onClick={() => setMobileOpen(false)}
                onMouseEnter={(e) => {
                  if (!parentActive) (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (sub.length > 0 || !parentActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <Icon
                  size={16}
                  className="shrink-0"
                  style={{ color: parentActive && sub.length === 0 ? '#FAFAF7' : parentActive ? '#2C2B26' : '#8B8670', flexShrink: 0 }}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>

              {/* Sub-items — always visible when not collapsed */}
              {!collapsed && sub.length > 0 && (
                <div className="mt-0.5 ml-2 pl-5 flex flex-col gap-0.5 border-l" style={{ borderColor: '#E8E3D9' }}>
                  {sub.map(({ href: subHref, label: subLabel }) => {
                    const subActive = pathname === subHref
                    return (
                      <Link
                        key={subHref}
                        href={subHref}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: subActive ? '#2C2B26' : 'transparent',
                          color: subActive ? '#FAFAF7' : '#8B8670',
                        }}
                        onClick={() => setMobileOpen(false)}
                        onMouseEnter={(e) => {
                          if (!subActive) (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)'
                        }}
                        onMouseLeave={(e) => {
                          if (!subActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                        }}
                      >
                        {subLabel}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div
        className="py-3 px-2 border-t flex flex-col gap-0.5 shrink-0"
        style={{ borderColor: '#E8E3D9' }}
      >
        <div
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg"
          style={{ minHeight: 36 }}
        >
          <UserCircle size={16} className="shrink-0" style={{ color: '#B5A98A' }} />
          {!collapsed && userEmail && (
            <span className="truncate text-xs" style={{ color: '#B5A98A' }}>
              {userEmail}
            </span>
          )}
        </div>

        <button
          title={collapsed ? 'Help' : undefined}
          onClick={() => setHelpOpen(true)}
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors w-full text-left"
          style={{ color: '#B5A98A', minHeight: 36 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <HelpCircle size={16} className="shrink-0" />
          {!collapsed && <span>Help</span>}
        </button>
        <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

        <Link
          href={`/events/${eventId}/settings`}
          title={collapsed ? 'Settings' : undefined}
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#B5A98A', minHeight: 36 }}
          onClick={() => setMobileOpen(false)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors w-full text-left"
          style={{ color: '#B5A98A', minHeight: 36 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile hamburger trigger (fixed, only visible when drawer closed) ── */}
      <button
        className="md:hidden fixed top-3 left-3 z-40 w-9 h-9 rounded-xl flex items-center justify-center border transition-colors"
        style={{ background: '#FAFAF7', borderColor: '#E8E3D9', color: '#2C2B26' }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={16} />
      </button>

      {/* ── Mobile backdrop ────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop sidebar (sticky, part of flex layout) ─────────────────────── */}
      <aside
        className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? 56 : 240,
          background: '#FAFAF7',
          borderColor: '#E8E3D9',
        }}
      >
        {navContent}
      </aside>

      {/* ── Mobile drawer (fixed overlay, slides in from left) ───────────────── */}
      <aside
        className={`md:hidden flex flex-col fixed inset-y-0 left-0 z-50 border-r transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: 260,
          background: '#FAFAF7',
          borderColor: '#E8E3D9',
        }}
      >
        {navContent}
      </aside>
    </>
  )
}
