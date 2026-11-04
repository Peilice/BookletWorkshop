// 網站範本清單；範本設定檔（public/templates/*.json）的 site 欄位對應這裡的 id

import * as catalog from './catalog/render'
import * as classic from './classic/render'
import * as diary from './diary/render'
import * as editorial from './editorial/render'
import * as jpmag from './jpmag/render'
import * as mono from './mono/render'
import * as night from './night/render'
import * as outdoor from './outdoor/render'
import * as paper from './paper/render'
import * as poster from './poster/render'
import * as route from './route/render'
import * as season from './season/render'
import * as showa from './showa/render'
import * as ticket from './ticket/render'
import * as timeline from './timeline/render'
import type { SiteTemplate } from './types'
import * as wafu from './wafu/render'
import * as zukan from './zukan/render'

export const SITE_TEMPLATES: Record<string, SiteTemplate> = {
  season: {
    render: season.render,
    fonts: [{ family: 'Zen Maru Gothic', weights: [700, 900], text: season.displayText }],
  },
  // 原範本用的華康字型不能內嵌在網頁，改用風格接近的免費字型：芫荽（手寫感）、粉圓（圓體）
  classic: {
    render: classic.render,
    fonts: [
      { family: 'Iansui', weights: [400], text: classic.bodyText },
      { family: 'Huninn', weights: [400], text: classic.boxText },
    ],
  },
  // 和風直排原本用微軟正黑體，網站直接用系統黑體
  wafu: { render: wafu.render, fonts: [] },
  // 以下是單欄捲動式範本（common/basic.ts），除了海報雜誌和手帳拼貼各用一款字型，其餘用系統黑體
  mono: { render: mono.render, fonts: [] },
  poster: { render: poster.render, fonts: [{ family: 'Anton', weights: [400], text: poster.numText }] },
  timeline: { render: timeline.render, fonts: [] },
  ticket: { render: ticket.render, fonts: [] },
  diary: { render: diary.render, fonts: [{ family: 'Iansui', weights: [400], text: diary.bodyText }] },
  route: { render: route.render, fonts: [] },
  night: { render: night.render, fonts: [] },
  outdoor: { render: outdoor.render, fonts: [] },
  // 依參考圖做的 6 份風格範本，全部用系統字型
  jpmag: { render: jpmag.render, fonts: [] },
  paper: { render: paper.render, fonts: [] },
  editorial: { render: editorial.render, fonts: [] },
  zukan: { render: zukan.render, fonts: [] },
  showa: { render: showa.render, fonts: [] },
  catalog: { render: catalog.render, fonts: [] },
}
