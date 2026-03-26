'use client'

export const editorInputCls = 'w-full px-3 py-2 text-sm rounded-xl border outline-none transition-colors focus:border-[#2C2B26]'
export const editorInputStyle = { borderColor: '#E8E3D9', background: '#FAFAF7', color: '#2C2B26' }
export const editorTextareaCls = 'w-full px-3 py-2.5 text-sm rounded-xl border outline-none resize-none transition-colors focus:border-[#2C2B26]'

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      className="w-10 h-6 rounded-full relative cursor-pointer transition-colors shrink-0"
      style={{ background: on ? '#2C2B26' : '#E8E3D9' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: on ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium mb-1.5" style={{ color: '#8B8670' }}>
      {children}
    </label>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
