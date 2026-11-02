import { describe, expect, it } from 'vitest'
import { dropEmptyLastSection } from './postprocess'

const H = '<w:sectPr><w:pgSz w:w="8391"/></w:sectPr>'
const V = '<w:sectPr><w:pgSz w:w="8391"/><w:textDirection w:val="tbRl"/></w:sectPr>'
const doc = (body: string) => `<w:document><w:body>${body}</w:body></w:document>`

describe('dropEmptyLastSection', () => {
  it('最後一個區段沒有內容時（例如景點介紹整段隱藏），併到前一個區段，不留空白頁', () => {
    const xml = doc(`<w:p><w:r><w:t>行程</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="BW-內文"/>${H}</w:pPr></w:p>${V}`)
    expect(dropEmptyLastSection(xml)).toBe(
      doc(`<w:p><w:r><w:t>行程</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="BW-內文"/></w:pPr></w:p>${H}`),
    )
  })

  it('最後一個區段有內容時不動', () => {
    const xml = doc(`<w:p><w:pPr>${H}</w:pPr></w:p><w:p><w:r><w:t>宮川朝市</w:t></w:r></w:p>${V}`)
    expect(dropEmptyLastSection(xml)).toBe(xml)
  })

  it('只有一個區段時不動', () => {
    const xml = doc(`<w:p><w:r><w:t>內容</w:t></w:r></w:p>${H}`)
    expect(dropEmptyLastSection(xml)).toBe(xml)
  })
})
