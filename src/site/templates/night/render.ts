// 暗色夜間：深色底、霓虹點色，夜裡看手機不刺眼。列印時改回白底

import { esc } from '../../html'
import type { SiteData } from '../../siteData'
import { renderBasic } from '../common/basic'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#12141c',
    vars: (data) => `--accent:${data.palette.accent1};--accent2:${data.palette.accent2}`,
    route: (day) => `<ul class="pills" aria-label="今天的路線">${day.route.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`,
  })
