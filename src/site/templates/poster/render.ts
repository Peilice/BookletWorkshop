// 海報雜誌：超大 Anton 數字當每天的日期、粗黑標題、墨線分區

import { esc, when } from '../../html'
import type { SiteData } from '../../siteData'
import { basicText, dateW, renderBasic } from '../common/basic'
import { todayTag } from '../common/page'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#faf9f5',
    dayHead: (day, data) => `${when(!data.singleDay, () => `<b class="bignum num" aria-label="第 ${day.n} 天">${String(day.n).padStart(2, '0')}</b>`)}
      <span class="date num">${esc(dateW(day.date, day.weekdayShort))}</span>${todayTag}
      ${when(day.departTime, () => `<span class="num dep">${esc(day.departTime)} 出門</span>`)}`,
  })

export const bodyText = (d: SiteData) => basicText(d)

/** Anton 只用在數字和時間 */
export const numText = () => '0123456789:/.-+–'
