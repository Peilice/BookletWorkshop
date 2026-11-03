// 產生手冊前的檢查：列出空白或可能有問題的欄位。只提醒，不阻止產生（規格書 4.6）

import type { Booklet, FormField, TemplateRules } from './booklet'
import { shortDate } from './dates'
import { FALLBACK_RULES, addDays } from './defaults'
import { transportOf } from './transport'

export type TabId = 'flights' | 'days' | 'foods' | 'hotels' | 'infos' | 'checklist' | 'style'

export interface Issue {
  tab: TabId
  text: string
}

const blank = (s: string) => !s.trim()
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

/** 列出空白的欄位名稱，例如「日期、班機」；第三項是 false 的欄位（範本沒用到）不檢查 */
function missing(fields: [string, string, boolean?][]): string {
  return fields
    .filter(([, v, shown = true]) => shown && blank(v))
    .map(([label]) => label)
    .join('、')
}

export function autoOverview(spots: { name: string }[]): string {
  return spots
    .map((s) => s.name.trim())
    .filter(Boolean)
    .join(' → ')
}

/** 數景點內容的字數：不算頭尾空白和換行 */
export const contentLength = (s: string) => s.trim().replace(/\n/g, '').length

export function validateBooklet(b: Booklet, rules: TemplateRules = FALLBACK_RULES): Issue[] {
  const issues: Issue[] = []
  const add = (tab: TabId, text: string) => issues.push({ tab, text })
  const has = (f: FormField) => rules.formFields.includes(f)

  if (!b.flights.length && !b.days.length && !(has('foods') && b.foods.length) && !b.hotels.length) {
    const parts = has('foods') ? '交通、行程、美食或住宿' : '交通、行程或住宿'
    const rest = has('infos') || has('checklist') ? '只會有旅遊資訊和行前清單' : '會是空白的'
    add('days', `手冊還沒有${parts}，產生的手冊${rest}。`)
  }

  // 每日行程有填的日期，由早到晚
  const dated = b.days.map((d) => d.date).filter(isDate).sort()

  b.flights.forEach((f, i) => {
    const t = transportOf(f.mode)
    const m = missing([
      ['日期', f.date],
      [t.carrier, f.airline, has('airline') && t.required.carrier],
      [t.number, f.flightNo, has('flightNo') && t.required.number],
      [t.from, f.from],
      [t.departTime, f.departTime, t.required.times],
      [t.to, f.to],
      [t.arriveTime, f.arriveTime, t.required.times],
    ])
    if (m) add('flights', `交通 ${i + 1}：沒有填${m}`)
    const prev = b.flights[i - 1]
    if (prev && isDate(prev.date) && isDate(f.date) && f.date < prev.date) {
      add('flights', `交通 ${i + 1}：日期比交通 ${i} 早，順序可能排錯了`)
    }
    if (f.departTime && f.arriveTime && f.arriveTime < f.departTime) {
      add('flights', `交通 ${i + 1}：${t.arriveTime}比${t.departTime}早，手冊會當成隔天抵達（+1）`)
    }
    if (dated.length && isDate(f.date) && (f.date < dated[0] || f.date > dated[dated.length - 1])) {
      add('flights', `交通 ${i + 1}：日期 ${shortDate(f.date)} 不在每日行程的日期裡（${shortDate(dated[0])}–${shortDate(dated[dated.length - 1])}）`)
    }
  })

  b.days.forEach((d, i) => {
    const day = `Day ${i + 1}`
    if (blank(d.date)) add('days', `${day}：沒有填日期`)
    const prev = b.days[i - 1]?.date
    const same = b.days.findIndex((o) => o.date === d.date)
    if (isDate(d.date) && same < i) add('days', `${day}：日期和 Day ${same + 1} 重複`)
    else if (prev && isDate(prev) && isDate(d.date) && d.date < prev) add('days', `${day}：日期比前一天早，順序可能排錯了`)
    else if (prev && isDate(prev) && isDate(d.date) && d.date > addDays(prev, 1)) add('days', `${day}：日期和前一天沒有接上，中間少了 ${shortDate(addDays(prev, 1))}`)
    if (!d.spots.length) add('days', `${day}：沒有景點`)
    d.spots.forEach((s, j) => {
      if (blank(s.name)) add('days', `${day} 景點 ${j + 1}：沒有填景點名稱`)
      const earlier = d.spots.slice(0, j).filter((o) => o.time).at(-1)
      if (s.time && earlier && s.time < earlier.time) add('days', `${s.name.trim() || `${day} 景點 ${j + 1}`}：時間 ${s.time} 比前一個景點（${earlier.time}）早`)
      const length = contentLength(s.content)
      if (rules.spotContentLimit && length > rules.spotContentLimit) {
        const name = s.name.trim() || `${day} 景點 ${j + 1}`
        add('days', `${name}：內容有 ${length} 個字，超過 ${rules.spotContentLimit} 字會接到下一頁`)
      }
    })
    const timed = d.spots.filter((s) => s.time)
    const first = timed[0]
    const last = timed[timed.length - 1]
    const outbound = b.flights[0]
    const inbound = b.flights.length > 1 ? b.flights[b.flights.length - 1] : undefined
    // 隔天才抵達的去程不比
    if (first && outbound?.date === d.date && outbound.arriveTime && outbound.arriveTime >= outbound.departTime && first.time < outbound.arriveTime) {
      add('days', `${day}：第一個景點${first.name.trim() ? `「${first.name.trim()}」` : ''}（${first.time}）比去程抵達（${outbound.arriveTime}）還早`)
    }
    if (last && inbound?.date === d.date && inbound.departTime && last.time > inbound.departTime) {
      add('days', `${day}：最後一個景點${last.name.trim() ? `「${last.name.trim()}」` : ''}（${last.time}）比回程出發（${inbound.departTime}）還晚`)
    }
    const overview = d.overview.trim() || autoOverview(d.spots)
    if (rules.overviewLimit && overview.length > rules.overviewLimit) {
      add('days', `${day}：每日行程總覽有 ${overview.length} 個字，可能會超出 Day 方塊（建議 ${rules.overviewLimit} 字以內）`)
    }
  })

  if (has('foods')) b.foods.forEach((p, i) => {
    const place = p.place.trim() || `地點 ${i + 1}`
    if (blank(p.place)) add('foods', `地點 ${i + 1}：沒有填地點名稱`)
    if (!p.items.length) add('foods', `${place}：沒有美食或特產，這個地點不會出現在手冊裡`)
    p.items.forEach((f, j) => {
      if (blank(f.name)) add('foods', `${place} 第 ${j + 1} 項：沒有填名稱`)
    })
  })

  b.hotels.forEach((h, i) => {
    const m = missing([
      ['住宿名稱', h.name],
      ['城市', h.city, has('hotelCity')],
      ['地址', h.address],
      ['電話', h.phone, has('hotelPhone')],
      ['入住日期', h.checkIn, has('hotelStay')],
      ['退房日期', h.checkOut, has('hotelStay')],
    ])
    if (m) add('hotels', `住宿 ${i + 1}：沒有填${m}`)
  })

  if (has('hotelStay')) {
    const stays = b.hotels.map((h, i) => ({ ...h, n: i + 1 })).filter((h) => isDate(h.checkIn) && isDate(h.checkOut))
    stays.forEach((h, k) => {
      if (h.checkOut <= h.checkIn) add('hotels', `住宿 ${h.n}：退房日期要比入住日期晚`)
      const other = stays.slice(0, k).find((o) => o.checkIn < h.checkOut && h.checkIn < o.checkOut)
      if (other) add('hotels', `住宿 ${h.n}：住宿日期和住宿 ${other.n} 重疊`)
    })
    // 最後一天通常就回家了，不算
    const nights = stays.length ? dated.slice(0, -1).filter((d) => !stays.some((h) => h.checkIn <= d && d < h.checkOut)) : []
    if (nights.length) add('hotels', `${nights.map(shortDate).join('、')} 晚上還沒有住宿`)
  }

  if (has('infos')) b.infos.forEach((info, i) => {
    const m = missing([
      ['標題', info.title],
      ['內容', info.content],
    ])
    if (m) add('infos', `${info.title.trim() || `第 ${i + 1} 項`}：沒有填${m}`)
  })

  if (has('checklist')) b.checklist.forEach((g, i) => {
    const name = g.name.trim() || `第 ${i + 1} 個分類`
    if (blank(g.name) && g.items.some((x) => !blank(x.text))) add('checklist', `${name}：沒有填分類名稱`)
    const empty = g.items.filter((x) => blank(x.text)).length
    if (empty) add('checklist', `${name}：有 ${empty} 個空白項目，不會出現在手冊上`)
  })

  return issues
}

