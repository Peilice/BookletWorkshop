// 網站範本的日色：配色的 6 個顏色當色階，依天數內插出每天的顏色，再推出深色和淡色

import { contrastRatio } from '../model/contrast'
import type { AccentSlot, PaletteColors } from '../model/booklet'

export interface DayColor {
  chip: string // 日期按鈕、整條色階
  deep: string // 頁首、按鈕、編號徽章（上面放白字）
  soft: string // 淡底塊
}

const SLOTS: AccentSlot[] = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6']

type Rgb = [number, number, number]

function toRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

/** a 往 b 移動 t（0–1） */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [toRgb(a), toRgb(b)]
  return toHex(x.map((c, i) => c + (y[i] - c) * t) as Rgb)
}

/** 色階上第 i 天（共 n 天）的顏色：第一天是第一色，最後一天是最後一色，中間平均內插 */
function scaleAt(stops: string[], i: number, n: number): string {
  if (n <= 1) return stops[0]
  const pos = (i / (n - 1)) * (stops.length - 1)
  const lo = Math.floor(pos)
  if (lo >= stops.length - 1) return stops[stops.length - 1]
  return mix(stops[lo], stops[lo + 1], pos - lo)
}

export function dayColor(chip: string): DayColor {
  // 深色至少要能放白字；配色太淺時多壓暗一點
  let deep = mix(chip, '#000000', 0.17)
  for (let t = 0.3; contrastRatio(deep, '#FFFFFF') < 4.5 && t < 0.9; t += 0.1) deep = mix(chip, '#000000', t)
  return { chip: chip.toUpperCase(), deep, soft: mix(chip, '#FFFFFF', 0.88) }
}

/** n 天各自的日色；沒有任何一天時也回傳一組，給頁首用 */
export function dayColors(palette: PaletteColors, n: number): DayColor[] {
  const stops = SLOTS.map((s) => palette[s])
  return Array.from({ length: Math.max(n, 1) }, (_, i) => dayColor(scaleAt(stops, i, Math.max(n, 1))))
}
