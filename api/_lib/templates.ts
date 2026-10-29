import { env } from './env.js'

// The look shared by every email: ivory page, espresso type, one button.
// Table layout and inline styles, because that is what email apps render.

const INK = '#1B1113'
const BROWN = '#5A3224'
const IVORY = '#FAF7F3'
const MUTED = '#6e6466'

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function money(cents: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export function absolute(path: string | null | undefined): string {
  if (!path) return ''
  return path.startsWith('http') ? path : `${env.siteUrl()}${path}`
}

export function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:${INK}">${text}</p>`
}

export function small(text: string): string {
  return `<p style="margin:0 0 12px;font-size:12px;line-height:1.7;color:${MUTED}">${text}</p>`
}

export function heading(text: string): string {
  return `<h2 style="margin:28px 0 12px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:20px;color:${INK}">${text}</h2>`
}

export function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${INK}">
<a href="${esc(url)}" style="display:inline-block;padding:15px 30px;font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${IVORY};text-decoration:none">${esc(label)}</a>
</td></tr></table>`
}

export function codeBox(code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0"><tr><td style="border:1px dashed ${BROWN};padding:16px 32px;font-size:20px;font-weight:700;letter-spacing:3px;color:${INK}">${esc(code)}</td></tr></table>`
}

export function pre(text: string): string {
  return `<pre style="margin:0 0 16px;padding:16px;background:#fff;border:1px solid #e7dfd8;font-family:Menlo,Consolas,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap;color:${INK}">${esc(text)}</pre>`
}

export interface Row {
  image?: string | null
  title: string
  detail?: string
  amount: string
}

export function itemRows(rows: Row[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e7dfd8;margin:8px 0 0">${rows
    .map(
      (r) => `<tr>
<td width="72" style="padding:14px 14px 14px 0;border-bottom:1px solid #e7dfd8;vertical-align:top">${
        r.image ? `<img src="${esc(absolute(r.image))}" width="60" height="72" alt="" style="display:block;width:60px;height:72px;object-fit:cover">` : ''
      }</td>
<td style="padding:14px 0;border-bottom:1px solid #e7dfd8;vertical-align:top;font-size:14px;line-height:1.5;color:${INK}">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px">${esc(r.title)}</div>
${r.detail ? `<div style="font-size:12px;color:${MUTED};margin-top:2px">${esc(r.detail)}</div>` : ''}
</td>
<td align="right" style="padding:14px 0 14px 12px;border-bottom:1px solid #e7dfd8;vertical-align:top;font-size:14px;white-space:nowrap;color:${INK}">${esc(r.amount)}</td>
</tr>`,
    )
    .join('')}</table>`
}

export function totals(rows: [string, string, boolean?][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 8px">${rows
    .map(
      ([label, value, bold]) =>
        `<tr><td style="padding:4px 0;font-size:${bold ? 15 : 14}px;${bold ? 'font-weight:700;' : ''}color:${bold ? INK : MUTED}">${esc(label)}</td><td align="right" style="padding:4px 0;font-size:${bold ? 15 : 14}px;${bold ? 'font-weight:700;' : ''}color:${INK}">${esc(value)}</td></tr>`,
    )
    .join('')}</table>`
}

export function layout(opts: { preheader: string; title: string; body: string }): string {
  const site = env.siteUrl()
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${IVORY}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
<tr><td style="padding:0 0 28px;border-bottom:1px solid #e7dfd8">
<a href="${site}" style="font-family:Georgia,'Times New Roman',serif;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:${INK};text-decoration:none">The Ivory Sukundu</a>
</td></tr>
<tr><td style="padding:32px 0 8px">
<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:30px;line-height:1.2;color:${INK}">${esc(opts.title)}</h1>
${opts.body}
</td></tr>
<tr><td style="padding:28px 0 0;border-top:1px solid #e7dfd8">
${small(`Questions? Just reply to this email or write to <a href="mailto:hello@theivorysukundu.com" style="color:${BROWN}">hello@theivorysukundu.com</a>.`)}
${small(`<a href="${site}" style="color:${MUTED}">theivorysukundu.com</a> · <a href="https://www.instagram.com/theivorysukundu" style="color:${MUTED}">Instagram</a> · <a href="https://www.tiktok.com/@theivorysukundu" style="color:${MUTED}">TikTok</a>`)}
</td></tr>
</table></td></tr></table></body></html>`
}

// plain-text twin of an email, for clients that don't show HTML
export function textOf(lines: (string | false | null | undefined)[]): string {
  return lines.filter((l) => l !== false && l !== null && l !== undefined).join('\n') + '\n\nThe Ivory Sukundu · theivorysukundu.com\n'
}
