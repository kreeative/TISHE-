interface RevealLayerProps {
  cursorX: number
  cursorY: number
  radius: number
}

export default function RevealLayer({ cursorX, cursorY, radius }: RevealLayerProps) {
  // Native CSS mask — GPU-composited, no per-frame canvas encoding.
  // The image itself comes from the .hero-bg-reveal class (orientation-aware).
  const mask = `radial-gradient(circle ${radius}px at ${cursorX}px ${cursorY}px,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,1) 40%,
    rgba(255,255,255,0.75) 60%,
    rgba(255,255,255,0.4) 75%,
    rgba(255,255,255,0.12) 88%,
    rgba(255,255,255,0) 100%)`

  return (
    <div
      className="absolute inset-0 hero-bg hero-bg-reveal bg-cover bg-no-repeat z-30 pointer-events-none"
      style={{
        maskImage: mask,
        WebkitMaskImage: mask,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      }}
    />
  )
}
