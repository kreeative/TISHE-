// One CTA style across the site: sharp corners, uppercase Montserrat, wide tracking.
const ctaBase = 'inline-block text-xs font-semibold uppercase px-7 py-3.5 transition-colors text-center'

export const ctaTracking = { letterSpacing: '0.2em' } as const

// ivory button for dark grounds
export const ctaLight = `${ctaBase} bg-[#FFF8F2] text-black hover:bg-white`

// espresso button for light grounds
export const ctaDark = `${ctaBase} bg-[#1a120c] text-[#FFF8F2] hover:bg-[#5A3224]`
