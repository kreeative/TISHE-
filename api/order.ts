import { HttpError, handler, json, readBody, str } from './_lib/http.js'
import { processOrder } from './_lib/process.js'

// POST { sessionId } from the thank-you page. Confirms the payment, numbers
// the order and sends its emails (if the webhook hasn't already), then returns
// what the page shows.
export default handler(async (request) => {
  const sessionId = str((await readBody(request)).sessionId, 200)
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) throw new HttpError(400, 'Order not found.')
  const order = await processOrder(sessionId).catch((err) => {
    console.error(err)
    throw new HttpError(404, 'Order not found.')
  })
  return json({
    paid: order.paid,
    number: order.number,
    email: order.email,
    firstName: order.name.split(/\s+/)[0] ?? '',
    currency: order.currency,
    items: order.items.map((i) => ({
      title: i.title,
      variant: i.variant,
      quantity: i.quantity,
      total: i.total / 100,
      image: i.image,
      handle: i.handle,
      unit: i.unitAmount / 100,
    })),
    subtotal: order.subtotal / 100,
    discount: order.discount / 100,
    shipping: order.shippingAmount / 100,
    tax: order.tax / 100,
    total: order.total / 100,
    code: order.code,
  })
})
