import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '../model/contrast'
import type { TemplateManifest } from '../model/booklet'
import { kanazawa, osakaKyoto } from '../model/sample'
import { dayColors } from './colors'
import { dateRange, toSiteData } from './siteData'

const manifest: TemplateManifest = JSON.parse(
  readFileSync(new URL('../../public/templates/season.json', import.meta.url), 'utf8'),
)
const palette = manifest.presets[0].colors

describe('dayColors', () => {
  it('第一天和最後一天是色階的兩端', () => {
    const c = dayColors(palette, 8)
    expect(c).toHaveLength(8)
    expect(c[0].chip).toBe(palette.accent1)
    expect(c[7].chip).toBe(palette.accent6)
  })

  it('只有一天或沒有行程時也有顏色', () => {
    expect(dayColors(palette, 1)[0].chip).toBe(palette.accent1)
    expect(dayColors(palette, 0)).toHaveLength(1)
  })

  it('深色一定能放白字，即使配色很淺', () => {
    const light = { ...palette, accent1: '#F5E6A0' }
    for (const c of dayColors(light, 3)) expect(contrastRatio(c.deep, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
  })

  it('每組預設配色的日期按鈕都放得下白字', () => {
    for (const p of manifest.presets) {
      for (const c of dayColors(p.colors, 10)) expect(contrastRatio(c.chip, '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('dateRange', () => {
  it('同一年省略後面的年份', () => {
    expect(dateRange(['2026-12-04', '2026-12-01', ''])).toBe('2026.12.01 – 12.04')
  })
  it('跨年寫完整日期', () => {
    expect(dateRange(['2026-12-30', '2027-01-02'])).toBe('2026.12.30 – 2027.01.02')
  })
  it('沒有日期時是空白', () => {
    expect(dateRange([])).toBe('')
  })
})

describe('toSiteData', () => {
  it('依入住、退房日期找出每天晚上住哪裡', () => {
    const d = toSiteData(kanazawa, manifest, palette)
    expect(d.days.map((x) => x.hotel)).toEqual([0, 0, 0, 1, 1, 1, 1, null])
    expect(d.hotels[0].nights).toEqual([0, 1, 2])
    expect(d.hotels[0].checkIn).toBe('11/26')
  })

  it('範本沒用到的欄位不顯示', () => {
    const rules = { formFields: [] }
    const d = toSiteData(kanazawa, rules, palette)
    expect(d.title).toBe('旅遊手冊')
    expect(d.days.every((x) => x.hotel === null)).toBe(true)
    expect(d.hotels.every((h) => h.note === '')).toBe(true)
    expect(d.foods).toEqual([])
  })

  it('當日大標：有總覽用總覽，沒有就用景點名稱', () => {
    const d = toSiteData(osakaKyoto, manifest, palette)
    expect(d.days[0].route).toEqual(['大阪城公園', '道頓堀'])
    expect(d.days[1].route).toEqual(['京都一日遊'])
  })

  it('沒填內容的旅遊資訊不顯示，清單照畫面上的分類', () => {
    const b = { ...osakaKyoto, infos: [{ title: '氣候', content: '' }, { title: '時差', content: '慢 1 小時' }] }
    const d = toSiteData(b, manifest, palette)
    expect(d.infos).toEqual([{ title: '時差', content: '慢 1 小時' }])
    expect(d.checklist.map((c) => c.name)).toEqual(['重要必備證件資料', '衣物&用品', '常備藥品', '其它'])
    expect(d.checklist.find((c) => c.name === '常備藥品')!.items).toEqual(['腸胃藥'])
  })
})
