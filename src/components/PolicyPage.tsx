import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPolicies, type ShopPolicy } from '../lib/shopify'
import Reveal from './Reveal'

const TITLES: Record<string, string> = {
  'shipping-policy': 'Shipping Policy',
  'refund-policy': 'Refunds & Returns',
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
}

// Renders the legal text written in Shopify admin (Settings → Policies)
// in the site's own typography.
export default function PolicyPage() {
  const { handle = '' } = useParams()
  const [policy, setPolicy] = useState<ShopPolicy | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')

  useEffect(() => {
    let alive = true
    setState('loading')
    getPolicies()
      .then((all) => {
        if (!alive) return
        const p = all[handle]
        if (p && p.body.trim()) {
          setPolicy(p)
          setState('ready')
        } else {
          setState('missing')
        }
      })
      .catch(() => alive && setState('error'))
    return () => {
      alive = false
    }
  }, [handle])

  return (
    <section className="bg-[#FAF7F3] text-[#1B1113] py-16 sm:py-24 px-5 sm:px-10 md:px-16 min-h-[70vh]">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            The Ivory Sukundu
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">
            {policy?.title || TITLES[handle] || 'Policy'}
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          {state === 'loading' && <p className="mt-10 text-sm text-[#1B1113]/55">Loading…</p>}
          {state === 'error' && (
            <p className="mt-10 text-sm text-[#1B1113]/70 leading-[1.85]">
              We couldn't load this page right now. Please try again in a moment.
            </p>
          )}
          {state === 'missing' && (
            <p className="mt-10 text-sm text-[#1B1113]/70 leading-[1.85]">
              This policy hasn't been published yet. Questions in the meantime?{' '}
              <Link to="/contact" className="underline underline-offset-4 text-[#5A3224]">Contact us.</Link>
            </p>
          )}
          {state === 'ready' && policy && (
            <div
              className="policy-body mt-10 text-sm leading-[1.9] text-[#1B1113]/80"
              dangerouslySetInnerHTML={{ __html: policy.body }}
            />
          )}
        </Reveal>
      </div>
    </section>
  )
}
