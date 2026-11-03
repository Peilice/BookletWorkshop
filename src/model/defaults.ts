// 新增手冊、新增一筆資料時的預設值

import type { Booklet, ChecklistGroup, ChecklistItem, Day, FoodItem, FoodPlace, Flight, Hotel, InfoItem, Settings, Spot, TemplateRules } from './booklet'

export function emptyBooklet(): Booklet {
  return {
    title: '',
    flights: [],
    days: [],
    foods: [],
    hotels: [],
    // 旅遊資訊預設先放這三項（規格書 4.1），再加行李規定
    infos: [...['氣候', '時差', '飲水'].map((title) => ({ title, content: '' })), newLuggageRules()],
    checklist: newChecklist(),
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

// 行前清單的預設分類和項目（原本是經典範本裡印死的固定項目），畫面上可以直接增刪
const DEFAULT_CHECKLIST: [string, string[]][] = [
  ['重要必備證件資料', ['護照', '機票', '現金', '備用護照影本', '備用相片', '國際信用卡']],
  ['衣物&用品', ['換洗衣物', '毛巾(足湯)', '保養品', '防寒衣物', '貼身衣物', '面紙、濕紙巾', '牙刷/牙膏', '隨身包/背包', '軟式購物袋', '襪子', '輕便拖鞋/涼鞋', '生理用品', '睡衣褲', '水壺/保溫瓶', '防曬用品', '塑膠袋', '雨具']],
  ['常備藥品', ['習慣性用藥', '綠油精、萬金油', 'OK繃', '腸胃藥']],
  ['其它', ['手機', '充電器', '行動電源']],
]

export const newChecklistItem = (): ChecklistItem => ({ text: '' })
export const newChecklistGroup = (): ChecklistGroup => ({ name: '', items: [newChecklistItem()] })

export const newChecklist = (): ChecklistGroup[] =>
  DEFAULT_CHECKLIST.map(([name, items]) => ({ name, items: items.map((text) => ({ text })) }))

/** 行前清單還是預設的樣子（完全沒動過），不算使用者填的內容 */
export const isUntouchedChecklist = (list: ChecklistGroup[]): boolean =>
  JSON.stringify(list) === JSON.stringify(newChecklist())

/** 清單裡有沒有任何一個預設項目（舊存檔沒有時，表單提供按鈕補上） */
export function hasPresetChecklistItem(list: ChecklistGroup[]): boolean {
  const preset = new Set(DEFAULT_CHECKLIST.flatMap(([, items]) => items))
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
