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
    // 路線是當天依序去的地點；還沒填景點時，退回用大標的各段
    route: (day) => {
      const names = day.spots.map((s) => s.name).filter(Boolean)
      return `<ol class="stops" aria-label="今天的路線">${(names.length ? names : day.route).map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`
    },
  })
