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

describe('renderSite（經典、和風直排）', () => {
  const site = (id: string, b = osakaKyoto) => {
    const m: TemplateManifest = JSON.parse(readFileSync(new URL(`../../public/templates/${id}.json`, import.meta.url), 'utf8'))
    expect(m.site).toBe(id)
    return renderSite(id, toSiteData(b, m, m.presets[0].colors))
  }

  it('經典：Day 框，行李規定照旅遊資訊填的內容，行前清單只有畫面上填的項目', () => {
    const html = site('classic')
    expect(html.match(/class="daybox"/g)).toHaveLength(4)
    expect(html).toContain('托運行李') // 範例手冊的行李規定
    expect(html.match(/>行李規定</g)).toHaveLength(1) // 範本不再另外印一份
    expect(html).toContain('ICOCA卡')
    expect(html).not.toContain('國際信用卡') // 範本裡不再有固定項目
    expect(html.match(/data-check=/g)).toHaveLength(6)
  })

  it('和風直排：只有寫了介紹的景點才有直排卡片', () => {
    const html = site('wafu', kanazawa)
    const withContent = kanazawa.days.flatMap((d) => d.spots).filter((s) => s.content.trim()).length
    expect(html.match(/class="spot"/g)).toHaveLength(withContent)
    expect(html).toContain('class="tate"')
    expect(html).toContain('11/26（四）')
  })
})

describe('交通方式', () => {
  const m = (id: string): TemplateManifest =>
    JSON.parse(readFileSync(new URL(`../../public/templates/${id}.json`, import.meta.url), 'utf8'))
  const mixed = {
    ...osakaKyoto,
    flights: [
      osakaKyoto.flights[0],
      { mode: 'hsr' as const, date: '2026-12-02', airline: '', flightNo: '0603', from: '新大阪', departTime: '09:00', to: '京都', arriveTime: '09:15' },
    ],
  }
  const site = (id: string, b = osakaKyoto) => renderSite(id, toSiteData(b, m(id), m(id).presets[0].colors))

  it('全部都是飛機時沿用「航班」', () => {
    expect(site('classic')).toContain('航班資訊')
    expect(site('season')).toContain('id="h-flights">航班<')
    expect(site('wafu')).toContain('【班機】')
  })

  it('混了其他交通方式時改叫「交通」，標出每一筆的交通方式和圖示', () => {
    const classic = site('classic', mixed)
    expect(classic).toContain('交通資訊')
    expect(classic).toContain('>高鐵<')
    const season = site('season', mixed)
    expect(season).toContain('id="h-flights">交通<')
    expect(season).toContain('高鐵 0603')
    expect(season).toContain('href="#i-train"')
    const wafu = site('wafu', mixed)
    expect(wafu).toContain('【交通】')
    expect(wafu).toContain('09:00 出發')
  })
})

describe('一日遊與景點時間', () => {
  const m = (id: string): TemplateManifest =>
    JSON.parse(readFileSync(new URL(`../../public/templates/${id}.json`, import.meta.url), 'utf8'))
  const site = (id: string, b: typeof osakaKyoto) => renderSite(id, toSiteData(b, m(id), m(id).presets[0].colors))
  const timed = osakaKyoto.days[1].spots.map((s, i) => ({ ...s, time: i === 0 ? '09:30' : '' }))
  const oneDay = { ...osakaKyoto, flights: [], hotels: [], days: [{ ...osakaKyoto.days[1], spots: timed }] }

  it('只有一天時不標 Day 1、第一天，也沒有選日期的按鈕和總覽表', () => {
    const classic = site('classic', oneDay)
    expect(classic).not.toContain('Day 1')
    expect(classic).toContain('<b>12/2</b>')
    const season = site('season', oneDay)
    expect(season).not.toContain('class="daybar"')
    expect(season).not.toContain('<b>Day 1</b>')
    expect(season).not.toContain('class="overview print-only"')
    const wafu = site('wafu', oneDay)
    expect(wafu).not.toContain('第一天')
    expect(wafu).toContain('當日行程')
  })

  it('多天時照舊標天數', () => {
    expect(site('classic', osakaKyoto)).toContain('Day 1')
    expect(site('season', osakaKyoto)).toContain('class="daybar"')
  })

  it('景點有填時間時，三份範本都顯示出來', () => {
    expect(site('classic', oneDay)).toContain('<span class="spot-time num">09:30</span>')
    expect(site('season', oneDay)).toContain('<b class="stop-time num">09:30</b>')
    expect(site('wafu', oneDay)).toContain('<span class="num">09:30</span>')
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
