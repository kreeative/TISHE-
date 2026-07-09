I'm building an ecommerce website for The Ivory Sukundu, a luxury raw hair
extensions brand. "Sukundu" means "hair" in Pulaar. Two pages/components
already exist as custom code components — SukunduHero (the homepage hero
with a cursor-spotlight image reveal) and SukunduProductPage (a single
product page connected live to Shopify, with working Length/Density variant
picker and add-to-cart). Please build out the rest of the site around them.

You have creative freedom on layout, spacing, and exact visual treatment —
below is a starting point, not a strict spec:
- Palette: ivory/cream background (#FFF8F2), espresso brown text/accent
  (#5A3224), near-black for dark sections (#1a120c / #1a0f08), a soft gold
  accent (#c99b6f) used sparingly.
- Fonts: a refined serif or editorial display face for headlines, a clean
  sans-serif (Montserrat or similar) for body/UI text.
- Overall mood: quiet luxury, editorial, generous whitespace — think a
  fashion magazine, not a busy discount storefront.

Shopify connection details, needed anywhere a section shows real products:
- Domain: r3dmi1-jm.myshopify.com
- Storefront API public token: 73a99755f0c52cc51f2957f806878246
- Use the Storefront GraphQL API (api/2025-01/graphql.json) to fetch
  products, same pattern as the existing SukunduProductPage component.

---

GLOBAL NAV (appears on every page)
- Left: logo (image upload slot)
- Center or left-aligned links: Our Hair, Collections, The Circle, Contact
- Right: account icon, bag icon with item count
- Keep it a plain, minimal bar — not a bulky button-styled menu.

GLOBAL FOOTER (every page)
- Logo, Instagram + email icons, copyright line: "© 2026 The Ivory Sukundu.
  All rights reserved."
- Can be on a dark background even though the rest of the site is light.

---

HOME PAGE
1. Embed the existing SukunduHero component at the top, full viewport height.
2. Campaign section below it:
   - Eyebrow: "Campaign 01 — The Half-Wig Edit"
   - Headline: "Half the install. All the hair."
   - Body: "Our signature half wig snaps in with combs — no glue, no lace,
     no salon chair. Your leave-out blends at the crown, your hairline
     breathes, and your natural hair rests protected underneath."
   - Three stats: "60 sec — comb-in install, zero glue" / "90% — less daily
     manipulation than a sew-in" / "1 yr+ — of wear from a single unit"
   - Two links: "Shop the Half-Wig" (→ Collections page) and "Not sure? Take
     the quiz →" (→ Quiz page)
3. A short product grid teaser (3-4 real products fetched from Shopify,
   image + title + starting price), each card linking to its own product
   page (see COLLECTIONS PAGE below for the full version of this).

---

COLLECTIONS PAGE
1. Header: "The Collection" / "Textures worth the obsession" / "Raw,
   single-donor hair in three signature finishes — every bundle
   hand-inspected before it ships."
2. A grid fetching ALL products live from Shopify (image, title, starting
   price shown as "from $X" if the product has multiple variant prices).
   Each card links to that product's own page (built with the existing
   SukunduProductPage component — one Framer page per product, each with
   the Product Handle field in that component's properties set to match).
3. Below the grid, an interactive "Find your length" tool:
   - Headline: "Find your length" — "Tap a length to see where it lands and
     how many bundles build the look."
   - 16 tappable lengths from 10" to 40" (in steps of 2"). For each,
     show where it lands on the body and a short personality note:
     10" Nape / 12" Shoulder / 14" Collarbone / 16" Armpit / 18" Bra strap /
     20" Below bra strap / 22" Mid-back / 24" Low back / 26" Waist /
     28" Low waist / 30" Hip / 32" Below hip / 34" Tailbone /
     36" Upper thigh / 38" Thigh / 40" Mid-thigh.
     Bundle counts scale from 2 bundles at the shortest to 5+ at the
     longest. Include a closing note: "Texture tip: hair is measured
     stretched straight — body wave wears about 2\" shorter and deep curl
     about 4\" shorter than the number on the bundle."
   - Selecting a length should visually highlight it and update a large
     display of the chosen number + where it lands.

---

OUR HAIR PAGE (brand story)
- Eyebrow: "Sukundu — 'hair' in Pulaar"
- Headline: "Hair that keeps its promises"
- Body: "Our name comes from the Pulaar word for hair — because for us,
  hair is heritage. Every Sukundu piece honors where it comes from and
  elevates where it's going."
- Three reasons, each with an icon, title, and short body:
  1. "Ethically sourced" — "Single-donor raw hair with full traceability —
     sourced with respect for both nature and community."
  2. "Luxuriously soft" — "Cuticles aligned and fully intact. No silicone
     coating that washes off after two wears."
  3. "Built to last" — "Bleach it, press it, wear it daily — two years and
     counting with basic care."
- Closing statement: "Experience unmatched quality in every strand —
  indulge in texture so soft it promises to elevate your hair game to new
  heights. Choose The Ivory Sukundu for the raw hair you deserve."

---

THE CIRCLE PAGE (loyalty program)
- Eyebrow: "The Sukundu Circle" — Headline: "Loyalty, woven in"
- Body: "Sukundu means hair in Pulaar — and in our culture, hair is cared
  for in community. The Circle is ours: earn strands on every order, learn
  the craft, and grow into richer rewards."
- Three tiers side by side, the third one visually emphasized as the top
  tier (badge, border, or subtle highlight):
  1. Ivory — Free to join
     - Every $1 earns 1 strand — 200 strands is $20 off
     - Early access to drops and restocks
     - Sukundu School: care guides and install tutorials
     - A gift on your birthday, always
  2. Gold — After $500
     - Everything in Ivory
     - Free express shipping, every order
     - Member pricing on campaign launches
     - Annual silk maintenance kit, gifted
  3. Heritage — After $1,200 (mark as "Most Rewarding")
     - Everything in Gold
     - One-on-one texture consultation
     - Yearly unit revamp service, on us
     - Anniversary bundle gifted every year
- CTA button: "Join the Circle — Free" (opens account signup)

---

QUIZ PAGE ("Find your unit")
An interactive 4-question quiz that recommends one of three hair types.
Show a progress bar. Each question has 3 answer options; each option
contributes points toward one of three archetypes: straight, curl, blonde.

Q1 "How much time do you give your hair in the morning?"
 - "Five minutes, tops" (favors straight)
 - "Fifteen to twenty" (favors straight/curl)
 - "I enjoy the ritual" (favors curl/blonde)

Q2 "What's your season looking like?"
 - "Gym and on the go" (favors straight/curl)
 - "Office polished" (favors straight)
 - "Event season, always" (favors blonde/curl)

Q3 "Your dream texture?"
 - "Sleek and straight" (favors straight)
 - "Springy curls" (favors curl)
 - "Bold blonde" (favors blonde)

Q4 "How long are we going?"
 - "Short and snappy" → recommend 14"
 - "The classic zone" → recommend 22"
 - "Maximum drama" → recommend 28"

At the end, tally points, show the winning archetype's matching product
(fetched live from Shopify — match by product title containing "straight"/
"half wig" for straight, "curl"/"wave" for curl, "613"/"blonde" for blonde),
its image, price, the recommended length from Q4, a short reason why it
fits, an "Add to Bag" button, a "Customize length" link to that product's
full page, and a "Retake quiz" option.

---

CONTACT PAGE (VIP list)
- Eyebrow: "Something big is coming"
- Headline: "Join the VIP list"
- Body: "Early access to launches, restocks, and VIP-only pricing —
  straight to your inbox."
- Email signup form → on submit, show confirmation text: "YOU'RE ON THE
  LIST — WATCH YOUR INBOX"

---

ACCOUNT / SIGN-IN
A simple modal or page with two tabs, "Join the Circle" and "Sign In,"
each with name/email/password fields. On successful "join," show a
welcome screen with a rendered membership card (dark gradient background,
logo, member name, "The Sukundu Circle — est. 2026") and a short list of
their Ivory-tier perks.

---

Please connect real navigation between all these pages, keep the copy
above exactly as written (it's final brand copy, not placeholder), and use
your own judgment on the visual execution, animations, and layout details
throughout.
