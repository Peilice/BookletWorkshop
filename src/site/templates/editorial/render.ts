// Editorial 雜誌：非對稱版面；Day 標頭是細字大數字加直排小字，景點交錯縮排，頁首右側直排標題

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { dateW, renderBasic } from '../common/basic'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#fdfcf9',
    headerTop: `<p class="vert" aria-hidden="true">${esc(d.title)}</p>`,
    dayHead: (day, data) => `${when(!data.singleDay, () => `<span class="vday num" aria-hidden="true">DAY</span><b class="day-n num" aria-label="第 ${day.n} 天">${String(day.n).padStart(2, '0')}</b>`)}
      <span class="num date">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
  })
