import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { subscribeEmail } from '../lib/shopify'

const STORAGE_KEY = 'tis-welcome-popup'
const DISCOUNT_CODE = 'WELCOME15'

export default function WelcomePopup() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => setOpen(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed')
    setOpen(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    localStorage.setItem(STORAGE_KEY, 'joined')
    setJoined(true)
    void subscribeEmail(email.trim())
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — code is still visible to copy manually */
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-5">
          {/* dimmed backdrop — intentionally not clickable; only the X, Decline,
              or signing up closes the offer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-[#1B1113]/45 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl bg-[#FAF7F3] text-[#1B1113] shadow-[0_40px_100px_-30px_rgba(27,17,19,0.6)] overflow-hidden grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] max-h-[92dvh]"
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 text-[#1B1113]/60 hover:text-[#5A3224] transition-colors"
            >
              <X size={20} strokeWidth={1.75} />
            </button>

            {/* wig-wash campaign image */}
            <div
              className="h-36 sm:h-auto bg-cover bg-center"
              style={{ backgroundImage: "url('/images/tex-curls.jpg')" }}
              role="img"
              aria-label="Sukundu curls being washed"
            />

            <div className="p-8 sm:p-10 flex flex-col items-center text-center overflow-y-auto">
              <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
                Welcome to the Circle
              </p>

              {joined ? (
                <>
                  <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">You're in.</h2>
                  <p className="mt-4 text-sm text-[#1B1113]/75 leading-[1.85] max-w-xs">
                    Use this code at checkout for 15% off your first order:
                  </p>
                  <button
                    onClick={copyCode}
                    className="mt-5 border border-dashed border-[#5A3224]/50 px-8 py-4 text-lg font-semibold tracking-[0.25em] hover:bg-[#5A3224]/5 transition-colors"
                    title="Copy code"
                  >
                    {DISCOUNT_CODE}
                  </button>
                  <p className="mt-3 text-xs text-[#1B1113]/50 h-4">
                    {copied ? 'Copied to clipboard ✓' : 'Tap the code to copy it'}
                  </p>
                  <button
                    onClick={dismiss}
                    className="mt-6 w-full bg-[#1B1113] text-[#FAF7F3] text-xs font-semibold uppercase px-8 py-4 hover:bg-[#2A1D20] transition-colors"
                    style={{ letterSpacing: '0.2em' }}
                  >
                    Start Shopping
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">
                    Enjoy 15% off
                  </h2>
                  <p className="text-sm font-semibold uppercase mt-3 text-[#1B1113]/70" style={{ letterSpacing: '0.25em' }}>
                    your first order
                  </p>
                  <p className="mt-5 text-sm text-[#1B1113]/70 leading-[1.85] max-w-xs">
                    Join the Sukundu Circle and get 15% off your first order — plus early access to
                    every drop and restock.
                  </p>
                  <form onSubmit={submit} className="w-full mt-6 flex flex-col gap-3">
                    <label className="sr-only" htmlFor="welcome-email">Email address</label>
                    <input
                      id="welcome-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-transparent border border-[#5A3224]/30 px-4 py-3.5 text-sm text-center text-[#1B1113] placeholder:text-[#1B1113]/40 focus:outline-none focus:border-[#5A3224]"
                    />
                    <button
                      type="submit"
                      className="w-full bg-[#1B1113] text-[#FAF7F3] text-xs font-semibold uppercase px-8 py-4 hover:bg-[#2A1D20] transition-colors"
                      style={{ letterSpacing: '0.2em' }}
                    >
                      Continue
                    </button>
                  </form>
                  <button
                    onClick={dismiss}
                    className="mt-5 text-xs font-medium text-[#1B1113]/50 hover:text-[#5A3224] uppercase underline underline-offset-4 transition-colors"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    Decline offer
                  </button>
                  <p className="mt-5 text-[10px] text-[#1B1113]/40 leading-relaxed max-w-xs">
                    By signing up you agree to receive marketing emails from The Ivory Sukundu. You can
                    unsubscribe at any time. Offer excludes gift cards and can't be combined with other codes.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
