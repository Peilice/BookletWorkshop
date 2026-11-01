// 新增手冊、新增一筆資料時的預設值

import type { Booklet, Day, FoodItem, FoodPlace, Flight, Hotel, InfoItem, Settings, Spot } from './booklet'

export function emptyBooklet(): Booklet {
  return {
    flights: [],
    days: [],
    foods: [],
    hotels: [],
    // 旅遊資訊預設先放這三項（規格書 4.1）
    infos: ['氣候', '時差', '飲水'].map((title) => ({ title, content: '' })),
    checklist: [],
  }
}

export function defaultSettings(): Settings {
  return { templateId: 'classic', palette: null, fonts: {} }
}

/** YYYY-MM-DD 加 n 天；格式不對時回傳空字串 */
export function addDays(iso: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n)
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const newFlight = (): Flight => ({
  date: '',
  airline: '',
  flightNo: '',
  from: '',
  departTime: '',
  to: '',
  arriveTime: '',
})

export const newSpot = (): Spot => ({ name: '', content: '' })

/** 新的一天：日期接在前一天後面 */
export const newDay = (previous?: Day): Day => ({
  date: previous ? addDays(previous.date, 1) : '',
  overview: '',
  spots: [newSpot()],
})

export const newFoodItem = (): FoodItem => ({ name: '', description: '' })
export const newFoodPlace = (): FoodPlace => ({ place: '', items: [newFoodItem()] })
export const newHotel = (): Hotel => ({ name: '', address: '', phone: '' })
export const newInfo = (): InfoItem => ({ title: '', content: '' })
