import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Booklet, TemplateManifest } from '../model/booklet'
import { osakaKyoto, sparse } from '../model/sample'
import { shortDate, toTemplateData, weekday } from './templateData'

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
