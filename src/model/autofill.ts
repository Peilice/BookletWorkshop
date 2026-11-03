// 新增一筆資料時，先從已經填的內容推出合理的預設值；使用者隨時可以改

import type { Booklet, Day, Flight, Hotel } from './booklet'
import { addDays, newDay, newFlight, newHotel } from './defaults'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/** 交通和住宿裡最早、最晚的日期（YYYY-MM-DD 可以直接比字串）；都沒填時是 null */
export function tripRange(b: Pick<Booklet, 'flights' | 'hotels'>): { start: string; end: string } | null {
  const dates = [...b.flights.map((f) => f.date), ...b.hotels.flatMap((h) => [h.checkIn, h.checkOut])].filter((d) => ISO.test(d)).sort()
  return dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null
}

/** 最多一次建立幾天，日期填錯（例如年份打錯）時不會建立出幾百天 */
export const MAX_TRIP_DAYS = 60

/** 依交通和住宿的日期，從第一天排到最後一天；日期太長或沒有日期時是空陣列 */
export function daysFromTrip(b: Pick<Booklet, 'flights' | 'hotels'>): Day[] {
  const range = tripRange(b)
  if (!range) return []
  const days: Day[] = []
  for (let date = range.start; date <= range.end && days.length <= MAX_TRIP_DAYS; date = addDays(date, 1)) {
    days.push({ ...newDay(), date })
  }
  return days.length > MAX_TRIP_DAYS ? [] : days
}

/**
 * 新增交通：接著上一筆的抵達地出發，回到第一筆的出發地（來回時就是去程反過來），
 * 交通方式、業者沿用上一筆，日期帶入行程的最後一天。第一筆只帶入行程第一天的日期。
 */
export function nextFlight(b: Pick<Booklet, 'flights' | 'days'>): Flight {
  const first = b.flights[0]
  const last = b.flights.at(-1)
  if (!first || !last) return { ...newFlight(), date: b.days[0]?.date ?? '' }
  const lastDay = b.days.at(-1)?.date ?? ''
  return {
    ...newFlight(),
    mode: last.mode,
    airline: last.airline,
    from: last.to,
    to: first.from,
    date: lastDay > last.date ? lastDay : last.date,
  }
}

/** 新增住宿：入住日期接著上一間的退房日期；第一間帶入旅程的第一天 */
export function nextHotel(b: Pick<Booklet, 'flights' | 'days' | 'hotels'>): Hotel {
  const last = b.hotels.at(-1)
  const first = [b.days[0]?.date ?? '', ...b.flights.map((f) => f.date)].filter((d) => ISO.test(d)).sort()[0] ?? ''
  return { ...newHotel(), checkIn: last ? last.checkOut : first }
}
