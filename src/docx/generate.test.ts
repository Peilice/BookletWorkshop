// 用真正的範本產生 docx，檢查輸出的 XML。版面是否正確仍要用 Word 確認（scripts/verify/）。

import { readFileSync } from 'node:fs'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import type { Booklet, TemplateManifest } from '../model/booklet'
import { kanazawa, osakaKyoto, sparse } from '../model/sample'
import { toTemplateData } from '../transform/templateData'
import { generateDocx } from './generate'

const templateDir = new URL('../../public/templates/', import.meta.url)
const manifest: TemplateManifest = JSON.parse(readFileSync(new URL('classic.json', templateDir), 'utf8'))
const template = readFileSync(new URL(manifest.file, templateDir))
const defaultFonts = Object.fromEntries(manifest.fontRoles.map((r) => [r.style, r.default]))

function generate(booklet = osakaKyoto, fonts = defaultFonts, palette = manifest.presets[0].colors) {
  const zip = new PizZip(generateDocx(template, { data: toTemplateData(booklet, manifest), palette, fonts }))
  return {
    document: zip.file('word/document.xml')!.asText(),
    styles: zip.file('word/styles.xml')!.asText(),
    theme: zip.file('word/theme/theme1.xml')!.asText(),
  }
}

describe('generateDocx', () => {
  it('所有標記都被替換', () => {
    const { document } = generate()
    expect(document).not.toMatch(/\{[#/]?[^{}<]*\}/)
    expect(document).toContain('大阪難波測試飯店')
    expect(document).toContain('星期五')
  })

  it('每一天都有一個 Day 方塊，圖形 id 不重複', () => {
    const { document } = generate()
    expect(document.match(/<wp:anchor\b/g)).toHaveLength(osakaKyoto.days.length)
    const ids = [...document.matchAll(/<(?:wp:docPr|wps:cNvPr) id="(\d+)"/g)].map((m) => m[1])
    expect(new Set(ids).size).toBe(ids.length)
    expect(document).not.toContain('wp14:anchorId')
  })

  it('多行文字轉成 Word 換行', () => {
    const { document } = generate()
    expect(document).toMatch(/第二行：測試換行。/)
    expect(document).toMatch(/<w:br\/>/)
  })

  it('沒有資料的區塊不輸出', () => {
    const { document } = generate(sparse)
    expect(document).not.toContain('航班資訊')
    expect(document).not.toContain('當地美食')
    expect(document).not.toContain('飯店資訊')
    expect(document).toContain('行程規劃')
  })

  it('換字體只改 BW- 樣式', () => {
    const { styles } = generate(osakaKyoto, { ...defaultFonts, 'BW-內文': 'Microsoft JhengHei' })
    expect(styles).toMatch(/<w:name w:val="BW-內文"\/>[\s\S]*?w:eastAsia="Microsoft JhengHei"/)
    expect(styles).toMatch(/<w:name w:val="BW-Day方塊"\/>[\s\S]*?w:eastAsia="華康棒棒體W5"/)
  })

  it('換色改寫佈景主題強調色', () => {
    const palette = { ...manifest.presets[0].colors, accent1: '#123456' }
    const { theme } = generate(osakaKyoto, defaultFonts, palette)
    expect(theme).toContain('<a:accent1><a:srgbClr val="123456"/></a:accent1>')
  })
})

describe('generateDocx：和風直排範本', () => {
  const wafu: TemplateManifest = JSON.parse(readFileSync(new URL('wafu.json', templateDir), 'utf8'))
  const wafuTemplate = readFileSync(new URL(wafu.file, templateDir))
  const fonts = Object.fromEntries(wafu.fontRoles.map((r) => [r.style, r.default]))
  const render = (booklet: Booklet) =>
    new PizZip(generateDocx(wafuTemplate, { data: toTemplateData(booklet, wafu), palette: wafu.presets[0].colors, fonts }))
      .file('word/document.xml')!
      .asText()

  it('所有標記都被替換，每個有內容的景點一頁、各有一個照片框', () => {
    const document = render(kanazawa)
    expect(document).not.toMatch(/\{[#/]?[^{}<]*\}/)
    expect(document).toContain('去程：11/26（四）')
    expect(document).toContain('高山｜Mine House')
    expect(document).toContain('11/27（五）　09:00 出門')
    expect(document).toContain('（第二天）')
    const spots = kanazawa.days.flatMap((d) => d.spots).filter((s) => s.content.trim())
    expect(document.match(/<wp:anchor\b/g)).toHaveLength(spots.length)
  })

  it('沒有景點介紹時，文件結尾是橫排區段，不會多一頁空白直排頁', () => {
    const noSpots = { ...kanazawa, days: kanazawa.days.map((d) => ({ ...d, spots: [] })) }
    const document = render(noSpots)
    expect(document.match(/<w:sectPr\b/g)).toHaveLength(1)
    expect(document).not.toContain('tbRl')
  })
})
