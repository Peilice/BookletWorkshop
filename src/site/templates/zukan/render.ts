// 日式旅行圖鑑：分類標籤、圖示列、羅盤；景點、美食、資訊各用一個分類色，排成卡片格

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { dateW, renderBasic } from '../common/basic'
import { icon } from '../common/icons'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#f6f1e4',
    vars: (data) => `--accent:${data.palette.accent1};--c1:${data.palette.accent1};--c2:${data.palette.accent2};--c3:${data.palette.accent3}`,
    headerTop: `<svg class="compass" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="26" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M32 10l6 24-6 24-6-24z" fill="currentColor" opacity=".75"/><path d="M8 34l24-6 24 6-24 6z" fill="none" stroke="currentColor" stroke-width="1"/><text x="32" y="8" font-size="8" text-anchor="middle" fill="currentColor">N</text></svg>
  <ul class="kinds" aria-hidden="true"><li class="k1">${icon('pin')}景點</li><li class="k2">${icon('pin')}美食</li><li class="k3">${icon('pin')}住宿</li><li class="k3">${icon('pin')}資訊</li></ul>`,
    order: ['days', 'foods', 'hotels', 'info', 'flights', 'checklist'],
    dayHead: (day, data) => `${when(!data.singleDay, () => `<b class="day-n num">DAY ${day.n}</b>`)}
      <span class="num">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
  })
