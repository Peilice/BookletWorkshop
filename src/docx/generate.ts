// 範本＋資料＋配色＋字體 → .docx（規格書 6.1）

import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { setThemeColors, syncThemedColors, type Palette } from './colors'
import { setStyleFonts } from './fonts'
import { dropEmptyLastSection, renumberDrawingIds } from './postprocess'

export interface GenerateOptions {
  data: Record<string, unknown>
  palette: Palette
  fonts: Record<string, string> // 樣式名稱 → 字體
}

const COLOR_PARTS = /^word\/(document|styles|header\d*|footer\d*)\.xml$/

export function generateDocx(template: ArrayBuffer | Uint8Array, opts: GenerateOptions): Uint8Array {
  const zip = new PizZip(template)

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  })
  doc.render(opts.data)

  const out = doc.getZip()
  const edit = (path: string, fn: (xml: string) => string) => {
    const f = out.file(path)
    if (f) out.file(path, fn(f.asText()))
  }

  edit('word/theme/theme1.xml', (xml) => setThemeColors(xml, opts.palette))
  edit('word/styles.xml', (xml) => setStyleFonts(xml, opts.fonts))
  for (const path of Object.keys(out.files)) {
    if (COLOR_PARTS.test(path)) edit(path, (xml) => syncThemedColors(xml, opts.palette))
  }
  edit('word/document.xml', (xml) => dropEmptyLastSection(renumberDrawingIds(xml)))

  return out.generate({ type: 'uint8array', compression: 'DEFLATE' })
}
