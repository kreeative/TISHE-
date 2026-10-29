import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './env.js'
import { HttpError } from './http.js'

// Signed, expiring tokens for sign-in links and sessions. No database: the
// signature proves we issued the token, and the expiry limits how long it lives.

export type TokenKind = 'login' | 'session' | 'admin-login' | 'admin'

interface Payload {
  sub: string
  typ: TokenKind
  exp: number
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url')

function sign(data: string): string {
  return createHmac('sha256', env.sessionSecret()).update(data).digest('base64url')
}

export function issueToken(sub: string, typ: TokenKind, ttlMinutes: number): { token: string; expiresAt: number } {
  const exp = Date.now() + ttlMinutes * 60_000
  const body = b64(JSON.stringify({ sub, typ, exp } satisfies Payload))
  return { token: `${body}.${sign(body)}`, expiresAt: exp }
}

export function verifyToken(token: string, typ: TokenKind): string {
  const [body, sig] = token.split('.')
  if (body && sig) {
    const expected = Buffer.from(sign(body))
    const given = Buffer.from(sig)
    if (expected.length === given.length && timingSafeEqual(expected, given)) {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Payload
      if (payload.typ === typ && payload.exp > Date.now()) return payload.sub
    }
  }
  const signIn = typ === 'login' || typ === 'admin-login'
  throw new HttpError(401, signIn ? 'This sign-in link has expired. Ask for a new one below.' : 'Please sign in again.', 'unauthorized')
}
