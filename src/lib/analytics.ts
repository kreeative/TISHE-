// Traffic and conversion tracking for the storefront.
//
// The site is headless: pages are served by Vercel and only the checkout
// lives on Shopify, so Shopify's own analytics never sees a visit. Every
// pixel below therefore has to be loaded here, by us.
//
// Nothing loads unless the matching ID is set in the environment, so a
// missing key is simply "that network is off", never a broken page.

const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID as string | undefined
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    ttq?: { track: (e: string, p?: Record<string, unknown>) => void; page: () => void }
    fbq?: (...args: unknown[]) => void
  }
}

function injectScript(src: string) {
  const s = document.createElement('script')
  s.async = true
  s.src = src
  document.head.appendChild(s)
}

let started = false

export function initAnalytics() {
  if (started || typeof window === 'undefined') return
  started = true

  if (GA4_ID) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    window.gtag('js', new Date())
    // page views are sent by hand so hash routes are reported correctly
    window.gtag('config', GA4_ID, { send_page_view: false })
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`)
  }

  if (TIKTOK_PIXEL_ID) {
    const methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']
    const queue: unknown[] = []
    const ttq: Record<string, unknown> = { _queue: queue, methods }
    methods.forEach((m) => {
      ttq[m] = (...args: unknown[]) => queue.push([m, ...args])
    })
    // the real SDK reads these globals when it boots and replays the queue
    ;(window as unknown as Record<string, unknown>).TiktokAnalyticsObject = 'ttq'
    ;(window as unknown as Record<string, unknown>).ttq = ttq
    injectScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_PIXEL_ID}&lib=ttq`)
  }

  if (META_PIXEL_ID) {
    const queue: unknown[] = []
    const fbq = (...args: unknown[]) => queue.push(args)
    ;(fbq as unknown as Record<string, unknown>).queue = queue
    ;(fbq as unknown as Record<string, unknown>).loaded = true
    ;(fbq as unknown as Record<string, unknown>).version = '2.0'
    ;(window as unknown as Record<string, unknown>).fbq = fbq
    ;(window as unknown as Record<string, unknown>)._fbq = fbq
    injectScript('https://connect.facebook.net/en_US/fbevents.js')
    window.fbq?.('init', META_PIXEL_ID)
  }
}

export function trackPageView(path: string) {
  if (GA4_ID) window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href })
  window.ttq?.page()
  window.fbq?.('track', 'PageView')
}

interface ItemInfo {
  id: string
  name: string
  price?: number
  currency?: string
  quantity?: number
}

export function trackViewItem(item: ItemInfo) {
  const currency = item.currency ?? 'USD'
  if (GA4_ID) {
    window.gtag?.('event', 'view_item', {
      currency,
      value: item.price ?? 0,
      items: [{ item_id: item.id, item_name: item.name, price: item.price }],
    })
  }
  window.ttq?.track('ViewContent', {
    content_id: item.id,
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency,
  })
  window.fbq?.('track', 'ViewContent', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: item.price,
    currency,
  })
}

export function trackAddToCart(item: ItemInfo) {
  const currency = item.currency ?? 'USD'
  const quantity = item.quantity ?? 1
  if (GA4_ID) {
    window.gtag?.('event', 'add_to_cart', {
      currency,
      value: (item.price ?? 0) * quantity,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity }],
    })
  }
  window.ttq?.track('AddToCart', {
    content_id: item.id,
    content_name: item.name,
    content_type: 'product',
    quantity,
    value: (item.price ?? 0) * quantity,
    currency,
  })
  window.fbq?.('track', 'AddToCart', {
    content_ids: [item.id],
    content_name: item.name,
    content_type: 'product',
    value: (item.price ?? 0) * quantity,
    currency,
  })
}

// Fired as the visitor leaves for the Shopify-hosted checkout. This is the
// last thing we can see; the purchase itself is reported by Shopify's own
// TikTok and Meta channels.
export function trackBeginCheckout(value: number, currency: string, quantity: number) {
  if (GA4_ID) window.gtag?.('event', 'begin_checkout', { currency, value })
  window.ttq?.track('InitiateCheckout', { value, currency, quantity })
  window.fbq?.('track', 'InitiateCheckout', { value, currency, num_items: quantity })
}

export function trackSignUp(source: string) {
  if (GA4_ID) window.gtag?.('event', 'sign_up', { method: source })
  window.ttq?.track('CompleteRegistration', { description: source })
  window.fbq?.('track', 'Lead', { content_name: source })
}
