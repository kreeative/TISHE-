// One CTA style across the site: squared glassmorphism, uppercase Montserrat, wide tracking.
const ctaBase =
  'inline-block text-xs font-semibold uppercase px-7 py-3.5 transition-colors text-center backdrop-blur-md border cursor-pointer'

export const ctaTracking = { letterSpacing: '0.2em' } as const

// glass button for dark grounds
export const ctaGlass = `${ctaBase} bg-white/15 border-white/30 text-[#FFF8F2] hover:bg-white/30`

// glass button for light (ivory) grounds
export const ctaGlassOnLight = `${ctaBase} bg-[#1a120c]/5 border-[#1a120c]/30 text-[#1a120c] hover:bg-[#1a120c]/10`
