'use client'
import { useState } from 'react'

export function PasswordGate({
  correctPassword,
  children
}: {
  correctPassword: string
  children: React.ReactNode
}) {
  const [input, setInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [error, setError] = useState(false)

  function attempt() {
    if (input === correctPassword) {
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (unlocked) return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAFAF7' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#F0EDE8' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B8670" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: '#2C2B26' }}>This page is private</h1>
          <p className="text-sm" style={{ color: '#8B8670' }}>Enter the password to view this event page.</p>
        </div>
        <div className="flex flex-col gap-3">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            placeholder="Enter password"
            className="w-full px-4 py-3 text-sm rounded-xl border outline-none"
            style={{ borderColor: error ? '#EF4444' : '#E8E3D9', background: 'white', color: '#2C2B26' }}
            autoFocus
          />
          {error && <p className="text-xs text-center" style={{ color: '#EF4444' }}>Incorrect password. Try again.</p>}
          <button
            onClick={attempt}
            className="w-full py-3 rounded-xl text-sm font-medium"
            style={{ background: '#2C2B26', color: 'white' }}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  )
}
