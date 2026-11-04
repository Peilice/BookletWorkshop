import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { TemplateManifest } from '../model/booklet'
import { emptyBooklet } from '../model/defaults'
import { osakaKyoto } from '../model/sample'
import { validateBooklet } from '../model/validate'
import { PHOTO_BUDGET } from '../model/photo'
import { renderSite } from './build'
import { toSiteData } from './siteData'

const ids: string[] = JSON.parse(readFileSync(new URL('../../public/templates/index.json', import.meta.url), 'utf8'))
const load = (id: string): TemplateManifest =>
  JSON.parse(readFileSync(new URL(`../../public/templates/${id}.json`, import.meta.url), 'utf8'))

const jpg = (tag: string) => `data:image/jpeg;base64,${tag}AAAA`
const withPhotos = () => {
  const b = structuredClone(osakaKyoto)
  b.cover = jpg('COVER')
  b.backCover = jpg('BACK')
  b.background = jpg('BG')
  b.days[0].spots[0].photo = jpg('SPOT')
  return b
}
const render = (id: string, b = osakaKyoto) => {
  const m = load(id)
  return renderSite(m.site!, toSiteData(b, m, m.presets[0].colors))
}

describe('照片', () => {
  it.each(ids)('%s：沒放照片時完全沒有照片的標記', (id) => {
    const html = render(id)
    expect(html).not.toContain('hero')
    expect(html).not.toContain('spot-photo')
    expect(html).not.toContain('has-bg')
  })

  it.each(ids)('%s：封面、封底、底圖、景點照片都出現', (id) => {
    const html = render(id, withPhotos())
    expect(html).toContain(jpg('COVER'))
    expect(html).toContain(jpg('BACK'))
    expect(html).toContain(jpg('BG'))
    expect(html).toContain(`<img src="${jpg('SPOT')}" alt="大阪城公園"`)
    expect(html).toMatch(/<body class="[^"]*has-bg/)
  })

  it.each(ids)('%s：封面在最前面、封底在列印按鈕前面', (id) => {
    const html = render(id, withPhotos())
    const body = html.slice(html.indexOf('<body'))
    expect(body.indexOf('class="hero"')).toBeLessThan(body.indexOf('<main'))
    expect(body.indexOf('class="hero-back"')).toBeGreaterThan(body.indexOf('<main'))
    expect(body.indexOf('class="hero-back"')).toBeLessThan(body.indexOf('data-print'))
  })

  it('只放封面時沒有封底和底圖', () => {
    const b = { ...osakaKyoto, cover: jpg('COVER') }
    const html = render('mono', b)
    expect(html).toContain('class="hero"')
    expect(html).not.toContain('class="hero-back"')
    expect(html).not.toMatch(/<body class="[^"]*has-bg/)
  })

  it('不是圖片的內容不會寫進網頁', () => {
    const b = { ...osakaKyoto, cover: '"><script>alert(1)</script>', background: 'url(javascript:1)' }
    const html = render('classic', b)
    expect(html).not.toContain('alert(1)')
    expect(html).not.toContain('class="hero"')
  })

  it('照片不會被當成要下載的字型文字', () => {
    // 內文也用網路字型的範本會把手冊內容拿去算字型子集；照片的 data URL 不能混進去
    const html = render('classic', withPhotos())
    expect(html).toContain(jpg('COVER'))
  })

  it('照片合計太大時產生前提醒', () => {
    const b = emptyBooklet()
    expect(validateBooklet(b).some((i) => i.text.includes('照片'))).toBe(false)
    b.cover = 'x'.repeat(PHOTO_BUDGET + 1)
    expect(validateBooklet(b).find((i) => i.text.includes('照片'))?.tab).toBe('style')
  })
})
