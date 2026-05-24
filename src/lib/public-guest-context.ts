'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const STORAGE_PREFIX = 'joyabl-public-guest'

export function buildGuestQueryString(name?: string | null, email?: string | null) {
  const params = new URLSearchParams()
  if (name?.trim()) params.set('name', name.trim())
  if (email?.trim()) params.set('email', email.trim())
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function appendGuestContextToHref(href: string, name?: string | null, email?: string | null) {
  const params = new URLSearchParams()
  if (name?.trim()) params.set('name', name.trim())
  if (email?.trim()) params.set('email', email.trim())
  const query = params.toString()
  if (!query) return href
  return `${href}${href.includes('?') ? '&' : '?'}${query}`
}

interface StoredGuestContext {
  name: string
  email: string
}

function getStorageKey(slug: string) {
  return `${STORAGE_PREFIX}:${slug}`
}

function readStoredGuestContext(slug: string): StoredGuestContext | null {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(getStorageKey(slug))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<StoredGuestContext>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
    }
  } catch {
    return null
  }
}

export function usePublicGuestContext(slug: string) {
  const searchParams = useSearchParams()
  const searchName = searchParams.get('name') ?? ''
  const searchEmail = searchParams.get('email') ?? ''
  const [guest, setGuest] = useState<StoredGuestContext>(() => {
    if (typeof window === 'undefined') {
      return { name: searchName, email: searchEmail }
    }

    const stored = readStoredGuestContext(slug)
    return {
      name: searchName || stored?.name || '',
      email: searchEmail || stored?.email || '',
    }
  })

  const name = guest.name
  const email = guest.email
  const setName = (value: string) => setGuest(current => ({ ...current, name: value }))
  const setEmail = (value: string) => setGuest(current => ({ ...current, email: value }))

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getStorageKey(slug), JSON.stringify({ name, email }))
  }, [slug, name, email])

  const guestQueryString = useMemo(() => buildGuestQueryString(name, email), [name, email])
  const withGuestContext = useMemo(
    () => (href: string) => appendGuestContextToHref(href, name, email),
    [name, email]
  )

  return {
    name,
    setName,
    email,
    setEmail,
    guestQueryString,
    withGuestContext,
  }
}
