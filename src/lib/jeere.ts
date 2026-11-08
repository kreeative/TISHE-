// The Jeere editor (jeere.kreeative.xyz) shows this site in a frame and edits its
// texts and pictures from there. This file only works out whether the site is in
// that frame, and talks to it with postMessage. Jeere does the saving itself, with
// the owner's dashboard session: the frame holds no secret and saves nothing.
//
// Jeere opens  https://www.theivorysukundu.com/?jeere=edit#/   (or ?jeere=view to only look).
// The protocol is described in docs/jeere-editor.md.

export const JEERE_ORIGIN = 'https://jeere.kreeative.xyz'

// Jeere itself, or Jeere running on the developer's own computer
export function allowedOrigin(origin: string): boolean {
  return origin === JEERE_ORIGIN || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
}

function detect(): { origin: string; editing: boolean } | null {
  if (typeof window === 'undefined' || window.parent === window) return null
  const mode = new URLSearchParams(window.location.search).get('jeere')
  if (!mode) return null
  let origin = ''
  try {
    origin = window.location.ancestorOrigins?.[0] || (document.referrer ? new URL(document.referrer).origin : '')
  } catch {
    origin = ''
  }
  origin ||= JEERE_ORIGIN
  if (!allowedOrigin(origin)) return null
  return { origin, editing: mode !== 'view' }
}

// set once, when the page loads: null for every shopper
export const JEERE_FRAME = detect()

export function toJeere(message: Record<string, unknown>): void {
  if (!JEERE_FRAME) return
  window.parent.postMessage({ source: 'tishe', version: 1, ...message }, JEERE_FRAME.origin)
}
