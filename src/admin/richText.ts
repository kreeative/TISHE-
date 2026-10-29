// Product descriptions are stored as simple HTML. The dashboard edits them as
// plain text with three conventions, converted both ways here:
//   ## Heading          → a small heading
//   - item              → a bullet list
//   **bold**            → bold text
//   _italic_            → italic text
// Blank lines separate paragraphs.

const decode = (s: string) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")

const encode = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inlineToText(html: string): string {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_m, _t, inner: string) => `**${inner.trim()}**`)
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_m, _t, inner: string) => `_${inner.trim()}_`)
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function htmlToText(html: string): string {
  const blocks: string[] = []
  const re = /<(h[1-6]|p|ul|ol)>([\s\S]*?)<\/\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase()
    const inner = m[2]
    if (tag.startsWith('h')) blocks.push(`## ${inlineToText(inner)}`)
    else if (tag === 'p') {
      const text = inlineToText(inner)
      if (text) blocks.push(text)
    } else {
      const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((li) => `- ${inlineToText(li[1])}`)
      if (items.length) blocks.push(items.join('\n'))
    }
  }
  return blocks.length ? blocks.join('\n\n') : inlineToText(html)
}

function inlineToHtml(text: string): string {
  return encode(text.trim())
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_(.+?)_(?=$|[\s.,;:!?)])/g, '$1<em>$2</em>')
}

export function textToHtml(text: string): string {
  return text
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length === 1 && lines[0].startsWith('## ')) return `<h4>${inlineToHtml(lines[0].slice(3))}</h4>`
      if (lines.every((l) => l.startsWith('- '))) return `<ul>${lines.map((l) => `<li>${inlineToHtml(l.slice(2))}</li>`).join('')}</ul>`
      // a heading followed by text in the same block
      if (lines[0].startsWith('## ')) return `<h4>${inlineToHtml(lines[0].slice(3))}</h4>\n${textToHtml(lines.slice(1).join('\n'))}`
      return `<p>${lines.map(inlineToHtml).join('<br>')}</p>`
    })
    .join('\n')
}
