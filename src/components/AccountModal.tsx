import { useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

// Shopify's hosted customer portal: secure sign-in with a one-time email
// code, order history, addresses. Follows the primary domain automatically.
const PORTAL_URL = 'https://theivorysukundu.myshopify.com/account'

const inputClass =
  'w-full bg-transparent border border-[#5A3224]/30 px-4 py-3 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 focus:outline-none focus:border-[#5A3224]'

function MemberCard({ name }: { name: string }) {
  return (
    <div
      className="relative w-full aspect-[8/5] p-6 flex flex-col justify-between border border-[#c99b6f]/35 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #120C0E 0%, #1B1113 55%, #2A1D20 100%)' }}
    >
      {/* soft gold sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(115deg, transparent 30%, rgba(201,155,111,0.12) 46%, transparent 62%)' }}
      />
      <div className="relative flex items-start justify-between">
        <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-10 w-auto" />
        <span className="text-[10px] text-[#c99b6f] uppercase font-semibold" style={{ letterSpacing: '0.3em' }}>
          Ivory Member
        </span>
      </div>
      <div className="relative">
        <p className="font-display text-2xl text-[#FAF7F3]">{name}</p>
        <div className="h-px w-16 bg-[#c99b6f]/50 my-2" />
        <p className="text-[10px] text-[#FAF7F3]/60 uppercase font-medium" style={{ letterSpacing: '0.25em' }}>
          The Sukundu Circle · est. 2026
        </p>
      </div>
    </div>
  )
}

export default function AccountModal() {
  const { accountOpen, setAccountOpen, memberName, setMemberName } = useStore()
  const [name, setName] = useState('')

  return (
    <AnimatePresence>
      {accountOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-5">
          <motion.button
            aria-label="Close account panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-[#1B1113]/40 backdrop-blur-sm cursor-default"
            onClick={() => setAccountOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-[#FAF7F3] text-[#1B1113] border border-[#5A3224]/20 p-8 shadow-[0_30px_80px_-24px_rgba(27,17,19,0.45)] max-h-[90dvh] overflow-y-auto"
          >
        <button
          onClick={() => setAccountOpen(false)}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#1B1113]/60 hover:text-[#5A3224] transition-colors"
        >
          <X size={20} strokeWidth={1.75} />
        </button>

        {memberName ? (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.3em' }}>
                Welcome to the Circle
              </p>
              <h2 className="font-display text-3xl mt-2">{memberName}</h2>
            </div>
            <MemberCard name={memberName} />
            <ul className="text-sm text-[#1B1113]/75 leading-[1.85] flex flex-col gap-2">
              <li>· Every $1 earns 1 strand. 200 strands = $20 off.</li>
              <li>· Early access to every drop and restock.</li>
              <li>· Full access to Sukundu School care guides.</li>
              <li>· A gift on your birthday, always.</li>
            </ul>
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className={`${ctaGlassOnLight} w-full inline-flex items-center justify-center gap-2`}
              style={ctaTracking}
            >
              My Orders &amp; Account
              <ExternalLink size={13} strokeWidth={2} />
            </a>
            <button
              className="text-xs font-medium text-[#1B1113]/45 hover:text-[#5A3224] uppercase transition-colors"
              style={{ letterSpacing: '0.15em' }}
              onClick={() => setMemberName(null)}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.3em' }}>
                The Sukundu Circle
              </p>
              <h2 className="font-display text-3xl mt-2">Your member portal</h2>
            </div>
            <p className="text-sm text-[#1B1113]/75 leading-[1.85]">
              Sign in securely with a one-time code sent to your email, no password to remember.
              View orders, track shipping, and manage your details.
            </p>
            <a
              href={PORTAL_URL}
              target="_blank"
              rel="noreferrer"
              className={`${ctaGlassOnLight} w-full inline-flex items-center justify-center gap-2`}
              style={ctaTracking}
            >
              Sign In to My Account
              <ExternalLink size={13} strokeWidth={2} />
            </a>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-[#5A3224]/15" />
              <span className="text-[10px] uppercase text-[#1B1113]/40 font-semibold" style={{ letterSpacing: '0.25em' }}>
                and
              </span>
              <div className="h-px flex-1 bg-[#5A3224]/15" />
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (name.trim()) setMemberName(name.trim())
              }}
            >
              <p className="text-sm text-[#1B1113]/75 leading-[1.85] -mt-2">
                Join the Circle, free forever. Earn strands on every order, unlock early access, and
                learn with Sukundu School.
              </p>
              <label className="sr-only" htmlFor="acc-name">First name</label>
              <input
                id="acc-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your first name"
                className={inputClass}
              />
              <button type="submit" className={`${ctaGlassOnLight} w-full`} style={ctaTracking}>
                Get My Member Card
              </button>
            </form>
          </div>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
