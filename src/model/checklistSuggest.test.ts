import { describe, expect, it } from 'vitest'
import type { ChecklistGroup } from './booklet'
import { addSuggestion, suggestChecklist } from './checklistSuggest'
import { emptyBooklet, newFlight } from './defaults'
import { osakaKyoto } from './sample'

const texts = (b: Parameters<typeof suggestChecklist>[0]) => suggestChecklist(b).map((s) => s.text)

describe('suggestChecklist', () => {
  it('出國：看目的地建議外幣，插座一樣的國家不建議轉接插頭；清單裡已經有的不建議', () => {
    // 範例的清單已經有行動電源
    expect(texts(osakaKyoto)).toEqual(['護照', '旅平險保單', '日幣', '網卡/eSIM'])
    const bangkok = { ...emptyBooklet(), flights: [{ ...newFlight(), from: '台北', to: 'BKK' }] }
    expect(texts(bangkok)).toEqual(['旅平險保單', '泰銖', '轉接插頭', '網卡/eSIM'])
  })

  it('自駕：國內只建議駕照，日本另外要譯本', () => {
    const car = { ...newFlight(), mode: 'car' as const }
    expect(texts({ ...emptyBooklet('domestic'), flights: [car] })).toEqual([])
    expect(texts({ ...emptyBooklet('domestic'), checklist: [], flights: [car] })).toEqual(['駕照'])
    const japanCar = { ...emptyBooklet(), flights: [{ ...newFlight(), from: '高雄', to: '沖繩那霸' }, car] }
    expect(texts(japanCar)).toContain('駕照日文譯本')
  })

  it('搭船建議暈船藥（清單裡有暈車藥就不建議）', () => {
    const ship = { ...newFlight(), mode: 'ship' as const }
    expect(texts({ ...emptyBooklet('dayTrip'), flights: [ship] })).toEqual(['暈船藥'])
    expect(texts({ ...emptyBooklet('domestic'), flights: [ship] })).toEqual([])
  })

  it('加進清單：證件、錢放第一個分類，其他放最後一個；沒有分類時先開一個', () => {
    const list: ChecklistGroup[] = [
      { name: '證件', items: [] },
      { name: '其它', items: [] },
    ]
    const [, insurance, , sim] = suggestChecklist(osakaKyoto)
    addSuggestion(list, insurance)
    addSuggestion(list, sim)
    expect(list.map((g) => g.items.map((i) => i.text))).toEqual([['旅平險保單'], ['網卡/eSIM']])
    const empty: typeof list = []
    addSuggestion(empty, sim)
    expect(empty).toEqual([{ name: '其它', items: [{ text: '網卡/eSIM' }] }])
  })
})
