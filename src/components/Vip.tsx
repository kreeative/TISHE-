import { useState } from 'react'
import { ctaGlassOnLight, ctaTracking } from './cta'

export default function Vip() {
  const [email, setEmail] = useState('')
  const [joined, setJoined] = useState(false)

  return (
    <section id="contact" className="bg-[#FFF8F2] text-[#1a120c] py-20 sm:py-28 px-5 sm:px-10 md:px-16">
      <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
        <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.35em' }}>
          Something big is coming
        </p>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mt-4 leading-[1.05]" style={{ textWrap: 'balance' }}>
          Join the VIP list
        </h2>
        <p className="mt-5 max-w-md text-sm sm:text-base text-[#1a120c]/75 leading-relaxed">
          Early access to launches, restocks, and VIP-only pricing — straight to your inbox.
        </p>

        {joined ? (
          <p className="mt-10 text-sm font-semibold text-[#5A3224]" style={{ letterSpacing: '0.15em' }}>
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
              className="flex-1 bg-transparent border border-[#5A3224]/30 px-5 py-3.5 text-sm text-[#1a120c] placeholder:text-[#1a120c]/40 focus:outline-none focus:border-[#5A3224]"
            />
            <button type="submit" className={ctaGlassOnLight} style={ctaTracking}>
              Join Now
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
