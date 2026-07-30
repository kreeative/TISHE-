import { useState } from 'react'
import { Mail } from 'lucide-react'
import { ctaGlassOnLight, ctaTracking } from './cta'
import Reveal from './Reveal'

function Instagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

// FormSubmit routes the message to this inbox with no backend needed.
// First submission triggers a one-time activation email to confirm the address.
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/hello@theivorysukundu.com'

const inputClass =
  'w-full bg-white/45 backdrop-blur-sm border border-[#5A3224]/30 px-4 py-3.5 text-sm text-[#1B1113] placeholder:text-[#1B1113]/40 transition-colors focus:outline-none focus:border-[#5A3224] focus:bg-white/70'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          _subject: `New message from ${name} — The Ivory Sukundu`,
          _template: 'table',
        }),
      })
      if (res.ok) {
        setState('sent')
        setName('')
        setEmail('')
        setMessage('')
      } else {
        setState('error')
      }
    } catch {
      setState('error')
    }
  }

  return (
    <section
      className="relative overflow-hidden text-[#1B1113] py-20 sm:py-28 px-5 sm:px-10 md:px-16 min-h-[70vh]"
      style={{ background: 'radial-gradient(120% 140% at 50% 0%, #FFFDFA 0%, #FAF7F3 55%, #F7E9DA 100%)' }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">
        {/* Left: intro + direct channels */}
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            We'd love to hear from you
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl mt-5 leading-[1.16]" style={{ textWrap: 'balance' }}>
            Get in touch
          </h1>
          <p className="mt-6 max-w-md text-sm sm:text-base text-[#1B1113]/75 leading-[1.85]">
            Questions about length, texture, or your order? Send us a note and we'll get back to you
            within one business day.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            <a
              href="mailto:hello@theivorysukundu.com"
              className="group inline-flex items-center gap-3 text-sm text-[#1B1113]/80 hover:text-[#5A3224] transition-colors"
            >
              <span className="grid place-items-center w-9 h-9 border border-[#5A3224]/25 group-hover:border-[#5A3224] transition-colors">
                <Mail size={16} strokeWidth={1.75} />
              </span>
              hello@theivorysukundu.com
            </a>
            <a
              href="https://www.instagram.com/theivorysukundu"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 text-sm text-[#1B1113]/80 hover:text-[#5A3224] transition-colors"
            >
              <span className="grid place-items-center w-9 h-9 border border-[#5A3224]/25 group-hover:border-[#5A3224] transition-colors">
                <Instagram size={16} />
              </span>
              @theivorysukundu
            </a>
          </div>
        </Reveal>

        {/* Right: message form */}
        <Reveal delay={0.12}>
          {state === 'sent' ? (
            <div className="border border-[#5A3224]/20 bg-white/50 p-8 sm:p-10">
              <h2 className="font-display text-3xl">Thank you.</h2>
              <p className="mt-4 text-sm text-[#1B1113]/75 leading-[1.85]">
                Your message is on its way. We'll reply to your email within one business day.
              </p>
              <button
                onClick={() => setState('idle')}
                className="mt-6 text-xs font-medium uppercase text-[#5A3224] hover:text-[#1B1113] transition-colors"
                style={{ letterSpacing: '0.08em' }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div>
                <label className="sr-only" htmlFor="c-name">Your name</label>
                <input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} autoComplete="name" />
              </div>
              <div>
                <label className="sr-only" htmlFor="c-email">Your email</label>
                <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className={inputClass} autoComplete="email" />
              </div>
              <div>
                <label className="sr-only" htmlFor="c-message">Your message</label>
                <textarea id="c-message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help?" rows={6} className={`${inputClass} resize-none`} />
              </div>

              {state === 'error' && (
                <p className="text-sm text-[#8a2d1f] leading-relaxed">
                  Something went wrong sending your message. Please email us directly at
                  hello@theivorysukundu.com.
                </p>
              )}

              <button type="submit" disabled={state === 'sending'} className={`${ctaGlassOnLight} w-full sm:w-auto self-start disabled:opacity-50`} style={ctaTracking}>
                {state === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
