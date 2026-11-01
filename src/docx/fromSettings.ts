// 依目前的手冊與設定產生 Word：讀取範本、決定配色與字體

import type { AccentSlot, Booklet, Settings, TemplateManifest } from '../model/booklet'
import { useTemplates } from '../store/templates'
import { toTemplateData } from '../transform/templateData'
import { generateDocx } from './generate'

/** 實際使用的配色：沒有指定時用範本的第一組預設配色 */
export function effectivePalette(manifest: TemplateManifest, settings: Settings): Record<AccentSlot, string> {
  return settings.palette ?? manifest.presets[0].colors
}

/** 實際使用的字體：沒有填的角色用範本預設字體 */
export function effectiveFonts(manifest: TemplateManifest, settings: Settings): Record<string, string> {
  return Object.fromEntries(manifest.fontRoles.map((r) => [r.style, settings.fonts[r.style]?.trim() || r.default]))
}

export async function generateFromSettings(booklet: Booklet, settings: Settings): Promise<Uint8Array> {
  const { getManifest, getTemplateFile } = useTemplates()
  const manifest = await getManifest(settings.templateId)
  return generateDocx(await getTemplateFile(manifest), {
    data: toTemplateData(booklet, manifest),
    palette: effectivePalette(manifest, settings),
    fonts: effectiveFonts(manifest, settings),
  })
}
