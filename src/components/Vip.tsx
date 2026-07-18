import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

export default function Vip() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  return (
    <section
      id="contact"
      className="relative overflow-hidden text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16"
      style={{ background: 'radial-gradient(120% 140% at 50% 100%, #FFFDFA 0%, #FAF7F3 50%, #F7E9DA 100%)' }}
    >
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
        <Reveal className="flex flex-col items-center">
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            Something big is coming
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-5 leading-[1.16]" style={{ textWrap: 'balance' }}>
            Join the VIP list
          </h2>
          <p className="mt-6 max-w-md text-sm sm:text-base text-[#1B1113]/75 leading-[1.85]">
            Early access to launches, restocks, and VIP-only pricing, straight to your inbox.
          </p>
        </Reveal>

        <AnimatePresence mode="wait">
          {joined ? (
            <motion.p
              key="joined"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 text-sm font-semibold text-[#5A3224]"
              style={{ letterSpacing: '0.08em' }}
            >
              YOU'RE ON THE LIST. WATCH YOUR INBOX
            </motion.p>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
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
                className="flex-1 bg-white/40 backdrop-blur-sm border border-[#5A3224]/30 px-5 py-3.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 transition-colors focus:outline-none focus:border-[#5A3224] focus:bg-white/70"
              />
              <button type="submit" className={ctaGlassOnLight} style={ctaTracking}>
                Join Now
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
