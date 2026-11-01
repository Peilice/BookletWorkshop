import { describe, expect, it } from 'vitest'
import { addDays, defaultSettings, emptyBooklet, newDay } from './defaults'
import { bookletFileName } from './fileName'
import { osakaKyoto } from './sample'
import { createSaveFile, parseSaveFile, SAVE_VERSION, SaveFileError } from './saveFile'

describe('存檔與讀檔', () => {
  it('存檔後讀回來，內容和設定完全恢復', () => {
    const settings = { templateId: 'classic', palette: null, fonts: { 'BW-內文': '華康圓緣體W4' } }
    const text = JSON.stringify(createSaveFile(osakaKyoto, settings))
    expect(parseSaveFile(text)).toEqual({ booklet: osakaKyoto, settings })
  })

  it('配色裡的文字 2、背景 2 也會存回來', () => {
    const palette = {
      accent1: '#111111', accent2: '#222222', accent3: '#333333',
      accent4: '#444444', accent5: '#555555', accent6: '#666666',
      dk2: '#123456', lt2: '#FEDCBA',
    }
    const settings = { templateId: 'classic', palette, fonts: {} }
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
    expect(booklet.checklist).toEqual([{ category: '其它', item: '轉接頭' }])
    expect(settings).toEqual(defaultSettings())
  })
})

describe('預設值', () => {
  it('新手冊的旅遊資訊預設有氣候、時差、飲水', () => {
    expect(emptyBooklet().infos.map((i) => i.title)).toEqual(['氣候', '時差', '飲水'])
  })

  it('新增的一天日期接在前一天後面（跨月）', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(newDay({ date: '2026-12-31', overview: '', spots: [] }).date).toBe('2027-01-01')
    expect(newDay().date).toBe('')
  })
})

describe('檔名', () => {
  it('用第一筆航班的日期', () => {
    expect(bookletFileName(osakaKyoto, 'docx')).toBe('旅遊手冊_20261201.docx')
  })

  it('沒有航班時用 Day 1 的日期，都沒有時不加日期', () => {
    expect(bookletFileName({ ...osakaKyoto, flights: [] }, 'json')).toBe('旅遊手冊_20261201.json')
    expect(bookletFileName(emptyBooklet(), 'json')).toBe('旅遊手冊.json')
  })
})
