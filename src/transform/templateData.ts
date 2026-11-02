// 表單資料 → 範本資料。所有顯示邏輯都在這裡，範本只負責排版。

import type { Booklet, ChecklistCategory, TemplateManifest } from '../model/booklet'

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
const CATEGORIES: ChecklistCategory[] = ['證件', '衣物', '藥品', '其它']
const ROW_CELLS = 3

function parseDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

// 範本的日期欄很窄，只輸出 月/日
export function shortDate(iso: string): string {
  const d = parseDate(iso)
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : ''
}

export function weekday(iso: string): string {
  const d = parseDate(iso)
  return d ? WEEKDAYS[d.getDay()] : ''
}

export function toTemplateData(b: Booklet, manifest: TemplateManifest): Record<string, unknown> {
  const data: Record<string, unknown> = {
    有航班: b.flights.length > 0,
    航班: b.flights.map((f) => ({
      日期: shortDate(f.date),
      航空公司: f.airline,
      班機: f.flightNo,
      起飛地: f.from,
      起飛時間: f.departTime,
      抵達地: f.to,
      抵達時間: f.arriveTime,
    })),
    有行程: b.days.length > 0,
    每日行程: b.days.map((d, i) => ({
      天數: `Day ${i + 1}`,
      日期: shortDate(d.date),
      星期: weekday(d.date),
      每日行程總覽: d.overview.trim() || d.spots.map((s) => s.name).join(' → '),
      主題: d.theme,
      出門時間: d.departTime,
      景點: d.spots.map((s) => ({ 景點名稱: s.name, 景點內容: s.content })),
    })),
    有美食: b.foods.some((f) => f.items.length > 0),
    美食地點: b.foods
      .filter((f) => f.items.length > 0)
      .map((f) => ({ 地點: f.place, 美食: f.items.map((i) => ({ 名稱: i.name, 說明: i.description })) })),
    有飯店: b.hotels.length > 0,
    飯店: b.hotels.map((h) => ({
      飯店名稱: h.name,
      地址: h.address,
      電話: h.phone,
      城市: h.city,
      入住日期: shortDate(h.checkIn),
      退房日期: shortDate(h.checkOut),
    })),
    有住宿備註: b.hotelNote.trim() !== '',
    住宿備註: b.hotelNote.trim(),
    旅遊資訊: b.infos.map((i) => ({ 標題: i.title, 內容: i.content })),
  }

  // 檢查清單：先填空白格，不夠再加列；加列剩下的格子留空白 □
  for (const cat of CATEGORIES) {
    const items = b.checklist.filter((c) => c.category === cat).map((c) => c.item)
    const slots = manifest.checklistSlots[cat]
    for (let i = 1; i <= slots; i++) data[`${cat}空${i}`] = items[i - 1] ?? ''
    const rest = items.slice(slots)
    const rows = []
    for (let i = 0; i < rest.length; i += ROW_CELLS) {
      rows.push({ 第1格: rest[i] ?? '', 第2格: rest[i + 1] ?? '', 第3格: rest[i + 2] ?? '' })
    }
    data[`${cat}加列`] = rows
  }
  return data
}
