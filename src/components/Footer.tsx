import { Mail } from 'lucide-react'

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden text-[#FFF8F2] px-5 sm:px-10 md:px-16 py-10"
      style={{ background: 'radial-gradient(140% 180% at 15% 0%, #2a170c 0%, #1a0f08 55%, #120a05 100%)' }}
    >
      <div
        className="pointer-events-none absolute -bottom-24 right-0 w-[360px] h-[360px] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(201,155,111,0.25) 0%, rgba(201,155,111,0) 70%)' }}
      />
      <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-12 w-auto" />
        <div className="flex items-center gap-6">
          <a href="#" aria-label="Instagram" className="text-[#FFF8F2]/60 hover:text-[#FFF8F2] transition-colors">
            <InstagramIcon size={20} />
          </a>
          <a href="mailto:hello@theivorysukundu.com" aria-label="Email" className="text-[#FFF8F2]/60 hover:text-[#FFF8F2] transition-colors">
            <Mail size={20} strokeWidth={1.5} />
          </a>
        </div>
        <p className="text-xs text-[#FFF8F2]/45">© 2026 The Ivory Sukundu. All rights reserved.</p>
      </div>
    </footer>
  )
}
