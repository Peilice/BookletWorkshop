import { describe, expect, it } from 'vitest'
import { daysFromTrip, nextFlight, nextHotel, tripRange } from './autofill'
import { emptyBooklet, newDay, newFlight, newHotel } from './defaults'
import { osakaKyoto } from './sample'

describe('nextFlight', () => {
  it('第一筆帶入行程第一天的日期', () => {
    const b = { ...emptyBooklet(), days: [{ ...newDay(), date: '2026-12-01' }] }
    expect(nextFlight(b)).toEqual({ ...newFlight(), date: '2026-12-01' })
  })

  it('來回：回程是去程反過來，日期是行程最後一天', () => {
    const b = { ...osakaKyoto, flights: osakaKyoto.flights.slice(0, 1) }
    expect(nextFlight(b)).toEqual({
      ...newFlight(),
      airline: '中華航空',
      from: '大阪關西',
      to: '高雄',
      date: '2026-12-04',
    })
  })

  it('多段：接著上一筆的抵達地，沿用交通方式；沒有行程時沿用上一筆的日期', () => {
    const b = {
      ...emptyBooklet(),
      flights: [
        { ...newFlight(), date: '2026-12-01', from: '高雄', to: '東京' },
        { ...newFlight(), mode: 'hsr' as const, date: '2026-12-03', from: '東京', to: '大阪' },
      ],
    }
    expect(nextFlight(b)).toMatchObject({ mode: 'hsr', from: '大阪', to: '高雄', date: '2026-12-03' })
  })
})

describe('nextHotel', () => {
  it('第一間帶入旅程第一天，之後接著上一間的退房日期', () => {
    expect(nextHotel(osakaKyoto)).toEqual({ ...newHotel(), checkIn: osakaKyoto.hotels.at(-1)!.checkOut })
    expect(nextHotel({ ...osakaKyoto, hotels: [] })).toEqual({ ...newHotel(), checkIn: '2026-12-01' })
    expect(nextHotel(emptyBooklet())).toEqual(newHotel())
  })
})

describe('daysFromTrip', () => {
  it('從交通、住宿最早的日期排到最晚的日期', () => {
    expect(tripRange(osakaKyoto)).toEqual({ start: '2026-12-01', end: '2026-12-04' })
    expect(daysFromTrip(osakaKyoto).map((d) => d.date)).toEqual(['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04'])
  })

  it('沒有日期或日期太長（多半是打錯）時不建立', () => {
    expect(daysFromTrip(emptyBooklet())).toEqual([])
    const typo = { ...emptyBooklet(), flights: [{ ...newFlight(), date: '2026-12-01' }, { ...newFlight(), date: '2027-12-04' }] }
    expect(daysFromTrip(typo)).toEqual([])
  })
})
