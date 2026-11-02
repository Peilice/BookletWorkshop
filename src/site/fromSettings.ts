// 依目前的手冊與設定產生網站（單一 HTML、zip）與 PDF

import type { Booklet, Settings, TemplateManifest } from '../model/booklet'
import { effectivePalette } from '../docx/fromSettings'
import { bookletFileName } from '../model/fileName'
import { useTemplates } from '../store/templates'
import { siteIcons, printHtml } from './browser'
import { buildSiteZip, renderSite, siteTemplate } from './build'
import { embedGoogleFont } from './fonts'
import { toSiteData, type SiteData } from './siteData'

async function prepare(booklet: Booklet, settings: Settings): Promise<{ manifest: TemplateManifest; data: SiteData; fontCss: string; fontError: boolean }> {
  const manifest = await useTemplates().getManifest(settings.templateId)
  if (!manifest.site) throw new Error(`「${manifest.name}」沒有網站版本`)
  const data = toSiteData(booklet, manifest, effectivePalette(manifest, settings))
  let fontCss = ''
  let fontError = false
  try {
    const css = await Promise.all(siteTemplate(manifest.site).fonts.map((f) => embedGoogleFont(f.family, f.weights, f.text(data))))
    fontCss = css.join('\n')
  } catch {
    fontError = true // 字型下載失敗時改用系統字型，網站照樣能用
  }
  return { manifest, data, fontCss, fontError }
}

export interface SiteResult<T> {
  output: T
  fontError: boolean
}

export async function siteHtmlFromSettings(booklet: Booklet, settings: Settings): Promise<SiteResult<string>> {
  const { manifest, data, fontCss, fontError } = await prepare(booklet, settings)
  return { output: renderSite(manifest.site!, data, { fontCss }), fontError }
}

export async function siteZipFromSettings(booklet: Booklet, settings: Settings): Promise<SiteResult<Uint8Array>> {
  const { manifest, data, fontCss, fontError } = await prepare(booklet, settings)
  return { output: buildSiteZip(manifest.site!, data, { fontCss }, await siteIcons(data)), fontError }
}

export async function printPdfFromSettings(booklet: Booklet, settings: Settings): Promise<SiteResult<void>> {
  const { manifest, data, fontCss, fontError } = await prepare(booklet, settings)
  const title = bookletFileName(booklet, 'pdf').replace(/\.pdf$/, '')
  const html = renderSite(manifest.site!, data, { fontCss, print: true, documentTitle: title })
  await printHtml(html, title)
  return { output: undefined, fontError }
}
