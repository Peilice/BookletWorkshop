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

// 表單下拉選單顯示的分類名稱（和範本檢查清單的標題一致）
export const CHECKLIST_CATEGORIES: { key: ChecklistCategory; label: string }[] = [
  { key: '證件', label: '重要必備證件資料' },
  { key: '衣物', label: '衣物&用品' },
  { key: '藥品', label: '常備藥品' },
  { key: '其它', label: '其它' },
]

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
  // 深色底上放白字的位置，顏色太淺時提醒（規格書 4.4、Q12）
  contrastChecks: { slot: AccentSlot; where: string }[]
  fontRoles: { label: string; style: string; default: string }[]
  checklistSlots: Record<ChecklistCategory, number>
  presets: { name: string; colors: Record<AccentSlot, string> }[]
}

export type AccentSlot = 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6'

// 產生 Word 時的選項，也一起記在存檔裡（規格書 4.2）
export interface Settings {
  templateId: string
  palette: Record<AccentSlot, string> | null // null：用範本的第一組預設配色
  fonts: Record<string, string> // 樣式名稱 → 字體；沒有列出的用範本預設字體
}
