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
  theme: string // 只有部分範本用到（見 FormField）
  departTime: string // HH:mm，只有部分範本用到
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
  city: string // 以下只有部分範本用到（見 FormField）
  checkIn: string // YYYY-MM-DD
  checkOut: string
}

export interface InfoItem {
  title: string
  content: string
}

// 行前清單：分類和項目都由使用者在畫面上增刪，手冊照這裡的內容產生
export interface ChecklistItem {
  text: string
}

export interface ChecklistGroup {
  name: string
  items: ChecklistItem[]
}

export interface Booklet {
  title: string // 手冊名稱，只有網站範本用到（見 FormField）
  flights: Flight[]
  days: Day[]
  foods: FoodPlace[]
  hotels: Hotel[]
  hotelNote: string // 住宿備註，只有部分範本用到
  infos: InfoItem[]
  checklist: ChecklistGroup[]
}

// 範本設定檔（public/templates/*.json）
export interface TemplateManifest {
  id: string
  name: string
  site?: string // 網站範本（src/site/templates）；沒有時不能產生網站和 PDF
  description: string
  colorRoles: { label: string; slots: AccentSlot[] }[]
  // 深色底上放白字的位置，顏色太淺時提醒（規格書 4.4、Q12）
  contrastChecks: { slot: AccentSlot; where: string }[]
  // 這份範本用到的選填欄位；表單只顯示這些，其他欄位一律顯示
  formFields: FormField[]
  // 有顯示但可以不填的欄位：產生前不提醒
  optionalFields?: FormField[]
  // 每日行程總覽、景點內容的字數上限，超過時產生前提醒；沒有設定就不檢查
  overviewLimit?: number
  spotContentLimit?: number
  presets: { name: string; colors: PaletteColors }[]
}

// 不是每份範本都有的欄位。分頁（美食特產、旅遊資訊、行前清單）也算在內，範本沒用到就整頁隱藏
export type FormField =
  | 'title' // 手冊名稱
  | 'airline' // 航班：航空公司
  | 'flightNo' // 航班：班機
  | 'dayTheme' // 每日行程：主題
  | 'departTime' // 每日行程：出門時間
  | 'hotelPhone' // 飯店：電話
  | 'hotelCity' // 飯店：城市
  | 'hotelStay' // 飯店：入住、退房日期
  | 'hotelNote' // 飯店：住宿備註
  | 'foods'
  | 'infos'
  | 'checklist'

// 表單和產生前檢查會用到的範本設定
export type TemplateRules = Pick<TemplateManifest, 'formFields' | 'optionalFields' | 'overviewLimit' | 'spotContentLimit'>

export type AccentSlot = 'accent1' | 'accent2' | 'accent3' | 'accent4' | 'accent5' | 'accent6'

// 一組配色：6 個強調色必填；文字 2（dk2）、背景 2（lt2）選填，沒有時沿用範本原本的顏色（規格書 7.1、Q13）
export type PaletteColors = Record<AccentSlot, string> & { dk2?: string; lt2?: string }

// 產生網站時的選項，也一起記在存檔裡（規格書 4.2）
export interface Settings {
  templateId: string
  palette: PaletteColors | null // null：用範本的第一組預設配色
}
