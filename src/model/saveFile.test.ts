import { describe, expect, it } from 'vitest'
import { addDays, defaultSettings, emptyBooklet, newDay, TRIP_TYPES } from './defaults'
import { hiddenContent } from './hiddenContent'
import { isBlankBooklet } from '../site/preview'
import { bookletFileName } from './fileName'
import { osakaKyoto } from './sample'
import { createSaveFile, parseSaveFile, SAVE_FORMAT, SAVE_VERSION, SaveFileError } from './saveFile'

describe('存檔與讀檔', () => {
  it('存檔後讀回來，內容和設定完全恢復', () => {
    const settings = { templateId: 'classic', palette: null }
    const text = JSON.stringify(createSaveFile(osakaKyoto, settings))
    expect(parseSaveFile(text)).toEqual({ booklet: osakaKyoto, settings })
  })

  it('配色裡的文字 2、背景 2 也會存回來', () => {
    const palette = {
      accent1: '#111111', accent2: '#222222', accent3: '#333333',
      accent4: '#444444', accent5: '#555555', accent6: '#666666',
      dk2: '#123456', lt2: '#FEDCBA',
    }
    const settings = { templateId: 'classic', palette }
    expect(parseSaveFile(JSON.stringify(createSaveFile(emptyBooklet(), settings))).settings).toEqual(settings)
  })

  it('存檔記錄格式版本號', () => {
    expect(createSaveFile(emptyBooklet(), defaultSettings()).version).toBe(SAVE_VERSION)
  })

  it('不是 JSON 時給出看得懂的錯誤', () => {
    expect(() => parseSaveFile('hello')).toThrow(SaveFileError)
  })

  it('不是本網站的存檔時拒絕', () => {
    expect(() => parseSaveFile('{"foo": 1}')).toThrow('這不是旅遊手冊的存檔檔案')
  })

  it('較新版本的存檔要求重新整理網頁', () => {
    const text = JSON.stringify({ ...createSaveFile(emptyBooklet(), defaultSettings()), version: SAVE_VERSION + 1 })
    expect(() => parseSaveFile(text)).toThrow('較新版本')
  })

  it('缺少或型別錯誤的欄位補上預設值', () => {
    const text = JSON.stringify({
      format: 'booklet-workshop',
      version: 1,
      booklet: {
        flights: [{ airline: '長榮航空', date: 20261201 }],
        days: 'oops',
        checklist: [{ category: '不存在的分類', item: '轉接頭' }],
      },
      settings: { palette: { accent1: 'red' } },
    })
    const { booklet, settings } = parseSaveFile(text)
    expect(booklet.flights[0]).toMatchObject({ airline: '長榮航空', date: '', flightNo: '' })
    expect(booklet.days).toEqual([])
    expect(booklet.checklist).toEqual([{ name: '其它', items: [{ text: '轉接頭' }] }])
    expect(settings).toEqual(defaultSettings())
  })

  it('舊存檔沒有主題、城市、入住退房、備註時補上空白', () => {
    const text = JSON.stringify({
      format: 'booklet-workshop',
      version: 1,
      booklet: {
        days: [{ date: '2026-12-01', overview: '', spots: [] }],
        hotels: [{ name: '測試飯店', address: '地址', phone: '06' }],
      },
    })
    const { booklet } = parseSaveFile(text)
    expect(booklet.days[0]).toMatchObject({ theme: '', departTime: '' })
    expect(booklet.hotels[0]).toMatchObject({ city: '', checkIn: '', checkOut: '', note: '' })
  })

  it('第 2 版的共用住宿備註抄到每間飯店', () => {
    const text = JSON.stringify({
      format: 'booklet-workshop',
      version: 2,
      booklet: { hotels: [{ name: 'A' }, { name: 'B' }], hotelNote: '牙刷自備' },
    })
    const { booklet } = parseSaveFile(text)
    expect(booklet.hotels.map((h) => h.note)).toEqual(['牙刷自備', '牙刷自備'])
    expect('hotelNote' in booklet).toBe(false)
  })
})

describe('交通方式', () => {
  it('舊存檔的航班沒有交通方式，讀進來當成飛機；不認得的交通方式也當成飛機', () => {
    const old = { format: SAVE_FORMAT, version: 3, booklet: { flights: [{ date: '2026-12-01' }, { mode: 'rocket' }, { mode: 'hsr' }] } }
    expect(parseSaveFile(JSON.stringify(old)).booklet.flights.map((f) => f.mode)).toEqual(['plane', 'plane', 'hsr'])
  })
})

describe('景點時間', () => {
  it('舊存檔的景點沒有時間，讀進來補成空白', () => {
    const old = { format: SAVE_FORMAT, version: 4, booklet: { days: [{ spots: [{ name: '清水寺', content: '' }] }] } }
    expect(parseSaveFile(JSON.stringify(old)).booklet.days[0].spots[0]).toEqual({ time: '', name: '清水寺', content: '' })
  })
})

describe('旅行類型', () => {
  it('新手冊記下選的類型，存檔後讀回來不變', () => {
    const b = emptyBooklet('dayTrip')
    b.checklist = []
    expect(parseSaveFile(JSON.stringify(createSaveFile(b, defaultSettings()))).booklet.tripType).toBe('dayTrip')
  })

  it('舊存檔沒有類型：行前清單是某個類型的預設就當成那個類型，否則當成出國', () => {
    const old = (checklist: unknown) => JSON.stringify({ format: SAVE_FORMAT, version: 5, booklet: { checklist } })
    expect(parseSaveFile(old(emptyBooklet('dayTrip').checklist)).booklet.tripType).toBe('dayTrip')
    expect(parseSaveFile(old([])).booklet.tripType).toBe('abroad')
  })
})

describe('預設值', () => {
  it('新手冊的旅遊資訊預設有氣候、時差、飲水、行李規定', () => {
    expect(emptyBooklet().infos.map((i) => i.title)).toEqual(['氣候', '時差', '飲水', '行李規定'])
  })

  it('國內、一日遊的新手冊換成各自的旅遊資訊和行前清單，沒動過都不算使用者填的內容', () => {
    const domestic = emptyBooklet('domestic')
    expect(domestic.infos.map((i) => i.title)).toEqual(['天氣', '交通', '緊急聯絡'])
    expect(domestic.checklist[0].items.map((i) => i.text)).toContain('身分證')
    expect(domestic.checklist.flatMap((g) => g.items).some((i) => i.text === '護照')).toBe(false)
    expect(emptyBooklet('dayTrip').checklist.map((g) => g.name)).toEqual(['隨身', '用品'])
    for (const t of TRIP_TYPES) {
      expect(isBlankBooklet(emptyBooklet(t.id))).toBe(true)
      expect(hiddenContent(emptyBooklet(t.id), { formFields: [] })).toEqual([])
    }
  })

  it('新增的一天日期接在前一天後面（跨月）', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(newDay({ ...newDay(), date: '2026-12-31' }).date).toBe('2027-01-01')
    expect(newDay().date).toBe('')
  })
})

describe('檔名', () => {
  it('用第一筆航班的日期', () => {
    expect(bookletFileName(osakaKyoto, 'html')).toBe('旅遊手冊_20261201.html')
  })

  it('沒有航班時用 Day 1 的日期，都沒有時不加日期', () => {
    expect(bookletFileName({ ...osakaKyoto, flights: [] }, 'json')).toBe('旅遊手冊_20261201.json')
    expect(bookletFileName(emptyBooklet(), 'json')).toBe('旅遊手冊.json')
  })
})
