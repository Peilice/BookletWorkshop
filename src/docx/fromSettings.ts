// 依目前的手冊與設定產生 Word：讀取範本、決定配色與字體

import type { Booklet, Settings, TemplateManifest } from '../model/booklet'
import { toTemplateData } from '../transform/templateData'
import { generateDocx } from './generate'

const templateBase = `${import.meta.env.BASE_URL}templates/`

async function fetchOk(url: string): Promise<Response> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`無法讀取範本（${res.status}）`)
  return res
}

export async function generateFromSettings(booklet: Booklet, settings: Settings): Promise<Uint8Array> {
  const manifest: TemplateManifest = await (await fetchOk(`${templateBase}${settings.templateId}.json`)).json()
  const template = await (await fetchOk(`${templateBase}${manifest.file}`)).arrayBuffer()
  return generateDocx(template, {
    data: toTemplateData(booklet, manifest),
    palette: settings.palette ?? manifest.presets[0].colors,
    fonts: Object.fromEntries(manifest.fontRoles.map((r) => [r.style, settings.fonts[r.style] || r.default])),
  })
}
