import { describe, expect, it } from 'vitest'
import { emptyBooklet, newDay } from './defaults'
import { allPhotos, fitSize, photoSize } from './photo'

describe('fitSize', () => {
  it('超過上限時等比例縮到最長邊剛好是上限', () => {
    expect(fitSize(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 })
    expect(fitSize(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 })
  })

  it('本來就比較小就不放大', () => {
    expect(fitSize(800, 600, 1000)).toEqual({ width: 800, height: 600 })
  })

  it('極扁的圖短邊至少 1px', () => {
    expect(fitSize(10000, 2, 1000)).toEqual({ width: 1000, height: 1 })
  })
})

describe('手冊裡的照片', () => {
  it('沒放照片時是空的', () => {
    const b = emptyBooklet()
    b.days.push(newDay())
    expect(allPhotos(b)).toEqual([])
    expect(photoSize(b)).toBe(0)
  })

  it('封面、封底、底圖、景點的照片都算進去', () => {
    const b = emptyBooklet()
    b.cover = 'aa'
    b.backCover = 'bbb'
    b.background = 'c'
    b.days.push(newDay())
    b.days[0].spots[0].photo = 'dddd'
    expect(allPhotos(b)).toHaveLength(4)
    expect(photoSize(b)).toBe(10)
  })
})
