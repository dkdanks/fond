export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: '#F0EDE8', ...style }}
    />
  )
}

export function SkeletonRow({ cols }: { cols: number }) {
  const widths = [140, 180, 80, 100, 120, 60, 80]
  return (
    <tr style={{ borderBottom: '1px solid #F0EDE8' }}>
      <td className="pl-5 py-3.5 w-10">
        <div className="w-4 h-4 rounded" style={{ background: '#F0EDE8' }} />
      </td>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="animate-pulse rounded-md"
            style={{ height: 13, width: widths[i % widths.length], background: '#F0EDE8' }}
          />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ background: 'white', borderColor: '#E8E3D9' }}>
      <div className="animate-pulse rounded-md h-3 w-16" style={{ background: '#F0EDE8' }} />
      <div className="animate-pulse rounded-md h-7 w-24" style={{ background: '#F0EDE8' }} />
      <div className="animate-pulse rounded-md h-3 w-20" style={{ background: '#F0EDE8' }} />
    </div>
  )
}
