interface RevealLayerProps {
  image: string
  cursorX: number
  cursorY: number
  radius: number
}

export default function RevealLayer({ image, cursorX, cursorY, radius }: RevealLayerProps) {
  // Native CSS mask — GPU-composited, no per-frame canvas encoding
  const mask = `radial-gradient(circle ${radius}px at ${cursorX}px ${cursorY}px,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,1) 40%,
    rgba(255,255,255,0.75) 60%,
    rgba(255,255,255,0.4) 75%,
    rgba(255,255,255,0.12) 88%,
    rgba(255,255,255,0) 100%)`

  return (
    <div
      className="absolute inset-0 hero-bg bg-cover bg-no-repeat z-30 pointer-events-none"
      style={{
        backgroundImage: `url(${image})`,
        maskImage: mask,
        WebkitMaskImage: mask,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  )
}
