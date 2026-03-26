'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t text-xs"
      style={{ borderColor: '#E8E3D9', color: '#8B8670' }}
    >
      <span>{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30"
          style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="px-2" style={{ color: '#2C2B26' }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-30"
          style={{ borderColor: '#E8E3D9', color: '#2C2B26', background: 'white' }}
          aria-label="Next page"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}
