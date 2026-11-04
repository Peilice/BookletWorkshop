// 存檔（.json）的格式、讀檔檢查與版本升級（規格書 4.2）

import type { AccentSlot, Booklet, PaletteColors, Settings } from './booklet'
import { defaultSettings, presetTripType, TRIP_TYPES } from './defaults'
import { safePhoto } from './photo'
import { isTransportMode } from './transport'

export const SAVE_FORMAT = 'booklet-workshop'
export const SAVE_VERSION = 7

export interface SaveFile {
  format: typeof SAVE_FORMAT
  version: number
  savedAt: string // ISO 時間
  booklet: Booklet
  settings: Settings
}

export class SaveFileError extends Error {}

export function createSaveFile(booklet: Booklet, settings: Settings): SaveFile {
  return { format: SAVE_FORMAT, version: SAVE_VERSION, savedAt: new Date().toISOString(), booklet, settings }
}

// ---------- 讀檔：不信任檔案內容，逐欄位取出並補上預設值 ----------

type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const photo = safePhoto
const list = <T>(v: unknown, map: (o: Obj) => T): T[] => (Array.isArray(v) ? v.filter(isObj).map(map) : [])

const ACCENTS: AccentSlot[] = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']

function normalizeBooklet(b: Obj): Booklet {
  const checklist = list(b.checklist, (g) => ({
    name: str(g.name),
    items: list(g.items, (i) => ({ text: str(i.text) })),
  }))
  return {
    tripType: TRIP_TYPES.find((t) => t.id === b.tripType)?.id ?? presetTripType(checklist) ?? 'abroad',
    title: str(b.title),
    cover: photo(b.cover),
    backCover: photo(b.backCover),
    background: photo(b.background),
    flights: list(b.flights, (f) => ({
      mode: isTransportMode(f.mode) ? f.mode : 'plane',
      date: str(f.date),
      airline: str(f.airline),
      flightNo: str(f.flightNo),
      from: str(f.from),
      departTime: str(f.departTime),
      to: str(f.to),
      arriveTime: str(f.arriveTime),
    })),
    days: list(b.days, (d) => ({
      date: str(d.date),
      overview: str(d.overview),
      departTime: str(d.departTime),
      spots: list(d.spots, (s) => ({ time: str(s.time), name: str(s.name), content: str(s.content), photo: photo(s.photo) })),
    })),
    foods: list(b.foods, (f) => ({
      place: str(f.place),
      items: list(f.items, (i) => ({ name: str(i.name), description: str(i.description) })),
    })),
    hotels: list(b.hotels, (h) => ({
      name: str(h.name),
      address: str(h.address),
      phone: str(h.phone),
      city: str(h.city),
      checkIn: str(h.checkIn),
      checkOut: str(h.checkOut),
      note: str(h.note),
    })),
    infos: list(b.infos, (i) => ({ title: str(i.title), content: str(i.content) })),
    checklist,
  }
}

function normalizeSettings(s: unknown): Settings {
  const result = defaultSettings()
  if (!isObj(s)) return result
  if (str(s.templateId)) result.templateId = str(s.templateId)
  const p = s.palette
  const isHex = (v: unknown) => /^#?[0-9a-fA-F]{6}$/.test(str(v))
  if (isObj(p) && ACCENTS.every((k) => isHex(p[k]))) {
    const palette = Object.fromEntries(ACCENTS.map((k) => [k, str(p[k])])) as PaletteColors
    for (const k of ['dk2', 'lt2'] as const) if (isHex(p[k])) palette[k] = str(p[k])
    result.palette = palette
  }
  return result
}

// 第 1 版的清單分類是固定的四類，代號對應的分類名稱
const V1_CATEGORIES: [string, string][] = [
  ['證件', '重要必備證件資料'],
  ['衣物', '衣物&用品'],
  ['藥品', '常備藥品'],
  ['其它', '其它'],
]

// 以後欄位改了，在這裡把舊版本的資料升級成新版本
function migrate(data: Obj, version: number): Obj {
  // 第 2 版：清單從「固定分類的項目」改成可以自訂的分類，每個分類各自有項目；不認得的分類放到「其它」
  if (version < 2 && isObj(data.booklet) && Array.isArray(data.booklet.checklist)) {
    const old = data.booklet.checklist.filter(isObj)
    const keyOf = (c: Obj) => (V1_CATEGORIES.some(([k]) => k === c.category) ? c.category : '其它')
    const checklist = V1_CATEGORIES.map(([key, name]) => ({
      name,
      items: old.filter((c) => keyOf(c) === key).map((c) => ({ text: str(c.item) })),
    })).filter((g) => g.items.length)
    data = { ...data, booklet: { ...data.booklet, checklist } }
  }
  // 第 3 版：住宿備註從全部飯店共用改成每間飯店各自一個；舊的共用備註抄到每間飯店
  if (version < 3 && isObj(data.booklet) && str(data.booklet.hotelNote).trim() && Array.isArray(data.booklet.hotels)) {
    const note = str(data.booklet.hotelNote)
    const hotels = data.booklet.hotels.map((h) => (isObj(h) ? { ...h, note } : h))
    data = { ...data, booklet: { ...data.booklet, hotels } }
  }
  // 第 4 版：航班改成交通，每筆多了交通方式；舊存檔沒有這個欄位，讀檔時一律當成飛機（normalizeBooklet）
  // 第 5 版：景點多了選填的時間；舊存檔沒有，讀檔時補成空白（normalizeBooklet）
  // 第 6 版：記下旅行類型；舊存檔沒有，行前清單還是某個類型預設的樣子就當成那個類型，否則當成出國（normalizeBooklet）
  // 第 7 版：多了選填的照片（封面、封底、底圖、每個景點一張）；舊存檔沒有，讀檔時補成空白（normalizeBooklet）
  return data
}

export function parseSaveFile(text: string): { booklet: Booklet; settings: Settings } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new SaveFileError('這不是有效的存檔檔案（內容無法解讀）。')
  }
  if (!isObj(data) || data.format !== SAVE_FORMAT) {
    throw new SaveFileError('這不是旅遊手冊的存檔檔案。')
  }
  const version = typeof data.version === 'number' ? data.version : 0
  if (version > SAVE_VERSION) {
    throw new SaveFileError('這個存檔是用較新版本的網站存的，請重新整理網頁後再試一次。')
  }
  const migrated = migrate(data, version)
  if (!isObj(migrated.booklet)) throw new SaveFileError('存檔裡沒有手冊內容。')
  return { booklet: normalizeBooklet(migrated.booklet), settings: normalizeSettings(migrated.settings) }
}
