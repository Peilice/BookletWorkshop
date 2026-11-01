// 存檔（.json）的資料結構：使用者在表單上填的內容

export interface Flight {
  date: string // YYYY-MM-DD
  airline: string
  flightNo: string
  from: string
  departTime: string // HH:mm
  to: string
  arriveTime: string
}

export interface Spot {
  name: string
  content: string
}

export interface Day {
  date: string
  overview: string // 選填，空白時自動用景點串起來
  spots: Spot[]
}

export interface FoodItem {
  name: string
  description: string
}

export interface FoodPlace {
  place: string
  items: FoodItem[]
}

export interface Hotel {
  name: string
  address: string
  phone: string
}

export interface InfoItem {
  title: string
  content: string
}

export type ChecklistCategory = '證件' | '衣物' | '藥品' | '其它'

export interface ChecklistItem {
  category: ChecklistCategory
  item: string
}

export interface Booklet {
  flights: Flight[]
  days: Day[]
  foods: FoodPlace[]
  hotels: Hotel[]
  infos: InfoItem[]
  checklist: ChecklistItem[]
}

// 範本設定檔（public/templates/*.json）
export interface TemplateManifest {
  id: string
  name: string
  file: string
  description: string
  colorRoles: { label: string; slots: AccentSlot[] }[]
  fontRoles: { label: string; style: string; default: string }[]
  checklistSlots: Record<ChecklistCategory, number>
  presets: { name: string; colors: Record<AccentSlot, string> }[]
}

export type AccentSlot = 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6'
