'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  House, LayoutTemplate, Gift, Users,
  Settings, HelpCircle, UserCircle, ChevronLeft, ChevronRight
} from 'lucide-react'

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
      { href: `/events/${eventId}/registry/settings`, label: 'Settings' },
    ],
  },
  {
    href: `/events/${eventId}/guests`,
    icon: Users,
    label: 'Guests',
    sub: [
      { href: `/events/${eventId}/guests`, label: 'Guest List' },
      { href: `/events/${eventId}/guests/emails`, label: 'Emails' },
    ],
  },
]

export function AppSidebar({ eventId, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col shrink-0 h-screen sticky top-0 border-r transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 56 : 240,
        background: '#FAFAF7',
        borderColor: '#E8E3D9',
      }}
    >
      {/* Logo + collapse toggle */}
      <div
        className="flex items-center h-14 px-3 border-b"
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
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-black/5"
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
          // Registry sub-items: /registry and /registry/settings are both under /registry
          // so check more specifically
          const parentActive = sectionActive

          return (
            <div key={href}>
              <Link
                href={href}
                title={collapsed ? label : undefined}
                className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={{
                  background: parentActive && sub.length === 0 ? '#2C2B26'
                    : parentActive && sub.length > 0 ? 'rgba(44,43,38,0.06)'
                    : 'transparent',
                  color: parentActive && sub.length === 0 ? '#FAFAF7' : parentActive ? '#2C2B26' : '#8B8670',
                  minHeight: 36,
                }}
                onMouseEnter={(e) => {
                  if (!parentActive) (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!parentActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  else if (sub.length > 0) (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)'
                }}
              >
                <Icon
                  size={16}
                  className="shrink-0"
                  style={{ color: parentActive && sub.length === 0 ? '#FAFAF7' : parentActive ? '#2C2B26' : '#8B8670' }}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>

              {/* Sub-items — only when not collapsed and section is active */}
              {!collapsed && parentActive && sub.length > 0 && (
                <div className="mt-0.5 ml-2 pl-5 flex flex-col gap-0.5 border-l" style={{ borderColor: '#E8E3D9' }}>
                  {sub.map(({ href: subHref, label: subLabel }) => {
                    // Exact match for sub-items (e.g. /guests vs /guests/emails)
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
        className="py-3 px-2 border-t flex flex-col gap-0.5"
        style={{ borderColor: '#E8E3D9' }}
      >
        {/* Account */}
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

        {/* Help */}
        <button
          title={collapsed ? 'Help' : undefined}
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors w-full text-left"
          style={{ color: '#B5A98A', minHeight: 36 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <HelpCircle size={16} className="shrink-0" />
          {!collapsed && <span>Help</span>}
        </button>

        {/* Settings */}
        <Link
          href={`/events/${eventId}/settings`}
          title={collapsed ? 'Settings' : undefined}
          className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#B5A98A', minHeight: 36 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(44,43,38,0.06)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  )
}
