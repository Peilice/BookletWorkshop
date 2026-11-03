// 表單資料 → 網站範本要顯示的內容。所有顯示邏輯都在這裡，網站範本只負責排版。

import type { Booklet, FormField, PaletteColors, TemplateRules, TransportMode } from '../model/booklet'
import { onlyFlights, transportOf } from '../model/transport'
import { autoOverview } from '../model/validate'
import { flightLeg, shortDate, weekday } from '../model/dates'
import { dayColors, type DayColor } from './colors'

// 一筆交通（沿用航班的名稱，見 Flight）
export interface SiteFlight {
  mode: TransportMode
  modeLabel: string // 飛機、高鐵⋯
  icon: string
  departWord: string // 起飛、出發
  leg: string // 去程、回程或空白
  date: string
  weekday: string // 星期四
  weekdayShort: string // 四
  airline: string
  flightNo: string
  from: string
  departTime: string
  to: string
  arriveTime: string
}

export interface SiteSpot {
  time: string // HH:mm 或空白
  name: string
  content: string
}

export interface SiteDay {
  n: number // 第幾天，從 1 開始
  iso: string // YYYY-MM-DD，網站用來找「今天」
  date: string // 12/1
  weekday: string // 星期二
  weekdayShort: string // 二
  route: string[] // 當日大標，箭頭分開的各段
  departTime: string
  spots: SiteSpot[]
  color: DayColor
  hotel: number | null // 當晚住哪間（hotels 的索引）
}

export interface SiteHotel {
  name: string
  address: string
  phone: string
  city: string
  checkIn: string
  checkOut: string
  note: string
  nights: number[] // 住在這間的是第幾天的晚上（days 的索引）
  mapUrl: string
}

export interface SiteData {
  title: string
  dateRange: string
  tripKey: string // 網站存勾選清單時用，不同手冊不會互相覆蓋
  palette: PaletteColors // 範本配色，各範本自己決定每個顏色用在哪
  onlyFlights: boolean // 交通全部都是飛機：標題沿用「航班」，不然叫「交通」
  singleDay: boolean // 只有一天（一日遊）：範本不標 Day 1、第一天，也不放天數切換和總覽表
  colors: DayColor[] // 依天數內插的日色
  flights: SiteFlight[]
  days: SiteDay[]
  hotels: SiteHotel[]
  foods: { place: string; items: { name: string; description: string }[] }[]
  infos: { title: string; content: string }[]
  // 照畫面上的清單；沒填的項目和沒有項目的分類不放
  checklist: { name: string; items: string[] }[]
}

const DEFAULT_TITLE = '旅遊手冊'
const filled = (s: string) => s.trim() !== ''
const short = (iso: string) => weekday(iso).slice(2)

/** 出發到回程的日期範圍，例如 2026.12.01 – 12.04 */
export function dateRange(dates: string[]): string {
  const sorted = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  if (!sorted.length) return ''
  const [first, last] = [sorted[0], sorted[sorted.length - 1]]
  const dot = (iso: string) => iso.replaceAll('-', '.')
  if (first === last) return dot(first)
  return `${dot(first)} – ${first.slice(0, 4) === last.slice(0, 4) ? dot(last.slice(5)) : dot(last)}`
}

function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i)
  return (h >>> 0).toString(36)
}

export function toSiteData(b: Booklet, rules: TemplateRules, palette: PaletteColors): SiteData {
  const has = (f: FormField) => rules.formFields.includes(f)
  const shown = (f: FormField, v: string) => (has(f) ? v.trim() : '')

  const colors = dayColors(palette, b.days.length)
  const stay = has('hotelStay')
  const hotelOf = (iso: string) =>
    stay && iso ? b.hotels.findIndex((h) => h.checkIn && h.checkOut && h.checkIn <= iso && iso < h.checkOut) : -1

  const days: SiteDay[] = b.days.map((d, i) => {
    const overview = d.overview.trim() || autoOverview(d.spots)
    const hotel = hotelOf(d.date)
    return {
      n: i + 1,
      iso: d.date,
      date: shortDate(d.date),
      weekday: weekday(d.date),
      weekdayShort: short(d.date),
      route: overview ? overview.split(/\s*→\s*/).filter(Boolean) : [],
      departTime: shown('departTime', d.departTime),
      spots: d.spots.filter((s) => filled(s.name) || filled(s.content)).map((s) => ({ time: s.time, name: s.name.trim(), content: s.content.trim() })),
      color: colors[i],
      hotel: hotel >= 0 ? hotel : null,
    }
  })

  const title = shown('title', b.title) || DEFAULT_TITLE
  const range = dateRange([...b.flights.map((f) => f.date), ...b.days.map((d) => d.date)])

  return {
    title,
    dateRange: range,
    tripKey: hash(`${title}|${range}`),
    palette,
    onlyFlights: onlyFlights(b.flights),
    singleDay: b.days.length === 1,
    colors,
    flights: b.flights.map((f, i) => ({
      mode: f.mode,
      modeLabel: transportOf(f.mode).label,
      icon: transportOf(f.mode).icon,
      departWord: transportOf(f.mode).departWord,
      leg: flightLeg(i, b.flights.length),
      date: shortDate(f.date),
      weekday: weekday(f.date),
      weekdayShort: short(f.date),
      airline: shown('airline', f.airline),
      flightNo: shown('flightNo', f.flightNo),
      from: f.from.trim(),
      departTime: f.departTime,
      to: f.to.trim(),
      arriveTime: f.arriveTime,
    })),
    days,
    hotels: b.hotels.map((h, i) => ({
      name: h.name.trim(),
      address: h.address.trim(),
      phone: shown('hotelPhone', h.phone),
      city: shown('hotelCity', h.city),
      checkIn: stay ? shortDate(h.checkIn) : '',
      checkOut: stay ? shortDate(h.checkOut) : '',
      note: shown('hotelNote', h.note),
      nights: days.filter((d) => d.hotel === i).map((d) => d.n - 1),
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${h.address}`.trim())}`,
    })),
    foods: has('foods')
      ? b.foods
          .map((f) => ({
            place: f.place.trim(),
            items: f.items.filter((i) => filled(i.name)).map((i) => ({ name: i.name.trim(), description: i.description.trim() })),
          }))
          .filter((f) => f.items.length)
      : [],
    // 沒填內容的資訊（例如預設的氣候、時差、飲水）不顯示
    infos: has('infos')
      ? b.infos.filter((i) => filled(i.content)).map((i) => ({ title: i.title.trim(), content: i.content.trim() }))
      : [],
    checklist: has('checklist')
      ? b.checklist
          .map((g) => ({ name: g.name.trim(), items: g.items.filter((i) => filled(i.text)).map((i) => i.text.trim()) }))
          .filter((g) => g.items.length)
      : [],
  }
}
