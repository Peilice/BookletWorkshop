// 景點介紹的提示詞：「複製提示詞」貼到自己慣用的 AI，或用自己的 API key 直接產生，兩邊共用這一份

import type { Booklet, Day } from './booklet'

/** 介紹沒有字數上限時，請 AI 寫大約這麼長 */
export const DEFAULT_INTRO_LENGTH = 100

/**
 * 這一天大概在哪裡：當晚住的地方（城市，沒填城市時用住宿名稱）→ 當天交通的抵達地 → 之前最後一段交通的抵達地。
 * 只給景點名稱容易認錯同名的地方，所以盡量帶上地點；推不出來時是空字串。
 */
export function dayPlace(b: Pick<Booklet, 'flights' | 'hotels'>, day: Pick<Day, 'date'>): string {
  const d = day.date
  if (!d) return ''
  const hotel = b.hotels.find((h) => h.checkIn && h.checkOut && h.checkIn <= d && d < h.checkOut)
  if (hotel) return hotel.city || hotel.name
  const arrived = b.flights.filter((f) => f.date && f.date <= d && f.to).sort((x, y) => x.date.localeCompare(y.date))
  return arrived.at(-1)?.to ?? ''
}

export interface IntroRequest {
  name: string
  place: string // 推不出來時是空字串
  title: string // 手冊名稱，例如「大阪・京都 四日遊」，幫 AI 判斷是哪裡
  limit?: number // 範本的景點內容字數上限
}

export function spotPrompt({ name, place, title, limit }: IntroRequest): string {
  const where = [place && `地點：${place}`, title && `這趟旅行：${title}`].filter(Boolean)
  return [
    '請用繁體中文（台灣用語）幫旅遊手冊寫一段景點介紹。',
    '',
    `景點：${name.trim()}`,
    ...where,
    '',
    '要求：',
    limit ? `- ${limit} 字以內` : `- ${DEFAULT_INTRO_LENGTH} 字左右`,
    '- 介紹這個景點最經典、最值得看的地方，可以加一句參觀的小提醒',
    '- 不要寫營業時間、票價這類容易變動的資訊；不確定的事不要寫',
    '- 只回覆介紹本文，不要標題、條列或引號',
  ].join('\n')
}
