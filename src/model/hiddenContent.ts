// 換範本時，哪些已經填好的內容在新範本不會顯示、也不會印出來（資料仍保留在存檔裡，換回來就會再出現）

import type { Booklet, FormField, TemplateRules } from './booklet'
import { isUntouchedChecklist, isUntouchedInfo } from './defaults'

export interface HiddenContent {
  label: string
  count: number // 有填內容的筆數
}

const filled = (s: string) => s.trim() !== ''

const COUNTERS: { field: FormField; label: string; count: (b: Booklet) => number }[] = [
  { field: 'title', label: '手冊名稱', count: (b) => (filled(b.title) ? 1 : 0) },
  { field: 'airline', label: '交通的航空公司、業者', count: (b) => b.flights.filter((f) => filled(f.airline)).length },
  { field: 'flightNo', label: '交通的班機、車次', count: (b) => b.flights.filter((f) => filled(f.flightNo)).length },
  { field: 'dayTheme', label: '每日行程的主題', count: (b) => b.days.filter((d) => filled(d.theme)).length },
  { field: 'departTime', label: '每日行程的出門時間', count: (b) => b.days.filter((d) => filled(d.departTime)).length },
  { field: 'hotelPhone', label: '住宿的電話', count: (b) => b.hotels.filter((h) => filled(h.phone)).length },
  { field: 'hotelCity', label: '住宿的城市', count: (b) => b.hotels.filter((h) => filled(h.city)).length },
  {
    field: 'hotelStay',
    label: '住宿的入住、退房日期',
    count: (b) => b.hotels.filter((h) => filled(h.checkIn) || filled(h.checkOut)).length,
  },
  { field: 'hotelNote', label: '住宿的備註', count: (b) => b.hotels.filter((h) => filled(h.note)).length },
  {
    field: 'foods',
    label: '美食特產',
    count: (b) =>
      b.foods.filter((f) => filled(f.place) || f.items.some((i) => filled(i.name) || filled(i.description))).length,
  },
  // 預設的項目（氣候、時差、飲水沒填內容、行李規定沒改過）不算
  { field: 'infos', label: '旅遊資訊', count: (b) => b.infos.filter((i) => !isUntouchedInfo(i)).length },
  // 行前清單沒動過時不算
  {
    field: 'checklist',
    label: '行前清單',
    count: (b) => (isUntouchedChecklist(b.checklist) ? 0 : b.checklist.flatMap((g) => g.items).filter((i) => filled(i.text)).length),
  },
]

export function hiddenContent(booklet: Booklet, rules: TemplateRules): HiddenContent[] {
  return COUNTERS.filter((c) => !rules.formFields.includes(c.field))
    .map((c) => ({ label: c.label, count: c.count(booklet) }))
    .filter((c) => c.count > 0)
}
