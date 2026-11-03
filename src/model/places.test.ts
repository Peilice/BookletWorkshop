import { describe, expect, it } from 'vitest'
import { newFlight } from './defaults'
import { airlineOf, airportName, airportsOf, flightOffset, knownPlaces, timeDifferenceText } from './places'
import { osakaKyoto } from './sample'

describe('places', () => {
  it('地名對到機場：代碼、名稱、別名、只寫城市', () => {
    expect(airportsOf('kix').map((p) => p.code)).toEqual(['KIX'])
    expect(airportsOf('高雄').map((p) => p.code)).toEqual(['KHH'])
    expect(airportsOf('成田').map((p) => p.code)).toEqual(['NRT'])
    expect(airportsOf('東京').map((p) => p.code)).toEqual(['NRT', 'HND'])
    expect(airportsOf('松山').map((p) => p.code)).toEqual(['TSA'])
    expect(airportsOf('火星')).toEqual([])
  })

  it('輸入機場代碼時換成名稱', () => {
    expect(airportName('KIX')).toBe('大阪關西')
    expect(airportName('大阪')).toBe('大阪')
  })

  it('班機代碼帶出航空公司', () => {
    expect(airlineOf('CI152')).toBe('中華航空')
    expect(airlineOf('7c 1234')).toBe('濟州航空')
    expect(airlineOf('XX1')).toBe('')
    expect(airlineOf('')).toBe('')
  })

  it('兩地時差：跟著日光節約時間變，對不到機場時算不出來', () => {
    const f = (from: string, to: string, date: string) => ({ ...newFlight(), from, to, date })
    expect(flightOffset(f('高雄', '大阪關西', '2026-12-01'))).toBe(60)
    expect(flightOffset(f('東京', '高雄', '2026-12-01'))).toBe(-60)
    expect(flightOffset(f('台北桃園', '洛杉磯', '2026-12-01'))).toBe(-16 * 60)
    expect(flightOffset(f('台北桃園', '洛杉磯', '2026-07-01'))).toBe(-15 * 60)
    expect(flightOffset(f('高雄', '某個小機場', '2026-12-01'))).toBeNull()
  })

  it('旅遊資訊的時差建議', () => {
    expect(timeDifferenceText(osakaKyoto.flights)).toBe('日本比台灣快 1 小時')
    expect(timeDifferenceText([{ ...newFlight(), from: '台北', to: '香港' }])).toBe('香港和台灣沒有時差')
    expect(timeDifferenceText([{ ...newFlight(), mode: 'hsr', from: '台北', to: '左營' }])).toBe('')
  })

  it('手冊裡打過的地名，不重複', () => {
    expect(knownPlaces(osakaKyoto)).toEqual(['高雄', '大阪關西', '大阪', '京都'])
  })
})
