// 地圖導覽：每天頂端用一條路線串起當天的地點，景點用編號圓點

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { dateW, renderBasic } from '../common/basic'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#f4f1ea',
    dayHead: (day, data) => `${when(!data.singleDay, () => `<b class="day-n num">Day ${day.n}</b>`)}
      <span class="num">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
    route: (day) => `<ol class="stops" aria-label="今天的路線">${day.route.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`,
  })
