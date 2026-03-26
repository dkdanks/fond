'use client'

import type { DragEvent, ReactNode, RefCallback } from 'react'
import { ChevronRight, Eye, EyeOff, GripVertical } from 'lucide-react'

type SectionAccordionItemProps = {
  itemKey: string
  label: string
  icon: ReactNode
  isOpen: boolean
  isHidden: boolean
  isDragging: boolean
  isDropTarget: boolean
  draggable?: boolean
  allowDrop?: boolean
  onToggleOpen: () => void
  onToggleHidden: () => void
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void
  onDragEnd?: () => void
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void
  onDrop?: () => void
  onDragLeave?: () => void
  itemRef?: RefCallback<HTMLDivElement>
  children: ReactNode
}

export function SectionAccordionItem({
  itemKey,
  label,
  icon,
  isOpen,
  isHidden,
  isDragging,
  isDropTarget,
  draggable = true,
  allowDrop = true,
  onToggleOpen,
  onToggleHidden,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
  itemRef,
  children,
}: SectionAccordionItemProps) {
  return (
    <div
      key={itemKey}
      ref={itemRef}
      className="border-b transition-colors"
      style={{
        borderColor: '#F0EDE8',
        background: isDropTarget ? '#F5F0E8' : 'transparent',
      }}
      onDragOver={allowDrop ? onDragOver : undefined}
      onDrop={allowDrop ? onDrop : undefined}
      onDragLeave={allowDrop ? onDragLeave : undefined}
    >
      <div
        draggable={draggable}
        onDragStart={draggable ? onDragStart : undefined}
        onDragEnd={draggable ? onDragEnd : undefined}
        className="flex items-center hover:bg-[#FAFAF7] transition-colors select-none"
        style={{ opacity: isDragging ? 0.4 : 1 }}
      >
        <div
          className="pl-3 pr-1 py-3.5 shrink-0"
          style={{
            color: '#D4CCBC',
            cursor: draggable ? 'grab' : 'default',
            visibility: draggable ? 'visible' : 'hidden',
          }}
        >
          <GripVertical size={14} />
        </div>
        <div className="pr-2 shrink-0" style={{ color: isHidden ? '#D4CCBC' : '#8B8670' }}>
          {icon}
        </div>
        <button
          onClick={onToggleOpen}
          className="flex-1 py-3.5 text-left text-sm font-medium"
          style={{ color: isHidden ? '#C8BFA8' : '#2C2B26' }}
        >
          {label}
        </button>
        <button
          onClick={event => {
            event.stopPropagation()
            onToggleHidden()
          }}
          title={isHidden ? 'Show section' : 'Hide section'}
          className="p-2 shrink-0 transition-colors"
          style={{ color: isHidden ? '#C8BFA8' : '#D4CCBC' }}
          onMouseEnter={event => { event.currentTarget.style.color = '#8B8670' }}
          onMouseLeave={event => { event.currentTarget.style.color = isHidden ? '#C8BFA8' : '#D4CCBC' }}
        >
          {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
        <button
          onClick={onToggleOpen}
          className="pl-1 pr-3 py-3.5 shrink-0"
        >
          <ChevronRight
            size={13}
            style={{
              color: '#C8BFA8',
              transform: isOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform 150ms',
            }}
          />
        </button>
      </div>
      {isOpen && (
        <div className="px-4 pb-4 flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  )
}
