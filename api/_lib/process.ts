import { loadOrder, nextOrderNumber, updateOrderMeta, type Order } from './orders.js'
import { sendOrderEmails } from './notify.js'

// Numbers a newly paid order and sends the confirmation and owner alert.
// Safe to call more than once: the webhook, the thank-you page and the daily
// sweep can all reach the same order.
export async function processOrder(sessionId: string): Promise<Order> {
  let order = await loadOrder(sessionId)
  if (!order.paid) return order
  if (!order.number) {
    const number = await nextOrderNumber()
    await updateOrderMeta(order, { tis_order: number, tis_status: 'new', tis_session: order.id })
    order = { ...order, number }
  }
  if (!order.emailed) {
    await sendOrderEmails(order)
    await updateOrderMeta(order, { tis_emailed: '1' })
    order = { ...order, emailed: true }
  }
  return order
}
