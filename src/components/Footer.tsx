import { useState } from 'react'
import { Mail } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { subscribeEmail } from '../lib/shopify'
import { trackSignUp } from '../lib/analytics'

// Legal pages: written in Shopify admin (Settings → Policies),
// rendered on-site at /legal/:handle in the brand's typography.
const LEGAL_LINKS = [
  { label: 'Shipping Policy', to: '/legal/shipping-policy' },
  { label: 'Refunds & Returns', to: '/legal/refund-policy' },
  { label: 'Privacy Policy', to: '/legal/privacy-policy' },
  { label: 'Terms of Service', to: '/legal/terms-of-service' },
]

const SHOP_LINKS = [
  { label: 'Our Hair', to: '/our-hair' },
  { label: 'Collections', to: '/collections' },
  { label: 'Hair Quiz', to: '/quiz' },
  { label: 'The Circle', to: '/circle' },
  { label: 'Contact', to: '/contact' },
]

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

const footerHeading = 'text-[11px] font-semibold uppercase text-[#c99b6f]'
const footerLink =
  'text-sm text-[#FAF7F3]/65 hover:text-[#FAF7F3] transition-colors leading-[2.2]'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  return (
    <footer
      className="relative overflow-hidden text-[#FAF7F3] px-5 sm:px-10 md:px-16 pt-16 pb-8"
      style={{ background: 'radial-gradient(140% 180% at 15% 0%, #2A1D20 0%, #1B1113 55%, #120C0E 100%)' }}
    >
      <div
        className="pointer-events-none absolute -bottom-24 right-0 w-[360px] h-[360px] rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(201,155,111,0.25) 0%, rgba(201,155,111,0) 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_1.3fr] gap-10 md:gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-5">
          <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-14 w-auto self-start" />
          <p className="text-sm text-[#FAF7F3]/60 leading-[1.85] max-w-[260px]">
            Luxury raw hair, redefined. Glueless half wigs and raw bundles, installed in sixty
            seconds and made to last for years.
          </p>
          <div className="flex items-center gap-5 mt-1">
            <a
              href="https://www.instagram.com/theivorysukundu"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-[#FAF7F3]/60 hover:text-[#FAF7F3] transition-colors"
            >
              <InstagramIcon size={20} />
            </a>
            <a
              href="https://www.tiktok.com/@theivorysukundu"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="text-[#FAF7F3]/60 hover:text-[#FAF7F3] transition-colors"
            >
              <TikTokIcon size={19} />
            </a>
            <a
              href="mailto:hello@theivorysukundu.com"
              aria-label="Email"
              className="text-[#FAF7F3]/60 hover:text-[#FAF7F3] transition-colors"
            >
              <Mail size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>

        {/* Shop */}
        <nav aria-label="Shop">
          <p className={footerHeading} style={{ letterSpacing: '0.06em' }}>Shop</p>
          <ul className="mt-4 flex flex-col">
            {SHOP_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? `${footerLink} font-semibold text-[#FAF7F3]` : footerLink
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal */}
        <nav aria-label="Legal">
          <p className={footerHeading} style={{ letterSpacing: '0.06em' }}>Legal</p>
          <ul className="mt-4 flex flex-col">
            {LEGAL_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  className={({ isActive }) =>
                    isActive ? `${footerLink} font-semibold text-[#FAF7F3]` : footerLink
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Newsletter */}
        <div>
          <p className={footerHeading} style={{ letterSpacing: '0.06em' }}>The Circle</p>
          {joined ? (
            <p className="mt-4 text-sm text-[#FAF7F3]/70 leading-[1.85]">
              Welcome to the Circle. Your 10% code is on its way to your inbox.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-[#FAF7F3]/60 leading-[1.85]">
                10% off your first order, early access to every drop.
              </p>
              <form
                className="mt-4 flex"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!email.trim()) return
                  setJoined(true)
                  trackSignUp('footer')
                  void subscribeEmail(email.trim())
                }}
              >
                <label className="sr-only" htmlFor="footer-email">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="flex-1 min-w-0 bg-transparent border border-[#FAF7F3]/25 px-4 py-3 text-sm text-[#FAF7F3] placeholder:text-[#FAF7F3]/40 focus:outline-none focus:border-[#c99b6f]"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-[#FAF7F3] text-[#1B1113] text-xs font-semibold uppercase px-5 hover:bg-white transition-colors"
                  style={{ letterSpacing: '0.08em' }}
                >
                  Join
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative max-w-6xl mx-auto mt-14 pt-6 border-t border-[#FAF7F3]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[#FAF7F3]/45">© 2026 The Ivory Sukundu. All rights reserved.</p>
        <p className="text-xs text-[#FAF7F3]/45">Raw hair, redefined.</p>
      </div>
    </footer>
  )
}
