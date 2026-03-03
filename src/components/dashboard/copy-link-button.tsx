'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy link'}
    </Button>
  )
}
