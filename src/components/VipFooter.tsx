import { useState } from 'react'
import { Mail } from 'lucide-react'
import { ctaLight, ctaTracking } from './cta'

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export default function VipFooter() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  return (
    <>
      <section id="contact" className="bg-black text-[#FFF8F2] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
          <p className="text-xs font-medium uppercase text-[#FFF8F2]/60" style={{ letterSpacing: '0.35em' }}>
            Something big is coming
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 leading-[1.05]" style={{ textWrap: 'balance' }}>
            Join the <span className="italic">VIP list</span>
          </h2>
          <p className="mt-5 max-w-md text-sm sm:text-base text-[#FFF8F2]/70 leading-relaxed">
            Early access to launches, restocks, and VIP-only pricing — straight to your inbox.
          </p>

          {joined ? (
            <p className="mt-10 text-sm font-medium text-[#c99b6f]" style={{ letterSpacing: '0.15em' }}>
              YOU'RE ON THE LIST — WATCH YOUR INBOX
            </p>
          ) : (
            <form
              className="mt-10 flex flex-col sm:flex-row w-full max-w-md gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                if (email.trim()) setJoined(true)
              }}
            >
              <label className="sr-only" htmlFor="vip-email">Email address</label>
              <input
                id="vip-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 bg-transparent border border-[#FFF8F2]/30 px-5 py-3.5 text-sm placeholder:text-[#FFF8F2]/40 focus:outline-none focus:border-[#FFF8F2]/70"
              />
              <button type="submit" className={ctaLight} style={ctaTracking}>
                Join Now
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="bg-black text-[#FFF8F2] border-t border-[#FFF8F2]/10 px-5 sm:px-10 md:px-16 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-12 w-auto" />
          <div className="flex items-center gap-5">
            <a href="#" aria-label="Instagram" className="text-[#FFF8F2]/60 hover:text-[#FFF8F2] transition-colors">
              <InstagramIcon size={20} />
            </a>
            <a href="mailto:hello@theivorysukundu.com" aria-label="Email" className="text-[#FFF8F2]/60 hover:text-[#FFF8F2] transition-colors">
              <Mail size={20} strokeWidth={1.5} />
            </a>
          </div>
          <p className="text-xs text-[#FFF8F2]/40">© 2026 The Ivory Sukundu. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
