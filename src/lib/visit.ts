// « En direct » in the Jehre dashboard: tells Jehre that someone is on the shop, so the owner sees her
// visitors on a globe. One signal when the page opens, then one a minute while it stays in view.
// Jehre keeps the city the visit seems to come from and a daily one-way hash, never the address of the
// device. Nothing is sent from the dashboard, from the Jehre editor's frame, or from a developer's computer.

const ENDPOINT = 'https://jehre.com/api/visit'
const SITE = 'the-ivory-sukundu'

function send(): void {
  try {
    if (document.hidden || window.location.hash.startsWith('#/admin')) return
    const data = JSON.stringify({ slug: SITE, path: window.location.hash.replace(/^#/, '') || '/' })
    if (!(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, data))) {
      void fetch(ENDPOINT, { method: 'POST', body: data, keepalive: true, mode: 'no-cors' }).catch(() => {})
    }
  } catch {
    // a visit that is not counted never breaks the shop
  }
}

export function startVisits(): void {
  if (typeof window === 'undefined' || window.parent !== window) return
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return
  send()
  window.setInterval(send, 60_000)
}
