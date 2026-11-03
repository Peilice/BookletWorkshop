import { describe, expect, it } from 'vitest'
import { chineseDay, flightLeg, shortDate, weekday } from './dates'

describe('日期', () => {
  it('縮成 月/日', () => {
    expect(shortDate('2026-12-01')).toBe('12/1')
    expect(shortDate('')).toBe('')
  })

  it('算出星期', () => {
    expect(weekday('2026-12-01')).toBe('星期二')
    expect(weekday('2026-12-06')).toBe('星期日')
  })

  it('中文天數', () => {
    expect([1, 2, 10, 11, 20, 23].map(chineseDay)).toEqual(['第一天', '第二天', '第十天', '第十一天', '第二十天', '第二十三天'])
  })

  it('航班標出去程、回程，中間的航班不標', () => {
    expect([0, 1].map((i) => flightLeg(i, 2))).toEqual(['去程', '回程'])
    expect([0, 1, 2].map((i) => flightLeg(i, 3))).toEqual(['去程', '', '回程'])
    expect(flightLeg(0, 1)).toBe('去程')
  })
})
