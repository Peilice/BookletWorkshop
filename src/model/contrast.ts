// 文字與底色的對比（WCAG 2 公式）。白字至少要 4.5 才看得清楚

import type { PaletteColors, TemplateManifest } from './booklet'

export const MIN_CONTRAST = 4.5

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** 回傳對比不足的位置（白字放在該顏色上） */
export function lowContrastSpots(
  manifest: TemplateManifest,
  palette: PaletteColors,
): { where: string; ratio: number }[] {
  return manifest.contrastChecks
    .map((c) => ({ where: c.where, ratio: contrastRatio(palette[c.slot], '#FFFFFF') }))
    .filter((c) => c.ratio < MIN_CONTRAST)
}
