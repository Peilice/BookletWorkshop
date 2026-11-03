// 存檔與產出檔案的檔名

import type { Booklet } from './booklet'

/** 出發日期：第一筆航班的日期，沒有航班時用 Day 1 的日期（待決事項 Q10，暫定） */
export function departureDate(b: Booklet): string {
  return b.flights.find((f) => f.date)?.date || b.days.find((d) => d.date)?.date || ''
}

export function bookletFileName(b: Booklet, ext: 'json' | 'html' | 'zip' | 'pdf'): string {
  const date = departureDate(b).replaceAll('-', '')
  return `旅遊手冊${date ? `_${date}` : ''}.${ext}`
}
