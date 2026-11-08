# Editing theivorysukundu.com from Jeere

Jeere (https://jeere.kreeative.xyz) can show the live shop in an iframe and edit its texts
and pictures in place, like a design tool. The shop does the showing and the in-place
editing. Jeere does the saving, with the owner's dashboard session (`jeere-tishe-auth`).
The frame holds no secret and saves nothing on its own.

Code on the shop side: `src/lib/jeere.ts`, `src/components/SiteContent.tsx`,
`api/admin.ts` (`saveContent`).

## Showing the shop

```html
<iframe src="https://www.theivorysukundu.com/?jeere=edit#/"></iframe>
```

- `?jeere=edit` starts in edit mode. `?jeere=view` only shows the shop. Keep the `?jeere=…`
  part: the routes live in the hash (`#/collections`, `#/products/<handle>`).
- The editor only switches on inside a frame whose page is https://jeere.kreeative.xyz
  (or `http://localhost:*` / `http://127.0.0.1:*` while developing). Opened directly, or
  framed by any other site, it is the normal shop.
- Inside Jeere the shop loads no analytics and no newsletter popup.

## Messages

Every message is a plain object sent with `postMessage`.

- **From the shop:** `{ source: 'tishe', version: 1, type, … }`. They come from
  `event.origin === 'https://www.theivorysukundu.com'`. Check the origin.
- **To the shop:** send `{ source: 'jeere', type, … }` to
  `iframe.contentWindow.postMessage(message, 'https://www.theivorysukundu.com')`.

### From the shop

| type | fields | when |
|---|---|---|
| `ready` | `editing`, `pages: [{ route, name }]` | on load (pages include every product page) |
| `page` | `route`, `editing`, `fields: [{ key, kind, value, original, changed }]`, `changes` | on load, after each route change, after each change; `fields` = what's on screen, for a layers panel |
| `select` | `key`, `kind` (`text` / `image`), `value`, `original` | the owner clicked a text (now being typed in place) or a picture (Jeere should offer to replace it) |
| `change` | `key`, `value`, `changes` | a text was edited in place; `changes` = every unsaved change so far |
| `open` | `what` (`product` / `announcements` / `sale`), `id` (the product handle) | the owner clicked something with its own editor in Jeere |

A value of `''` means "back to the original wording".

### To the shop

| type | fields | effect |
|---|---|---|
| `edit` | `on` | edit mode on/off (off: links work, nothing is outlined) |
| `set` | `key`, `value` | shows a new value right away (from a side panel, or a new picture's address); `''` = original |
| `discard` | | forgets every unsaved change |
| `store` | `doc` | after any save: pass the `doc` the API returned. The shop shows it and drops the drafts it contains |
| `navigate` | `route` | e.g. `/collections`, `/products/<handle>` |
| `select` | `key` | scrolls to that text or picture and outlines it |

## Saving

Use the same API and session as the rest of tishe.js:

```js
// texts and pictures: the `changes` from the last `change`/`page` message
POST https://www.theivorysukundu.com/api/admin
Authorization: Bearer <session token>
{ "action": "saveContent", "content": { "campaign.title": "…", "hero.cta": "" } }
// → { doc }   then send { source: 'jeere', type: 'store', doc } to the frame
```

- **A new picture:** first `{ "action": "upload", "handle": "site", "full": <base64 JPEG>,
  "thumb": <base64 JPEG> }` → `{ url, thumb }`. Then send `set { key, value: url }` and
  include `url` in the next `saveContent`. Picture values must start with `https://` or `/`.
- **Products, the announcement bar and the sale:** keep using `saveProduct` and `saveSite`.
  Send the returned `doc` with `store` so the frame shows it.
- Shoppers see a save within about a minute (`/api/store` is cached for 20 seconds).

## Editable keys

| page | keys |
|---|---|
| Home | `hero.logo` (picture), `hero.cta`, `campaign.eyebrow`, `campaign.title`, `campaign.body`, `campaign.cta`, `campaign.quiz` |
| Home, Collections | `collection.eyebrow`, `collection.title`, `collection.body`, `reviews.eyebrow`, `reviews.title` |
| Collections | `lengths.eyebrow`, `lengths.title`, `lengths.body`, `lengths.tip` |
| Our Hair | `ourhair.eyebrow`, `ourhair.title`, `ourhair.body`, `ourhair.reason1.title` … `ourhair.reason3.body`, `ourhair.closing` |
| The Circle | `circle.eyebrow`, `circle.title`, `circle.body`, `circle.step1.title` … `circle.step3.body`, `circle.cta`, `circle.note` |
| Contact | `contact.eyebrow`, `contact.title`, `contact.body` |
| Every page | `footer.about`, `footer.motto` |

To make another text editable, wrap it in `<Text k="section.name">original wording</Text>`
(or `<Img k="…" src="…" />` for a picture) in the shop's code.

## Old Shopify orders (#1001–#1003)

The three orders from the old Shopify store are kept in the shop itself, so they stay
available after Shopify closes: items, customer, address, totals and FedEx tracking.
In Jeere, open them like any other order instead of linking to Shopify admin:

```js
{ "action": "legacyOrders" }                  // → { orders: [order, …] }, newest first, same shape as `order`
{ "action": "order", "id": "7178473734309" }  // the Shopify id (as in tishe.js's SHOPIFY list)
// → { order, supplierMessages: [] }
```

- These orders carry `legacy: 'shopify'` and `payment` ("PayPal (€167.31)", …), and
  have `status: 'delivered'`.
- They are read-only: `update` answers 400. `email` works (see below).
- The list is empty until `LEGACY_ORDERS_KEY` is set in Vercel. The file
  (`src/data/legacy-orders.enc`) is encrypted because it holds names and addresses.

## Emails to the customer from an order

Put this on the order page, e.g. "Écrire à la cliente" with a template picker:

```js
{ "action": "emailTemplates" }
// → { templates: [{ id, label, subject, message, includeOrder }], placeholders: ['{first_name}', …] }
//   preparing · shipped · delay · delivered · question
//   label is French for the owner; subject/message are English for the customer

{ "action": "email", "orderId": "<order id>", "subject": "…", "message": "…", "includeOrder": true, "preview": true }
// → { to, subject, html }   the email exactly as the customer will get it (nothing sent)

{ "action": "email", "orderId": "<order id>", "subject": "…", "message": "…", "includeOrder": true }
// → { ok, to, subject }     sent from orders@theivorysukundu.com; replies go to hello@
```

- With `orderId`, `to` is optional: the order's email is used.
- These placeholders are filled in from the order: `{first_name}` / `{prénom}`,
  `{order}` / `{commande}`, `{tracking}` / `{suivi}`, `{carrier}` / `{transporteur}`,
  `{tracking_link}` / `{lien_suivi}` and `{items}` / `{articles}`. Unknown ones stay as typed.
- `includeOrder: true` adds the items under the message, plus a "Track my order"
  button once there is a tracking number.
- Every email sent from an order, and the automatic shipping email, is listed on the
  order as `order.emails: [{ at, subject }]` (oldest first). Show it as a little history.
- Without `orderId`, `email` works as before (`to`, `subject`, `message`).
