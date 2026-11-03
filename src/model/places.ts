// 內建的機場、航空公司、車站：輸入時給建議、從班機代碼帶出航空公司、從機場時區算時差和飛行時間
// 只收台灣出發常去的地方，查不到時一律不帶入、不計算

import type { Booklet, Flight, TransportMode } from './booklet'

export interface Airport {
  code: string // IATA 代碼
  name: string // 填進表單的名稱，跟範例資料的寫法一樣（高雄、大阪關西）
  country: string
  tz: string // IANA 時區
  aliases?: string[]
}

const a = (code: string, name: string, country: string, tz: string, ...aliases: string[]): Airport => ({ code, name, country, tz, aliases })

const TW = (code: string, name: string, ...aliases: string[]) => a(code, name, '台灣', 'Asia/Taipei', ...aliases)
const JP = (code: string, name: string, ...aliases: string[]) => a(code, name, '日本', 'Asia/Tokyo', ...aliases)
const KR = (code: string, name: string, ...aliases: string[]) => a(code, name, '韓國', 'Asia/Seoul', ...aliases)

export const AIRPORTS: Airport[] = [
  TW('TPE', '台北桃園', '桃園'),
  TW('TSA', '台北松山', '松山', '松山機場'),
  TW('KHH', '高雄', '高雄小港', '小港'),
  TW('RMQ', '台中', '台中清泉崗', '清泉崗'),
  TW('TNN', '台南'),
  TW('HUN', '花蓮'),
  TW('TTT', '台東'),
  TW('MZG', '澎湖', '馬公'),
  TW('KNH', '金門'),
  TW('LZN', '馬祖南竿', '南竿'),
  JP('NRT', '東京成田', '成田'),
  JP('HND', '東京羽田', '羽田'),
  JP('KIX', '大阪關西', '關西'),
  JP('ITM', '大阪伊丹', '伊丹'),
  JP('NGO', '名古屋中部', '名古屋', '中部'),
  JP('FUK', '福岡'),
  JP('CTS', '札幌新千歲', '新千歲', '札幌'),
  JP('OKA', '沖繩那霸', '那霸', '沖繩'),
  JP('KMJ', '熊本'),
  JP('KOJ', '鹿兒島'),
  JP('KMI', '宮崎'),
  JP('NGS', '長崎'),
  JP('OIT', '大分'),
  JP('HSG', '佐賀'),
  JP('KKJ', '北九州'),
  JP('HIJ', '廣島'),
  JP('OKJ', '岡山'),
  JP('TAK', '高松'),
  JP('MYJ', '松山（愛媛）', '愛媛'),
  JP('YGJ', '米子'),
  JP('KMQ', '小松'),
  JP('TOY', '富山'),
  JP('KIJ', '新潟'),
  JP('SDJ', '仙台'),
  JP('HNA', '花卷'),
  JP('AOJ', '青森'),
  JP('HKD', '函館'),
  JP('AKJ', '旭川'),
  JP('IBR', '茨城'),
  JP('FSZ', '靜岡'),
  JP('ISG', '石垣'),
  JP('MMY', '宮古'),
  JP('SHI', '下地島'),
  KR('ICN', '首爾仁川', '仁川', '首爾'),
  KR('GMP', '首爾金浦', '金浦'),
  KR('PUS', '釜山'),
  KR('CJU', '濟州'),
  KR('TAE', '大邱'),
  a('HKG', '香港', '香港', 'Asia/Hong_Kong'),
  a('MFM', '澳門', '澳門', 'Asia/Macau'),
  a('PVG', '上海浦東', '中國', 'Asia/Shanghai', '浦東'),
  a('SHA', '上海虹橋', '中國', 'Asia/Shanghai', '虹橋'),
  a('PEK', '北京首都', '中國', 'Asia/Shanghai'),
  a('PKX', '北京大興', '中國', 'Asia/Shanghai'),
  a('CAN', '廣州', '中國', 'Asia/Shanghai'),
  a('SZX', '深圳', '中國', 'Asia/Shanghai'),
  a('XMN', '廈門', '中國', 'Asia/Shanghai'),
  a('SIN', '新加坡', '新加坡', 'Asia/Singapore', '樟宜'),
  a('BKK', '曼谷蘇凡納布', '泰國', 'Asia/Bangkok', '蘇凡納布'),
  a('DMK', '曼谷廊曼', '泰國', 'Asia/Bangkok', '廊曼'),
  a('CNX', '清邁', '泰國', 'Asia/Bangkok'),
  a('HKT', '普吉', '泰國', 'Asia/Bangkok', '普吉島'),
  a('SGN', '胡志明市', '越南', 'Asia/Ho_Chi_Minh'),
  a('HAN', '河內', '越南', 'Asia/Ho_Chi_Minh'),
  a('DAD', '峴港', '越南', 'Asia/Ho_Chi_Minh'),
  a('MNL', '馬尼拉', '菲律賓', 'Asia/Manila'),
  a('CEB', '宿霧', '菲律賓', 'Asia/Manila'),
  a('KUL', '吉隆坡', '馬來西亞', 'Asia/Kuala_Lumpur'),
  a('BKI', '亞庇', '馬來西亞', 'Asia/Kuching'),
  a('PEN', '檳城', '馬來西亞', 'Asia/Kuala_Lumpur'),
  a('DPS', '峇里島', '印尼', 'Asia/Makassar', '峇里'),
  a('CGK', '雅加達', '印尼', 'Asia/Jakarta'),
  a('GUM', '關島', '關島', 'Pacific/Guam'),
  a('ROR', '帛琉', '帛琉', 'Pacific/Palau'),
  a('LAX', '洛杉磯', '美國', 'America/Los_Angeles'),
  a('SFO', '舊金山', '美國', 'America/Los_Angeles'),
  a('SEA', '西雅圖', '美國', 'America/Los_Angeles'),
  a('JFK', '紐約甘迺迪', '美國', 'America/New_York', '紐約'),
  a('HNL', '檀香山', '美國', 'Pacific/Honolulu', '夏威夷'),
  a('YVR', '溫哥華', '加拿大', 'America/Vancouver'),
  a('LHR', '倫敦希斯洛', '英國', 'Europe/London', '倫敦'),
  a('CDG', '巴黎戴高樂', '法國', 'Europe/Paris', '巴黎'),
  a('FRA', '法蘭克福', '德國', 'Europe/Berlin'),
  a('MUC', '慕尼黑', '德國', 'Europe/Berlin'),
  a('AMS', '阿姆斯特丹', '荷蘭', 'Europe/Amsterdam'),
  a('VIE', '維也納', '奧地利', 'Europe/Vienna'),
  a('FCO', '羅馬', '義大利', 'Europe/Rome'),
  a('MXP', '米蘭', '義大利', 'Europe/Rome'),
  a('PRG', '布拉格', '捷克', 'Europe/Prague'),
  a('IST', '伊斯坦堡', '土耳其', 'Europe/Istanbul'),
  a('DXB', '杜拜', '阿聯', 'Asia/Dubai'),
  a('DOH', '杜哈', '卡達', 'Asia/Qatar'),
  a('SYD', '雪梨', '澳洲', 'Australia/Sydney'),
  a('MEL', '墨爾本', '澳洲', 'Australia/Melbourne'),
  a('BNE', '布里斯本', '澳洲', 'Australia/Brisbane'),
  a('AKL', '奧克蘭', '紐西蘭', 'Pacific/Auckland'),
]

/** 填的地名可能對到哪些機場：代碼、名稱、別名，或只寫城市（東京、大阪） */
export function airportsOf(text: string): Airport[] {
  const t = text.trim()
  if (!t) return []
  const code = AIRPORTS.find((p) => p.code === t.toUpperCase())
  if (code) return [code]
  const exact = AIRPORTS.filter((p) => p.name === t || p.aliases?.includes(t))
  if (exact.length) return exact
  return AIRPORTS.filter((p) => p.name.startsWith(t))
}

/** 地名對到的機場都在同一個時區時才回傳（台北 → 桃園、松山都是台北時間） */
function airportZone(text: string): Airport | null {
  const found = airportsOf(text)
  return found.length && found.every((p) => p.tz === found[0].tz && p.country === found[0].country) ? found[0] : null
}

/** 輸入的是機場代碼時換成名稱（KIX → 大阪關西），其他照原樣 */
export function airportName(text: string): string {
  const code = AIRPORTS.find((p) => p.code === text.trim().toUpperCase())
  return code ? code.name : text
}

/** 某個時區在那一天比 UTC 快幾分鐘（跟著日光節約時間變） */
function utcOffset(tz: string, date: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const when = m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : Date.now()
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(when)
      .find((p) => p.type === 'timeZoneName')?.value
    const o = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(name ?? '')
    if (!o) return null
    return o[1] ? (o[1] === '-' ? -1 : 1) * (Number(o[2]) * 60 + Number(o[3])) : 0
  } catch {
    return null
  }
}

/** 飛機抵達地比出發地快幾分鐘；有一邊對不到機場時是 null */
export function flightOffset(f: Pick<Flight, 'from' | 'to' | 'date'>): number | null {
  const from = airportZone(f.from)
  const to = airportZone(f.to)
  if (!from || !to) return null
  const a = utcOffset(from.tz, f.date)
  const b = utcOffset(to.tz, f.date)
  return a === null || b === null ? null : b - a
}

/** 旅遊資訊「時差」的建議內容，例如「日本比台灣快 1 小時」；用第一段飛機算，算不出來時空白 */
export function timeDifferenceText(flights: Flight[]): string {
  const f = flights.find((x) => x.mode === 'plane' && airportZone(x.from) && airportZone(x.to))
  if (!f) return ''
  const home = airportZone(f.from)!
  const away = airportZone(f.to)!
  const diff = flightOffset(f)
  if (diff === null || home.country === away.country) return ''
  if (diff === 0) return `${away.country}和${home.country}沒有時差`
  const h = Math.floor(Math.abs(diff) / 60)
  const m = Math.abs(diff) % 60
  const span = [h && `${h} 小時`, m && `${m} 分`].filter(Boolean).join(' ')
  return `${away.country}比${home.country}${diff > 0 ? '快' : '慢'} ${span}`
}

// 班機代碼前兩碼對到的航空公司
const AIRLINES: Record<string, string> = {
  CI: '中華航空', BR: '長榮航空', JX: '星宇航空', IT: '台灣虎航', AE: '華信航空', B7: '立榮航空',
  JL: '日本航空', NH: '全日空', MM: '樂桃航空', GK: '捷星日本', ZG: 'ZIPAIR', BC: '天馬航空',
  KE: '大韓航空', OZ: '韓亞航空', '7C': '濟州航空', TW: '德威航空', LJ: '真航空', ZE: '易斯達航空',
  CX: '國泰航空', UO: '香港快運', HX: '香港航空', NX: '澳門航空',
  CA: '中國國際航空', MU: '中國東方航空', CZ: '中國南方航空', MF: '廈門航空',
  SQ: '新加坡航空', TR: '酷航', TG: '泰國航空', FD: '泰國亞洲航空', VZ: '泰國越捷航空',
  VN: '越南航空', VJ: '越捷航空', PR: '菲律賓航空', '5J': '宿霧太平洋航空', Z2: '菲律賓亞洲航空',
  MH: '馬來西亞航空', AK: '亞洲航空', D7: '全亞洲航空', GA: '印尼航空',
  UA: '聯合航空', AA: '美國航空', DL: '達美航空', AC: '加拿大航空',
  KL: '荷蘭皇家航空', AF: '法國航空', LH: '漢莎航空', BA: '英國航空', TK: '土耳其航空',
  EK: '阿聯酋航空', QR: '卡達航空', QF: '澳洲航空', NZ: '紐西蘭航空',
}

/** 從班機代碼找航空公司（CI152 → 中華航空）；找不到時空白 */
export function airlineOf(flightNo: string): string {
  const m = /^([A-Z0-9]{2})\s*\d/.exec(flightNo.trim().toUpperCase())
  return (m && AIRLINES[m[1]]) ?? ''
}

const HSR_STATIONS = ['南港', '台北', '板橋', '桃園', '新竹', '苗栗', '台中', '彰化', '雲林', '嘉義', '台南', '左營']

const TRA_STATIONS = [
  '基隆', '七堵', '汐止', '南港', '松山', '台北', '萬華', '板橋', '樹林', '鶯歌', '桃園', '中壢', '楊梅', '新竹', '竹北',
  '竹南', '苗栗', '豐原', '台中', '新烏日', '彰化', '員林', '二水', '斗六', '嘉義', '新營', '台南', '岡山', '新左營', '高雄',
  '鳳山', '屏東', '潮州', '枋寮', '台東', '知本', '池上', '關山', '玉里', '瑞穗', '花蓮', '新城', '蘇澳新', '羅東', '宜蘭',
  '礁溪', '頭城', '福隆', '瑞芳', '十分', '平溪', '集集', '車埕', '內灣',
]

/** 起訖地輸入時的建議：value 是填進去的字，label 是旁邊的小字 */
export function stopSuggestions(mode: TransportMode): { value: string; label: string }[] {
  if (mode === 'plane') return AIRPORTS.map((p) => ({ value: p.name, label: p.code }))
  if (mode === 'hsr') return HSR_STATIONS.map((s) => ({ value: s, label: '高鐵' }))
  if (mode === 'train') return TRA_STATIONS.map((s) => ({ value: s, label: '台鐵' }))
  return []
}

/** 手冊裡已經打過的地名（交通起訖、住宿城市、美食地點），給地點、城市欄位選 */
export function knownPlaces(b: Pick<Booklet, 'flights' | 'hotels' | 'foods'>): string[] {
  const names = [...b.flights.flatMap((f) => [f.from, f.to]), ...b.hotels.map((h) => h.city), ...b.foods.map((f) => f.place)]
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))]
}
