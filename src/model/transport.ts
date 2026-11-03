// 交通方式：表單欄位名稱、產生前要檢查哪些欄位、網站上用的圖示都跟著交通方式變

import type { Flight, TransportMode } from './booklet'

export interface TransportInfo {
  id: TransportMode
  label: string
  icon: string // 網站範本的圖示（src/site/templates/common/icons.ts）
  carrier: string // airline 欄位的名稱；空字串表示這種交通方式不用填
  number: string // flightNo 欄位的名稱；空字串表示不用填
  numberHint: string
  from: string
  to: string
  departTime: string
  arriveTime: string
  departWord: string // 網站上「08:00 起飛」的動詞
  required: { carrier: boolean; number: boolean; times: boolean } // 產生前沒填會提醒的欄位
}

const ground = { from: '出發站', to: '抵達站', departTime: '出發時間', arriveTime: '抵達時間', departWord: '出發' }

export const TRANSPORTS: TransportInfo[] = [
  {
    id: 'plane',
    label: '飛機',
    icon: 'plane',
    carrier: '航空公司',
    number: '班機',
    numberHint: '例：CI152',
    from: '起飛地',
    to: '抵達地',
    departTime: '起飛時間',
    arriveTime: '抵達時間',
    departWord: '起飛',
    required: { carrier: true, number: true, times: true },
  },
  // 高鐵只有一家，不用填業者
  { id: 'hsr', label: '高鐵', icon: 'train', carrier: '', number: '車次', numberHint: '例：0603', ...ground, required: { carrier: false, number: true, times: true } },
  { id: 'train', label: '火車', icon: 'train', carrier: '車種', number: '車次', numberHint: '例：自強 152', ...ground, required: { carrier: false, number: true, times: true } },
  { id: 'bus', label: '客運', icon: 'bus', carrier: '客運公司', number: '班次', numberHint: '例：1610', ...ground, from: '上車站', to: '下車站', required: { carrier: false, number: false, times: true } },
  { id: 'ship', label: '船', icon: 'ship', carrier: '船公司', number: '班次', numberHint: '', ...ground, from: '出發港', to: '抵達港', required: { carrier: false, number: false, times: true } },
  // 自駕：沒有業者和班次，時間是自己估的，不提醒
  { id: 'car', label: '自駕', icon: 'car', carrier: '', number: '', numberHint: '', ...ground, from: '出發地', to: '目的地', required: { carrier: false, number: false, times: false } },
  { id: 'other', label: '其他', icon: 'route', carrier: '業者', number: '班次', numberHint: '', ...ground, from: '出發地', to: '抵達地', required: { carrier: false, number: false, times: true } },
]

export const transportOf = (mode: TransportMode): TransportInfo => TRANSPORTS.find((t) => t.id === mode) ?? TRANSPORTS[0]

export const isTransportMode = (v: unknown): v is TransportMode => TRANSPORTS.some((t) => t.id === v)

/** 全部都是飛機（或還沒有交通）：手冊沿用「航班」的叫法 */
export const onlyFlights = (flights: Pick<Flight, 'mode'>[]): boolean => flights.every((f) => f.mode === 'plane')

const minutesOf = (hhmm: string): number | null => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** 抵達時間比出發時間早：當成隔天抵達 */
export const arrivesNextDay = (f: Pick<Flight, 'departTime' | 'arriveTime'>): boolean =>
  !!f.departTime && !!f.arriveTime && f.arriveTime < f.departTime

/**
 * 交通花多久（分鐘）；時間沒填齊時是 null。
 * 飛機的時間是兩地各自的當地時間，要知道兩地差幾小時才算得準：offsetMinutes 是抵達地比出發地快幾分鐘，不知道時傳 null
 */
export function travelMinutes(f: Pick<Flight, 'mode' | 'departTime' | 'arriveTime'>, offsetMinutes: number | null = 0): number | null {
  const depart = minutesOf(f.departTime)
  const arrive = minutesOf(f.arriveTime)
  if (depart === null || arrive === null || offsetMinutes === null) return null
  let span = arrive - depart - offsetMinutes
  if (arrivesNextDay(f)) span += 24 * 60
  return span > 0 ? span : null
}

/** 1 小時 45 分、45 分、2 小時 */
export function durationText(minutes: number | null): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return [h && `${h} 小時`, m && `${m} 分`].filter(Boolean).join(' ')
}
