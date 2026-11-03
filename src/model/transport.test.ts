import { describe, expect, it } from 'vitest'
import { arrivesNextDay, durationText, travelMinutes } from './transport'

describe('交通時長', () => {
  const ride = (departTime: string, arriveTime: string) => ({ mode: 'hsr' as const, departTime, arriveTime })

  it('抵達比出發早時當成隔天抵達', () => {
    expect(arrivesNextDay(ride('23:30', '04:10'))).toBe(true)
    expect(arrivesNextDay(ride('08:00', '09:45'))).toBe(false)
    expect(arrivesNextDay(ride('08:00', ''))).toBe(false)
  })

  it('算出花多久，跨日加一天；時間沒填齊或不知道時差時算不出來', () => {
    expect(travelMinutes(ride('08:00', '09:45'))).toBe(105)
    expect(travelMinutes(ride('23:30', '04:10'))).toBe(280)
    expect(travelMinutes(ride('08:00', ''))).toBeNull()
    expect(travelMinutes({ mode: 'plane', departTime: '08:00', arriveTime: '11:45' }, null)).toBeNull()
    // 大阪比高雄快 1 小時
    expect(travelMinutes({ mode: 'plane', departTime: '08:00', arriveTime: '11:45' }, 60)).toBe(165)
  })

  it('時長的文字', () => {
    expect(durationText(105)).toBe('1 小時 45 分')
    expect(durationText(45)).toBe('45 分')
    expect(durationText(120)).toBe('2 小時')
    expect(durationText(null)).toBe('')
  })
})
