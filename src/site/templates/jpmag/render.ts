// 日系旅遊雜誌：米白底、大量留白、細線；Day 是細字大標，路線用細線串起，景點資訊靠右排小字

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { renderBasic } from '../common/basic'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

const mmdd = (iso: string, fallback: string) => (iso ? iso.slice(5).replace('-', '.') : fallback)

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#fbf8f1',
    headerTop: '<p class="mag-tag num">Good trip, good life.</p>',
    dayHead: (day, data) => `${when(!data.singleDay, () => `<small class="chap num">Chapter ${String(day.n).padStart(2, '0')}</small>`)}
      <b class="day-n num">${data.singleDay ? esc(mmdd(day.iso, day.date)) : `Day ${day.n}<i> / ${esc(mmdd(day.iso, day.date))}</i>`}</b>
      ${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
    route: (day) => `<ol class="thread" aria-label="今天的路線">${day.route.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`,
  })
