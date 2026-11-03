// 新增手冊、新增一筆資料時的預設值

import type { Booklet, ChecklistGroup, ChecklistItem, Day, FoodItem, FoodPlace, Flight, Hotel, InfoItem, Settings, Spot, TemplateRules, TripType } from './booklet'

export type { TripType }

export const TRIP_TYPES: { id: TripType; label: string; note: string }[] = [
  { id: 'abroad', label: '出國', note: '搭飛機出國，要帶護照、注意時差和行李規定' },
  { id: 'domestic', label: '國內多日', note: '在台灣玩兩天以上，搭高鐵、火車或自己開車' },
  { id: 'dayTrip', label: '一日遊', note: '當天來回，不用住宿，只帶隨身物品' },
]

const blankInfos = (titles: string[]): InfoItem[] => titles.map((title) => ({ title, content: '' }))

// 旅遊資訊的預設標題；出國版是規格書 4.1 的三項再加行李規定
const TRIP_INFOS: Record<TripType, () => InfoItem[]> = {
  abroad: () => [...blankInfos(['氣候', '時差', '飲水']), newLuggageRules()],
  domestic: () => blankInfos(['天氣', '交通', '緊急聯絡']),
  dayTrip: () => blankInfos(['天氣', '集合地點']),
}

export function emptyBooklet(type: TripType = 'abroad'): Booklet {
  return {
    tripType: type,
    title: '',
    flights: [],
    days: [],
    foods: [],
    hotels: [],
    infos: TRIP_INFOS[type](),
    checklist: newChecklist(type),
  }
}

export function defaultSettings(): Settings {
  return { templateId: 'classic', palette: null }
}

// 範本設定檔還沒讀到（或讀不到）時，表單和檢查先照經典範本
export const FALLBACK_RULES: TemplateRules = {
  formFields: ['airline', 'flightNo', 'hotelPhone', 'foods', 'infos', 'checklist'],
  overviewLimit: 40,
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
  mode: 'plane',
  date: '',
  airline: '',
  flightNo: '',
  from: '',
  departTime: '',
  to: '',
  arriveTime: '',
})

export const newSpot = (): Spot => ({ time: '', name: '', content: '' })

/** 新的一天：日期接在前一天後面 */
export const newDay = (previous?: Day): Day => ({
  date: previous ? addDays(previous.date, 1) : '',
  overview: '',
  theme: '',
  departTime: '',
  spots: [newSpot()],
})

export const newFoodItem = (): FoodItem => ({ name: '', description: '' })
export const newFoodPlace = (): FoodPlace => ({ place: '', items: [newFoodItem()] })
export const newHotel = (): Hotel => ({ name: '', address: '', phone: '', city: '', checkIn: '', checkOut: '', note: '' })
export const newInfo = (): InfoItem => ({ title: '', content: '' })

// 旅遊資訊「行李規定」的預設內容（原本是範本裡印死的固定內容），一行一條
export const LUGGAGE_RULES: InfoItem = {
  title: '行李規定',
  content: ['手機、相機、MP3 和手提電腦等鋰電池要放在隨身攜帶行李', '刀具（含指甲刀）、超過 100ml 之液體，請放托運行李']
    .map((rule) => `＊${rule}`)
    .join('\n'),
}
export const newLuggageRules = (): InfoItem => ({ ...LUGGAGE_RULES })

/** 旅遊資訊還是預設的樣子（沒填內容，或行李規定沒改過），不算使用者填的內容 */
export const isUntouchedInfo = (i: InfoItem): boolean =>
  !i.content.trim() || (i.title === LUGGAGE_RULES.title && i.content === LUGGAGE_RULES.content)

// 行前清單的預設分類和項目（出國版原本是經典範本裡印死的固定項目），畫面上可以直接增刪
const TRIP_CHECKLIST: Record<TripType, [string, string[]][]> = {
  abroad: [
    ['重要必備證件資料', ['護照', '機票', '現金', '備用護照影本', '備用相片', '國際信用卡']],
    ['衣物&用品', ['換洗衣物', '毛巾(足湯)', '保養品', '防寒衣物', '貼身衣物', '面紙、濕紙巾', '牙刷/牙膏', '隨身包/背包', '軟式購物袋', '襪子', '輕便拖鞋/涼鞋', '生理用品', '睡衣褲', '水壺/保溫瓶', '防曬用品', '塑膠袋', '雨具']],
    ['常備藥品', ['習慣性用藥', '綠油精、萬金油', 'OK繃', '腸胃藥']],
    ['其它', ['手機', '充電器', '行動電源']],
  ],
  domestic: [
    ['證件與錢包', ['身分證', '健保卡', '駕照', '現金', '信用卡', '悠遊卡/一卡通']],
    ['衣物&用品', ['換洗衣物', '貼身衣物', '睡衣褲', '襪子', '薄外套', '牙刷/牙膏', '毛巾', '保養品', '防曬用品', '雨具', '輕便拖鞋/涼鞋', '面紙、濕紙巾', '水壺/保溫瓶', '生理用品', '塑膠袋']],
    ['常備藥品', ['習慣性用藥', '綠油精、萬金油', 'OK繃', '暈車藥']],
    ['其它', ['手機', '充電器', '行動電源']],
  ],
  dayTrip: [
    ['隨身', ['身分證', '悠遊卡/一卡通', '現金', '手機', '行動電源']],
    ['用品', ['水壺', '防曬用品', '雨具', '薄外套', '面紙、濕紙巾', '習慣性用藥']],
  ],
}

/** 選類型時的摘要：會放進哪些旅遊資訊、清單有幾項、前幾項是什麼 */
export function tripSummary(type: TripType) {
  const items = TRIP_CHECKLIST[type].flatMap(([, items]) => items)
  return { infos: TRIP_INFOS[type]().map((i) => i.title), count: items.length, sample: items.slice(0, 6) }
}

export const newChecklistItem = (): ChecklistItem => ({ text: '' })
export const newChecklistGroup = (): ChecklistGroup => ({ name: '', items: [newChecklistItem()] })

export const newChecklist = (type: TripType = 'abroad'): ChecklistGroup[] =>
  TRIP_CHECKLIST[type].map(([name, items]) => ({ name, items: items.map((text) => ({ text })) }))

/** 行前清單跟哪個類型的預設一模一樣（完全沒動過）；都不是時回傳 null */
export function presetTripType(list: ChecklistGroup[]): TripType | null {
  return TRIP_TYPES.find((t) => JSON.stringify(list) === JSON.stringify(newChecklist(t.id)))?.id ?? null
}

/** 行前清單還是某個類型預設的樣子，不算使用者填的內容 */
export const isUntouchedChecklist = (list: ChecklistGroup[]): boolean => presetTripType(list) !== null

/** 清單裡有沒有任何一個預設項目（舊存檔沒有時，表單提供按鈕補上出國版的清單） */
export function hasPresetChecklistItem(list: ChecklistGroup[]): boolean {
  const preset = new Set(Object.values(TRIP_CHECKLIST).flatMap((groups) => groups.flatMap(([, items]) => items)))
  return list.some((g) => g.items.some((i) => preset.has(i.text.trim())))
}

/** 補上預設清單：同名的分類把預設項目接在前面，沒有的分類加在最前面 */
export function mergePresetChecklist(list: ChecklistGroup[]): ChecklistGroup[] {
  const added = newChecklist().filter((p) => {
    const same = list.find((g) => g.name.trim() === p.name)
    if (same) same.items.unshift(...p.items)
    return !same
  })
  return [...added, ...list]
}
