import { handler, json } from './_lib/http.js'

// The visitor's country from Vercel's IP lookup, so prices start in the
// right currency (CAD in Canada, USD elsewhere).
export default handler(async (request) => json({ country: request.headers.get('x-vercel-ip-country') ?? '' }))
