// 換字體：改寫 styles.xml 裡 BW- 樣式的字體（規格書 4.5、7.2）

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** fonts：樣式名稱（例如 "BW-內文"）→ 字體名稱 */
export function setStyleFonts(stylesXml: string, fonts: Record<string, string>): string {
  return stylesXml.replace(/<w:style\b[^>]*>[\s\S]*?<\/w:style>/g, (style) => {
    const name = /<w:name w:val="([^"]*)"/.exec(style)?.[1]
    const font = name !== undefined ? fonts[name] : undefined
    if (!font) return style
    const f = escapeXml(font)
    const rFonts = `<w:rFonts w:ascii="${f}" w:eastAsia="${f}" w:hAnsi="${f}" w:cs="${f}"/>`
    if (/<w:rFonts\b[^>]*\/>/.test(style)) return style.replace(/<w:rFonts\b[^>]*\/>/, rFonts)
    if (style.includes('<w:rPr>')) return style.replace('<w:rPr>', `<w:rPr>${rFonts}`)
    return style.replace('</w:style>', `<w:rPr>${rFonts}</w:rPr></w:style>`)
  })
}

/** 列出範本裡所有 BW- 樣式的名稱與目前字體 */
export function listStyleFonts(stylesXml: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const style of stylesXml.match(/<w:style\b[^>]*>[\s\S]*?<\/w:style>/g) ?? []) {
    const name = /<w:name w:val="([^"]*)"/.exec(style)?.[1]
    if (!name?.startsWith('BW-')) continue
    result[name] = /<w:rFonts\b[^>]*w:eastAsia="([^"]*)"/.exec(style)?.[1] ?? ''
  }
  return result
}
