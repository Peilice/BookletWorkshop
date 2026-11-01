import { describe, expect, it } from 'vitest'
import { emptyBooklet, newDay, newFlight, newFoodPlace, newHotel } from './defaults'
import { osakaKyoto } from './sample'
import { validateBooklet } from './validate'

describe('validateBooklet', () => {
  it('範例資料沒有問題', () => {
    expect(validateBooklet(osakaKyoto)).toEqual([])
  })

  it('完全沒有內容時提醒', () => {
    const issues = validateBooklet(emptyBooklet())
    expect(issues.map((i) => i.text)).toContainEqual(expect.stringContaining('手冊還沒有航班'))
  })

  it('列出航班空白的欄位', () => {
    const b = { ...emptyBooklet(), flights: [{ ...newFlight(), airline: '中華航空', from: '高雄', to: '大阪' }] }
    expect(validateBooklet(b)).toContainEqual({ tab: 'flights', text: '航班 1：沒有填日期、班機、起飛時間、抵達時間' })
  })

  it('行程：日期、景點名稱空白', () => {
    const b = { ...emptyBooklet(), days: [newDay()] }
    const days = validateBooklet(b).filter((i) => i.tab === 'days')
    expect(days.map((i) => i.text)).toEqual(['Day 1：沒有填日期', 'Day 1 景點 1：沒有填景點名稱'])
  })

  it('行程總覽太長', () => {
    const day = { date: '2026-12-01', overview: '很'.repeat(41), spots: [{ name: '景點', content: '' }] }
    const issues = validateBooklet({ ...osakaKyoto, days: [day] })
    expect(issues).toEqual([{ tab: 'days', text: expect.stringContaining('41 個字') }])
  })

  it('美食地點、飯店空白', () => {
    const b = { ...emptyBooklet(), foods: [newFoodPlace()], hotels: [newHotel()] }
    const texts = validateBooklet(b).map((i) => i.text)
    expect(texts).toContain('地點 1：沒有填地點名稱')
    expect(texts).toContain('地點 1 第 1 項：沒有填名稱')
    expect(texts).toContain('飯店 1：沒有填飯店名稱、地址、電話')
  })

  it('旅遊資訊內容空白（新手冊預設的三項）', () => {
    const b = { ...osakaKyoto, infos: emptyBooklet().infos }
    expect(validateBooklet(b).map((i) => i.text)).toEqual(['氣候：沒有填內容', '時差：沒有填內容', '飲水：沒有填內容'])
  })

  it('檢查清單的空白項目', () => {
    const b = { ...osakaKyoto, checklist: [{ category: '藥品' as const, item: ' ' }] }
    expect(validateBooklet(b)).toEqual([{ tab: 'checklist', text: '常備藥品：有 1 個空白項目，手冊上會是空白格' }])
  })
})
