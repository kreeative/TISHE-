import { handler } from './_lib/http.js'
import { loadStore, publicView } from './_lib/store.js'

// GET: the products, announcement bar, sale and shipping rates the shop shows,
// as last edited in the dashboard. Cached briefly at the edge so a change
// reaches shoppers within a minute.
export default handler(async () =>
  Response.json(publicView(await loadStore()), {
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=60' },
  }),
)
