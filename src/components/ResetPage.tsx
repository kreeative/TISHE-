import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useStore } from './StoreContext'
import { customerResetByUrl } from '../lib/customer'
import { ctaGlassOnLight, ctaTracking } from './cta'
import PasswordInput from './PasswordInput'
import Reveal from './Reveal'

// Landing page for the tokenized link in the password-reset email.
// The email links here as /#/reset?url=<encoded classic reset URL>.
export default function ResetPage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { adoptToken } = useStore()
  const resetUrl = new URLSearchParams(search).get('url')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetUrl) return
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      const token = await customerResetByUrl(resetUrl, password)
      await adoptToken(token)
      navigate('/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="bg-[#FAF7F3] text-[#1B1113] py-16 sm:py-24 px-5 sm:px-10 md:px-16 min-h-[70vh]">
      <div className="max-w-md mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            The Sukundu Circle
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">Choose a new password</h1>
        </Reveal>

        <Reveal delay={0.1}>
          {resetUrl ? (
            <form className="flex flex-col gap-4 mt-10" onSubmit={submit}>
              <PasswordInput id="new-pass" value={password} onChange={setPassword} placeholder="New password" autoComplete="new-password" />
              <PasswordInput id="confirm-pass" value={confirm} onChange={setConfirm} placeholder="Confirm new password" autoComplete="new-password" />
              {error && <p className="text-sm text-[#8a2d1f] leading-relaxed">{error}</p>}
              <button type="submit" disabled={busy} className={`${ctaGlassOnLight} w-full mt-2 disabled:opacity-50`} style={ctaTracking}>
                {busy ? 'One moment…' : 'Save New Password'}
              </button>
            </form>
          ) : (
            <p className="mt-8 text-sm text-[#1B1113]/70 leading-[1.85]">
              This page only works from the link in a password-reset email.{' '}
              <Link to="/account" className="underline underline-offset-4 text-[#5A3224]">
                Request a new reset link here.
              </Link>
            </p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
