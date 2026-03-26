interface Props {
  src: string
  color: string
  className?: string
  style?: React.CSSProperties
}

export function StickerImage({ src, color, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'block',
        width: style?.width ?? '100%',
        aspectRatio: '1 / 1',
        lineHeight: 0,
        backgroundColor: color,
        maskImage: `url("${src}")`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: `url("${src}")`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
      }}
      aria-hidden="true"
    />
  )
}
