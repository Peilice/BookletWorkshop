// 復古日本旅行誌（昭和）：牛皮紙底、紅色粗黑體大標、郵票與印章、報紙式分欄

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { dateW, renderBasic } from '../common/basic'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#e9dcbb',
    headerTop: '<p class="issue" aria-hidden="true"><b>旅</b><span>特集</span></p>',
    dayHead: (day, data) => `${when(!data.singleDay, () => `<b class="day-n num"><small>第</small>${day.n}<small>日</small></b>`)}
      <span class="num stampdate">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
  })
