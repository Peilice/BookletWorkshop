// 存檔（.json）的格式、讀檔檢查與版本升級（規格書 4.2）

import type { AccentSlot, Booklet, ChecklistCategory, PaletteColors, Settings } from './booklet'
import { CHECKLIST_CATEGORIES } from './booklet'
import { defaultSettings } from './defaults'

export const SAVE_FORMAT = 'booklet-workshop'
export const SAVE_VERSION = 1

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
const list = <T>(v: unknown, map: (o: Obj) => T): T[] => (Array.isArray(v) ? v.filter(isObj).map(map) : [])

const ACCENTS: AccentSlot[] = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']
const CATEGORY_KEYS = CHECKLIST_CATEGORIES.map((c) => c.key)

function normalizeBooklet(b: Obj): Booklet {
  return {
    flights: list(b.flights, (f) => ({
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
      spots: list(d.spots, (s) => ({ name: str(s.name), content: str(s.content) })),
    })),
    foods: list(b.foods, (f) => ({
      place: str(f.place),
      items: list(f.items, (i) => ({ name: str(i.name), description: str(i.description) })),
    })),
    hotels: list(b.hotels, (h) => ({ name: str(h.name), address: str(h.address), phone: str(h.phone) })),
    infos: list(b.infos, (i) => ({ title: str(i.title), content: str(i.content) })),
    checklist: list(b.checklist, (c) => ({
      category: (CATEGORY_KEYS.includes(c.category as ChecklistCategory) ? c.category : '其它') as ChecklistCategory,
      item: str(c.item),
    })),
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
  if (isObj(s.fonts)) {
    result.fonts = Object.fromEntries(Object.entries(s.fonts).filter(([, v]) => typeof v === 'string')) as Record<
      string,
      string
    >
  }
  return result
}

// 以後欄位改了，在這裡把舊版本的資料升級成新版本（例如 if (version < 2) { ... }）
function migrate(data: Obj, _version: number): Obj {
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
