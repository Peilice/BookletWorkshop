// 極簡高級手冊：MUJI／飯店型錄感，Day 是字距拉開的小標，景點用 01、02 編號，細字、大量留白

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { dateW, renderBasic } from '../common/basic'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#f8f6f1',
    dayHead: (day, data) => `${when(!data.singleDay, () => `<b class="day-n num">DAY ${String(day.n).padStart(2, '0')}</b>`)}
      <span class="num date">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
    route: (day) => `<p class="route-line">${esc(day.route.join(' ・ '))}</p>`,
  })
