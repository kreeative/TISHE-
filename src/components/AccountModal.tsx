import { useState } from 'react'
import { X } from 'lucide-react'
import { useStore } from './StoreContext'
import { ctaGlassOnLight, ctaTracking } from './cta'

const inputClass =
  'w-full bg-transparent border border-[#5A3224]/30 px-4 py-3 text-sm text-[#1a120c] placeholder:text-[#1a120c]/40 focus:outline-none focus:border-[#5A3224]'

function MemberCard({ name }: { name: string }) {
  return (
    <div
      className="w-full aspect-[8/5] p-6 flex flex-col justify-between border border-[#c99b6f]/40"
      style={{ background: 'linear-gradient(135deg, #1a0f08 0%, #2b1409 55%, #4a2a14 100%)' }}
    >
      <div className="flex items-start justify-between">
        <img src="/images/logo-mark.webp" alt="The Ivory Sukundu" className="h-10 w-auto" />
        <span className="text-[10px] text-[#c99b6f] uppercase font-semibold" style={{ letterSpacing: '0.3em' }}>
          Ivory Member
        </span>
      </div>
      <div>
        <p className="font-display text-xl text-[#FFF8F2]">{name}</p>
        <p className="text-[10px] text-[#FFF8F2]/55 uppercase mt-1 font-medium" style={{ letterSpacing: '0.25em' }}>
          The Sukundu Circle — est. 2026
        </p>
      </div>
    </div>
  )
}

export default function AccountModal() {
  const { accountOpen, setAccountOpen, memberName, setMemberName } = useStore()
  const [tab, setTab] = useState<'signin' | 'create'>('create')
  const [name, setName] = useState('')

  if (!accountOpen) return null

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-5">
      <button
        aria-label="Close account panel"
        className="absolute inset-0 bg-[#1a120c]/40 backdrop-blur-sm cursor-default"
        onClick={() => setAccountOpen(false)}
      />
      <div className="relative w-full max-w-md bg-[#FFF8F2] text-[#1a120c] border border-[#5A3224]/20 p-8">
        <button
          onClick={() => setAccountOpen(false)}
          aria-label="Close"
          className="absolute top-4 right-4 text-[#1a120c]/60 hover:text-[#5A3224] transition-colors"
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
            <ul className="text-sm text-[#1a120c]/75 leading-relaxed flex flex-col gap-2">
              <li>— Every $1 earns 1 strand. 200 strands = $20 off.</li>
              <li>— Early access to every drop and restock.</li>
              <li>— Full access to Sukundu School care guides.</li>
              <li>— A gift on your birthday, always.</li>
            </ul>
            <button className={ctaGlassOnLight} style={ctaTracking} onClick={() => setAccountOpen(false)}>
              Start Shopping
            </button>
            <button
              className="text-xs font-medium text-[#1a120c]/45 hover:text-[#5A3224] uppercase transition-colors"
              style={{ letterSpacing: '0.15em' }}
              onClick={() => setMemberName(null)}
            >
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-8 mb-8 border-b border-[#5A3224]/15">
              {(['create', 'signin'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`pb-3 -mb-px text-xs font-semibold uppercase whitespace-nowrap transition-colors border-b-2 ${
                    tab === t
                      ? 'border-[#5A3224] text-[#1a120c]'
                      : 'border-transparent text-[#1a120c]/50 hover:text-[#1a120c]/80'
                  }`}
                  style={{ letterSpacing: '0.2em' }}
                >
                  {t === 'create' ? 'Join the Circle' : 'Sign In'}
                </button>
              ))}
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (tab === 'create' && name.trim()) setMemberName(name.trim())
                if (tab === 'signin') setMemberName(name.trim() || 'Sukundu Member')
              }}
            >
              {tab === 'create' && (
                <p className="text-sm text-[#1a120c]/75 leading-relaxed -mt-2 mb-2">
                  Free to join. Earn strands on every order, unlock early access, and learn with Sukundu School.
                </p>
              )}
              <label className="sr-only" htmlFor="acc-name">Full name</label>
              <input
                id="acc-name"
                required={tab === 'create'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={inputClass}
              />
              <label className="sr-only" htmlFor="acc-email">Email</label>
              <input id="acc-email" type="email" required placeholder="you@email.com" className={inputClass} />
              <label className="sr-only" htmlFor="acc-pass">Password</label>
              <input id="acc-pass" type="password" required placeholder="Password" className={inputClass} />
              <button type="submit" className={`${ctaGlassOnLight} w-full mt-2`} style={ctaTracking}>
                {tab === 'create' ? 'Create My Account' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
