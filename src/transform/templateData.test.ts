import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Booklet, TemplateManifest } from '../model/booklet'
import { osakaKyoto, sparse } from '../model/sample'
import { chineseDay, shortDate, toTemplateData, weekday } from './templateData'

const manifest: TemplateManifest = JSON.parse(
  readFileSync(new URL('../../public/templates/classic.json', import.meta.url), 'utf8'),
)

describe('日期', () => {
  it('縮成 月/日', () => {
    expect(shortDate('2026-12-01')).toBe('12/1')
    expect(shortDate('')).toBe('')
  })

  it('算出星期', () => {
    expect(weekday('2026-12-01')).toBe('星期二')
    expect(weekday('2026-12-06')).toBe('星期日')
  })
})

describe('每日行程', () => {
  const data = toTemplateData(osakaKyoto, manifest)
  const days = data['每日行程'] as Record<string, unknown>[]

  it('依順序編 Day N', () => {
    expect(days.map((d) => d['天數'])).toEqual(['Day 1', 'Day 2', 'Day 3', 'Day 4'])
  })

  it('總覽沒填時用景點串起來，有填就用填的', () => {
    expect(days[0]['每日行程總覽']).toBe('大阪城公園 → 道頓堀')
    expect(days[1]['每日行程總覽']).toBe('京都一日遊')
  })
})

describe('區塊隱藏', () => {
  it('沒有資料的區塊標成不顯示', () => {
    const data = toTemplateData(sparse, manifest)
    expect(data['有航班']).toBe(false)
    expect(data['有美食']).toBe(false)
    expect(data['有飯店']).toBe(false)
    expect(data['有行程']).toBe(true)
  })

  it('美食地點沒有項目時不算有資料', () => {
    const b: Booklet = { ...sparse, foods: [{ place: '大阪', items: [] }] }
    expect(toTemplateData(b, manifest)['有美食']).toBe(false)
  })
})

describe('檢查清單', () => {
  const data = toTemplateData(sparse, manifest)

  it('先填空白格，剩下的空白格留空', () => {
    // 其它：10 格空白，填入 12 項中的前 10 項
    expect(data['其它空1']).toBe('其它項目1')
    expect(data['其它空10']).toBe('其它項目10')
    expect(data['衣物空1']).toBe('')
  })

  it('空白格不夠時每 3 項加一列，最後一列不足的格子留空', () => {
    expect(data['證件加列']).toEqual([
      { 第1格: '日幣', 第2格: '駕照譯本', 第3格: '旅平險保單' },
      { 第1格: '飯店訂房確認單', 第2格: '', 第3格: '' },
    ])
    expect(data['其它加列']).toEqual([{ 第1格: '其它項目11', 第2格: '其它項目12', 第3格: '' }])
    expect(data['藥品加列']).toEqual([])
  })
})

describe('和風直排範本用到的資料', () => {
  const data = toTemplateData(osakaKyoto, manifest)

  it('中文天數', () => {
    expect([1, 2, 10, 11, 20, 23].map(chineseDay)).toEqual(['第一天', '第二天', '第十天', '第十一天', '第二十天', '第二十三天'])
  })

  it('航班標出去程、回程，中間的航班不標', () => {
    const three = { ...osakaKyoto, flights: [osakaKyoto.flights[0], osakaKyoto.flights[0], osakaKyoto.flights[1]] }
    const legs = (b: Booklet) => (toTemplateData(b, manifest)['航班'] as Record<string, unknown>[]).map((f) => f['航程'])
    expect(legs(osakaKyoto)).toEqual(['去程', '回程'])
    expect(legs(three)).toEqual(['去程', '', '回程'])
    expect(legs({ ...osakaKyoto, flights: [osakaKyoto.flights[0]] })).toEqual(['去程'])
  })

  it('星期簡寫', () => {
    expect((data['航班'] as Record<string, unknown>[])[0]['星期簡寫']).toBe('二')
    expect((data['每日行程'] as Record<string, unknown>[])[0]['星期簡寫']).toBe('二')
  })

  it('景點介紹只列有內容的景點，並標出第幾天', () => {
    const b: Booklet = {
      ...osakaKyoto,
      days: [
        { ...osakaKyoto.days[0], spots: [{ name: '宮川朝市', content: '介紹' }, { name: '回民宿', content: ' ' }] },
        { ...osakaKyoto.days[1], spots: [{ name: '新穗高纜車', content: '介紹二' }] },
      ],
    }
    const d = toTemplateData(b, manifest)
    expect(d['有景點介紹']).toBe(true)
    expect(d['景點介紹']).toEqual([
      { 景點名稱: '宮川朝市', 景點內容: '介紹', 第幾天: '第一天' },
      { 景點名稱: '新穗高纜車', 景點內容: '介紹二', 第幾天: '第二天' },
    ])
  })

  it('沒有航班也沒有飯店時，不顯示班機與住宿', () => {
    expect(data['有航班或飯店']).toBe(true)
    expect(toTemplateData({ ...sparse, flights: [], hotels: [] }, manifest)['有航班或飯店']).toBe(false)
  })
})
