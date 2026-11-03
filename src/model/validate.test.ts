import { describe, expect, it } from 'vitest'
import { emptyBooklet, newDay, newFlight, newFoodPlace, newHotel } from './defaults'
import { osakaKyoto } from './sample'
import { validateBooklet } from './validate'
import type { TemplateRules } from './booklet'

describe('validateBooklet', () => {
  it('範例資料沒有問題', () => {
    expect(validateBooklet(osakaKyoto)).toEqual([])
  })

  it('完全沒有內容時提醒', () => {
    const issues = validateBooklet(emptyBooklet())
    expect(issues.map((i) => i.text)).toContainEqual(expect.stringContaining('手冊還沒有交通'))
  })

  it('列出交通空白的欄位', () => {
    const b = { ...emptyBooklet(), flights: [{ ...newFlight(), airline: '中華航空', from: '高雄', to: '大阪' }] }
    expect(validateBooklet(b)).toContainEqual({ tab: 'flights', text: '交通 1：沒有填日期、班機、起飛時間、抵達時間' })
  })

  it('交通方式決定欄位名稱和要提醒的欄位：高鐵要車次不用業者，自駕連時間都不提醒', () => {
    const b = {
      ...emptyBooklet(),
      flights: [
        { ...newFlight(), mode: 'hsr' as const, date: '2026-12-01', from: '左營', to: '台北' },
        { ...newFlight(), mode: 'car' as const, date: '2026-12-01', from: '台北' },
        { ...newFlight(), mode: 'bus' as const, date: '2026-12-01', from: '台北', to: '宜蘭', departTime: '08:00', arriveTime: '09:10' },
      ],
    }
    expect(validateBooklet(b).filter((i) => i.tab === 'flights').map((i) => i.text)).toEqual([
      '交通 1：沒有填車次、出發時間、抵達時間',
      '交通 2：沒有填目的地',
    ])
  })

  it('行程：日期、景點名稱空白', () => {
    const b = { ...emptyBooklet(), days: [newDay()] }
    const days = validateBooklet(b).filter((i) => i.tab === 'days')
    expect(days.map((i) => i.text)).toEqual(['Day 1：沒有填日期', 'Day 1 景點 1：沒有填景點名稱'])
  })

  it('行程總覽太長', () => {
    const day = { ...newDay(), date: '2026-12-01', overview: '很'.repeat(41), spots: [{ time: '', name: '景點', content: '' }] }
    const issues = validateBooklet({ ...osakaKyoto, days: [day] })
    expect(issues).toEqual([{ tab: 'days', text: expect.stringContaining('41 個字') }])
  })

  it('美食地點、住宿空白', () => {
    const b = { ...emptyBooklet(), foods: [newFoodPlace()], hotels: [newHotel()] }
    const texts = validateBooklet(b).map((i) => i.text)
    expect(texts).toContain('地點 1：沒有填地點名稱')
    expect(texts).toContain('地點 1 第 1 項：沒有填名稱')
    expect(texts).toContain('住宿 1：沒有填住宿名稱、地址、電話')
  })

  it('旅遊資訊內容空白（新手冊預設的三項）', () => {
    const b = { ...osakaKyoto, infos: emptyBooklet().infos }
    expect(validateBooklet(b).map((i) => i.text)).toEqual(['氣候：沒有填內容', '時差：沒有填內容', '飲水：沒有填內容'])
  })

  describe('依範本設定檢查', () => {
    // 第二種範本：沒有航空公司、班機、飯店電話、美食、旅遊資訊、檢查清單；多了出門時間、城市、入住退房
    const wafu: TemplateRules = {
      formFields: ['departTime', 'hotelCity', 'hotelStay', 'hotelNote'],
      spotContentLimit: 160,
    }

    it('範本沒用到的欄位和分頁不檢查', () => {
      const b = {
        ...osakaKyoto,
        flights: [{ ...osakaKyoto.flights[0], airline: '', flightNo: '' }],
        foods: [newFoodPlace()],
        hotels: [{ ...newHotel(), name: '飯店', address: '地址', city: '高山', checkIn: '2026-11-26', checkOut: '2026-11-29' }],
        infos: emptyBooklet().infos,
        checklist: [{ name: '常備藥品', items: [{ text: '' }] }],
      }
      expect(validateBooklet(b, wafu)).toEqual([])
    })

    it('範本用到的新欄位空白時提醒', () => {
      const b = { ...emptyBooklet(), days: [{ ...newDay(), date: '2026-11-26', spots: [{ time: '', name: '景點', content: '' }] }], hotels: [newHotel()] }
      expect(validateBooklet(b, wafu).map((i) => i.text)).toEqual([
        '住宿 1：沒有填住宿名稱、城市、地址、入住日期、退房日期',
      ])
    })

    it('沒有內容時，提醒文字不提到範本沒有的部分', () => {
      expect(validateBooklet(emptyBooklet(), wafu).map((i) => i.text)).toEqual([
        '手冊還沒有交通、行程或住宿，產生的手冊會是空白的。',
      ])
    })

    it('景點內容超過字數上限時提醒（不算頭尾空白和換行）', () => {
      const day = (spots: { time: '', name: string; content: string }[]) => ({ ...newDay(), date: '2026-11-27', spots })
      const b = {
        ...emptyBooklet(),
        days: [
          day([
            { time: '', name: '宮川朝市', content: '很'.repeat(160) },
            { time: '', name: '高山三町老街', content: `${'很'.repeat(80)}\n${'很'.repeat(80)}\n` },
          ]),
          day([{ time: '', name: '新穗高纜車', content: '很'.repeat(161) }]),
        ],
      }
      expect(validateBooklet(b, wafu)).toEqual([{ tab: 'days', text: '新穗高纜車：內容有 161 個字，超過 160 字會接到下一頁' }])
    })

    it('範本沒有字數上限時不檢查', () => {
      const day = { ...osakaKyoto.days[0], overview: '很'.repeat(41), spots: [{ time: '', name: '景點', content: '很'.repeat(500) }] }
      expect(validateBooklet({ ...osakaKyoto, days: [day] }, { formFields: [] })).toEqual([])
    })
  })

  it('檢查清單的空白項目', () => {
    const b = { ...osakaKyoto, checklist: [{ name: '常備藥品', items: [{ text: ' ' }] }] }
    const rules: TemplateRules = { formFields: ['airline', 'flightNo', 'hotelPhone', 'foods', 'infos', 'checklist'] }
    expect(validateBooklet(b, rules)).toEqual([{ tab: 'checklist', text: '常備藥品：有 1 個空白項目，不會出現在手冊上' }])
  })
})
