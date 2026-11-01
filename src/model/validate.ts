// 產生 Word 前的檢查：列出空白或可能有問題的欄位。只提醒，不阻止產生（規格書 4.6）

import type { Booklet } from './booklet'
import { CHECKLIST_CATEGORIES } from './booklet'

export type TabId = 'flights' | 'days' | 'foods' | 'hotels' | 'infos' | 'checklist' | 'style'

export interface Issue {
  tab: TabId
  text: string
}

// Day 方塊空間有限（規格書 4.1）
export const OVERVIEW_LIMIT = 40

const blank = (s: string) => !s.trim()

/** 列出空白的欄位名稱，例如「日期、班機」 */
function missing(fields: [string, string][]): string {
  return fields
    .filter(([, v]) => blank(v))
    .map(([label]) => label)
    .join('、')
}

export function autoOverview(spots: { name: string }[]): string {
  return spots
    .map((s) => s.name.trim())
    .filter(Boolean)
    .join(' → ')
}

export function validateBooklet(b: Booklet): Issue[] {
  const issues: Issue[] = []
  const add = (tab: TabId, text: string) => issues.push({ tab, text })

  if (!b.flights.length && !b.days.length && !b.foods.length && !b.hotels.length) {
    add('days', '手冊還沒有航班、行程、美食或飯店，產生的 Word 只會有旅遊資訊和檢查清單。')
  }

  b.flights.forEach((f, i) => {
    const m = missing([
      ['日期', f.date],
      ['航空公司', f.airline],
      ['班機', f.flightNo],
      ['起飛地', f.from],
      ['起飛時間', f.departTime],
      ['抵達地', f.to],
      ['抵達時間', f.arriveTime],
    ])
    if (m) add('flights', `航班 ${i + 1}：沒有填${m}`)
  })

  b.days.forEach((d, i) => {
    const day = `Day ${i + 1}`
    if (blank(d.date)) add('days', `${day}：沒有填日期`)
    if (!d.spots.length) add('days', `${day}：沒有景點`)
    d.spots.forEach((s, j) => {
      if (blank(s.name)) add('days', `${day} 景點 ${j + 1}：沒有填景點名稱`)
    })
    const overview = d.overview.trim() || autoOverview(d.spots)
    if (overview.length > OVERVIEW_LIMIT) {
      add('days', `${day}：每日行程總覽有 ${overview.length} 個字，可能會超出 Day 方塊（建議 ${OVERVIEW_LIMIT} 字以內）`)
    }
  })

  b.foods.forEach((p, i) => {
    const place = p.place.trim() || `地點 ${i + 1}`
    if (blank(p.place)) add('foods', `地點 ${i + 1}：沒有填地點名稱`)
    if (!p.items.length) add('foods', `${place}：沒有美食或特產，這個地點不會出現在手冊裡`)
    p.items.forEach((f, j) => {
      if (blank(f.name)) add('foods', `${place} 第 ${j + 1} 項：沒有填名稱`)
    })
  })

  b.hotels.forEach((h, i) => {
    const m = missing([
      ['飯店名稱', h.name],
      ['地址', h.address],
      ['電話', h.phone],
    ])
    if (m) add('hotels', `飯店 ${i + 1}：沒有填${m}`)
  })

  b.infos.forEach((info, i) => {
    const m = missing([
      ['標題', info.title],
      ['內容', info.content],
    ])
    if (m) add('infos', `${info.title.trim() || `第 ${i + 1} 項`}：沒有填${m}`)
  })

  for (const c of CHECKLIST_CATEGORIES) {
    const empty = b.checklist.filter((x) => x.category === c.key && blank(x.item)).length
    if (empty) add('checklist', `${c.label}：有 ${empty} 個空白項目，手冊上會是空白格`)
  }

  return issues
}
