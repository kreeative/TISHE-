// Small helpers shared by every function in /api.

export class HttpError extends Error {
  status: number
  code: string | undefined
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed')
  try {
    const body = await request.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>
  } catch {
    // fall through
  }
  throw new HttpError(400, 'Invalid request')
}

export function str(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function email(value: unknown): string {
  const e = str(value, 254).toLowerCase()
  return EMAIL.test(e) ? e : ''
}

export function bearer(request: Request): string {
  return request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
}

// Wraps a handler so expected errors become JSON and unexpected ones are logged.
export function handler(fn: (request: Request) => Promise<Response>) {
  return {
    async fetch(request: Request): Promise<Response> {
      try {
        return await fn(request)
      } catch (err) {
        if (err instanceof HttpError) return json({ error: err.message, code: err.code }, err.status)
        console.error(err)
        return json({ error: 'Something went wrong on our side. Please try again in a moment.' }, 500)
      }
    },
  }
}
