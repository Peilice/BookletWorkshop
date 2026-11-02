import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { TemplateManifest } from './booklet'
import { contrastRatio, lowContrastSpots, MIN_CONTRAST, readableOr } from './contrast'

const manifest: TemplateManifest = JSON.parse(
  readFileSync(new URL('../../public/templates/classic.json', import.meta.url), 'utf8'),
)

describe('contrastRatio', () => {
  it('黑白對比是 21', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21)
  })

  it('同色對比是 1', () => {
    expect(contrastRatio('5F6B57', '5F6B57')).toBeCloseTo(1)
  })
})

describe('readableOr', () => {
  it('對比夠時用原本的顏色', () => {
    expect(readableOr('#5F6B57', '#FAF9F5', '#1E1D1A')).toBe('#5F6B57')
  })

  it('顏色太淺時改用備用色', () => {
    expect(readableOr('#F0E68C', '#FAF9F5', '#1E1D1A')).toBe('#1E1D1A')
  })
})

describe('lowContrastSpots', () => {
  it('所有預設配色的白字都看得清楚', () => {
    for (const preset of manifest.presets) {
      expect(lowContrastSpots(manifest, preset.colors), preset.name).toEqual([])
    }
  })

  it('顏色太淺時列出看不清楚的位置', () => {
    const light = { ...manifest.presets[0].colors, accent1: '#F0E68C' }
    const spots = lowContrastSpots(manifest, light)
    expect(spots.map((s) => s.where)).toEqual(['航班表頭的白字'])
    expect(spots[0].ratio).toBeLessThan(MIN_CONTRAST)
  })
})
