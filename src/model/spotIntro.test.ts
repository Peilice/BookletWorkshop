import { describe, expect, it } from 'vitest'
import { dayPlace, spotPrompt } from './spotIntro'
import { newFlight, newHotel } from './defaults'

const flights = [
  { ...newFlight(), date: '2026-12-01', from: '高雄', to: '大阪關西' },
  { ...newFlight(), date: '2026-12-04', from: '大阪關西', to: '高雄' },
]
const hotels = [
  { ...newHotel(), name: '難波飯店', city: '大阪', checkIn: '2026-12-01', checkOut: '2026-12-03' },
  { ...newHotel(), name: '四條飯店', checkIn: '2026-12-03', checkOut: '2026-12-04' },
]

describe('dayPlace', () => {
  it('當晚住的地方：有城市用城市，沒有用住宿名稱', () => {
    expect(dayPlace({ flights, hotels }, { date: '2026-12-02' })).toBe('大阪')
    expect(dayPlace({ flights, hotels }, { date: '2026-12-03' })).toBe('四條飯店')
  })

  it('沒有住宿時用當天或之前最後一段交通的抵達地', () => {
    expect(dayPlace({ flights, hotels: [] }, { date: '2026-12-02' })).toBe('大阪關西')
    expect(dayPlace({ flights, hotels }, { date: '2026-12-04' })).toBe('高雄')
  })

  it('推不出來時是空字串', () => {
    expect(dayPlace({ flights, hotels }, { date: '' })).toBe('')
    expect(dayPlace({ flights, hotels }, { date: '2026-11-30' })).toBe('')
  })
})

describe('spotPrompt', () => {
  it('帶入景點、地點、手冊名稱和字數上限', () => {
    const p = spotPrompt({ name: ' 伏見稻荷大社 ', place: '京都', title: '大阪・京都 四日遊', limit: 80 })
    expect(p).toContain('景點：伏見稻荷大社\n')
    expect(p).toContain('地點：京都')
    expect(p).toContain('這趟旅行：大阪・京都 四日遊')
    expect(p).toContain('80 字以內')
  })

  it('沒有地點、名稱、上限時省略那幾行，字數改成大約 100 字', () => {
    const p = spotPrompt({ name: '清水寺', place: '', title: '' })
    expect(p).not.toContain('地點')
    expect(p).not.toContain('這趟旅行')
    expect(p).toContain('100 字左右')
  })
})
