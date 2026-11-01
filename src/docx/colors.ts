// 換色：改寫佈景主題的強調色，並同步文件裡套用佈景主題色彩的備用 RGB 值。
// Word 開檔時會依佈景主題重新計算顏色；同步備用值是為了讓其他軟體（LibreOffice 等）也顯示正確。

import type { AccentSlot } from '../model/booklet'

export type Palette = Record<AccentSlot, string> // 值為 #RRGGBB 或 RRGGBB

const FIXED: Record<string, string> = { text1: '000000', background1: 'FFFFFF', dark1: '000000', light1: 'FFFFFF' }

function norm(hex: string): string {
  return hex.replace('#', '').toUpperCase()
}

export function setThemeColors(themeXml: string, palette: Palette): string {
  let xml = themeXml
  for (const [slot, hex] of Object.entries(palette)) {
    xml = xml.replace(
      new RegExp(`(<a:${slot}>)<a:(?:srgbClr|sysClr)[^>]*/>`),
      `$1<a:srgbClr val="${norm(hex)}"/>`,
    )
  }
  return xml
}

function rgbToHsl(hex: string): [number, number, number] {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function hslToRgb(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
  }
  return [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

// Word 的 themeTint／themeShade（十六進位 00–FF）：較淺 L' = L·t + (1 − t)，較深 L' = L·s
export function applyTintShade(hex: string, tint?: string, shade?: string): string {
  if (!tint && !shade) return hex
  const [h, s, l] = rgbToHsl(hex)
  let nl = l
  if (tint) nl = l * (parseInt(tint, 16) / 255) + (1 - parseInt(tint, 16) / 255)
  if (shade) nl = nl * (parseInt(shade, 16) / 255)
  return hslToRgb(h, s, nl)
}

function attr(tag: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1]
}

function setAttr(tag: string, name: string, value: string): string {
  return tag.replace(new RegExp(`\\b${name}="[^"]*"`), `${name}="${value}"`)
}

// 同步 w:color / 框線 / w:shd 上的備用 RGB 值
export function syncThemedColors(xml: string, palette: Palette): string {
  const resolve = (theme: string | undefined): string | undefined =>
    theme === undefined ? undefined : theme in palette ? norm(palette[theme as AccentSlot]) : FIXED[theme]

  return xml.replace(/<w:(color|top|left|bottom|right|insideH|insideV|start|end|shd)\b[^>]*>/g, (tag, name) => {
    let out = tag
    if (name === 'color') {
      const base = resolve(attr(tag, 'w:themeColor'))
      if (base) out = setAttr(out, 'w:val', applyTintShade(base, attr(tag, 'w:themeTint'), attr(tag, 'w:themeShade')))
      return out
    }
    const lineBase = resolve(attr(tag, 'w:themeColor'))
    if (lineBase)
      out = setAttr(out, 'w:color', applyTintShade(lineBase, attr(tag, 'w:themeTint'), attr(tag, 'w:themeShade')))
    if (name === 'shd') {
      const fillBase = resolve(attr(tag, 'w:themeFill'))
      if (fillBase)
        out = setAttr(out, 'w:fill', applyTintShade(fillBase, attr(tag, 'w:themeFillTint'), attr(tag, 'w:themeFillShade')))
    }
    return out
  })
}
