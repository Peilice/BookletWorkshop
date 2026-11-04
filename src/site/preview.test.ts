import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { TemplateManifest } from '../model/booklet'
import { emptyBooklet } from '../model/defaults'
import { dayTrip, kanazawa, osakaKyoto } from '../model/sample'
import { isBlankBooklet, previewBooklet, renderPreview } from './preview'
import { validateBooklet } from '../model/validate'

const load = (id: string): TemplateManifest =>
  JSON.parse(readFileSync(new URL(`../../public/templates/${id}.json`, import.meta.url), 'utf8'))

describe('成品預覽', () => {
  it('還沒填內容時用範例行程，填了任何一項就用自己的資料', () => {
    expect(isBlankBooklet(emptyBooklet())).toBe(true)
    expect(previewBooklet(emptyBooklet())).toBe(osakaKyoto)

    const b = emptyBooklet()
    b.infos[0].content = '白天 20 度'
    expect(previewBooklet(b)).toBe(b)
    expect(isBlankBooklet({ ...emptyBooklet(), title: '金澤' })).toBe(false)
  })

  it('選了一日遊的空白手冊用一日遊的範例，國內多日照樣用大阪京都', () => {
    expect(previewBooklet(emptyBooklet('dayTrip'))).toBe(dayTrip)
    expect(previewBooklet(emptyBooklet('domestic'))).toBe(osakaKyoto)
  })

  it('一日遊範例在每個範本都是單日版面，產生前檢查沒有問題', () => {
    for (const id of ['classic', 'season', 'wafu', 'mono', 'poster', 'timeline', 'ticket', 'diary', 'route', 'night', 'outdoor', 'jpmag', 'paper', 'editorial', 'zukan', 'showa', 'catalog']) {
      const m = load(id)
      expect(renderPreview(dayTrip, m, m.presets[0].colors)).not.toContain('Day 1')
      expect(validateBooklet(dayTrip, m)).toEqual([])
    }
  })

  it('每個網站範本都畫得出來，字型連到 Google Fonts，也不會改到工作台的網址', () => {
    for (const id of ['classic', 'season', 'wafu', 'mono', 'poster', 'timeline', 'ticket', 'diary', 'route', 'night', 'outdoor', 'jpmag', 'paper', 'editorial', 'zukan', 'showa', 'catalog']) {
      const m = load(id)
      const html = renderPreview(kanazawa, m, m.presets[0].colors)
      expect(html).toContain('history.replaceState = function () {}')
      expect(html.indexOf('history.replaceState = function')).toBeLessThan(html.indexOf('</head>'))
    }
    const season = load('season')
    expect(renderPreview(kanazawa, season, season.presets[0].colors)).toContain("@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700;900")
  })
})
