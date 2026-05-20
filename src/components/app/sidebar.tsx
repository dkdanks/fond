'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  House, LayoutTemplate, Gift, Users,
  Settings, HelpCircle, UserCircle, ChevronLeft, ChevronRight, LogOut, Menu, X, ChevronDown, CheckCircle2, Plus
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { HelpModal } from '@/components/app/help-modal'
import { getEventLifecycleStatus } from '@/lib/events'

interface SidebarProps {
  eventId: string
  userEmail?: string | null
  currentEventTitle: string
  currentEventDate: string | null
  events: Array<{ id: string; title: string; date: string | null; status: 'draft' | 'published' }>
  canCreateEvent: boolean
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

function getEventBadgeTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'EV'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
}

function getLifecycleLabel(date: string | null) {
  return getEventLifecycleStatus(date) === 'coming_up' ? 'Coming up' : 'Complete'
}

function getVisibilityLabel(status: 'draft' | 'published') {
  return status === 'published' ? 'Live' : 'Draft'
}

export function AppSidebar({
  eventId,
  userEmail,
  currentEventTitle,
  currentEventDate,
  events,
  canCreateEvent,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!mobileOpen) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  // Close switcher on outside click
  useEffect(() => {
    if (!switcherOpen) return
    function handler(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [switcherOpen])

  // Close switcher on navigation
  useEffect(() => { setSwitcherOpen(false) }, [pathname])

  const router = useRouter()
  const currentLifecycleLabel = getLifecycleLabel(currentEventDate)
  const currentEventBadge = getEventBadgeTitle(currentEventTitle)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Shared event list used in both expanded and collapsed popovers
  const switcherPopoverContent = (
    <>
      <div className="border-b px-4 py-3" style={{ borderColor: '#F0EDE8' }}>
        <p className="text-sm font-medium" style={{ color: '#2C2B26' }}>Your events</p>
        <p className="mt-1 text-xs" style={{ color: '#8B8670' }}>Switch between events or create a new one.</p>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-2">
        {events.map(event => {
          const isCurrent = event.id === eventId
          const lifecycleLabel = getLifecycleLabel(event.date)
          const visibilityLabel = getVisibilityLabel(event.status)
          return (
            <Link
              key={event.id}
              href={`/events/${event.id}/home`}
              onClick={() => { setSwitcherOpen(false); setMobileOpen(false) }}
              className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
              style={{
                background: isCurrent ? '#F8F5EF' : '#FFFFFF',
                borderColor: isCurrent ? '#D8CFBD' : 'transparent',
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-medium"
                style={{ background: isCurrent ? '#2C2B26' : '#F5F0E8', color: isCurrent ? '#FAFAF7' : '#6B6255' }}
              >
                {getEventBadgeTitle(event.title)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium" style={{ color: '#2C2B26' }}>{event.title}</p>
                  {isCurrent && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: '#2C2B26', color: '#FAFAF7' }}>
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px]" style={{ color: '#8B8670' }}>
                  {lifecycleLabel} · {visibilityLabel}
                </p>
              </div>
              {isCurrent && <CheckCircle2 size={14} style={{ color: '#8B8670' }} />}
            </Link>
          )
        })}
      </div>
      <div className="border-t p-3" style={{ borderColor: '#F0EDE8' }}>
        {canCreateEvent ? (
          <Link
            href="/events/new"
            onClick={() => { setSwitcherOpen(false); setMobileOpen(false) }}
            className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
            style={{ background: '#2C2B26', color: '#FAFAF7' }}
          >
            <Plus size={14} />
            Create new event
          </Link>
        ) : (
          <div className="rounded-xl px-3 py-2 text-sm" style={{ background: '#FAFAF7', color: '#8B8670' }}>
            You can have up to 3 upcoming events at once.
          </div>
        )}
      </div>
    </>
  )

  const navContent = (
    <>
      {/* Logo + close (mobile) / collapse (desktop) */}
      <div
        className="border-b px-3 py-3 shrink-0"
        style={{ borderColor: '#E8E3D9' }}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <Link
            href={`/events/${eventId}/home`}
            className="text-[13px] font-medium leading-none"
            style={{ color: '#2C2B26', letterSpacing: '-0.05em', textDecoration: 'none' }}
            onClick={() => setMobileOpen(false)}
          >
            joyabl
          </Link>
          {!collapsed && (
            <>
              <button
                className="md:hidden w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-black/5"
                style={{ color: '#8B8670' }}
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={14} />
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="hidden md:flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5"
                style={{ color: '#8B8670' }}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5"
              style={{ color: '#8B8670' }}
              aria-label="Expand sidebar"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
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
                  color: parentActive && sub.length === 0 ? '#FAFAF7' : parentActive ? '#2C2B26' : '#8B8670',
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
        {/* Event switcher */}
        <div ref={switcherRef} className="relative mb-1 pb-2 border-b" style={{ borderColor: '#E8E3D9' }}>
          {!collapsed ? (
            <>
              <button
                type="button"
                onClick={() => setSwitcherOpen(value => !value)}
                className="flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-[#F8F5EF]"
                style={{ color: '#2C2B26', borderColor: '#E8E3D9', background: '#FFFFFF' }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-medium"
                  style={{ background: '#F5F0E8', color: '#6B6255' }}
                >
                  {currentEventBadge}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: '#2C2B26' }}>
                    {currentEventTitle}
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: '#8B8670' }}>
                    {currentLifecycleLabel}
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: '#8B8670',
                    flexShrink: 0,
                    transform: switcherOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 160ms ease',
                  }}
                />
              </button>
              {switcherOpen && (
                <div
                  className="absolute left-0 bottom-[calc(100%+10px)] z-50 w-[280px] rounded-2xl border shadow-xl"
                  style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}
                >
                  {switcherPopoverContent}
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setSwitcherOpen(value => !value)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-[#F8F5EF] mx-auto"
                style={{ borderColor: '#E8E3D9', background: '#FFFFFF', color: '#2C2B26' }}
                aria-label={`Switch event. Current: ${currentEventTitle}`}
                title={currentEventTitle}
              >
                <span className="text-[11px] font-medium">{currentEventBadge}</span>
              </button>
              {switcherOpen && (
                <div
                  className="absolute left-[calc(100%+12px)] bottom-0 z-50 w-[280px] rounded-2xl border shadow-xl"
                  style={{ borderColor: '#E8E3D9', background: '#FFFFFF' }}
                >
                  {switcherPopoverContent}
                </div>
              )}
            </>
          )}
        </div>

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
