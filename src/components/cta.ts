// One CTA style across the site: squared glassmorphism, uppercase Montserrat, wide tracking.
const ctaBase =
  'inline-block text-xs font-semibold uppercase px-7 py-3.5 text-center backdrop-blur-md border cursor-pointer ' +
  'transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:duration-100'

export const ctaTracking = { letterSpacing: '0.08em' } as const

// glass button for dark grounds
export const ctaGlass =
  `${ctaBase} bg-white/15 border-white/30 text-[#FAF7F3] shadow-[0_1px_2px_rgba(0,0,0,0.15)] ` +
  'hover:bg-white/30 hover:border-white/50 hover:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)]'

// glass button for light (ivory) grounds
export const ctaGlassOnLight =
  `${ctaBase} bg-[#1B1113]/5 border-[#1B1113]/25 text-[#1B1113] shadow-[0_1px_2px_rgba(90,50,36,0.08)] ` +
  'hover:bg-[#1B1113]/10 hover:border-[#5A3224]/50 hover:shadow-[0_14px_32px_-12px_rgba(90,50,36,0.35)]'
