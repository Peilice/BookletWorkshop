// 組 HTML 字串用的小工具：使用者寫的內容一律先跳脫

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c])

/** 多行文字 → 段落；空白行不算 */
export const paragraphs = (s: string) =>
  s
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${esc(line)}</p>`)
    .join('')

/** 條件成立才輸出 */
export const when = (cond: unknown, html: () => string) => (cond ? html() : '')
