// 網站範本清單；範本設定檔（public/templates/*.json）的 site 欄位對應這裡的 id

import { displayText, render } from './season/render'
import type { SiteTemplate } from './types'

export const SITE_TEMPLATES: Record<string, SiteTemplate> = {
  season: {
    render,
    font: { family: 'Zen Maru Gothic', weights: [700, 900], text: displayText },
  },
}
