// 網站範本清單；範本設定檔（public/templates/*.json）的 site 欄位對應這裡的 id

import * as classic from './classic/render'
import * as season from './season/render'
import type { SiteTemplate } from './types'
import * as wafu from './wafu/render'

export const SITE_TEMPLATES: Record<string, SiteTemplate> = {
  season: {
    render: season.render,
    fonts: [{ family: 'Zen Maru Gothic', weights: [700, 900], text: season.displayText }],
  },
  // Word 範本用的華康字型不能內嵌在網頁，改用風格接近的免費字型：芫荽（手寫感）、粉圓（圓體）
  classic: {
    render: classic.render,
    fonts: [
      { family: 'Iansui', weights: [400], text: classic.bodyText },
      { family: 'Huninn', weights: [400], text: classic.boxText },
    ],
  },
  // 和風直排的 Word 範本用微軟正黑體，網站直接用系統黑體
  wafu: { render: wafu.render, fonts: [] },
}
