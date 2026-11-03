// 行前清單的建議項目：看交通方式和目的地，列出清單裡還沒有的東西。只列出來，按了才加進清單

import type { Booklet, ChecklistGroup } from './booklet'
import { newChecklistGroup } from './defaults'
import { airportsOf } from './places'

export interface ChecklistSuggestion {
  text: string
  reason: string // 為什麼建議，滑鼠移上去時顯示
  first: boolean // 證件、錢放第一個分類，其他放最後一個分類
  match: string[] // 清單裡已經有這些字時就不建議
}

const CURRENCY: Record<string, string> = {
  日本: '日幣', 韓國: '韓元', 香港: '港幣', 澳門: '澳門幣', 中國: '人民幣', 新加坡: '新加坡幣', 泰國: '泰銖', 越南: '越南盾',
  菲律賓: '披索', 馬來西亞: '令吉', 印尼: '印尼盾', 關島: '美金', 帛琉: '美金', 美國: '美金', 加拿大: '加幣', 英國: '英鎊',
  法國: '歐元', 德國: '歐元', 荷蘭: '歐元', 奧地利: '歐元', 義大利: '歐元', 捷克: '捷克克朗', 土耳其: '里拉', 阿聯: '迪拉姆',
  卡達: '里亞爾', 澳洲: '澳幣', 紐西蘭: '紐幣',
}

// 插座和台灣一樣（A 型），不用轉接插頭
const SAME_PLUG = new Set(['日本', '美國', '加拿大', '關島'])

/** 飛機抵達的國家（不含台灣）；地名對不到機場的不算 */
function destinations(b: Pick<Booklet, 'flights'>): string[] {
  const countries = b.flights
    .filter((f) => f.mode === 'plane')
    .map((f) => {
      const found = airportsOf(f.to)
      return found.length && found.every((p) => p.country === found[0].country) ? found[0].country : ''
    })
  return [...new Set(countries.filter((c) => c && c !== '台灣'))]
}

export function suggestChecklist(b: Pick<Booklet, 'tripType' | 'flights' | 'checklist'>): ChecklistSuggestion[] {
  const out: ChecklistSuggestion[] = []
  const add = (text: string, reason: string, first: boolean, match = [text]) => out.push({ text, reason, first, match })
  const modes = new Set(b.flights.map((f) => f.mode))
  const countries = destinations(b)
  const abroad = b.tripType === 'abroad' || countries.length > 0

  if (abroad) {
    add('護照', '出國', true)
    add('旅平險保單', '出國', true, ['旅平險', '保險'])
    for (const c of countries) if (CURRENCY[c]) add(CURRENCY[c], `去${c}`, true, [CURRENCY[c], ...(c === '日本' ? ['日圓'] : [])])
    if (countries.some((c) => !SAME_PLUG.has(c))) add('轉接插頭', `${countries.filter((c) => !SAME_PLUG.has(c)).join('、')}的插座和台灣不一樣`, false, ['轉接'])
    add('網卡/eSIM', '出國上網', false, ['網卡', 'eSIM', 'SIM', '網路', 'Wi-Fi', 'WiFi'])
  }
  if (modes.has('car')) {
    add('駕照', '自駕', true)
    if (countries.includes('日本')) add('駕照日文譯本', '在日本開車要帶', true, ['譯本'])
    else if (countries.length) add('國際駕照', '在國外開車要帶', true, ['國際駕照'])
  }
  if (modes.has('plane')) add('行動電源', '搭飛機只能放隨身行李', false)
  if (modes.has('ship')) add('暈船藥', '搭船', false, ['暈船', '暈車'])

  const items = b.checklist.flatMap((g) => g.items.map((i) => i.text.toLowerCase()))
  const seen = new Set<string>()
  return out.filter((s) => {
    if (seen.has(s.text)) return false
    seen.add(s.text)
    return !s.match.some((m) => items.some((i) => i.includes(m.toLowerCase())))
  })
}

/** 把建議項目加進清單：證件、錢放第一個分類，其他放最後一個；還沒有分類時先開一個 */
export function addSuggestion(list: ChecklistGroup[], s: ChecklistSuggestion): void {
  if (!list.length) list.push({ ...newChecklistGroup(), name: '其它', items: [] })
  const group = s.first ? list[0] : list[list.length - 1]
  group.items.push({ text: s.text })
}
