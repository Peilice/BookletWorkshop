// 自然戶外：大地色與山形，行前清單（裝備）放在最前面當主角

import type { SiteData } from '../../siteData'
import { renderBasic } from '../common/basic'
import type { RenderOptions } from '../types'
import css from './style.css?raw'

export const render = (d: SiteData, opts: RenderOptions) =>
  renderBasic(d, opts, {
    css,
    themeColor: '#eef0e4',
    order: ['checklist', 'days', 'flights', 'hotels', 'foods', 'info'],
    vars: (data) => `--accent:${data.palette.accent1};--accent2:${data.palette.accent2}`,
  })
