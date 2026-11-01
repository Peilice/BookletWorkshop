import { describe, expect, it } from 'vitest'
import { applyTintShade, setThemeColors, syncThemedColors, type Palette } from './colors'

const palette: Palette = {
  accent1: '#1F4E79',
  accent2: '#1F4E79',
  accent3: '#C55A11',
  accent4: '#C55A11',
  accent5: '#2E8B57',
  accent6: '#2E8B57',
}

describe('applyTintShade', () => {
  it('沒有較淺／較深時原色不變', () => {
    expect(applyTintShade('BC003F')).toBe('BC003F')
  })

  it('較淺 60%（themeTint 66）和 Word 實際畫出來的顏色一致', () => {
    expect(applyTintShade('BC003F', '66')).toBe('FF7EA9')
  })

  it('較深 50%（themeShade 80）', () => {
    expect(applyTintShade('FFFFFF', undefined, '80')).toBe('808080')
  })
})

describe('setThemeColors', () => {
  it('替換強調色', () => {
    const xml = '<a:accent1><a:srgbClr val="5F6B57"/></a:accent1><a:accent3><a:srgbClr val="4F6228"/></a:accent3>'
    expect(setThemeColors(xml, palette)).toBe(
      '<a:accent1><a:srgbClr val="1F4E79"/></a:accent1><a:accent3><a:srgbClr val="C55A11"/></a:accent3>',
    )
  })
})

describe('syncThemedColors', () => {
  it('同步文字、框線、網底的備用 RGB 值', () => {
    const xml = [
      '<w:color w:val="5F6B57" w:themeColor="accent1"/>',
      '<w:top w:val="single" w:color="FF7EA9" w:themeColor="accent5" w:themeTint="66"/>',
      '<w:shd w:val="clear" w:color="auto" w:fill="800080" w:themeFill="accent6"/>',
      '<w:color w:val="000000" w:themeColor="text1"/>',
    ].join('')
    const out = syncThemedColors(xml, palette)
    expect(out).toContain('<w:color w:val="1F4E79" w:themeColor="accent1"/>')
    expect(out).toContain(`w:color="${applyTintShade('2E8B57', '66')}" w:themeColor="accent5"`)
    expect(out).toContain('w:fill="2E8B57" w:themeFill="accent6"')
    expect(out).toContain('<w:color w:val="000000" w:themeColor="text1"/>')
  })

  it('沒有套用佈景主題色彩的元素不動', () => {
    const xml = '<w:color w:val="123456"/>'
    expect(syncThemedColors(xml, palette)).toBe(xml)
  })
})
