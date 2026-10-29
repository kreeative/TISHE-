// Store policies, rendered by PolicyPage. Plain HTML so the page can keep the
// site's typography. Edit the text here; the shipping rates themselves live in
// api/_lib/shipping.ts and must be kept in step with the table below.

export interface Policy {
  title: string
  updated: string
  body: string
}

const CONTACT = '<a href="mailto:hello@theivorysukundu.com">hello@theivorysukundu.com</a>'

export const POLICIES: Record<string, Policy> = {
  'shipping-policy': {
    title: 'Shipping Policy',
    updated: 'October 29, 2026',
    body: `
<h2>Processing time</h2>
<p>Every order is prepared especially for you. Please allow 5–10 business days for your hair to be prepared and quality-checked before it ships.</p>

<h2>Delivery time</h2>
<p>Once shipped, delivery usually takes 5–12 business days, depending on your country. Customs checks can occasionally add a few days. In total, please allow 2–4 weeks from order to delivery.</p>

<h2>Shipping cost</h2>
<p>Shipping is a flat rate per order:</p>
<ul>
  <li>Canada: CA$30</li>
  <li>United States, the United Kingdom, Europe, Australia, New Zealand and Asia: US$27</li>
  <li>Côte d'Ivoire, Egypt, Ghana, Guinea, Mali, Morocco, Nigeria, Senegal and China: US$36</li>
</ul>
<p>You choose your country in your bag, and the rate is shown before you pay. If your country isn't listed, write to us and we'll see what we can do.</p>

<h2>Free shipping on your first order</h2>
<p>Your first order over US$200 (CA$280 in Canada) ships free with code FREESHIP200 (one use per customer).</p>

<h2>Tracking</h2>
<p>You'll receive a tracking number by email as soon as your order ships.</p>

<h2>Taxes, duties and customs</h2>
<p>Canada: applicable GST/HST is charged at checkout.</p>
<p>Outside Canada: orders may be subject to import duties and taxes (such as VAT in Europe), charged by the carrier on delivery. These charges are the customer's responsibility and are not included in our prices or shipping fees. If a package is refused because of these charges, shipping and return costs are non-refundable.</p>

<h2>Address</h2>
<p>Please double-check your shipping address at checkout. We are not responsible for orders delivered to an incorrect address provided by the customer.</p>

<h2>Questions</h2>
<p>Email ${CONTACT}. We typically respond within 1 business day.</p>
`,
  },

  'refund-policy': {
    title: 'Refunds & Returns',
    updated: 'October 29, 2026',
    body: `
<p>Because hair extensions and wigs are personal care items, we cannot accept returns on any unit that has been opened, worn, or altered in any way (including cutting, colouring, or bleaching).</p>

<h2>Unopened and unused units</h2>
<p>If your unit arrives unopened and in its original packaging, you may request an exchange within 3 days of delivery. Email ${CONTACT} with your order number before sending anything back. Once approved, we'll send you the return address and instructions. Exchanges are offered as store credit or a swap for a different length or density of equal or lesser value. Return shipping is the customer's responsibility. Items sent back without approval cannot be accepted.</p>

<h2>Quality issues and defects</h2>
<p>If you receive a defective or incorrect item, contact us within 24 hours of delivery with clear photos of the issue. Claims submitted after 24 hours, or without photos, cannot be honoured. Approved claims are replaced at no additional cost to you.</p>

<h2>Final sale</h2>
<ul>
  <li>Shipping costs are non-refundable once an order has shipped.</li>
  <li>Custom orders and lengths 26" and above are made to order and are final sale unless defective.</li>
  <li>Sale and promotional items are final sale.</li>
</ul>

<h2>Order cancellations</h2>
<p>Orders can be cancelled for a full refund only before your order has been prepared for shipping. Once processing has begun, cancellation is no longer possible.</p>

<h2>European Union customers</h2>
<p>If your order is delivered within the European Union, you may cancel your purchase within 14 days of delivery without giving a reason, provided the item is unopened and in its original sealed packaging. Opened items cannot be returned for hygiene reasons. Contact ${CONTACT} to start the process. Return shipping is the customer's responsibility.</p>

<h2>Refunds</h2>
<p>Once your return is received and inspected, we'll email you to confirm whether it's approved. Approved refunds are issued to your original payment method within 10 business days.</p>

<h2>Questions</h2>
<p>Email ${CONTACT}. We typically respond within 1 business day.</p>
`,
  },

  'privacy-policy': {
    title: 'Privacy Policy',
    updated: 'October 29, 2026',
    body: `
<p>The Ivory Sukundu ("we", "us") sells hair extensions and half wigs through theivorysukundu.com. This policy explains what personal information we collect, why, and who helps us handle it. We are based in Ontario, Canada, and follow Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).</p>

<h2>What we collect</h2>
<ul>
  <li><strong>Order details:</strong> your name, email address, phone number (if you give it), shipping and billing address, the items you buy and the discount code you use.</li>
  <li><strong>Payment details:</strong> card and wallet payments are processed by Stripe. We never see or store your full card number.</li>
  <li><strong>Email signups:</strong> your email address, if you join the Sukundu Circle for offers and early access.</li>
  <li><strong>Messages:</strong> what you write to us by email or through the contact form.</li>
  <li><strong>Browsing data:</strong> your bag is kept in your own browser. Where analytics are switched on, anonymous usage data such as pages viewed and the device used.</li>
</ul>

<h2>How we use it</h2>
<ul>
  <li>To take payment, prepare and ship your order, and send you order and shipping emails.</li>
  <li>To answer your questions and handle exchanges or quality claims.</li>
  <li>To send you offers and news, only if you signed up. Every marketing email has an unsubscribe link.</li>
  <li>To keep the records Canadian tax law requires, and to prevent fraud.</li>
</ul>

<h2>Who we share it with</h2>
<p>We do not sell your personal information. We share only what each service needs to do its job:</p>
<ul>
  <li><strong>Stripe</strong>, for payments and fraud checks.</li>
  <li><strong>Resend</strong>, to deliver our emails.</li>
  <li><strong>Vercel</strong>, which hosts this website.</li>
  <li><strong>Our suppliers and couriers</strong>, who receive your name, shipping address and phone number so your order can be made and delivered.</li>
</ul>
<p>Some of these providers store data outside Canada, including in the United States, where it may be accessed under local law.</p>

<h2>How long we keep it</h2>
<p>We keep order records for six years, as required by the Canada Revenue Agency. Email signup data is kept until you unsubscribe or ask us to delete it.</p>

<h2>Your choices</h2>
<p>You can ask to see, correct or delete the personal information we hold about you, or withdraw your consent to marketing at any time. Email ${CONTACT} and we will reply within 30 days.</p>

<h2>Changes</h2>
<p>If we change this policy, we will update the date at the top of this page.</p>
`,
  },

  'terms-of-service': {
    title: 'Terms of Service',
    updated: 'October 29, 2026',
    body: `
<p>These terms apply when you browse or buy from theivorysukundu.com. By placing an order, you agree to them, along with our Shipping Policy, Refunds &amp; Returns policy and Privacy Policy.</p>

<h2>Products</h2>
<p>We describe every texture as it is: raw Vietnamese hair is labelled raw, and Indian cuticle-aligned hair is labelled Indian. Hair is a natural product, so colour, curl and thickness can vary slightly from photos and between bundles. Photos where a customer has coloured the hair are marked as such.</p>

<h2>Prices and payment</h2>
<p>Prices are in Canadian dollars for orders shipped within Canada, and in US dollars everywhere else. Your bank may convert the amount if your card is in another currency. Payment is taken by Stripe when you place your order. GST/HST is added for orders shipped within Canada.</p>

<h2>Discount codes</h2>
<p>One code per order. Codes cannot be exchanged for cash and may have conditions, such as a first-order or minimum-spend rule, shown when you apply them. We may end a promotion at any time.</p>

<h2>Orders</h2>
<p>We may cancel and fully refund an order if a product is unavailable, if a price was displayed in error, or if we suspect fraud. You will receive an email confirming your order and another when it ships.</p>

<h2>Liability</h2>
<p>To the extent permitted by law, our liability for any order is limited to the amount you paid for it. Nothing in these terms limits your rights under consumer protection law.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of Ontario and the federal laws of Canada that apply there.</p>

<h2>Contact</h2>
<p>Email ${CONTACT}.</p>
`,
  },
}
