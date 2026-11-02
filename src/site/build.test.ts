import { readFileSync } from 'node:fs'
import PizZip from 'pizzip'
import { describe, expect, it } from 'vitest'
import type { TemplateManifest } from '../model/booklet'
import { kanazawa, osakaKyoto } from '../model/sample'
import { buildSiteZip, renderSite } from './build'
import { toSiteData } from './siteData'

const manifest: TemplateManifest = JSON.parse(
  readFileSync(new URL('../../public/templates/season.json', import.meta.url), 'utf8'),
)
const data = (b = osakaKyoto) => toSiteData(b, manifest, manifest.presets[0].colors)
const icons = { 'icon-180.png': new Uint8Array([1]), 'icon-192.png': new Uint8Array([2]), 'icon-512.png': new Uint8Array([3]) }

describe('renderSite（和風沉穩）', () => {
  it('每天一個分頁，景點與住宿都在 HTML 裡', () => {
    const html = renderSite('season', data(kanazawa))
    expect(html.match(/<article class="day"/g)).toHaveLength(8)
    expect(html).toContain('金澤・高山 八日遊')
    expect(html).toContain('今晚住宿')
    expect(html).toContain('ARU Kanazawa')
  })

  it('使用者輸入的內容會跳脫，不會變成 HTML', () => {
    const b = { ...osakaKyoto, title: '<script>alert(1)</script>' }
    const html = renderSite('season', data(b))
    expect(html).not.toContain('<script>alert(1)')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('列印版的景點介紹預設展開，網站版收合', () => {
    expect(renderSite('season', data(), { print: true })).toContain('<details open>')
    expect(renderSite('season', data())).not.toContain('<details open>')
  })

  it('沒有資料的分頁不出現', () => {
    const b = { ...osakaKyoto, flights: [], hotels: [] }
    const html = renderSite('season', data(b))
    expect(html).not.toContain('href="#flights"')
    expect(html).not.toContain('href="#stay"')
  })

  it('樣式和程式都內嵌在 HTML 裡', () => {
    const html = renderSite('season', data())
    expect(html).toContain('@page')
    expect(html).toContain("classList.add('js')")
  })

  it('單一 HTML 版不帶離線快取', () => {
    expect(renderSite('season', data())).not.toContain('manifest.webmanifest')
  })
})

describe('buildSiteZip', () => {
  it('包含網頁、manifest、Service Worker 與圖示', () => {
    const zip = new PizZip(buildSiteZip('season', data(), {}, icons, 'v1'))
    expect(Object.keys(zip.files).sort()).toEqual(
      ['icon-180.png', 'icon-192.png', 'icon-512.png', 'index.html', 'manifest.webmanifest', 'sw.js'].sort(),
    )
    expect(zip.file('index.html')!.asText()).toContain('rel="manifest"')
    const sw = zip.file('sw.js')!.asText()
    expect(sw).toContain("'booklet-v1'")
    expect(sw).toContain('"index.html"')
    expect(JSON.parse(zip.file('manifest.webmanifest')!.asText()).name).toBe('大阪・京都 四日遊')
  })
})
