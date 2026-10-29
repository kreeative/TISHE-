import { useParams, Link } from 'react-router-dom'
import { POLICIES } from '../data/policies'
import Reveal from './Reveal'

// Renders the store policies from src/data/policies.ts in the site's own typography.
export default function PolicyPage() {
  const { handle = '' } = useParams()
  const policy = POLICIES[handle]

  return (
    <section className="bg-[#FAF7F3] text-[#1B1113] py-16 sm:py-24 px-5 sm:px-10 md:px-16 min-h-[70vh]">
      <div className="max-w-3xl mx-auto">
        <Reveal>
          <p className="text-xs font-semibold uppercase text-[#5A3224]" style={{ letterSpacing: '0.06em' }}>
            The Ivory Sukundu
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mt-4 leading-[1.16]">{policy?.title ?? 'Policy'}</h1>
          {policy && <p className="mt-4 text-xs text-[#1B1113]/50">Last updated {policy.updated}</p>}
        </Reveal>

        <Reveal delay={0.1}>
          {policy ? (
            <div
              className="policy-body mt-10 text-sm leading-[1.9] text-[#1B1113]/80"
              dangerouslySetInnerHTML={{ __html: policy.body }}
            />
          ) : (
            <p className="mt-10 text-sm text-[#1B1113]/70 leading-[1.85]">
              We couldn't find that page.{' '}
              <Link to="/contact" className="underline underline-offset-4 text-[#5A3224]">Contact us</Link> with any
              questions.
            </p>
          )}
        </Reveal>
      </div>
    </section>
  )
}
