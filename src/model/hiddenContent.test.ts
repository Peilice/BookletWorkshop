import { describe, expect, it } from 'vitest'
import type { TemplateRules } from './booklet'
import { emptyBooklet, newFlight, newHotel } from './defaults'
import { hiddenContent } from './hiddenContent'

const classic: TemplateRules = { formFields: ['airline', 'flightNo', 'hotelPhone', 'foods', 'infos', 'checklist'] }
const wafu: TemplateRules = { formFields: ['departTime', 'hotelCity', 'hotelStay', 'hotelNote'] }

describe('換範本後不會顯示的內容', () => {
  it('空白手冊沒有任何內容會被隱藏', () => {
    expect(hiddenContent(emptyBooklet(), wafu)).toEqual([])
    expect(hiddenContent(emptyBooklet(), classic)).toEqual([])
  })

  it('經典換成和風直排：列出航空公司、班機、電話、美食、旅遊資訊、清單，只算有填的筆數', () => {
    const b = emptyBooklet()
    b.flights = [
      { ...newFlight(), airline: '華航', flightNo: 'CI152' },
      { ...newFlight(), airline: '長榮' },
    ]
    b.hotels = [{ ...newHotel(), name: '大阪飯店', phone: '06-1234' }]
    b.foods = [{ place: '大阪', items: [] }]
    b.infos[0].content = '晴天'
    b.checklist = [
      { name: '證件', items: [{ text: '護照' }] },
      { name: '其它', items: [{ text: ' ' }] },
    ]
    expect(hiddenContent(b, wafu)).toEqual([
      { label: '交通的航空公司、業者', count: 2 },
      { label: '交通的班機、車次', count: 1 },
      { label: '住宿的電話', count: 1 },
      { label: '美食特產', count: 1 },
      { label: '旅遊資訊', count: 1 },
      { label: '行前清單', count: 1 },
    ])
  })

  it('和風直排換成經典：列出出門時間、城市、入住退房、住宿備註', () => {
    const b = emptyBooklet()
    b.days = [{ date: '', overview: '', departTime: '08:30', spots: [] }]
    b.hotels = [{ ...newHotel(), city: '高山', checkOut: '2026-12-02', note: '含早餐' }]
    expect(hiddenContent(b, classic)).toEqual([
      { label: '每日行程的出門時間', count: 1 },
      { label: '住宿的城市', count: 1 },
      { label: '住宿的入住、退房日期', count: 1 },
      { label: '住宿的備註', count: 1 },
    ])
  })
})
