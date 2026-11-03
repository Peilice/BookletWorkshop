// 工作台右邊的成品預覽、風格縮圖：用真正的網站範本畫出來，但字型直接連 Google Fonts，不像輸出時那樣內嵌

import type { Booklet, PaletteColors, TemplateManifest } from '../model/booklet'
import { isUntouchedChecklist, isUntouchedInfo } from '../model/defaults'
import { osakaKyoto } from '../model/sample'
import { renderSite, siteTemplate } from './build'
import { toSiteData } from './siteData'

const fontUrl = (family: string, weights: number[]) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights.join(';')}&display=swap`

/** 還沒填任何內容：預覽和縮圖先用範例行程示意 */
export function isBlankBooklet(b: Booklet): boolean {
  return (
    !b.title.trim() &&
    !b.flights.length &&
    !b.days.length &&
    !b.hotels.length &&
    !b.foods.length &&
    (!b.checklist.length || isUntouchedChecklist(b.checklist)) &&
    b.infos.every(isUntouchedInfo)
  )
}

export function previewBooklet(b: Booklet): Booklet {
  return isBlankBooklet(b) ? osakaKyoto : b
}

export function renderPreview(booklet: Booklet, manifest: TemplateManifest, colors: PaletteColors, print = false): string {
  const site = manifest.site!
  const fontCss = siteTemplate(site)
    .fonts.map((f) => `@import url('${fontUrl(f.family, f.weights)}');`)
    .join('\n')
  const html = renderSite(site, toSiteData(booklet, manifest, colors), { fontCss, print })
  // 預覽裡不改網址的 #（分頁腳本會用 replaceState 記錄目前分頁）
  return html.replace('<head>', '<head><script>history.replaceState = function () {}<\/script>')
}
